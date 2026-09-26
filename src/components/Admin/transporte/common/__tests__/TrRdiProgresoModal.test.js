import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";

import TrRdiProgresoModal from "../TrRdiProgresoModal";

const PASOS = [
  { clave: "a", fecha: "2026-09-03", numeroRdi: "RC-20260903-001", estado: "INCIERTO", cantidad: 3 },
  { clave: "b", fecha: "2026-09-12", numeroRdi: "RC-20260912-001", estado: "GENERADO", cantidad: 5 },
  { clave: "c", fecha: "2026-09-20", numeroRdi: "RC-20260920-001", estado: "ERROR", cantidad: 2 },
  { clave: "d", fecha: "2026-09-26", numeroRdi: "", estado: "SIN RDI", cantidad: 15 },
];

test("muestra una fila por dia mientras corre, del mas antiguo al mas nuevo", async () => {
  const alCerrar = jest.fn();
  let liberar;
  const enviarPaso = jest.fn(() => new Promise((resolve) => {
    if (enviarPaso.mock.calls.length === 1) {
      liberar = () => resolve({ ok: true, mensaje: "3 encomiendas enviadas" });
      return;
    }
    resolve(enviarPaso.mock.calls.length === 3
      ? { ok: false, mensaje: "rechazado por SUNAT" }
      : { ok: true, mensaje: `${PASOS[enviarPaso.mock.calls.length - 1].cantidad} encomiendas enviadas` });
  }));

  render(
    <TrRdiProgresoModal
      abierto
      pasos={PASOS}
      periodo="2026-09"
      enviarPaso={enviarPaso}
      alCerrar={alCerrar}
    />
  );

  // El alcance se declara en el encabezado: periodo del filtro, dia por dia.
  expect(screen.getByText("Periodo 2026-09 - dia por dia, todas las agencias")).toBeTruthy();

  // Las cuatro filas existen desde el inicio: el modal no espera al backend.
  expect(screen.getByText("Dia 03/09/2026")).toBeTruthy();
  expect(screen.getByText("Dia 12/09/2026")).toBeTruthy();
  expect(screen.getByText("Dia 20/09/2026")).toBeTruthy();
  expect(screen.getByText("Dia 26/09/2026")).toBeTruthy();
  expect(screen.getByText("RC-20260903-001")).toBeTruthy();
  expect(screen.getByText(/resumen nuevo \(15 encomiendas sin RDI\)/)).toBeTruthy();

  // Mientras espera la respuesta, el primer paso dice que se esta procesando.
  expect(screen.getByText("procesando...")).toBeTruthy();
  expect(screen.getByText(/1 de 4 en curso/)).toBeTruthy();

  // CERRAR no hace nada mientras corre: no se puede llevarse la pantalla.
  fireEvent.click(screen.getByText("CERRAR"));
  expect(alCerrar).not.toHaveBeenCalled();

  await act(async () => {
    liberar();
  });

  await screen.findByText(/Se detuvo/);

  // Se detiene en el primer error: el cuarto nunca se intenta.
  expect(enviarPaso).toHaveBeenCalledTimes(3);
  expect(enviarPaso.mock.calls.map((c) => c[0].clave)).toEqual(["a", "b", "c"]);

  // Estados por fila: enviado, enviado, error, no se intento.
  expect(screen.getAllByText("enviado")).toHaveLength(2);
  expect(screen.getByText("error")).toBeTruthy();
  expect(screen.getByText("no se intento")).toBeTruthy();
  expect(screen.getByText("rechazado por SUNAT")).toBeTruthy();
  expect(screen.getAllByText("Estado").length).toBeGreaterThan(0);
  expect(screen.getAllByText("Docs").length).toBeGreaterThan(0);
  expect(screen.getByText("REINTENTAR")).toBeTruthy();

  // Resumen y cierre habilitado al terminar.
  expect(screen.getByText("2 de 4 enviados")).toBeTruthy();
  expect(screen.getByText(/2 enviado\(s\), 1 con error y 1 sin intentar/)).toBeTruthy();

  fireEvent.click(screen.getByText("CERRAR"));
  expect(alCerrar).toHaveBeenCalledTimes(1);
});

test("con la cola vacia no rompe y avisa que no hay nada que enviar", async () => {
  render(<TrRdiProgresoModal abierto pasos={[]} enviarPaso={jest.fn()} />);
  await screen.findByText(/Listo: 0 resumen\(es\) enviado/);
});
