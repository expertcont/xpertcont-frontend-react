import { estadoTiempoEncomienda, formatoHoraNatural, llegadaPrevista, tiempoServidor } from "./tiemposEncomienda";

const row = { r_fecemi: "2026-10-21", llegada_aprox: "14:00:00" };
const ahora = tiempoServidor("2026-10-21 15:30:00"); // Hora de Lima del servidor.

test("presenta las horas en am/pm sin conversion de zona", () => {
  expect(formatoHoraNatural("09:00")).toBe("09:00 am");
  expect(formatoHoraNatural("00:15:00")).toBe("12:15 am");
  expect(formatoHoraNatural("12:00:00")).toBe("12:00 pm");
  expect(formatoHoraNatural("23:45:00.00000")).toBe("11:45 pm");
  expect(formatoHoraNatural(null)).toBe("—");
  expect(formatoHoraNatural("2026-10-22 09:00:00.12345")).toBe("09:00 am");
  expect(formatoHoraNatural("2026-10-22T09:00:00.000Z")).toBe("09:00 am");
  expect(formatoHoraNatural("2026-10-22T23:45:00-05:00")).toBe("11:45 pm");
});

test("combina la fecha de emision con la hora prevista", () => {
  expect(llegadaPrevista(row)).toBe("2026-10-21 14:00:00");
  expect(llegadaPrevista({ ...row, llegada_aprox: "00:00:00" })).toBe("2026-10-21 00:00:00");
  expect(llegadaPrevista({ ...row, llegada_aprox: null })).toBe("");
});

test("registro 6 pm y previsto 11 am corresponde al dia siguiente", () => {
  const nocturna = { r_fecemi: "2026-10-22", ctrl_crea: "2026-10-22T18:00:00.000Z", llegada_aprox: "11:00:00" };
  expect(llegadaPrevista(nocturna)).toBe("2026-10-23 11:00:00");
  expect(estadoTiempoEncomienda(nocturna, tiempoServidor("2026-10-22 19:00:00")).tipo).toBe("muted");
  expect(estadoTiempoEncomienda(nocturna, tiempoServidor("2026-10-23 10:59:00")).tipo).toBe("muted");
  expect(estadoTiempoEncomienda(nocturna, tiempoServidor("2026-10-23 11:00:00")).tipo).toBe("muted");
  expect(estadoTiempoEncomienda(nocturna, tiempoServidor("2026-10-23 11:30:00")).texto).toBe("Sin llegada · retraso 30 min");
});

test.each([
  ["2026-12-31", "2027-01-01"],
  ["2024-02-28", "2024-02-29"],
  ["2024-02-29", "2024-03-01"],
  ["2026-02-28", "2026-03-01"],
])("la llegada al dia siguiente de %s respeta el calendario", (emision, siguiente) => {
  expect(llegadaPrevista({ r_fecemi: emision, ctrl_crea: `${emision} 23:00:00`, llegada_aprox: "00:00:00" }))
    .toBe(`${siguiente} 00:00:00`);
});

test("horas posteriores o iguales al registro no cambian el dia", () => {
  expect(llegadaPrevista({ ...row, ctrl_crea: "2026-10-21 09:00:00" })).toBe("2026-10-21 14:00:00");
  expect(llegadaPrevista({ ...row, ctrl_crea: "2026-10-21 14:00:30" })).toBe("2026-10-21 14:00:00");
  expect(llegadaPrevista({ ...row, ctrl_crea: "invalido" })).toBe("2026-10-21 14:00:00");
});

test("la llegada real sigue teniendo prioridad sobre el horario del dia siguiente", () => {
  const nocturna = { ...row, ctrl_crea: "2026-10-21 18:00:00", llegada_real: "2026-10-21 19:00:00" };
  expect(estadoTiempoEncomienda(nocturna, tiempoServidor("2026-10-21 20:00:00")).texto).toBe("Espera recojo: 1 h 0 min");
});

test("distingue encomiendas en plazo, retrasadas y sin hora prevista", () => {
  expect(estadoTiempoEncomienda(row, ahora).texto).toBe("Sin llegada · retraso 1 h 30 min");
  expect(estadoTiempoEncomienda(row, tiempoServidor("2026-10-21 13:00:00")).texto).toBe("Aún no llega · en plazo previsto");
  expect(estadoTiempoEncomienda({ ...row, llegada_aprox: null }, ahora).texto).toContain("sin hora prevista");
});

test("cuenta el recojo desde la llegada real, incluyendo dias y precision timestamp(5)", () => {
  expect(estadoTiempoEncomienda({ ...row, llegada_real: "2026-10-20 13:00:00.00000" }, ahora).texto)
    .toBe("Espera recojo: 1 d 2 h 30 min");
});

test("cierra la espera al entregar y no atribuye retraso a una encomienda entregada", () => {
  const entregada = { ...row, llegada_real: "2026-10-20 13:00:00", entrega_fecha: "2026-10-20 14:15:00" };
  expect(estadoTiempoEncomienda(entregada, ahora).texto).toBe("Recojo en 1 h 15 min");
  expect(estadoTiempoEncomienda({ ...row, entrega_fecha: entregada.entrega_fecha }, ahora).texto).toBe("Entregada");
});

test("señala una llegada futura sin producir espera negativa", () => {
  expect(estadoTiempoEncomienda({ ...row, llegada_real: "2026-10-22 13:00:00" }, ahora).texto)
    .toBe("Verificar fecha de llegada");
});

test("conserva el dia SQL cerca de medianoche sin atrasar ni adelantar la fecha", () => {
  const medianoche = tiempoServidor("2026-10-22 00:10:00");
  expect(estadoTiempoEncomienda({ llegada_real: "2026-10-21 23:50:00" }, medianoche).texto)
    .toBe("Espera recojo: 20 min");
  expect(estadoTiempoEncomienda({ r_fecemi: "2026-10-22", llegada_aprox: "00:05:00" }, medianoche).texto)
    .toBe("Sin llegada · retraso 5 min");
});

test("el reloj del equipo desajustado no modifica la referencia del servidor", () => {
  const relojEquipo = jest.spyOn(Date, "now").mockReturnValue(0);
  try {
    const referencia = tiempoServidor("2026-10-21 15:00:00.000", 30 * 60000);
    expect(estadoTiempoEncomienda(row, referencia).texto).toBe("Sin llegada · retraso 1 h 30 min");
    relojEquipo.mockReturnValue(9999999999999);
    expect(estadoTiempoEncomienda(row, referencia).texto).toBe("Sin llegada · retraso 1 h 30 min");
  } finally {
    relojEquipo.mockRestore();
  }
});

test("sin reloj del servidor no inventa retrasos usando el reloj del equipo", () => {
  expect(tiempoServidor(undefined)).toBeNull();
  expect(estadoTiempoEncomienda(row).texto).toBe("Hora del servidor no disponible");
});

test("calcula cambios de mes, año y dia bisiesto con los valores naturales", () => {
  expect(estadoTiempoEncomienda({ llegada_real: "2025-12-31 23:50:00", entrega_fecha: "2026-01-01 00:10:00" }).texto)
    .toBe("Recojo en 20 min");
  expect(estadoTiempoEncomienda({ llegada_real: "2024-02-28 23:50:00", entrega_fecha: "2024-03-01 00:10:00" }).texto)
    .toBe("Recojo en 1 d 20 min");
  expect(llegadaPrevista({ r_fecemi: "2026-02-29", llegada_aprox: "12:00:00" })).toBe("");
});
