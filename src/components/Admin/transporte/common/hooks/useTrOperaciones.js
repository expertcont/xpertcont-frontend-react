import { useCallback, useMemo, useState } from "react";

import {
  crearIndiceBusqueda,
  normalizarOperacion,
  normalizarTextoBusqueda,
} from "../utils/trUtils";

// Maneja la data transaccional de mve_transventa: carga, filtro local y forma visual.
export default function useTrOperaciones({
  back_host,
  params,
  periodoTrabajo,
  contabilidadTrabajo,
  diaSel,
  puntoVentaTrabajo,
  tipoOperacionFijo,
}) {
  const [registros, setRegistros] = useState([]);
  const [tablaBase, setTablaBase] = useState([]);
  const [valorBusqueda, setValorBusqueda] = useState("");
  const [loading, setLoading] = useState(false);

  const data = useMemo(() => registros.map(normalizarOperacion), [registros]);

  const filtrarPorPuntoVenta = useCallback((rows, puntoVenta) => {
    if (!puntoVenta) {
      return rows;
    }

    return rows.filter((item) => (
      item.id_punto_venta === puntoVenta ||
      item.id_punto_venta_dest === puntoVenta
    ));
  }, []);

  const filtrarPorTexto = useCallback((rows, texto) => {
    const busqueda = normalizarTextoBusqueda(texto).trim();

    if (!busqueda) {
      return rows;
    }

    return rows.filter((item) => item._textoBusqueda?.includes(busqueda));
  }, []);

  const cargarRegistros = useCallback(async () => {
    if (!periodoTrabajo || !contabilidadTrabajo) {
      setRegistros([]);
      setTablaBase([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${back_host}/mve_transventa/${periodoTrabajo}/${params.id_anfitrion}/${contabilidadTrabajo}/${diaSel}`);
      const result = await response.json();
      const rows = (Array.isArray(result?.data) ? result.data : [])
        .filter((item) => item.tipo_operacion === tipoOperacionFijo);
      const rowsPorPunto = filtrarPorPuntoVenta(rows, puntoVentaTrabajo)
        .map((item) => ({
          ...item,
          _textoBusqueda: crearIndiceBusqueda(item),
        }));
      setTablaBase(rowsPorPunto);
      setRegistros(rowsPorPunto);
    } catch (error) {
      console.log("Error cargando operaciones de transporte:", error);
      setRegistros([]);
      setTablaBase([]);
    } finally {
      setLoading(false);
    }
  }, [back_host, contabilidadTrabajo, diaSel, filtrarPorPuntoVenta, params.id_anfitrion, periodoTrabajo, puntoVentaTrabajo, tipoOperacionFijo]);

  const aplicarBusquedaLocal = useCallback(() => {
    setRegistros(filtrarPorTexto(tablaBase, valorBusqueda));
  }, [filtrarPorTexto, tablaBase, valorBusqueda]);

  const quitarOperacionLocal = useCallback((operacion) => {
    const mismoRegistro = (item) => (
      item.r_cod === operacion.r_cod &&
      item.r_serie === operacion.r_serie &&
      item.r_numero === operacion.r_numero &&
      Number(item.elemento || 1) === Number(operacion.elemento || 1)
    );

    setRegistros(prev => prev.filter(item => !mismoRegistro(item)));
    setTablaBase(prev => prev.filter(item => !mismoRegistro(item)));
  }, []);

  return {
    registros,
    data,
    valorBusqueda,
    setValorBusqueda,
    loading,
    cargarRegistros,
    aplicarBusquedaLocal,
    quitarOperacionLocal,
  };
}
