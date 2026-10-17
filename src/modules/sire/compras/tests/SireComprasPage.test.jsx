import React from "react";
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import SireComprasPage from "../pages/SireComprasPage";


function renderPropuesta() {
  const view = render(<SireComprasPage />);
  fireEvent.click(screen.getByRole('tab', { name: 'Propuesta SUNAT' }));
  return view;
}

const mockExportar = jest.fn();
jest.mock("../services/exportarCompras", () => ({ exportarCompras: (...args) => mockExportar(...args) }));

let mockParams = {};
const mockNavigate = jest.fn();
jest.mock("axios", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }));
jest.mock("react-router-dom", () => ({ useParams: () => mockParams, useNavigate: () => mockNavigate }));
jest.mock("@auth0/auth0-react", () => ({ useAuth0: () => ({ isAuthenticated: true }) }));
jest.mock("react-data-table-component", () => ({ __esModule: true, default: ({ data }) => <div data-testid="registros">{data.map((r, i) => <span key={i}>{r.proveedor}</span>)}</div> }));
const estado = (ticket = 'COMPRA1') => ({ success: true, ticket, fecha_generacion: null, propuesta: null, sistema: [], comparacion: [] });
const getNormal = url => {
  if (url.includes('/usuario/periodos/')) return Promise.resolve({ data: [{ periodo: '2026-09' }] });
  if (url.includes('/usuario/contabilidades/')) return Promise.resolve({ data: [{ documento_id: '20123456789', razon_social: 'EMPRESA' }] });
  return Promise.resolve({ data: estado() });
};
beforeEach(() => {
  jest.resetAllMocks();
  mockParams = { id_anfitrion: 'anfitrion.largo@example.com', id_invitado: 'operador@example.com', periodo: '2026-09', documento_id: '20123456789' };
  axios.get.mockImplementation(getNormal);
});
test('al ingresar recupera el ticket RCE y permite consultar sin generar otro', async () => {
  renderPropuesta();
  await screen.findByText('COMPRA1');
  expect(screen.getByText('Fecha no registrada')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Consultar estado' })).toBeEnabled();
  expect(axios.post).not.toHaveBeenCalled();
  expect(axios.get.mock.calls.some(([url]) => url.includes('/sire/compras/propuesta/2026-09/anfitrion.largo%40example.com/20123456789'))).toBe(true);
});
test('cancelar la confirmacion conserva el ticket y no solicita otra propuesta', async () => {
  renderPropuesta();
  await screen.findByText('COMPRA1');
  fireEvent.click(screen.getByRole('button', { name: 'Generar nuevo ticket' }));
  await screen.findByRole("dialog");
  fireEvent.click(screen.getByRole("button", { name: "Volver" }));
  expect(axios.post).not.toHaveBeenCalled();
  expect(screen.getByText('COMPRA1')).toBeInTheDocument();
});
test('consulta con el contexto de empresa y muestra propuesta importada sin modificar asientos', async () => {
  axios.post.mockResolvedValue({ data: { success: true, listo: true, message: 'Propuesta recuperada' } });
  renderPropuesta();
  await screen.findByText('COMPRA1');
  axios.get.mockImplementation(url => url.includes('/sire/compras/propuesta/') ? Promise.resolve({ data: {
    ...estado(), propuesta: { nombre_archivo: 'compras.zip', detalle: [{ linea: 2, proveedor: 'PROVEEDOR SUNAT', total: 118 }] },
  } }) : getNormal(url));
  fireEvent.click(screen.getByRole('button', { name: 'Consultar estado' }));
  await screen.findByText('PROVEEDOR SUNAT');
  expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/sire/compras/propuesta/consultar'), expect.objectContaining({
    id_anfitrion: mockParams.id_anfitrion, documento_id: '20123456789', periodo: '2026-09', ticket: 'COMPRA1',
  }));
  expect(screen.getByRole('button', { name: 'Descargar ZIP' })).toBeEnabled();
});
test('una respuesta tardia de otra empresa no reemplaza los datos del contexto actual', async () => {
  let resolverAnterior;
  const anterior = new Promise(resolve => { resolverAnterior = resolve; });
  axios.get.mockImplementation(url => url.includes('/sire/compras/propuesta/')
    ? (url.includes('/20123456789') ? anterior : Promise.resolve({ data: estado('EMPRESA2') })) : getNormal(url));
  const view = renderPropuesta();
  await waitFor(() => expect(axios.get.mock.calls.some(([url]) => url.includes('/sire/compras/propuesta/'))).toBe(true));
  mockParams = { ...mockParams, documento_id: '20987654321' };
  view.rerender(<SireComprasPage />);
  await screen.findByText('EMPRESA2');
  await act(async () => resolverAnterior({ data: estado('ANTERIOR') }));
  expect(screen.queryByText('ANTERIOR')).not.toBeInTheDocument();
  expect(screen.getByText('EMPRESA2')).toBeInTheDocument();
});
test('si SUNAT sigue procesando muestra el aviso y mantiene el ticket existente', async () => {
  axios.post.mockResolvedValue({ data: { success: true, listo: false, message: 'En proceso SUNAT' } });
  renderPropuesta();
  await screen.findByText('COMPRA1');
  fireEvent.click(screen.getByRole('button', { name: 'Consultar estado' }));
  await screen.findByText('En proceso SUNAT');
  expect(screen.getByText('COMPRA1')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Descargar ZIP' })).toBeDisabled();
});

test('los selectores propios permiten cambiar de empresa sin depender de Transportes', async () => {
  axios.get.mockImplementation(url => url.includes('/usuario/contabilidades/') ? Promise.resolve({ data: [
    { documento_id: '20123456789', razon_social: 'EMPRESA' },
    { documento_id: '20987654321', razon_social: 'OTRA EMPRESA' },
  ] }) : getNormal(url));
  renderPropuesta();
  await screen.findByText('COMPRA1');
  fireEvent.click(screen.getByRole('button', { name: /Empresa \/ RUC/ }));
  fireEvent.click(await screen.findByRole('menuitem', { name: /OTRA EMPRESA/ }));
  expect(mockNavigate).toHaveBeenCalledWith('/sire/compras/anfitrion.largo%40example.com/operador%40example.com/2026-09/20987654321');
});
test('la revision permite filtrar diferencias desde el resumen de comparacion', async () => {
  axios.get.mockImplementation(url => url.includes('/sire/compras/propuesta/') ? Promise.resolve({ data: {
    ...estado(), propuesta: { detalle: [] }, comparacion: [
      { clave_comparacion: '1', proveedor: 'PROVEEDOR CON DIFERENCIA', resultado: 'DIFERENCIA', diferencias: ['total'] },
      { clave_comparacion: '2', proveedor: 'PROVEEDOR COINCIDENTE', resultado: 'COINCIDE', diferencias: [] },
    ],
  } }) : getNormal(url));
  renderPropuesta();
  await screen.findByText('COMPRA1');
  fireEvent.click(screen.getByRole('tab', { name: 'Comparación' }));
  expect(screen.getByText('PROVEEDOR COINCIDENTE')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Diferencia: 1' }));
  expect(screen.getByText('PROVEEDOR CON DIFERENCIA')).toBeInTheDocument();
  expect(screen.queryByText('PROVEEDOR COINCIDENTE')).not.toBeInTheDocument();
});

test('Registro muestra las compras del sistema y el ticket queda en Propuesta SUNAT', async () => {
  axios.get.mockImplementation(url => url.includes('/sire/compras/propuesta/') ? Promise.resolve({ data: {
    ...estado(), sistema: [{ num_asiento: '1', proveedor: 'COMPRA DEL SISTEMA', fecha_emision: '2026-09-15', moneda: 'PEN', total: 118 }],
  } }) : getNormal(url));
  render(<SireComprasPage />);
  await screen.findByText('COMPRA DEL SISTEMA');
  expect(screen.getByRole('tab', { name: 'Registro' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.queryByRole('button', { name: 'Generar nuevo ticket' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('tab', { name: 'Propuesta SUNAT' }));
  expect(screen.getByText('COMPRA1')).toBeInTheDocument();
});
test('el filtro de dias y la busqueda funcionan en Registro y Propuesta SUNAT', async () => {
  const registros = [
    { num_asiento: '1', linea: 2, proveedor: 'PROVEEDOR 15', fecha_emision: '2026-09-15', moneda: 'PEN', total: 118 },
    { num_asiento: '2', linea: 3, proveedor: 'PROVEEDOR 16', fecha_emision: '2026-09-16', moneda: 'PEN', total: 236 },
  ];
  axios.get.mockImplementation(url => url.includes('/sire/compras/propuesta/') ? Promise.resolve({ data: {
    ...estado(), sistema: registros, propuesta: { detalle: registros },
  } }) : getNormal(url));
  render(<SireComprasPage />);
  await screen.findByText('PROVEEDOR 15');
  fireEvent.click(screen.getByRole('button', { name: 'Día 15' }));
  expect(screen.queryByText('PROVEEDOR 16')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('tab', { name: 'Propuesta SUNAT' }));
  expect(screen.getByText('PROVEEDOR 15')).toBeInTheDocument();
  expect(screen.queryByText('PROVEEDOR 16')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Todos los días' }));
  expect(screen.getByText('PROVEEDOR 16')).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText('Filtrar comprobante, proveedor u observación'), { target: { value: 'PROVEEDOR 16' } });
  expect(screen.queryByText('PROVEEDOR 15')).not.toBeInTheDocument();
  expect(screen.getByText('PROVEEDOR 16')).toBeInTheDocument();
});
test('las observaciones separan los hallazgos de los comprobantes coincidentes', async () => {
  axios.get.mockImplementation(url => url.includes('/sire/compras/propuesta/') ? Promise.resolve({ data: {
    ...estado(), propuesta: { detalle: [] }, comparacion: [
      { clave_comparacion: '1', proveedor: 'REVISAR IMPORTE', resultado: 'DIFERENCIA', diferencias: ['total'] },
      { clave_comparacion: '2', proveedor: 'COINCIDENTE', resultado: 'COINCIDE', diferencias: [] },
    ],
  } }) : getNormal(url));
  render(<SireComprasPage />);
  fireEvent.click(await screen.findByRole('tab', { name: 'Observaciones (1)' }));
  expect(screen.getByText('REVISAR IMPORTE')).toBeInTheDocument();
  expect(screen.queryByText('COINCIDENTE')).not.toBeInTheDocument();
});


test('Exportar respeta el dia seleccionado y conserva la vista de origen', async () => {
  const registros = [
    { num_asiento: '1', proveedor: 'COMPRA DIA 15', fecha_emision: '2026-09-15', moneda: 'PEN', total: 118 },
    { num_asiento: '2', proveedor: 'COMPRA DIA 16', fecha_emision: '2026-09-16', moneda: 'PEN', total: 236 },
  ];
  axios.get.mockImplementation(url => url.includes('/sire/compras/propuesta/') ? Promise.resolve({ data: { ...estado(), sistema: registros } }) : getNormal(url));
  render(<SireComprasPage />);
  await screen.findByText('COMPRA DIA 15');
  fireEvent.click(screen.getByRole('button', { name: 'Día 15' }));
  fireEvent.click(screen.getByRole('tab', { name: 'Exportar' }));
  fireEvent.click(screen.getAllByRole('button', { name: 'Exportar Excel' })[0]);
  expect(mockExportar).toHaveBeenCalledWith([registros[0]], 0, '20123456789', '2026-09');
});

test('al cerrar y reabrir consulta nuevamente el ultimo ticket persistido', async () => {
  const view = renderPropuesta();
  await screen.findByText('COMPRA1');
  view.unmount();
  axios.get.mockImplementation(url => url.includes('/sire/compras/propuesta/')
    ? Promise.resolve({ data: { ...estado('ULTIMO2'), advertencia: 'El registro no esta disponible.' } }) : getNormal(url));
  renderPropuesta();
  await screen.findByText('ULTIMO2');
  expect(screen.getByText('El registro no esta disponible.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Consultar estado' })).toBeEnabled();
  expect(axios.post).not.toHaveBeenCalled();
});
test('conserva el ticket recien generado si falla la recarga posterior', async () => {
  axios.get.mockImplementation(url => url.includes('/sire/compras/propuesta/')
    ? Promise.resolve({ data: estado('') }) : getNormal(url));
  renderPropuesta();
  await screen.findByText('No hay ticket guardado para este período.');
  await waitFor(() => expect(screen.getByRole('button', { name: 'Generar ticket' })).toBeEnabled());
  axios.post.mockResolvedValue({ data: { success: true, ticket: 'NUEVO3', fecha_generacion: '2026-10-16T12:00:00Z' } });
  axios.get.mockRejectedValue(new Error('Error de recarga'));
  fireEvent.click(screen.getByRole('button', { name: 'Generar ticket' }));
  await screen.findByText('NUEVO3');
  await waitFor(() => expect(screen.getByRole('button', { name: 'Consultar estado' })).toBeEnabled());
});
