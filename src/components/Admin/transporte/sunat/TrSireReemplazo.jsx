import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Alert, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, TextField, Typography } from "@mui/material";

const activos = ["ENVIANDO", "ENVIADO", "INCIERTO", "TERMINADO"];
const etiquetas = { PREPARADO: "Archivo RVIE preparado", ENVIANDO: "Envío pendiente de verificar", ENVIADO: "Reemplazo en proceso",
  INCIERTO: "Reemplazo pendiente de verificar", RECHAZADO: "Reemplazo rechazado", TERMINADO: "Reemplazo confirmado" };

export default function TrSireReemplazo({ backHost, idAnfitrion, idInvitado, documentoId, periodo, empresa,
  cantidadSistema, ocupado, onBloqueo, onCambioPropuesta }) {
  const [registro, setRegistro] = useState(null);
  const [recuperado, setRecuperado] = useState(false);
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [alcance, setAlcance] = useState(false);
  const [ticketManual, setTicketManual] = useState("");
  const montado = useRef(true);
  const solicitud = useRef(false);
  const endpoint = `${backHost}/transporte/sire/propuesta`;
  const url = `${endpoint}/reemplazo/${encodeURIComponent(periodo || "")}/${encodeURIComponent(idAnfitrion || "")}/${encodeURIComponent(documentoId || "")}?id_libro=014`;
  const contexto = Boolean(backHost && idAnfitrion && periodo && documentoId && documentoId !== "-");
  const estado = registro?.estado || "SIN_ENVIO";
  const disponible = contexto && recuperado && !ocupado && !procesando;
  const bloqueado = activos.includes(estado);
  const payload = () => ({ id_anfitrion: idAnfitrion, documento_id: documentoId, periodo, id_libro: "014" });
  const snapshot = () => ({ ...payload(), id_reemplazo: registro.id_reemplazo, hash_archivo: registro.hash_archivo });

  useEffect(() => { montado.current = true; return () => { montado.current = false; }; }, []);
  useEffect(() => { onBloqueo(!recuperado || bloqueado || procesando); }, [onBloqueo, recuperado, bloqueado, procesando]);
  useEffect(() => {
    let vigente = true;
    setRecuperado(false); setRegistro(null); setError(""); setAbierto(false); setAlcance(false);
    if (!contexto) return () => { vigente = false; };
    axios.get(url).then(({ data }) => {
      if (data?.success !== true) throw new Error("Respuesta inválida.");
      if (vigente) { setRegistro(data); setRecuperado(true); }
    }).catch((err) => { if (vigente) setError(err?.response?.data?.message || "No se pudo recuperar el reemplazo guardado."); });
    return () => { vigente = false; };
  }, [contexto, url]);

  const ejecutar = async (accion) => {
    if (solicitud.current || !contexto) return;
    solicitud.current = true; setProcesando(true); setError("");
    try { await accion(); }
    catch (err) { if (montado.current) setError(err?.response?.data?.message || err.message || "No se pudo completar la operación."); }
    finally { solicitud.current = false; if (montado.current) setProcesando(false); }
  };
  const aplicar = async (data) => {
    if (data?.success !== true) throw new Error("SUNAT no confirmó una respuesta válida.");
    if (!montado.current) return;
    setRegistro(data); setRecuperado(true);
    if (data.estado === "TERMINADO") await onCambioPropuesta?.(data);
  };
  const recuperar = () => ejecutar(async () => {
    const { data } = await axios.get(url);
    // No desbloquear un resultado local incierto por una lectura SIN_ENVIO.
    if (estado === "INCIERTO" && data?.estado === "SIN_ENVIO") throw new Error("El envío sigue pendiente de verificar en SUNAT.");
    const conservar = ['INCIERTO', 'ENVIANDO'].includes(data?.estado) && registro?.ticket_reemplazo && !data.ticket_reemplazo;
    await aplicar(conservar ? { ...data, ticket_reemplazo: registro.ticket_reemplazo, ticket_pendiente_guardar: true } : data);
  });
  const preparar = () => ejecutar(async () => {
    const { data } = await axios.post(`${endpoint}/reemplazo/generar`, { ...payload(), id_invitado: idInvitado });
    await aplicar(data); if (montado.current) { setAlcance(false); setAbierto(true); }
  });
  const cargarArchivo = (evento) => {
    const archivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!archivo || !disponible || bloqueado) return;
    ejecutar(async () => {
      const form = new FormData();
      Object.entries({ ...payload(), id_invitado: idInvitado || '' }).forEach(([key, value]) => form.append(key, value));
      form.append('archivo', archivo);
      const { data } = await axios.post(`${endpoint}/reemplazo/preparar`, form);
      await aplicar(data);
      if (montado.current) { setAlcance(false); setAbierto(true); }
    });
  };
  const consultar = () => ejecutar(async () => {
    const { data } = await axios.post(`${endpoint}/reemplazo/estado`, payload());
    await aplicar(data);
  });
  const enviar = () => ejecutar(async () => {
    if (!alcance || estado !== "PREPARADO" || !disponible) return;
    let enviado = false;
    try {
      const { data } = await axios.post(`${endpoint}/reemplazar`, { ...snapshot(), confirmar: true,
        confirmar_alcance: true, id_invitado: idInvitado });
      if (data?.success !== true || !data.ticket_reemplazo) throw new Error("No se confirmó el ticket de reemplazo.");
      enviado = true;
      await aplicar(data);
      if (montado.current) setAbierto(false);
    } catch (err) {
      if (!montado.current) return;
      const datos = err?.response?.data;
      const incierto = !err?.response || err.response.status >= 500 || datos?.estado === "INCIERTO";
      if (datos?.ticket_reemplazo) setTicketManual(datos.ticket_reemplazo);
      setRegistro((prev) => ({ ...prev, estado: datos?.estado || (incierto ? "INCIERTO" : "RECHAZADO"),
        ticket_reemplazo: datos?.ticket_reemplazo || prev?.ticket_reemplazo }));
      try {
        const guardado = await axios.get(url);
        if (guardado.data?.success === true && guardado.data.estado !== "SIN_ENVIO") {
          const conservar = datos?.ticket_reemplazo && !guardado.data.ticket_reemplazo && ['INCIERTO', 'ENVIANDO'].includes(guardado.data.estado);
          await aplicar(conservar ? { ...guardado.data, ticket_reemplazo: datos.ticket_reemplazo, ticket_pendiente_guardar: true } : guardado.data);
        }
      } catch (_) { if (montado.current) setRecuperado(false); }
      throw err;
    }
    // Una consulta inmediata; cualquier fallo conserva el ticket confirmado.
    if (enviado && montado.current) {
      const consulta = await axios.post(`${endpoint}/reemplazo/estado`, payload());
      await aplicar(consulta.data);
    }
  });
  const conciliar = () => ejecutar(async () => {
    const { data } = await axios.post(`${endpoint}/reemplazo/conciliar`, { ...snapshot(),
      ticket_reemplazo: ticketManual.trim(), confirmar: true, id_invitado: idInvitado });
    await aplicar(data);
    if (montado.current) { setTicketManual(""); setAbierto(false); }
  });
  const descarga = registro?.id_reemplazo ? `${endpoint}/reemplazo/archivo/${encodeURIComponent(periodo)}/${encodeURIComponent(idAnfitrion)}/${encodeURIComponent(documentoId)}?id_libro=014&id_reemplazo=${encodeURIComponent(registro.id_reemplazo)}&hash_archivo=${encodeURIComponent(registro.hash_archivo)}` : "";

  return (
    <Box sx={{ display: "grid", gap: 1 }}>
      <Typography sx={{ fontSize: 13, fontWeight: 800 }}>Registro del sistema</Typography>
      <Typography sx={{ fontSize: 12 }}>{cantidadSistema} líneas de Transporte. Genera y revisa el archivo completo antes de reemplazar.</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {registro && estado !== "SIN_ENVIO" && <Alert severity={estado === "TERMINADO" ? "success" : estado === "RECHAZADO" ? "error" : "info"}>
        <Typography sx={{ fontWeight: 700 }}>{etiquetas[estado] || estado}</Typography>
        {registro.ticket_reemplazo && <Typography>Ticket de reemplazo: {registro.ticket_reemplazo}</Typography>}
        {estado === "TERMINADO" && <Typography>{registro.estado_actualizacion === "ACTUALIZADO"
          ? "Propuesta local actualizada. La anterior se conserva como historial."
          : "Falta actualizar la propuesta local antes de comparar."}</Typography>}
        {registro.error_actualizacion && <Typography>{registro.error_actualizacion}</Typography>}
      </Alert>}
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Button variant="outlined" disabled={!disponible || bloqueado} onClick={preparar}>Reemplazar propuesta</Button>
        <Button component="label" disabled={!disponible || bloqueado}>Cargar archivo RVIE
          <input aria-label="Archivo RVIE externo" hidden type="file" accept=".txt,.zip" onChange={cargarArchivo} disabled={!disponible || bloqueado} />
        </Button>        {estado === "PREPARADO" && <Button disabled={!disponible} onClick={() => { setAlcance(false); setAbierto(true); }}>Revisar archivo preparado</Button>}
        {registro?.ticket_reemplazo && !registro.ticket_pendiente_guardar && !(estado === "TERMINADO" && registro.estado_actualizacion === "ACTUALIZADO") && estado !== "RECHAZADO" &&
          <Button disabled={!disponible} onClick={consultar}>{estado === "TERMINADO" ? "Actualizar propuesta" : "Consultar reemplazo"}</Button>}
        {(!recuperado || ["INCIERTO", "ENVIANDO"].includes(estado)) &&
          <Button disabled={!contexto || procesando || ocupado} onClick={recuperar}>Recuperar reemplazo guardado</Button>}
      </Box>
      {["INCIERTO", "ENVIANDO"].includes(estado) && (!registro?.ticket_reemplazo || registro.ticket_pendiente_guardar) && <Box sx={{ display: "grid", gap: 1 }}>
        <Typography sx={{ fontSize: 12 }}>Ubica el ticket de esta carga en SUNAT. Se verificará su archivo, período y fecha antes de asociarlo.</Typography>
        <TextField label="Ticket observado en SUNAT" value={ticketManual} onChange={(e) => setTicketManual(e.target.value)} size="small" />
        <Button disabled={!disponible || !ticketManual.trim()} onClick={conciliar}>Verificar ticket en SUNAT</Button>
      </Box>}
      <Dialog open={abierto} onClose={() => { if (!procesando) setAbierto(false); }} fullWidth maxWidth="sm">
        <DialogTitle>Confirmar reemplazo de propuesta</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 1.5 }}>
          <Alert severity="warning">El archivo reemplazará la propuesta completa del RUC y período en SUNAT.</Alert>
          <Typography>{empresa || documentoId} · RUC {documentoId} · Período {periodo}</Typography>
          <Typography>{registro?.cantidad_registros ?? 0} comprobantes en el archivo.</Typography>
          {registro?.resumen?.total !== undefined && <Typography>Total del archivo: S/ {registro.resumen.total}</Typography>}
          {descarga && <Button component="a" href={descarga} download>Descargar archivo RVIE</Button>}
          <FormControlLabel control={<Checkbox checked={alcance} onChange={(e) => setAlcance(e.target.checked)} />}
            label="Revisé el archivo y confirmo que contiene todas las ventas del RUC y período, incluidas las de otros módulos si corresponden." />
          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button disabled={procesando} onClick={() => setAbierto(false)}>Volver</Button>
          <Button variant="contained" disabled={!disponible || estado !== "PREPARADO" || !alcance} onClick={enviar}>
            {procesando ? "Procesando..." : "Enviar reemplazo a SUNAT"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}