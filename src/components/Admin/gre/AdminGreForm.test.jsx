import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AdminGreForm from "./AdminGreForm";
import { apiGre } from "./greConsulta";

jest.mock("./greConsulta", () => ({ ...jest.requireActual("./greConsulta"), apiGre: jest.fn() }));

const row = { periodo: "2026-11", cod: "09", serie: "T001", numero: "0000001" };
const props = { open: true, row, backHost: "http://localhost", idAnfitrion: "titular", idInvitado: "invitado", documentoId: "20123456789", periodo: "2026-11", onClose: jest.fn(), onSaved: jest.fn() };
const guia = {
  ...row, fecha_emision: "2026-11-04", fecha_traslado: "2026-11-05", destinatario_razon_social: "Cliente de destino",
  items: [{ item: 1, descripcion: "Cajas de mercadería", cantidad: "2.00", cont_und: "NIU" }], documentos: [], editable: false, origen: "VENTAS",
};

beforeEach(() => { jest.clearAllMocks(); });

test("consulta una guía de venta con sus ítems sin exponer edición ni anulación", async () => {
  apiGre.mockResolvedValue(guia);
  render(<AdminGreForm {...props} />);
  expect(await screen.findByText(/Cajas de mercadería/)).toBeTruthy();
  expect(screen.getByText("Cliente de destino")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Editar compra" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Anular compra" })).toBeNull();
  expect(apiGre).toHaveBeenCalledTimes(1);
  expect(apiGre.mock.calls[0][1]).toEqual(["comercial", "gre", "titular", "invitado", "20123456789", "guias", "2026-11", "09", "T001", "0000001"]);
  expect(apiGre.mock.calls[0][2].method).toBeUndefined();
});

test("una compra pendiente muestra sus facturas y solicita confirmación antes de anular", async () => {
  apiGre.mockResolvedValueOnce({ ...guia, origen: "COMPRAS", editable: true, estado: "PENDIENTE", version: "v1", documentos: [{ doc_item: 1, prov_razon_social: "Proveedor de compra", prov_doc: "20987654321", doc_serie: "F001", doc_numero: "8", fecha_emision: "2026-11-01", moneda: "PEN", total: "30.00", origen_dato: "SIRE" }] }).mockResolvedValueOnce({ estado: "ANULADA" });
  render(<AdminGreForm {...props} />);
  expect(await screen.findByText(/Proveedor de compra/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Anular compra" }));
  expect(apiGre).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Confirmar anulación" }));
  await waitFor(() => expect(props.onSaved).toHaveBeenCalledWith(expect.objectContaining({ estado: "ANULADA" })));
  expect(apiGre.mock.calls[1][1].at(-1)).toBe("anular");
  expect(apiGre.mock.calls[1][2]).toEqual({ method: "POST", body: { version: "v1" } });
});

test("una guía enviada permanece solo en consulta", async () => {
  apiGre.mockResolvedValue({ ...guia, origen: "COMPRAS", estado: "ENVIADA", editable: false, envio: { estado: "ENVIADA", ticket: "ticket-123" } });
  render(<AdminGreForm {...props} />);
  expect(await screen.findByText(/Ticket: ticket-123/)).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Editar compra" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Anular compra" })).toBeNull();
});

test("el formulario nuevo carga catálogos sin consultar ni emitir una guía de venta", async () => {
  apiGre.mockResolvedValue({ fecha: "2026-11-04", unidades: [], ubigeos: [], productos: [], motivos: [{ codigo: "02", descripcion: "Compra" }], series: [{ codigo: "T001" }], compras_disponibles: true });
  render(<AdminGreForm {...props} row={null} />);
  expect(await screen.findByText("Nueva guía por compras")).toBeTruthy();
  expect(await screen.findByText(/04\/11\/2026/)).toBeTruthy();
  expect(screen.getByRole("button", { name: "Guardar guía por compras" }).disabled).toBe(true);
  expect(apiGre).toHaveBeenCalledTimes(1);
  expect(apiGre.mock.calls[0][1].at(-1)).toBe("catalogos");
});
