import React, { useState } from 'react';
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, MenuItem, TextField, Typography } from '@mui/material';
import DataTable from 'react-data-table-component';
import usePersonalizada from '../hooks/usePersonalizada';
import { columnasCompras, filtrarCompras, money } from '../utils/comprasView';
import { exportarCompras } from '../services/exportarCompras';
import palette from '../../../../theme/palette';
const estados={DECLARAR:'Por declarar',PENDIENTE:'Pendiente de documentación',EXCLUIDO:'Excluido'};
const campos=[['fecha_emision','Fecha de emisión','date'],['tipo_comprobante','Tipo de comprobante'],['serie','Serie'],['numero','Número'],['ano_dam','Año DAM'],['tipo_doc_proveedor','Tipo documento proveedor'],['documento_proveedor','Documento proveedor'],['proveedor','Proveedor'],['moneda','Moneda'],['tipo_cambio','Tipo de cambio','number'],['base001','Base A','number'],['igv001','IGV A','number'],['base002','Base B','number'],['igv002','IGV B','number'],['base003','Base C','number'],['igv003','IGV C','number'],['base004','No gravadas','number'],['isc','ISC','number'],['icbp','ICBP','number'],['otros','Otros','number'],['total','Total','number']];
const siguiente=periodo=>{
  const [ano,mes]=periodo.split('-').map(Number);
  return mes===12 ? String(ano+1)+'-01' : String(ano)+'-'+String(mes+1).padStart(2,'0');
};
export default function SireComprasPersonalizada({idAnfitrion,documentoId,periodo,valido,filtros}) {
  const gestion=usePersonalizada({idAnfitrion,documentoId,periodo,valido});
  const [estado,setEstado]=useState('');
  const [editor,setEditor]=useState(null);
  const [errorForm,setErrorForm]=useState('');
  const registros=gestion.registros.map(r=>({...r.comprobante,...r}));
  const estadoVista=r=>r.estado==='DECLARAR' && r.periodo_destino!==periodo ? 'ASIGNADO' : r.estado;
  const visibles=filtrarCompras(registros,filtros).filter(r=>!estado || estadoVista(r)===estado);
  const declarables=registros.filter(r=>r.estado==='DECLARAR' && r.periodo_destino===periodo);
  const editar=(registro=null,eliminar=false)=>{
    setErrorForm('');
    setEditor({registro,eliminar,comprobante:registro?.comprobante || {fecha_emision:periodo+'-01',tipo_comprobante:'01',tipo_doc_proveedor:'6',moneda:'PEN',tipo_cambio:1},
      estado:eliminar?'EXCLUIDO':registro?.estado || 'DECLARAR',motivo:registro?.motivo || '',
      periodo_destino:registro?.estado==='PENDIENTE' && registro.periodo_destino>periodo ? registro.periodo_destino : siguiente(periodo)});
  };
  const guardar=async()=>{
    if(editor.estado!=='DECLARAR' && !editor.motivo.trim()){setErrorForm('Indica el motivo para excluir o dejar pendiente.');return;}
    if(editor.estado==='PENDIENTE' && editor.periodo_destino<=periodo){setErrorForm('Selecciona un período futuro.');return;}
    const ok=await gestion.ejecutar(editor.eliminar?'eliminar':editor.registro?'editar':'crear',{
      id_compra:editor.registro?.id_compra,version:editor.registro?.version,comprobante:editor.comprobante,
      estado:editor.estado,motivo:editor.motivo,periodo_destino:editor.periodo_destino,
    });
    if(ok)setEditor(null);
  };
  const recuperar=r=>gestion.ejecutar('editar',{id_compra:r.id_compra,version:r.version,comprobante:r.comprobante,estado:'DECLARAR',motivo:''});
  const columnas=[
    {name:'Estado',minWidth:'195px',cell:r=><Box><Chip size="small" label={r.estado==='DECLARAR' && r.periodo_destino!==periodo ? 'Asignado a '+r.periodo_destino : estados[r.estado]} color={r.estado==='PENDIENTE'?'warning':r.estado==='EXCLUIDO'?'default':'success'} /><Typography sx={{fontSize:11,mt:0.5}}>{r.motivo}</Typography></Box>,wrap:true},
    ...columnasCompras(1),
    {name:'Origen / período',minWidth:'150px',selector:r=>r.origen+' / '+r.periodo_origen,wrap:true},
    {name:'Período destino',width:'130px',selector:r=>r.periodo_destino},
    {name:'Acciones',minWidth:'280px',cell:r=>{
      const asignado=r.estado==='DECLARAR' && r.periodo_destino!==periodo;
      return <Box sx={{display:'flex',gap:0.5,flexWrap:'wrap'}}><Button size="small" disabled={gestion.ocupado || asignado} onClick={()=>editar(r)}>Editar</Button>{r.estado==='DECLARAR'?<Button size="small" disabled={gestion.ocupado || asignado} onClick={()=>editar(r,true)}>Excluir</Button>:<Button size="small" disabled={gestion.ocupado} onClick={()=>recuperar(r)}>Incluir en {periodo}</Button>}</Box>;
    }},
  ];
  const totales=[...new Set(declarables.map(r=>r.moneda))].map(moneda=>moneda+' '+money(declarables.filter(r=>r.moneda===moneda).reduce((s,r)=>s+Number(r.total),0))).join(' / ') || '0.00';
  return <Box sx={{p:1,display:'grid',gap:1}}>
    <Typography sx={{fontWeight:800}}>Propuesta personalizada de compras</Typography>
    <Typography sx={{fontSize:12,color:palette.muted}}>Los comprobantes aparecen automáticamente al importar la propuesta SUNAT. Los pendientes requieren revisión antes de incluirlos en otro período. Este borrador se guarda por empresa y no presenta la declaración.</Typography>
    {gestion.error && <Alert severity="error">{gestion.error}</Alert>}{gestion.mensaje && <Alert severity={gestion.pendiente ? "info" : "success"}>{gestion.mensaje}</Alert>}
    <Box sx={{display:'flex',gap:1,flexWrap:'wrap'}}>
      <Button variant="outlined" disabled={!valido || gestion.ocupado} onClick={()=>editar()}>Agregar comprobante</Button>
      <Button disabled={!valido || gestion.ocupado} onClick={gestion.actualizar}>Actualizar lista</Button>
      <Button disabled={!declarables.length || gestion.ocupado} onClick={()=>exportarCompras(declarables,5,documentoId,periodo)}>Exportar por declarar</Button>
      <Button disabled={!visibles.length || gestion.ocupado} onClick={()=>exportarCompras(visibles,6,documentoId,periodo)}>Exportar revisión</Button>
    </Box>
    <Typography sx={{fontSize:13,fontWeight:700}}>{declarables.length} por declarar en {periodo} · Total: {totales}</Typography>
    <Box sx={{display:'flex',gap:0.5,flexWrap:'wrap'}}>{[['','Todos'],...Object.entries(estados),['ASIGNADO','Asignado a otro período']].map(([key,label])=><Button key={key} variant={estado===key?'contained':'outlined'} size="small" onClick={()=>setEstado(key)}>{label} ({key?registros.filter(r=>estadoVista(r)===key).length:registros.length})</Button>)}</Box>
    {gestion.ocupado && <LinearProgress />}
    <DataTable columns={columnas} data={visibles} keyField="id_compra" pagination paginationPerPage={25} paginationRowsPerPageOptions={[25,50,100]} highlightOnHover progressPending={gestion.ocupado}
      customStyles={{table:{style:{backgroundColor:palette.surface}},headRow:{style:{backgroundColor:palette.surfaceAlt}},rows:{style:{backgroundColor:palette.surface,color:palette.text}},headCells:{style:{color:palette.muted,fontSize:11}},cells:{style:{fontSize:12}}}}
      noDataComponent={<Box sx={{p:3}}>No hay comprobantes para esta vista. Importa el detalle en Propuesta SUNAT o agrega una compra.</Box>} />
    <Dialog open={Boolean(editor)} onClose={()=>{if(!gestion.ocupado)setEditor(null);}} maxWidth="md" fullWidth>
      <DialogTitle>{editor?.eliminar?'Excluir comprobante':editor?.registro?'Editar comprobante':'Agregar comprobante'}</DialogTitle>
      {editor && <DialogContent sx={{display:'grid',gap:2,pt:'12px !important'}}>
        {errorForm && <Alert severity="error">{errorForm}</Alert>}{gestion.error && <Alert severity="error">{gestion.error}</Alert>}
        {!editor.eliminar && <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(3,minmax(0,1fr))'},gap:1.5}}>{campos.map(([campo,label,tipo])=><TextField key={campo} label={label} type={tipo || 'text'} size="small" disabled={gestion.ocupado} value={editor.comprobante[campo] ?? ''} InputLabelProps={{shrink:true}} inputProps={tipo==='number'?{step:'0.01'}:undefined} onChange={e=>setEditor({...editor,comprobante:{...editor.comprobante,[campo]:e.target.value}})} />)}</Box>}
        {!editor.eliminar && <TextField label="Estado del comprobante" select size="small" value={editor.estado} disabled={gestion.ocupado} onChange={e=>setEditor({...editor,estado:e.target.value})}>{Object.entries(estados).map(([key,label])=><MenuItem key={key} value={key}>{label}</MenuItem>)}</TextField>}
        {editor.estado==='PENDIENTE' && <TextField label="Período para revisar documentación" type="month" value={editor.periodo_destino} InputLabelProps={{shrink:true}} inputProps={{min:siguiente(periodo)}} disabled={gestion.ocupado} onChange={e=>setEditor({...editor,periodo_destino:e.target.value})} />}
        <TextField label={editor.estado==='PENDIENTE'?'Documentación pendiente / motivo':'Motivo / observación'} multiline minRows={2} value={editor.motivo} required={editor.estado!=='DECLARAR'} inputProps={{maxLength:1000}} disabled={gestion.ocupado} onChange={e=>setEditor({...editor,motivo:e.target.value})} />
      </DialogContent>}
      <DialogActions><Button disabled={gestion.ocupado} onClick={()=>setEditor(null)}>Cancelar</Button><Button variant="contained" disabled={gestion.ocupado} onClick={guardar}>{editor?.eliminar?'Excluir':'Guardar'}</Button></DialogActions>
    </Dialog>
  </Box>;
}
