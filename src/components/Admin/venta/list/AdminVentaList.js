import React from 'react';
import { useEffect, useState, useMemo, useCallback } from "react"
import { Box,Modal, Button,useMediaQuery,Select, MenuItem, Typography, InputBase} from "@mui/material";
import { useNavigate,useParams,useLocation } from "react-router-dom";
import DeleteIcon from '@mui/icons-material/Delete';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { Plus, Search } from 'lucide-react';
import { blueGrey } from '@mui/material/colors';
//import createPdfTicket from './AdminVentaPdf';
import DaySelector from "../../AdminDias";
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
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import StackedLineChartIcon from '@mui/icons-material/StackedLineChart';
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
import AppButton from '../../../ui/AppButton';

import { AdminVentasColumnas } from '../../AdminColumnas';
import { AdminCajaColumnas } from '../../AdminColumnas';

import AsientoCobranzaCredito from '../../../AsientoCobranzaCredito';
import AdminSunatIcon from '../../AdminSunatIcon';
import AdminSunatGreIcon from '../../AdminSunatGreIcon';
import { ensureAdminVentaTableTheme } from '../common/adminVentaTableTheme';
import AdminVentaCloneDialog from './AdminVentaCloneDialog';
import AdminVentaRecaudacionDialog from './AdminVentaRecaudacionDialog';
import palette from '../../../../theme/palette';

const contentRadius = 1;

const panelSx = {
  backgroundColor: 'transparent',
  border: '0',
  borderRadius: contentRadius,
  p: 0,
};

const listContentSx = {
  width: '100%',
  maxWidth: '100%',
  boxSizing: 'border-box',
  minWidth: 0,
  ml: 0,
  mr: 0,
  p: 0,
  display: 'grid',
  gap: 1.15,
};

const toolbarSurfaceSx = {
  backgroundColor: '#1c252c',
  borderRadius: contentRadius,
  px: { xs: 1, md: 1.5 },
  py: { xs: 0.9, md: 1.25 },
};

const selectSx = {
  width: '100%',
  height: 42,
  color: palette.text,
  backgroundColor: palette.chip,
  border: `1px solid ${palette.border}`,
  borderRadius: contentRadius,
  fontSize: '13px',
  '.MuiSelect-select': {
    py: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  '& .MuiOutlinedInput-notchedOutline': { border: 0 },
  '& .MuiSelect-icon': { color: palette.muted },
};

const selectMenuProps = {
  PaperProps: {
    sx: {
      backgroundColor: palette.surface,
      color: palette.text,
      border: `1px solid ${palette.border}`,
      '& .MuiMenuItem-root': { fontSize: '13px' },
    },
  },
};

const searchSx = {
  flex: '1 1 280px',
  minWidth: { xs: '100%', sm: 280 },
  height: 42,
  px: 1.15,
  display: 'flex',
  alignItems: 'center',
  gap: 0.85,
  color: palette.text,
  backgroundColor: palette.bg,
  border: '1px solid rgba(139,154,165,0.14)',
  borderRadius: contentRadius,
  '&:focus-within': {
    borderColor: 'rgba(139,154,165,0.32)',
  },
};

const inputSx = {
  color: palette.text,
  fontSize: '13px',
  width: '100%',
  '& input': {
    color: palette.text,
    fontSize: '13px',
  },
  '& input::placeholder': {
    color: palette.muted,
    opacity: 1,
  },
};

const toolbarIconSx = {
  width: 42,
  height: 42,
  borderRadius: contentRadius,
  backgroundColor: palette.chip,
  border: `1px solid ${palette.border}`,
  color: palette.muted,
  p: 0,
  '&:hover': {
    backgroundColor: 'rgba(139,154,165,0.14)',
    borderColor: 'rgba(139,154,165,0.20)',
    color: palette.text,
  },
};

const rowActionIconSx = {
  color: 'rgba(144,164,174,0.78)',
  cursor: 'pointer',
  fontSize: 25,
  display: 'block',
  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.26))',
  transition: 'color 0.18s ease, filter 0.18s ease, transform 0.18s ease',
  '&:hover': {
    color: '#7ddbd3',
    filter: 'drop-shadow(0 0 6px rgba(125,219,211,0.24))',
    transform: 'translateY(-1px) scale(1.03)',
  },
};

const cloneActionIconSx = {
  color: 'rgba(139,154,165,0.86)',
  cursor: 'pointer',
  fontSize: 23,
  display: 'block',
  transition: 'color 0.18s ease, transform 0.18s ease',
  '&:hover': {
    color: 'rgba(255,255,255,0.92)',
    transform: 'translateY(-1px)',
  },
};

const toolbarButtonSx = {
  height: 42,
  borderRadius: contentRadius,
  boxShadow: 'none',
  fontSize: '12px',
  fontWeight: 800,
  whiteSpace: 'nowrap',
  textTransform: 'none',
};

const totalButtonSx = {
  ...toolbarButtonSx,
  minWidth: 174,
  justifyContent: 'center',
  gap: 0.85,
  px: 1.25,
  backgroundColor: 'rgba(139,154,165,0.10)',
  border: '1px solid rgba(139,154,165,0.16)',
  color: 'rgba(125,219,211,0.86)',
  '&:hover': {
    backgroundColor: 'rgba(139,154,165,0.16)',
    borderColor: 'rgba(139,154,165,0.24)',
    color: 'rgba(255,255,255,0.92)',
    boxShadow: 'none',
  },
};

const recordsButtonSx = {
  ...toolbarButtonSx,
  backgroundColor: 'rgba(139,154,165,0.12)',
  border: '1px solid rgba(139,154,165,0.25)',
  color: palette.muted,
  '&:hover': {
    backgroundColor: palette.chip,
    borderColor: palette.border,
    color: palette.text,
    boxShadow: 'none',
  },
};

const sweetAlertDarkOptions = {
  background: palette.surface,
  color: palette.text,
  confirmButtonColor: palette.accent,
  cancelButtonColor: palette.chip,
  buttonsStyling: true,
};

const listCardBg = '#1c252c';
const listTableHeaderBg = '#202a32';
const listTableHoverBg = 'rgba(139,154,165,0.07)';

const dataTableStyles = {
  table: {
    style: {
      backgroundColor: listCardBg,
    },
  },
  tableWrapper: {
    style: {
      backgroundColor: listCardBg,
    },
  },
  responsiveWrapper: {
    style: {
      backgroundColor: listCardBg,
    },
  },
  header: {
    style: {
      backgroundColor: listCardBg,
    },
  },
  headRow: {
    style: {
      backgroundColor: listTableHeaderBg,
      borderBottomColor: 'transparent',
    },
  },
  headCells: {
    style: {
      backgroundColor: listTableHeaderBg,
      color: palette.muted,
    },
  },
  rows: {
    style: {
      backgroundColor: listCardBg,
      borderBottomColor: 'transparent',
    },
    highlightOnHoverStyle: {
      backgroundColor: listTableHoverBg,
      borderBottomColor: 'transparent',
      outline: 'none',
    },
  },
  cells: {
    style: {
      backgroundColor: 'transparent',
    },
  },
  pagination: {
    style: {
      backgroundColor: listCardBg,
      borderTopColor: 'transparent',
    },
  },
};

export default function AdminVentaList() {
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
  const [registrosdet,setRegistrosdet] = useState([]);
  const [tabladet,setTabladet] = useState([]);  //Copia de los registros: Para tratamiento de filtrado
  const [navegadorMovil, setNavegadorMovil] = useState(false);
  const [valorBusqueda, setValorBusqueda] = useState(""); //txt: rico filtrado
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
      fetchTotalVentas();
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
          setRegistrosdet(registrosdet.filter(
                          registrosdet => registrosdet.comprobante !== sComprobante
                          ));
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
  const filtrar = (strBusca) => {
    var resultadosBusqueda = tabladet.filter((elemento) => {
      //verifica nulls para evitar error de busqueda
      const razonSocial = elemento.r_razon_social?.toString().toLowerCase() || '';
      const documentoId = elemento.r_documento_id?.toString().toLowerCase() || '';
      const comprobante = elemento.comprobante?.toString().toLowerCase() || '';
  
      if (razonSocial.includes(strBusca.toLowerCase()) || documentoId.includes(strBusca.toLowerCase()) || comprobante.includes(strBusca.toLowerCase())) {
        return elemento;
      }
      return null; // Agrega esta lÃ­nea para manejar el caso en que no haya coincidencia
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

    fetchTotalVentas();

  },[periodo_trabajo,contabilidad_trabajo,valorVista,diaSel,updateTrigger]);

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
    return [...comunes,...AdminVentasColumnas];
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
const fetchTotalVentas = async () => {
    try {
      const res = await axios.get(`${back_host}/ad_ventatotal/${periodo_trabajo}/${params.id_anfitrion}/${params.id_invitado}/${params.documento_id}/${diaSel}`);
      console.log('Tottales ventas: ', res.data);
      setTotalVentas(res.data.total);
      setIsSuper(res.data.super);
    } catch (error) {
      console.error('Error al obtener total de ventas', error);
    }
}; 
const [recaudaciones, setRecaudaciones] = useState([]);
const [showModalMostrarRecaudacion, setShowModalMostrarRecaudacion] = useState(false);
const [showModalMostrarClonar, setShowModalMostrarClonar] = useState(false);
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
const handleClickRecords = (periodo,id_anfitrion,documento_id,dia) => {
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
   <div style={{ backgroundColor: 'transparent', 
                 //minHeight: '100vh', 
                 //padding: '20px', 
                 //marginTop: 30,  
                 //marginLeft: -65, 
                 margin: 0,
                 width: "100%",
                 maxWidth: "100%",
                 boxSizing: "border-box",
                 overflowX: "hidden" }}
    > 
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

  <Box sx={listContentSx}>
  <Box
      sx={{
        ...panelSx,
        ...toolbarSurfaceSx,
        display: 'flex',
        alignItems: { xs: 'stretch', md: 'center' },
        justifyContent: 'space-between',
        gap: 1,
        flexDirection: { xs: 'column', md: 'row' },
      }}
  >
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ color: 'rgba(255,255,255,0.92)', fontSize: '22px', fontWeight: 500, lineHeight: 1.2 }}>
          Registro de Ventas
        </Typography>
        <Typography sx={{ color: palette.muted, fontSize: '12px', mt: 0.35 }}>
          {`${registrosdet.length} comprobantes visibles`}
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'minmax(150px, 180px) minmax(240px, 1fr)', md: '150px minmax(280px, 360px) auto auto' },
          gap: 1,
          alignItems: 'center',
          width: { xs: '100%', md: 'auto' },
        }}
      >
      <Box sx={{ width: '100%' }}>
          <Select
                labelId="periodo"
                //id={periodo_select.periodo}
                size='small'
                value={periodo_trabajo}
                name="periodo"
                sx={{ ...selectSx, color: palette.accent }}
                label="Periodo Cont"
                onChange={handleChange}
                MenuProps={selectMenuProps}
                >
                  <MenuItem value="default">SELECCIONA </MenuItem>
                {   
                    periodo_select.map(elemento => (
                    <MenuItem key={elemento.periodo} value={elemento.periodo}>
                      {elemento.periodo}
                    </MenuItem>)) 
                }
          </Select>
      </Box>
      <Box>
          <Select
                labelId="contabilidad_select"
                //id={contabilidad_select.documento_id}
                size='small'
                value={contabilidad_trabajo}
                name="contabilidad"
                sx={selectSx}
                label="Contabilidad"
                onChange={handleChange}
                MenuProps={selectMenuProps}
                >
                  <MenuItem value="default">SELECCIONA </MenuItem>
                {   
                    contabilidad_select.map(elemento => (
                    <MenuItem key={elemento.documento_id} value={elemento.documento_id}>
                      {elemento.razon_social}
                    </MenuItem>)) 
                }
          </Select>
      </Box>

      {(String(params.id_anfitrion) === String(params.id_invitado) || isSuper) && (
        <Button variant="contained" 
                color="primary" 
                onClick={() => handleClickTotal(periodo_trabajo, params.id_anfitrion, contabilidad_trabajo, diaSel)}
                sx={totalButtonSx}
        >
          <StackedLineChartIcon sx={{ fontSize: 18, flexShrink: 0 }} />
          <Box sx={{ display: 'grid', justifyItems: 'center', lineHeight: 1.05 }}>
            <Typography sx={{ color: 'inherit', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>
              Ventas
            </Typography>
            <Typography sx={{ color: 'inherit', fontSize: '13px', fontWeight: 900 }}>
              {`S/ ${parseFloat(totalVentas).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}`}
            </Typography>
          </Box>
        </Button>
      )}

      {(String(params.id_anfitrion) === String(params.id_invitado) || isSuper) && (
        <Button variant="contained" 
                color="inherit" 
                onClick={() => handleClickRecords(periodo_trabajo, params.id_anfitrion, contabilidad_trabajo, diaSel)}
                sx={recordsButtonSx}
        >
          <QueryStatsIcon sx={{ fontSize: 17, mr: 0.6 }} />
          RECORDS
        </Button>
      )}

      </Box>
  </Box>

  <Box sx={{ ...panelSx, overflowX: 'auto' }}>
    <DaySelector period={periodo_trabajo} onDaySelect={handleDayFilter} />
  </Box>

  <Box
      sx={{
        ...panelSx,
        ...toolbarSurfaceSx,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
        flexWrap: 'wrap',
      }}
  >

        <Box sx={searchSx}>
          <Search size={16} color={palette.muted} />
          <InputBase
            name="busqueda"
            placeholder="Filtrar: RUC, razon social o comprobante"
            onChange={actualizaValorFiltro}
            sx={inputSx}
          />
        </Box>

        <AppButton icon={<Plus size={16} />} onClick={generaVenta} sx={{ ml: 'auto' }}>
          Nuevo
        </AppButton>

        <Box>    
          { (pVenta0104) ? (

            <Tooltip title='ELIMINAR MASIVO' >
            <IconButton color="warning" 
                            //style={{ padding: '0px'}}
                            sx={{
                              ...toolbarIconSx,
                              color: blueGrey[500],
                              '&:hover': {
                                backgroundColor: '#c2410c',
                                borderColor: '#c2410c',
                                color: '#fff',
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

        <Box sx={{ height: 42, display: 'flex', alignItems: 'center' }}>
          <Tooltip title='EXPORTAR XLS' >
              <BotonExcelGeneral datos={registrosdet} 
                                  nombreArchivo="Reporte_Ventas"
                                  tituloReporte={`Registro de Ventas:  ${contabilidad_trabajo} ${contabilidad_nombre} ${periodo_trabajo}`}
                                  columnasNumericas={['r_monto_total', 'base', 'igv','exonera','inafecta']}
                                  columnasExcluidas={['r_fecvcto','r_cod','r_serie','r_numero','r_cod_ref','r_serie_ref','r_numero_ref']}
              />
          </Tooltip>
        </Box>


        

  </Box>

  <Box
      sx={{
        overflow: 'hidden',
        borderRadius: contentRadius,
        border: 0,
        backgroundColor: listCardBg,
        boxShadow: 'none',
        px: { xs: 0.25, md: 0.75 },
        py: { xs: 0.25, md: 0.75 },
        minWidth: 0,
        maxWidth: '100%',
        '& .rdt_TableWrapper': {
          maxWidth: '100%',
          overflowX: 'auto',
        },
        '& .rdt_Table': {
          minWidth: { xs: 960, md: '100%' },
        },
      }}
  >
    <Datatable
        //title="Registro - Pedidos"
        theme="solarized"
        columns={columnas}
        data={registrosdet}
        customStyles={dataTableStyles}
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
        highlightOnHover //resalta la fila
    >
    </Datatable>
  </Box>
  </Box>
</div>
  </>
  );
}

