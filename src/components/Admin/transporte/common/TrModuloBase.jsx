import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DataTable, { createTheme } from "react-data-table-component";
import { Box } from "@mui/material";
import { Search, Truck } from "lucide-react";
import swal2 from "sweetalert2";

import DaySelector from "../../AdminDias";
import { useDialog } from "../../AdminConfirmDialogProvider";
import palette from "../../../../theme/palette";
import TrBoletoModal from "../TrBoletoModal";
import TrEncomiendaModal from "../encomienda/modal/TrEncomiendaModal";
import TrHeader from "./components/TrHeader";
import TrFiltros from "./components/TrFiltros";
import { createColumns, customStyles } from "./components/TrOperacionRow";
import useTrCatalogos from "./hooks/useTrCatalogos";
import useTrOperaciones from "./hooks/useTrOperaciones";
import SunatResumenIcon from "../../../../assets/images/sunat0.png";

// Tema oscuro propio de las tablas del modulo transporte.
createTheme(
  "transportesDark",
  {
    text: { primary: palette.text, secondary: palette.accent },
    background: { default: "transparent" },
    context: { background: palette.accent, text: palette.onAccent },
    divider: { default: palette.borderSoft },
    action: {
      button: palette.muted,
      hover: palette.accentSoft,
      disabled: palette.border,
    },
  },
  "dark",
);

const resumenSunatButtonSx = (ok = false, pending = false) => ({
  ml: "auto",
  mb: 1.25,
  width: { xs: "100%", sm: "auto" },
  minHeight: 38,
  px: 1.35,
  borderRadius: palette.radius.control,
  border: `1px solid ${ok ? "rgba(146,214,173,0.38)" : pending ? "rgba(232,198,109,0.38)" : palette.border}`,
  backgroundColor: ok ? palette.successSoft : pending ? palette.warningSoft : palette.chip,
  color: ok ? palette.success : pending ? palette.warning : palette.muted,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 0.85,
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: 0,
  transition: "all .18s ease",
  "&:hover": {
    backgroundColor: ok ? palette.successSoft : "rgba(37,99,235,0.14)",
    borderColor: ok ? "rgba(146,214,173,0.52)" : "rgba(77,163,255,0.34)",
    color: ok ? palette.success : "#8fc7ff",
  },
});

const fechaHoyLima = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
};

export default function TrModuloBase({
  tipoOperacionFijo = "E",
  titulo = "Control de Encomiendas",
  contadorTexto = "encomiendas registradas",
  nuevoTexto = "Nueva encomienda",
  buscarTexto = "Buscar encomienda...",
  modalNuevoTitulo = "Nueva encomienda",
  modalEditarTitulo = "Editar encomienda",
  sinDatosTexto = "Sin encomiendas para el filtro actual",
  footerTexto = "Encomiendas de transporte registradas en mve_transventa.",
  basePath = "/ad_transportesencomienda",
}) {
  /*
    Componente base del modulo.

    Este componente se reutiliza para:
    - Encomiendas: tipoOperacionFijo = "E"
    - Boletos: tipoOperacionFijo = "B"

    Flujo general:
    1. Lee parametros de ruta y recupera periodo/empresa desde sessionStorage.
    2. Carga catalogos necesarios para la cabecera y el modal.
    3. Carga mve_transventa y filtra por tipo de operacion.
    4. Renderiza cabecera, filtros, selector de dia, tabla y modal correspondiente.
  */
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
  const params = useParams();
  const navigate = useNavigate();
  const { confirmDialog } = useDialog();

  // -----------------------------
  // Estado principal de pantalla
  // -----------------------------

  const [diaSel, setDiaSel] = useState("*");
  const [periodoTrabajo, setPeriodoTrabajo] = useState("");
  const [contabilidadTrabajo, setContabilidadTrabajo] = useState("");
  const [puntoVentaTrabajo, setPuntoVentaTrabajo] = useState("");
  const [colaResumenEncomiendas, setColaResumenEncomiendas] = useState([]);

  // updateTrigger fuerza recarga luego de guardar, eliminar o enviar a SUNAT.
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Estado del modal de alta/edicion.
  const [modalOperacionOpen, setModalOperacionOpen] = useState(false);
  const [operacionEditando, setOperacionEditando] = useState(null);
  const [guardandoOperacion, setGuardandoOperacion] = useState(false);
  const guardandoOperacionRef = useRef(false);

  // -----------------------------
  // Catalogos y operaciones
  // -----------------------------

  const {
    periodoSelect,
    contabilidadSelect,
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
  } = useTrCatalogos({
    back_host,
    params,
    contabilidadTrabajo,
    tipoOperacionFijo,
    puntoVentaTrabajo,
    setPuntoVentaTrabajo,
  });

  const {
    data,
    valorBusqueda,
    setValorBusqueda,
    loading,
    cargarRegistros,
    aplicarBusquedaLocal,
    quitarOperacionLocal,
  } = useTrOperaciones({
    back_host,
    params,
    periodoTrabajo,
    contabilidadTrabajo,
    diaSel,
    puntoVentaTrabajo,
    tipoOperacionFijo,
  });

  // Fecha enviada al modal. Si el filtro esta en "todos", usa hoy cuando pertenece al periodo.
  const fechaOperacion = useMemo(() => {
    if (!periodoTrabajo) {
      return "";
    }

    if (diaSel !== "*") {
      return `${periodoTrabajo}-${diaSel}`;
    }

    const hoy = fechaHoyLima();
    return hoy.startsWith(periodoTrabajo) ? hoy : `${periodoTrabajo}-01`;
  }, [diaSel, periodoTrabajo]);

  const encomiendasPendientesResumen = useMemo(() => {
    if (tipoOperacionFijo !== "E" || !diaSel || diaSel === "*") {
      return 0;
    }

    return data.filter((item) => {
      const codigo = String(item.r_cod_ref || item.r_cod || "");

      return codigo === "03" && !item.numero_rdi && !item.r_vfirmado;
    }).length;
  }, [data, diaSel, tipoOperacionFijo]);

  const estadosRdiAbiertos = useMemo(() => (
    ["PENDIENTE", "GENERADO", "ENVIADO", "INCIERTO", "ERROR"]
  ), []);
  const resumenesEncomiendaAbiertos = useMemo(() => (
    colaResumenEncomiendas.filter((item) => estadosRdiAbiertos.includes(String(item.estado || "").toUpperCase()))
  ), [colaResumenEncomiendas, estadosRdiAbiertos]);
  const totalPendienteResumenEncomiendas = encomiendasPendientesResumen + resumenesEncomiendaAbiertos.length;
  const resumenEncomiendasDiaOk = tipoOperacionFijo === "E" && Boolean(diaSel && diaSel !== "*") && totalPendienteResumenEncomiendas === 0;

  const cargarColaResumenEncomiendas = useCallback(async () => {
    if (tipoOperacionFijo !== "E" || !periodoTrabajo || !contabilidadTrabajo || !diaSel || diaSel === "*") {
      setColaResumenEncomiendas([]);
      return [];
    }

    const fechaResumen = `${periodoTrabajo}-${String(diaSel).padStart(2, "0")}`;
    try {
      const response = await fetch(`${back_host}/mve_transventa/cpe/resumen/${periodoTrabajo}/${params.id_anfitrion}/${contabilidadTrabajo}?origen=TRANS_ENCOMIENDA`);
      const result = await response.json();
      const dataResumen = Array.isArray(result?.data) ? result.data : [];
      const resumenesDia = dataResumen.filter((item) => String(item.fecha || "").substring(0, 10) === fechaResumen);
      setColaResumenEncomiendas(resumenesDia);
      return resumenesDia;
    } catch (error) {
      console.log("No se pudo cargar cola RDI de encomiendas:", error);
      setColaResumenEncomiendas([]);
      return [];
    }
  }, [back_host, contabilidadTrabajo, diaSel, params.id_anfitrion, periodoTrabajo, tipoOperacionFijo]);

  // -----------------------------
  // Efectos de carga y refresco
  // -----------------------------

  // Primera carga: periodo y empresa se recuperan desde sessionStorage o desde la URL.
  useEffect(() => {
    const periodoHistorial = sessionStorage.getItem("periodo_trabajo") || params.periodo;
    const contabilidadHistorial = sessionStorage.getItem("contabilidad_trabajo") || params.documento_id;

    cargarPeriodos(periodoHistorial, setPeriodoTrabajo);
    cargarContabilidades(contabilidadHistorial, setContabilidadTrabajo);
  }, [cargarContabilidades, cargarPeriodos, params.documento_id, params.periodo]);

  // Recarga operaciones cuando cambia periodo, empresa, dia, punto de venta o updateTrigger.
  useEffect(() => {
    cargarRegistros();
  }, [cargarRegistros, updateTrigger]);

  // Busqueda local: no vuelve al backend, solo filtra tablaBase.
  useEffect(() => {
    aplicarBusquedaLocal();
  }, [aplicarBusquedaLocal]);

  useEffect(() => {
    cargarColaResumenEncomiendas();
  }, [cargarColaResumenEncomiendas, updateTrigger]);

  // Catalogos dependientes de empresa o punto operativo.
  useEffect(() => {
    cargarPuntosVentaAsignados();
  }, [cargarPuntosVentaAsignados]);

  useEffect(() => {
    cargarRutas();
  }, [cargarRutas]);

  useEffect(() => {
    cargarPlacas();
  }, [cargarPlacas]);

  useEffect(() => {
    cargarLicencias();
  }, [cargarLicencias]);

  useEffect(() => {
    cargarZonas();
  }, [cargarZonas]);

  // -----------------------------
  // Handlers de filtros
  // -----------------------------

  const actualizaValorFiltro = (event) => {
    setValorBusqueda(event.target.value);
  };

  const handleDayFilter = (selectedDay) => {
    const dia = selectedDay === "*" ? "*" : selectedDay.toString().padStart(2, "0");
    setDiaSel(dia);
  };

  const handlePeriodoSelect = (periodo) => {
    setPeriodoTrabajo(periodo);
    sessionStorage.setItem("periodo_trabajo", periodo);
    setDiaSel("*");
  };

  const handleContabilidadSelect = (documentoId) => {
    if (documentoId === contabilidadTrabajo) {
      return;
    }

    setContabilidadTrabajo(documentoId);
    setPuntosVentaAsignados([]);
    setPuntoVentaTrabajo("");
    sessionStorage.setItem("contabilidad_trabajo", documentoId);
    const seleccionada = contabilidadSelect.find(item => item.documento_id === documentoId);
    if (seleccionada?.razon_social) {
      sessionStorage.setItem("contabilidad_nombre", seleccionada.razon_social);
    }
    navigate(`${basePath}/${params.id_anfitrion}/${params.id_invitado}/${periodoTrabajo}/${documentoId}`);
  };

  const handlePuntoVentaSelect = (puntoVenta) => {
    setPuntoVentaTrabajo(puntoVenta);
    const sessionKey = `punto_venta_trabajo_${params.id_anfitrion}_${contabilidadTrabajo}_${params.id_invitado}`;
    if (puntoVenta) {
      sessionStorage.setItem(sessionKey, puntoVenta);
    }
  };

  // -----------------------------
  // Handlers de operaciones
  // -----------------------------

  // Abre el modal en modo nuevo o edicion. Para encomiendas exige punto operativo.
  const solicitarOperacion = (operacion = null) => {
    if (!operacion && tipoOperacionFijo === "E" && !puntoVentaTrabajo) {
      swal2.fire({
        title: "Selecciona punto de venta",
        text: "Para emitir una encomienda primero selecciona un punto de venta.",
        icon: "warning",
        confirmButtonText: "ACEPTAR",
      });
      return;
    }

    setOperacionEditando(operacion);
    setModalOperacionOpen(true);
  };

  const cerrarModalOperacion = () => {
    if (guardandoOperacionRef.current) {
      return;
    }

    setModalOperacionOpen(false);
    setOperacionEditando(null);
  };

  // Une datos del modal con datos de ruta/usuario/periodo antes de enviar POST o PUT.
  const guardarOperacion = async (datosOperacion, opciones = {}) => {
    if (guardandoOperacionRef.current) {
      return;
    }

    guardandoOperacionRef.current = true;
    setGuardandoOperacion(true);

    const esEdicion = Boolean(operacionEditando);

    if (tipoOperacionFijo === "E" && !puntoVentaTrabajo) {
      guardandoOperacionRef.current = false;
      setGuardandoOperacion(false);
      swal2.fire({
        title: "Selecciona punto de venta",
        text: "Para guardar una encomienda primero selecciona un punto de venta.",
        icon: "warning",
        confirmButtonText: "ACEPTAR",
      });
      return;
    }

    const payload = {
      ...datosOperacion,
      id_usuario: params.id_anfitrion,
      id_anfitrion: params.id_anfitrion,
      id_invitado: params.id_invitado,
      documento_id: contabilidadTrabajo,
      periodo: periodoTrabajo,
      r_cod: esEdicion ? operacionEditando.r_cod : datosOperacion.r_cod,
      r_serie: esEdicion ? operacionEditando.r_serie : datosOperacion.r_serie,
      r_numero: esEdicion ? operacionEditando.r_numero : datosOperacion.r_numero,
      elemento: operacionEditando?.elemento || 1,
      cantidad: 1,
      ctrl_crea_us: params.id_invitado,
      ctrl_mod_us: params.id_invitado,
      fecha_servidor: !esEdicion && diaSel === "*",
    };

    try {
      const response = await fetch(`${back_host}/mve_transventa`, {
        method: esEdicion ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const dataResponse = await response.json();

      if (!response.ok || !dataResponse.success) {
        throw new Error(dataResponse.message || "No se pudo guardar la encomienda.");
      }

      if (!opciones.mantenerModalAbierto) {
        setModalOperacionOpen(false);
        setOperacionEditando(null);
      }
      setUpdateTrigger(Date.now());
      return dataResponse.data;
    } catch (error) {
      swal2.fire({
        title: "No se pudo guardar",
        text: error.message || "Error interno.",
        icon: "error",
        confirmButtonText: "ACEPTAR",
      });
      return null;
    } finally {
      guardandoOperacionRef.current = false;
      setGuardandoOperacion(false);
    }
  };

  // Elimina una operacion completa identificada por la llave de mve_transventa.
  const handleDelete = async (operacion) => {
    const result = await confirmDialog({
      title: "Eliminar operacion?",
      message: `${operacion.numero} - ${operacion.clienteLabel}`,
      icon: "warning",
      confirmText: "ELIMINAR",
      cancelText: "Cancelar",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const response = await fetch(`${back_host}/mve_transventa/${periodoTrabajo}/${params.id_anfitrion}/${contabilidadTrabajo}/${operacion.r_cod}/${operacion.r_serie}/${operacion.r_numero}/${operacion.elemento || 1}`, {
        method: "DELETE",
      });
      const dataResponse = await response.json();

      if (!response.ok || !dataResponse.success) {
        throw new Error(dataResponse.message || "No se pudo eliminar la operacion.");
      }

      quitarOperacionLocal(operacion);
    } catch (error) {
      swal2.fire({
        title: "No se pudo eliminar",
        text: error.message || "Error interno.",
        icon: "error",
        confirmButtonText: "ACEPTAR",
      });
    }
  };

  const handleEnviarSunat = async (operacion) => {
    if (operacion.tipo_operacion !== "E") {
      return;
    }

    if (operacion.numero_rdi) {
      await confirmDialog({
        title: "Encomienda en RDI",
        message: `Esta encomienda ya fue incluida en el RDI ${operacion.numero_rdi}. No corresponde envio individual.`,
        icon: "info",
        confirmText: "ACEPTAR",
      });
      return;
    }

    const result = await confirmDialog({
      title: "Enviar encomienda a SUNAT?",
      message: `${operacion.numero} - ${operacion.clienteLabel}`,
      icon: "warning",
      confirmText: "ENVIAR",
      cancelText: "CANCELAR",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const response = await fetch(`${back_host}/mve_transventa/cpe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodo: periodoTrabajo,
          id_anfitrion: params.id_anfitrion,
          id_usuario: params.id_anfitrion,
          id_invitado: params.id_invitado,
          documento_id: contabilidadTrabajo,
          r_cod: operacion.r_cod,
          r_serie: operacion.r_serie,
          r_numero: operacion.r_numero,
          elemento: operacion.elemento || 1,
          ctrl_mod_us: params.id_invitado,
        }),
      });
      const dataResponse = await response.json();

      if (!response.ok || dataResponse.success === false) {
        throw new Error(
          dataResponse.mensaje_usuario ||
          dataResponse.respuesta_sunat_descripcion ||
          dataResponse.message ||
          "No se pudo enviar la encomienda a SUNAT."
        );
      }

      await swal2.fire({
        title: dataResponse.titulo_usuario || "Encomienda enviada",
        text: dataResponse.mensaje_usuario || dataResponse.respuesta_sunat_descripcion || "SUNAT proceso la encomienda.",
        icon: dataResponse.nivel === "ACEPTADO" ? "success" : "info",
        confirmButtonText: "ACEPTAR",
      });
      setUpdateTrigger(Date.now());
    } catch (error) {
      swal2.fire({
        title: "No se pudo enviar a SUNAT",
        text: error.message || "Error interno.",
        icon: "error",
        confirmButtonText: "ACEPTAR",
      });
    }
  };

  const handleEnviarResumenEncomiendas = async () => {
    if (tipoOperacionFijo !== "E") {
      return;
    }

    if (!periodoTrabajo || !contabilidadTrabajo) {
      await confirmDialog({
        title: "Faltan datos",
        message: "Selecciona periodo y contabilidad antes de enviar el resumen.",
        icon: "warning",
        confirmText: "ACEPTAR",
      });
      return;
    }

    if (!diaSel || diaSel === "*") {
      await confirmDialog({
        title: "Selecciona un dia",
        message: "El RDI de encomiendas se envia por dia. Primero elige un dia en el calendario.",
        icon: "warning",
        confirmText: "ACEPTAR",
      });
      return;
    }

    const fechaResumen = `${periodoTrabajo}-${String(diaSel).padStart(2, "0")}`;
    const colaDia = await cargarColaResumenEncomiendas();
    const abiertosDia = colaDia.filter((item) => estadosRdiAbiertos.includes(String(item.estado || "").toUpperCase()));
    const totalPendienteActual = encomiendasPendientesResumen + abiertosDia.length;
    const result = await confirmDialog({
      title: "Enviar RDI de encomiendas?",
      message: [
        `Empresa: ${contabilidadTrabajo}`,
        `Fecha: ${fechaResumen}`,
        puntoVentaTrabajo ? `Punto venta: ${puntoVentaTrabajo}` : "Punto venta: todos",
        `Encomiendas nuevas sin RDI: ${encomiendasPendientesResumen}`,
        `Resumenes abiertos en cola: ${abiertosDia.length}`,
        ...abiertosDia.map((item, index) => (
          `${index + 1}. ${item.numero_rdi} - ${item.estado || "PENDIENTE"} - ${item.cantidad_boletas || 0} encomiendas${item.ticket ? ` - Ticket: ${item.ticket}` : ""}`
        )),
      ].join("\n"),
      icon: totalPendienteActual > 0 ? "success" : "info",
      confirmText: totalPendienteActual > 0 ? "ENVIAR" : "ACEPTAR",
      cancelText: "CANCELAR",
    });

    if (!result.isConfirmed || totalPendienteActual === 0) {
      return;
    }

    try {
      const response = await fetch(`${back_host}/mve_transventa/cpe/resumen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodo: periodoTrabajo,
          id_anfitrion: params.id_anfitrion,
          id_usuario: params.id_anfitrion,
          id_invitado: params.id_invitado,
          documento_id: contabilidadTrabajo,
          fecha_documentos: fechaResumen,
          id_punto_venta: puntoVentaTrabajo || undefined,
          tipo_operacion: "E",
          solo_payload: false,
          ctrl_mod_us: params.id_invitado,
        }),
      });
      const dataResponse = await response.json();

      if (!response.ok || dataResponse.success === false) {
        throw new Error(
          dataResponse.mensaje_usuario ||
          dataResponse.respuesta_sunat_descripcion ||
          dataResponse.message ||
          "No se pudo enviar el RDI de encomiendas."
        );
      }

      await confirmDialog({
        title: "RDI de encomiendas enviado",
        message: [
          dataResponse.numero_rdi || "RDI generado",
          `Fecha: ${fechaResumen}`,
          `${dataResponse.cantidad || dataResponse.total_documentos || 0} encomiendas incluidas.`,
          dataResponse.ticket ? `Ticket: ${dataResponse.ticket}` : null,
          dataResponse.nombre_archivo ? `Archivo: ${dataResponse.nombre_archivo}` : null,
          dataResponse.mensaje_usuario || dataResponse.respuesta_sunat_descripcion || null,
        ].filter(Boolean).join("\n"),
        icon: "success",
        confirmText: "ACEPTAR",
      });
      cargarColaResumenEncomiendas();
      setUpdateTrigger(Date.now());
    } catch (error) {
      await confirmDialog({
        title: "No se pudo enviar el RDI",
        message: error.message || "Error interno.",
        icon: "error",
        confirmText: "ACEPTAR",
      });
    }
  };

  // -----------------------------
  // Renderizado del formulario
  // -----------------------------

  return (
    <Box sx={{ minHeight: "100%", backgroundColor: "transparent", p: { xs: 1, md: 4 } }}>
      <Box sx={{ maxWidth: 980, mx: "auto" }}>
        <TrHeader
          titulo={titulo}
          contador={data.length}
          contadorTexto={contadorTexto}
          nuevoTexto={nuevoTexto}
          buscarTexto={buscarTexto}
          valorBusqueda={valorBusqueda}
          nuevoDeshabilitado={tipoOperacionFijo === "E" && !puntoVentaTrabajo}
          onNuevo={() => solicitarOperacion()}
          onBuscar={actualizaValorFiltro}
        />

        {tipoOperacionFijo === "E" && (
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Box
              onClick={handleEnviarResumenEncomiendas}
              sx={resumenSunatButtonSx(resumenEncomiendasDiaOk, totalPendienteResumenEncomiendas > 0)}
              title={resumenEncomiendasDiaOk ? "Todo OK: sin encomiendas pendientes" : `Enviar RDI de encomiendas (${totalPendienteResumenEncomiendas})`}
            >
              <Box
                component="img"
                src={SunatResumenIcon}
                alt="Resumen SUNAT"
                sx={{ width: 24, height: 24, objectFit: "contain", display: "block" }}
              />
              {resumenEncomiendasDiaOk ? "RDI OK" : `RDI encomiendas (${totalPendienteResumenEncomiendas})`}
            </Box>
          </Box>
        )}

        <TrFiltros
          periodoTrabajo={periodoTrabajo}
          periodoSelect={periodoSelect}
          contabilidadTrabajo={contabilidadTrabajo}
          contabilidadSelect={contabilidadSelect}
          puntosVentaAsignados={puntosVentaAsignados}
          puntoVentaTrabajo={puntoVentaTrabajo}
          onPeriodoSelect={handlePeriodoSelect}
          onContabilidadSelect={handleContabilidadSelect}
          onPuntoVentaSelect={handlePuntoVentaSelect}
        />

        <DaySelector period={periodoTrabajo || params.periodo} onDaySelect={handleDayFilter} />

        <DataTable
          theme="transportesDark"
          columns={createColumns({
            onEdit: solicitarOperacion,
            onDelete: handleDelete,
            onEnviarSunat: handleEnviarSunat,
            sunatContext: {
              backHost: back_host,
              documentoId: contabilidadTrabajo,
              periodoTrabajo,
              idAnfitrion: params.id_anfitrion,
              contabilidadTrabajo,
              cpeRequestExtra: {
                id_invitado: params.id_invitado,
                ctrl_mod_us: params.id_invitado,
              },
              onRefresh: () => setUpdateTrigger(Date.now()),
            },
          })}
          data={data}
          progressPending={loading}
          pagination
          paginationPerPage={10}
          highlightOnHover
          responsive
          customStyles={customStyles}
          noDataComponent={
            <Box sx={{ py: 4, color: palette.muted, display: "flex", alignItems: "center", gap: 1 }}>
              <Search size={16} />
              {sinDatosTexto}
            </Box>
          }
        />

        {tipoOperacionFijo === "E" && (
          <TrEncomiendaModal
            open={modalOperacionOpen}
            back_host={back_host}
            idAnfitrion={params.id_anfitrion}
            documentoId={contabilidadTrabajo}
            operacion={operacionEditando}
            periodoTrabajo={periodoTrabajo}
            fechaOperacion={fechaOperacion}
            rutasDisponibles={rutasDisponibles}
            puntoVentaOrigen={puntoVentaTrabajo}
            puntoVentaOrigenNombre={puntosVentaAsignados.find((item) => item.id_punto_venta === puntoVentaTrabajo)?.nombre || puntoVentaTrabajo}
            zonasDisponibles={zonasDisponibles}
            placasDisponibles={placasDisponibles}
            licenciasDisponibles={licenciasDisponibles}
            modalNuevoTitulo={modalNuevoTitulo}
            modalEditarTitulo={modalEditarTitulo}
            onClose={cerrarModalOperacion}
            onSubmit={guardarOperacion}
            guardando={guardandoOperacion}
          />
        )}

        {tipoOperacionFijo === "B" && (
          <TrBoletoModal
            open={modalOperacionOpen}
            operacion={operacionEditando}
            periodoTrabajo={periodoTrabajo}
            fechaOperacion={fechaOperacion}
            rutasDisponibles={rutasDisponibles}
            modalNuevoTitulo={modalNuevoTitulo}
            modalEditarTitulo={modalEditarTitulo}
            onClose={cerrarModalOperacion}
            onSubmit={guardarOperacion}
            guardando={guardandoOperacion}
          />
        )}

        {footerTexto && (
          <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1, color: palette.muted, fontSize: "12px" }}>
            <Truck size={14} />
            {footerTexto}
          </Box>
        )}
      </Box>
    </Box>
  );
}
