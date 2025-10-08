import React from 'react';
import { useEffect, useState, useMemo, useCallback } from "react"
import { Card,CardContent,Box,Modal,Grid, Button,useMediaQuery,Select, MenuItem,Dialog,DialogContent,DialogTitle,Typography} from "@mui/material";
import { useNavigate,useParams } from "react-router-dom";
import DeleteIcon from '@mui/icons-material/Delete';
import FindIcon from '@mui/icons-material/FindInPage';
import AddBoxIcon from '@mui/icons-material/AddBox';
import { blueGrey } from '@mui/material/colors';
//import createPdfTicket from './AdminVentaPdf';
import DaySelector from "./AdminDias";
import { useDialog } from "./AdminConfirmDialogProvider";
import TaskAltIcon from "@mui/icons-material/TaskAlt";   

//import PrintIcon from '@mui/icons-material/Print';
import FindInPageIcon from '@mui/icons-material/FindInPage';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import FolderDeleteIcon from '@mui/icons-material/FolderDelete';          

import IconButton from '@mui/material/IconButton';
import swal from 'sweetalert';
import swal2 from 'sweetalert2'
import Datatable, {createTheme} from 'react-data-table-component';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import '../../App.css';
import 'styled-components';
//import axios from 'axios';

//import { utils, writeFile } from 'xlsx';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import axios from 'axios';

import { useAuth0 } from '@auth0/auth0-react'; //new para cargar permisos luego de verificar registro en bd
import BotonExcelVentas from '../BotonExcelVentas';

import { AdminStocksColumnas } from './AdminColumnas';

export default function AdminStockList() {
  //Control de useffect en retroceso de formularios
  //verificamos si es pantalla pequeña y arreglamos el grid de fechas
  const isSmallScreen = useMediaQuery('(max-width: 600px)');
  const { confirmDialog } = useDialog(); //unico dialogo
  const [fecha_clon, setFechaClon] = useState("");

  //Seccion Dialog
  const [isDialogOpen, setDialogOpen] = useState(false);

  createTheme('solarized', {
    text: {
      //primary: '#268bd2',
      primary: '#ffffff',
      secondary: '#2aa198',
    },
    background: {
      //default: '#002b36',
      default: '#1e272e'
    },
    context: {
      background: '#cb4b16',
      //background: '#1e272e',
      text: '#FFFFFF',
    },
    divider: {
      default: '#073642',
    },
    action: {
      button: 'rgba(0,0,0,.54)',
      hover: 'rgba(0,0,0,.08)',
      disabled: 'rgba(0,0,0,.12)',
    },
  }, 'dark');

  //Seccion carga de archivos
  ////////////////////////////////////////////////////////////////////////////

  //const back_host = process.env.BACK_HOST || "http://localhost:4000";
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
  //experimento
  const [updateTrigger, setUpdateTrigger] = useState({});

  const [selectedRows, setSelectedRows] = useState([]);
  const [toggleCleared, setToggleCleared] = useState(false);
    //const [data, setData] = useState(tableDataItems);
  const [registrosdet,setRegistrosdet] = useState([]);
  const [tabladet,setTabladet] = useState([]);  //Copia de los registros: Para tratamiento de filtrado
  const [navegadorMovil, setNavegadorMovil] = useState(false);
  const [valorBusqueda, setValorBusqueda] = useState(""); //txt: rico filtrado
  const [valorVista, setValorVista] = useState("ventas");
  const [id_libro, setValorLibro] = useState("014");
  const [permisosComando, setPermisosComando] = useState([]); //MenuComandos
  const {user, isAuthenticated } = useAuth0();
  
  const [columnas, setColumnas] = useState([]);

  const [periodo_trabajo, setPeriodoTrabajo] = useState("");
  const [periodo_select,setPeriodosSelect] = useState([]);
  
  const [contabilidad_trabajo, setContabilidadTrabajo] = useState("");
  const [contabilidad_nombre, setContabilidadNombre] = useState("");
  const [contabilidad_select,setContabilidadesSelect] = useState([]);
  const [valorComprobante, setValorComprobante] = useState("");

  const [datosPopUp,setDatosPopUp] = useState([]);
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
      sessionStorage.setItem('contabilidad_nombre', opcionSeleccionada);
    }
    if (e.target.name==="fecha_clon"){
      setFechaClon(e.target.value);
    }
    
    setUpdateTrigger(Math.random());//experimento para actualizar el dom
  }
  
  // Agrega íconos al inicio de cada columna
  let columnasComunes;
  //Permisos Nivel 01 - Menus (toggleButton)
  const [permisos, setPermisos] = useState([]); //Menu
  const [permisoVentas, setPermisoVentas] = useState(false);
  
  //Permisos Nivel 02 - Comandos (Buttons)
  const [pVenta0101, setPVenta0101] = useState(false); //Nuevo (Casi libre)
  const [pVenta0102, setPVenta0102] = useState(false); //Modificar (Restringido)
  const [pVenta0103, setPVenta0103] = useState(false); //ELiminar (Restringido)
  const [pVenta0104, setPVenta0104] = useState(false); //Eliminar Masivo (Casi Nunca solo el administrador)

  // valores adicionales para Carga Archivo
  const [datosCarga, setDatosCarga] = useState({
    id_anfitrion: '',
    documento_id: '',
    periodo: '',
    id_libro: '',
    id_invitado: '',
  });  

  const handleRowSelected = useCallback(state => {
        setSelectedRows(state.selectedRows);
    }, []);

  
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

  
  const handleUpdate = (sComprobante,bModoVista) => {
    console.log('sComprobante: ',sComprobante);
    //var num_asiento;
    if (bModoVista) {
      //Validamos
      navigate(`/ad_stock/${params.id_anfitrion}/${params.id_invitado}/${periodo_trabajo}/${contabilidad_trabajo}/${sComprobante}/view`);
    } else {
      navigate(`/ad_stock/${params.id_anfitrion}/${params.id_invitado}/${periodo_trabajo}/${contabilidad_trabajo}/${sComprobante}/-`);
    }    
  };
  const handleDelete = (comprobante,elemento) => {
    //Recuerda que el comprobante enviado es el comprobante_ref --> contiene el key del registro ;)
    confirmaEliminacion(params.id_anfitrion,contabilidad_trabajo,periodo_trabajo,comprobante,elemento);
  };
  const confirmaEliminacion = async(sAnfitrion,sDocumentoId,sPeriodo,sComprobante,sElemento)=>{
    const result = await confirmDialog({
        title: "Eliminar Comprobante?",
        message: `${sComprobante}`,
        icon: "warning", // success | error | info | warning
        confirmText: "ELIMINAR",
        cancelText: "CANCELAR",
    });
    if (result.isConfirmed) {
          console.log("✅ Eliminado:", sComprobante);
          eliminarRegistroSeleccionado(sAnfitrion,sDocumentoId,sPeriodo,sComprobante,sElemento);
          setToggleCleared(!toggleCleared);
          setRegistrosdet(registrosdet.filter(
                          registrosdet => registrosdet.comprobante !== sComprobante
                          ));
          setTimeout(() => { // Agrega una función para que se ejecute después del tiempo de espera
              setUpdateTrigger(Math.random());//experimento
          }, 200);
    } else {
      console.log("❌ Cancelado");
      return; // Salimos si el usuario cancela
    }
  }
  const eliminarRegistroSeleccionado = async (sAnfitrion, sDocumentoId, sPeriodo, sComprobante, sElemento) => {
    const [COD, SERIE, NUMERO] = sComprobante.split('-');
    const datosEnvio = {
      periodo: sPeriodo,
      id_anfitrion: sAnfitrion,
      documento_id: sDocumentoId,
      r_cod: COD,
      r_serie: SERIE,
      r_numero: NUMERO,
      elemento: sElemento
    }
    //console.log('datosEnvio',datosEnvio);

    try {
        const response = await axios.delete(`${back_host}/ad_ventadel`, {
            data: datosEnvio
        });

        // Verifica la respuesta del backend
        if (response.data.success) {
          /*swal({
            text:"Venta se ha eliminado con exito",
            icon:"success",
            timer:"2000"
          });*/
          confirmDialog({
                  title: "Venta se ha eliminado con exito",
                  //message: `${sComprobante}`,
                  icon: "success", // success | error | info | warning
                  confirmText: "ACEPTAR"
                  //cancelText: "CERRAR",
          });
        } else {
          confirmDialog({
            title: "No se puede Eliminar Venta, solo la ultima",
            icon: "error",
            confirmText: "ACEPTAR"
          });
          //console.log("No se pudo eliminar la venta, no es la ultima: " + response.data.message);
        }
    } catch (error) {
        //console.error("Error eliminando venta:", error);
          swal({
            text:"No se puede Eliminar Venta",
            icon:"error",
            timer:"2000"
          });
        
    }
};

  const handleDeleteOrigen = async (sAnfitrion,sDocumentoId,sPeriodo,sLibro) => {
    const { value: selectedOrigen } = await swal2.fire({
      title: 'Eliminar registros',
      //text: 'Selecciona el origen para la eliminación masiva:',
      input: 'select',
      icon: 'warning',
      //color: 'orange',
      inputOptions: {
        EXCEL: 'EXCEL',
        SIRE: 'SIRE',
        MANUAL: 'MANUAL',
        // Agrega las opciones según los valores de "origen" de tu tabla
      },
      inputPlaceholder: 'Selecciona el origen',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        return new Promise((resolve) => {
          if (value === '') {
            resolve('Debes seleccionar un origen');
          } else {
            resolve();
          }
        });
      },
    });

    // Si el usuario hace clic en "Eliminar" y selecciona un origen
    if (selectedOrigen) {
      // Aquí puedes realizar la lógica para eliminar registros masivamente con el origen seleccionado
      //console.log('Eliminar registros con origen:', selectedOrigen);
      await fetch(`${back_host}/asientomasivo/${sAnfitrion}/${sDocumentoId}/${sPeriodo}/${sLibro}/${selectedOrigen}`, {
        method:"DELETE"
      });

      setTimeout(() => { // Agrega una función para que se ejecute después del tiempo de espera
        setUpdateTrigger(Math.random());//experimento
      }, 200);
      console.log('eliminadooooo todo, ahora debemos recargar en 2do useeffect');
      cargaRegistro(valorVista,periodo_trabajo,contabilidad_trabajo,diaSel);
    }
  };
  

  ///////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////
  const cargaRegistro = async (strHistorialValorVista,strHistorialPeriodo,strHistorialContabilidad, sDia) => {
    let response;
    console.log("cargaRegistro sDia: ", sDia);
    //Cargamos asientos correspondientes al id_usuario,contabilidad y periodo
    if (strHistorialValorVista==='' || strHistorialValorVista===undefined || strHistorialValorVista===null){
        response = await fetch(`${back_host}/ad_stock/${periodo_trabajo}/${params.id_anfitrion}/${contabilidad_trabajo}/${sDia}`);
    }
    else{
        //usamos los historiales
        response = await fetch(`${back_host}/ad_stock/${strHistorialPeriodo}/${params.id_anfitrion}/${strHistorialContabilidad}/${sDia}`);
    }
    
    const data = await response.json();
    setRegistrosdet(data);
    setTabladet(data); //Copia para tratamiento de filtrado
  }
  //////////////////////////////////////
  
 
  const navigate = useNavigate();
  //Para recibir parametros desde afuera
  const params = useParams();

  const actualizaValorFiltro = e => {
    setValorBusqueda(e.target.value);
    filtrar(e.target.value);
  }
  const actualizaValorVista = (e) => {
    setValorVista(e.target.value);
    let idLibro;    
    idLibro = 
            e.target.value === 'ventas' ? '014'
          : e.target.value === 'caja' ? '001'
          : '005';
    setValorLibro(idLibro);
    //grabar datos sesionStorage id_libro y valorVista
    sessionStorage.setItem('id_libro', idLibro);
    sessionStorage.setItem('valorVista', e.target.value);
    //console.log("sessionStorage.setItem('id_libro', id_libro): ", idLibro);
    //console.log("sessionStorage.setItem('valorVista', valorVista): ", e.target.value);

    //cargamos valores para envio
    setDatosCarga(prevState => ({ ...prevState, id_anfitrion: params.id_anfitrion }));
    setDatosCarga(prevState => ({ ...prevState, periodo: periodo_trabajo }));
    setDatosCarga(prevState => ({ ...prevState, documento_id: contabilidad_trabajo }));
    setDatosCarga(prevState => ({ ...prevState, id_libro: idLibro }));
    setDatosCarga(prevState => ({ ...prevState, id_invitado: params.id_invitado }));

    //Lo dejaremos terminar el evento de cambio o change
    setUpdateTrigger(Math.random());//experimento para actualizar el dom
  }
  const filtrar = (strBusca) => {
    var resultadosBusqueda = tabladet.filter((elemento) => {
      //verifica nulls para evitar error de busqueda
      const razonSocial = elemento.r_razon_social?.toString().toLowerCase() || '';
      const documentoId = elemento.r_documento_id?.toString().toLowerCase() || '';
      const comprobante = elemento.comprobante?.toString().toLowerCase() || '';
  
      if (razonSocial.includes(strBusca.toLowerCase()) || documentoId.includes(strBusca.toLowerCase()) || comprobante.includes(strBusca.toLowerCase())) {
        return elemento;
      }
      return null; // Agrega esta línea para manejar el caso en que no haya coincidencia
    });
  
    resultadosBusqueda = resultadosBusqueda.filter(Boolean); // Filtra los elementos nulos
  
    setRegistrosdet(resultadosBusqueda);
  };
  
  const cargaPermisosMenuComando = async(idMenu)=>{
    if (params.id_anfitrion === params.id_invitado){
      setPVenta0101(true); //nuevo
      setPVenta0102(true); //modificar
      setPVenta0103(true); //eliminar
      setPVenta0104(true); //eliminar masivo
    }
    else{
        //Realiza la consulta a la API de permisos
        fetch(`${back_host}/seguridad/${params.id_anfitrion}/${params.id_invitado}/${idMenu}`, {
          method: 'GET'
        })
        .then(response => response.json())
        .then(permisosData => {
          // Guarda los permisos en el estado
          setPermisosComando(permisosData);
          console.log(permisosComando);
          let tienePermiso;
          // Verifica si existe el permiso de acceso 'ventas'
          tienePermiso = permisosData.some(permiso => permiso.id_comando === '20-01'); //Nuevo
          if (tienePermiso) {
            setPVenta0101(true);
          }

          tienePermiso = permisosData.some(permiso => permiso.id_comando === '20-02'); //Modificar
          if (tienePermiso) {
            setPVenta0102(true);
          }else {setPVenta0102(false);}

          tienePermiso = permisosData.some(permiso => permiso.id_comando === '20-03'); //Eliminar
          if (tienePermiso) {
            setPVenta0103(true);
          }else {setPVenta0103(false);}

          tienePermiso = permisosData.some(permiso => permiso.id_comando === '20-04'); //Eliminar Masivo
          if (tienePermiso) {
            setPVenta0104(true);
          }else {setPVenta0104(false);}
          ////////////////////////////////////////////////
          
          ////////////////////////////////////////////////

          //setUpdateTrigger(Math.random());//experimento
        })
        .catch(error => {
          console.log('Error al obtener los permisos:', error);
        });
    }
  }

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
      
      /////////////////////////////
      //NEW codigo para autenticacion y permisos de BD
      if (isAuthenticated && user && user.email) {
        cargaPermisosMenu(); //carga permisos menus
      }

  },[isAuthenticated, user]) //Aumentamos IsAuthenticated y user

  useEffect( ()=> {
    
      //Carga por cada cambio de seleccion en toggleButton
      console.log('2do useeffect periodo_trabajo: ',periodo_trabajo);

      //Verifica historial id_libro
      const st_id_libro = sessionStorage.getItem('id_libro');
      const st_valorVista = (sessionStorage.getItem('valorVista') || 'ventas'); //new para el toggleButton

      if (st_id_libro) {
        //Establecer valor historial al toggleButton
        setValorLibro(st_id_libro);
        setValorVista(st_valorVista);
      }

      if (st_valorVista===null || st_valorVista===undefined || st_valorVista===''){
      cargaPermisosMenuComando('20'); //Por default, la 1era vez
      setValorVista('ventas'); //Por default, la 1era vez
      //st_valorVista = 'ventas'; //new 
      }else{
      setValorVista(st_valorVista);
      }
      if (st_valorVista === 'ventas') {cargaPermisosMenuComando('20');}

      //fcuando carga x primera vez, sale vacio ... arreglar esto
      cargaRegistro(st_valorVista,periodo_trabajo,contabilidad_trabajo, diaSel);
    
  },[updateTrigger, diaSel]) //Aumentamos

  useEffect( ()=> {
    //Carga de Registros con permisos
    console.log('3ero useeffect periodo_trabajo: ',periodo_trabajo);

    const st_id_libro = sessionStorage.getItem('id_libro');
    const st_valorVista = sessionStorage.getItem('valorVista'); //para el toggleButton
    console.log('3ero useeffect st_id_libro: ',st_id_libro);
    if (st_id_libro) {
      //Establecer valor historial al toggleButton
      setValorLibro(st_id_libro);
      setValorVista(st_valorVista);
    }

    const st_periodo_trabajo = sessionStorage.getItem('periodo_trabajo'); //parametro necesario
    const st_contabilidad_trabajo = sessionStorage.getItem('contabilidad_trabajo'); //parametro necesario

    //Secundario despues de seleccion en toggleButton
    let columnasEspecificas;
    columnasEspecificas = AdminStocksColumnas;

    cargaColumnasComunes();        
    const combinado = [...columnasComunes, ...columnasEspecificas];

    //setColumnas([...columnasComunes, ...columnasEspecificas]);
    // Reordenamos (columna 4 → posición 7) Estetica para GRE
    //const ordenado = moveColumn(combinado, 3, 5); 

    // Finalmente seteamos
    setColumnas(combinado);    

    //cuando carga x primera vez, sale vacio ... arreglar esto
    cargaRegistro(st_valorVista,periodo_trabajo,contabilidad_trabajo, diaSel); //new cambio

    //Datos listos en caso de volver por aqui, para envio
    setDatosCarga(prevState => ({ ...prevState, id_anfitrion: params.id_anfitrion }));
    setDatosCarga(prevState => ({ ...prevState, periodo: st_periodo_trabajo }));
    setDatosCarga(prevState => ({ ...prevState, documento_id: st_contabilidad_trabajo }));
    setDatosCarga(prevState => ({ ...prevState, id_libro: st_id_libro }));
    setDatosCarga(prevState => ({ ...prevState, id_invitado: params.id_invitado }));

  },[permisosComando, pVenta0101, valorVista, diaSel]) //Solo cuando este completo estado

  function moveColumn(array, fromIndex, toIndex) {
    const updated = [...array];
    const [moved] = updated.splice(fromIndex, 1); // saco columna
    updated.splice(toIndex, 0, moved);            // la inserto en nueva pos
    return updated;
  }

  //////////////////////////////////////////////////////////
  const cargaColumnasComunes = () =>{
    //Verificar que el resto de permisos de otros libros siempre esten FALSE
    //Solo el libro en cuestion, validara TRUE OR FALSE

    columnasComunes = [
      {
        name: '',
        width: isSmallScreen ?  '40px' : '30px',
        cell: (row) => (
          (pVenta0102) && (row.r_vfirmado == null) ?
          (
            <DriveFileRenameOutlineIcon
              onClick={() => handleUpdate(row.comprobante_ref,false)}
              style={{
                cursor: 'pointer',
                color: 'skyblue',
                transition: 'color 0.3s ease',
              }}
            />
          )  
          : 
          (
            <FindInPageIcon
              onClick={() => handleUpdate(row.comprobante_ref,true)}
              style={{
                cursor: 'pointer',
                color: 'gray',
                transition: 'color 0.3s ease',
              }}
            />

          )
        ),
        allowOverflow: true,
        button: true,
      },
      {
        name: '',
        width: isSmallScreen ?  '40px' : '30px',
        cell: (row) => (
          (pVenta0103) && (row.r_vfirmado == null) ?
          (
            <DeleteIcon
              onClick={() => handleDelete(row.comprobante_ref, row.elemento)}
              style={{
                cursor: 'pointer',
                color: 'orange',
                transition: 'color 0.3s ease',
              }}
            />
          ) 
          : 
          (
            <ContentCopyIcon
              onClick={() => {
                  setShowModalMostrarClonar(true);
                  setValorComprobante(row.comprobante_ref);
                  //clonarVenta(row.comprobante_ref);
                  }
                }
              style={{
                cursor: 'pointer',
                //color: 'primary',
                transition: 'color 0.3s ease',
              }}
            />

          )

        ),
        allowOverflow: true,
        button: true,
      },

    ];
  }
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

  const cargaPermisosMenu = async()=>{
    //console.log(`${back_host}/seguridadmenu/${params.id_anfitrion}/${params.id_invitado}`);
    //En caso de anfitrion debemos establecer permisos en true, sin consumir api de consulta 
    if (params.id_anfitrion===params.id_invitado){
      setPermisoVentas(true);
    }
    else{
        //Realiza la consulta a la API de permisos, puro Menu (obtenerTodosMenu)
        fetch(`${back_host}/seguridadmenu/${params.id_anfitrion}/${params.id_invitado}`, {
          method: 'GET',
          //headers: {
          //  'Authorization': 'TOKEN_DE_AUTORIZACION' // Si es necesario
          // }
        })
        .then(response => response.json())
        .then(permisosData => {
          // Guarda los permisos en el estado
          setPermisos(permisosData);
      
          let tienePermiso;
          // Verifica si existe el permiso de acceso 'ventas'
          tienePermiso = permisosData.some(permiso => permiso.id_menu === '01');
          if (tienePermiso) {
            setPermisoVentas(true);
          }
        })
        .catch(error => {
          console.log('Error al obtener los permisos:', error);
        });
    }
  };

  //////////////////////////////////////////////////////////
  const abrirCerrarModal = ()=>{
    setAbierto(!abierto);
  };
  const [abierto,setAbierto] = useState(false);
  const modalStyles={
    position:'absolute',
    top:'0%',
    left:'0%',
    background:'gray',
    border:'2px solid #000',
    padding:'16px 32px 24px',
    width:'100',
    minHeight: '50px'
    //transform:'translate(0%,0%)'
  };
  const handleCerrar = (updatedData) => {
    setDatosPopUp(updatedData); // Actualiza los datos con los datos modificados
    setAbierto(false); // Cierra el modal
  };
  //////////////////////////////////////////////////////
  const generaMovimiento = async () => {
    try {
      //dia
      //console.log('antes de response.data');
      const response = await axios.post(`${back_host}/ad_stock`, {
        id_anfitrion: params.id_anfitrion,
        documento_id: params.documento_id,
        periodo: periodo_trabajo,
        id_invitado: params.id_invitado,
        fecha: obtenerFecha(periodo_trabajo,true,diaSel),
      });
      //console.log(response.data);

      if (response.data.success) {
        const sComprobanteAbierto = 'MV-0001-' + response.data.numero;
        const sComprobanteAbiertoRef = '-'; //modo directo sin ref
        //enviamos la edicion del registro abierto
        navigate(`/ad_stock/${params.id_anfitrion}/${params.id_invitado}/${periodo_trabajo}/${contabilidad_trabajo}/${sComprobanteAbierto}/${sComprobanteAbiertoRef}`);
      } else {
        //setError(response.data.message);
        console.log(response.data.message);
      }
    } catch (err) {
      //setError('Error al crear el pedido.');
      console.log('Error al crear el pedido.');
    }    
  };
  const clonarVenta = async (sComprobante) => {
    try {
      //console.log('dia sel para clonado: ... ', diaSel);
      const [COD, SERIE, NUMERO] = sComprobante.split('-');
      
      //dia
      const response = await axios.post(`${back_host}/ad_stockclon`, {
        id_anfitrion: params.id_anfitrion,
        documento_id: params.documento_id,
        periodo: periodo_trabajo,
        id_invitado: params.id_invitado,
        fecha: fecha_clon,
        r_cod: COD,
        r_serie: SERIE,
        r_numero: NUMERO
      });
      

      if (response.data.success) {
        const sComprobanteAbierto = 'MV-0001-' + response.data.numero;
        const sComprobanteAbiertoRef = sComprobante; //modo clonar con ref
        //enviamos la edicion del registro abierto
        navigate(`/ad_stock/${params.id_anfitrion}/${params.id_invitado}/${periodo_trabajo}/${contabilidad_trabajo}/${sComprobanteAbierto}/${sComprobanteAbiertoRef}`);
      } else {
        //setError(response.data.message);
        console.log(response.data.message);
      }
    } catch (err) {
      //setError('Error al crear el pedido.');
      console.log('Error al crear el pedido.');
    }    
  };

  const obtenerFecha = (periodo,bformatoBD,sDia) => {
    // Obtener el mes y año del parámetro "periodo" en formato "AAAA-MM"
    const [year, month] = periodo.split('-').map(Number);
  
    // Obtener la fecha actual
    const fechaActual = new Date();
    
    /*if (sDia!==''){
        //restamos 1 al mes, pinche manejo de fecha js
      const fechaSeleccionada = new Date(year, month-1, sDia); // Al pasar 0 en el día, se obtiene el último día del mes
      return formatearFecha(fechaSeleccionada,bformatoBD,sDia); // Retorna la fecha actual formateada
    }else{
      return formatearFecha(fechaActual,bformatoBD,sDia); // Retorna la fecha actual formateada
    }*/

    if (sDia==='' || sDia==='*'){
      return formatearFecha(fechaActual,bformatoBD,sDia); // Retorna la fecha actual formateada
    }else{
      //restamos 1 al mes, pinche manejo de fecha js
      const fechaSeleccionada = new Date(year, month-1, sDia); // Al pasar 0 en el día, se obtiene el último día del mes
      return formatearFecha(fechaSeleccionada,bformatoBD,sDia); // Retorna la fecha actual formateada
    }
  };

  // Función para formatear la fecha en DD/MM/YYYY
  const formatearFecha = (fecha,bformatoBD,sDia) => {
    let dia;
    if (sDia==='' || sDia==='*'){
      dia = String(fecha.getDate()).padStart(2, '0');
    }
    else {
      dia = sDia;      
    }
    
    const mes = String(fecha.getMonth() + 1).padStart(2, '0'); // Los meses en JavaScript son base 0
    const anio = fecha.getFullYear();
    if (bformatoBD) {
      return `${anio}-${mes}-${dia}`;
    }else{
      return `${dia}/${mes}/${anio}`;
    }
  };

const handleDayFilter = (selectedDay) => {
  const dia = selectedDay === '*' ? '*' : selectedDay.toString().padStart(2, '0');
  setDiaSel(dia);
};
  
const [totalVentas, setTotalVentas] = useState(0);
const [isSuper, setIsSuper] = useState(false);
const [recaudaciones, setRecaudaciones] = useState([]);
const [showModalMostrarRecaudacion, setShowModalMostrarRecaudacion] = useState(false);
const [showModalMostrarClonar, setShowModalMostrarClonar] = useState(false);

 return (
  <>
               { (showModalMostrarClonar) ?
                (   <>
                            {/* Seccion para mostrar Dialog tipo Modal, para busqueda incremental cuentas */}
                            <Dialog
                              open={showModalMostrarClonar}
                              onClose={() => setShowModalMostrarClonar(false)}
                              maxWidth="md" // Valor predeterminado de 960px
                              //fullWidth
                              disableScrollLock // Evita que se modifique el overflow del body
                              PaperProps={{
                                style: {
                                  top: isSmallScreen ? "-30vh" : "0vh", // Ajusta la distancia desde arriba
                                  left: isSmallScreen ? "-25%" : "0%", // Centrado horizontal
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  marginTop: '10vh', // Ajusta este valor según tus necesidades
                                  background: 'rgba(30, 39, 46, 0.95)', // Plomo transparencia                              
                                  //background: 'rgba(16, 27, 61, 0.95)', // Azul transparencia                              
                                  color:'white',
                                  width: isSmallScreen ? ('50%') : ('30%'), // Ajusta este valor según tus necesidades
                                  //width: isSmallScreen ? ('100%') : ('40%'), // Ajusta este valor según tus necesidades
                                  //maxWidth: 'none' // Esto es importante para permitir que el valor de width funcione
                                },
                              }}
                            >
                            <DialogTitle>Emision</DialogTitle>

                                <TextField variant="outlined" 
                                        //label="fecha"
                                        fullWidth
                                        size="small"
                                        sx={{display:'flex',
                                             width: 270, 
                                            "& .MuiInputBase-input": {
                                                  color: "white",
                                                  textAlign: "center"   // ✅ centra el texto del input, incluso en type="date"
                                                },
                                             margin:'.5rem 0'}}
                                        name="fecha_clon"
                                        type="date"
                                        //format="yyyy/MM/dd"
                                        value={fecha_clon}
                                        onChange={handleChange}
                                        inputProps={{ style:{color:'white'} }}
                                        InputLabelProps={{ style:{color:'white'} }}
                                />

                                <Button
                                  variant="contained"
                                  //color="inherit"
                                  color="primary"
                                            onClick={()=>{
                                                clonarVenta(valorComprobante);
                                                setShowModalMostrarClonar(false);
                                              }
                                            }
                                  sx={{ //display: "block", 
                                        display: "flex",          // 🔹 asegura layout en fila
                                        alignItems: "center",     // centra verticalmente
                                        margin: ".5rem 0", 
                                        width: 270, 
                                        mt: -0.5, 
                                        //color: "black", 
                                        fontWeight: "bold",
                                    }}
                                  startIcon={<TaskAltIcon />} 
                                >
                                  CLONAR
                                </Button>

                                <Button variant='contained' 
                                            //color='warning' 
                                            //size='small'
                                            onClick={()=>{
                                                  setShowModalMostrarClonar(false);
                                              }
                                            }
                                            sx={{display:'block',
                                                  margin:'.5rem 0',
                                                  width: 270, 
                                                  backgroundColor: 'rgba(30, 39, 46)', // Plomo 
                                                '&:hover': {
                                                      backgroundColor: 'rgba(30, 39, 46, 0.1)', // Color de fondo en hover: Plomo transparente
                                                    },                                                             
                                                  mt:-0.5}}
                                            >
                                            ESC - CERRAR
                                </Button>

                            </Dialog>
                    </>
                )
                :
                (   
                  <>
                  </>
                )
              }  

             { (showModalMostrarRecaudacion) ?
                (   <>
                            {/* Seccion para mostrar Dialog tipo Modal, para busqueda incremental cuentas */}
                            <Dialog
                              open={showModalMostrarRecaudacion}
                              onClose={() => setShowModalMostrarRecaudacion(false)}
                              maxWidth="md" // Valor predeterminado de 960px
                              //fullWidth
                              disableScrollLock // Evita que se modifique el overflow del body
                              PaperProps={{
                                style: {
                                  top: isSmallScreen ? "-30vh" : "0vh", // Ajusta la distancia desde arriba
                                  left: isSmallScreen ? "-25%" : "0%", // Centrado horizontal
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  marginTop: '10vh', // Ajusta este valor según tus necesidades
                                  background: 'rgba(30, 39, 46, 0.95)', // Plomo transparencia                              
                                  //background: 'rgba(16, 27, 61, 0.95)', // Azul transparencia                              
                                  color:'white',
                                  width: isSmallScreen ? ('50%') : ('30%'), // Ajusta este valor según tus necesidades
                                  //width: isSmallScreen ? ('100%') : ('40%'), // Ajusta este valor según tus necesidades
                                  //maxWidth: 'none' // Esto es importante para permitir que el valor de width funcione
                                },
                              }}
                            >
                            <DialogTitle>Datos - Recaudación</DialogTitle>

                                {/* Listado de recaudaciones */}
                                <Card sx={{ width: '90%', background: 'rgba(255,255,255,0.05)', color: 'white', mb: 2 }}>
                                  <CardContent>
                                    {recaudaciones.length > 0 ? (
                                      recaudaciones.map((item, index) => (
                                        <Box
                                          key={index}
                                          sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            mb: 1,
                                            borderBottom: '1px solid rgba(255,255,255,0.2)',
                                            pb: 0.5
                                          }}
                                        >
                                          <Typography variant="body1">{item.recaudacion}</Typography>
                                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                            S/ {Number(item.monto).toFixed(2)}
                                          </Typography>
                                        </Box>
                                      ))
                                    ) : (
                                      <Typography variant="body2" sx={{ opacity: 0.7 }}>No hay recaudaciones</Typography>
                                    )}
                                  </CardContent>
                                </Card>


                                <Button variant='contained' 
                                            //color='warning' 
                                            //size='small'
                                            onClick={()=>{
                                                  setShowModalMostrarRecaudacion(false);
                                              }
                                            }
                                            sx={{display:'block',
                                                  margin:'.5rem 0',
                                                  width: 270, 
                                                  backgroundColor: 'rgba(30, 39, 46)', // Plomo 
                                                '&:hover': {
                                                      backgroundColor: 'rgba(30, 39, 46, 0.1)', // Color de fondo en hover: Plomo transparente
                                                    },                                                             
                                                  mt:-0.5}}
                                            >
                                            ESC - CERRAR
                                </Button>

                            </Dialog>
                    </>
                )
                :
                (   
                  <>
                  </>
                )
              }  

  <Grid container spacing={0}
      direction={isSmallScreen ? 'column' : 'row'}
      //alignItems={isSmallScreen ? 'center' : 'center'}
      justifyContent={isSmallScreen ? 'center' : 'center'}
  >
      <Grid item xs={1.5} sm={1.5}>
          <Select
                labelId="periodo"
                //id={periodo_select.periodo}
                size='small'
                value={periodo_trabajo}
                name="periodo"
                sx={{display:'block',
                margin:'.1rem 0', color:"skyblue", fontSize: '13px' }}
                label="Periodo Cont"
                onChange={handleChange}
                >
                  <MenuItem value="default">SELECCIONA </MenuItem>
                {   
                    periodo_select.map(elemento => (
                    <MenuItem key={elemento.periodo} value={elemento.periodo}>
                      {elemento.periodo}
                    </MenuItem>)) 
                }
          </Select>
      </Grid>
      <Grid item xs={4} sm={4}>
          <Select
                labelId="contabilidad_select"
                //id={contabilidad_select.documento_id}
                size='small'
                value={contabilidad_trabajo}
                name="contabilidad"
                sx={{display:'block',
                margin:'.1rem 0', color:"white", fontSize: '13px' }}
                label="Contabilidad"
                onChange={handleChange}
                >
                  <MenuItem value="default">SELECCIONA </MenuItem>
                {   
                    contabilidad_select.map(elemento => (
                    <MenuItem key={elemento.documento_id} value={elemento.documento_id}>
                      {elemento.razon_social}
                    </MenuItem>)) 
                }
          </Select>
      </Grid>

      <Grid item xs={2} sm={2}>

      </Grid>

  </Grid>

  
  <DaySelector period={periodo_trabajo} onDaySelect={handleDayFilter} />
  
  <div>

  </div>
    
  <Grid container spacing={0}
      direction={isSmallScreen ? 'row' : 'row'}
      alignItems={isSmallScreen ? 'center' : 'left'}
      justifyContent={isSmallScreen ? 'left' : 'left'}
  >

        <Grid item xs={isSmallScreen ? 1.2 : 0.5} >
          <Tooltip title='AGREGAR NUEVO' >
            <IconButton color="primary" 
                            //style={{ padding: '0px'}}
                            style={{ padding: '0px', color: 'gray' }}
                            onClick={() => {
                              generaMovimiento();
                            }}
            >
                  <AddBoxIcon style={{ fontSize: '40px' }}/>
            </IconButton>
          </Tooltip>
        </Grid>

        <Grid item xs={isSmallScreen ? 1.2 : 0.5}  >    
          { (pVenta0104) ? (

            <Tooltip title='ELIMINAR MASIVO' >
            <IconButton color="warning" 
                            //style={{ padding: '0px'}}
                            style={{ padding: '0px', color: blueGrey[700] }}
                            onClick={() => {
                              handleDeleteOrigen(params.id_anfitrion,contabilidad_trabajo,periodo_trabajo,id_libro)
                            }}
            >
                  <FolderDeleteIcon style={{ fontSize: '40px' }}/>
            </IconButton>
            </Tooltip>

          )
          :
          (
            <div></div>
          )
          }

        </Grid>

        <Grid item xs={isSmallScreen ? 1.2 : 0.5} >
          <Tooltip title='EXPORTAR XLS' >
              <BotonExcelVentas registrosdet={registrosdet} 
              />
          </Tooltip>
        </Grid>

        <Grid item xs={isSmallScreen ? 1.2 : 0.5} >

        </Grid>

        <Grid item xs={isSmallScreen ? 1.2 : 0.5} >

        </Grid>

        <Grid item xs={isSmallScreen ? 1.2 : 0.5} >    

        </Grid>

        <Grid item xs={isSmallScreen ? 2 : 0.7}>    

        </Grid>
        
        {/* El componente del cuadro de diálogo */}
        {isDialogOpen && (
        
        <Grid item xs={isSmallScreen ? 12 : 8.8}>

        </Grid>

        )}

    <Grid item xs={isSmallScreen ? 12 : 8.3}>

    </Grid>


    <Grid item xs={isSmallScreen ? 12 : 12} >
        <TextField fullWidth variant="outlined" color="success" size="small"
                                    //label="FILTRAR"
                                    sx={{display:'block',
                                          margin:'.0rem 0'}}
                                    name="busqueda"
                                    placeholder='FILTRAR:  RUC   RAZON SOCIAL   COMPROBANTE'
                                    onChange={actualizaValorFiltro}
                                    inputProps={{ style:{color:'white'} }}
                                    InputProps={{
                                        startAdornment: (
                                          <InputAdornment position="start">
                                            <FindIcon />
                                          </InputAdornment>
                                        ),
                                        style:{color:'white'},
                                        // Estilo para el placeholder
                                        inputProps: { style: { fontSize: '14px', color: 'gray' } }                                         
                                    }}
        />
    </Grid>


  </Grid>

  <Datatable
      //title="Registro - Almacen"
      theme="solarized"
      columns={columnas}
      data={registrosdet}
      //selectableRows
      //selectableRowsSingle 
      //contextActions={contextActions}
      //actions={actions}
      onSelectedRowsChange={handleRowSelected}
      clearSelectedRows={toggleCleared}
      pagination
      paginationPerPage={15}
      paginationRowsPerPageOptions={[15, 50, 100]}

      selectableRowsComponent={Checkbox} // Pass the function only
      sortIcon={<ArrowDownward />}  
      dense={true}
  >
  </Datatable>

  </>
  );
}
