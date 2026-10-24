import { act, renderHook } from "@testing-library/react";
import useTrOperaciones from "../useTrOperaciones";

const props = {
  back_host: "https://backend.example", params: { id_anfitrion: "U" },
  periodoTrabajo: "2026-10", contabilidadTrabajo: "D", diaSel: "*",
  puntoVentaTrabajo: "ORIGEN", tipoOperacionFijo: "E", destinoTrabajo: "",
};
const destinos = [
  { id_punto_venta_dest: "V", nombre: "Vitor" },
  { id_punto_venta_dest: "L", nombre: "Lima" },
];
const rows = [
  { r_numero: "1", tipo_operacion: "E", id_punto_venta: "ORIGEN", id_punto_venta_dest: "V", cliente: "JUAN PEREZ", nombre_ruta: "ORIGEN - VITOR" },
  { r_numero: "2", tipo_operacion: "E", id_punto_venta: "ORIGEN", id_punto_venta_dest: "L", cliente: "JUAN VITOR", nombre_ruta: "ORIGEN - LIMA" },
];
const originalFetch = global.fetch;
beforeEach(() => {
  global.fetch = jest.fn(async (url) => ({ json: async () => ({
    data: String(url).includes("estado=anulados") ? rows.map((row) => ({ ...row, registrado: 0 })) : rows,
    meta: { destinos_periodo: String(url).includes("/23/") ? [destinos[1]] : destinos },
  }) }));
});
afterEach(() => { global.fetch = originalFetch; });

test("Todos conserva ambos registros y el destino exacto excluye apellidos coincidentes", async () => {
  const { result, rerender } = renderHook((values) => useTrOperaciones(values), { initialProps: props });
  await act(async () => { await result.current.cargarRegistros(); });
  expect(result.current.data).toHaveLength(2);
  expect(result.current.destinosPeriodo).toEqual(destinos);
  rerender({ ...props, destinoTrabajo: "V" });
  expect(result.current.data.map((row) => row.r_numero)).toEqual(["1"]);
  expect(result.current.cantidadAnuladas).toBe(1);
  rerender(props);
  expect(result.current.data).toHaveLength(2);
});

test("la busqueda no reduce opciones y el calendario carga los destinos del dia", async () => {
  const { result, rerender } = renderHook((values) => useTrOperaciones(values), { initialProps: props });
  await act(async () => { await result.current.cargarRegistros(); });
  act(() => result.current.setValorBusqueda("JUAN VITOR"));
  act(() => result.current.aplicarBusquedaLocal());
  expect(result.current.data.map((row) => row.r_numero)).toEqual(["2"]);
  rerender({ ...props, destinoTrabajo: "V" });
  expect(result.current.data).toHaveLength(0);
  expect(result.current.destinosPeriodo).toEqual(destinos);
  rerender({ ...props, destinoTrabajo: "L", diaSel: "23" });
  await act(async () => { await result.current.cargarRegistros(); });
  expect(result.current.destinosPeriodo).toEqual([destinos[1]]);
  expect(global.fetch.mock.calls[2][0]).toContain("/23/ORIGEN?destinos_periodo=1");
});
