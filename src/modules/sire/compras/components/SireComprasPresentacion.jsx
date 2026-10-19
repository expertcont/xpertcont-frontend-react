import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, MenuItem, TextField, Typography } from '@mui/material';
import usePersonalizada from '../hooks/usePersonalizada';
import { sireComprasApi as api } from '../services/sireComprasApi';
import { exportarCompras } from '../services/exportarCompras';
import { money } from '../utils/comprasView';
import palette from '../../../../theme/palette';
import { dialogPaperSx, formSx, selectMenuProps } from '../utils/formStyles';

export default function SireComprasPresentacion({idAnfitrion,documentoId,periodo,valido,revision,datos,onCambio}) {
  const gestion=usePersonalizada({idAnfitrion,documentoId,periodo,valido,revision});
  const [control,setControl]=useState({aceptacion:null,reemplazo:null});
  const [revisionEnvio,setRevisionEnvio]=useState(null);
  const [razon,setRazon]=useState('');
  const [moneda,setMoneda]=useState('PEN');
  const [ocupado,setOcupado]=useState(false);
  const [error,setError]=useState('');
  const [mensaje,setMensaje]=useState('');
  const [confirmacion,setConfirmacion]=useState(null);
  const vigente=useRef(true),bloqueo=useRef(false);
  const contexto=[periodo,idAnfitrion,documentoId].map(encodeURIComponent).join('/');
  const payload={id_anfitrion:idAnfitrion,documento_id:documentoId,periodo,razon_social:razon,moneda_contable:moneda};
  const cargar=useCallback(async()=>{
    const {data}=await api.recuperarPresentacion(contexto);
    if(vigente.current)setControl(data);
  },[contexto]);
  useEffect(()=>{
    vigente.current=true;
    if(valido)cargar().catch(e=>{if(vigente.current)setError(e.response?.data?.message || 'No se pudo recuperar el control de presentación. Comprueba el SQL de Compras.');});
    return()=>{vigente.current=false;};
  },[cargar,valido,revision]);
  useEffect(()=>{setRevisionEnvio(null);},[revision,razon,moneda]);
  const registros=gestion.registros.map(r=>({...r.comprobante,...r}));
  const declarables=registros.filter(r=>r.estado==='DECLARAR' && r.periodo_destino===periodo);
  const pendientes=registros.filter(r=>['PENDIENTE','OBSERVADO'].includes(r.estado));
  const excluidos=registros.filter(r=>r.estado==='EXCLUIDO');
  const conciliacion=Boolean(datos.propuesta?.conciliacion_pendiente);
  const monedas=[...new Set(declarables.map(r=>r.moneda))];
  const trabajando=ocupado || gestion.ocupado;
  const activo=[control.aceptacion,control.reemplazo].some(r=>r && ['ENVIANDO','ENVIADO','INCIERTO','TERMINADO'].includes(r.estado));
  const ejecutar=async(accion,extras={})=>{
    if(!valido || bloqueo.current)return;
    bloqueo.current=true;setOcupado(true);setError('');setMensaje('');
    try{
      const {data}=await api.presentar(accion,{...payload,...extras});
      if(!vigente.current)return;
      if(accion==='revisar')setRevisionEnvio(data);
      else {
        if(data.aceptacion)setControl(c=>({...c,aceptacion:data.aceptacion}));
        if(data.reemplazo)setControl(c=>({...c,reemplazo:data.reemplazo}));
        setRevisionEnvio(null);
        onCambio?.();
      }
      setMensaje(data.message || 'Control actualizado.');
    }catch(e){
      if(vigente.current){setError(e.response?.data?.message || 'No se confirmó la operación. Actualiza el control antes de repetir un envío.');setRevisionEnvio(null);}
    }finally{
      if(vigente.current){await cargar().catch(()=>{});setOcupado(false);}
      bloqueo.current=false;
    }
  };
  const descargar=async()=>{
    if(bloqueo.current)return;
    bloqueo.current=true;setOcupado(true);setError('');
    try{
      const {data}=await api.descargarReemplazo(control.reemplazo.id,contexto);
      if(!vigente.current)return;
      const url=URL.createObjectURL(data),a=document.createElement('a');
      a.href=url;a.download=control.reemplazo.nombre_archivo;a.click();URL.revokeObjectURL(url);
    }catch(e){if(vigente.current)setError('No se pudo descargar el ZIP RCE.');}
    finally{bloqueo.current=false;if(vigente.current)setOcupado(false);}
  };
  const solicitar=(accion,extras,texto)=>setConfirmacion({accion,extras,texto});
  return <Box sx={{...formSx,p:1,display:'grid',gap:1}}>
    <Typography sx={{fontWeight:800}}>Presentación de compras del período {periodo}</Typography>
    <Typography sx={{fontSize:12,color:palette.muted}}>Considera todos los comprobantes del período. Los excluidos, observados y pendientes no se envían.</Typography>
    {trabajando && <LinearProgress />}{(error || gestion.error) && <Alert severity="error">{error || gestion.error}</Alert>}
    {mensaje && <Alert severity="info">{mensaje}</Alert>}
    {conciliacion && <Alert severity="warning">Revisa y aplica la nueva descarga antes de preparar o aceptar.</Alert>}
    <Box sx={{display:'flex',gap:2,flexWrap:'wrap'}}><Typography>{declarables.length} por declarar</Typography><Typography>{pendientes.length} pendientes u observados</Typography><Typography>{excluidos.length} excluidos</Typography></Box>
    {monedas.map(m=><Typography key={m} sx={{fontWeight:800}}>{m}: {money(declarables.filter(r=>r.moneda===m).reduce((n,r)=>n+Number(r.total),0))}</Typography>)}
    <Box sx={{display:'flex',gap:1,flexWrap:'wrap'}}>
      <TextField size="small" label="Razón social de la empresa" value={razon} disabled={trabajando} onChange={e=>setRazon(e.target.value)} helperText="Opcional si está en la descarga SUNAT" sx={{minWidth:280,flex:1}} />
      <TextField select size="small" label="Moneda contable" SelectProps={{MenuProps:selectMenuProps}} value={moneda} disabled={trabajando} onChange={e=>setMoneda(e.target.value)} sx={{minWidth:150}}><MenuItem value="PEN">Soles</MenuItem><MenuItem value="USD">Dólares</MenuItem></TextField>
    </Box>
    <Alert severity="info">Aceptar envía la propuesta SUNAT completa sin cambios. Para enviar tu lista editada, prepara y revisa el ZIP de reemplazo. Después consulta el resultado y registra el preliminar. La generación final del libro se completa en SUNAT Operaciones en Línea (SOL).</Alert>
    {activo && <Alert severity="warning">Existe una presentación enviada o terminada. Las compras involucradas quedan protegidas contra cambios. Si el resultado es incierto, verifica en SUNAT antes de repetir.</Alert>}
    <Box sx={{display:'flex',gap:1,flexWrap:'wrap'}}>
      <Button variant="outlined" disabled={!valido || trabajando || conciliacion || activo} onClick={()=>ejecutar('revisar')}>Revisar aceptación</Button>
      <Button variant="contained" disabled={!valido || trabajando || conciliacion || activo} onClick={()=>ejecutar('reemplazo/preparar')}>Preparar reemplazo RCE</Button>
      <Button disabled={trabajando || !valido} onClick={()=>cargar().catch(()=>setError('No se pudo actualizar el control.'))}>Actualizar control</Button>
    </Box>
    {revisionEnvio && <Alert severity={revisionEnvio.puede_aceptar?'success':'warning'} action={revisionEnvio.puede_aceptar && <Button disabled={trabajando || activo} onClick={()=>solicitar('aceptar',{huella_revision:revisionEnvio.huella_revision,ticket_propuesta:revisionEnvio.ticket_propuesta},'Se aceptará la propuesta SUNAT completa para este RUC y período.')}>Aceptar en SUNAT</Button>}>{revisionEnvio.message}</Alert>}
    {['aceptacion','reemplazo'].map(tipo=>{
      const r=control[tipo];if(!r)return null;
      const identificacion={tipo,id_operacion:r.id};
      return <Box key={tipo} sx={{border:'1px solid '+palette.borderSoft,borderRadius:1,p:1,display:'grid',gap:0.75}}>
        <Typography sx={{fontWeight:800}}>{tipo==='aceptacion'?'Aceptación':'Reemplazo'}: {r.estado}</Typography>
        <Typography sx={{fontSize:12}}>Ticket: {r.ticket || 'Sin ticket confirmado'} · {r.cantidad_registros} comprobantes</Typography>
        {r.descripcion && <Typography sx={{fontSize:12}}>{r.descripcion}</Typography>}
        {r.resumen?.totales && <Typography sx={{fontSize:12}}>Totales del archivo preparado: {Object.entries(r.resumen.totales).map(([m,t])=>m+': '+money(t.total)).join(' · ')}</Typography>}
        <Box sx={{display:'flex',gap:1,flexWrap:'wrap'}}>
          {tipo==='reemplazo' && <Button disabled={trabajando} onClick={descargar}>Descargar ZIP RCE</Button>}
          {tipo==='reemplazo' && r.estado==='PREPARADO' && <Button variant="contained" disabled={trabajando || activo || conciliacion} onClick={()=>solicitar('reemplazo/enviar',{id_reemplazo:r.id},'Se enviará el ZIP preparado: '+r.nombre_archivo+' ('+r.cantidad_registros+' comprobantes). Confirma que revisaste el archivo; reemplazará la propuesta de este RUC y período.')}>Enviar reemplazo a SUNAT</Button>}
          {r.ticket && !['TERMINADO','RECHAZADO'].includes(r.estado) && <Button disabled={trabajando} onClick={()=>ejecutar('consultar',identificacion)}>Consultar ticket</Button>}
          {r.estado==='TERMINADO' && (!r.preliminar || r.preliminar.estado==='RECHAZADO') && <Button variant="outlined" disabled={trabajando} onClick={()=>solicitar('preliminar',identificacion,'Se solicitará el registro preliminar del RCE procesado por SUNAT. Las operaciones con no domiciliados requieren su flujo separado en SOL.')}>Registrar preliminar</Button>}
          {r.preliminar?.ticket && !['TERMINADO','RECHAZADO'].includes(r.preliminar.estado) && <Button disabled={trabajando} onClick={()=>ejecutar('preliminar/consultar',identificacion)}>Consultar preliminar</Button>}
        </Box>
        {r.preliminar && <Alert severity={r.preliminar.estado==='TERMINADO'?'success':r.preliminar.estado==='RECHAZADO'?'error':'info'}>Preliminar: {r.preliminar.estado}. Ticket: {r.preliminar.ticket || 'sin confirmar'}. {r.preliminar.descripcion || ''}{r.preliminar.estado==='TERMINADO'?' Continúa con la generación final del libro en SOL.':''}</Alert>}
      </Box>;
    })}
    <Box sx={{display:'flex',gap:1,flexWrap:'wrap'}}>
      <Button variant="outlined" disabled={trabajando || !declarables.length || conciliacion} onClick={()=>exportarCompras(declarables,5,documentoId,periodo)}>Exportar compras por declarar</Button>
      <Button disabled={trabajando || !registros.length} onClick={()=>exportarCompras(registros,6,documentoId,periodo)}>Exportar revisión completa</Button>
    </Box>
    <Dialog open={Boolean(confirmacion)} onClose={()=>!trabajando && setConfirmacion(null)} maxWidth="sm" fullWidth PaperProps={{sx:dialogPaperSx}}>
      <DialogTitle>Confirmar envío a SUNAT</DialogTitle>
      <DialogContent><Typography>RUC {documentoId} · Período {periodo}</Typography><Typography sx={{mt:1}}>{confirmacion?.texto}</Typography></DialogContent>
      <DialogActions><Button onClick={()=>setConfirmacion(null)}>Volver</Button><Button variant="contained" onClick={()=>{const c=confirmacion;setConfirmacion(null);ejecutar(c.accion,{...c.extras,confirmar:true});}}>Confirmar envío</Button></DialogActions>
    </Dialog>
  </Box>;
}
