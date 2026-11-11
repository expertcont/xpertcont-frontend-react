import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, Chip, CircularProgress, Tooltip, Typography } from "@mui/material";
import { Calendar, Eye, FileText, RefreshCw } from "lucide-react";
import DataTable from "react-data-table-component";
import palette from "../../../theme/palette";
import DaySelector from "../AdminDias";
import TrHeader from "../transporte/common/components/TrHeader";
import TrFiltros from "../transporte/common/components/TrFiltros";
import { customStylesEncomienda, customStylesEncomiendaPanoramica } from "../transporte/common/components/TrOperacionRow";
import "../transporte/common/trDataTableTheme";
import AdminGreForm from "./AdminGreForm";
import { apiGre, consultarGre, destinatarioGre, estadoGre, fechaGre, greComprobante, rutaGreComercial } from "./greConsulta";

const validSelection = (value) => value && value !== "-" && value !== "default";

export default function AdminGreList({ panoramicMode = false }) {
  const params = useParams();
  const navigate = useNavigate();
  const backHost = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
  const [periodos, setPeriodos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [selection, setSelection] = useState(null);
  const [dia, setDia] = useState("*");
  const [busqueda, setBusqueda] = useState("");
  const [origen, setOrigen] = useState("todas");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [catalogError, setCatalogError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [activa, setActiva] = useState(null);
  const [formOpen,setFormOpen] = useState(false);
  const [mensaje,setMensaje] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setSelection(null);
    setCatalogError("");
    Promise.all([
      consultarGre(backHost, ["usuario", "periodos", params.id_anfitrion], controller.signal),
      consultarGre(backHost, ["usuario", "contabilidades", params.id_anfitrion, params.id_invitado], controller.signal),
    ]).then(([periodData, companyData]) => {
      if (controller.signal.aborted) return;
      if (!Array.isArray(periodData) || !Array.isArray(companyData)) throw new Error("No se pudieron cargar las empresas y períodos.");
      setPeriodos(periodData);
      setEmpresas(companyData);
      const preferredPeriod = validSelection(params.periodo) ? params.periodo : sessionStorage.getItem("periodo_trabajo");
      const preferredCompany = validSelection(params.documento_id) ? params.documento_id : sessionStorage.getItem("contabilidad_trabajo");
      setSelection({
        periodo: periodData.some((p) => p.periodo === preferredPeriod) ? preferredPeriod : periodData[0]?.periodo || "",
        empresa: companyData.some((c) => c.documento_id === preferredCompany) ? preferredCompany : companyData[0]?.documento_id || "",
      });
    }).catch((err) => { if (!controller.signal.aborted) setCatalogError(err.message); });
    return () => controller.abort();
  }, [backHost, params.id_anfitrion, params.id_invitado, params.periodo, params.documento_id, refresh]);

  const periodo = selection?.periodo || "";
  const empresa = selection?.empresa || "";

  useEffect(() => {
    setRows([]);
    setActiva(null);
    setFormOpen(false);
    setError("");
    setLoading(false);
    if (!periodo || !empresa) return undefined;
    const controller = new AbortController();
    setLoading(true);
    apiGre(backHost, [...rutaGreComercial(params.id_anfitrion,params.id_invitado,empresa),"guias"], {signal:controller.signal,query:{periodo,dia}})
      .then((data) => {
        if (controller.signal.aborted) return;
        if (!Array.isArray(data)) throw new Error("El listado de guías no tiene el formato esperado.");
        setRows(data);
      })
      .catch((err) => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [backHost, periodo, empresa, params.id_anfitrion, params.id_invitado, dia]);

  const filtradas = useMemo(() => {
    const text = busqueda.trim().toLocaleLowerCase("es");
    return rows.filter((row) => (
      (origen === "todas" || row.origen === origen) &&
      [greComprobante(row), destinatarioGre(row), row.destinatario_ruc_dni, row.ref_venta, row.glosa]
        .filter(Boolean).join(" ").toLocaleLowerCase("es").includes(text)
    ));
  }, [rows, busqueda, origen]);

  const cambiar = (key, value) => {
    if (!validSelection(value)) return;
    const next = { ...selection, [key]: value };
    setActiva(null);
    setRows([]);
    setSelection(next);
    sessionStorage.setItem(key === "periodo" ? "periodo_trabajo" : "contabilidad_trabajo", value);
    navigate(`/ad_guiasremision/${[params.id_anfitrion, params.id_invitado, next.periodo, next.empresa].map(encodeURIComponent).join("/")}`, { replace: true });
  };

  const columns = [{ name: "Guías de remisión", cell: (row) => (
    <Box sx={{ width: "100%", py: 1.2, display: "flex", alignItems: "center", gap: 1.5 }}>
      <FileText size={22} color={palette.accent} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 800, color: palette.text }}>{greComprobante(row)}</Typography>
          <Chip size="small" label={estadoGre(row)} sx={{ height: 23, fontSize: 11, color: row.vfirmado ? "#8fd19e" : "#f6c177", bgcolor: palette.chip }} />
        </Box>
        <Typography sx={{ fontSize: 13, color: palette.text, mt: 0.4, overflowWrap: "anywhere" }}>{destinatarioGre(row)} · {row.destinatario_ruc_dni || "—"}</Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: { xs: 0.7, md: 2 }, mt: 0.6, color: palette.muted }}>
          <Typography sx={{ fontSize: 12, display: "flex", alignItems: "center", gap: 0.5 }}><Calendar size={13} /> Emisión: {fechaGre(row.fecha_emision)}</Typography>
          <Typography sx={{ fontSize: 12 }}>Traslado: {fechaGre(row.fecha_traslado)}</Typography>
          <Typography sx={{ fontSize: 12 }}>{row.origen === "COMPRAS" ? "Compra de proveedores" : row.origen === "VENTAS" ? `Venta: ${row.ref_venta}` : "Otra guía"}</Typography>
        </Box>
        {row.glosa && <Typography sx={{ fontSize: 12, color: palette.muted, mt: 0.5, overflowWrap: "anywhere" }}>{row.glosa}</Typography>}
      </Box>
      <Tooltip title="Consultar guía"><Button aria-label={`Consultar guía ${greComprobante(row)}`} onClick={() => {setActiva(row);setFormOpen(true);}} sx={{ minWidth: 36, color: palette.accent, bgcolor: palette.chip, border: `1px solid ${palette.border}`, borderRadius: 2 }}><Eye size={18} /></Button></Tooltip>
    </Box>
  ) }];

  return (
    <Box sx={{ p: { xs: 1, md: panoramicMode ? 1.5 : 4 }, minHeight: "100%" }}>
      <Box sx={{ maxWidth: panoramicMode ? "100%" : 1440, mx: "auto", display: "grid", gap: 1.4 }}>
        <TrHeader titulo="Control de guías de remisión" contador={filtradas.length} contadorTexto="guías registradas" buscarTexto="Buscar guía, destinatario o venta..." valorBusqueda={busqueda} onBuscar={(event) => setBusqueda(event.target.value)} nuevoTexto="Nueva guía por compras" nuevoDeshabilitado={!empresa || !periodo} onNuevo={()=>{setActiva(null);setFormOpen(true);}} compactControles={panoramicMode}
          headerExtra={<Tooltip title="Actualizar listado"><Button aria-label="Actualizar guías" onClick={() => setRefresh((v) => v + 1)} sx={{ color: palette.muted, minWidth: 38 }}><RefreshCw size={18} /></Button></Tooltip>} />
        <TrFiltros periodoTrabajo={periodo} periodoSelect={periodos} contabilidadTrabajo={empresa} contabilidadSelect={empresas} puntosVentaAsignados={[]} onPeriodoSelect={(value) => cambiar("periodo", value)} onContabilidadSelect={(value) => cambiar("empresa", value)} compact={panoramicMode} />
        {periodo && <DaySelector key={periodo} period={periodo} onDaySelect={setDia} defaultToAll />}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
          {[["todas", "Todas"], ["COMPRAS", "Compras"], ["VENTAS", "Desde ventas"], ["OTRAS", "Otras"]].map(([value, label]) => <Button key={value} onClick={() => setOrigen(value)} aria-pressed={origen === value} sx={{ textTransform: "none", fontSize: 12, borderRadius: 2, px: 1.5, color: origen === value ? palette.accent : palette.muted, bgcolor: origen === value ? palette.accentSoft : palette.surface, border: `1px solid ${origen === value ? palette.accent : palette.borderSoft}` }}>{label}</Button>)}
        </Box>
        {catalogError && <Alert severity="error">{catalogError}</Alert>}
        {mensaje && <Alert severity={mensaje.advertencias?.length ? "warning" : "success"} onClose={()=>setMensaje(null)}>{mensaje.texto}{mensaje.advertencias?.map((aviso)=><Typography key={aviso} sx={{fontSize:13,mt:0.5}}>{aviso}</Typography>)}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        {!catalogError && !selection && <Box role="status" sx={{ p: 3, textAlign: "center" }}><CircularProgress size={24} aria-label="Cargando empresas y períodos" /></Box>}
        {selection && <DataTable theme="transportesDark" columns={columns} data={filtradas} keyField="gre" progressPending={loading} pagination paginationPerPage={10} paginationComponentOptions={{ rowsPerPageText: "Guías por página", rangeSeparatorText: "de" }} responsive highlightOnHover customStyles={panoramicMode ? customStylesEncomiendaPanoramica : customStylesEncomienda}
          noDataComponent={<Box sx={{ py: 5, px: 2, textAlign: "center", color: palette.muted }}><Typography sx={{ color: palette.text, fontWeight: 700 }}>{!empresa || !periodo ? "Selecciona una empresa y un período" : error ? "Listado no disponible" : "Sin guías para los filtros seleccionados"}</Typography></Box>} />}
        <Typography sx={{ color: palette.muted, fontSize: 12 }}>Guías de venta en consulta. Las compras pendientes pueden editarse y anularse localmente.</Typography>
      </Box>
      {formOpen && <AdminGreForm open row={activa} backHost={backHost} idAnfitrion={params.id_anfitrion} idInvitado={params.id_invitado} documentoId={empresa} periodo={periodo} onClose={()=>{setFormOpen(false);setActiva(null);}} onSaved={(guia)=>{
        setMensaje({texto:`Guía ${greComprobante(guia)} ${guia.estado==="ANULADA" ? "anulada localmente" : "guardada"}.`,advertencias:guia.advertencias || []});
        setFormOpen(false);setActiva(null);setDia("*");setRefresh((v)=>v+1);
        if (guia.periodo !== periodo) navigate(`/ad_guiasremision/${[params.id_anfitrion,params.id_invitado,guia.periodo,empresa].map(encodeURIComponent).join("/")}`,{replace:true});
      }} />}
    </Box>
  );
}
