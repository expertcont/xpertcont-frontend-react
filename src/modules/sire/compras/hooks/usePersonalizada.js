import { useCallback, useEffect, useRef, useState } from 'react';
import { sireComprasApi as api } from '../services/sireComprasApi';
export default function usePersonalizada({ idAnfitrion, documentoId, periodo, valido }) {
  const [registros,setRegistros]=useState([]);
  const [ocupado,setOcupado]=useState(false);
  const [error,setError]=useState('');
  const [mensaje,setMensaje]=useState('');
  const [pendiente,setPendiente]=useState(false);
  const vigente=useRef(true), bloqueo=useRef(false);
  const cargar=useCallback(async(sincronizar=false)=>{
    let errorSincronizacion;
    if(sincronizar){
      try {
        // Solo copia datos ya guardados: abrir la pestana no consulta SUNAT.
        await api.importarPersonalizada({id_anfitrion:idAnfitrion,documento_id:documentoId,periodo,solo_guardada:true});
      } catch(e) { errorSincronizacion=e; }
    }
    const url=[periodo,idAnfitrion,documentoId].map(encodeURIComponent).join('/');
    const {data}=await api.listarPersonalizada(url);
    if(vigente.current)setRegistros(data.registros || []);
    if(errorSincronizacion)throw errorSincronizacion;
  },[periodo,idAnfitrion,documentoId]);
  useEffect(()=>{
    vigente.current=true;
    if(valido){
      setOcupado(true);bloqueo.current=true;
      cargar(true).catch(e=>{if(vigente.current)setError(e.response?.data?.message || 'No se pudo recuperar la propuesta personalizada.');})
        .finally(()=>{if(vigente.current){setOcupado(false);bloqueo.current=false;}});
    }
    return()=>{vigente.current=false;};
  },[cargar,valido]);
  const ejecutar=async(tipo,registro={})=>{
    if(!valido || bloqueo.current)return false;
    bloqueo.current=true;setOcupado(true);setError('');setMensaje('');
    const payload={id_anfitrion:idAnfitrion,documento_id:documentoId,periodo,...registro};
    try{
      let response;
      if(tipo==='crear')response=await api.crearPersonalizada(payload);
      else if(tipo==='editar')response=await api.editarPersonalizada(registro.id_compra,payload);
      else if(tipo==='eliminar')response=await api.eliminarPersonalizada(registro.id_compra,payload);
      if(!vigente.current)return false;
      setMensaje(response?.data?.message || 'Lista actualizada.');
      setPendiente(Boolean(response?.data?.pendiente));
      await cargar(tipo==='actualizar');
      return true;
    }catch(e){
      if(vigente.current)setError(e.response?.data?.message || 'No se pudo completar la operacion. Actualiza la lista antes de reintentar.');
      return false;
    }finally{bloqueo.current=false;if(vigente.current)setOcupado(false);}
  };
  return {registros,ocupado,error,mensaje,pendiente,ejecutar,actualizar:()=>ejecutar('actualizar')};
}
