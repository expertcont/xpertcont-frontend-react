import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import TrSireReemplazo from "./TrSireReemplazo";
import TrSirePresentacion from "./TrSirePresentacion";

jest.mock("axios", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }));
const props = { backHost: "https://backend.test", idAnfitrion: "U", idInvitado: "OPERADOR", documentoId: "20123456789",
  periodo: "2024-09", empresa: "EMPRESA", cantidadSistema: 2, ocupado: false, onBloqueo: jest.fn(), onCambioPropuesta: jest.fn() };
const sinEnvio = { success: true, estado: "SIN_ENVIO" };
const preparado = { success: true, estado: "PREPARADO", fuente: "TRANSPORTE", id_reemplazo: "ID1", hash_archivo: "HASH1",
  cantidad_registros: 1, resumen: { total: "118.00" } };
const enviado = { ...preparado, estado: "ENVIADO", ticket_reemplazo: "REEMPLAZO3" };
const terminado = { ...enviado, estado: "TERMINADO", estado_actualizacion: "ACTUALIZADO", id_propuesta_actualizada: "NUEVA" };
beforeEach(() => { jest.resetAllMocks(); axios.get.mockResolvedValue({ data: sinEnvio }); });
const abrirPreparacion = async () => {
  await waitFor(() => expect(screen.getByRole("button", { name: "Reemplazar propuesta" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "Reemplazar propuesta" }));
  await screen.findByText("Confirmar reemplazo de propuesta");
};
test("genera archivo revisable y exige confirmar alcance antes de enviar el snapshot", async () => {
  axios.post.mockResolvedValueOnce({ data: preparado }).mockResolvedValueOnce({ data: enviado }).mockResolvedValueOnce({ data: terminado });
  render(<TrSireReemplazo {...props} />);
  await abrirPreparacion();
  const enviar = screen.getByRole("button", { name: "Enviar reemplazo a SUNAT" });
  expect(enviar).toBeDisabled();
  expect(screen.getByText("1 comprobantes en el archivo.")).toBeInTheDocument();
  expect(screen.getByText("Total del archivo: S/ 118.00")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Descargar archivo RVIE" })).toHaveAttribute("href", expect.stringContaining("id_reemplazo=ID1&hash_archivo=HASH1"));
  expect(axios.post).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(enviar);
  await screen.findByText("Reemplazo confirmado");
  expect(axios.post.mock.calls[1][0]).toMatch(/\/reemplazar$/);
  expect(axios.post.mock.calls[1][1]).toMatchObject({ id_reemplazo: "ID1", hash_archivo: "HASH1", confirmar: true, confirmar_alcance: true });
  expect(axios.post.mock.calls[2][0]).toMatch(/\/reemplazo\/estado$/);
  expect(props.onCambioPropuesta).toHaveBeenCalledWith(terminado);
  await waitFor(() => expect(screen.getByRole("button", { name: "Reemplazar propuesta" })).toBeDisabled());
});
test("cancelar la revision no envia un reemplazo", async () => {
  axios.post.mockResolvedValue({ data: preparado });
  render(<TrSireReemplazo {...props} />); await abrirPreparacion();
  fireEvent.click(screen.getByRole("button", { name: "Volver" }));
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(axios.post.mock.calls[0][0]).toMatch(/\/generar$/);
});
test("recupera archivo preparado para revisarlo sin generar otro", async () => {
  axios.get.mockResolvedValue({ data: preparado });
  render(<TrSireReemplazo {...props} />);
  fireEvent.click(await screen.findByRole("button", { name: "Revisar archivo preparado" }));
  await screen.findByText("Confirmar reemplazo de propuesta");
  expect(axios.post).not.toHaveBeenCalled(); expect(screen.getByRole("checkbox")).not.toBeChecked();
});
test("si no recupera el estado mantiene bloqueado el envio y permite recuperar", async () => {
  axios.get.mockRejectedValueOnce(new Error("Sin conexión")).mockResolvedValue({ data: sinEnvio });
  render(<TrSireReemplazo {...props} />);
  await screen.findByText("No se pudo recuperar el reemplazo guardado.");
  await waitFor(() => expect(screen.getByRole("button", { name: "Reemplazar propuesta" })).toBeDisabled());
  fireEvent.click(screen.getByRole("button", { name: "Recuperar reemplazo guardado" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Reemplazar propuesta" })).toBeEnabled());
  expect(axios.post).not.toHaveBeenCalled();
});
test("timeout bloquea reenvio y conserva el intento para conciliar", async () => {
  axios.get.mockResolvedValueOnce({ data: sinEnvio }).mockResolvedValue({ data: { ...preparado, estado: "INCIERTO" } });
  axios.post.mockResolvedValueOnce({ data: preparado }).mockRejectedValueOnce(new Error("Network error"));
  render(<TrSireReemplazo {...props} />); await abrirPreparacion();
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Enviar reemplazo a SUNAT" }));
  await screen.findByText("Reemplazo pendiente de verificar");
  expect(screen.getByRole("button", { name: "Enviar reemplazo a SUNAT" })).toBeDisabled();
  expect(axios.post.mock.calls.filter(([url]) => url.endsWith("/reemplazar"))).toHaveLength(1);
});
test("fallo al consultar conserva ticket confirmado y evita otro envio", async () => {
  axios.get.mockResolvedValue({ data: enviado });
  axios.post.mockRejectedValue(new Error("No disponible"));
  render(<TrSireReemplazo {...props} />);
  await screen.findByText("Ticket de reemplazo: REEMPLAZO3");
  fireEvent.click(screen.getByRole("button", { name: "Consultar reemplazo" }));
  await screen.findByText("No disponible");
  expect(screen.getByText("Ticket de reemplazo: REEMPLAZO3")).toBeInTheDocument();
  await waitFor(() => expect(screen.getByRole("button", { name: "Reemplazar propuesta" })).toBeDisabled());
  expect(axios.post.mock.calls[0][0]).toMatch(/\/estado$/);
});
test("actualiza la propuesta local tras exito sin volver a enviar reemplazo", async () => {
  axios.get.mockResolvedValue({ data: { ...terminado, estado_actualizacion: "ERROR", error_actualizacion: "Descarga pendiente" } });
  axios.post.mockResolvedValue({ data: terminado });
  render(<TrSireReemplazo {...props} />);
  fireEvent.click(await screen.findByRole("button", { name: "Actualizar propuesta" }));
  await screen.findByText("Propuesta local actualizada. La anterior se conserva como historial.");
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(axios.post.mock.calls[0][0]).toMatch(/\/estado$/);
  expect(props.onCambioPropuesta).toHaveBeenCalledWith(terminado);
});
test("conciliacion verifica el ticket indicado y no repite la carga", async () => {
  axios.get.mockResolvedValue({ data: { ...preparado, estado: "INCIERTO" } });
  axios.post.mockResolvedValue({ data: enviado });
  render(<TrSireReemplazo {...props} />);
  const entrada = await screen.findByLabelText("Ticket observado en SUNAT");
  fireEvent.change(entrada, { target: { value: "REEMPLAZO3" } });
  fireEvent.click(screen.getByRole("button", { name: "Verificar ticket en SUNAT" }));
  await screen.findByText("Ticket de reemplazo: REEMPLAZO3");
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(axios.post.mock.calls[0][0]).toMatch(/\/conciliar$/);
  expect(axios.post.mock.calls[0][1]).toMatchObject({ ticket_reemplazo: "REEMPLAZO3", id_reemplazo: "ID1", confirmar: true });
});
test("la pantalla de presentacion bloquea aceptar cuando hay reemplazo activo", async () => {
  axios.get.mockImplementation((url) => Promise.resolve({ data: url.includes("/aceptacion/") ? sinEnvio : enviado }));
  render(<TrSirePresentacion {...props} ticket="DESCARGA1" importacion={{ id_propuesta: "7", cantidad_registros: 1 }} />);
  await screen.findByText("Ticket de reemplazo: REEMPLAZO3");
  expect(screen.getByRole("button", { name: "Aceptar propuesta" })).toBeDisabled();
});
test("permite revisar un archivo externo completo sin mezclarlo con la generacion local", async () => {
  axios.post.mockResolvedValue({ data: { ...preparado, fuente: "ARCHIVO" } });
  render(<TrSireReemplazo {...props} />);
  await waitFor(() => expect(screen.getByRole("button", { name: "Reemplazar propuesta" })).toBeEnabled());
  const archivo = new File(["RVIE"], "revision.zip", { type: "application/zip" });
  fireEvent.change(screen.getByLabelText("Archivo RVIE externo"), { target: { files: [archivo] } });
  await screen.findByText("Confirmar reemplazo de propuesta");
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(axios.post.mock.calls[0][0]).toMatch(/\/preparar$/);
  expect(axios.post.mock.calls[0][1].get("archivo")).toBe(archivo);
  expect(axios.post.mock.calls[0][1].get("documento_id")).toBe(props.documentoId);
});
test("conserva un ticket conocido si fallo guardarlo y permite verificarlo para conciliar", async () => {
  axios.get.mockResolvedValueOnce({ data: sinEnvio }).mockResolvedValue({ data: { ...preparado, estado: "ENVIANDO" } });
  axios.post.mockResolvedValueOnce({ data: preparado }).mockRejectedValueOnce({ response: { status: 503,
    data: { message: "Resultado incierto", estado: "INCIERTO", ticket_reemplazo: "REEMPLAZO3" } } });
  render(<TrSireReemplazo {...props} />); await abrirPreparacion();
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Enviar reemplazo a SUNAT" }));
  await screen.findByText("Ticket de reemplazo: REEMPLAZO3");
  fireEvent.click(screen.getByRole("button", { name: "Volver" }));
  await waitFor(() => expect(screen.getByLabelText("Ticket observado en SUNAT")).toHaveValue("REEMPLAZO3"));
  await waitFor(() => expect(screen.getByRole("button", { name: "Verificar ticket en SUNAT" })).toBeEnabled());
  expect(screen.queryByRole("button", { name: "Consultar reemplazo" })).not.toBeInTheDocument();
});