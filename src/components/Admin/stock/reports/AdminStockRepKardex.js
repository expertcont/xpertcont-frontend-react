import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate,useParams } from "react-router-dom";
import '../../../../App.css';
import 'styled-components';
import BotonExcelGeneral from '../../../BotonExcelGeneral';
import { AdminKardexColumnas } from '../../AdminColumnas';
import palette from '../../../../theme/palette';
import { ArrowLeft } from 'lucide-react';
import AppButton from '../../../ui/AppButton';
import AdminStockReportLayout from '../common/AdminStockReportLayout';

export default function AdminStockRepKardex() {
  //Control de useffect en retroceso de formularios
  //verificamos si es pantalla pequeña y arreglamos el grid de fechas
  //Seccion Dialog
  const [isDialogOpen, setDialogOpen] = useState(false);


  //Seccion carga de archivos
  ////////////////////////////////////////////////////////////////////////////

  //const back_host = process.env.BACK_HOST || "http://localhost:4000";
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
  //experimento

    //const [data, setData] = useState(tableDataItems);
  const [registrosdet,setRegistrosdet] = useState([]);
  const [valorBusqueda, setValorBusqueda] = useState(""); //txt: rico filtrado
    
  const [columnas, setColumnas] = useState([]);

  // Agrega íconos al inicio de cada columna
  

 ///////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////
  const cargaRegistro = async (sPeriodo, sIdAnfitrion, sDocumentoId,sDia, sIdProducto, sIdAlmacen) => {
    let response;
    //Cargamos asientos correspondientes al id_usuario,contabilidad y periodo
    console.log('kardex obtenido: ',`${back_host}/ad_stockkardex/${sPeriodo}/${sIdAnfitrion}/${sDocumentoId}/${sDia}/${sIdProducto}/${sIdAlmacen}`);
    response = await fetch(`${back_host}/ad_stockkardex/${sPeriodo}/${sIdAnfitrion}/${sDocumentoId}/${sDia}/${sIdProducto}/${sIdAlmacen}`);
    
    const data = await response.json();
    setRegistrosdet(data);
  }
  //////////////////////////////////////
  
 
  const navigate = useNavigate();
  //Para recibir parametros desde afuera
  const params = useParams();

  const registrosVisibles = useMemo(() => {
    const termino = valorBusqueda.trim().toLowerCase();
    if (!termino) return registrosdet;
    return registrosdet.filter((row) => [row.comprobante, row.descripcion, row.id_producto, row.op_contable]
      .some((value) => String(value ?? '').toLowerCase().includes(termino)));
  }, [registrosdet, valorBusqueda]);
  
  
  //////////////////////////////////////////////////////////
  useEffect( ()=> {
    //Carga de Registros con permisos
    //Secundario despues de seleccion en toggleButton
    let columnasEspecificas;
    columnasEspecificas = AdminKardexColumnas;

    // Finalmente seteamos
    setColumnas(columnasEspecificas);    

    //cuando carga x primera vez, sale vacio ... arreglar esto
    cargaRegistro(params.periodo, params.id_anfitrion, params.documento_id, params.dia, params.id_producto, params.id_almacen); //new cambio

    //Datos listos en caso de volver por aqui, para envio
    
    //fetchTotalVentas();
  },[]) //Solo cuando este completo estado


  //////////////////////////////////////////////////////////

  return (
    <AdminStockReportLayout
      titulo="Kardex físico"
      contadorTexto={`movimientos visibles · ${params.dia === '*' ? 'Todos los días' : `Día ${params.dia}`}`}
      buscarTexto="Comprobante o producto"
      busqueda={valorBusqueda}
      onBuscar={(event) => setValorBusqueda(event.target.value)}
      columnas={columnas}
      registros={registrosVisibles}
      paginar={false}
      contexto={(
        <Box component="dl" sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' }, gap: 0.75, m: 0 }}>
          {[
            ['Período', params.periodo],
            ['RUC', params.documento_id],
            ['Producto', params.id_producto],
            ['Almacén', params.id_almacen],
          ].map(([label, value]) => (
            <Box key={label} sx={{ minWidth: 0, px: 1, py: 0.65, backgroundColor: palette.surface,
              border: `1px solid ${palette.borderSoft}`, borderRadius: palette.radius.control }}>
              <Typography component="dt" sx={{ color: palette.muted, fontSize: 10, fontWeight: 800 }}>{label}</Typography>
              <Typography component="dd" sx={{ m: 0, color: palette.text, fontSize: 13, overflowWrap: 'anywhere' }}>{value}</Typography>
            </Box>
          ))}
        </Box>
      )}
      acciones={(
        <>
          <AppButton icon={<ArrowLeft size={16} />} onClick={() => navigate(-1)} sx={{ height: 38 }}>
            Volver
          </AppButton>
          <BotonExcelGeneral
            datos={registrosVisibles}
            nombreArchivo="Kardex Físico"
            tituloReporte={`Kardex físico · ${params.periodo} ${params.documento_id}`}
            columnasNumericas={['ingreso', 'egreso', 'saldo']}
            columnasExcluidas={['cod', 'serie', 'numero']}
          />
        </>
      )}
    />
  );
}
