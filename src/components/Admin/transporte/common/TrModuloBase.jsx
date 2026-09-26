import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DataTable from "react-data-table-component";
import { Box, IconButton, Tooltip } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
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

  const pendientesResumen = useMemo(() => {
    if (!diaSel || diaSel === "*") {
      return 0;
    }

    return data.filter((item) => {
      const codigo = String(item.r_cod_ref || item.r_cod || "");

      return codigo === "03" && !item.numero_rdi && !item.r_vfirmado;
    }).length;
  }, [data, diaSel]);

  const estadosRdiAbiertos = useMemo(() => (
    ["PENDIENTE", "GENERADO", "ENVIADO", "INCIERTO", "ERROR"]
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
    colaResumenEncomiendas.filter((item) => estadosRdiAbiertos.includes(String(item.estado || "").toUpperCase()))
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
      setColaResumenEncomiendas(dataResumen);
      return dataResumen;
    } catch (error) {
      console.log("No se pudo cargar cola RDI de encomiendas:", error);
      setColaResumenEncomiendas([]);
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
      .sort((a, b) => (
        String(a.fecha || "").localeCompare(String(b.fecha || ""))
        || Number(a.secuencia || 0) - Number(b.secuencia || 0)
      ));
    const totalPendienteActual = pendientesResumen + abiertosCola.length;
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

    if (pendientesResumen > 0) {
      pasos.push({
        clave: `nuevo-${fechaResumen}`,
        fecha: fechaResumen,
        numeroRdi: "",
        estado: "SIN RDI",
        cantidad: pendientesResumen,
      });
    }

    const lineasPasos = pasos.map((paso, indice) => {
      // La cola puede venir de meses anteriores, asi que el dia va con mes: solo
      // el dia haria ambiguo un 12/08 anterior a un 05/09.
      const dia = `${paso.fecha.substring(8, 10)}/${paso.fecha.substring(5, 7)}`;
      const detalle = paso.numeroRdi
        ? `${paso.numeroRdi} - ${paso.estado} - ${paso.cantidad} ${nombreRubroPlural}`
        : `resumen nuevo - ${paso.cantidad} ${nombreRubroPlural} sin RDI`;
      return `   ${indice + 1}. dia ${dia} | ${detalle}`;
    });

    const result = await confirmDialog({
      title: `Enviar RDI de ${nombreRubroPlural}?`,
      message: [
        `Empresa: ${contabilidadTrabajo}`,
        `Periodo: ${periodoTrabajo} (dia por dia)`,
        `Rubro: ${rubroResumen}`,
        // El resumen es de toda la empresa. El punto de venta del filtro solo
        // acota lo que se ve en la tabla, asi que se aclara para que nadie crea
        // que el alcance del RDI cambia con el filtro.
        "Alcance del resumen: todas las agencias",
        puntoVentaTrabajo ? `Filtro de tabla: ${puntoVentaTrabajo} (no limita el resumen)` : null,
        "",
        `Se enviaran ${pasos.length} resumen(es) a SUNAT, del dia mas antiguo al dia ${String(diaSel).padStart(2, "0")}:`,
        ...lineasPasos,
        "",
        "Se detiene en el primer error para no saltarse un dia pendiente.",
      ].filter((linea) => linea !== null && linea !== undefined).join("\n"),
      icon: totalPendienteActual > 0 ? "success" : "info",
      confirmText: totalPendienteActual > 0 ? `ENVIAR ${pasos.length}` : "ACEPTAR",
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

      if (!response.ok || dataResponse.success === false) {
        return {
          ok: false,
          mensaje: dataResponse.mensaje_usuario
            || dataResponse.respuesta_sunat_descripcion
            || dataResponse.message
            || `No se pudo enviar el RDI de ${nombreRubroPlural}.`,
          data: dataResponse.data || dataResponse,
        };
      }

      return {
        ok: true,
        mensaje: [
          `${dataResponse.cantidad || dataResponse.total_documentos || 0} ${nombreRubroPlural} enviadas`,
          dataResponse.ticket ? `ticket ${dataResponse.ticket}` : null,
          dataResponse.mensaje_usuario || dataResponse.respuesta_sunat_descripcion || null,
        ].filter(Boolean).join(" - "),
        data: dataResponse.data || dataResponse,
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

  const handleTicketEncomiendaModoChange = (modo) => {
    const modoNormalizado = normalizarModoTicketEncomienda(modo);
    setTicketEncomiendaModo(modoNormalizado);
    window.localStorage.setItem(TICKET_ENCOMIENDA_MODO_KEY, modoNormalizado);
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
          mostrarAnuladas={mostrarAnuladas}
          onToggleAnuladas={tipoOperacionFijo === "E" ? handleToggleAnuladas : undefined}
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
