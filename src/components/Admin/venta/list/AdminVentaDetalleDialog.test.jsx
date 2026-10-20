import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import AdminVentaDetalleDialog from './AdminVentaDetalleDialog';
import { crearColumnasVenta } from './AdminVentaTableColumns';

jest.mock('axios', () => ({ get: jest.fn() }));

const venta = {
  comprobante: '07-F001-0000007', comprobante_key: '01-F001-0000420-2',
  r_cod: '01', r_cod_ref: '07', r_serie: 'F001', r_numero: '0000420', elemento: 2,
  r_monto_total: 75, r_moneda: 'PEN', r_razon_social: 'Cliente',
  detalle_cantidad: 3, detalle_resumen: [{ descripcion: 'Cemento', cantidad: 2 }, { descripcion: 'Arena', cantidad: 1 }],
};
const props = { venta, periodo: '2026-09', documentoId: '20614126435', idAnfitrion: 'correo@empresa.com', backHost: '/api', onClose: jest.fn() };

beforeEach(() => jest.clearAllMocks());

test('la cuarta columna abre el modal con la fila original sin consultar detalles anticipadamente', () => {
  const onDetalle = jest.fn();
  const columnas = crearColumnasVenta({ onDetalle });
  expect(columnas[3].id).toBe('detalle');
  render(columnas[3].cell(venta));
  expect(screen.getByText('2 × Cemento')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Ver detalle · 3 productos' }));
  expect(onDetalle).toHaveBeenCalledWith(venta);
  expect(axios.get).not.toHaveBeenCalled();
});

test('consulta el período y clave originales de la NC y muestra importes y total negativos', async () => {
  axios.get.mockResolvedValue({ data: [{ item: 1, descripcion: 'Cemento', cantidad: 2, precio_unitario: 37.5, precio_neto: 75 }] });
  const { unmount } = render(<AdminVentaDetalleDialog {...props} />);
  expect(await screen.findByText('Cemento')).toBeTruthy();
  expect(axios.get.mock.calls[0][0]).toBe('/api/ad_ventadet/2026-09/correo%40empresa.com/20614126435/01/F001/0000420/2');
  expect(screen.getByText('-75.00')).toBeTruthy();
  expect(screen.getByText('Total: -75.00 PEN')).toBeTruthy();
  const signal = axios.get.mock.calls[0][1].signal;
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
  expect(props.onClose).toHaveBeenCalled();
  unmount();
  expect(signal.aborted).toBe(true);
});

test('permite reintentar ante un error y distingue una venta sin productos', async () => {
  axios.get.mockRejectedValueOnce(new Error('Error de red')).mockResolvedValueOnce({ data: [] });
  render(<AdminVentaDetalleDialog {...props} />);
  expect(await screen.findByText('No se pudo cargar el detalle de la venta.')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
  await waitFor(() => expect(screen.getByText('Sin detalle registrado.')).toBeTruthy());
});
