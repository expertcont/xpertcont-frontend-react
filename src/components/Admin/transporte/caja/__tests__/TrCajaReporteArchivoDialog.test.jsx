import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import TrCajaReporteArchivoDialog from "../TrCajaReporteArchivoDialog";

const archivo = { url: "blob:reporte-caja", file: new File(["%PDF-1.7"], "reporte_caja.pdf", { type: "application/pdf" }) };
const shareDescriptor = Object.getOwnPropertyDescriptor(navigator, "share");
const canShareDescriptor = Object.getOwnPropertyDescriptor(navigator, "canShare");

beforeEach(() => {
  Object.defineProperty(navigator, "share", { configurable: true, value: jest.fn().mockResolvedValue() });
  Object.defineProperty(navigator, "canShare", { configurable: true, value: jest.fn().mockReturnValue(true) });
});

afterEach(() => {
  if (shareDescriptor) Object.defineProperty(navigator, "share", shareDescriptor);
  else delete navigator.share;
  if (canShareDescriptor) Object.defineProperty(navigator, "canShare", canShareDescriptor);
  else delete navigator.canShare;
  jest.restoreAllMocks();
});

test("ofrece compartir PDF, descarga y vista", () => {
  render(<TrCajaReporteArchivoDialog archivo={archivo} onClose={jest.fn()} />);
  expect(screen.getByRole("button", { name: "Compartir PDF" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Descargar PDF" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Ver PDF" })).toBeTruthy();
});

test("WhatsApp recibe el PDF real con su nombre, sin abrir un chat vacio", async () => {
  const clickLink = jest.spyOn(HTMLAnchorElement.prototype, "click");
  render(<TrCajaReporteArchivoDialog archivo={archivo} onClose={jest.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Compartir PDF" }));
  expect(navigator.share).toHaveBeenCalledWith({ files: [archivo.file], title: archivo.file.name });
  expect(clickLink).not.toHaveBeenCalled();
  await waitFor(() => expect(screen.getByRole("status").textContent).toContain("PDF entregado"));
});

test("si no se pueden compartir archivos muestra como adjuntar el PDF sin abrir WhatsApp vacio", () => {
  navigator.canShare.mockReturnValue(false);
  const clickLink = jest.spyOn(HTMLAnchorElement.prototype, "click");
  render(<TrCajaReporteArchivoDialog archivo={archivo} onClose={jest.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Compartir PDF" }));
  expect(navigator.share).not.toHaveBeenCalled();
  expect(clickLink).not.toHaveBeenCalled();
  expect(screen.getByRole("alert").textContent).toContain("Descargar PDF");
});

test("cancelar el selector permite reintentar sin mostrar error", async () => {
  navigator.share.mockRejectedValue(new DOMException("Cancelado", "AbortError"));
  render(<TrCajaReporteArchivoDialog archivo={archivo} onClose={jest.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Compartir PDF" }));
  await waitFor(() => expect(screen.queryByText("Preparando reporte...")).toBeNull());
  expect(screen.queryByRole("alert")).toBeNull();
});

test("el boton inferior permite cerrar el reporte", () => {
  const onClose = jest.fn();
  render(<TrCajaReporteArchivoDialog archivo={archivo} onClose={onClose} />);
  fireEvent.click(screen.getByRole("button", { name: "Cerrar", exact: true }));
  expect(onClose).toHaveBeenCalledTimes(1);
});
