import React from 'react';
import { useEffect, useState, useMemo, useCallback } from "react"
import { Box, Modal, useMediaQuery } from "@mui/material";
import { useNavigate,useParams,useLocation } from "react-router-dom";
import DeleteIcon from '@mui/icons-material/Delete';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
//import createPdfTicket from './AdminVentaPdf';
import { useDialog } from "../../AdminConfirmDialogProvider";

//import PrintIcon from '@mui/icons-material/Print';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import CopyAllIcon from '@mui/icons-material/CopyAll';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import FolderDeleteIcon from '@mui/icons-material/FolderDelete';          

import IconButton from '@mui/material/IconButton';
import swal2 from 'sweetalert2'
import Datatable from 'react-data-table-component';
import Checkbox from '@mui/material/Checkbox';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import SummarizeIcon from '@mui/icons-material/Summarize';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SunatResumenIcon from '../../../../assets/images/sunat0.png';
import '../../../../App.css';
import 'styled-components';
//import axios from 'axios';

//import { utils, writeFile } from 'xlsx';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import axios from 'axios';

import { useAuth0 } from '@auth0/auth0-react'; //new para cargar permisos luego de verificar registro en bd
import BotonExcelGeneral from '../../../BotonExcelGeneral';

import { AdminCajaColumnas } from '../../AdminColumnas';

import AsientoCobranzaCredito from '../../../AsientoCobranzaCredito';
import AdminSunatIcon from '../../AdminSunatIcon';
import AdminSunatGreIcon from '../../AdminSunatGreIcon';
import { ensureAdminVentaTableTheme } from '../common/adminVentaTableTheme';
import AdminVentaCloneDialog from './AdminVentaCloneDialog';
import AdminVentaRecaudacionDialog from './AdminVentaRecaudacionDialog';
import palette from '../../../../theme/palette';
import AdminVentaListToolbar from './AdminVentaListToolbar';
import { esVentaAnulada, esVentaPendienteSunat, filtrarVentas } from './adminVentaListFilters';
import { crearColumnasVenta, AdminVentaTableDetails, ventaDesktopTableStyles } from './AdminVentaTableColumns';
import AdminVentaDetalleDialog from './AdminVentaDetalleDialog';

const contentRadius = palette.radius.content;

const listContentSx = {
  width: '100%',
  maxWidth: { xs: '100%', lg: 1280, xl: 1440 },
  boxSizing: 'border-box',
  minWidth: 0,
  mx: 'auto',
  p: 0,
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: 0,
};

const toolbarIconSx = {
  width: 38,
  height: 38,
  borderRadius: contentRadius,
  backgroundColor: palette.chip,
  border: `1px solid ${palette.border}`,
  color: palette.muted,
  p: 0,
  '&:hover': {
    backgroundColor: palette.surfaceAlt,
    borderColor: palette.border,
    color: palette.text,
  },
};

const rowActionIconSx = {
  color: palette.muted,
  cursor: 'pointer',
  fontSize: 25,
  display: 'block',
  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.22))',
  transition: 'color 0.18s ease, filter 0.18s ease, transform 0.18s ease',
  '&:hover': {
    color: palette.accent,
    filter: `drop-shadow(0 0 6px ${palette.accentSoft})`,
    transform: 'translateY(-1px) scale(1.03)',
  },
};

const cloneActionIconSx = {
  color: palette.muted,
  cursor: 'pointer',
  fontSize: 23,
  display: 'block',
  transition: 'color 0.18s ease, transform 0.18s ease',
  '&:hover': {
    color: palette.text,
    transform: 'translateY(-1px)',
  },
};

// Accion SUNAT diaria: usa el logo institucional y un indicador pequeño de resumen.
const sunatResumenIconSx = {
  position: 'relative',
  width: 28,
  height: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '& img': {
    width: 22,
    height: 22,
    objectFit: 'contain',
    display: 'block',
  },
  '& .resumen-badge': {
    position: 'absolute',
    right: -2,
    bottom: -1,
    width: 13,
    height: 13,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
    border: `1px solid ${palette.accent}`,
    color: palette.accent,
  },
  '& .resumen-badge.ok': {
    borderColor: palette.success,
    color: palette.success,
  },
  '& .resumen-badge.warn': {
    borderColor: palette.warning,
    color: palette.warning,
  },
};

const sweetAlertDarkOptions = {
  background: palette.surface,
  color: palette.text,
  confirmButtonColor: palette.accent,
  cancelButtonColor: palette.chip,
  buttonsStyling: true,
};

// Superficies de la tabla. Antes eran fijas (#1c252c / #202a32) y dejaban una
// caja oscura dentro de la pagina cuando se elegia el tema claro.
const listCardBg = palette.surface;

export default function AdminVentaList({ panoramicMode = false }) {
  //Control de useffect en retroceso de formularios
  //verificamos si es pantalla pequeÃ±a y arreglamos el grid de fechas
  const isSmallScreen = useMediaQuery('(max-width: 600px)');
  const { confirmDialog } = useDialog(); //unico dialogo
  const [fecha_clon, setFechaClon] = useState("");

  const location = useLocation();

  ensureAdminVentaTableTheme();

  //Seccion carga de archivos
  ////////////////////////////////////////////////////////////////////////////

  //const back_host = process.env.BACK_HOST || "http://localhost:4000";
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
  //experimento
  const [updateTrigger, setUpdateTrigger] = useState({});

  const [selectedRows, setSelectedRows] = useState([]);
  const [toggleCleared, setToggleCleared] = useState(false);
	//const [data, setData] = useState(tableDataItems);
  const [tabladet,setTabladet] = useState([]);  //Copia de los registros: Para tratamiento de filtrado
  const [ventaDetalle, setVentaDetalle] = useState(null);
  const [navegadorMovil, setNavegadorMovil] = useState(false);
  const [valorBusqueda, setValorBusqueda] = useState(""); //txt: rico filtrado
  const [filtroEstado, setFiltroEstado] = useState('');
  const registrosdet = useMemo(() => filtrarVentas(tabladet, valorBusqueda, filtroEstado), [tabladet, valorBusqueda, filtroEstado]);
  const resumenEstados = useMemo(() => ({
    pendientes: tabladet.filter(esVentaPendienteSunat).length,
    anulados: tabladet.filter(esVentaAnulada).length,
  }), [tabladet]);
  const [valorVista, setValorVista] = useState("ventas");
  const [id_libro, setValorLibro] = useState("014");
  const [permisosComando, setPermisosComando] = useState([]); //MenuComandos
  const {user, isAuthenticated } = useAuth0();
  
  //const [columnas, setColumnas] = useState([]); //eliminado por new version

  const [periodo_trabajo, setPeriodoTrabajo] = useState("");
  const [periodo_select,setPeriodosSelect] = useState([]);
  
  const [contabilidad_trabajo, setContabilidadTrabajo] = useState("");
  const [contabilidad_nombre, setContabilidadNombre] = useState("");
  const [contabilidad_select,setContabilidadesSelect] = useState([]);
  const [valorComprobante, setValorComprobante] = useState("");

  const [datosPopUp,setDatosPopUp] = useState([]);
  const [colaResumenDia, setColaResumenDia] = useState([]);
  let [diaSel, setDiaSel] = useState("*");

  const handleChange = e => {
    //Para todos los demas casos ;)
    if (e.target.name==="periodo"){
      console.log('cambiando en periodo');
      setPeriodoTrabajo(e.target.value);
      //En cada cambio, actualizar ultimo periodo seleccionado 
      sessionStorage.setItem('periodo_trabajo', e.target.value);
      //console.log('handleChange periodo_trabajo', e.target.value);

      setDiaSel("*"); //todo cambio de mes, evita dias incorrectos en meses 30,31,28,29
    }
    if (e.target.name==="contabilidad"){
      console.log('cambiando en contabilidad');
      setContabilidadTrabajo(e.target.value);
      //En cada cambio, actualizar ultima contabilidad seleccionada
      sessionStorage.setItem('contabilidad_trabajo', e.target.value);
      
      //filtramos su nombre para historial
      const opcionSeleccionada = contabilidad_select.find(opcion => opcion.documento_id === e.target.value).razon_social;
      sessionStorage.setItem('contabilidad_nombre', opcionSeleccionada);
      
      //debemos cambiar navigate, pra actualizar el dom
      setUpdateTrigger(Math.random());//experimento para actualizar el dom
      navigate(`/ad_venta/${params.id_anfitrion}/${params.id_invitado}/${periodo_trabajo}/${e.target.value}`);
    }
    if (e.target.name==="fecha_clon"){
      setFechaClon(e.target.value);
    }
    
    setUpdateTrigger(Math.random());//experimento para actualizar el dom
  }
  
  // Agrega Ã­conos al inicio de cada columna
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
    //Recuerda que el comprobante enviado es el comprobante_key --> contiene el key del registro ;)
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
          console.log("âœ… Eliminado:", sComprobante);
          eliminarRegistroSeleccionado(sAnfitrion,sDocumentoId,sPeriodo,sComprobante,sElemento);
          setToggleCleared(!toggleCleared);
          setTabladet((rows) => rows.filter((row) => row.comprobante_key !== sComprobante));
          setTimeout(() => { // Agrega una funciÃ³n para que se ejecute despuÃ©s del tiempo de espera
              setUpdateTrigger(Math.random());//experimento
          }, 200);
    } else {
      console.log("âŒ Cancelado");
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
            title: "Eliminacion Denegada, solo ultimo del Periodo",
            icon: "error",
            confirmText: "ACEPTAR"
          });
          //console.log("No se pudo eliminar la venta, no es la ultima: " + response.data.message);
        }
    } catch (error) {
        //console.error("Error eliminando venta:", error);
          confirmDialog({
            title: "No se puede Eliminar Venta",
            icon: "error",
            confirmText: "ACEPTAR"
          });
        
    }
};

  const handleDeleteOrigen = async (sAnfitrion,sDocumentoId,sPeriodo,sLibro) => {
    const { value: selectedOrigen } = await swal2.fire({
      ...sweetAlertDarkOptions,
      title: 'Eliminar registros',
      //text: 'Selecciona el origen para la eliminaciÃ³n masiva:',
      input: 'select',
      icon: 'warning',
      //color: 'orange',
      inputOptions: {
        EXCEL: 'EXCEL',
        SIRE: 'SIRE',
        MANUAL: 'MANUAL',
        // Agrega las opciones segÃºn los valores de "origen" de tu tabla
      },
      inputAttributes: {
        style: `background:${palette.bg}; color:${palette.text}; border:1px solid ${palette.border}; border-radius:8px; height:40px; font-size:13px;`,
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
      // AquÃ­ puedes realizar la lÃ³gica para eliminar registros masivamente con el origen seleccionado
      //console.log('Eliminar registros con origen:', selectedOrigen);
      await fetch(`${back_host}/asientomasivo/${sAnfitrion}/${sDocumentoId}/${sPeriodo}/${sLibro}/${selectedOrigen}`, {
        method:"DELETE"
      });

      setTimeout(() => { // Agrega una funciÃ³n para que se ejecute despuÃ©s del tiempo de espera
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
        // Verificar si el valor no es nulo y es numÃ©rico antes de sumarlo
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
    setTabladet(data); //Copia para tratamiento de filtrado
  }
  //////////////////////////////////////
  
 
  const navigate = useNavigate();
  //Para recibir parametros desde afuera
  const params = useParams();
  useEffect(() => { setVentaDetalle(null); }, [periodo_trabajo, contabilidad_trabajo, params.id_anfitrion]);

  const estadosRdiAbiertos = useMemo(() => (
    ["PENDIENTE", "GENERADO", "ENVIADO", "INCIERTO", "ERROR"]
  ), []);

  const boletasPendientesResumen = useMemo(() => {
    if (!diaSel || diaSel === "*") return 0;

    return tabladet.filter((row) => (
      String(row.r_cod || "") === "03" &&
      !row.numero_rdi &&
      !row.r_vfirmado
    )).length;
  }, [diaSel, tabladet]);

  const resumenesAbiertosDia = useMemo(() => (
    colaResumenDia.filter((item) => estadosRdiAbiertos.includes(String(item.estado || "").toUpperCase()))
  ), [colaResumenDia, estadosRdiAbiertos]);

  const totalPendienteResumenDia = boletasPendientesResumen + resumenesAbiertosDia.length;
  const resumenDiaOk = Boolean(diaSel && diaSel !== "*") && totalPendienteResumenDia === 0;

  const cargarColaResumenDia = useCallback(async () => {
    if (!periodo_trabajo || !contabilidad_trabajo || contabilidad_trabajo === "default" || contabilidad_trabajo === "-" || !diaSel || diaSel === "*") {
      setColaResumenDia([]);
      return [];
    }

    const fechaResumen = `${periodo_trabajo}-${String(diaSel).padStart(2, "0")}`;
    try {
      const response = await axios.get(`${back_host}/ad_ventacpe/resumen/${periodo_trabajo}/${params.id_anfitrion}/${contabilidad_trabajo}`, {
        params: { origen: "VENTA_COMERCIAL" },
      });
      const data = response.data?.data || [];
      const resumenesDia = data.filter((item) => String(item.fecha || "").substring(0, 10) === fechaResumen);
      setColaResumenDia(resumenesDia);
      return resumenesDia;
    } catch (error) {
      console.log("No se pudo cargar cola RDI:", error);
      setColaResumenDia([]);
      return [];
    }
  }, [back_host, contabilidad_trabajo, diaSel, params.id_anfitrion, periodo_trabajo]);

  const construirMensajeColaResumen = (fechaResumen, resumenesDia, boletasSinResumen = boletasPendientesResumen) => {
    const abiertos = resumenesDia.filter((item) => estadosRdiAbiertos.includes(String(item.estado || "").toUpperCase()));
    const cerrados = resumenesDia.filter((item) => !estadosRdiAbiertos.includes(String(item.estado || "").toUpperCase()));
    const lineasAbiertos = abiertos.map((item, index) => (
      `${index + 1}. ${item.numero_rdi} - ${item.estado || "PENDIENTE"} - ${item.cantidad_boletas || 0} boletas${item.ticket ? ` - Ticket: ${item.ticket}` : ""}`
    ));

    return [
      contabilidad_nombre || contabilidad_trabajo,
      `Fecha: ${fechaResumen}`,
      boletasSinResumen > 0 ? `Boletas nuevas sin RDI: ${boletasSinResumen}` : "Boletas nuevas sin RDI: 0",
      abiertos.length > 0 ? `Resumenes abiertos en cola: ${abiertos.length}` : "Resumenes abiertos en cola: 0",
      ...lineasAbiertos,
      cerrados.length > 0 ? `Resumenes cerrados del dia: ${cerrados.length}` : null,
    ].filter(Boolean).join("\n");
  };

  const actualizaValorFiltro = e => {
    setValorBusqueda(e.target.value);
  }
  
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

  const inicializarPantalla = async ()=>{
    /////////////////////////////////
    //PERIODO
    const historialPeriodo = sessionStorage.getItem("periodo_trabajo") || params.periodo;
    const periodo = await cargaPeriodosAnfitrion(historialPeriodo);

    /////////////////////////////////
    //CONTABILIDAD
    const historialContabilidad = sessionStorage.getItem("contabilidad_trabajo") || params.documento_id;
    const historialNombre = sessionStorage.getItem("contabilidad_nombre");
    const contabilidad = await cargaContabilidadesAnfitrion(historialContabilidad,historialNombre);

    /////////////////////////////////
    //PERMISOS
    if( isAuthenticated && user && user.email){
        await cargaPermisosMenu();
        cargaPermisosMenuComando('20'); //Por default, la 1era vez
    }

    /////////////////////////////////
    //NAVEGATE
    if(params.documento_id === "-"){
        navigate(
            `/ad_venta/${
                params.id_anfitrion
            }/${
                params.id_invitado
            }/${
                periodo
            }/${
                contabilidad.documento
            }`,
            {
                replace:true
            }
        );
        return;
    }
  };
  //////////////////////////////////////////////////////////////////////////////////////////////////
  //Inicializa estados y pantalla
  useEffect(()=>{
    
    if(!isAuthenticated) return;
    inicializarPantalla();
    
  },[isAuthenticated]);
  
  //Solo carga registros
  useEffect(()=>{
    if(!periodo_trabajo || !contabilidad_trabajo){
        return;
    }

    cargaRegistro("ventas",periodo_trabajo,contabilidad_trabajo,diaSel);

    const controller = new AbortController();
    fetchTotalVentas(controller.signal);
    return () => controller.abort();

  },[periodo_trabajo,contabilidad_trabajo,valorVista,diaSel,updateTrigger]);

  useEffect(()=>{
    cargarColaResumenDia();
  },[cargarColaResumenDia, updateTrigger]);

  //Solo sincroniza datos
  useEffect(()=>{

    setDatosCarga({
        id_anfitrion:params.id_anfitrion,
        id_invitado:params.id_invitado,
        periodo:periodo_trabajo,
        documento_id:contabilidad_trabajo,
        id_libro:id_libro
    });

  },[periodo_trabajo,contabilidad_trabajo,id_libro]);
  //////////////////////////////////////////////////////////////////////////////////////////////////

  const obtenerColumnasComunes = () =>{
    //Verificar que el resto de permisos de otros libros siempre esten FALSE
    //Solo el libro en cuestion, validara TRUE OR FALSE

    return [
      {
        name: '',
        width: isSmallScreen ?  '36px' : '30px',
        cell: (row) => (
          (pVenta0103) && (row.r_cod !== 'NV') ? 
          (
            <AdminSunatIcon
              comprobante_key={row.comprobante_key}
              comprobante={row.comprobante}
              cdr_pendiente={row.cdr_pendiente} //new
              elemento={row.elemento}
              firma={row.r_vfirmado}
              cdr_descripcion={row.cdr_descripcion}
              numeroRdi={row.numero_rdi}
              documentoId={params.documento_id}
              periodoTrabajo={periodo_trabajo}
              idAnfitrion={params.id_anfitrion}
              contabilidadTrabajo={contabilidad_trabajo}
              backHost={back_host}
              onRefresh={() => setUpdateTrigger(Math.random())} // âœ… refresca al cerrar el modal
              size={26}
              cdr_nivel={row.cdr_nivel} //new
            />
          ) : null
        ),
        allowOverflow: true,
        button: true,
      },
      {
        name: '',
        width: isSmallScreen ?  '38px' : '32px',
        cell: (row) => (
          (pVenta0102) && (row.r_vfirmado == null) ?
          (
            <DriveFileRenameOutlineIcon
              onClick={() => handleUpdate(row.comprobante_key,false)}
              style={{
                cursor: 'pointer',
                color: 'skyblue',
                transition: 'color 0.3s ease',
              }}
            />
          )  
          : 
          (
            <Tooltip title="Ver contenido">
              <SearchRoundedIcon
                sx={rowActionIconSx}
                onClick={() => handleUpdate(row.comprobante_key,true)}
              />
            </Tooltip>

          )
        ),
        allowOverflow: true,
        button: true,
      },
      {
        name: '',
        width: isSmallScreen ?  '36px' : '30px',
        cell: (row) => (
          (pVenta0103) && (row.r_vfirmado == null) ?
          (
            <DeleteIcon
              onClick={() => handleDelete(row.comprobante_key, row.elemento)}
              style={{
                cursor: 'pointer',
                color: 'orange',
                transition: 'color 0.3s ease',
              }}
            />
          ) 
          : 
          (
            <Tooltip title="Clonar venta">
              <ContentCopyIcon
                sx={cloneActionIconSx}
                onClick={() => {
                  setShowModalMostrarClonar(true);
                  setValorComprobante(row.comprobante_key);
                  //clonarVenta(row.comprobante_key);
                  }
                }
              />
            </Tooltip>

          )

        ),
        allowOverflow: true,
        button: true,
      },
      {
        name: '',
        width: isSmallScreen ?  '36px' : '30px',
        cell: (row) => (
          (pVenta0103) && (row.r_cod !== 'NV') ? 
          (
            <AdminSunatGreIcon
              comprobante_gre={row.gre_ref}
              comprobante_venta={row.comprobante}
              destinatario_venta={{'destinatario_ruc_dni':row.r_documento_id, 'destinatario_razon_social':row.r_razon_social}}
              firma={row.gre_vfirmado}
              documentoId={params.documento_id}
              periodoTrabajo={periodo_trabajo}
              idAnfitrion={params.id_anfitrion}
              idInvitado={params.id_invitado} //new para GRE, identifica serie autorizada 
              contabilidadTrabajo={contabilidad_trabajo}
              backHost={back_host}
              onRefresh={() => setUpdateTrigger(Math.random())} // âœ… refresca al cerrar el modal
              size={26}
            />
          ) 
          : 
          ( //Auxiliamos con clonar para pedidos, en caso modo simple
          (pVenta0103) && (row.r_cod === 'NV') ? 
          (
            <Tooltip title="Clonar venta">
              <ContentCopyIcon
                sx={cloneActionIconSx}
                onClick={() => {
                  setShowModalMostrarClonar(true);
                  setValorComprobante(row.comprobante_key);
                  //clonarVenta(row.comprobante_key);
                  }
                }
              />
            </Tooltip>
          )
          : null
          )
        ),
        allowOverflow: true,
        button: true,
      },

    ];
  }

  const columnas = useMemo(() => {
    const comunes = obtenerColumnasComunes();
    return crearColumnasVenta({
      onVer: (row) => handleUpdate(row.comprobante_key, true),
      onDetalle: setVentaDetalle,
      renderSunat: (row) => comunes[0].cell(row),
      renderAcciones: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, '& .MuiSvgIcon-root': { fontSize: 22 } }}>
          {comunes.slice(1).map((columna) => columna.cell(row)).filter(Boolean).map((icono, index) => (
            <Box key={index} sx={{
              display: 'grid', placeItems: 'center', width: 38, height: 38, flexShrink: 0,
              borderRadius: palette.radius.control, border: `1px solid ${palette.borderSoft}`,
              backgroundColor: palette.surfaceAlt, color: palette.accent,
              transition: 'background-color 140ms ease, border-color 140ms ease, transform 140ms ease',
              '&:hover': { backgroundColor: palette.accentSoft, borderColor: palette.accent, transform: 'scale(1.08)' },
              '&:active': { transform: 'scale(0.92)' },
            }}>{icono}</Box>
          ))}
        </Box>
      ),
    });
  }, [
    isSmallScreen,
    pVenta0101,
    pVenta0102,
    pVenta0103,
    permisosComando,
    diaSel,
    periodo_trabajo,
    contabilidad_trabajo,
    params.id_anfitrion,
    params.id_invitado
  ]);  

  const cargaPeriodosAnfitrion = async (strHistorialPeriodo) => {
      try {
        const { data } = await axios.get(
          `${back_host}/usuario/periodos/${params.id_anfitrion}`
        );
    
        setPeriodosSelect(data);
    
        let periodo;
    
        if (!strHistorialPeriodo) {
          if (data.length > 0) {
            periodo = data[0].periodo;
          }
        } else {
          periodo = strHistorialPeriodo;
        }
    
        if (periodo) {
          setPeriodoTrabajo(periodo);
          sessionStorage.setItem("periodo_trabajo", periodo);
        }
    
        return periodo; // <-- devuelve el valor
      } catch (error) {
        console.error(error);
        return null;
      }
    };

  const cargaContabilidadesAnfitrion = async (historialContabilidad,historialNombre)=>{
      try{
  
          const {data} = await axios.get(
              `${back_host}/usuario/contabilidades/${params.id_anfitrion}/${params.id_invitado}`
          );
  
          setContabilidadesSelect(data);
  
          let documento;
          let nombre;
  
          if(!historialContabilidad){
                if(data.length){
                    documento = data[0].documento_id;
                    nombre = data[0].razon_social;
                }
          }else{
              documento = historialContabilidad;
              nombre = historialNombre;
          }
  
          if(documento){
              setContabilidadTrabajo(documento);
              setContabilidadNombre(nombre);
              sessionStorage.setItem("contabilidad_trabajo",documento);
          }
  
          return {
              documento,
              nombre
          };
      }
      catch(error){
          console.log(error);
          return null;
      }
  };

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
    background:'transparent',
    border:0,
    padding:'16px 32px 24px',
    width:'100%',
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

  const enviarResumenBoletas = async () => {
    if (!periodo_trabajo || !contabilidad_trabajo) {
      await confirmDialog({
        title: "Faltan datos",
        message: "Selecciona periodo y contabilidad antes de enviar el resumen.",
        icon: "warning",
        confirmText: "ACEPTAR",
      });
      return;
    }

    if (!diaSel || diaSel === "*") {
      await confirmDialog({
        title: "Selecciona un dia",
        message: "El resumen de boletas se envia por dia. Primero elige un dia en el calendario.",
        icon: "warning",
        confirmText: "ACEPTAR",
      });
      return;
    }

    const fechaResumen = obtenerFecha(periodo_trabajo, true, diaSel);
    const colaDia = await cargarColaResumenDia();
    const abiertosDia = colaDia.filter((item) => estadosRdiAbiertos.includes(String(item.estado || "").toUpperCase()));
    const totalPendienteActual = boletasPendientesResumen + abiertosDia.length;
    const result = await confirmDialog({
      title: "Enviar resumen de boletas?",
      message: construirMensajeColaResumen(fechaResumen, colaDia),
      icon: totalPendienteActual === 0 ? "info" : "success",
      confirmText: totalPendienteActual === 0 ? "ACEPTAR" : "ENVIAR",
      cancelText: "CANCELAR",
    });

    if (!result.isConfirmed || totalPendienteActual === 0) return;

    try {
      const response = await axios.post(`${back_host}/ad_ventacpe/resumen`, {
        periodo: periodo_trabajo,
        id_anfitrion: params.id_anfitrion,
        id_invitado: params.id_invitado,
        documento_id: contabilidad_trabajo,
        fecha_documentos: fechaResumen,
        origen: "VENTA_COMERCIAL",
        solo_payload: false,
      });

      const estadoRdi = response.data?.estado || response.data?.nivel;
      const esAtencion = ["ERROR", "INCIERTO", "RECHAZADO"].includes(estadoRdi);

      if (!response.data?.success) {
        await confirmDialog({
          title: esAtencion
            ? "SUNAT requiere revision"
            : response.data?.ya_generado
              ? "Resumen existente"
              : "Sin boletas pendientes",
          message: response.data?.mensaje_usuario || response.data?.message || `No hay boletas pendientes para ${fechaResumen}.`,
          icon: esAtencion ? "warning" : response.data?.ya_generado ? "success" : "info",
          confirmText: "ACEPTAR",
        });
        cargaRegistro(valorVista, periodo_trabajo, contabilidad_trabajo, diaSel);
        cargarColaResumenDia();
        return;
      }

      const colaActualizada = await cargarColaResumenDia();
      await confirmDialog({
        title: estadoRdi === "ACEPTADO" ? "Resumen aceptado" : "Resumen enviado",
        message: [
          response.data.numero_rdi || "RDI generado",
          `${response.data.cantidad || response.data.total_documentos || 0} boletas incluidas.`,
          response.data.ticket ? `Ticket: ${response.data.ticket}` : null,
          response.data.mensaje_usuario || response.data.respuesta_sunat_descripcion || null,
          "",
          "Estado del dia:",
          construirMensajeColaResumen(fechaResumen, colaActualizada),
        ].filter(Boolean).join("\n"),
        icon: "success",
        confirmText: "ACEPTAR",
      });

      cargaRegistro(valorVista, periodo_trabajo, contabilidad_trabajo, diaSel);
    } catch (error) {
      const mensaje =
        error?.response?.data?.mensaje_usuario ||
        error?.response?.data?.message ||
        "Aun no se pudo procesar el resumen comercial. Revisa si el endpoint ya esta activo en backend.";

      await confirmDialog({
        title: "No se pudo enviar el resumen",
        message: mensaje,
        icon: "error",
        confirmText: "ACEPTAR",
      });
    }
  };

  const clonarVenta = async (sComprobante) => {
    try {
      //console.log('dia sel para clonado: ... ', diaSel);
      const [COD, SERIE, NUMERO] = sComprobante.split('-');

       // Generar nuevo periodo desde fecha_clon
      const periodo_nuevo = fecha_clon.substring(0, 7);
      console.log('periodo_nuevo: ', periodo_nuevo);

      //dia
      const response = await axios.post(`${back_host}/ad_ventaclon`, {
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
        const sComprobanteAbierto = 'NP-0001-' + response.data.r_numero+'-1';//aumentamos elemento
        const sComprobanteAbiertoRef = sComprobante; //modo clonar con ref
        //enviamos la edicion del registro abierto
        navigate(`/ad_venta/${params.id_anfitrion}/${params.id_invitado}/${periodo_nuevo}/${contabilidad_trabajo}/${sComprobanteAbierto}/${sComprobanteAbiertoRef}`);
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
    // Obtener el mes y aÃ±o del parÃ¡metro "periodo" en formato "AAAA-MM"
    const [year, month] = periodo.split('-').map(Number);
  
    // Obtener la fecha actual
    const fechaActual = new Date();
    
    /*if (sDia!==''){
        //restamos 1 al mes, pinche manejo de fecha js
      const fechaSeleccionada = new Date(year, month-1, sDia); // Al pasar 0 en el dÃ­a, se obtiene el Ãºltimo dÃ­a del mes
      return formatearFecha(fechaSeleccionada,bformatoBD,sDia); // Retorna la fecha actual formateada
    }else{
      return formatearFecha(fechaActual,bformatoBD,sDia); // Retorna la fecha actual formateada
    }*/

    if (sDia==='' || sDia==='*'){
      return formatearFecha(fechaActual,bformatoBD,sDia); // Retorna la fecha actual formateada
    }else{
      //restamos 1 al mes, pinche manejo de fecha js
      const fechaSeleccionada = new Date(year, month-1, sDia); // Al pasar 0 en el dÃ­a, se obtiene el Ãºltimo dÃ­a del mes
      return formatearFecha(fechaSeleccionada,bformatoBD,sDia); // Retorna la fecha actual formateada
    }
  };

  // FunciÃ³n para formatear la fecha en DD/MM/YYYY
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
const fetchTotalVentas = async (signal) => {
    try {
      const res = await axios.get(`${back_host}/ad_ventatotal/${periodo_trabajo}/${params.id_anfitrion}/${params.id_invitado}/${contabilidad_trabajo}/${diaSel}`, { signal });
      if (signal?.aborted) return;
      if (res.data.success) {
        setTotalVentas(res.data.total);
      }
      setIsSuper(res.data.super);
    } catch (error) {
      if (signal?.aborted) return;
      console.error('Error al obtener total de ventas', error);
    }
}; 
const [recaudaciones, setRecaudaciones] = useState([]);
const [showModalMostrarRecaudacion, setShowModalMostrarRecaudacion] = useState(false);
// 'recaudacion' = por forma de pago (boton Ventas), 'usuario' = por quien
// registro (boton RECORDS). Solo define el encabezado del dialogo.
const [modoModalRecaudacion, setModoModalRecaudacion] = useState('recaudacion');
const [showModalMostrarClonar, setShowModalMostrarClonar] = useState(false);
const handleClickTotal = (periodo,id_anfitrion,documento_id,dia) => {
  setModoModalRecaudacion('recaudacion');
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
const handleClickRecords = (periodo,id_anfitrion,documento_id,dia) => {
  setModoModalRecaudacion('usuario');
  setShowModalMostrarRecaudacion(true);
  console.log(`${back_host}/ad_ventausuario/${periodo}/${id_anfitrion}/${documento_id}/${dia}`);
  axios.get(`${back_host}/ad_ventausuario/${periodo}/${id_anfitrion}/${documento_id}/${dia}`)
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
   <Box sx={{ width: '100%', minWidth: 0, maxWidth: '100%', boxSizing: 'border-box', minHeight: '100%', backgroundColor: 'transparent', p: { xs: 1, md: panoramicMode ? 1.5 : 3, xl: panoramicMode ? 2 : 4 } }}>
      {ventaDetalle && <AdminVentaDetalleDialog key={ventaDetalle.comprobante_key}
        venta={ventaDetalle} periodo={periodo_trabajo} documentoId={contabilidad_trabajo}
        idAnfitrion={params.id_anfitrion} backHost={back_host} onClose={() => setVentaDetalle(null)} />}
      <AdminVentaCloneDialog
        open={showModalMostrarClonar}
        isSmallScreen={isSmallScreen}
        fechaClon={fecha_clon}
        onFechaChange={handleChange}
        onClone={() => {
          clonarVenta(valorComprobante);
          setShowModalMostrarClonar(false);
        }}
        onClose={() => setShowModalMostrarClonar(false)}
      />

      <AdminVentaRecaudacionDialog
        open={showModalMostrarRecaudacion}
        isSmallScreen={isSmallScreen}
        recaudaciones={recaudaciones}
        modo={modoModalRecaudacion}
        onClose={() => setShowModalMostrarRecaudacion(false)}
      />
  <div>
    <Modal
      open={abierto}
      onClose={abrirCerrarModal}
      style={modalStyles}
      >
      <AsientoCobranzaCredito datos={datosPopUp} onClose={handleCerrar} id_anfitrion={params.id_anfitrion} documento_id={contabilidad_trabajo} periodo_trabajo={periodo_trabajo} contabilidad_nombre={contabilidad_nombre}/>
    </Modal>
  </div>

  <Box sx={{ ...listContentSx, ...(panoramicMode ? { maxWidth: '100%' } : {}) }}>
  <AdminVentaListToolbar
    contador={registrosdet.length}
    busqueda={valorBusqueda}
    onBuscar={actualizaValorFiltro}
    onNuevo={generaVenta}
    periodo={periodo_trabajo}
    periodos={periodo_select}
    contabilidad={contabilidad_trabajo}
    contabilidades={contabilidad_select}
    onChange={handleChange}
    onDia={handleDayFilter}
    filtro={filtroEstado}
    onFiltro={(filtro) => setFiltroEstado((actual) => actual === filtro ? '' : filtro)}
    pendientes={resumenEstados.pendientes}
    anulados={resumenEstados.anulados}
    totalVentas={totalVentas}
    puedeVerTotales={String(params.id_anfitrion) === String(params.id_invitado) || isSuper}
    onTotal={() => handleClickTotal(periodo_trabajo, params.id_anfitrion, contabilidad_trabajo, diaSel)}
    onRecords={() => handleClickRecords(periodo_trabajo, params.id_anfitrion, contabilidad_trabajo, diaSel)}
    acciones={(
      <Box sx={{ display: 'flex', flexWrap: 'wrap', minWidth: 0, maxWidth: '100%', alignItems: 'center', gap: 0.5 }}>

        <Box>    
          { (pVenta0104) ? (

            <Tooltip title='ELIMINAR MASIVO' >
            <IconButton color="warning" 
                            //style={{ padding: '0px'}}
                            sx={{
                              ...toolbarIconSx,
                              color: palette.muted,
                              '&:hover': {
                                backgroundColor: palette.danger,
                                borderColor: palette.danger,
                                color: palette.onAccent,
                              },
                            }}
                            onClick={() => {
                              handleDeleteOrigen(params.id_anfitrion,contabilidad_trabajo,periodo_trabajo,id_libro)
                            }}
            >
                  <FolderDeleteIcon sx={{ fontSize: 27 }}/>
            </IconButton>
            </Tooltip>

          )
          :
          (
            <div></div>
          )
          }

        </Box>

        <Box sx={{ height: 38, display: 'flex', alignItems: 'center', gap: 0.5, '& .MuiIconButton-root': { width: 38, height: 38 } }}>
          <Tooltip title='EXPORTAR XLS' >
              <BotonExcelGeneral datos={registrosdet} 
                                  nombreArchivo="Reporte_Ventas"
                                  tituloReporte={`Registro de Ventas:  ${contabilidad_trabajo} ${contabilidad_nombre} ${periodo_trabajo}`}
                                  columnasNumericas={['r_monto_total', 'base', 'igv','exonera','inafecta']}
                                  columnasExcluidas={['r_fecvcto','r_cod','r_serie','r_numero','r_cod_ref','r_serie_ref','r_numero_ref','detalle_resumen','detalle_cantidad','detalle_busqueda']}
              />
          </Tooltip>

          {(String(params.id_anfitrion) === String(params.id_invitado) || isSuper) && (
            <Tooltip title={resumenDiaOk ? "TODO OK: SIN BOLETAS PENDIENTES" : `ENVIAR RESUMEN DE BOLETAS (${totalPendienteResumenDia})`}>
              <IconButton
                color="primary"
                sx={{
                  ...toolbarIconSx,
                  color: resumenDiaOk ? palette.success : totalPendienteResumenDia > 0 ? palette.warning : palette.accent,
                  '&:hover': {
                    backgroundColor: resumenDiaOk ? palette.successSoft : palette.accentSoft,
                    borderColor: resumenDiaOk ? palette.success : palette.accent,
                    color: resumenDiaOk ? palette.success : palette.accent,
                  },
                }}
                onClick={enviarResumenBoletas}
              >
                <Box sx={sunatResumenIconSx}>
                  <img src={SunatResumenIcon} alt="Resumen SUNAT" />
                  <Box className={`resumen-badge ${resumenDiaOk ? "ok" : totalPendienteResumenDia > 0 ? "warn" : ""}`}>
                    {resumenDiaOk ? <CheckCircleOutlineIcon sx={{ fontSize: 9 }} /> : <SummarizeIcon sx={{ fontSize: 9 }} />}
                  </Box>
                </Box>
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    )}
  />

  <Box
      sx={{
        overflow: 'hidden',
        borderRadius: isSmallScreen ? contentRadius : palette.radius.listCard,
        border: 0,
        backgroundColor: listCardBg,
        boxShadow: 'none',
        px: isSmallScreen ? 0.25 : 0,
        py: isSmallScreen ? 0.25 : 0,
        minWidth: 0,
        maxWidth: '100%',
        '& .rdt_TableWrapper': {
          maxWidth: '100%',
          overflowX: 'auto',
        },
        '& .rdt_Table': {
          minWidth: isSmallScreen ? 960 : '100%',
        },
      }}
  >
    <Datatable
        //title="Registro - Pedidos"
        theme="solarized"
        columns={columnas}
        data={registrosdet}
        customStyles={ventaDesktopTableStyles}
        keyField="comprobante_key"
        expandableRows
        expandableRowsComponent={AdminVentaTableDetails}
        noDataComponent="No hay ventas para los filtros seleccionados"
        //selectableRows
        //selectableRowsSingle 
        //contextActions={contextActions}
        //actions={actions}
        onSelectedRowsChange={handleRowSelected}
        clearSelectedRows={toggleCleared}
        pagination
        paginationPerPage={15}
        paginationRowsPerPageOptions={[15, 50, 100]}
        paginationComponentOptions={{ rowsPerPageText: 'Filas por página:', rangeSeparatorText: 'de' }}

        selectableRowsComponent={Checkbox} // Pass the function only
        sortIcon={<ArrowDownward />}  
        highlightOnHover //resalta la fila
    >
    </Datatable>
  </Box>
  </Box>
</Box>
  </>
  );
}

