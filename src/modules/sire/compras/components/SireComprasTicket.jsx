import React, { useEffect, useState } from "react";
import { Box, Button, CircularProgress, LinearProgress, Typography } from "@mui/material";
import palette from "../../../../theme/palette";
import { fechaTicket } from "../utils/comprasView";

// Contador en vivo de vigencia del token (exp del JWT que SUNAT entrega):
// muestra la operatividad restante, como el contador de cpe-go. Al llegar
// a cero la proxima accion regenera el token sola (cache del backend).
function ContadorVigencia({ vigencia }) {
  const [faltan, setFaltan] = useState(() => (vigencia?.expiraSeg ? Math.max(0, Math.round((vigencia.expiraSeg - Date.now()) / 1000)) : 0));
  useEffect(() => {
    if (!vigencia?.expiraSeg) return undefined;
    setFaltan(Math.max(0, Math.round((vigencia.expiraSeg - Date.now()) / 1000)));
    const t = setInterval(() => setFaltan(Math.max(0, Math.round((vigencia.expiraSeg - Date.now()) / 1000))), 1000);
    return () => clearInterval(t);
  }, [vigencia?.expiraSeg]);
  if (!vigencia) return null;
  const mm = String(Math.floor(faltan / 60)).padStart(2, "0");
  const ss = String(faltan % 60).padStart(2, "0");
  return <Typography sx={{ color: faltan > 300 ? "success.main" : "warning.main", fontSize: 12, fontWeight: 900 }}>vigencia {mm}:{ss}</Typography>;
}

export default function SireComprasTicket({ datos, valido, ocupado, accion, token, tokenSire, onGenerar, onConsultar, onDescargar, onToken, onTokenSire, onTokenSireSecundario, onTokenLegacy }) {
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
        {/* Pruebas SIRE nuevas e independientes; ninguna sustituye la pareja elegida. */}
        <Button variant="outlined" disabled={!valido || ocupado} onClick={onTokenSire} startIcon={accion === "tokenSire" ? <CircularProgress size={15} color="inherit" /> : null} sx={{ borderRadius: 1, textTransform: "none", fontWeight: 800 }}>Token SIRE primario</Button>
        <Button variant="outlined" disabled={!valido || ocupado} onClick={onTokenSireSecundario} startIcon={accion === "tokenSireSecundario" ? <CircularProgress size={15} color="inherit" /> : null} sx={{ borderRadius: 1, textTransform: "none", fontWeight: 800 }}>Token SIRE secundario</Button>
        <Button variant="outlined" disabled={!valido || ocupado} onClick={onTokenLegacy} startIcon={accion === "tokenLegacy" ? <CircularProgress size={15} color="inherit" /> : null} sx={{ borderRadius: 1, textTransform: "none", fontWeight: 800 }}>Token legacy</Button>
        <Button variant="outlined" disabled={!valido || ocupado} onClick={onToken} startIcon={accion === "token" ? <CircularProgress size={15} color="inherit" /> : null} sx={{ borderRadius: 1, textTransform: "none", fontWeight: 800 }}>Token Portal</Button>
      </Box>
      {tokenSire?.via === "sire" && <Box sx={{ ...cardSx, display: "grid", gap: 0.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 0.75, flexWrap: "wrap" }}>
          <Typography sx={labelSx}>Token {tokenSire.modo === "legacy" ? "legacy" : `SIRE ${tokenSire.pareja_sol === "secundario" ? "secundario" : "primario"}`} ({tokenSire.longitud || "n/d"} caracteres)</Typography>
          <ContadorVigencia vigencia={tokenSire.vigencia} />
        </Box>
        <Typography sx={{ fontSize: 12, fontWeight: 800, color: tokenSire.migeigvDeclarado === true ? "success.main" : tokenSire.migeigvDeclarado === false ? "error.main" : "text.primary" }}>
          {tokenSire.migeigvDeclarado === true ? "El token declara recursos migeigv; la consulta a SIRE confirmará el acceso."
            : tokenSire.migeigvDeclarado === false ? "El token no declara recursos migeigv."
            : "El JWT no expone su audiencia de forma interpretable."}
        </Typography>
        {Array.isArray(tokenSire.recursosSire) && tokenSire.recursosSire.length > 0 && (
          <Typography component="code" sx={{ fontFamily: "monospace", fontSize: 11, wordBreak: "break-all", color: palette.muted }}>recursos: {tokenSire.recursosSire.join(" | ")}</Typography>
        )}
        <Typography sx={{ color: palette.muted, fontSize: 11 }}>{tokenSire.modo === "legacy" ? `Autenticación original de Contabilidad para el RUC ${tokenSire.documento_id}, con sire_sol / sire_solpwd.` : `Prueba manual nueva para el RUC ${tokenSire.documento_id}, usando únicamente la pareja ${tokenSire.pareja_sol === "secundario" ? "secundaria" : "primaria"}.`}</Typography>
      </Box>}
      {token?.token && <Box sx={{ ...cardSx, display: "grid", gap: 0.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 0.75, flexWrap: "wrap" }}>
          <Typography sx={labelSx}>Token portal SUNAT ({token.longitud || token.token.length} caracteres)</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ContadorVigencia vigencia={token.vigencia} />
            <Button size="small" onClick={() => { navigator.clipboard?.writeText(token.token).catch(() => {}); }} sx={{ textTransform: "none", fontWeight: 800, fontSize: 11 }}>Copiar</Button>
          </Box>
        </Box>
        <Typography component="code" sx={{ fontFamily: "monospace", fontSize: 11, wordBreak: "break-all", color: palette.muted, userSelect: "all" }}>{token.token}</Typography>
        <Typography sx={{ color: palette.muted, fontSize: 11 }}>Obtenido via login del portal e-factura ({token.diagnostico?.viaPortalMetodo || "portal"}{token.diagnostico?.credencialPortal ? `, credencial ${token.diagnostico.credencialPortal}` : ""}). Declara el recurso consultacpe que usan las descargas XML. El backend lo reutiliza de cache; al expirar la proxima descarga lo regenera sola.</Typography>
      </Box>}
      {ocupado && <Box role="status" sx={{ ...cardSx, display: "grid", gap: 0.7 }}><Typography sx={{ fontSize: 13, fontWeight: 800 }}>{accion === "consultar" ? "Consultando e importando propuesta…" : accion === "ticket" ? "Generando ticket…" : accion === "archivo" ? "Descargando archivo…" : accion === "tokenSire" ? "Generando token SIRE primario nuevo…" : accion === "tokenSireSecundario" ? "Generando token SIRE secundario nuevo…" : accion === "tokenLegacy" ? "Generando token legacy nuevo…" : accion === "token" ? "Generando token portal…" : "Recuperando información…"}</Typography><LinearProgress sx={{ height: 8, borderRadius: 1, bgcolor: palette.borderSoft }} /></Box>}
    </Box>
  );
}
