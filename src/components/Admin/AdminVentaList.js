import React from 'react';
import { useEffect, useState, useMemo, useCallback } from "react"
import { Card,CardContent,Box,Modal,Grid, Button,useMediaQuery,Select, MenuItem,Dialog,DialogContent,DialogTitle,Typography} from "@mui/material";
import { useNavigate,useParams } from "react-router-dom";
import DeleteIcon from '@mui/icons-material/Delete';
import FindIcon from '@mui/icons-material/FindInPage';
import AddBoxIcon from '@mui/icons-material/AddBox';
import { blueGrey } from '@mui/material/colors';
import ShopOutlinedIcon from '@mui/icons-material/ShopOutlined';
import Sunat01Icon from '../../assets/images/sunat0.png';
import Sunat02Icon from '../../assets/images/sunat1.png';
import SunatXml from '../../assets/images/xml02.png';
import SunatCdr from '../../assets/images/cdr01.png';
import SunatPdf from '../../assets/images/pdf02.png';
import logo from '../../Logo04small.png';
//import createPdfTicket from './AdminVentaPdf';
import DaySelector from "./AdminDias";
import { useDialog } from "./AdminConfirmDialogProvider";

//import PrintIcon from '@mui/icons-material/Print';
import FindInPageIcon from '@mui/icons-material/FindInPage';
import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';

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

import { AdminComprasColumnas } from './AdminColumnas';
import { AdminVentasColumnas } from './AdminColumnas';
import { AdminCajaColumnas } from './AdminColumnas';

import { saveAs } from 'file-saver';
import AsientoMensajeTotales from '../AsientoMensajeTotales';
import AsientoCobranzaCredito from '../AsientoCobranzaCredito';

export default function AdminVentaList() {
  //Control de useffect en retroceso de formularios
  //verificamos si es pantalla pequeña y arreglamos el grid de fechas
  const isSmallScreen = useMediaQuery('(max-width: 600px)');
  const { confirmDialog } = useDialog(); //unico dialogo

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
    setUpdateTrigger(Math.random());//experimento para actualizar el dom
  }
  
  // Agrega íconos al inicio de cada columna
  let columnasComunes;
  //Permisos Nivel 01 - Menus (toggleButton)
  const [permisos, setPermisos] = useState([]); //Menu
  const [permisoVentas, setPermisoVentas] = useState(false);
  const [permisoCompras, setPermisoCompras] = useState(false);
  const [permisoCaja, setPermisoCaja] = useState(false);
  
  //Permisos Nivel 02 - Comandos (Buttons)
  const [pVenta0101, setPVenta0101] = useState(false); //Nuevo (Casi libre)
  const [pVenta0102, setPVenta0102] = useState(false); //Modificar (Restringido)
  const [pVenta0103, setPVenta0103] = useState(false); //ELiminar (Restringido)
  const [pVenta0104, setPVenta0104] = useState(false); //Eliminar Masivo (Casi Nunca solo el administrador)

  const [pCompra0201, setPCompra0201] = useState(false); //Nuevo (Casi libre)
  const [pCompra0202, setPCompra0202] = useState(false); //Modificar (Restringido)
  const [pCompra0203, setPCompra0203] = useState(false); //Anular (Restringido)
  const [pCompra0204, setPCompra0204] = useState(false); //Eliminar (Casi Nunca solo el administrador)

  const [pCaja0301, setPCaja0301] = useState(false); //Nuevo (Casi libre)
  const [pCaja0302, setPCaja0302] = useState(false); //Modificar (Restringido)
  const [pCaja0303, setPCaja0303] = useState(false); //Anular (Restringido)
  const [pCaja0304, setPCaja0304] = useState(false); //Eliminar (Casi Nunca solo el administrador)

  
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

  /*const handleRecarga = () => {
    setUpdateTrigger(Math.random());//experimento
  };*/
  
  const handleSunat = async (sComprobante, elemento, sFirma) => {

    const result = await confirmDialog({
        title: "¿Estás seguro?",
        message: `Se enviara: "${sComprobante}".`,
        icon: "success", // success | error | info | warning
        confirmText: "ENVIAR",
        cancelText: "CANCELAR",
    });
    if (result.isConfirmed) {
      console.log("✅ Enviado:", sComprobante);
      // aquí va tu lógica de guardar en backend
    } else {
      console.log("❌ Cancelado");
      return; // Salimos si el usuario cancela
    }
    
    if (sFirma !=="" && sFirma !==null ) {
      swal2.fire({
        title: 'Sunat',
        text: 'Comprobante ya fue enviado a Sunat',
        icon: 'success', // success, error, warning, info, question
        confirmButtonText: 'Aceptar'
      });  
      return;
    }

    const [COD, SERIE, NUMERO] = sComprobante.split('-');

    console.log('Enviando a sunat:', sComprobante, elemento);

    try {
        // Enviar datos a la API
        const response = await axios.post(`${back_host}/ad_ventacpe`, {
            p_periodo: periodo_trabajo,
            p_id_usuario: params.id_anfitrion,
            p_documento_id: contabilidad_trabajo,
            p_r_cod: COD,
            p_r_serie: SERIE,
            p_r_numero: NUMERO,
            p_elemento: elemento
        });

        // Generar el mensaje HTML
        const mensajeHtml = armaMensajeHtml(response);

        // Mostrar SweetAlert con el mensaje generado
        swal2.fire({
            title: "Envio CPE Sunat",
            html: mensajeHtml,
            //showCancelButton: true, // Tercer botón
            //showDenyButton: true, // Segundo botón
            confirmButtonText: "Aceptar", // Primer botón
            //denyButtonText: "PDF 80mm", // Segundo botón
            //cancelButtonText: "PDF 58mm", // Tercer botón
            customClass: {
              actions: "vertical-buttons",
              popup: "swal2-align-left"
            },
            didOpen: () => {
              const actions = document.querySelector(".swal2-actions");
              if (actions) {
                  actions.style.display = "flex";
                  actions.style.flexDirection = "column";
                  actions.style.alignItems = "center";
                  actions.style.gap = "-10px"; // Espaciado entre botones
              }
              if (isSmallScreen) {
                  const popup = document.querySelector('.swal2-popup');
                  if (popup) {
                    popup.style.position = "absolute";
                    popup.style.left = "0"; // Pegado al borde izquierdo
                    popup.style.top = "5%"; // Ajusta la altura si es necesario
                    popup.style.transform = "none"; // Elimina el centrado
                  }              
              }
            }
        }).then((result) => {
          
          setUpdateTrigger(Math.random());//experimento para actualizar el dom
          /*if (result.isConfirmed) {
            //procesaPDF(sComprobante, elemento,'A4')
          } else if (result.isDenied) {
              procesaPDF(sComprobante, elemento,'80mm')
          } else if (result.isDismissed) {
              procesaPDF(sComprobante, elemento,'58mm')
          } */         
        });
    } catch (error) {
        console.error("Error en el envío a SUNAT:", error);
        swal2.fire({
            title: "Error",
            text: "Hubo un problema al enviar los datos a SUNAT.",
            icon: "error",
        });
    }
  };

  const armaMensajeHtml = (response) => {
    try {
        const xmlLink = response.data.ruta_xml;
        const cdrLink = response.data.ruta_cdr;
        const pdfLink = response.data.ruta_pdf;

        const xmlIcon = SunatXml;
        const cdrIcon = SunatCdr;
        const pdfIcon = SunatPdf;

        return `
            <div style="display: grid; grid-template-columns: repeat(1, 1fr); gap: 2px;">
                <div style="text-align: center;">
                    <p>
                        <a href="${xmlLink}" target="_blank" rel="noopener noreferrer">
                            <img src="${xmlIcon}" alt="Icono XML" style="cursor: pointer; width: 25%; height: auto;" />
                        </a>
                    </p>
                    <p>
                        <a href="${cdrLink}" target="_blank" rel="noopener noreferrer">
                            <img src="${cdrIcon}" alt="Icono CDR" style="cursor: pointer; width: 20%; height: auto;" />
                        </a>
                    </p>
                    <p>
                        <a href="${pdfLink}" target="_blank" rel="noopener noreferrer">
                            <img src="${pdfIcon}" alt="Icono PDF" style="cursor: pointer; width: 20%; height: auto;" />
                        </a>
                    </p>

                </div>
            </div>
        `;
    } catch (error) {
        console.error("Error al armar el mensaje HTML:", error);
        throw new Error("No se pudo generar el mensaje HTML.");
    }
  };

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
      navigate(`/ad_venta/${params.id_anfitrion}/${params.id_invitado}/${periodo_trabajo}/${contabilidad_trabajo}/${sComprobante}/view`);
    } else {
      navigate(`/ad_venta/${params.id_anfitrion}/${params.id_invitado}/${periodo_trabajo}/${contabilidad_trabajo}/${sComprobante}/-`);
    }    
  };
  const handleDelete = (comprobante,elemento) => {
    //Recuerda que el comprobante enviado es el comprobante_ref --> contiene el key del registro ;)
    confirmaEliminacion(params.id_anfitrion,contabilidad_trabajo,periodo_trabajo,comprobante,elemento);
  };
  const confirmaEliminacion = async(sAnfitrion,sDocumentoId,sPeriodo,sComprobante,sElemento)=>{
    await swal({
      title:"Eliminar Registro",
      text:"Seguro ?",
      icon:"warning",
      buttons:["No","Si"]
    }).then(respuesta=>{
        if (respuesta){
          //console.log(cod,serie,num,elem,item);
          eliminarRegistroSeleccionado(sAnfitrion,sDocumentoId,sPeriodo,sComprobante,sElemento);
          setToggleCleared(!toggleCleared);
          setRegistrosdet(registrosdet.filter(
                          registrosdet => registrosdet.comprobante !== sComprobante
                          ));
          setTimeout(() => { // Agrega una función para que se ejecute después del tiempo de espera
              setUpdateTrigger(Math.random());//experimento
          }, 200);
          
          /*alert(respuesta);
          if (respuesta === 1) {
            swal({
              text:"Venta se ha eliminado con exito",
              icon:"success",
              timer:"2000"
            });
          }
          if (respuesta === 2) {
            swal({
              text:"No se puede Eliminar Venta, solo la ultima",
              icon:"success",
              timer:"2000"
            });
          }*/

      }
    })
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
          swal({
            text:"Venta se ha eliminado con exito",
            icon:"success",
            timer:"2000"
          });
        } else {
          swal({
            text:"No se puede Eliminar Venta, solo la ultima",
            icon:"error",
            timer:"2000"
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
  
  const calcularSumatoriaMoneda = (columna, filtro) => {
    return registrosdet.reduce((acumulador, fila) => {
      // Verificar si el valor del campo de filtro coincide
      if (fila['r_moneda'] === filtro) {
        const valorColumna = fila[columna];
        // Verificar si el valor no es nulo y es numérico antes de sumarlo
        if (valorColumna !== null && !isNaN(valorColumna)) {
          return acumulador + parseFloat(valorColumna);
        }
      }
      return acumulador;
    }, 0).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  };  
  const calcularSumatoriaFilasMoneda = (filtro) => {
    return registrosdet.reduce((acumulador, fila) => {
      // Verificar si el valor del campo de filtro coincide
      if (fila['r_moneda'] === filtro) {
          return acumulador + 1;
      }
      return acumulador;
    }, 0);
  };  


  ///////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////
  const cargaRegistro = async (strHistorialValorVista,strHistorialPeriodo,strHistorialContabilidad, sDia) => {
    let response;
    console.log("cargaRegistro sDia: ", sDia);
    //Cargamos asientos correspondientes al id_usuario,contabilidad y periodo
    if (strHistorialValorVista==='' || strHistorialValorVista===undefined || strHistorialValorVista===null){
        response = await fetch(`${back_host}/ad_venta/${periodo_trabajo}/${params.id_anfitrion}/${contabilidad_trabajo}/${sDia}`);
    }
    else{
        //usamos los historiales
        response = await fetch(`${back_host}/ad_venta/${strHistorialPeriodo}/${params.id_anfitrion}/${strHistorialContabilidad}/${sDia}`);
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
          : e.target.value === 'compras' ? '008'
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

      /*setPCompra0201(true); //nuevo
      setPCompra0202(true); //modificar
      setPCompra0203(true); //eliminar
      setPCompra0204(true); //eliminar masivo

      setPCaja0301(true); //nuevo
      setPCaja0302(true); //modificar
      setPCaja0303(true); //eliminar
      setPCaja0304(true); //eliminar masivo*/

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
          /*tienePermiso = permisosData.some(permiso => permiso.id_comando === '02-01'); //Nuevo
          if (tienePermiso) {
            setPCompra0201(true);
          }
          
          tienePermiso = permisosData.some(permiso => permiso.id_comando === '02-02'); //Modificar
          if (tienePermiso) {
            setPCompra0202(true);
          }else {setPCompra0202(false);}

          tienePermiso = permisosData.some(permiso => permiso.id_comando === '02-03'); //Eliminar
          if (tienePermiso) {
            setPCompra0203(true);
          }else {setPCompra0203(false);}

          tienePermiso = permisosData.some(permiso => permiso.id_comando === '02-04'); //Eliminar Masivo
          if (tienePermiso) {
            setPCompra0204(true);
          }else {setPCompra0204(false);}
          ////////////////////////////////////////////////
          tienePermiso = permisosData.some(permiso => permiso.id_comando === '03-01'); //Nuevo
          if (tienePermiso) {
            setPCaja0301(true);
          }
          tienePermiso = permisosData.some(permiso => permiso.id_comando === '03-02'); //Modificar
          if (tienePermiso) {
            setPCaja0302(true);
          }else {setPCaja0302(false);}
          tienePermiso = permisosData.some(permiso => permiso.id_comando === '03-03'); //Eliminar
          if (tienePermiso) {
            setPCaja0303(true);
          }else {setPCaja0303(false);}
          tienePermiso = permisosData.some(permiso => permiso.id_comando === '03-04'); //Eliminar Masivo
          if (tienePermiso) {
            setPCaja0304(true);
          }else {setPCaja0304(false);}*/
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
      //if (st_valorVista === 'compras') {cargaPermisosMenuComando('02');}
      //if (st_valorVista === 'caja') {cargaPermisosMenuComando('03');}

      
      //fcuando carga x primera vez, sale vacio ... arreglar esto
      cargaRegistro(st_valorVista,periodo_trabajo,contabilidad_trabajo, diaSel);
    
      fetchTotalVentas();
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
    if (st_valorVista===null || st_valorVista===undefined || st_valorVista===''){
      columnasEspecificas = AdminVentasColumnas;
    }else{
      columnasEspecificas = 
          st_valorVista === 'ventas' ? AdminVentasColumnas
        : st_valorVista === 'compras' ? AdminComprasColumnas
        : AdminCajaColumnas;
    }

    //console.log('permisosComando pVenta0103 cargado: ',pVenta0103);
    //console.log('permisosComando pCompra0203 cargado: ',pCompra0203);
    cargaColumnasComunes();        
    //console.log('columnas comunes: ', columnasComunes);
    setColumnas([...columnasComunes, ...columnasEspecificas]);
    
    //cuando carga x primera vez, sale vacio ... arreglar esto
    cargaRegistro(st_valorVista,periodo_trabajo,contabilidad_trabajo, diaSel); //new cambio

    //Datos listos en caso de volver por aqui, para envio
    setDatosCarga(prevState => ({ ...prevState, id_anfitrion: params.id_anfitrion }));
    setDatosCarga(prevState => ({ ...prevState, periodo: st_periodo_trabajo }));
    setDatosCarga(prevState => ({ ...prevState, documento_id: st_contabilidad_trabajo }));
    setDatosCarga(prevState => ({ ...prevState, id_libro: st_id_libro }));
    setDatosCarga(prevState => ({ ...prevState, id_invitado: params.id_invitado }));
    
  },[permisosComando, pVenta0101, valorVista, diaSel]) //Solo cuando este completo estado


  //////////////////////////////////////////////////////////
  const cargaColumnasComunes = () =>{
    //Verificar que el resto de permisos de otros libros siempre esten FALSE
    //Solo el libro en cuestion, validara TRUE OR FALSE

    columnasComunes = [
      {
        name: '',
        width: '40px',
        cell: (row) => (
          (pVenta0103 || pCompra0203 || pCaja0303) && (row.r_cod !== 'NV') ? 
          (
            <img
              src={Sunat01Icon} // Aquí usas la imagen importada
              onClick={() => handleSunat(row.comprobante_ref,row.elemento,row.r_vfirmado)}
              alt="Icono Sunat01"
              style={{
                cursor: 'pointer',
                //opacity: 0.9, // Ajusta la transparencia
                filter: (row.r_vfirmado == null) ? 'grayscale(0.8)' : 'grayscale(0)', // Aplica escala de grises
                transition: 'color 0.3s ease',
                width: '24px',
                height: '24px',  // Puedes ajustar el tamaño según necesites
              }}
            />
          ) : null
        ),
        allowOverflow: true,
        button: true,
      },
      {
        name: '',
        width: '40px',
        cell: (row) => (
          (pVenta0102 || pCompra0202 || pCaja0302) && (row.r_vfirmado == null) ?
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
        width: '40px',
        cell: (row) => (
          (pVenta0103 || pCompra0203 || pCaja0303) && (row.r_vfirmado == null) ?
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
            <ViewAgendaIcon
              onClick={() => {
                  //alert(diaSel);
                  clonarVenta(row.comprobante_ref);
                  }
                }
              style={{
                cursor: 'pointer',
                color: 'skyblue',
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
      setPermisoCompras(true);
      setPermisoCaja(true);
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
          tienePermiso = permisosData.some(permiso => permiso.id_menu === '02');
          if (tienePermiso) {
            setPermisoCompras(true);
          }
          tienePermiso = permisosData.some(permiso => permiso.id_menu === '03');
          if (tienePermiso) {
            setPermisoCaja(true);
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
  const generaVenta = async () => {
    try {
      //dia
      const response = await axios.post(`${back_host}/ad_venta`, {
        id_anfitrion: params.id_anfitrion,
        documento_id: params.documento_id,
        periodo: periodo_trabajo,
        id_invitado: params.id_invitado,
        fecha: obtenerFecha(periodo_trabajo,true,diaSel),
      });
      

      if (response.data.success) {
        const sComprobanteAbierto = 'NP-0001-' + response.data.r_numero+'-1'; //aumentamos elemento
        const sComprobanteAbiertoRef = '-'; //modo directo sin ref
        //enviamos la edicion del registro abierto
        navigate(`/ad_venta/${params.id_anfitrion}/${params.id_invitado}/${periodo_trabajo}/${contabilidad_trabajo}/${sComprobanteAbierto}/${sComprobanteAbiertoRef}`);
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
      const response = await axios.post(`${back_host}/ad_ventaclon`, {
        id_anfitrion: params.id_anfitrion,
        documento_id: params.documento_id,
        periodo: periodo_trabajo,
        id_invitado: params.id_invitado,
        fecha: obtenerFecha(periodo_trabajo,true,diaSel),
        r_cod: COD,
        r_serie: SERIE,
        r_numero: NUMERO
      });
      

      if (response.data.success) {
        const sComprobanteAbierto = 'NP-0001-' + response.data.r_numero+'-1';//aumentamos elemento
        const sComprobanteAbiertoRef = sComprobante; //modo clonar con ref
        //enviamos la edicion del registro abierto
        navigate(`/ad_venta/${params.id_anfitrion}/${params.id_invitado}/${periodo_trabajo}/${contabilidad_trabajo}/${sComprobanteAbierto}/${sComprobanteAbiertoRef}`);
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
    //console.log('sDia recepcionado: ',sDia);
    // Obtener el mes y año del parámetro "periodo" en formato "AAAA-MM"
    const [year, month] = periodo.split('-').map(Number);
  
    // Obtener la fecha actual
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth() + 1; // Los meses en JavaScript son base 0, así que sumamos 1
  
    // Verificar si el mes del periodo es igual al mes actual
    //if (mesActual === month) {
      if (sDia!==''){
          //restamos 1 al mes, pinche manejo de fecha js
        const fechaSeleccionada = new Date(year, month-1, sDia); // Al pasar 0 en el día, se obtiene el último día del mes
        return formatearFecha(fechaSeleccionada,bformatoBD,sDia); // Retorna la fecha actual formateada
      }else{
        return formatearFecha(fechaActual,bformatoBD,sDia); // Retorna la fecha actual formateada
      }
    //} else {
    //  // Retornar el último día del mes del periodo
    //  const ultimoDiaMes = new Date(year, month, 0); // Al pasar 0 en el día, se obtiene el último día del mes
    //  return formatearFecha(ultimoDiaMes,bformatoBD);
    //}
  };
  // Función para formatear la fecha en DD/MM/YYYY
  const formatearFecha = (fecha,bformatoBD,sDia) => {
    let dia;
    if (sDia!==''){
      dia = sDia;
    }
    else {
      dia = String(fecha.getDate()).padStart(2, '0');
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
const fetchTotalVentas = async () => {
    try {
      const res = await axios.get(`${back_host}/ad_ventatotal/${periodo_trabajo}/${params.id_anfitrion}/${params.id_invitado}/${diaSel}`);
      console.log('Tottales ventas: ', res.data);
      setTotalVentas(res.data.total);
      setIsSuper(res.data.super);
    } catch (error) {
      console.error('Error al obtener total de ventas', error);
    }
}; 
const [recaudaciones, setRecaudaciones] = useState([]);
const [showModalMostrarRecaudacion, setShowModalMostrarRecaudacion] = useState(false);
const handleClickTotal = (periodo,id_anfitrion,documento_id,dia) => {
  setShowModalMostrarRecaudacion(true);
  axios.get(`${back_host}/ad_ventarecaudacion/${periodo}/${id_anfitrion}/${documento_id}/${dia}`)
          .then(res => {
            if (res.data.success) {
              setRecaudaciones(res.data.data);
              console.log('Recaudaciones: ', res.data.data);
            }
          })
          .catch(err => console.error(err));
};


 return (
  <>

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
                                        <DialogTitle>Datos - Emision</DialogTitle>

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
  <div>
    <Modal
      open={abierto}
      onClose={abrirCerrarModal}
      style={modalStyles}
      >
      <AsientoCobranzaCredito datos={datosPopUp} onClose={handleCerrar} id_anfitrion={params.id_anfitrion} documento_id={contabilidad_trabajo} periodo_trabajo={periodo_trabajo} contabilidad_nombre={contabilidad_nombre}/>
    </Modal>
  </div>

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
      {(String(params.id_anfitrion) === String(params.id_invitado) || isSuper) && (
        <Button variant="contained" 
                color="primary" 
                onClick={() => handleClickTotal(periodo_trabajo, params.id_anfitrion, contabilidad_trabajo, diaSel)}
                fullWidth
        >
          {`Total: S/ ${parseFloat(totalVentas).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`}
        </Button>
      )}

      </Grid>

  </Grid>

  
  <DaySelector period={periodo_trabajo} onDaySelect={handleDayFilter} />
  
  <div>
  <ToggleButtonGroup
    color="success"
    value={valorVista}
    exclusive
    onChange={actualizaValorVista}
    aria-label="Platform"
  >
    { permisoVentas ?
      (    
      <ToggleButton value="ventas"
                    style={{
                      backgroundColor: valorVista === 'ventas' ? 'gray' : 'transparent',
                      color: valorVista === 'ventas' ? "orange" : "gray"
                    }}

      >Ventas</ToggleButton>
      ):(
      <span></span>
      )
    }

    { permisoCompras ?
      (    
    <ToggleButton value="compras"
                  style={{
                    backgroundColor: valorVista === 'compras' ? 'lightblue' : 'transparent',
                    color: valorVista === 'compras' ? 'orange' : 'gray',
                    borderRadius: '4px', // Puedes ajustar este valor según la cantidad de redondeo que desees                    
                  }}
    >Compras</ToggleButton>
    ):(
      <span></span>
      )
    }

    { permisoCaja ?
    (
    <ToggleButton value="caja"
                  style={{
                    backgroundColor: valorVista === 'caja' ? 'lightblue' : 'transparent',
                    color: valorVista === 'caja' ? 'orange' : 'gray',
                    borderRadius: '4px', // Puedes ajustar este valor según la cantidad de redondeo que desees                                        
                  }}
    >Caja</ToggleButton>
    ):(
      <span></span>
      )
    }


  </ToggleButtonGroup>      
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
                              generaVenta();
                            }}
            >
                  <AddBoxIcon style={{ fontSize: '40px' }}/>
            </IconButton>
          </Tooltip>
        </Grid>

        <Grid item xs={isSmallScreen ? 1.2 : 0.5}  >    
          { (pVenta0104 || pCompra0204 || pCaja0304 ) ? (

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
      //title="Registro - Pedidos"
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
