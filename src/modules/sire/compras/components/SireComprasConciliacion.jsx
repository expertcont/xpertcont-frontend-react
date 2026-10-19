import React, { useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import DataTable from 'react-data-table-component';
import { sireComprasApi } from '../services/sireComprasApi';
import palette from '../../../../theme/palette';
import { dialogPaperSx, formSx } from '../utils/formStyles';

const acciones={INCORPORAR:'Incorporar',APLICAR_CON_AJUSTES:'Actualizar conservando ajustes',CONSERVAR_MANUAL:'Conservar manual',CONSERVAR_OTRO_PERIODO:'Conservar otro período'};
export default function SireComprasConciliacion({ datos, idAnfitrion, documentoId, periodo, ocupado, onCambio }) {
  const [revision,setRevision]=useState(null),[abierto,setAbierto]=useState(false),[error,setError]=useState(''),[cargando,setCargando]=useState(false);
  if(!datos.propuesta?.conciliacion_pendiente)return null;
  const ticket=datos.propuesta.ticket;
  const revisar=async()=>{
    setCargando(true);setError('');
    try{const contexto=[periodo,idAnfitrion,documentoId].map(encodeURIComponent).join('/');
      const {data}=await sireComprasApi.revisarConciliacion(ticket,contexto);setRevision(data);setAbierto(true);
    }catch(e){setError(e.response?.data?.message || 'No se pudo revisar la nueva descarga.');}finally{setCargando(false);}
  };
  const aplicar=async()=>{
    setCargando(true);setError('');
    try{await sireComprasApi.confirmarConciliacion(ticket,{id_anfitrion:idAnfitrion,documento_id:documentoId,periodo,confirmar:true,huella_revision:revision.huella_revision});
      setAbierto(false);setRevision(null);onCambio();
    }catch(e){setRevision(null);setError(e.response?.data?.message || 'No se pudo aplicar la conciliación. Vuelve a revisarla.');}finally{setCargando(false);}
  };
  return <Box sx={{...formSx,display:'grid',gap:1}}>
    <Alert severity="warning">Hay una nueva descarga pendiente de revisión. Tus ajustes, exclusiones y pendientes siguen conservados.</Alert>
    {error && <Alert severity="error">{error}</Alert>}
    <Button variant="outlined" disabled={ocupado || cargando} onClick={revisar} sx={{justifySelf:'start'}}>Revisar nueva descarga</Button>
    <Dialog open={abierto} onClose={()=>{if(!cargando)setAbierto(false);}} maxWidth="lg" fullWidth PaperProps={{sx:dialogPaperSx}}>
      <DialogTitle>Conciliar nueva propuesta SUNAT</DialogTitle>
      <DialogContent sx={{display:'grid',gap:1}}>
        <Typography sx={{fontSize:13}}>Se incorporarán los nuevos comprobantes y se conservarán tus cambios. En campos modificados por ambas partes prevalece el ajuste del contador.</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {!!revision?.ausentes_conservados?.length && <Alert severity="info">Se conservarán {revision.ausentes_conservados.length} comprobantes que ya no aparecen en la descarga.</Alert>}
        <DataTable data={revision?.registros || []} columns={[
          {name:'Comprobante',selector:r=>[r.sunat.tipo_comprobante,r.sunat.serie,r.sunat.numero].join('-'),minWidth:'170px'},
          {name:'Proveedor',selector:r=>r.sunat.proveedor,wrap:true,minWidth:'220px'},
          {name:'Acción',selector:r=>acciones[r.accion],wrap:true,minWidth:'210px'},
          {name:'Campos que conservan tu ajuste',selector:r=>(r.campos_con_conflicto || []).join(', ') || '—',wrap:true,minWidth:'200px'},
        ]} pagination paginationPerPage={10} customStyles={{table:{style:{backgroundColor:palette.surface}},headRow:{style:{backgroundColor:palette.surfaceAlt,borderBottom:`1px solid ${palette.borderSoft}`}},headCells:{style:{color:palette.muted,fontSize:11,fontWeight:800}},rows:{style:{backgroundColor:palette.surface,color:palette.text,borderBottom:`1px solid ${palette.borderSoft}`}},pagination:{style:{backgroundColor:palette.surface,color:palette.muted,borderTop:`1px solid ${palette.borderSoft}`},pageButtonsStyle:{color:palette.text,fill:palette.text}}}} />
      </DialogContent>
      <DialogActions><Button disabled={cargando} onClick={()=>setAbierto(false)}>Volver</Button><Button variant="contained" disabled={!revision || cargando} onClick={aplicar}>Aplicar conservando ajustes</Button></DialogActions>
    </Dialog>
  </Box>;
}
