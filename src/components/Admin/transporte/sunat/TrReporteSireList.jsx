import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, CircularProgress, LinearProgress, Tab, Tabs, Typography } from "@mui/material";
import ArrowDownward from "@mui/icons-material/ArrowDownward";
import RefreshIcon from "@mui/icons-material/Refresh";
import DataTable from "react-data-table-component";
import axios from "axios";
import * as XLSX from "xlsx";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useDialog } from "../../AdminConfirmDialogProvider";
import DaySelector from "../../AdminDias";
import TrFiltros from "../common/components/TrFiltros";
import AppSearch from "../../../ui/AppSearch";
import { AlertTriangle, Banknote, Ban, Calculator, FileText, ReceiptText, Sigma } from "lucide-react";
import "../common/trDataTableTheme";
import palette from "../../../../theme/palette";
import TrSirePresentacion from "./TrSirePresentacion";

const backHost = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";

const tableStyles = {
  table: { style: { backgroundColor: palette.surface } },
  tableWrapper: { style: { backgroundColor: palette.surface } },
  responsiveWrapper: { style: { backgroundColor: palette.surface, overflowX: "auto", overflowY: "hidden" } },
  headRow: { style: { backgroundColor: palette.surfaceAlt, borderBottomColor: "transparent" } },
  headCells: { style: { backgroundColor: palette.surfaceAlt, color: palette.muted, fontSize: "11px" } },
  rows: {
    style: { backgroundColor: palette.surface, borderBottomColor: "transparent" },
    highlightOnHoverStyle: { backgroundColor: palette.rowHover, borderBottomColor: "transparent", outline: "none" },
  },
  cells: { style: { backgroundColor: "transparent" } },
  pagination: { style: { backgroundColor: palette.surface, borderTopColor: "transparent" } },
};

const estadoSx = {
  ACEPTADO: { color: palette.success, backgroundColor: palette.successSoft },
  "SIN ENVIO SUNAT": { color: palette.danger, backgroundColor: palette.dangerSoft },
  "BOLETA SIN RDI": { color: palette.danger, backgroundColor: palette.dangerSoft },
  "RDI PENDIENTE CDR": { color: palette.warning, backgroundColor: palette.warningSoft },
  "FACTURA SIN CDR": { color: palette.warning, backgroundColor: palette.warningSoft },
  RECHAZADO: { color: palette.danger, backgroundColor: palette.dangerSoft },
  ANULADO: { color: palette.muted, backgroundColor: palette.surfaceAlt },
  "ANULADO LOCAL": { color: palette.muted, backgroundColor: palette.surfaceAlt },
};

const money = (value) => Number(value || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const texto = (value) => String(value ?? "").trim();
const fechaComprobante = (value) => {
  const fecha = texto(value);
  if (!fecha) return "-";
  const partes = fecha.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:$|[T\s])/);
  if (!partes) return fecha;
  return `${partes[1]}/${partes[2].padStart(2, "0")}/${partes[3].padStart(2, "0")}`;
};

const fechaHoraTicket = (value) => {
  if (!value) return "Fecha no registrada";
  const fecha = new Date(value);
  if (Number.isNaN(fecha.getTime())) return "Fecha no registrada";
  return fecha.toLocaleString("es-PE", {
    timeZone: "America/Lima", day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
};

const tipoComprobanteLabel = (tipo) => {
  const value = texto(tipo).padStart(2, "0");
  if (value === "01") return "01 Factura";
  if (value === "03") return "03 Boleta";
  if (value === "07") return "07 Nota credito";
  if (value === "08") return "08 Nota debito";
  return value || "-";
};

function SireResumenCard({ label, value, icon: Icon, color = palette.accent, soft = palette.accentSoft, activo = false, onClick }) {
  const clickable = typeof onClick === "function";

  return (
    <Box
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!clickable || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault();
        onClick();
      }}
      sx={{
        minWidth: 0,
        border: `1px solid ${activo ? color : palette.borderSoft}`,
        borderRadius: palette.radius.listCard,
        backgroundColor: palette.surface,
        color,
        px: { xs: 0.85, sm: 1 },
        py: 0.75,
        display: "grid",
        gridTemplateColumns: "auto minmax(0, 1fr)",
        alignItems: "center",
        gap: 0.65,
        cursor: clickable ? "pointer" : "default",
        boxShadow: activo ? `0 0 0 1px ${color}` : "none",
        transition: "border-color .16s ease, background-color .16s ease, box-shadow .16s ease",
        "&:hover": clickable ? {
          borderColor: color,
          backgroundColor: soft,
        } : undefined,
        "&:focus-visible": clickable ? {
          outline: `2px solid ${color}`,
          outlineOffset: 2,
        } : undefined,
      }}
    >
      <Box sx={{ width: 28, height: 28, borderRadius: palette.radius.control, display: "grid", placeItems: "center", backgroundColor: soft, color }}>
        <Icon size={15} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ color: palette.muted, fontSize: "9.5px", fontWeight: 900, textTransform: "uppercase", letterSpacing: 0 }} noWrap>
          {label}
        </Typography>
        <Typography sx={{ color: palette.text, fontSize: 16, lineHeight: 1.05, fontWeight: "1000 !important", WebkitTextStroke: "0.16px currentColor" }} noWrap>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

const filaExcel = (row) => ({
  "Fecha emision": row.fecha_emision,
  "Tipo comprobante": row.tipo_comprobante,
  Serie: row.serie,
  Numero: row.numero,
  Elemento: row.elemento,
  "Tipo doc cliente": row.tipo_doc_cliente,
  "Nro doc cliente": row.nro_doc_cliente,
  "Cliente / razon social": row.cliente,
  "Base gravada": Number(row.base_gravada || 0),
  Exonerado: Number(row.exonerado || 0),
  Inafecto: Number(row.inafecto || 0),
  IGV: Number(row.igv || 0),
  Total: Number(row.total || 0),
  Moneda: row.moneda,
  "Estado SUNAT": row.estado_sunat,
  "Modo envio": row.modo_envio,
  "Nro RDI": row.numero_rdi,
  Ticket: row.ticket,
  "Codigo CDR": row.codigo_cdr,
  "Descripcion CDR": row.descripcion_cdr,
  Observaciones: Array.isArray(row.observaciones) ? row.observaciones.join("; ") : "",
});

const filaComparacionExcel = (row) => ({
  Resultado: row.resultado,
  Severidad: row.severidad,
  Categoria: row.categoria,
  Observacion: row.observacion,
  Origen: row.origen,
  "Fecha emision": fechaComprobante(row.fecha_emision),
  "Fecha SIRE": fechaComprobante(row.fecha_emision_sire),
  "Fecha XPERT": fechaComprobante(row.fecha_emision_xpert),
  "Tipo comprobante": row.tipo_comprobante,
  Serie: row.serie,
  Numero: row.numero,
  "Tipo doc cliente": row.tipo_doc_cliente,
  "Nro doc cliente": row.nro_doc_cliente,
  "Cliente / razon social": row.cliente,
  "Base SIRe": Number(row.base_gravada_sire || 0),
  "Base XPERT": Number(row.base_gravada_xpert || 0),
  "Exonerado SIRe": Number(row.exonerado_sire || 0),
  "Exonerado XPERT": Number(row.exonerado_xpert || 0),
  "Inafecto SIRe": Number(row.inafecto_sire || 0),
  "Inafecto XPERT": Number(row.inafecto_xpert || 0),
  "IGV SIRe": Number(row.igv_sire || 0),
  "IGV XPERT": Number(row.igv_xpert || 0),
  "Total SIRe": Number(row.total_sire || 0),
  "Total XPERT": Number(row.total_xpert || 0),
  Diferencia: Number(row.diferencia_total || 0),
  "Moneda SIRe": row.moneda_sire,
  "Moneda XPERT": row.moneda_xpert,
  Ticket: row.ticket,
  Archivo: row.nombre_archivo,
});

export default function TrReporteSireList() {
  const params = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth0();
  const { confirmDialog } = useDialog();

  const [periodoTrabajo, setPeriodoTrabajo] = useState(params.periodo || "");
  const [contabilidadTrabajo, setContabilidadTrabajo] = useState(params.documento_id || "");
  const [periodos, setPeriodos] = useState([]);
  const [contabilidades, setContabilidades] = useState([]);
  const [registro, setRegistro] = useState([]);
  const [observaciones, setObservaciones] = useState([]);
  const [resumen, setResumen] = useState({});
  const [comparacion, setComparacion] = useState([]);
  const [resumenComparacion, setResumenComparacion] = useState({});
  const [busqueda, setBusqueda] = useState("");
  const [diaSel, setDiaSel] = useState("*");
  const [filtroResumen, setFiltroResumen] = useState("");
  const [filtroComparacion, setFiltroComparacion] = useState("");
  const [tab, setTab] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [cargandoComparacion, setCargandoComparacion] = useState(false);
  const [sireSunat, setSireSunat] = useState({
    ticket: "",
    fechaGeneracion: null,
    nombreArchivo: "",
    reutilizado: false,
    importacion: null,
    cargandoGuardado: false,
    errorGuardado: "",
    cargandoTicket: false,
    cargandoEstado: false,
    descargando: false,
  });
  const [sireProgreso, setSireProgreso] = useState({ valor: 0, etapa: "" });

  const cargarCombos = useCallback(async () => {
    const [periodosResponse, contabilidadesResponse] = await Promise.all([
      axios.get(`${backHost}/usuario/periodos/${params.id_anfitrion}`),
      axios.get(`${backHost}/usuario/contabilidades/${params.id_anfitrion}/${params.id_invitado}`),
    ]);

    setPeriodos(periodosResponse.data || []);
    setContabilidades(contabilidadesResponse.data || []);

    if (!periodoTrabajo && periodosResponse.data?.[0]?.periodo) setPeriodoTrabajo(periodosResponse.data[0].periodo);
    if ((!contabilidadTrabajo || contabilidadTrabajo === "-") && contabilidadesResponse.data?.[0]?.documento_id) {
      setContabilidadTrabajo(contabilidadesResponse.data[0].documento_id);
    }
  }, [contabilidadTrabajo, params.id_anfitrion, params.id_invitado, periodoTrabajo]);

  const cargarRegistro = useCallback(async () => {
    if (!periodoTrabajo || !contabilidadTrabajo || contabilidadTrabajo === "-") return;

    setCargando(true);
    try {
      const response = await axios.get(`${backHost}/mve_transventa/cpe/registro-sire/${periodoTrabajo}/${params.id_anfitrion}/${contabilidadTrabajo}`);
      setRegistro(response.data?.data || []);
      setObservaciones(response.data?.observaciones || []);
      setResumen(response.data?.resumen || {});
    } catch (error) {
      await confirmDialog({
        title: "No se pudo cargar Reporte SIRE",
        message: error?.response?.data?.message || "No se pudo obtener el registro tributario de transporte.",
        icon: "error",
        confirmText: "ACEPTAR",
      });
    } finally {
      setCargando(false);
    }
  }, [confirmDialog, contabilidadTrabajo, params.id_anfitrion, periodoTrabajo]);

  const cargarComparacion = useCallback(async () => {
    if (!periodoTrabajo || !contabilidadTrabajo || contabilidadTrabajo === "-") return;

    setCargandoComparacion(true);
    try {
      const response = await axios.get(`${backHost}/mve_transventa/cpe/comparacion-sire/${periodoTrabajo}/${params.id_anfitrion}/${contabilidadTrabajo}?id_libro=014`);
      setComparacion(response.data?.data || []);
      setResumenComparacion(response.data?.resumen || {});
    } catch (error) {
      await confirmDialog({
        title: "No se pudo comparar SIRe",
        message: error?.response?.data?.message || "Primero importa la propuesta SIRe desde SUNAT y vuelve a comparar.",
        icon: "warning",
        confirmText: "ACEPTAR",
      });
      setComparacion([]);
      setResumenComparacion({});
    } finally {
      setCargandoComparacion(false);
    }
  }, [confirmDialog, contabilidadTrabajo, params.id_anfitrion, periodoTrabajo]);

  useEffect(() => {
    if (!isAuthenticated || !user?.email) return;
    cargarCombos();
  }, [cargarCombos, isAuthenticated, user]);

  useEffect(() => {
    cargarRegistro();
  }, [cargarRegistro]);

  useEffect(() => {
    if (tab === 2) cargarComparacion();
  }, [cargarComparacion, tab]);

  useEffect(() => {
    let vigente = true;
    setSireSunat({
      ticket: "", fechaGeneracion: null, nombreArchivo: "", reutilizado: false, importacion: null,
      cargandoGuardado: true, errorGuardado: "",
      cargandoTicket: false, cargandoEstado: false, descargando: false,
    });
    setSireProgreso({ valor: 0, etapa: "" });
    if (!periodoTrabajo || !contabilidadTrabajo || contabilidadTrabajo === "-") {
      setSireSunat((prev) => ({ ...prev, cargandoGuardado: false }));
      return () => { vigente = false; };
    }
    axios.get(`${backHost}/transporte/sire/propuesta/ultima/${periodoTrabajo}/${params.id_anfitrion}/${contabilidadTrabajo}?id_libro=014`)
      .then(({ data }) => {
        if (!vigente) return;
        setSireSunat((prev) => ({
          ...prev,
          ticket: data?.ticket || "",
          fechaGeneracion: data?.fecha_generacion || null,
          nombreArchivo: data?.nombre_archivo_rep || "",
          reutilizado: Boolean(data?.reutilizado),
          importacion: data?.importacion || null,
          errorGuardado: data?.advertencia || "",
          cargandoGuardado: false,
        }));
      })
      .catch((error) => {
        if (!vigente) return;
        setSireSunat((prev) => ({
          ...prev, cargandoGuardado: false,
          errorGuardado: error?.response?.data?.message || "No se pudo recuperar el ultimo ticket guardado.",
        }));
      });
    return () => { vigente = false; };
  }, [contabilidadTrabajo, params.id_anfitrion, periodoTrabajo]);

  const actualizarTrasReemplazo = useCallback(async () => {
    setComparacion([]);
    setResumenComparacion({});
    setSireSunat((prev) => ({ ...prev, ticket: '', nombreArchivo: '', importacion: null }));
    const { data } = await axios.get(`${backHost}/transporte/sire/propuesta/ultima/${periodoTrabajo}/${params.id_anfitrion}/${contabilidadTrabajo}?id_libro=014`);
    setSireSunat((prev) => ({ ...prev, ticket: data.ticket || '', nombreArchivo: data.nombre_archivo_rep || '',
      fechaGeneracion: data.fecha_generacion || null, importacion: data.importacion || null }));
  }, [contabilidadTrabajo, params.id_anfitrion, periodoTrabajo]);
  const dataVisible = useMemo(() => {
    const base = tab === 2 ? comparacion : tab === 3 ? observaciones : registro;
    const baseDia = diaSel && diaSel !== "*"
      ? base.filter((row) => String(row.fecha_emision || "").slice(8, 10) === String(diaSel).padStart(2, "0"))
      : base;
    const baseComparacion = tab !== 2 || !filtroComparacion ? baseDia : baseDia.filter((row) => {
      const severidad = String(row.severidad || "").toLowerCase();
      const categoria = String(row.categoria || "").toLowerCase();
      const resultado = String(row.resultado || "").toUpperCase();
      if (filtroComparacion === "criticos") return severidad === "critico";
      if (filtroComparacion === "medios") return severidad === "medio";
      if (filtroComparacion === "faltantes") return categoria.includes("faltante");
      if (filtroComparacion === "diferencias") return resultado === "DIFERENCIA";
      if (filtroComparacion === "duplicados") return categoria.includes("duplicado");
      return true;
    });
    const baseResumen = tab !== 0 || !filtroResumen ? baseComparacion : baseComparacion.filter((row) => {
      if (filtroResumen === "observaciones") return Array.isArray(row.observaciones) && row.observaciones.length > 0;
      if (filtroResumen === "anulados") return String(row.estado_sunat || "").toUpperCase() === "ANULADO";
      if (filtroResumen === "gravada") return Number(row.base_gravada || 0) > 0;
      if (filtroResumen === "exonerado") return Number(row.exonerado || 0) > 0;
      if (filtroResumen === "inafecto") return Number(row.inafecto || 0) > 0;
      if (filtroResumen === "igv") return Number(row.igv || 0) > 0;
      if (filtroResumen === "total") return Number(row.total || 0) > 0;
      return true;
    });
    const filtro = busqueda.trim().toLowerCase();
    if (!filtro) return baseResumen;
    return baseResumen.filter((row) => [
      row.fecha_emision,
      row.tipo_comprobante,
      row.serie,
      row.numero,
      row.cliente,
      row.nro_doc_cliente,
      row.estado_sunat,
      row.modo_envio,
      row.numero_rdi,
      row.ticket,
      row.codigo_cdr,
      row.descripcion_cdr,
      row.resultado,
      row.severidad,
      row.categoria,
      row.observacion,
      ...(Array.isArray(row.observaciones) ? row.observaciones : []),
    ].some((campo) => texto(campo).toLowerCase().includes(filtro)));
  }, [busqueda, comparacion, diaSel, filtroComparacion, filtroResumen, observaciones, registro, tab]);

  const registroDia = useMemo(() => (
    diaSel && diaSel !== "*"
      ? registro.filter((row) => String(row.fecha_emision || "").slice(8, 10) === String(diaSel).padStart(2, "0"))
      : registro
  ), [diaSel, registro]);

  const resumenRegistro = useMemo(() => registroDia.reduce((acc, row) => {
    acc.total_comprobantes += 1;
    acc.total_observaciones += Array.isArray(row.observaciones) && row.observaciones.length > 0 ? 1 : 0;
    acc.total_anulados += String(row.estado_sunat || "").toUpperCase() === "ANULADO" ? 1 : 0;
    acc.total_base_gravada += Number(row.base_gravada || 0);
    acc.total_exonerado += Number(row.exonerado || 0);
    acc.total_inafecto += Number(row.inafecto || 0);
    acc.total_igv += Number(row.igv || 0);
    acc.total += Number(row.total || 0);
    return acc;
  }, {
    total_comprobantes: 0,
    total_observaciones: 0,
    total_anulados: 0,
    total_base_gravada: 0,
    total_exonerado: 0,
    total_inafecto: 0,
    total_igv: 0,
    total: 0,
  }), [registroDia]);

  const handleResumenFilter = (key) => {
    setFiltroResumen((current) => current === key ? "" : key);
  };

  const handleDayFilter = (selectedDay) => {
    const dia = selectedDay === "*" ? "*" : String(selectedDay).padStart(2, "0");
    setDiaSel(dia);
  };

  const resumenCards = [
    { key: "", label: "Comprobantes", value: resumenRegistro.total_comprobantes || 0, icon: FileText, color: palette.accent, soft: palette.accentSoft },
    { key: "observaciones", label: "Observaciones", value: resumenRegistro.total_observaciones || 0, icon: AlertTriangle, color: palette.warning, soft: palette.warningSoft },
    { key: "anulados", label: "Anulados", value: resumenRegistro.total_anulados || 0, icon: Ban, color: palette.danger, soft: palette.dangerSoft },
    { key: "gravada", label: "Base gravada", value: money(resumenRegistro.total_base_gravada), icon: Calculator, color: palette.success, soft: palette.successSoft },
    { key: "exonerado", label: "Exonerado", value: money(resumenRegistro.total_exonerado), icon: ReceiptText, color: palette.accent, soft: palette.accentSoft },
    { key: "inafecto", label: "Inafecto", value: money(resumenRegistro.total_inafecto), icon: Sigma, color: palette.muted, soft: palette.chip },
    { key: "igv", label: "IGV", value: money(resumenRegistro.total_igv), icon: Banknote, color: palette.warning, soft: palette.warningSoft },
    { key: "total", label: "Total", value: money(resumenRegistro.total), icon: Banknote, color: palette.success, soft: palette.successSoft },
  ];

  const comparacionCards = [
    { key: "", label: "Hallazgos", value: resumenComparacion.total || 0, icon: FileText, color: palette.accent, soft: palette.accentSoft },
    { key: "criticos", label: "Criticos", value: resumenComparacion.criticos || 0, icon: AlertTriangle, color: palette.danger, soft: palette.dangerSoft },
    { key: "medios", label: "Medios", value: resumenComparacion.medios || 0, icon: AlertTriangle, color: palette.warning, soft: palette.warningSoft },
    { key: "faltantes", label: "Faltantes", value: resumenComparacion.faltantes || 0, icon: ReceiptText, color: palette.danger, soft: palette.dangerSoft },
    { key: "diferencias", label: "Diferencias", value: resumenComparacion.diferencias || 0, icon: Calculator, color: palette.warning, soft: palette.warningSoft },
    { key: "duplicados", label: "Duplicados", value: resumenComparacion.duplicados || 0, icon: Sigma, color: palette.accent, soft: palette.accentSoft },
  ];

  const handlePeriodoChange = (value) => {
    setPeriodoTrabajo(value);
    sessionStorage.setItem("periodo_trabajo", value);
    navigate(`/ad_transportesire/${params.id_anfitrion}/${params.id_invitado}/${value}/${contabilidadTrabajo}`);
  };

  const handleContabilidadChange = (value) => {
    setContabilidadTrabajo(value);
    sessionStorage.setItem("contabilidad_trabajo", value);
    const seleccion = contabilidades.find((item) => String(item.documento_id) === String(value));
    if (seleccion?.razon_social) sessionStorage.setItem("contabilidad_nombre", seleccion.razon_social);
    navigate(`/ad_transportesire/${params.id_anfitrion}/${params.id_invitado}/${periodoTrabajo}/${value}`);
  };

  const exportarExcel = () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(registro.map(filaExcel)), "Registro");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(observaciones.map(filaExcel)), "Observaciones");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(comparacion.map(filaComparacionExcel)), "Comparacion");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{
      Comprobantes: resumen.total_comprobantes || 0,
      Observaciones: resumen.total_observaciones || 0,
      "Hallazgos comparacion": resumenComparacion.total || 0,
      Criticos: resumenComparacion.criticos || 0,
      Medios: resumenComparacion.medios || 0,
      Faltantes: resumenComparacion.faltantes || 0,
      Diferencias: resumenComparacion.diferencias || 0,
      Duplicados: resumenComparacion.duplicados || 0,
      "Base gravada": Number(resumen.total_base_gravada || 0),
      Exonerado: Number(resumen.total_exonerado || 0),
      Inafecto: Number(resumen.total_inafecto || 0),
      IGV: Number(resumen.total_igv || 0),
      Total: Number(resumen.total || 0),
    }]), "Resumen");
    XLSX.writeFile(workbook, `reporte_sire_transporte_${contabilidadTrabajo}_${periodoTrabajo}.xlsx`);
  };

  const payloadSireSunat = useCallback(() => ({
    id_anfitrion: params.id_anfitrion,
    documento_id: contabilidadTrabajo,
    periodo: periodoTrabajo,
    id_libro: "014",
  }), [contabilidadTrabajo, params.id_anfitrion, periodoTrabajo]);

  const generarTicketSunat = async () => {
    if (!periodoTrabajo || !contabilidadTrabajo || contabilidadTrabajo === "-") return;

    if (sireSunat.ticket || sireSunat.importacion || sireSunat.nombreArchivo) {
      const confirmacion = await confirmDialog({
        title: "Generar nuevo ticket SIRe",
        message: sireSunat.importacion
          ? `Ya existe una propuesta SIRe importada con ${sireSunat.importacion.cantidad_registros || 0} registros. Si continuas, se preparara un nuevo flujo SIRe y una consulta posterior podria reemplazar el detalle actual.`
          : "Ya existe un ticket o archivo SIRe en pantalla. Si continuas, se preparara un nuevo flujo SIRe para este periodo.",
        icon: "warning",
        confirmText: "CONTINUAR",
        cancelText: "CANCELAR",
      });

      if (!confirmacion?.isConfirmed) return;
    }

    setSireSunat((prev) => ({ ...prev, cargandoTicket: true }));
    try {
      const response = await axios.post(`${backHost}/transporte/sire/propuesta/ticket`, { ...payloadSireSunat(), reutilizar_existente: false });
      setSireSunat((prev) => ({
        ...prev,
        ticket: response.data?.ticket || "",
        fechaGeneracion: response.data?.fecha_generacion || null,
        reutilizado: Boolean(response.data?.reutilizado),
        nombreArchivo: "",
        importacion: null,
        errorGuardado: "",
      }));
    } catch (error) {
      await confirmDialog({
        title: "No se pudo generar ticket SIRe",
        message: error?.response?.data?.message || "SUNAT no devolvio ticket de propuesta.",
        icon: "error",
        confirmText: "ACEPTAR",
      });
    } finally {
      setSireSunat((prev) => ({ ...prev, cargandoTicket: false }));
    }
  };

  const consultarEstadoSunat = async () => {
    if (!sireSunat.ticket) {
      await confirmDialog({
        title: "Falta ticket",
        message: "Primero genera o recupera el ticket de la propuesta SIRe.",
        icon: "warning",
        confirmText: "ACEPTAR",
      });
      return;
    }

    if (sireSunat.importacion) {
      const confirmacion = await confirmDialog({
        title: "Reemplazar propuesta SIRe",
        message: `Ya existe una propuesta importada para este ticket con ${sireSunat.importacion.cantidad_registros || 0} registros. Si continuas, se borrara el detalle anterior y se importara nuevamente desde SUNAT.`,
        icon: "warning",
        confirmText: "REEMPLAZAR",
        cancelText: "CANCELAR",
      });

      if (!confirmacion?.isConfirmed) return;
    }

    setSireSunat((prev) => ({ ...prev, cargandoEstado: true }));
    setSireProgreso({ valor: 8, etapa: "Consultando ticket en SUNAT" });
    const progresoTimer = window.setInterval(() => {
      setSireProgreso((prev) => {
        const siguiente = Math.min(prev.valor + (prev.valor < 45 ? 7 : prev.valor < 78 ? 4 : 2), 92);
        const etapa = siguiente < 38
          ? "Consultando ticket en SUNAT"
          : siguiente < 70
            ? "Descargando propuesta SIRe"
            : "Guardando detalle en tabla interna";
        return { valor: siguiente, etapa };
      });
    }, 650);

    try {
      const response = await axios.post(`${backHost}/transporte/sire/propuesta/estado`, {
        ...payloadSireSunat(),
        ticket: sireSunat.ticket,
      });
      setSireProgreso({ valor: 100, etapa: "Propuesta SIRe importada" });
      setSireSunat((prev) => ({
        ...prev,
        nombreArchivo: response.data?.nombre_archivo_rep || "",
        importacion: response.data?.importacion || prev.importacion,
      }));
      await cargarComparacion();
    } catch (error) {
      await confirmDialog({
        title: "No se pudo consultar estado SIRe",
        message: error?.response?.data?.message || "SUNAT no devolvio el estado del ticket.",
        icon: "error",
        confirmText: "ACEPTAR",
      });
    } finally {
      window.clearInterval(progresoTimer);
      window.setTimeout(() => {
        setSireSunat((prev) => ({ ...prev, cargandoEstado: false }));
        setSireProgreso({ valor: 0, etapa: "" });
      }, 500);
    }
  };

  const descargarPropuestaSunat = async () => {
    if (!sireSunat.ticket || !sireSunat.nombreArchivo) {
      await confirmDialog({
        title: "Propuesta no disponible",
        message: "Consulta el estado del ticket hasta que SUNAT devuelva el nombre del archivo.",
        icon: "warning",
        confirmText: "ACEPTAR",
      });
      return;
    }

    setSireSunat((prev) => ({ ...prev, descargando: true }));
    try {
      const response = await axios.post(`${backHost}/transporte/sire/propuesta/descargar`, {
        ...payloadSireSunat(),
        ticket: sireSunat.ticket,
        nombre_archivo_rep: sireSunat.nombreArchivo,
      }, { responseType: "blob" });

      const blob = new Blob([response.data], { type: response.headers["content-type"] || "application/zip" });
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = sireSunat.nombreArchivo;
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
      URL.revokeObjectURL(url);
    } catch (error) {
      await confirmDialog({
        title: "No se pudo descargar propuesta SIRe",
        message: error?.response?.data?.message || "SUNAT no permitio descargar el archivo de propuesta.",
        icon: "error",
        confirmText: "ACEPTAR",
      });
    } finally {
      setSireSunat((prev) => ({ ...prev, descargando: false }));
    }
  };

  const columns = [
    { name: "Fecha emision", selector: (row) => row.fecha_emision, sortable: true, width: "118px" },
    { name: "Tipo", selector: (row) => row.tipo_comprobante, sortable: true, width: "96px", cell: (row) => tipoComprobanteLabel(row.tipo_comprobante) },
    { name: "Serie", selector: (row) => row.serie, sortable: true, width: "74px" },
    { name: "Numero", selector: (row) => row.numero, sortable: true, width: "92px" },
    { name: "Elem.", selector: (row) => row.elemento, sortable: true, width: "58px" },
    {
      name: "Estado SUNAT",
      selector: (row) => row.estado_sunat,
      sortable: true,
      width: "118px",
      cell: (row) => {
        const sx = estadoSx[row.estado_sunat] || { color: palette.muted, backgroundColor: palette.surfaceAlt };
        return <Box sx={{ px: 0.8, py: 0.35, borderRadius: 1, fontSize: 11, fontWeight: 800, ...sx }}>{row.estado_sunat || "-"}</Box>;
      },
    },
    { name: "Codigo CDR", selector: (row) => row.codigo_cdr, sortable: true, width: "108px" },
    { name: "Descripcion CDR", selector: (row) => row.descripcion_cdr, sortable: true, minWidth: "260px", wrap: true },
    { name: "Tipo doc", selector: (row) => row.tipo_doc_cliente, sortable: true, width: "72px" },
    { name: "Nro doc cliente", selector: (row) => row.nro_doc_cliente, sortable: true, width: "112px" },
    { name: "Cliente / razon social", selector: (row) => row.cliente, sortable: true, minWidth: "220px", wrap: true },
    { name: "Base gravada", selector: (row) => Number(row.base_gravada || 0), sortable: true, width: "122px", right: true, cell: (row) => money(row.base_gravada) },
    { name: "Exonerado", selector: (row) => Number(row.exonerado || 0), sortable: true, width: "112px", right: true, cell: (row) => money(row.exonerado) },
    { name: "Inafecto", selector: (row) => Number(row.inafecto || 0), sortable: true, width: "102px", right: true, cell: (row) => money(row.inafecto) },
    { name: "IGV", selector: (row) => Number(row.igv || 0), sortable: true, width: "96px", right: true, cell: (row) => money(row.igv) },
    { name: "Total", selector: (row) => Number(row.total || 0), sortable: true, width: "112px", right: true, cell: (row) => money(row.total) },
    { name: "Moneda", selector: (row) => row.moneda, sortable: true, width: "86px" },
    { name: "Modo envio", selector: (row) => row.modo_envio, sortable: true, width: "90px" },
    { name: "Nro RDI", selector: (row) => row.numero_rdi, sortable: true, width: "166px" },
    { name: "Ticket", selector: (row) => row.ticket, sortable: true, width: "158px" },
    { name: "Observaciones", selector: (row) => (row.observaciones || []).join("; "), sortable: true, minWidth: "240px", wrap: true },
  ];

  const observacionesColumns = [
    { name: "Fecha emision", selector: (row) => row.fecha_emision, sortable: true, width: "118px" },
    { name: "Tipo", selector: (row) => row.tipo_comprobante, sortable: true, width: "96px", cell: (row) => tipoComprobanteLabel(row.tipo_comprobante) },
    { name: "Serie", selector: (row) => row.serie, sortable: true, width: "74px" },
    { name: "Numero", selector: (row) => row.numero, sortable: true, width: "92px" },
    {
      name: "Observaciones",
      selector: (row) => (row.observaciones || []).join("; "),
      sortable: true,
      minWidth: "260px",
      wrap: true,
      cell: (row) => (
        <Typography sx={{ color: palette.warning, fontSize: 12, fontWeight: 800, whiteSpace: "pre-line" }}>
          {(row.observaciones || []).join("\n") || "-"}
        </Typography>
      ),
    },
    { name: "Codigo CDR", selector: (row) => row.codigo_cdr, sortable: true, width: "110px" },
    { name: "Descripcion CDR", selector: (row) => row.descripcion_cdr, sortable: true, minWidth: "300px", wrap: true },
    {
      name: "Estado SUNAT",
      selector: (row) => row.estado_sunat,
      sortable: true,
      width: "118px",
      cell: (row) => {
        const sx = estadoSx[row.estado_sunat] || { color: palette.muted, backgroundColor: palette.surfaceAlt };
        return <Box sx={{ px: 0.8, py: 0.35, borderRadius: 1, fontSize: 11, fontWeight: 800, ...sx }}>{row.estado_sunat || "-"}</Box>;
      },
    },
    { name: "Modo envio", selector: (row) => row.modo_envio, sortable: true, width: "90px" },
    { name: "Nro RDI", selector: (row) => row.numero_rdi, sortable: true, width: "166px" },
    { name: "Ticket", selector: (row) => row.ticket, sortable: true, width: "158px" },
    { name: "Cliente / razon social", selector: (row) => row.cliente, sortable: true, minWidth: "220px", wrap: true },
    { name: "Total", selector: (row) => Number(row.total || 0), sortable: true, width: "112px", right: true, cell: (row) => money(row.total) },
  ];

  const comparacionColumns = [
    {
      name: "Severidad",
      selector: (row) => row.severidad,
      sortable: true,
      width: "92px",
      cell: (row) => {
        const value = String(row.severidad || "").toUpperCase();
        const sx = value === "CRITICO"
          ? { color: palette.danger, backgroundColor: palette.dangerSoft }
          : value === "MEDIO"
            ? { color: palette.warning, backgroundColor: palette.warningSoft }
            : { color: palette.muted, backgroundColor: palette.surfaceAlt };
        return <Box sx={{ px: 0.75, py: 0.35, borderRadius: 1, fontSize: 11, fontWeight: 900, ...sx }}>{value || "-"}</Box>;
      },
    },
    { name: "Resultado", selector: (row) => row.resultado, sortable: true, width: "116px" },
    { name: "Categoria", selector: (row) => row.categoria, sortable: true, minWidth: "170px", wrap: true },
    { name: "Observacion", selector: (row) => row.observacion, sortable: true, minWidth: "230px", wrap: true },
    { name: "Origen", selector: (row) => row.origen, sortable: true, width: "82px" },
    {
      name: "Fecha SIRE",
      selector: (row) => row.fecha_emision_sire || "",
      sortable: true,
      width: "132px",
      cell: (row) => <span style={{ whiteSpace: "nowrap" }}>{fechaComprobante(row.fecha_emision_sire)}</span>,
    },
    {
      name: "Fecha XPERT",
      selector: (row) => row.fecha_emision_xpert || "",
      sortable: true,
      width: "132px",
      cell: (row) => <span style={{ whiteSpace: "nowrap" }}>{fechaComprobante(row.fecha_emision_xpert)}</span>,
    },
    { name: "Tipo", selector: (row) => row.tipo_comprobante, sortable: true, width: "92px", cell: (row) => tipoComprobanteLabel(row.tipo_comprobante) },
    { name: "Serie", selector: (row) => row.serie, sortable: true, width: "74px" },
    { name: "Numero", selector: (row) => row.numero, sortable: true, width: "92px" },
    { name: "Cliente / razon social", selector: (row) => row.cliente, sortable: true, minWidth: "220px", wrap: true },
    { name: "Base SIRe", selector: (row) => Number(row.base_gravada_sire || 0), sortable: true, width: "108px", right: true, cell: (row) => money(row.base_gravada_sire) },
    { name: "Base XPERT", selector: (row) => Number(row.base_gravada_xpert || 0), sortable: true, width: "112px", right: true, cell: (row) => money(row.base_gravada_xpert) },
    { name: "Exon. SIRe", selector: (row) => Number(row.exonerado_sire || 0), sortable: true, width: "104px", right: true, cell: (row) => money(row.exonerado_sire) },
    { name: "Exon. XPERT", selector: (row) => Number(row.exonerado_xpert || 0), sortable: true, width: "112px", right: true, cell: (row) => money(row.exonerado_xpert) },
    { name: "Inaf. SIRe", selector: (row) => Number(row.inafecto_sire || 0), sortable: true, width: "104px", right: true, cell: (row) => money(row.inafecto_sire) },
    { name: "Inaf. XPERT", selector: (row) => Number(row.inafecto_xpert || 0), sortable: true, width: "112px", right: true, cell: (row) => money(row.inafecto_xpert) },
    { name: "IGV SIRe", selector: (row) => Number(row.igv_sire || 0), sortable: true, width: "96px", right: true, cell: (row) => money(row.igv_sire) },
    { name: "IGV XPERT", selector: (row) => Number(row.igv_xpert || 0), sortable: true, width: "104px", right: true, cell: (row) => money(row.igv_xpert) },
    { name: "Total SIRe", selector: (row) => Number(row.total_sire || 0), sortable: true, width: "108px", right: true, cell: (row) => money(row.total_sire) },
    { name: "Total XPERT", selector: (row) => Number(row.total_xpert || 0), sortable: true, width: "116px", right: true, cell: (row) => money(row.total_xpert) },
    { name: "Diferencia", selector: (row) => Number(row.diferencia_total || 0), sortable: true, width: "112px", right: true, cell: (row) => money(row.diferencia_total) },
    { name: "Ticket", selector: (row) => row.ticket, sortable: true, width: "158px" },
  ];

  return (
    <Box sx={{ minHeight: "100%", backgroundColor: "transparent", p: { xs: 1, md: 1.5, xl: 2 } }}>
      <Box sx={{ width: "100%", maxWidth: "100%", mx: "auto", display: "grid", gap: 0.65 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: { xs: 0.5, sm: 0.75 },
            mb: { xs: 0.5, md: 0.5 },
            minWidth: 0,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: palette.text, fontWeight: 700, fontSize: 22, lineHeight: 1.2 }}>
              Reporte SIRE
            </Typography>
            <Typography sx={{ color: palette.muted, fontSize: 13, mt: 0.5 }}>
              {tab === 2
                ? `${dataVisible.length} visibles de ${comparacion.length} hallazgos`
                : `${dataVisible.length} visibles de ${registro.length} comprobantes`}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              alignSelf: { xs: "stretch", sm: "flex-start" },
              justifyContent: "flex-end",
              gap: { xs: 0.5, sm: 0.5 },
              width: { xs: "100%", sm: "auto" },
              flexWrap: { xs: "wrap", sm: "wrap", lg: "nowrap" },
            }}
          >
            <AppSearch
              placeholder="Filtrar comprobante, cliente, RDI, ticket u observacion"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              width={{ xs: "100%", sm: 320 }}
              height={38}
            />
            <Button
              variant="contained"
              onClick={cargarRegistro}
              disabled={cargando}
              sx={{ height: 38, minHeight: 38, borderRadius: 1, textTransform: "none", fontSize: 12, fontWeight: 800, whiteSpace: "nowrap", px: 1.25 }}
            >
              <RefreshIcon sx={{ fontSize: 17, mr: 0.75 }} />
              Actualizar
            </Button>
          </Box>
        </Box>

        <TrFiltros
          periodoTrabajo={periodoTrabajo}
          periodoSelect={periodos}
          contabilidadTrabajo={contabilidadTrabajo}
          contabilidadSelect={contabilidades}
          puntosVentaAsignados={[]}
          puntoVentaTrabajo=""
          onPeriodoSelect={handlePeriodoChange}
          onContabilidadSelect={handleContabilidadChange}
          onPuntoVentaSelect={() => {}}
          compact
        />

        <Box sx={{ px: { xs: 0.25, md: 0.5 }, py: 0.15, minWidth: 0 }}>
          <DaySelector period={periodoTrabajo || params.periodo} onDaySelect={handleDayFilter} />
        </Box>

        <Box sx={{ backgroundColor: palette.surface, borderRadius: 1, minWidth: 0, maxWidth: "100%", overflow: "hidden" }}>
        <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ minHeight: 42, px: 1, borderBottom: `1px solid ${palette.borderSoft}`, "& .MuiTab-root": { minHeight: 42, color: palette.muted, textTransform: "none", fontSize: 13, fontWeight: 800 }, "& .Mui-selected": { color: palette.accent } }}>
          <Tab label="Registro" />
          <Tab label="Propuesta SUNAT" />
          <Tab label="Comparacion" />
          <Tab label={`Observaciones (${observaciones.length})`} />
          <Tab label="Exportar" />
        </Tabs>

        {tab === 1 ? (
          <Box sx={{ p: { xs: 0.85, md: 1 }, display: "grid", gap: 0.9 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 0.75 }}>
              <Box sx={{ border: `1px solid ${palette.borderSoft}`, borderRadius: 1, p: 1, backgroundColor: palette.surfaceAlt, minWidth: 0 }}>
                <Typography sx={{ color: palette.muted, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Ticket</Typography>
                <Typography sx={{ color: palette.text, fontSize: 18, fontWeight: 900, mt: 0.35 }} noWrap>
                  {sireSunat.ticket || "-"}
                </Typography>
                {sireSunat.ticket && (
                  <Typography sx={{ color: palette.text, fontSize: 12, mt: 0.35 }}>
                    Generado: {fechaHoraTicket(sireSunat.fechaGeneracion)}{sireSunat.fechaGeneracion ? " (Lima)" : ""}
                  </Typography>
                )}
                <Typography sx={{ color: palette.muted, fontSize: 12, mt: 0.35 }}>
                  {sireSunat.cargandoGuardado ? "Cargando ultimo ticket guardado..." : sireSunat.errorGuardado || (sireSunat.reutilizado ? "Ultimo ticket recuperado de la base de datos." : sireSunat.ticket ? "Nuevo ticket generado." : "No hay ticket guardado para este periodo.")}
                </Typography>
              </Box>
              <Box sx={{ border: `1px solid ${palette.borderSoft}`, borderRadius: 1, p: 1, backgroundColor: palette.surfaceAlt, minWidth: 0 }}>
                <Typography sx={{ color: palette.muted, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Archivo SUNAT</Typography>
                <Typography sx={{ color: palette.text, fontSize: 14, fontWeight: 850, mt: 0.35 }} noWrap>
                  {sireSunat.nombreArchivo || "-"}
                </Typography>
                <Typography sx={{ color: palette.muted, fontSize: 12, mt: 0.35 }}>
                  Disponible cuando SUNAT termina de procesar la propuesta.
                </Typography>
              </Box>
              <Box sx={{ border: `1px solid ${palette.borderSoft}`, borderRadius: 1, p: 1, backgroundColor: palette.surfaceAlt, minWidth: 0 }}>
                <Typography sx={{ color: palette.muted, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Registro interno</Typography>
                <Typography sx={{ color: palette.text, fontSize: 18, fontWeight: 900, mt: 0.35 }} noWrap>
                  {sireSunat.importacion ? `${sireSunat.importacion.cantidad_registros || 0} SIRe` : `${registro.length} comprobantes`}
                </Typography>
                <Typography sx={{ color: palette.muted, fontSize: 12, mt: 0.35 }}>
                  {sireSunat.importacion
                    ? "Propuesta guardada en tabla interna."
                    : `Periodo ${periodoTrabajo || "-"} / RUC ${contabilidadTrabajo || "-"}.`}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.65 }}>
              <Button
                variant="contained"
                onClick={generarTicketSunat}
                disabled={sireSunat.cargandoGuardado || sireSunat.cargandoTicket || sireSunat.cargandoEstado || sireSunat.descargando || !periodoTrabajo || !contabilidadTrabajo || contabilidadTrabajo === "-"}
                sx={{ borderRadius: 1, textTransform: "none", fontWeight: 800 }}
              >
                Generar nuevo ticket
              </Button>
              <Button
                variant="outlined"
                onClick={consultarEstadoSunat}
                disabled={sireSunat.cargandoGuardado || sireSunat.cargandoTicket || sireSunat.cargandoEstado || sireSunat.descargando || !sireSunat.ticket}
                startIcon={sireSunat.cargandoEstado ? <CircularProgress size={15} color="inherit" /> : null}
                sx={{ borderRadius: 1, textTransform: "none", fontWeight: 800 }}
              >
                {sireSunat.cargandoEstado ? "Consultando e importando..." : "Consultar estado"}
              </Button>
              <Button
                variant="outlined"
                onClick={descargarPropuestaSunat}
                disabled={sireSunat.cargandoGuardado || sireSunat.cargandoTicket || sireSunat.cargandoEstado || sireSunat.descargando || !sireSunat.ticket || !sireSunat.nombreArchivo}
                sx={{ borderRadius: 1, textTransform: "none", fontWeight: 800 }}
              >
                Descargar ZIP
              </Button>
            </Box>

            {sireSunat.cargandoEstado && (
              <Box sx={{ display: "grid", gap: 0.7, border: `1px solid ${palette.borderSoft}`, borderRadius: 1, p: 1, backgroundColor: palette.surfaceAlt }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ color: palette.text, fontSize: 13, fontWeight: 900 }} noWrap>
                      {sireProgreso.etapa || "Procesando propuesta SIRe"}
                    </Typography>
                    <Typography sx={{ color: palette.muted, fontSize: 11.5, fontWeight: 700 }} noWrap>
                      Ticket {sireSunat.ticket}
                    </Typography>
                  </Box>
                  <Typography sx={{ color: palette.accent, fontSize: 18, fontWeight: 950, minWidth: 48, textAlign: "right" }}>
                    {Math.round(sireProgreso.valor)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={sireProgreso.valor}
                  sx={{
                    height: 8,
                    borderRadius: 1,
                    backgroundColor: palette.borderSoft,
                    "& .MuiLinearProgress-bar": { borderRadius: 1 },
                  }}
                />
              </Box>
            )}
            <TrSirePresentacion
              key={`${params.id_anfitrion}-${contabilidadTrabajo}-${periodoTrabajo}-${sireSunat.ticket}`}
              backHost={backHost}
              idAnfitrion={params.id_anfitrion}
              idInvitado={params.id_invitado}
              empresa={contabilidades.find((item) => String(item.documento_id) === String(contabilidadTrabajo))?.razon_social}
              documentoId={contabilidadTrabajo}
              periodo={periodoTrabajo}
              ticket={sireSunat.ticket}
              importacion={sireSunat.importacion}
              cantidadSistema={registro.length}
              onCambioPropuesta={actualizarTrasReemplazo}
              ocupado={cargando || sireSunat.cargandoGuardado || sireSunat.cargandoTicket || sireSunat.cargandoEstado || sireSunat.descargando}
            />
          </Box>
        ) : tab === 2 ? (
          <Box sx={{ p: { xs: 0.85, md: 1 }, display: "grid", gap: 0.9 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 0.75, flexWrap: "wrap", alignItems: "center" }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ color: palette.text, fontSize: 16, fontWeight: 900 }}>
                  Comparacion SIRe vs XPERT
                </Typography>
                <Typography sx={{ color: palette.muted, fontSize: 12.5, mt: 0.25 }}>
                  {comparacion.length > 0
                    ? `${dataVisible.length} visibles de ${comparacion.length} hallazgos`
                    : "Importa la propuesta SUNAT y ejecuta la comparacion del periodo."}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                <Button
                  variant="outlined"
                  onClick={() => setTab(1)}
                  sx={{ height: 36, borderRadius: 1, textTransform: "none", fontWeight: 800 }}
                >
                  Ir a presentacion
                </Button>
                <Button
                  variant="contained"
                  onClick={cargarComparacion}
                  disabled={cargandoComparacion || !periodoTrabajo || !contabilidadTrabajo || contabilidadTrabajo === "-"}
                  sx={{ height: 36, borderRadius: 1, textTransform: "none", fontWeight: 800 }}
                >
                  <RefreshIcon sx={{ fontSize: 17, mr: 0.75 }} />
                  Comparar
                </Button>
              </Box>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  lg: "repeat(6, minmax(0, 1fr))",
                },
                gap: 0.65,
              }}
            >
              {comparacionCards.map((item) => (
                <SireResumenCard
                  key={item.label}
                  {...item}
                  activo={item.key ? filtroComparacion === item.key : filtroComparacion === ""}
                  onClick={() => setFiltroComparacion((current) => current === item.key ? "" : item.key)}
                />
              ))}
            </Box>

            <Box
              sx={{
                width: "100%",
                maxWidth: "100%",
                minWidth: 0,
                display: "block",
                overflowX: "scroll",
                overflowY: "hidden",
                scrollbarWidth: "thin",
                scrollbarColor: `${palette.surfaceAlt} transparent`,
                "&::-webkit-scrollbar": { height: 10 },
                "&::-webkit-scrollbar-track": { backgroundColor: "transparent" },
                "&::-webkit-scrollbar-thumb": { backgroundColor: palette.surfaceAlt, borderRadius: 999 },
              }}
            >
              <Box sx={{ display: "inline-block", verticalAlign: "top", width: 3320, minWidth: 3320, maxWidth: "none" }}>
                <DataTable
                  theme="solarized"
                  columns={comparacionColumns}
                  data={dataVisible}
                  customStyles={{
                    ...tableStyles,
                    pagination: {
                      style: { ...tableStyles.pagination.style, justifyContent: "flex-start" },
                    },
                  }}
                  responsive={false}
                  pagination
                  paginationPerPage={15}
                  paginationRowsPerPageOptions={[15, 50, 100]}
                  progressPending={cargandoComparacion}
                  sortIcon={<ArrowDownward />}
                  dense
                  highlightOnHover
                />
              </Box>
            </Box>
          </Box>
        ) : tab === 4 ? (
          <Box sx={{ p: { xs: 0.75, md: 1 }, display: "grid", gap: 0.8 }}>
            <Box>
              <Button variant="contained" onClick={exportarExcel} disabled={registro.length === 0} sx={{ borderRadius: 1, textTransform: "none", fontWeight: 800 }}>
                Descargar Excel para contador
              </Button>
            </Box>
          </Box>
        ) : (
          <>
          {tab === 0 && (
            <Box
              sx={{
                px: { xs: 0.5, md: 0.75 },
                pt: 0.75,
                pb: 0.2,
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(4, minmax(0, 1fr))",
                  xl: "repeat(8, minmax(0, 1fr))",
                },
                gap: 0.65,
              }}
            >
              {resumenCards.map((item) => (
                <SireResumenCard
                  key={item.label}
                  {...item}
                  activo={item.key ? filtroResumen === item.key : filtroResumen === ""}
                  onClick={() => handleResumenFilter(item.key)}
                />
              ))}
            </Box>
          )}
          <Box
            sx={{
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              display: "block",
              overflowX: "scroll",
              overflowY: "hidden",
              px: { xs: 0.25, md: 0.75 },
              py: 0.75,
              scrollbarWidth: "thin",
              scrollbarColor: `${palette.surfaceAlt} transparent`,
              "&::-webkit-scrollbar": { height: 10 },
              "&::-webkit-scrollbar-track": { backgroundColor: "transparent" },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: palette.surfaceAlt,
                borderRadius: 999,
              },
              "& .rdt_Table": { minWidth: "100%" },
              "& .rdt_TableHeader": { minWidth: 0 },
              "& .rdt_Pagination": {
                width: "100%",
                minWidth: 0,
                justifyContent: "flex-start",
                paddingLeft: 1,
                paddingRight: 1,
                position: "sticky",
                left: 0,
              },
            }}
          >
            <Box
              sx={{
                display: "inline-block",
                verticalAlign: "top",
                width: tab === 3 ? 1950 : 3160,
                minWidth: tab === 3 ? 1950 : 3160,
                maxWidth: "none",
              }}
            >
              <DataTable
                theme="solarized"
                columns={tab === 3 ? observacionesColumns : columns}
                data={dataVisible}
                customStyles={tableStyles}
                responsive={false}
                pagination
                paginationPerPage={15}
                paginationRowsPerPageOptions={[15, 50, 100]}
                progressPending={cargando}
                sortIcon={<ArrowDownward />}
                dense
                highlightOnHover
              />
            </Box>
          </Box>
          </>
        )}
      </Box>
      </Box>
    </Box>
  );
}
