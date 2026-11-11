import { useEffect, useState } from "react";
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import palette from "../../../theme/palette";
import { apiGre, destinatarioGre, estadoGre, fechaGre, greComprobante, rutaGreComercial } from "./greConsulta";
import AdminGreCompraEditor from "./AdminGreCompraEditor";

export default function AdminGreForm({ open, row, backHost, idAnfitrion, idInvitado, documentoId, periodo, onClose, onSaved }) {
  const [detalle, setDetalle] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [anulando, setAnulando] = useState(false);
  const [confirmarAnulacion, setConfirmarAnulacion] = useState(false);

  useEffect(() => {
    setDetalle(null);
    setError("");
    setEditing(false);
    setConfirmarAnulacion(false);
    if (!open || !row) return undefined;
    const controller = new AbortController();
    setLoading(true);
    apiGre(backHost, [...rutaGreComercial(idAnfitrion,idInvitado,documentoId),"guias", row.periodo || periodo, row.cod, row.serie, row.numero], {signal:controller.signal})
      .then((data) => { if (!controller.signal.aborted) setDetalle(data); })
      .catch((err) => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [open, row, backHost, idAnfitrion, idInvitado, documentoId, periodo]);

  const anular = async () => {
    setAnulando(true); setError("");
    try {
      await apiGre(backHost,[...rutaGreComercial(idAnfitrion,idInvitado,documentoId),"guias",detalle.periodo,detalle.cod,detalle.serie,detalle.numero,"anular"],{method:"POST",body:{version:detalle.version}});
      onSaved({...detalle,estado:"ANULADA"});
    } catch(err) { setError(err.message); }
    finally { setAnulando(false); setConfirmarAnulacion(false); }
  };
  const editorVisible = open && (!row || editing);

  const fields = detalle ? [
    ["Emisión", `${fechaGre(detalle.fecha_emision)} ${detalle.hora_emision || ""}`],
    ["Fecha de traslado", fechaGre(detalle.fecha_traslado)],
    ["Destinatario", destinatarioGre(detalle)],
    ["Documento del destinatario", detalle.destinatario_ruc_dni],
    ["Motivo de traslado (código)", detalle.guia_motivo_id],
    ["Modalidad de traslado (código)", detalle.guia_modalidad_id],
    ["Punto de partida", [detalle.partida_ubigeo, detalle.partida_direccion].filter(Boolean).join(" · ")],
    ["Punto de llegada", [detalle.llegada_ubigeo, detalle.llegada_direccion].filter(Boolean).join(" · ")],
    ["Transportista", [detalle.transp_ruc, detalle.transp_razon_social].filter(Boolean).join(" · ")],
    ["Registro MTC", detalle.transp_mtc],
    ["Conductor", [detalle.conductor_dni, detalle.conductor_nombres, detalle.conductor_apellidos].filter(Boolean).join(" ")],
    ["Licencia / placa", [detalle.conductor_licencia, detalle.vehiculo_placa].filter(Boolean).join(" / ")],
    ["Peso total registrado", detalle.peso_total],
    ["Venta vinculada", [detalle.ref_cod, detalle.ref_serie, detalle.ref_numero].filter(Boolean).join("-")],
    ["Observaciones", detalle.glosa],
  ] : [];

  return (
    <Dialog open={Boolean(open)} onClose={editorVisible || anulando ? undefined : onClose} fullWidth maxWidth={editorVisible ? "lg" : "md"} PaperProps={{ sx: { bgcolor: palette.surface, color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 3 } }}>
      <DialogTitle>
        {row ? `Guía de remisión ${greComprobante(row)}` : "Nueva guía por compras"}
        <Typography sx={{ color: palette.muted, fontSize: 13, mt: 0.5 }}>{editorVisible ? "Compra · Transporte público" : `Consulta · ${estadoGre(detalle || row || {})}`}</Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: palette.borderSoft }}>
        {editorVisible && <AdminGreCompraEditor detalle={editing ? detalle : null} backHost={backHost} idAnfitrion={idAnfitrion} idInvitado={idInvitado} documentoId={documentoId} periodo={periodo} onSaved={onSaved} onCancel={editing ? ()=>setEditing(false) : onClose} />}
        {!editorVisible && loading && <Box role="status" sx={{ p: 4, textAlign: "center" }}><CircularProgress size={28} aria-label="Cargando guía" /></Box>}
        {error && <Alert severity="error">{error}</Alert>}
        {!editorVisible && detalle && <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.2 }}>
          {fields.map(([label, value]) => <Box key={label}>
            <Typography sx={{ color: palette.muted, fontSize: 12 }}>{label}</Typography>
            <Typography sx={{ fontSize: 14, mt: 0.4, overflowWrap: "anywhere" }}>{value === null || value === undefined || value === "" ? "—" : value}</Typography>
          </Box>)}
        </Box>}
        {!editorVisible && detalle && <Box sx={{mt:3,display:"grid",gap:2}}>
          <Typography sx={{fontWeight:800}}>Facturas relacionadas ({detalle.documentos?.length || 0})</Typography>
          {detalle.documentos?.map((doc)=><Box key={doc.doc_item} sx={{p:1.5,bgcolor:palette.surfaceAlt,borderRadius:2}}>
            <Typography sx={{fontSize:13,fontWeight:700}}>{doc.doc_item} · {doc.prov_razon_social} · {doc.doc_serie}-{doc.doc_numero}</Typography>
            <Typography sx={{fontSize:12,color:palette.muted}}>{doc.prov_doc} · {fechaGre(doc.fecha_emision)} · {doc.moneda} {doc.total} · {doc.origen_dato}</Typography>
          </Box>)}
          {!detalle.documentos?.length && <Typography sx={{fontSize:13,color:palette.muted}}>Sin facturas de compra asociadas.</Typography>}
          <Typography sx={{fontWeight:800}}>Ítems ({detalle.items?.length || 0})</Typography>
          {detalle.items?.map((item)=><Box key={item.item} sx={{p:1.5,bgcolor:palette.surfaceAlt,borderRadius:2}}>
            <Typography sx={{fontSize:13,fontWeight:700}}>{item.item} · {item.descripcion}</Typography>
            <Typography sx={{fontSize:12,color:palette.muted}}>{item.cantidad} {item.cont_und} · Producto: {item.id_producto || "—"}{item.doc_item ? ` · Factura ${item.doc_item}` : ""}{item.peso != null ? ` · Peso: ${item.peso} kg` : ""}</Typography>
          </Box>)}
          {!detalle.items?.length && <Typography sx={{fontSize:13,color:palette.muted}}>Sin ítems registrados.</Typography>}
          {detalle.envio && <Alert severity="info">Estado: {detalle.envio.estado}{detalle.envio.ticket ? ` · Ticket: ${detalle.envio.ticket}` : ""}{detalle.envio.mensaje_respuesta ? ` · ${detalle.envio.mensaje_respuesta}` : ""}</Alert>}
        </Box>}
        {confirmarAnulacion && <Alert severity="warning" sx={{mt:2}} action={<Button onClick={anular} disabled={anulando} color="inherit">{anulando ? "Anulando..." : "Confirmar anulación"}</Button>}>Se anulará localmente esta guía pendiente. Su número seguirá consumido.</Alert>}
      </DialogContent>
      {!editorVisible && <DialogActions>
        {detalle?.editable && <><Button onClick={()=>setConfirmarAnulacion((v)=>!v)} disabled={anulando} sx={{color:palette.danger}}>Anular compra</Button><Button onClick={()=>setEditing(true)} disabled={anulando} sx={{color:palette.accent}}>Editar compra</Button></>}
        <Button onClick={onClose} disabled={anulando} sx={{ color: palette.text }}>Cerrar</Button>
      </DialogActions>}
    </Dialog>
  );
}
