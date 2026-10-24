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
  mostrarAnuladas = false,
  destinoTrabajo = "",
}) {
  const [registros, setRegistros] = useState([]);
  const [tablaBase, setTablaBase] = useState([]);
  const [anuladasBase, setAnuladasBase] = useState([]);
  const [valorBusqueda, setValorBusqueda] = useState("");
  const [loading, setLoading] = useState(false);
  const [destinosPeriodo, setDestinosPeriodo] = useState([]);
  const cantidadAnuladas = anuladasBase.filter((item) => (
    !destinoTrabajo || String(item.id_punto_venta_dest ?? "") === destinoTrabajo
  )).length;

  const data = useMemo(() => registros
    .filter((item) => !destinoTrabajo || String(item.id_punto_venta_dest ?? "") === destinoTrabajo)
    .map(normalizarOperacion), [registros, destinoTrabajo]);

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
      setAnuladasBase([]);
      setDestinosPeriodo([]);
      return;
    }

    setLoading(true);
    try {
      const url = puntoVentaTrabajo
        ? `${back_host}/mve_transventa/${periodoTrabajo}/${params.id_anfitrion}/${contabilidadTrabajo}/${diaSel}/${puntoVentaTrabajo}`
        : `${back_host}/mve_transventa/${periodoTrabajo}/${params.id_anfitrion}/${contabilidadTrabajo}/${diaSel}`;

      const cargarRows = async (estadoQuery = "", incluirDestinos = false) => {
        const query = new URLSearchParams(estadoQuery.replace(/^\?/, ""));
        if (incluirDestinos && tipoOperacionFijo === "E") query.set("destinos_periodo", "1");
        const queryTexto = query.toString();
        const response = await fetch(`${url}${queryTexto ? `?${queryTexto}` : ""}`);
        const result = await response.json();
        if (incluirDestinos) setDestinosPeriodo(Array.isArray(result?.meta?.destinos_periodo) ? result.meta.destinos_periodo : []);
        const rows = (Array.isArray(result?.data) ? result.data : [])
          .filter((item) => item.tipo_operacion === tipoOperacionFijo);

        return filtrarPorPuntoVenta(rows, puntoVentaTrabajo)
          .map((item) => ({
            ...item,
            _textoBusqueda: crearIndiceBusqueda(item),
          }));
      };

      const estadoQuery = mostrarAnuladas ? "?estado=anulados" : "";
      const rowsPorPunto = await cargarRows(estadoQuery, true);
      setTablaBase(rowsPorPunto);
      setRegistros(rowsPorPunto);

      if (tipoOperacionFijo === "E") {
        const anuladas = mostrarAnuladas ? rowsPorPunto : await cargarRows("?estado=anulados");
        setAnuladasBase(anuladas.filter((item) => Number(item.registrado ?? 1) === 0));
      } else {
        setAnuladasBase([]);
      }
    } catch (error) {
      console.log("Error cargando operaciones de transporte:", error);
      setRegistros([]);
      setTablaBase([]);
      setAnuladasBase([]);
      setDestinosPeriodo([]);
    } finally {
      setLoading(false);
    }
  }, [back_host, contabilidadTrabajo, diaSel, filtrarPorPuntoVenta, mostrarAnuladas, params.id_anfitrion, periodoTrabajo, puntoVentaTrabajo, tipoOperacionFijo]);

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
    destinosPeriodo,
    valorBusqueda,
    setValorBusqueda,
    loading,
    cantidadAnuladas,
    cargarRegistros,
    aplicarBusquedaLocal,
    quitarOperacionLocal,
  };
}
