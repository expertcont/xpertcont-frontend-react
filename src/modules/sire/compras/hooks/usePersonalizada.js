import { useCallback, useEffect, useRef, useState } from 'react';
import { sireComprasApi as api } from '../services/sireComprasApi';
export default function usePersonalizada({ idAnfitrion, documentoId, periodo, valido, revision = 0, onCambio }) {
  const [registros,setRegistros]=useState([]);
  const [ocupado,setOcupado]=useState(false);
  const [error,setError]=useState('');
  const [mensaje,setMensaje]=useState('');
  const [pendiente,setPendiente]=useState(false);
  const vigente=useRef(true), bloqueo=useRef(false);
  const cargar=useCallback(async()=>{
    const url=[periodo,idAnfitrion,documentoId].map(encodeURIComponent).join('/');
    const {data}=await api.listarPersonalizada(url);
    if(vigente.current)setRegistros(data.registros || []);
  },[periodo,idAnfitrion,documentoId]);
  useEffect(()=>{
    vigente.current=true;
    if(valido){
      setOcupado(true);bloqueo.current=true;
      cargar().catch(e=>{if(vigente.current)setError(e.response?.data?.message || 'No se pudieron recuperar las compras por declarar.');})
        .finally(()=>{if(vigente.current){setOcupado(false);bloqueo.current=false;}});
    }
    return()=>{vigente.current=false;};
  },[cargar,valido,revision]);
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
      await cargar();
      if(vigente.current && tipo!=='actualizar')onCambio?.();
      return true;
    }catch(e){
      if(vigente.current)setError(e.response?.data?.message || 'No se pudo completar la operacion. Actualiza la lista antes de reintentar.');
      return false;
    }finally{bloqueo.current=false;if(vigente.current)setOcupado(false);}
  };
  return {registros,ocupado,error,mensaje,pendiente,ejecutar,actualizar:()=>ejecutar('actualizar')};
}
