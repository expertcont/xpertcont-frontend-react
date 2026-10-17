import React from "react";
import { Box, Button, CircularProgress, LinearProgress, Typography } from "@mui/material";
import palette from "../../../../theme/palette";
import { fechaTicket } from "../utils/comprasView";

export default function SireComprasTicket({ datos, valido, ocupado, accion, onGenerar, onConsultar, onDescargar }) {
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
        <Box sx={cardSx}><Typography sx={labelSx}>Registros</Typography><Typography sx={{ fontSize: 18, fontWeight: 900, mt: 0.35 }}>{datos.propuesta ? `${datos.propuesta.detalle.length} SIRE` : `${datos.sistema.length} comprobantes`}</Typography><Typography sx={{ color: palette.muted, fontSize: 12, mt: 0.35 }}>{datos.propuesta ? "Propuesta SUNAT importada para comparar." : "Compras registradas en el sistema."}</Typography></Box>
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
        <Button variant="contained" disabled={!valido || ocupado} onClick={onGenerar} sx={{ borderRadius: 1, textTransform: "none", fontWeight: 800 }}>{datos.ticket ? "Generar nuevo ticket" : "Generar ticket"}</Button>
        <Button variant="outlined" disabled={!datos.ticket || ocupado} onClick={onConsultar} startIcon={accion === "consultar" ? <CircularProgress size={15} color="inherit" /> : null} sx={{ borderRadius: 1, textTransform: "none", fontWeight: 800 }}>Consultar estado</Button>
        <Button variant="outlined" disabled={!datos.propuesta || ocupado} onClick={onDescargar} sx={{ borderRadius: 1, textTransform: "none", fontWeight: 800 }}>Descargar ZIP</Button>
      </Box>
      {ocupado && <Box role="status" sx={{ ...cardSx, display: "grid", gap: 0.7 }}><Typography sx={{ fontSize: 13, fontWeight: 800 }}>{accion === "consultar" ? "Consultando e importando propuesta…" : accion === "ticket" ? "Generando ticket…" : accion === "archivo" ? "Descargando archivo…" : "Recuperando información…"}</Typography><LinearProgress sx={{ height: 8, borderRadius: 1, bgcolor: palette.borderSoft }} /></Box>}
    </Box>
  );
}
