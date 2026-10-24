import React from "react";
import { Box, Button, CircularProgress, LinearProgress, Typography } from "@mui/material";
import palette from "../../../../theme/palette";
import { fechaTicket } from "../utils/comprasView";

export default function SireComprasTicket({ datos, valido, ocupado, accion, token, onGenerar, onConsultar, onDescargar, onToken }) {
  const cardSx = { border: `1px solid ${palette.borderSoft}`, borderRadius: 1, p: 1, bgcolor: palette.surfaceAlt, minWidth: 0 };
  const labelSx = { color: palette.muted, fontSize: 11, fontWeight: 900, textTransform: "uppercase" };
  return (
    <Box component="section" aria-label="Propuesta SUNAT de compras" sx={{ display: "grid", gap: 0.9 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 0.75 }}>
        <Box sx={cardSx}><Typography sx={labelSx}>Ticket</Typography><Typography sx={{ fontSize: 18, fontWeight: 900, mt: 0.35, overflowWrap: "anywhere" }}>{datos.ticket || "-"}</Typography>
          {datos.ticket && <Typography sx={{ fontSize: 12, mt: 0.35 }}>{fechaTicket(datos.fecha_generacion)}{datos.fecha_generacion ? " (Lima)" : ""}</Typography>}
          <Typography sx={{ color: palette.muted, fontSize: 12, mt: 0.35 }}>{datos.ticket ? "Último ticket recuperado del período." : "No hay ticket guardado para este período."}</Typography>
        </Box>
        <Box sx={cardSx}><Typography sx={labelSx}>Archivo SUNAT</Typography><Typography sx={{ fontSize: 13, fontWeight: 800, mt: 0.35, overflowWrap: "anywhere" }}>{datos.propuesta?.nombre_archivo || "-"}</Typography><Typography sx={{ color: palette.muted, fontSize: 12, mt: 0.35 }}>Consulta el estado para recuperar la propuesta de compras.</Typography></Box>
        <Box sx={cardSx}><Typography sx={labelSx}>Comprobantes SUNAT</Typography><Typography sx={{ fontSize: 18, fontWeight: 900, mt: 0.35 }}>{datos.propuesta ? datos.propuesta.detalle.length : "—"}</Typography><Typography sx={{ color: palette.muted, fontSize: 12, mt: 0.35 }}>{datos.propuesta ? "Original descargado. Trabaja los ajustes en Compras por declarar." : "La propuesta se cargará automáticamente al consultar el ticket."}</Typography></Box>
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
        <Button variant="contained" disabled={!valido || ocupado} onClick={onGenerar} sx={{ borderRadius: 1, textTransform: "none", fontWeight: 800 }}>{datos.ticket ? "Generar nuevo ticket" : "Generar ticket"}</Button>
        <Button variant="outlined" disabled={!datos.ticket || ocupado} onClick={onConsultar} startIcon={accion === "consultar" ? <CircularProgress size={15} color="inherit" /> : null} sx={{ borderRadius: 1, textTransform: "none", fontWeight: 800 }}>Consultar estado</Button>
        <Button variant="outlined" disabled={!datos.propuesta || ocupado} onClick={onDescargar} sx={{ borderRadius: 1, textTransform: "none", fontWeight: 800 }}>Descargar ZIP</Button>
        <Button variant="outlined" disabled={!valido || ocupado} onClick={onToken} startIcon={accion === "token" ? <CircularProgress size={15} color="inherit" /> : null} sx={{ borderRadius: 1, textTransform: "none", fontWeight: 800 }}>Generar Token</Button>
      </Box>
      {token?.token && <Box sx={{ ...cardSx, display: "grid", gap: 0.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 0.75, flexWrap: "wrap" }}>
          <Typography sx={labelSx}>Token SUNAT ({token.longitud || token.token.length} caracteres)</Typography>
          <Button size="small" onClick={() => { navigator.clipboard?.writeText(token.token).catch(() => {}); }} sx={{ textTransform: "none", fontWeight: 800, fontSize: 11 }}>Copiar</Button>
        </Box>
        <Typography component="code" sx={{ fontFamily: "monospace", fontSize: 11, wordBreak: "break-all", color: palette.muted, userSelect: "all" }}>{token.token}</Typography>
        <Typography sx={{ color: palette.muted, fontSize: 11 }}>Scope: {token.scope}. Token de diagnostico: no se guarda ni se reutiliza.</Typography>
      </Box>}
      {ocupado && <Box role="status" sx={{ ...cardSx, display: "grid", gap: 0.7 }}><Typography sx={{ fontSize: 13, fontWeight: 800 }}>{accion === "consultar" ? "Consultando e importando propuesta…" : accion === "ticket" ? "Generando ticket…" : accion === "archivo" ? "Descargando archivo…" : accion === "token" ? "Generando token SUNAT…" : "Recuperando información…"}</Typography><LinearProgress sx={{ height: 8, borderRadius: 1, bgcolor: palette.borderSoft }} /></Box>}
    </Box>
  );
}
