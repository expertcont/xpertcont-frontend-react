import React, { useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Tab, Tabs, Typography } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import AppSearch from "../../../../components/ui/AppSearch";
import palette from "../../../../theme/palette";
import useSireCompras from "../hooks/useSireCompras";
import SireComprasPersonalizada from '../components/SireComprasPersonalizada';
import { filtrarCompras } from "../utils/comprasView";
import SireComprasContexto from "../components/SireComprasContexto";
import SireComprasDias from "../components/SireComprasDias";
import SireComprasTicket from "../components/SireComprasTicket";
import SireComprasResultados from "../components/SireComprasResultados";

const filtrosIniciales = { busqueda: "", dia: "*", resultado: "" };
export default function SireComprasPage() {
  const compras = useSireCompras();
  const [confirmacion, setConfirmacion] = useState(null);
  const [tab, setTab] = useState(0);
  const [seleccion, setSeleccion] = useState({ contexto: "", ...filtrosIniciales });
  const filtros = seleccion.contexto === compras.contexto ? seleccion : filtrosIniciales;
  const cambiarFiltro = valores => setSeleccion({ ...filtros, ...valores, contexto: compras.contexto });
  const observaciones = compras.datos.comparacion.filter(r => r.resultado !== "COINCIDE");
  const base = tab === 0 || tab === 4 ? compras.datos.sistema : tab === 1 ? compras.datos.propuesta?.detalle || [] : tab === 2 ? compras.datos.comparacion : observaciones;
  const rows = filtrarCompras(base, filtros);
  const solicitarTicket = () => {
    if (compras.datos.ticket) setConfirmacion(compras.contexto);
    else compras.ejecutar("ticket");
  };
  return (
    <Box sx={{ minHeight: "100%", bgcolor: "transparent", p: { xs: 1, md: 1.5, xl: 2 }, color: palette.text }}>
      <Box sx={{ width: "100%", maxWidth: "100%", minWidth: 0, mx: "auto", display: "grid", gap: 0.65 }}>
        <Box component="header" sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: { xs: 0.5, sm: 0.75 }, mb: 0.5, minWidth: 0 }}>
          <Box sx={{ minWidth: 0 }}><Typography component="h1" sx={{ color: palette.text, fontWeight: 700, fontSize: 22, lineHeight: 1.2 }}>Reporte SIRE Compras</Typography><Typography sx={{ color: palette.muted, fontSize: 13, mt: 0.5 }}>{tab === 5 ? "Revisión de comprobantes por declarar, excluidos y pendientes" : <>{rows.length} visibles de {base.length} {tab === 2 || tab === 3 ? "hallazgos" : "comprobantes"}</>}</Typography></Box>
          <Box sx={{ display: "flex", alignItems: "center", alignSelf: { xs: "stretch", sm: "flex-start" }, justifyContent: "flex-end", gap: 0.5, width: { xs: "100%", sm: "auto" }, flexWrap: { xs: "wrap", lg: "nowrap" } }}>
            <AppSearch placeholder="Filtrar comprobante, proveedor u observación" value={filtros.busqueda} onChange={e => cambiarFiltro({ busqueda: e.target.value })} width={{ xs: "100%", sm: 320 }} height={38} />
            <Button variant="contained" disabled={compras.ocupado || !compras.valido} onClick={compras.actualizar} sx={{ height: 38, minHeight: 38, borderRadius: 1, textTransform: "none", fontSize: 12, fontWeight: 800, whiteSpace: "nowrap", px: 1.25 }}><RefreshIcon sx={{ fontSize: 17, mr: 0.75 }} />Actualizar</Button>
          </Box>
        </Box>
        <SireComprasContexto {...compras} />
        <SireComprasDias periodo={compras.periodo} dia={filtros.dia} onChange={dia => cambiarFiltro({ dia })} />
        {!compras.valido && <Alert severity="info">Selecciona una empresa con RUC y un período para consultar Compras.</Alert>}
        {compras.datos.advertencia && <Alert severity="warning">{compras.datos.advertencia}</Alert>}
        {compras.error && <Alert severity="error">{compras.error}</Alert>}
        {compras.mensaje && <Alert severity="info">{compras.mensaje}</Alert>}
        <Box sx={{ bgcolor: palette.surface, borderRadius: 1, minWidth: 0, maxWidth: "100%", overflow: "hidden" }}>
          <Tabs value={tab} onChange={(_, value) => { setTab(value); cambiarFiltro({ resultado: "" }); }} variant="scrollable" scrollButtons="auto" sx={{ minHeight: 42, px: 1, borderBottom: `1px solid ${palette.borderSoft}`, "& .MuiTab-root": { minHeight: 42, color: palette.muted, textTransform: "none", fontSize: 13, fontWeight: 800 }, "& .Mui-selected": { color: palette.accent } }}>
            <Tab label="Registro" /><Tab label="Propuesta SUNAT" /><Tab label="Comparación" /><Tab label={`Observaciones (${observaciones.length})`} /><Tab label="Exportar" /><Tab label="Propuesta personalizada" />
          </Tabs>
          {tab === 1 && <Box sx={{ p: { xs: 0.85, md: 1 }, pb: 0 }}><SireComprasTicket datos={compras.datos} valido={compras.valido} ocupado={compras.ocupado} accion={compras.accion} onGenerar={solicitarTicket} onConsultar={() => compras.ejecutar("consultar")} onDescargar={() => compras.ejecutar("archivo")} /></Box>}
          {tab === 5 ? <SireComprasPersonalizada key={compras.contexto} idAnfitrion={compras.idAnfitrion} documentoId={compras.documentoId} periodo={compras.periodo} valido={compras.valido} filtros={filtros} /> : <SireComprasResultados datos={compras.datos} rows={rows} tab={tab} filtros={filtros} cambiarResultado={resultado => cambiarFiltro({ resultado })} cargando={compras.cargando} ocupado={compras.ocupado} documentoId={compras.documentoId} periodo={compras.periodo} />}
        </Box>
      </Box>
      <Dialog open={confirmacion === compras.contexto} onClose={() => setConfirmacion(null)} aria-labelledby="sire-confirmar-ticket" maxWidth="xs" fullWidth>
        <DialogTitle id="sire-confirmar-ticket">Generar nuevo ticket de compras</DialogTitle>
        <DialogContent><DialogContentText>Ya existe un ticket para esta empresa y período. ¿Deseas solicitar una nueva propuesta de compras?</DialogContentText></DialogContent>
        <DialogActions><Button onClick={() => setConfirmacion(null)}>Volver</Button><Button variant="contained" onClick={() => { setConfirmacion(null); compras.ejecutar("ticket"); }}>Generar ticket</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
