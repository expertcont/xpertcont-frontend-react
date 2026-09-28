import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DataTable from "react-data-table-component";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloudSyncIcon from "@mui/icons-material/CloudSync";
import SummarizeIcon from "@mui/icons-material/Summarize";
import { Search, Truck } from "lucide-react";
import swal2 from "sweetalert2";

import DaySelector from "../../AdminDias";
import { useDialog } from "../../AdminConfirmDialogProvider";
import palette from "../../../../theme/palette";
import TrBoletoModal from "../TrBoletoModal";
import TrEncomiendaModal from "../encomienda/modal/TrEncomiendaModal";
import TrHeader from "./components/TrHeader";
import TrFiltros from "./components/TrFiltros";
import TrRdiProgresoModal from "./TrRdiProgresoModal";
import { createColumns, customStyles, customStylesEncomienda, customStylesEncomiendaPanoramica, operacionProtegidaSunat } from "./components/TrOperacionRow";
import useTrCatalogos from "./hooks/useTrCatalogos";
import useTrOperaciones from "./hooks/useTrOperaciones";
import { imprimirTicketEncomienda } from "./utils/trEncomiendaTicketPrint";
import { consultarTicketRdiSunat, normalizarRdiResponse } from "../../venta/common/rdiSunatActions";
import SunatResumenIcon from "../../../../assets/images/sunat0.png";

// Tema oscuro propio de las tablas del modulo transporte.
import "./trDataTableTheme";

// Boton de envio del Resumen Diario. Mismo diseno que el de ventas
// comerciales: solo el logo de SUNAT con un distintivo que marca el estado del dia,
// sin texto, para no robarle ancho a la barra de filtros.
const resumenSunatButtonSx = (ok = false, pending = false) => ({
  width: 42,
  height: 42,
  flexShrink: 0,
  p: 0,
  borderRadius: palette.radius.control,
  border: `1px solid ${ok ? palette.success : pending ? palette.warning : palette.border}`,
  backgroundColor: palette.chip,
  color: ok ? palette.success : pending ? palette.warning : palette.muted,
  transition: "background-color .18s ease, color .18s ease, border-color .18s ease",
  "&:hover": {
    backgroundColor: ok ? palette.successSoft : pending ? palette.warningSoft : palette.accentSoft,
    borderColor: ok ? palette.success : pending ? palette.warning : palette.accent,
    color: ok ? palette.success : pending ? palette.warning : palette.accent,
  },
});

const resumenSunatIconSx = {
  position: "relative",
  width: 28,
  height: 28,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  "& img": {
    width: 22,
    height: 22,
    objectFit: "contain",
    display: "block",
  },
  "& .resumen-badge": {
    position: "absolute",
    right: -2,
    bottom: -1,
    width: 13,
    height: 13,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.surface,
    border: `1px solid ${palette.accent}`,
    color: palette.accent,
  },
  "& .resumen-badge.ok": {
    borderColor: palette.success,
    color: palette.success,
  },
  "& .resumen-badge.warn": {
    borderColor: palette.warning,
    color: palette.warning,
  },
};

const swalSobreModal = (options) => swal2.fire({
  ...options,
  didOpen: () => {
    const container = swal2.getContainer();
    if (container) {
      container.style.zIndex = "20000";
    }
    options?.didOpen?.();
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

const TICKET_ENCOMIENDA_MODO_KEY = "xpertcont.transporte.encomienda.ticketPredeterminado";
const normalizarModoTicketEncomienda = (value) => (
  ["completo", "admin", "cliente"].includes(value) ? value : "completo"
);

const esRdiReprocesado = (item = {}) => {
  const estado = String(item.estado || "").toUpperCase();
  const estadoReproceso = String(item.estado_reproceso || "").toUpperCase();
  const cantidadVinculada = Number(item.cantidad_boletas ?? item.cantidad ?? 0);
  const detalle = [
    item.respuesta_desc,
    item.detalle,
  ].filter(Boolean).join(" ").toLowerCase();

  return estadoReproceso === "REPROCESADO"
    || (estado === "RECHAZADO" && cantidadVinculada <= 0)
    || detalle.includes("reprocesado")
    || detalle.includes("liberado manualmente para regenerar rdi");
};

const porCobrarRowStyles = [
  {
    when: (row) => row.tipo_operacion === "E" && row.condicionPagoLabel === "POR_COBRAR",
    style: {
      backgroundColor: palette.porCobrarSoft,
      color: palette.text,
      borderColor: "rgba(220, 68, 68, 0.34)",
      borderLeft: `4px solid ${palette.porCobrar}`,
      "&:hover": {
        backgroundColor: "rgba(220, 68, 68, 0.16)",
        color: palette.text,
      },
    },
  },
];

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
  superUsuario = "0",
  panoramicMode = false,
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
  const [pendientesResumenEmpresa, setPendientesResumenEmpresa] = useState([]);
  // Cola de resumenes a enviar: un paso por dia, del mas antiguo al mas nuevo.
  const [pasosResumenEnvio, setPasosResumenEnvio] = useState([]);
  const [modalResumenOpen, setModalResumenOpen] = useState(false);
  const [mostrarAnuladas, setMostrarAnuladas] = useState(false);
  const [ticketEncomiendaModo, setTicketEncomiendaModo] = useState(() => {
    if (typeof window === "undefined") return "completo";
    return normalizarModoTicketEncomienda(window.localStorage.getItem(TICKET_ENCOMIENDA_MODO_KEY));
  });

  // updateTrigger fuerza recarga luego de guardar, eliminar o enviar a SUNAT.
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Estado del modal de alta/edicion.
  const [modalOperacionOpen, setModalOperacionOpen] = useState(false);
  const [operacionEditando, setOperacionEditando] = useState(null);
  const [guardandoOperacion, setGuardandoOperacion] = useState(false);
  const guardandoOperacionRef = useRef(false);
  const imprimiendoTicketRapidoRef = useRef(false);

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
    mostrarAnuladas,
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

  const fechaResumenSeleccionada = useMemo(() => {
    if (!diaSel || diaSel === "*") {
      return "";
    }

    return `${periodoTrabajo}-${String(diaSel).padStart(2, "0")}`;
  }, [diaSel, periodoTrabajo]);

  const pendientesResumen = useMemo(() => {
    if (!fechaResumenSeleccionada) {
      return 0;
    }

    const pendientesEmpresa = pendientesResumenEmpresa.find((item) => (
      String(item.fecha || "").substring(0, 10) === fechaResumenSeleccionada
    ));

    if (pendientesEmpresa) {
      return Number(pendientesEmpresa.cantidad || 0);
    }

    return data.filter((item) => {
      const codigo = String(item.r_cod_ref || item.r_cod || "");

      return codigo === "03" && !item.numero_rdi && !item.r_vfirmado;
    }).length;
  }, [data, fechaResumenSeleccionada, pendientesResumenEmpresa]);

  const estadosRdiAbiertos = useMemo(() => (
    ["PENDIENTE", "GENERADO", "INCIERTO", "ERROR", "RECHAZADO"]
  ), []);

  // Rubro del Resumen Diario. El alcance es siempre toda la empresa: lo unico que
  // diferencia un resumen del otro es el rubro (encomienda / boleto).
  const rubroResumen = useMemo(() => (tipoOperacionFijo === "B" ? "BOLETOS" : "ENCOMIENDAS"), [tipoOperacionFijo]);
  const origenResumen = useMemo(
    () => (tipoOperacionFijo === "B" ? "TRANS_BOLETO" : "TRANS_ENCOMIENDA"),
    [tipoOperacionFijo]
  );
  const nombreRubroPlural = useMemo(
    () => (rubroResumen === "BOLETOS" ? "boletos" : "encomiendas"),
    [rubroResumen]
  );
  const resumenesAbiertos = useMemo(() => (
    colaResumenEncomiendas
      .filter((item) => estadosRdiAbiertos.includes(String(item.estado || "").toUpperCase()))
      .filter((item) => !esRdiReprocesado(item))
  ), [colaResumenEncomiendas, estadosRdiAbiertos]);
  const totalPendienteResumen = pendientesResumen + resumenesAbiertos.length;
  const resumenDiaOk = Boolean(diaSel && diaSel !== "*") && totalPendienteResumen === 0;
  const superUsuarioActual = superUsuario ?? sessionStorage.getItem("super") ?? "0";
  const puedeEliminarOperacion = params.id_anfitrion === params.id_invitado || ["1", "true", "s", "si"].includes(String(superUsuarioActual).toLowerCase());
  const listadoMaxWidth = tipoOperacionFijo === "E"
    ? (panoramicMode ? "100%" : { xs: "100%", lg: 1280, xl: 1440 })
    : 980;
  const empresaTrabajo = useMemo(() => {
    const seleccionada = contabilidadSelect.find((item) => item.documento_id === contabilidadTrabajo) || {};

    return {
      ...seleccionada,
      ruc: seleccionada.documento_id || contabilidadTrabajo,
      documento_id: seleccionada.documento_id || contabilidadTrabajo,
      nombre: seleccionada.razon_social || seleccionada.nombre,
      domicilio_fiscal: seleccionada.domicilio_fiscal || seleccionada.direccion || "",
      direccion: seleccionada.direccion || seleccionada.domicilio_fiscal || "",
    };
  }, [contabilidadSelect, contabilidadTrabajo]);

  // Cola de resumenes del periodo. El Resumen Diario es diario: su alcance es el
  // periodo, asi que la cola no sale de ahi. Trae todas las fechas del periodo, no
  // solo el dia seleccionado, porque al enviar se recorre del mas antiguo al mas
  // nuevo.
  const cargarColaResumen = useCallback(async () => {
    if (!periodoTrabajo || !contabilidadTrabajo) {
      setColaResumenEncomiendas([]);
      return [];
    }

    try {
      const response = await fetch(`${back_host}/mve_transventa/cpe/resumen/${periodoTrabajo}/${params.id_anfitrion}/${contabilidadTrabajo}?origen=${origenResumen}`);
      const result = await response.json();
      const dataResumen = Array.isArray(result?.data) ? result.data : [];
      const pendientes = Array.isArray(result?.pendientes) ? result.pendientes : [];
      setColaResumenEncomiendas(dataResumen);
      setPendientesResumenEmpresa(pendientes);
      return dataResumen;
    } catch (error) {
      console.log("No se pudo cargar cola RDI de encomiendas:", error);
      setColaResumenEncomiendas([]);
      setPendientesResumenEmpresa([]);
      return [];
    }
  }, [back_host, contabilidadTrabajo, origenResumen, params.id_anfitrion, periodoTrabajo]);

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
    cargarColaResumen();
  }, [cargarColaResumen, updateTrigger]);

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

  const handleToggleAnuladas = () => {
    setMostrarAnuladas((prev) => !prev);
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

    if (esEdicion && tipoOperacionFijo === "E" && operacionProtegidaSunat(operacionEditando)) {
      guardandoOperacionRef.current = false;
      setGuardandoOperacion(false);
      swal2.fire({
        title: "Encomienda protegida",
        text: operacionEditando.numero_rdi
          ? `Esta encomienda ya fue incluida en el RDI ${operacionEditando.numero_rdi}.`
          : "Esta encomienda ya fue enviada a SUNAT.",
        icon: "info",
        confirmButtonText: "ACEPTAR",
      });
      return null;
    }

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
    if (tipoOperacionFijo === "E" && operacionProtegidaSunat(operacion)) {
      await confirmDialog({
        title: "Encomienda protegida",
        message: operacion.numero_rdi
          ? `Esta encomienda ya fue incluida en el RDI ${operacion.numero_rdi}. No se puede eliminar.`
          : "Esta encomienda ya fue enviada a SUNAT. No se puede eliminar.",
        icon: "info",
        confirmText: "ACEPTAR",
      });
      return;
    }

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

  const handleCancel = async (operacion) => {
    if (tipoOperacionFijo === "E" && operacionProtegidaSunat(operacion)) {
      await confirmDialog({
        title: "Encomienda protegida",
        message: operacion.numero_rdi
          ? `Esta encomienda ya fue incluida en el RDI ${operacion.numero_rdi}. No se puede anular.`
          : "Esta encomienda ya fue enviada a SUNAT. No se puede anular.",
        icon: "info",
        confirmText: "ACEPTAR",
      });
      return;
    }

    const result = await confirmDialog({
      title: "Anular operacion?",
      message: `${operacion.numero} - ${operacion.clienteLabel}`,
      icon: "warning",
      confirmText: "ANULAR",
      cancelText: "Cancelar",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const response = await fetch(`${back_host}/mve_transventa/${periodoTrabajo}/${params.id_anfitrion}/${contabilidadTrabajo}/${operacion.r_cod}/${operacion.r_serie}/${operacion.r_numero}/${operacion.elemento || 1}/anular`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ctrl_mod_us: params.id_invitado }),
      });
      const dataResponse = await response.json();

      if (!response.ok || !dataResponse.success) {
        throw new Error(dataResponse.message || "No se pudo anular la operacion.");
      }

      quitarOperacionLocal(operacion);
    } catch (error) {
      swal2.fire({
        title: "No se pudo anular",
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

  const handleEnviarResumen = async () => {
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
        message: `El RDI de ${nombreRubroPlural} se envia por dia. Primero elige un dia en el calendario.`,
        icon: "warning",
        confirmText: "ACEPTAR",
      });
      return;
    }

    const fechaResumen = `${periodoTrabajo}-${String(diaSel).padStart(2, "0")}`;
    const cola = await cargarColaResumen();
    // Del mas antiguo al mas nuevo: el backend envia siempre el primero pendiente.
    const abiertosCola = cola
      .filter((item) => estadosRdiAbiertos.includes(String(item.estado || "").toUpperCase()))
      .filter((item) => !esRdiReprocesado(item))
      .filter((item) => String(item.fecha || "").substring(0, 10) <= fechaResumen)
      .sort((a, b) => (
        String(a.fecha || "").localeCompare(String(b.fecha || ""))
        || Number(a.secuencia || 0) - Number(b.secuencia || 0)
      ));
    const aceptadosDia = cola
      .filter((item) => String(item.fecha || "").substring(0, 10) === fechaResumen)
      .filter((item) => String(item.estado || "").toUpperCase() === "ACEPTADO")
      .filter((item) => !esRdiReprocesado(item))
      .sort((a, b) => Number(a.secuencia || 0) - Number(b.secuencia || 0));
    const enviadosSoloConsulta = cola
      .filter((item) => String(item.fecha || "").substring(0, 10) <= fechaResumen)
      .filter((item) => String(item.estado || "").toUpperCase() === "ENVIADO")
      .filter((item) => !esRdiReprocesado(item))
      .sort((a, b) => (
        String(a.fecha || "").localeCompare(String(b.fecha || ""))
        || Number(a.secuencia || 0) - Number(b.secuencia || 0)
      ));
    const pendientesNuevosCola = pendientesResumenEmpresa
      .filter((item) => String(item.fecha || "").substring(0, 10) <= fechaResumen)
      .sort((a, b) => String(a.fecha || "").localeCompare(String(b.fecha || "")));
    if (pendientesNuevosCola.length === 0 && pendientesResumen > 0) {
      pendientesNuevosCola.push({
        fecha: fechaResumen,
        cantidad: pendientesResumen,
      });
    }
    const totalPendienteActual = pendientesNuevosCola.length + abiertosCola.length;
    // Un paso por dia, del mas antiguo al mas nuevo. El ultimo paso es el del dia
    // seleccionado cuando todavia quedan boletas sin RDI: ese resumen todavia no
    // existe, se crea en el momento.
    const pasos = abiertosCola.map((item) => ({
      clave: `rdi-${item.numero_rdi}`,
      fecha: String(item.fecha || "").substring(0, 10),
      numeroRdi: item.numero_rdi,
      estado: item.estado || "PENDIENTE",
      cantidad: item.cantidad_boletas || 0,
      ticket: item.ticket || "",
      nombreArchivo: item.nombre_archivo || "",
      rutaCdr: item.ruta_cdr || "",
      detalle: item.respuesta_desc || item.respuesta_codigo || "",
    }));

    aceptadosDia.forEach((item) => {
      if (pasos.some((paso) => paso.numeroRdi === item.numero_rdi)) {
        return;
      }

      pasos.push({
        clave: `aceptado-${item.numero_rdi}`,
        fecha: String(item.fecha || "").substring(0, 10),
        numeroRdi: item.numero_rdi,
        estado: item.estado || "ACEPTADO",
        cantidad: item.cantidad_boletas || 0,
        ticket: item.ticket || "",
        nombreArchivo: item.nombre_archivo || "",
        rutaCdr: item.ruta_cdr || "",
        detalle: item.respuesta_desc || item.respuesta_codigo || "RDI aceptado por SUNAT.",
        soloConsulta: true,
      });
    });

    enviadosSoloConsulta.forEach((item) => {
      if (pasos.some((paso) => paso.numeroRdi === item.numero_rdi)) {
        return;
      }

      pasos.push({
        clave: `enviado-${item.numero_rdi}`,
        fecha: String(item.fecha || "").substring(0, 10),
        numeroRdi: item.numero_rdi,
        estado: item.estado || "ENVIADO",
        cantidad: item.cantidad_boletas || 0,
        ticket: item.ticket || "",
        nombreArchivo: item.nombre_archivo || "",
        rutaCdr: item.ruta_cdr || "",
        detalle: item.respuesta_desc || item.respuesta_codigo || "RDI enviado a SUNAT, pendiente de consultar CDR.",
        soloConsulta: true,
      });
    });

    pendientesNuevosCola.forEach((item) => {
      const fechaPendiente = String(item.fecha || "").substring(0, 10);
      const cantidadPendiente = Number(item.cantidad || 0);

      if (!fechaPendiente || cantidadPendiente <= 0) {
        return;
      }

      pasos.push({
        clave: `nuevo-${fechaPendiente}`,
        fecha: fechaPendiente,
        numeroRdi: "",
        estado: "SIN RDI",
        cantidad: cantidadPendiente,
      });
    });

    pasos.sort((a, b) => (
      String(a.fecha || "").localeCompare(String(b.fecha || ""))
      || Number(a.secuencia || 0) - Number(b.secuencia || 0)
    ));

    const result = await confirmDialog({
      title: `Enviar RDI de ${nombreRubroPlural}?`,
      content: (
        <Box sx={{ display: "grid", gap: 1.2, textAlign: "left" }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 0.75,
              p: 1,
              borderRadius: 1,
              backgroundColor: palette.surfaceAlt,
              border: `1px solid ${palette.borderSoft}`,
            }}
          >
            <InfoLine label="Empresa" value={empresaTrabajo.razon_social || empresaTrabajo.nombre || contabilidadTrabajo} />
            <InfoLine label="Periodo" value={`${periodoTrabajo} | dia por dia`} />
            <InfoLine label="Alcance" value="Todas las agencias" />
          </Box>

          <Typography sx={{ fontSize: 12.5, color: palette.muted }}>
            {totalPendienteActual > 0
              ? `Se procesaran ${pasos.length} RDI del mas antiguo al dia ${String(diaSel).padStart(2, "0")}.`
              : "No hay RDI pendientes para procesar."}
          </Typography>

          {pasos.length > 0 && (
            <Box sx={{ display: "grid", gap: 0.65, maxHeight: "34vh", overflowY: "auto", pr: 0.25 }}>
              {pasos.map((paso, indice) => {
                const dia = `${paso.fecha.substring(8, 10)}/${paso.fecha.substring(5, 7)}/${paso.fecha.substring(0, 4)}`;
                const esNuevo = !paso.numeroRdi;
                const estado = esNuevo ? "SIN RDI" : String(paso.estado || "PENDIENTE").toUpperCase();
                const requiereCorreccion = estado === "RECHAZADO";
                const puedeConsultar = Boolean(paso.numeroRdi);

                return (
                  <Box
                    key={paso.clave || `${paso.fecha}-${indice}`}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "34px minmax(0, 1fr) auto auto",
                      gap: 0.9,
                      alignItems: "center",
                      p: 0.9,
                      borderRadius: 1,
                      backgroundColor: indice === 0 ? palette.accentSoft : palette.bg,
                      border: `1px solid ${indice === 0 ? palette.accent : palette.borderSoft}`,
                    }}
                  >
                    <Box
                      sx={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        color: indice === 0 ? palette.onAccent : palette.text,
                        backgroundColor: indice === 0 ? palette.accent : palette.surfaceAlt,
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      {indice + 1}
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 800, color: palette.text, lineHeight: 1.25 }}>
                        {`Dia ${dia}`}
                      </Typography>
                      <Typography sx={{ fontSize: 11.5, color: palette.muted, overflowWrap: "anywhere" }}>
                        {paso.numeroRdi || "Resumen nuevo por generar"}
                      </Typography>
                      <Typography sx={{ mt: 0.15, fontSize: 11, color: palette.accent, fontWeight: 800 }}>
                        {requiereCorreccion
                          ? "Requiere correccion en historial RDI"
                          : rubroResumen === "BOLETOS" ? "Boletos" : "Encomiendas"}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "grid", justifyItems: "end", gap: 0.35 }}>
                      <Box
                        sx={{
                          px: 0.8,
                          py: 0.25,
                          borderRadius: 1,
                          fontSize: 10.5,
                          fontWeight: 900,
                          color: requiereCorreccion ? palette.danger : esNuevo ? palette.warning : palette.accent,
                          backgroundColor: requiereCorreccion ? palette.dangerSoft : esNuevo ? palette.warningSoft : palette.accentSoft,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {estado}
                      </Box>
                      <Typography sx={{ fontSize: 11.5, color: palette.text, fontWeight: 800, whiteSpace: "nowrap" }}>
                        {`${paso.cantidad || 0} ${nombreRubroPlural}`}
                      </Typography>
                      {puedeConsultar && (
                        <Tooltip title="Consultar CDR">
                          <IconButton
                            size="small"
                            aria-label="Consultar CDR"
                            onClick={async (event) => {
                              event.stopPropagation();
                              try {
                                const consulta = await consultarTicketResumen(paso);
                                await swalSobreModal({
                                  title: String(consulta?.data?.estado || "").toUpperCase() === "ACEPTADO" ? "RDI aceptado" : "Consulta SUNAT",
                                  text: consulta?.mensaje || "Consulta completada.",
                                  icon: String(consulta?.data?.estado || "").toUpperCase() === "RECHAZADO" ? "warning" : "success",
                                  confirmButtonText: "ACEPTAR",
                                  confirmButtonColor: palette.accent,
                                  color: palette.text,
                                  background: palette.surface,
                                });
                                cargarColaResumen();
                                setUpdateTrigger(Date.now());
                              } catch (error) {
                                await swalSobreModal({
                                  title: "No se pudo consultar",
                                  text: error?.response?.data?.mensaje_usuario || error?.response?.data?.message || error?.message || "No se pudo consultar el ticket SUNAT.",
                                  icon: "error",
                                  confirmButtonText: "ACEPTAR",
                                  confirmButtonColor: palette.accent,
                                  color: palette.text,
                                  background: palette.surface,
                                });
                              }
                            }}
                            sx={{ color: estado === "ACEPTADO" ? palette.success : palette.accent, p: 0.35 }}
                          >
                            <CloudSyncIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}

          <Typography sx={{ fontSize: 12, color: palette.warning, fontWeight: 700 }}>
            Los RDI rechazados apareceran como pendientes de atencion, pero no se reenviaran hasta corregirlos desde Historial RDI.
          </Typography>
        </Box>
      ),
      icon: totalPendienteActual > 0 ? "success" : "info",
      confirmText: totalPendienteActual > 0 ? `ENVIAR ${totalPendienteActual}` : "ACEPTAR",
      cancelText: "CANCELAR",
    });

    if (!result.isConfirmed || totalPendienteActual === 0) {
      return;
    }

    // El envio lo recorre el modal, paso por paso, para que se vea cual va.
    setPasosResumenEnvio(pasos);
    setModalResumenOpen(true);
  };

  // Un envio por paso: periodo + dia. El periodo es siempre el del filtro y el dia
  // es el del paso, que es lo que espera el backend para armar el payload.
  const enviarPasoResumen = async (paso) => {
    if (paso.soloConsulta) {
      return {
        ok: true,
        mensaje: paso.detalle || `${paso.numeroRdi || "RDI"} ya fue aceptado por SUNAT.`,
        data: {
          numero_rdi: paso.numeroRdi,
          estado: paso.estado || "ACEPTADO",
          ticket: paso.ticket,
          nombre_archivo: paso.nombreArchivo,
          ruta_cdr: paso.rutaCdr,
          total_documentos: paso.cantidad || 0,
          respuesta_sunat_descripcion: paso.detalle,
        },
      };
    }

    if (String(paso.estado || "").toUpperCase() === "RECHAZADO") {
      return {
        ok: false,
        mensaje: [
          `${paso.numeroRdi || "El RDI"} esta rechazado y aun tiene comprobantes vinculados.`,
          "Primero usa Historial RDI > Liberar comprobantes y regenerar.",
        ].join(" "),
        data: {
          numero_rdi: paso.numeroRdi,
          estado: "RECHAZADO",
          total_documentos: paso.cantidad || 0,
        },
      };
    }

    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), 120000);

    try {
      const response = await fetch(`${back_host}/mve_transventa/cpe/resumen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controlador.signal,
        body: JSON.stringify({
          periodo: periodoTrabajo,
          id_anfitrion: params.id_anfitrion,
          id_usuario: params.id_anfitrion,
          id_invitado: params.id_invitado,
          documento_id: contabilidadTrabajo,
          fecha_documentos: paso.fecha,
          // Sin numero_rdi el backend crea el resumen del dia; con numero_rdi
          // reenvia exactamente ese, que es lo que hay en la cola.
          numero_rdi: paso.numeroRdi || undefined,
          tipo_operacion: tipoOperacionFijo,
          solo_payload: false,
          ctrl_mod_us: params.id_invitado,
        }),
      });
      const dataResponse = await response.json();
      const dataRdi = normalizarRdiResponse(dataResponse);

      if (!response.ok || dataResponse.success === false) {
        return {
          ok: false,
          mensaje: dataResponse.mensaje_usuario
            || dataResponse.respuesta_sunat_descripcion
            || dataResponse.message
            || `No se pudo enviar el RDI de ${nombreRubroPlural}.`,
          data: dataRdi,
        };
      }

      return {
        ok: true,
        mensaje: [
          `${dataRdi.cantidad || dataRdi.total_documentos || 0} ${nombreRubroPlural} enviadas`,
          dataRdi.ticket ? `ticket ${dataRdi.ticket}` : null,
          dataRdi.mensaje_usuario || dataRdi.respuesta_sunat_descripcion || null,
        ].filter(Boolean).join(" - "),
        data: dataRdi,
      };
    } catch (error) {
      return {
        ok: false,
        mensaje: error?.name === "AbortError"
          ? "La solicitud tardo mas de 2 minutos y se cancelo. Revisa el estado del RDI antes de reintentar."
          : (error?.message || "No hubo respuesta del servidor."),
      };
    } finally {
      clearTimeout(temporizador);
    }
  };

  const consultarTicketResumen = async (paso) => {
    const numeroRdi = paso.numero_rdi || paso.numeroRdi;

    if (!numeroRdi) {
      return {
        ok: false,
        mensaje: "Este paso aun no tiene numero RDI para consultar.",
      };
    }

    const consulta = await consultarTicketRdiSunat({
      backHost: back_host,
      resumenEndpoint: "mve_transventa/cpe/resumen",
      periodo: periodoTrabajo,
      idAnfitrion: params.id_anfitrion,
      idInvitado: params.id_invitado,
      documentoId: contabilidadTrabajo,
      numeroRdi,
      ctrlModUs: params.id_invitado,
    });

    return {
      ok: true,
      mensaje: consulta.message,
      data: consulta.data,
    };
  };

  const handleTicketEncomiendaModoChange = (modo) => {
    const modoNormalizado = normalizarModoTicketEncomienda(modo);
    setTicketEncomiendaModo(modoNormalizado);
    window.localStorage.setItem(TICKET_ENCOMIENDA_MODO_KEY, modoNormalizado);
  };

  const handleImprimirTicketRapido = async (operacion, modo = ticketEncomiendaModo) => {
    if (imprimiendoTicketRapidoRef.current) {
      return;
    }

    imprimiendoTicketRapidoRef.current = true;

    try {
      await imprimirTicketEncomienda({
        modo,
        backHost: back_host,
        periodoTrabajo,
        idAnfitrion: params.id_anfitrion,
        documentoId: contabilidadTrabajo,
        encomiendaBase: operacion,
        draft: operacion,
        rutasDisponibles,
        puntoVentaOrigenNombre: puntosVentaAsignados.find((item) => item.id_punto_venta === puntoVentaTrabajo)?.nombre || puntoVentaTrabajo,
        empresa: {
          ...empresaTrabajo,
          nombre: empresaTrabajo.nombre,
          documento_id: contabilidadTrabajo,
        },
      });
    } catch (error) {
      swal2.fire({
        title: "No se pudo generar el ticket",
        text: error.message || "Revisa los datos de la encomienda e intenta nuevamente.",
        icon: "error",
        confirmButtonText: "ACEPTAR",
        color: palette.text,
        background: palette.surface,
      });
    } finally {
      imprimiendoTicketRapidoRef.current = false;
    }
  };

  // -----------------------------
  // Renderizado del formulario
  // -----------------------------

  return (
    <Box sx={{ minHeight: "100%", backgroundColor: "transparent", p: { xs: 1, md: panoramicMode ? 1.5 : 3, xl: panoramicMode ? 2 : 4 } }}>
      <Box sx={{ width: "100%", maxWidth: listadoMaxWidth, mx: "auto" }}>
        <TrHeader
          titulo={titulo}
          contador={data.length}
          contadorTexto={contadorTexto}
          nuevoTexto={nuevoTexto}
          buscarTexto={buscarTexto}
          valorBusqueda={valorBusqueda}
          nuevoDeshabilitado={tipoOperacionFijo === "E" && !puntoVentaTrabajo}
          ticketModo={tipoOperacionFijo === "E" ? ticketEncomiendaModo : undefined}
          onTicketModoChange={tipoOperacionFijo === "E" ? handleTicketEncomiendaModoChange : undefined}
          onNuevo={() => solicitarOperacion()}
          onBuscar={actualizaValorFiltro}
          compactControles={tipoOperacionFijo === "E" || panoramicMode}
          headerExtra={(
            <Tooltip
              title={resumenDiaOk ? `Todo OK: sin ${nombreRubroPlural} pendientes` : `ENVIAR RDI DE ${rubroResumen} (${totalPendienteResumen})`}
              arrow
            >
              <IconButton
                color="inherit"
                onClick={handleEnviarResumen}
                sx={resumenSunatButtonSx(resumenDiaOk, totalPendienteResumen > 0)}
              >
                <Box sx={resumenSunatIconSx}>
                  <img src={SunatResumenIcon} alt="Resumen SUNAT" />
                  <Box
                    className={`resumen-badge ${resumenDiaOk ? "ok" : totalPendienteResumen > 0 ? "warn" : ""}`}
                  >
                    {resumenDiaOk ? (
                      <CheckCircleOutlineIcon sx={{ fontSize: 9 }} />
                    ) : (
                      <SummarizeIcon sx={{ fontSize: 9 }} />
                    )}
                  </Box>
                </Box>
              </IconButton>
            </Tooltip>
          )}
        />

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
          mostrarAnuladas={mostrarAnuladas}
          onToggleAnuladas={tipoOperacionFijo === "E" ? handleToggleAnuladas : undefined}
          compact={tipoOperacionFijo === "E" || panoramicMode}
        />

        <DaySelector period={periodoTrabajo || params.periodo} onDaySelect={handleDayFilter} />

        <DataTable
          theme="transportesDark"
          columns={createColumns({
            onEdit: solicitarOperacion,
            onDelete: handleDelete,
            onCancel: handleCancel,
            onEnviarSunat: handleEnviarSunat,
            onImprimirTicket: handleImprimirTicketRapido,
            canDelete: puedeEliminarOperacion,
            compact: tipoOperacionFijo === "E" && panoramicMode,
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
              empresa: empresaTrabajo,
              onRefresh: () => setUpdateTrigger(Date.now()),
            },
            mostrarAnuladas,
          })}
          data={data}
          progressPending={loading}
          pagination
          paginationPerPage={tipoOperacionFijo === "E" ? 100 : 10}
          paginationRowsPerPageOptions={tipoOperacionFijo === "E" ? [25, 50, 100, 150, 200, 300] : undefined}
          highlightOnHover
          responsive
          customStyles={tipoOperacionFijo === "E"
            ? (panoramicMode ? customStylesEncomiendaPanoramica : customStylesEncomienda)
            : customStyles}
          conditionalRowStyles={tipoOperacionFijo === "E" ? porCobrarRowStyles : undefined}
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
            empresa={{
              ...empresaTrabajo,
              nombre: empresaTrabajo.nombre,
              documento_id: contabilidadTrabajo,
            }}
            modalNuevoTitulo={modalNuevoTitulo}
            modalEditarTitulo={modalEditarTitulo}
            soloLectura={operacionProtegidaSunat(operacionEditando) || Number(operacionEditando?.registrado) === 0}
            onClose={cerrarModalOperacion}
            onSubmit={guardarOperacion}
            guardando={guardandoOperacion}
            ticketPredeterminado={ticketEncomiendaModo}
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

        <TrRdiProgresoModal
          abierto={modalResumenOpen}
          pasos={pasosResumenEnvio}
          nombreRubroPlural={nombreRubroPlural}
          periodo={periodoTrabajo}
          enviarPaso={enviarPasoResumen}
          consultarTicket={consultarTicketResumen}
          alCerrar={() => {
            setModalResumenOpen(false);
            setPasosResumenEnvio([]);
          }}
          alTerminar={() => {
            cargarColaResumen();
            setUpdateTrigger(Date.now());
          }}
        />

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

function InfoLine({ label, value }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: 10.5, fontWeight: 900, color: palette.muted, textTransform: "uppercase" }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: palette.text, overflowWrap: "anywhere" }}>
        {value || "-"}
      </Typography>
    </Box>
  );
}
