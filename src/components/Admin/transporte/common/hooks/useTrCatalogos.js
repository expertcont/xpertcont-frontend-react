import { useCallback, useState } from "react";

// Centraliza los catalogos que alimentan cabecera y modal de transporte.
export default function useTrCatalogos({
  back_host,
  params,
  contabilidadTrabajo,
  tipoOperacionFijo,
  puntoVentaTrabajo,
  setPuntoVentaTrabajo,
}) {
  const [periodoSelect, setPeriodoSelect] = useState([]);
  const [contabilidadSelect, setContabilidadSelect] = useState([]);
  const [rutasDisponibles, setRutasDisponibles] = useState([]);
  const [placasDisponibles, setPlacasDisponibles] = useState([]);
  const [licenciasDisponibles, setLicenciasDisponibles] = useState([]);
  const [zonasDisponibles, setZonasDisponibles] = useState([]);
  const [puntosVentaAsignados, setPuntosVentaAsignados] = useState([]);

  const cargarPeriodos = useCallback(async (periodoPreferido, setPeriodoTrabajo) => {
    try {
      const response = await fetch(`${back_host}/usuario/periodos/${params.id_anfitrion}`);
      const result = await response.json();
      const periodos = Array.isArray(result) ? result : [];
      const periodoFinal = periodoPreferido || periodos[0]?.periodo || params.periodo || "";

      setPeriodoSelect(periodos);
      setPeriodoTrabajo(periodoFinal);
      if (periodoFinal) {
        sessionStorage.setItem("periodo_trabajo", periodoFinal);
      }
    } catch (error) {
      console.log("Error cargando periodos transporte:", error);
      setPeriodoTrabajo(periodoPreferido || params.periodo || "");
    }
  }, [back_host, params.id_anfitrion, params.periodo]);

  const cargarContabilidades = useCallback(async (documentoPreferido, setContabilidadTrabajo) => {
    try {
      const response = await fetch(`${back_host}/usuario/contabilidades/${params.id_anfitrion}/${params.id_invitado}`);
      const result = await response.json();
      const contabilidades = Array.isArray(result) ? result : [];
      const documentoFinal = documentoPreferido || contabilidades[0]?.documento_id || params.documento_id || "";

      setContabilidadSelect(contabilidades);
      setContabilidadTrabajo(documentoFinal);
      if (documentoFinal) {
        sessionStorage.setItem("contabilidad_trabajo", documentoFinal);
        const seleccionada = contabilidades.find(item => item.documento_id === documentoFinal);
        if (seleccionada?.razon_social) {
          sessionStorage.setItem("contabilidad_nombre", seleccionada.razon_social);
        }
      }
    } catch (error) {
      console.log("Error cargando contabilidades transporte:", error);
      setContabilidadTrabajo(documentoPreferido || params.documento_id || "");
    }
  }, [back_host, params.id_anfitrion, params.id_invitado, params.documento_id]);

  const cargarPuntosVentaAsignados = useCallback(async () => {
    if (!contabilidadTrabajo) {
      setPuntosVentaAsignados([]);
      setPuntoVentaTrabajo("");
      return;
    }

    try {
      const response = await fetch(`${back_host}/mad_punto_venta_usuario/${params.id_anfitrion}/${contabilidadTrabajo}/${params.id_invitado}`);
      const result = await response.json();
      const rows = Array.isArray(result?.data) ? result.data : [];
      const sessionKey = `punto_venta_trabajo_${params.id_anfitrion}_${contabilidadTrabajo}_${params.id_invitado}`;
      const puntoGuardado = sessionStorage.getItem(sessionKey);
      const puntoFinal = rows.some((item) => item.id_punto_venta === puntoGuardado)
        ? puntoGuardado
        : rows[0]?.id_punto_venta || "";

      setPuntosVentaAsignados(rows);
      setPuntoVentaTrabajo(puntoFinal);
      if (puntoFinal) {
        sessionStorage.setItem(sessionKey, puntoFinal);
      }
    } catch (error) {
      console.log("Error cargando puntos de venta asignados:", error);
      setPuntosVentaAsignados([]);
      setPuntoVentaTrabajo("");
    }
  }, [back_host, contabilidadTrabajo, params.id_anfitrion, params.id_invitado, setPuntoVentaTrabajo]);

  const cargarRutas = useCallback(async () => {
    if (!contabilidadTrabajo) {
      setRutasDisponibles([]);
      return;
    }

    try {
      const rutasUrl = tipoOperacionFijo === "B"
        ? `${back_host}/mve_transruta/${params.id_anfitrion}/${contabilidadTrabajo}?solo_pasaje=true`
        : `${back_host}/mve_transruta/encomiendas/${params.id_anfitrion}/${contabilidadTrabajo}`;
      const response = await fetch(rutasUrl);
      const result = await response.json();
      const rows = Array.isArray(result?.data)
        ? result.data.filter((item) => (
          item.activo !== false &&
          (!puntoVentaTrabajo || item.id_punto_venta === puntoVentaTrabajo)
        ))
        : [];
      setRutasDisponibles(rows);
    } catch (error) {
      console.log("Error cargando rutas disponibles:", error);
      setRutasDisponibles([]);
    }
  }, [back_host, contabilidadTrabajo, params.id_anfitrion, puntoVentaTrabajo, tipoOperacionFijo]);

  const cargarPlacas = useCallback(async () => {
    if (!contabilidadTrabajo) {
      setPlacasDisponibles([]);
      return;
    }

    try {
      const response = await fetch(`${back_host}/mve_transplaca/${params.id_anfitrion}/${contabilidadTrabajo}`);
      const result = await response.json();
      setPlacasDisponibles(Array.isArray(result?.data) ? result.data : []);
    } catch (error) {
      console.log("Error cargando placas disponibles:", error);
      setPlacasDisponibles([]);
    }
  }, [back_host, contabilidadTrabajo, params.id_anfitrion]);

  const cargarLicencias = useCallback(async () => {
    if (!contabilidadTrabajo) {
      setLicenciasDisponibles([]);
      return;
    }

    try {
      const response = await fetch(`${back_host}/mve_translicencia/${params.id_anfitrion}/${contabilidadTrabajo}`);
      const result = await response.json();
      setLicenciasDisponibles(Array.isArray(result?.data) ? result.data : []);
    } catch (error) {
      console.log("Error cargando licencias disponibles:", error);
      setLicenciasDisponibles([]);
    }
  }, [back_host, contabilidadTrabajo, params.id_anfitrion]);

  const cargarZonas = useCallback(async () => {
    if (!contabilidadTrabajo) {
      setZonasDisponibles([]);
      return;
    }

    try {
      const response = await fetch(`${back_host}/mve_transzona/${params.id_anfitrion}/${contabilidadTrabajo}`);
      const result = await response.json();
      setZonasDisponibles(Array.isArray(result?.data) ? result.data : []);
    } catch (error) {
      console.log("Error cargando zonas disponibles:", error);
      setZonasDisponibles([]);
    }
  }, [back_host, contabilidadTrabajo, params.id_anfitrion]);

  return {
    periodoSelect,
    contabilidadSelect,
    setContabilidadSelect,
    rutasDisponibles,
    placasDisponibles,
    licenciasDisponibles,
    zonasDisponibles,
    puntosVentaAsignados,
    setPuntosVentaAsignados,
    cargarPeriodos,
    cargarContabilidades,
    cargarPuntosVentaAsignados,
    cargarRutas,
    cargarPlacas,
    cargarLicencias,
    cargarZonas,
  };
}
