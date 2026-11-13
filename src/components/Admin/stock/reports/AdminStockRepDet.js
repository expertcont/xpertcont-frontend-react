import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate,useParams } from "react-router-dom";
import '../../../../App.css';
import 'styled-components';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react'; //new para cargar permisos luego de verificar registro en bd
import BotonExcelGeneral from '../../../BotonExcelGeneral';
import { getColumnasDet } from '../../AdminColumnas';
import { Layers } from 'lucide-react';
import AppButton from '../../../ui/AppButton';
import AdminStockReportLayout from '../common/AdminStockReportLayout';

export default function AdminStockRepDet() {
  //Control de useffect en retroceso de formularios
  //verificamos si es pantalla pequeña y arreglamos el grid de fechas

  //Seccion Dialog
  const [isDialogOpen, setDialogOpen] = useState(false);


  //Seccion carga de archivos
  ////////////////////////////////////////////////////////////////////////////

  //const back_host = process.env.BACK_HOST || "http://localhost:4000";
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
  //experimento
  const [updateTrigger, setUpdateTrigger] = useState({});

    //const [data, setData] = useState(tableDataItems);
  const [registrosdet,setRegistrosdet] = useState([]);
  const [valorBusqueda, setValorBusqueda] = useState(""); //txt: rico filtrado
  const [valorVista, setValorVista] = useState("ventas");
  const {user, isAuthenticated } = useAuth0();
  
  const [columnas, setColumnas] = useState([]);

  const [periodo_trabajo, setPeriodoTrabajo] = useState("");
  const [periodo_select,setPeriodosSelect] = useState([]);
  
  const [contabilidad_trabajo, setContabilidadTrabajo] = useState("");
  const [contabilidad_nombre, setContabilidadNombre] = useState("");
  const [contabilidad_select,setContabilidadesSelect] = useState([]);

  let [diaSel, setDiaSel] = useState("*");

  const handleChange = e => {
    //Para todos los demas casos ;)
    if (e.target.name==="periodo"){
      console.log('cambiando en periodo');
      setPeriodoTrabajo(e.target.value);
      //En cada cambio, actualizar ultimo periodo seleccionado 
      sessionStorage.setItem('periodo_trabajo', e.target.value);
      //console.log('handleChange periodo_trabajo', e.target.value);
    }
    if (e.target.name==="contabilidad"){
      console.log('cambiando en contabilidad');
      setContabilidadTrabajo(e.target.value);
      //En cada cambio, actualizar ultima contabilidad seleccionada
      sessionStorage.setItem('contabilidad_trabajo', e.target.value);
      
      //filtramos su nombre para historial
      const opcionSeleccionada = contabilidad_select.find(opcion => opcion.documento_id === e.target.value).razon_social;
      setContabilidadNombre(opcionSeleccionada);
      sessionStorage.setItem('contabilidad_nombre', opcionSeleccionada);
    }
    
    setUpdateTrigger(Math.random());//experimento para actualizar el dom
  }
  
  // Agrega íconos al inicio de cada columna
  
  // valores adicionales para Carga Archivo
  const [datosCarga, setDatosCarga] = useState({
    id_anfitrion: '',
    documento_id: '',
    periodo: '',
    id_libro: '',
    id_invitado: '',
  });  


  
  /*const procesaPDF = async (comprobante, nElem, tamaño) => {
    try {
        const [COD, SERIE, NUM] = comprobante.split('-');

        // Realizar ambas llamadas de API en paralelo
        const [resVenta, resVentaDet] = await Promise.all([
            fetch(`${back_host}/ad_venta/${periodo_trabajo}/${params.id_anfitrion}/${params.documento_id}/${COD}/${SERIE}/${NUM}/${nElem}`).then((res) => res.json()),
            fetch(`${back_host}/ad_ventadet/${periodo_trabajo}/${params.id_anfitrion}/${params.documento_id}/${COD}/${SERIE}/${NUM}/${nElem}`).then((res) => res.json())
        ]);

        // Configuración del ticket
        const options = {
            comprobante,
            documento_id: params.documento_id,
            id_invitado: params.id_invitado,
            venta: resVenta,
            ventadet: resVentaDet,
            logo,
            size: tamaño
        };

        // Generar el PDF
        let pdfUrl = "#";
        try {
            pdfUrl = await createPdfTicket(options); // Asegúrate de manejar correctamente esta función
            // Abre la URL en una nueva pestaña del navegador
            window.open(pdfUrl, '_blank');
        } catch (error) {
            console.error("Error al generar el PDF:", error);
        }

    } catch (error) {
        console.error("Error al procesar PDF", error);
        throw new Error("No se pudo generar el PDF.");
    }
  };*/

  
  
 ///////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////
  const cargaRegistro = async (strHistorialValorVista,strHistorialPeriodo,strHistorialContabilidad, sDia) => {
    let response;
    console.log("cargaRegistro sDia: ", sDia);
    //Cargamos asientos correspondientes al id_usuario,contabilidad y periodo
    if (strHistorialValorVista==='' || strHistorialValorVista===undefined || strHistorialValorVista===null){
        console.log(`${back_host}/ad_stockdettodos/${periodo_trabajo}/${params.id_anfitrion}/${contabilidad_trabajo}/${sDia}`);
        response = await fetch(`${back_host}/ad_stockdettodos/${periodo_trabajo}/${params.id_anfitrion}/${contabilidad_trabajo}/${sDia}`);
    }
    else{
        //usamos los historiales
        console.log(`${back_host}/ad_stockdettodos/${strHistorialPeriodo}/${params.id_anfitrion}/${strHistorialContabilidad}/${sDia}`);
        response = await fetch(`${back_host}/ad_stockdettodos/${strHistorialPeriodo}/${params.id_anfitrion}/${strHistorialContabilidad}/${sDia}`);
    }
    
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
    return registrosdet.filter((row) => [row.r_razon_social, row.r_documento_id, row.comprobante, row.descripcion, row.id_producto]
      .some((value) => String(value ?? '').toLowerCase().includes(termino)));
  }, [registrosdet, valorBusqueda]);
  
  
  //////////////////////////////////////////////////////////
  useEffect( ()=> {
      
      // Realiza acciones cuando isAuthenticated cambia
      //Verificar historial periodo 
      const st_periodo_trabajo = sessionStorage.getItem('periodo_trabajo');
      
      //New Cargar Lista, con sugerencia de foco inicial
      if (st_periodo_trabajo===null || st_periodo_trabajo===''){
          //en caso no haya periodos ni ruc registrados, no tiene porque cargar
        cargaPeriodosAnfitrion(params.periodo);
        setPeriodoTrabajo(params.periodo);
      }else{
        //en caso haya periodos y rucs, debe respetar el ambiente de trabajo anterior
        //cuidado con eliminar un ruc, el ambiente de trabajo podria desaparecer y generar bug ... ****
        cargaPeriodosAnfitrion(st_periodo_trabajo);
        setPeriodoTrabajo(st_periodo_trabajo);
      }

      //Verifica historial contabilidad
      const st_contabilidad_trabajo = sessionStorage.getItem('contabilidad_trabajo');
      const st_contabilidad_nombre = sessionStorage.getItem('contabilidad_nombre');
      //New Cargar Lista, con sugerencia de foco inicial
      if (st_contabilidad_trabajo===null || st_contabilidad_nombre===''){
        //en caso no haya periodos ni ruc registrados, no tiene porque cargar
        cargaContabilidadesAnfitrion(params.documento_id,st_contabilidad_nombre);
        setContabilidadTrabajo(params.documento_id);
      }else{
        //en caso haya periodos y rucs, debe respetar el ambiente de trabajo anterior
        //cuidado con eliminar un ruc, el ambiente de trabajo podria desaparecer y generar bug ... ****
        cargaContabilidadesAnfitrion(st_contabilidad_trabajo,st_contabilidad_nombre);
        setContabilidadTrabajo(st_contabilidad_trabajo);
      }
      

  },[isAuthenticated, user]) //Aumentamos IsAuthenticated y user

  /*useEffect( ()=> {
    
      //Carga por cada cambio de seleccion en toggleButton
      console.log('2do useeffect periodo_trabajo: ',periodo_trabajo);

      //Verifica historial id_libro
      const st_id_libro = sessionStorage.getItem('id_libro');
      const st_valorVista = (sessionStorage.getItem('valorVista') || 'ventas'); //new para el toggleButton

      if (st_id_libro) {
        //Establecer valor historial al toggleButton
        setValorVista(st_valorVista);
      }

      if (st_valorVista===null || st_valorVista===undefined || st_valorVista===''){

      setValorVista('ventas'); //Por default, la 1era vez
      //st_valorVista = 'ventas'; //new 
      }else{
      setValorVista(st_valorVista);
      }

      //fcuando carga x primera vez, sale vacio ... arreglar esto
      cargaRegistro(st_valorVista,periodo_trabajo,contabilidad_trabajo, diaSel);
    
      fetchTotalVentas();
  },[updateTrigger, diaSel]) //Aumentamos*/


  useEffect( ()=> {
    //Carga de Registros con permisos
    console.log('3ero useeffect periodo_trabajo: ',periodo_trabajo);

    const st_id_libro = sessionStorage.getItem('id_libro');
    const st_valorVista = sessionStorage.getItem('valorVista'); //para el toggleButton
    console.log('3ero useeffect st_id_libro: ',st_id_libro);
    if (st_id_libro) {
      //Establecer valor historial al toggleButton
      setValorVista(st_valorVista);
    }

    const st_periodo_trabajo = sessionStorage.getItem('periodo_trabajo'); //parametro necesario
    const st_contabilidad_trabajo = sessionStorage.getItem('contabilidad_trabajo'); //parametro necesario

    //Secundario despues de seleccion en toggleButton
    let columnasEspecificas;
    columnasEspecificas = getColumnasDet('stock');

    // Finalmente seteamos
    setColumnas(columnasEspecificas);    

    //cuando carga x primera vez, sale vacio ... arreglar esto
    cargaRegistro(st_valorVista,periodo_trabajo,contabilidad_trabajo, diaSel); //new cambio

    //Datos listos en caso de volver por aqui, para envio
    setDatosCarga(prevState => ({ ...prevState, id_anfitrion: params.id_anfitrion }));
    setDatosCarga(prevState => ({ ...prevState, periodo: st_periodo_trabajo }));
    setDatosCarga(prevState => ({ ...prevState, documento_id: st_contabilidad_trabajo }));
    setDatosCarga(prevState => ({ ...prevState, id_libro: st_id_libro }));
    setDatosCarga(prevState => ({ ...prevState, id_invitado: params.id_invitado }));
    
    //fetchTotalVentas();
  },[valorVista, diaSel, periodo_trabajo, contabilidad_trabajo, updateTrigger]) //Solo cuando este completo estado


  //////////////////////////////////////////////////////////
  const cargaPeriodosAnfitrion = (strHistorialPeriodo) =>{
    axios
    .get(`${back_host}/usuario/periodos/${params.id_anfitrion}`)
    .then((response) => {
      setPeriodosSelect(response.data);
      //console.log(response.data);

      if (strHistorialPeriodo === '' || strHistorialPeriodo === null){
        //Establecer 1er elemento en select
        if (response.data.length > 0) {
          setPeriodoTrabajo(response.data[0].periodo); 
          sessionStorage.setItem('periodo_trabajo',response.data[0].periodo);
        }
      }
      else{//Establecer elemento historial
        setPeriodoTrabajo(strHistorialPeriodo); 
        console.log('periodo_trabajo: ', periodo_trabajo);
        console.log('strHistorialPeriodo: ', strHistorialPeriodo);
      }
    })
    .catch((error) => {
        console.log(error);
    });
  }
  const cargaContabilidadesAnfitrion = (strHistorialContabilidad,strHistorialContabilidadNombre) =>{
    axios
    //Aqui debemos agregar restriccion de contabilidad por(usuario auxiliar)
    .get(`${back_host}/usuario/contabilidades/${params.id_anfitrion}/${params.id_invitado}`)
    .then((response) => {
      setContabilidadesSelect(response.data);
      if (strHistorialContabilidad === '' || strHistorialContabilidad === null){
        //Establecer 1er elemento en select
        if (response.data.length > 0) {
          setContabilidadTrabajo(response.data[0].documento_id); 
          setContabilidadNombre(response.data[0].razon_social); 
          sessionStorage.setItem('contabilidad_trabajo',response.data[0].documento_id);
        }
      }
      else{//Establecer elemento historial
        setContabilidadTrabajo(strHistorialContabilidad); 
        setContabilidadNombre(strHistorialContabilidadNombre); 
      }
    })
    .catch((error) => {
        console.log(error);
    });
  }

  

const handleDayFilter = (selectedDay) => {
  const dia = selectedDay === '*' ? '*' : selectedDay.toString().padStart(2, '0');
  setDiaSel(dia);
};
  

const handleClickTotal = (periodo,id_anfitrion,documento_id,dia) => {
  //setShowModalMostrarRecaudacion(true);
  axios.get(`${back_host}/ad_stockunidades/${periodo}/${id_anfitrion}/${documento_id}/${dia}`)
          .then(res => {
            if (res.data.success) {
              setRegistrosdet(res.data.data);
            }
          })
          .catch(err => console.error(err));
  //setUpdateTrigger(Math.random());//experimento para actualizar el dom        

};

  return (
    <AdminStockReportLayout
      titulo="Detalle de movimientos"
      contadorTexto={`líneas visibles · ${contabilidad_nombre || contabilidad_trabajo}`}
      buscarTexto="Comprobante, producto o RUC"
      busqueda={valorBusqueda}
      onBuscar={(event) => setValorBusqueda(event.target.value)}
      columnas={columnas}
      registros={registrosVisibles}
      filtros={{
        periodo: periodo_trabajo,
        periodos: periodo_select,
        empresa: contabilidad_trabajo,
        empresas: contabilidad_select,
        onChange: handleChange,
        onDia: handleDayFilter,
      }}
      acciones={(
        <>
          <AppButton
            icon={<Layers size={16} />}
            onClick={() => handleClickTotal(periodo_trabajo, params.id_anfitrion, contabilidad_trabajo, diaSel)}
            sx={{ height: 38 }}
          >
            Agrupar detalle
          </AppButton>
          <BotonExcelGeneral
            datos={registrosVisibles}
            nombreArchivo="Detalle_Stocks"
            tituloReporte={`Detalle de movimientos · ${contabilidad_trabajo} ${periodo_trabajo}`}
            columnasNumericas={['ingreso', 'egreso', 'precio_neto', 'porc_igv']}
            columnasExcluidas={['cod', 'serie', 'numero']}
          />
        </>
      )}
    />
  );
}
