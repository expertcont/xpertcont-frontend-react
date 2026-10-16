import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import TrSirePresentacion from "./TrSirePresentacion";

jest.mock("axios", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

jest.mock("./TrSireReemplazo", () => ({
  __esModule: true,
  default: ({ onBloqueo }) => {
    require("react").useEffect(() => onBloqueo(false), [onBloqueo]);
    return null;
  },
}));
const props = {
  backHost: "https://backend.test", idAnfitrion: "U", idInvitado: "OPERADOR",
  empresa: "EMPRESA TEST", documentoId: "20123456789", periodo: "2026-09",
  ticket: "DESCARGA1", importacion: { id_propuesta: "7", cantidad_registros: 12 },
  cantidadSistema: 12,
};
const sinEnvio = { data: { success: true, estado: "SIN_ENVIO", ticket_aceptacion: null } };
const enviado = { success: true, estado: "ENVIADO", ticket_aceptacion: "ACEPTACION2", mensaje: "En proceso SUNAT." };

beforeEach(() => {
  jest.resetAllMocks();
  axios.get.mockResolvedValue(sinEnvio);
});

test("confirmar envia la propuesta revisada y muestra el ticket y resultado de SUNAT", async () => {
  axios.post.mockResolvedValueOnce({ data: enviado })
    .mockResolvedValueOnce({ data: { ...enviado, estado: "TERMINADO", completado: true } });
  render(<TrSirePresentacion {...props} />);
  const aceptar = screen.getByRole("button", { name: "Aceptar propuesta" });
  await waitFor(() => expect(aceptar).toBeEnabled());
  fireEvent.click(aceptar);
  expect(screen.getByText("Confirmar aceptación de propuesta")).toBeInTheDocument();
  expect(axios.post).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Enviar aceptación a SUNAT" }));
  await screen.findByText("Propuesta aceptada");
  expect(axios.post).toHaveBeenNthCalledWith(1, "https://backend.test/transporte/sire/propuesta/aceptar", {
    id_anfitrion: "U", documento_id: "20123456789", periodo: "2026-09", id_libro: "014",
    id_propuesta: "7", ticket_propuesta: "DESCARGA1", confirmar: true, id_invitado: "OPERADOR",
  });
  expect(axios.post).toHaveBeenNthCalledWith(2, "https://backend.test/transporte/sire/propuesta/aceptacion/estado", {
    id_anfitrion: "U", documento_id: "20123456789", periodo: "2026-09", id_libro: "014",
  });
  expect(screen.getByText("Ticket de aceptación: ACEPTACION2")).toBeInTheDocument();
  expect(aceptar).toBeDisabled();
});

test("volver de la confirmacion no envia nada", async () => {
  render(<TrSirePresentacion {...props} />);
  await waitFor(() => expect(screen.getByRole("button", { name: "Aceptar propuesta" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "Aceptar propuesta" }));
  fireEvent.click(screen.getByRole("button", { name: "Volver" }));
  expect(axios.post).not.toHaveBeenCalled();
});

test("recupera un envio previo y permite consultar sin volver a aceptar", async () => {
  axios.get.mockResolvedValue({ data: enviado });
  axios.post.mockResolvedValue({ data: { ...enviado, estado: "TERMINADO" } });
  render(<TrSirePresentacion {...props} />);
  await screen.findByText("Ticket de aceptación: ACEPTACION2");
  expect(screen.getByRole("button", { name: "Aceptar propuesta" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Consultar aceptación" }));
  await screen.findByText("Propuesta aceptada");
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(axios.post.mock.calls[0][0]).toContain("/aceptacion/estado");
});

test("resultado incierto bloquea repetir el envio", async () => {
  axios.get.mockResolvedValueOnce(sinEnvio).mockResolvedValue({ data: { success: true, estado: "INCIERTO" } });
  axios.post.mockRejectedValue({ request: {}, message: "Network error" });
  render(<TrSirePresentacion {...props} />);
  await waitFor(() => expect(screen.getByRole("button", { name: "Aceptar propuesta" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "Aceptar propuesta" }));
  fireEvent.click(screen.getByRole("button", { name: "Enviar aceptación a SUNAT" }));
  await screen.findByText("Resultado pendiente de verificar");
  expect(screen.getByRole("button", { name: "Enviar aceptación a SUNAT" })).toBeDisabled();
  expect(axios.post).toHaveBeenCalledTimes(1);
});

test("si no recupera el estado inicial permite reintentar la lectura y no enviar a ciegas", async () => {
  axios.get.mockRejectedValueOnce({ response: { data: { message: "No disponible" } } }).mockResolvedValue(sinEnvio);
  render(<TrSirePresentacion {...props} />);
  await screen.findByText("No disponible");
  expect(screen.getByRole("button", { name: "Aceptar propuesta" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Recuperar estado guardado" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Aceptar propuesta" })).toBeEnabled());
  expect(axios.post).not.toHaveBeenCalled();
});

test("fallo en la consulta posterior conserva el ticket enviado y bloquea reenviar", async () => {
  axios.post.mockResolvedValueOnce({ data: enviado })
    .mockRejectedValueOnce({ response: { data: { message: "SUNAT temporalmente no disponible" } } });
  render(<TrSirePresentacion {...props} />);
  await waitFor(() => expect(screen.getByRole("button", { name: "Aceptar propuesta" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "Aceptar propuesta" }));
  fireEvent.click(screen.getByRole("button", { name: "Enviar aceptación a SUNAT" }));
  await screen.findByText("SUNAT temporalmente no disponible");
  expect(screen.getByText("Ticket de aceptación: ACEPTACION2")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Aceptar propuesta" })).toBeDisabled();
  expect(axios.post.mock.calls.filter(([url]) => url.endsWith("/aceptar"))).toHaveLength(1);
});

