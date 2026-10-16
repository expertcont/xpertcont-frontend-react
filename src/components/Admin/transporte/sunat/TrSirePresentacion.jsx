import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import TrSireReemplazo from "./TrSireReemplazo";
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import palette from "../../../../theme/palette";

const etiquetasEstado = {
  SIN_ENVIO: "Sin aceptación enviada",
  ENVIANDO: "Envío pendiente de verificar",
  ENVIADO: "Aceptación en proceso",
  TERMINADO: "Propuesta aceptada",
  RECHAZADO: "Aceptación rechazada",
  INCIERTO: "Resultado pendiente de verificar",
};
const bloqueaEnvio = (estado) => ["ENVIANDO", "ENVIADO", "TERMINADO", "INCIERTO"].includes(estado);
const mensajeError = (error, fallback) => error?.response?.data?.message || fallback;

export default function TrSirePresentacion({
  backHost, idAnfitrion, idInvitado, empresa, documentoId, periodo, ticket,
  importacion, cantidadSistema, ocupado = false, onCambioPropuesta,
}) {
  const [bloqueoReemplazo, setBloqueoReemplazo] = useState(true);
  const [opcion, setOpcion] = useState("");
  const [aceptacion, setAceptacion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const [estadoRecuperado, setEstadoRecuperado] = useState(false);
  const montado = useRef(true);
  const solicitudActiva = useRef(false);
  const contextoValido = Boolean(backHost && idAnfitrion && periodo && documentoId && documentoId !== "-");
  const endpoint = `${backHost}/transporte/sire/propuesta`;
  const urlGuardado = `${endpoint}/aceptacion/${encodeURIComponent(periodo || "")}/${encodeURIComponent(idAnfitrion || "")}/${encodeURIComponent(documentoId || "")}?id_libro=014`;
  const estado = aceptacion?.estado || "SIN_ENVIO";
  const disponible = contextoValido && estadoRecuperado && !ocupado && !cargando && !procesando;
  const puedeAceptar = disponible && !bloqueoReemplazo && Boolean(importacion?.id_propuesta && ticket) && !bloqueaEnvio(estado);
  const aceptar = opcion === "ACEPTAR";
  const cantidad = importacion?.cantidad_registros;
  const resumen = [
    ["Empresa", empresa || documentoId], ["RUC", documentoId], ["Período", periodo],
    ["Opción", "Aceptar propuesta"],
    ["Origen", "Propuesta SUNAT importada"],
    ["Comprobantes del período", cantidad ?? "-"], ["Ticket de propuesta", ticket || "-"],
  ];
  const payload = () => ({
    id_anfitrion: idAnfitrion, documento_id: documentoId, periodo, id_libro: "014",
  });

  useEffect(() => {
    montado.current = true;
    return () => { montado.current = false; };
  }, []);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setEstadoRecuperado(false);
    setError("");
    if (!contextoValido) {
      setCargando(false);
      return () => { vigente = false; };
    }
    axios.get(urlGuardado)
      .then(({ data }) => {
        if (!vigente) return;
        if (data?.success !== true) throw new Error("Respuesta de aceptación inválida.");
        setAceptacion(data);
        setEstadoRecuperado(true);
      })
      .catch((err) => {
        if (vigente) setError(mensajeError(err, "No se pudo recuperar el estado de aceptación del período."));
      })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [contextoValido, urlGuardado]);

  const recuperarEstado = async () => {
    if (solicitudActiva.current || !contextoValido) return;
    solicitudActiva.current = true;
    setCargando(true);
    setError("");
    try {
      const { data } = await axios.get(urlGuardado);
      if (data?.success !== true) throw new Error("Respuesta de aceptación inválida.");
      if (montado.current) {
        setAceptacion((prev) => data.estado === "SIN_ENVIO" && prev?.estado === "INCIERTO" ? prev : data);
        setEstadoRecuperado(true);
      }
    } catch (err) {
      if (montado.current) setError(mensajeError(err, "No se pudo recuperar el estado de aceptación."));
    } finally {
      solicitudActiva.current = false;
      if (montado.current) setCargando(false);
    }
  };

  const consultarEstado = async () => {
    if (solicitudActiva.current || !aceptacion?.ticket_aceptacion) return;
    solicitudActiva.current = true;
    setProcesando(true);
    setError("");
    try {
      const { data } = await axios.post(`${endpoint}/aceptacion/estado`, payload());
      if (data?.success !== true) throw new Error("Respuesta de consulta inválida.");
      if (montado.current) setAceptacion(data);
    } catch (err) {
      if (montado.current) setError(mensajeError(err, "No se pudo consultar SUNAT. El envío guardado se conserva."));
    } finally {
      solicitudActiva.current = false;
      if (montado.current) setProcesando(false);
    }
  };

  const enviarAceptacion = async () => {
    if (!puedeAceptar || solicitudActiva.current || !aceptar) return;
    solicitudActiva.current = true;
    setProcesando(true);
    setError("");
    try {
      const { data } = await axios.post(`${endpoint}/aceptar`, {
        ...payload(), id_propuesta: importacion.id_propuesta,
        ticket_propuesta: ticket, confirmar: true, id_invitado: idInvitado,
      });
      if (data?.success !== true || !data.ticket_aceptacion) throw new Error("No se confirmó el ticket de aceptación.");
      if (!montado.current) return;
      setAceptacion(data);
      setOpcion("");
      // Una consulta inmediata; si SUNAT sigue procesando, el usuario puede consultar nuevamente.
      try {
        const consulta = await axios.post(`${endpoint}/aceptacion/estado`, payload());
        if (consulta.data?.success !== true) throw new Error("Respuesta de consulta inválida.");
        if (montado.current) setAceptacion(consulta.data);
      } catch (err) {
        if (montado.current) setError(mensajeError(err, "La solicitud fue enviada. No se pudo consultar su estado todavía."));
      }
    } catch (err) {
      if (!montado.current) return;
      const datos = err?.response?.data;
      const incierto = !err?.response || err.response.status >= 500 || datos?.estado === "INCIERTO";
      setError(mensajeError(err, "No se pudo confirmar la aceptación. Verifica el estado antes de repetir."));
      setAceptacion((prev) => ({
        ...prev, estado: datos?.estado || (incierto ? "INCIERTO" : "RECHAZADO"),
        ticket_aceptacion: datos?.ticket_aceptacion || prev?.ticket_aceptacion || null,
      }));
      // Recuperar el intento persistido si el POST respondió con error.
      try {
        const guardado = await axios.get(urlGuardado);
        if (montado.current && guardado.data?.success === true && guardado.data.estado !== "SIN_ENVIO") {
          setAceptacion(guardado.data);
          setEstadoRecuperado(true);
        }
      } catch (errorRecuperacion) {
        // Mantener el bloqueo local cuando no conocemos el resultado del envío.
        if (montado.current) setEstadoRecuperado(false);
      }
    } finally {
      solicitudActiva.current = false;
      if (montado.current) setProcesando(false);
    }
  };

  return (
    <>
      <Box sx={{ border: `1px solid ${palette.borderSoft}`, borderRadius: 1, p: { xs: 1, md: 1.25 }, display: "grid", gap: 1, backgroundColor: palette.surface }}>
        <Box>
          <Typography sx={{ color: palette.text, fontSize: 15, fontWeight: 900 }}>Presentación del registro</Typography>
          <Typography sx={{ color: palette.muted, fontSize: 12.5, mt: 0.25 }}>La aceptación comprende la propuesta completa del RUC y período seleccionados.</Typography>
        </Box>
        {error && <Alert severity="error">{error}</Alert>}
        {cargando ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><CircularProgress size={16} /><Typography sx={{ fontSize: 12.5 }}>Recuperando aceptación guardada...</Typography></Box>
        ) : aceptacion && estado !== "SIN_ENVIO" ? (
          <Alert severity={estado === "TERMINADO" ? "success" : estado === "RECHAZADO" ? "error" : "info"}>
            <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{etiquetasEstado[estado] || estado}</Typography>
            {aceptacion.ticket_aceptacion && <Typography sx={{ fontSize: 12.5 }}>Ticket de aceptación: {aceptacion.ticket_aceptacion}</Typography>}
            {aceptacion.mensaje && <Typography sx={{ fontSize: 12 }}>{aceptacion.mensaje}</Typography>}
            {["INCIERTO", "ENVIANDO"].includes(estado) && <Typography sx={{ fontSize: 12 }}>Verifica el resultado antes de repetir. Si no hay ticket, revisa el proceso en SUNAT.</Typography>}
          </Alert>
        ) : null}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1 }}>
          <Box sx={{ border: `1px solid ${palette.borderSoft}`, borderRadius: 1, p: 1, display: "grid", gap: 0.75 }}>
            <Typography sx={{ color: palette.text, fontSize: 13, fontWeight: 800 }}>Propuesta SUNAT</Typography>
            <Typography sx={{ color: palette.muted, fontSize: 12 }}>{importacion ? `${importacion.cantidad_registros || 0} comprobantes importados del período.` : "Importa la propuesta para aceptar."}</Typography>
            <Button variant="contained" onClick={() => setOpcion("ACEPTAR")} disabled={!puedeAceptar}
              sx={{ justifySelf: "start", textTransform: "none", fontWeight: 800, borderRadius: 1 }}>
              Aceptar propuesta
            </Button>
          </Box>
          <Box sx={{ border: `1px solid ${palette.borderSoft}`, borderRadius: 1, p: 1, display: "grid", gap: 0.75 }}>
            <TrSireReemplazo backHost={backHost} idAnfitrion={idAnfitrion} idInvitado={idInvitado}
              empresa={empresa} documentoId={documentoId} periodo={periodo} cantidadSistema={cantidadSistema}
              ocupado={ocupado || cargando || procesando || !estadoRecuperado || bloqueaEnvio(estado)}
              onBloqueo={setBloqueoReemplazo} onCambioPropuesta={onCambioPropuesta} />
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
          {aceptacion?.ticket_aceptacion && (
            <Button variant="outlined" onClick={consultarEstado} disabled={!disponible || estado === "TERMINADO"}
              sx={{ textTransform: "none", borderRadius: 1 }}
              startIcon={procesando ? <CircularProgress size={15} color="inherit" /> : null}>
              Consultar aceptación
            </Button>
          )}
          {(!estadoRecuperado || ["INCIERTO", "ENVIANDO"].includes(estado)) && (
            <Button onClick={recuperarEstado} disabled={!contextoValido || cargando || procesando || ocupado}
              sx={{ textTransform: "none" }}>Recuperar estado guardado</Button>
          )}
        </Box>
        <Typography sx={{ color: palette.muted, fontSize: 12 }}>El resultado de aceptación se consulta con su propio ticket. La generación final del libro es otra etapa de SIRE.</Typography>
      </Box>
      <Dialog open={Boolean(opcion)} onClose={() => { if (!procesando) setOpcion(""); }} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900 }}>Confirmar aceptación de propuesta</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 1.5 }}>
          <Alert severity="info">Se aceptará la propuesta SUNAT completa del RUC y período indicados.</Alert>
          {error && <Alert severity="error">{error}</Alert>}
          <Box component="dl" sx={{ m: 0, display: "grid", gridTemplateColumns: "minmax(120px, 1fr) minmax(0, 2fr)", columnGap: 1.5, rowGap: 1 }}>
            {resumen.map(([label, value]) => (
              <React.Fragment key={label}>
                <Typography component="dt" sx={{ color: palette.muted, fontSize: 13 }}>{label}</Typography>
                <Typography component="dd" sx={{ m: 0, color: palette.text, fontSize: 13, fontWeight: 700, overflowWrap: "anywhere" }}>{value ?? "-"}</Typography>
              </React.Fragment>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpcion("")} disabled={procesando} sx={{ textTransform: "none" }}>Volver</Button>
          <Button variant="contained" onClick={enviarAceptacion} disabled={!aceptar || !puedeAceptar}
            startIcon={procesando ? <CircularProgress size={15} color="inherit" /> : null}
            sx={{ textTransform: "none" }}>
            {procesando ? "Enviando..." : "Enviar aceptación a SUNAT"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
