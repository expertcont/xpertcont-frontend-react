import React, { useState } from 'react';
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, LinearProgress, MenuItem, TextField, Tooltip, Typography } from '@mui/material';
import { FileText, Pencil, Plus, RotateCcw, Save, Trash2, X } from 'lucide-react';
import DataTable from 'react-data-table-component';
import usePersonalizada from '../hooks/usePersonalizada';
import { columnasCompras, filtrarCompras, money } from '../utils/comprasView';
import { exportarCompras } from '../services/exportarCompras';
import palette from '../../../../theme/palette';
import { dialogPaperSx, formSx, sectionSx, selectMenuProps } from '../utils/formStyles';
const estados={DECLARAR:'Por declarar',PENDIENTE:'Pendiente de documentación',OBSERVADO:'Observado',EXCLUIDO:'Excluido'};
const campos=[['fecha_emision','Fecha de emisión','date'],['tipo_comprobante','Tipo de comprobante'],['serie','Serie'],['numero','Número'],['ano_dam','Año DAM'],['tipo_doc_proveedor','Tipo documento proveedor'],['documento_proveedor','Documento proveedor'],['proveedor','Proveedor'],['moneda','Moneda'],['tipo_cambio','Tipo de cambio','number'],['base001','Base A','number'],['igv001','IGV A','number'],['base002','Base B','number'],['igv002','IGV B','number'],['base003','Base C','number'],['igv003','IGV C','number'],['base004','No gravadas','number'],['isc','ISC','number'],['icbp','ICBP','number'],['otros','Otros','number'],['total','Total','number']];
const secciones=[
  ['Datos del comprobante',['fecha_emision','tipo_comprobante','serie','numero','ano_dam']],
  ['Proveedor y moneda',['tipo_doc_proveedor','documento_proveedor','proveedor','moneda','tipo_cambio']],
  ['Importes del comprobante',['base001','igv001','base002','igv002','base003','igv003','base004','isc','icbp','otros','total']],
];
const siguiente=periodo=>{
  const [ano,mes]=periodo.split('-').map(Number);
  return mes===12 ? String(ano+1)+'-01' : String(ano)+'-'+String(mes+1).padStart(2,'0');
};
export default function SireComprasPersonalizada({idAnfitrion,documentoId,periodo,valido,filtros,revision,onCambio}) {
  const gestion=usePersonalizada({idAnfitrion,documentoId,periodo,valido,revision,onCambio});
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
    {name:'',width:'78px',ignoreRowClick:true,allowOverflow:true,cell:r=>{
      const asignado=r.estado==='DECLARAR' && r.periodo_destino!==periodo;
      const botonSx={width:28,height:28,p:0,border:`1px solid ${palette.border}`,borderRadius:palette.radius.control,color:palette.muted,'&:hover':{bgcolor:palette.accentSoft,color:palette.accent,borderColor:palette.accent},'&.Mui-disabled':{borderColor:palette.border}};
      return <Box sx={{display:'flex',gap:0.5,alignItems:'center'}}>
        <Tooltip title={asignado?'Asignado a otro período':'Editar comprobante'}><span><IconButton aria-label="Editar comprobante" size="small" disabled={gestion.ocupado || asignado} sx={botonSx} onClick={()=>editar(r)}><Pencil size={14} /></IconButton></span></Tooltip>
        {r.estado==='DECLARAR'
          ? <Tooltip title={asignado?'Asignado a otro período':'Excluir comprobante'}><span><IconButton aria-label="Excluir comprobante" size="small" disabled={gestion.ocupado || asignado} sx={{...botonSx,'&:hover':{bgcolor:palette.warningSoft,color:palette.warning,borderColor:palette.warning}}} onClick={()=>editar(r,true)}><Trash2 size={14} /></IconButton></span></Tooltip>
          : <Tooltip title={`Incluir en ${periodo}`}><span><IconButton aria-label={`Incluir en ${periodo}`} size="small" disabled={gestion.ocupado} sx={botonSx} onClick={()=>recuperar(r)}><RotateCcw size={14} /></IconButton></span></Tooltip>}
      </Box>;
    }},
    {name:'Estado',minWidth:'165px',cell:r=><Box sx={{py:0.25}}><Chip size="small" label={r.estado==='DECLARAR' && r.periodo_destino!==periodo ? 'Asignado a '+r.periodo_destino : estados[r.estado]} color={r.estado==='PENDIENTE'?'warning':r.estado==='EXCLUIDO'?'default':'success'} /><Typography sx={{fontSize:10.5,lineHeight:1.25,mt:0.25}}>{r.motivo}</Typography></Box>,wrap:true},
    ...columnasCompras(1),
    {name:'Origen',minWidth:'112px',cell:r=><Box sx={{lineHeight:1.25}}><Typography sx={{fontSize:11}}>{r.origen}</Typography><Typography sx={{fontSize:10.5,color:palette.muted}}>{r.periodo_origen}</Typography></Box>},
    {name:'Destino',width:'104px',selector:r=>r.periodo_destino},
  ];
  const totales=[...new Set(declarables.map(r=>r.moneda))].map(moneda=>moneda+' '+money(declarables.filter(r=>r.moneda===moneda).reduce((s,r)=>s+Number(r.total),0))).join(' / ') || '0.00';
  return <Box sx={{...formSx,p:1,display:'grid',gap:1}}>
    <Typography sx={{fontWeight:800}}>Compras por declarar</Typography>
    <Typography sx={{fontSize:12,color:palette.muted}}>Trabaja desde la propuesta SUNAT: agrega, modifica, excluye, observa o deja pendientes los comprobantes. No necesitas un registro administrativo previo. Los cambios se guardan; los originales SUNAT se conservan.</Typography>
    {gestion.error && <Alert severity="error">{gestion.error}</Alert>}{gestion.mensaje && <Alert severity={gestion.pendiente ? "info" : "success"}>{gestion.mensaje}</Alert>}
    <Box sx={{display:'flex',gap:1,flexWrap:'wrap'}}>
      <Button variant="contained" startIcon={<Plus size={15} />} disabled={!valido || gestion.ocupado} onClick={()=>editar()}>Agregar comprobante</Button>
      <Button disabled={!valido || gestion.ocupado} onClick={gestion.actualizar}>Actualizar lista</Button>
      <Button disabled={!declarables.length || gestion.ocupado} onClick={()=>exportarCompras(declarables,5,documentoId,periodo)}>Exportar por declarar</Button>
      <Button disabled={!visibles.length || gestion.ocupado} onClick={()=>exportarCompras(visibles,6,documentoId,periodo)}>Exportar revisión</Button>
    </Box>
    <Typography sx={{fontSize:13,fontWeight:700}}>{declarables.length} por declarar en {periodo} · Total: {totales}</Typography>
    <Box sx={{display:'flex',gap:0.5,flexWrap:'wrap'}}>{[['','Todos'],...Object.entries(estados),['ASIGNADO','Asignado a otro período']].map(([key,label])=><Button key={key} variant={estado===key?'contained':'outlined'} size="small" onClick={()=>setEstado(key)}>{label} ({key?registros.filter(r=>estadoVista(r)===key).length:registros.length})</Button>)}</Box>
    {gestion.ocupado && <LinearProgress />}
    <DataTable columns={columnas} data={visibles} keyField="id_compra" pagination paginationPerPage={15} paginationRowsPerPageOptions={[15,50,100]} highlightOnHover progressPending={gestion.ocupado}
      customStyles={{table:{style:{backgroundColor:palette.surface}},headRow:{style:{backgroundColor:palette.surfaceAlt,minHeight:'36px'}},rows:{style:{backgroundColor:palette.surface,color:palette.text,minHeight:'42px'}},headCells:{style:{color:palette.muted,fontSize:10.5,paddingLeft:'8px',paddingRight:'8px'}},cells:{style:{fontSize:11.5,paddingLeft:'8px',paddingRight:'8px'}}}}
      noDataComponent={<Box sx={{p:3}}>No hay comprobantes para esta vista. Consulta el ticket para cargar la propuesta SUNAT o agrega un comprobante manualmente.</Box>} />
    <Dialog open={Boolean(editor)} onClose={()=>{if(!gestion.ocupado)setEditor(null);}} maxWidth={editor?.eliminar?'sm':'md'} fullWidth PaperProps={{sx:dialogPaperSx}} aria-labelledby="sire-compra-editor-title">
      <DialogTitle id="sire-compra-editor-title" sx={{display:'flex',alignItems:'flex-start',gap:1.25}}>
        <Box sx={{display:'flex',alignItems:'center',justifyContent:'center',width:36,height:36,borderRadius:palette.radius.control,bgcolor:editor?.eliminar?palette.warningSoft:palette.accentSoft,color:editor?.eliminar?palette.warning:palette.accent,flexShrink:0}}><FileText size={19} /></Box>
        <Box sx={{flex:1,minWidth:0}}><Typography component="span" sx={{display:'block',fontSize:17,fontWeight:800}}>{editor?.eliminar?'Excluir comprobante':editor?.registro?'Editar comprobante':'Agregar comprobante'}</Typography><Typography component="span" sx={{display:'block',color:palette.muted,fontSize:12,mt:0.25}}>RUC {documentoId} · Período {periodo}</Typography></Box>
        <IconButton size="small" aria-label="Cerrar formulario" disabled={gestion.ocupado} onClick={()=>setEditor(null)} sx={{color:palette.muted,'&:hover':{bgcolor:palette.rowHover,color:palette.text}}}><X size={18} /></IconButton>
      </DialogTitle>
      {editor && <DialogContent sx={{display:'grid',gap:1.5,pt:'20px !important'}}>
        {errorForm && <Alert severity="error">{errorForm}</Alert>}{gestion.error && <Alert severity="error">{gestion.error}</Alert>}
        {editor.eliminar && <Box sx={{...sectionSx,bgcolor:palette.surfaceAlt}}><Typography sx={{fontSize:14,fontWeight:800}}>{[editor.comprobante.tipo_comprobante,editor.comprobante.serie,editor.comprobante.numero].filter(Boolean).join(' - ')}</Typography><Typography sx={{fontSize:12,color:palette.muted}}>{editor.comprobante.proveedor}</Typography><Alert severity="warning">El comprobante quedará excluido de las compras por declarar. Podrás volver a incluirlo desde la lista.</Alert></Box>}
        {!editor.eliminar && secciones.map(([titulo,nombres])=><Box key={titulo} sx={sectionSx}>
          <Typography sx={{color:palette.muted,fontSize:11,fontWeight:800,textTransform:'uppercase',letterSpacing:0.6}}>{titulo}</Typography>
          <Box sx={{display:'grid',gridTemplateColumns:{xs:'minmax(0,1fr)',sm:'repeat(2,minmax(0,1fr))',md:'repeat(4,minmax(0,1fr))'},gap:1.75}}>{nombres.map(nombre=>{
            const [campo,label,tipo]=campos.find(c=>c[0]===nombre);
            return <TextField key={campo} label={label} type={tipo || 'text'} size="small" fullWidth disabled={gestion.ocupado} value={editor.comprobante[campo] ?? ''} InputLabelProps={{shrink:true}} inputProps={tipo==='number'?{step:campo==='tipo_cambio'?'0.001':'0.01'}:undefined} sx={{gridColumn:campo==='proveedor'?{xs:'auto',sm:'span 2'}:'auto','& input':{textAlign:tipo==='number'?'right':'left',fontVariantNumeric:tipo==='number'?'tabular-nums':'normal'}}} onChange={e=>setEditor({...editor,comprobante:{...editor.comprobante,[campo]:e.target.value}})} />;
          })}</Box>
        </Box>)}
        <Box sx={sectionSx}>
          <Typography sx={{color:palette.muted,fontSize:11,fontWeight:800,textTransform:'uppercase',letterSpacing:0.6}}>Estado y observaciones</Typography>
          <Box sx={{display:'grid',gridTemplateColumns:{xs:'minmax(0,1fr)',sm:editor.estado==='PENDIENTE'?'repeat(2,minmax(0,1fr))':'minmax(0,1fr)'},gap:1.75}}>
            {!editor.eliminar && <TextField label="Estado del comprobante" select size="small" fullWidth SelectProps={{MenuProps:selectMenuProps}} value={editor.estado} disabled={gestion.ocupado} onChange={e=>setEditor({...editor,estado:e.target.value})}>{Object.entries(estados).map(([key,label])=><MenuItem key={key} value={key}>{label}</MenuItem>)}</TextField>}
            {editor.estado==='PENDIENTE' && <TextField label="Período para revisar documentación" size="small" type="month" fullWidth value={editor.periodo_destino} InputLabelProps={{shrink:true}} inputProps={{min:siguiente(periodo)}} disabled={gestion.ocupado} onChange={e=>setEditor({...editor,periodo_destino:e.target.value})} />}
          </Box>
          <TextField label={editor.estado==='PENDIENTE'?'Documentación pendiente / motivo':'Motivo / observación'} size="small" fullWidth multiline minRows={2} value={editor.motivo} required={editor.estado!=='DECLARAR'} inputProps={{maxLength:1000}} helperText={`${editor.motivo.length}/1000 caracteres`} disabled={gestion.ocupado} onChange={e=>setEditor({...editor,motivo:e.target.value})} />
        </Box>
      </DialogContent>}
      <DialogActions><Typography sx={{mr:'auto',color:palette.muted,fontSize:11}}>{editor?.eliminar?'Se conservará el comprobante original.':'Los datos originales de SUNAT se conservan.'}</Typography><Button variant="outlined" disabled={gestion.ocupado} onClick={()=>setEditor(null)}>Cancelar</Button><Button variant="contained" startIcon={<Save size={15} />} disabled={gestion.ocupado} onClick={guardar}>{gestion.ocupado?'Guardando…':editor?.eliminar?'Excluir comprobante':'Guardar comprobante'}</Button></DialogActions>
    </Dialog>
  </Box>;
}
