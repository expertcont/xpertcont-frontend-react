import React from 'react';
import { useEffect, useState, useMemo, useCallback } from "react"
import { Box, Button, useMediaQuery, Dialog, DialogTitle, IconButton } from "@mui/material";
import { useNavigate,useParams } from "react-router-dom";
import DeleteIcon from '@mui/icons-material/Delete';
import AutoDeleteIcon from '@mui/icons-material/AutoDelete';
//import createPdfTicket from './AdminVentaPdf';
import DaySelector from "../../AdminDias";
import { useDialog } from "../../AdminConfirmDialogProvider";
import TaskAltIcon from "@mui/icons-material/TaskAlt";   

//import PrintIcon from '@mui/icons-material/Print';
import FindInPageIcon from '@mui/icons-material/FindInPage';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import swal from 'sweetalert';
import swal2 from 'sweetalert2'
import Datatable from 'react-data-table-component';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
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
import BotonExcelVentas from '../../../BotonExcelVentas';
import AppButton from '../../../ui/AppButton';
import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, Ban, FileSpreadsheet, Layers, Package, Trash2 } from 'lucide-react';

import { AdminStocksColumnas } from '../../AdminColumnas';
import TrHeader from '../../transporte/common/components/TrHeader';
import TrFiltros from '../../transporte/common/components/TrFiltros';
import { ensureAdminVentaTableTheme } from '../../venta/common/adminVentaTableTheme';
import { crearColumnaDetalleVenta, DocumentoListadoCell, ventaDesktopTableStyles } from '../../venta/list/AdminVentaTableColumns';
import { ResumenCard } from '../../venta/list/AdminVentaListToolbar';
import AdminStockProductosDialog from './AdminStockProductosDialog';
import palette from '../../../../theme/palette';

const filtrosMovimiento = [
  { value: '', label: 'Todos', icon: Layers },
  { value: 'entrada', label: 'Entradas', icon: ArrowDownToLine, color: palette.success, soft: palette.successSoft },
  { value: 'salida', label: 'Salidas', icon: ArrowUpFromLine, color: palette.warning, soft: palette.warningSoft },
  { value: 'traslado', label: 'Traslados', icon: ArrowLeftRight },
  { value: 'anulado', label: 'Anulados', icon: Ban, color: palette.danger, soft: palette.dangerSoft },
];

function categoriaMovimiento(movimiento) {
  return movimiento.estado === 'NULO' ? 'anulado' : movimiento.tipo_movimiento;
}

function TarjetasFiltroMovimiento({ value, counts, onSelect }) {
  return (
    <Box role="group" aria-label="Filtrar movimientos" sx={{
      display: 'grid',
      gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(5, minmax(0, 1fr))' },
      gap: 0.65,
      mt: 1.15,
    }}>
      {filtrosMovimiento.map((option) => (
        <ResumenCard
          key={option.value}
          label={option.label}
          value={counts.get(option.value) ?? 0}
          icon={option.icon}
          color={option.color ?? palette.accent}
          soft={option.soft ?? palette.accentSoft}
          filter
          active={value === option.value}
          onClick={() => onSelect(option.value)}
        />
      ))}
    </Box>
  );
}

const rowActionSx = {
  width: 38,
  height: 38,
  flexShrink: 0,
  borderRadius: palette.radius.control,
  border: `1px solid ${palette.borderSoft}`,
  backgroundColor: palette.surfaceAlt,
  color: palette.muted,
  transition: 'background-color 140ms ease, border-color 140ms ease, transform 140ms ease',
  '& .MuiSvgIcon-root': { fontSize: 22 },
  '&:hover': {
    backgroundColor: palette.accentSoft,
    borderColor: palette.accent,
    color: palette.accent,
    transform: 'scale(1.08)',
  },
  '&:active': { transform: 'scale(0.92)' },
};

const exportButtonSx = {
  width: 42,
  height: 42,
  flexShrink: 0,
  borderRadius: palette.radius.control,
  border: `1px solid ${palette.border}`,
  backgroundColor: palette.chip,
  color: palette.success,
  '&:hover': {
    backgroundColor: palette.successSoft,
    borderColor: palette.success,
    color: palette.success,
  },
};

export default function AdminStockList() {
  ensureAdminVentaTableTheme();

  //Control de useffect en retroceso de formularios
  //verificamos si es pantalla pequeña y arreglamos el grid de fechas
  const isSmallScreen = useMediaQuery('(max-width: 600px)');
  const { confirmDialog } = useDialog(); //unico dialogo
  const [fecha_clon, setFechaClon] = useState("");

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
  const [navegadorMovil, setNavegadorMovil] = useState(false);
  const [valorBusqueda, setValorBusqueda] = useState(""); //txt: rico filtrado
  const [filtroMovimiento, setFiltroMovimiento] = useState('');
  const [valorVista, setValorVista] = useState("ventas");
  const [id_libro, setValorLibro] = useState("014");
  const [permisosComando, setPermisosComando] = useState([]); //MenuComandos
  const {user, isAuthenticated } = useAuth0();
  
  //const [columnas, setColumnas] = useState([]);

  const [periodo_trabajo, setPeriodoTrabajo] = useState("");
  const [periodo_select,setPeriodosSelect] = useState([]);
  
  const [contabilidad_trabajo, setContabilidadTrabajo] = useState("");
  const [contabilidad_nombre, setContabilidadNombre] = useState("");
  const [contabilidad_select,setContabilidadesSelect] = useState([]);
  const [valorComprobante, setValorComprobante] = useState("");

  const [datosPopUp,setDatosPopUp] = useState([]);
  let [diaSel, setDiaSel] = useState("*");

  const handlePeriodoSelect = (periodo) => {
    if (!periodo_select.some((item) => item.periodo === periodo)) return;
    setPeriodoTrabajo(periodo);
    sessionStorage.setItem('periodo_trabajo', periodo);
    setUpdateTrigger(Math.random());
  };

  const handleContabilidadSelect = (documento) => {
    const empresa = contabilidad_select.find((item) => item.documento_id === documento);
    if (!empresa) return;
    setContabilidadTrabajo(documento);
    setContabilidadNombre(empresa.razon_social);
    sessionStorage.setItem('contabilidad_trabajo', documento);
    sessionStorage.setItem('contabilidad_nombre', empresa.razon_social);
    navigate(`/ad_stock/${params.id_anfitrion}/${params.id_invitado}/${documento}`);
    setUpdateTrigger(Math.random());
  };

  // Agrega íconos al inicio de cada columna
  //let columnasComunes;
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
      navigate(`/ad_stock/${params.id_anfitrion}/${params.id_invitado}/${periodo_trabajo}/${contabilidad_trabajo}/${sComprobante}/view`);
    } else {
      navigate(`/ad_stock/${params.id_anfitrion}/${params.id_invitado}/${periodo_trabajo}/${contabilidad_trabajo}/${sComprobante}/-`);
    }    
  };
  const handleDelete = (comprobante) => {
    //Recuerda que el comprobante enviado es el comprobante_ref --> contiene el key del registro ;)
    confirmaEliminacion(params.id_anfitrion,contabilidad_trabajo,periodo_trabajo,comprobante);
  };
  const confirmaEliminacion = async(sAnfitrion,sDocumentoId,sPeriodo,sComprobante)=>{
    const result = await confirmDialog({
        title: "Eliminar Comprobante?",
        message: `${sComprobante}`,
        icon: "warning", // success | error | info | warning
        confirmText: "ELIMINAR",
        cancelText: "CANCELAR",
    });
    if (result.isConfirmed) {
          console.log("✅ Eliminado:", sComprobante);
          eliminarRegistroSeleccionado(sAnfitrion,sDocumentoId,sPeriodo,sComprobante);
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
  const eliminarRegistroSeleccionado = async (sAnfitrion, sDocumentoId, sPeriodo, sComprobante) => {
    const [COD, SERIE, NUMERO] = sComprobante.split('-');
    const datosEnvio = {
      periodo: sPeriodo,
      id_anfitrion: sAnfitrion,
      documento_id: sDocumentoId,
      r_cod: COD,
      r_serie: SERIE,
      r_numero: NUMERO
    }
    console.log('datosEnvio Stocks: ',datosEnvio);
    
    try {
        const response = await axios.delete(`${back_host}/ad_stockdel`, {
            data: datosEnvio
        });

        // Verifica la respuesta del backend
        if (response.data.success) {
          confirmDialog({
                  title: "Movimiento de Almacen eliminado con exito",
                  //message: `${sComprobante}`,
                  icon: "success", // success | error | info | warning
                  confirmText: "ACEPTAR"
                  //cancelText: "CERRAR",
          });
        } else {
          confirmDialog({
            title: "No se puede Eliminar Movimiento de Almacen, solo el ultimo",
            icon: "error",
            confirmText: "ACEPTAR"
          });
          //console.log("No se pudo eliminar Movimiento de Almacen, no es el ultimo: " + response.data.message);
        }
    } catch (error) {
        //console.error("Error eliminando Movimiento de Almacen:", error);
          swal({
            text:"No se puede Eliminar Movimiento de Almacen",
            icon:"error",
            timer:"2000"
          });
        
    }
  };

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const handleAnula = (comprobante) => {
    //Recuerda que el comprobante enviado es el comprobante_ref --> contiene el key del registro ;)
    confirmaAnulacion(params.id_anfitrion,contabilidad_trabajo,periodo_trabajo,comprobante);
  };
  const confirmaAnulacion = async(sAnfitrion,sDocumentoId,sPeriodo,sComprobante)=>{
    const result = await confirmDialog({
        title: "Anular Comprobante?",
        message: `${sComprobante}`,
        icon: "warning", // success | error | info | warning
        confirmText: "ANULAR",
        cancelText: "CANCELAR",
    });
    if (result.isConfirmed) {
          console.log("✅ Anulado:", sComprobante);
          anularRegistroSeleccionado(sAnfitrion,sDocumentoId,sPeriodo,sComprobante);
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
  const anularRegistroSeleccionado = async (sAnfitrion, sDocumentoId, sPeriodo, sComprobante) => {
    const [COD, SERIE, NUMERO] = sComprobante.split('-');
    const datosEnvio = {
      periodo: sPeriodo,
      id_anfitrion: sAnfitrion,
      documento_id: sDocumentoId,
      cod: COD,
      serie: SERIE,
      numero: NUMERO
    }
    //console.log('datosEnvio Stocks: ',datosEnvio);
    
    try {
        const response = await axios.put(`${back_host}/ad_stockanula`, {
            data: datosEnvio
        });

        // Verifica la respuesta del backend
        if (response.data.success) {
          confirmDialog({
                  title: "Movimiento de Almacen anulado con exito",
                  //message: `${sComprobante}`,
                  icon: "success", // success | error | info | warning
                  confirmText: "ACEPTAR"
                  //cancelText: "CERRAR",
          });
        } else {
          confirmDialog({
            title: "No se puede Anular Movimiento de Almacen",
            icon: "error",
            confirmText: "ACEPTAR"
          });
          //console.log("No se pudo eliminar Movimiento de Almacen, no es el ultimo: " + response.data.message);
        }
    } catch (error) {
        //console.error("Error eliminando Movimiento de Almacen:", error);
          swal({
            text:"No se puede Anular Movimiento de Almacen",
            icon:"error",
            timer:"2000"
          });
        
    }
  };

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
        console.log(`${back_host}/ad_stock/${periodo_trabajo}/${params.id_anfitrion}/${contabilidad_trabajo}/${sDia}`);
        response = await fetch(`${back_host}/ad_stock/${periodo_trabajo}/${params.id_anfitrion}/${contabilidad_trabajo}/${sDia}`);
    }
    else{
        //usamos los historiales
        console.log(`${back_host}/ad_stock/${strHistorialPeriodo}/${params.id_anfitrion}/${strHistorialContabilidad}/${sDia}`);
        response = await fetch(`${back_host}/ad_stock/${strHistorialPeriodo}/${params.id_anfitrion}/${strHistorialContabilidad}/${sDia}`);
    }
    
    const data = await response.json();
    setRegistrosdet(data);
  }
  //////////////////////////////////////
  
 
  const navigate = useNavigate();
  //Para recibir parametros desde afuera
  const params = useParams();

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
  const movimientosBuscados = useMemo(() => {
    const busqueda = valorBusqueda.trim().toLowerCase();
    return registrosdet.filter((movimiento) =>
      [movimiento.r_razon_social, movimiento.r_documento_id, movimiento.comprobante]
        .some((valor) => String(valor ?? '').toLowerCase().includes(busqueda))
    );
  }, [registrosdet, valorBusqueda]);

  const conteosFiltros = useMemo(() => {
    const conteos = new Map([['', movimientosBuscados.length]]);
    for (const movimiento of movimientosBuscados) {
      const categoria = categoriaMovimiento(movimiento);
      if (categoria) conteos.set(categoria, (conteos.get(categoria) ?? 0) + 1);
    }
    return conteos;
  }, [movimientosBuscados]);

  const movimientosVisibles = useMemo(() => filtroMovimiento
    ? movimientosBuscados.filter((movimiento) => categoriaMovimiento(movimiento) === filtroMovimiento)
    : movimientosBuscados, [movimientosBuscados, filtroMovimiento]);

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

  const accionesMovimiento = [
    {
      label: 'Eliminar movimiento',
      icon: DeleteIcon,
      onClick: (row) => handleDelete(row.comprobante),
    },
    {
      label: 'Anular movimiento',
      icon: AutoDeleteIcon,
      onClick: (row) => handleAnula(row.comprobante),
    },
    {
      label: 'Clonar movimiento',
      icon: ContentCopyIcon,
      onClick: (row) => {
        setShowModalMostrarClonar(true);
        setValorComprobante(row.comprobante);
      },
    },
  ];
  const columnasComunes = [{
    name: 'Acciones',
    width: '146px',
    center: true,
    ignoreRowClick: true,
    allowOverflow: true,
    cell: (row) => (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
        {accionesMovimiento.map(({ label, icon: Icon, onClick }) => (
          <Tooltip key={label} title={label} arrow>
            <IconButton aria-label={label} onClick={() => onClick(row)} sx={rowActionSx}>
              <Icon />
            </IconButton>
          </Tooltip>
        ))}
      </Box>
    ),
  }];
  const columnas = [
    {
      id: 'movimiento',
      name: 'Movimiento',
      width: '275px',
      selector: (row) => row.comprobante || '',
      sortable: true,
      cell: (row) => (
        <DocumentoListadoCell
          numero={String(row.comprobante || '').replace(/^(IA|SA|MV)-/, '') || 'Sin número'}
          emision={row.fecha_emision}
          tipo={{ entrada: 'Entrada', salida: 'Salida', traslado: 'Traslado' }[row.tipo_movimiento] || 'Movimiento'}
          onVer={() => handleUpdate(row.comprobante, true)}
          icono={(
            <Tooltip title="Editar movimiento" arrow>
              <IconButton
                aria-label="Editar movimiento"
                onClick={() => handleUpdate(row.comprobante, false)}
                sx={{
                  width: '100%',
                  height: '100%',
                  borderRadius: palette.radius.control,
                  color: palette.accent,
                  '&:hover': { backgroundColor: palette.accentSoft },
                  '&:focus-visible': { outline: `2px solid ${palette.accent}`, outlineOffset: 2 },
                }}
              >
                <DriveFileRenameOutlineIcon sx={{ fontSize: 22 }} />
              </IconButton>
            </Tooltip>
          )}
        />
      ),
    },
    ...columnasComunes,
    { ...crearColumnaDetalleVenta((row) => handleUpdate(row.comprobante, true)), name: 'Resumen de ítems' },
    ...AdminStocksColumnas.filter(({ selector }) => !['fecha_emision', 'comprobante'].includes(selector)),
  ];

  const inicializarPantalla = async () => {
    const historialPeriodo = sessionStorage.getItem("periodo_trabajo") || params.periodo;
    const periodo = await cargaPeriodosAnfitrion(historialPeriodo);

    const historialContabilidad = sessionStorage.getItem("contabilidad_trabajo") || params.documento_id;

    const historialNombre = sessionStorage.getItem("contabilidad_nombre");

    const contabilidad = await cargaContabilidadesAnfitrion(historialContabilidad, historialNombre);

    if (isAuthenticated && user && user.email) {
        await cargaPermisosMenu();
        await cargaPermisosMenuComando("20");
    }

    console.log('params inicializarPantalla analisis: ',params)
    if(params.documento_id === "-"){
        //Ojo, aumentar periodo en la navagecion, olvidamos eso ;)
        console.log(`navegando por: /ad_stock/${params.id_anfitrion}/${params.id_invitado}/${contabilidad.documento}`);
        navigate(`/ad_stock/${params.id_anfitrion}/${params.id_invitado}/${contabilidad.documento}`,{replace:true});
    }
  };

  useEffect(()=>{
    if(!isAuthenticated) return;

    inicializarPantalla();
  },[isAuthenticated]);

  useEffect(()=>{
    if( !periodo_trabajo || !contabilidad_trabajo){
        return;
    }

    cargaRegistro("ventas", periodo_trabajo, contabilidad_trabajo, diaSel);
  },[periodo_trabajo, contabilidad_trabajo, diaSel, updateTrigger]);

  useEffect(()=>{
    setDatosCarga({
        id_anfitrion:params.id_anfitrion,
        id_invitado:params.id_invitado,
        periodo:periodo_trabajo,
        documento_id:contabilidad_trabajo,
        id_libro
    });
  },[periodo_trabajo, contabilidad_trabajo, id_libro]);  
  //////////////////////////////////////////////////////////
  /*useEffect( ()=> {
      
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
  */

  function moveColumn(array, fromIndex, toIndex) {
    const updated = [...array];
    const [moved] = updated.splice(fromIndex, 1); // saco columna
    updated.splice(toIndex, 0, moved);            // la inserto en nueva pos
    return updated;
  }

  //////////////////////////////////////////////////////////
    //Verificar que el resto de permisos de otros libros siempre esten FALSE
    //Solo el libro en cuestion, validara TRUE OR FALSE

  
  /*const cargaPeriodosAnfitrion = (strHistorialPeriodo) =>{
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
  }*/
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
  
const [resumenProductos, setResumenProductos] = useState(null);
const [showModalMostrarClonar, setShowModalMostrarClonar] = useState(false);

const comprobantesVigentes = movimientosVisibles
  .filter((movimiento) => movimiento.estado !== 'NULO')
  .map((movimiento) => movimiento.comprobante);

const abrirResumenProductos = () => {
  setResumenProductos({
    url: `${back_host}/ad_stockunidades/${periodo_trabajo}/${params.id_anfitrion}/${contabilidad_trabajo}/${diaSel}`,
    comprobantes: comprobantesVigentes,
  });
};

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
                                        onChange={(event) => {
                                          setFechaClon(event.target.value);
                                          setUpdateTrigger(Math.random());
                                        }}
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

      {resumenProductos && (
        <AdminStockProductosDialog
          {...resumenProductos}
          onClose={() => setResumenProductos(null)}
        />
      )}

      <Box sx={{ width: '100%', maxWidth: { xs: '100%', lg: 1280, xl: 1440 }, mx: 'auto', minWidth: 0, boxSizing: 'border-box', p: { xs: 1, md: 1.5, xl: 2 } }}>
        <TrHeader
          titulo="Movimientos de almacén"
          contador={movimientosVisibles.length}
          contadorTexto={`comprobantes visibles${contabilidad_nombre ? ` · ${contabilidad_nombre}` : ''}`}
          nuevoTexto="Nuevo"
          buscarTexto="RUC, razón social o comprobante"
          valorBusqueda={valorBusqueda}
          onBuscar={(event) => setValorBusqueda(event.target.value)}
          onNuevo={generaMovimiento}
          compactControles
          headerExtra={(
            <>
              {pVenta0104 && (
                <AppButton
                  icon={<Trash2 size={16} />}
                  onClick={() => handleDeleteOrigen(params.id_anfitrion, contabilidad_trabajo, periodo_trabajo, id_libro)}
                  sx={{
                    height: 38,
                    whiteSpace: 'nowrap',
                    '&:hover': {
                      backgroundColor: palette.dangerSoft,
                      borderColor: palette.danger,
                      color: palette.danger,
                    },
                  }}
                >
                  Eliminar masivo
                </AppButton>
              )}
              <BotonExcelVentas
                registrosdet={movimientosVisibles}
                icon={<FileSpreadsheet size={20} />}
                sx={exportButtonSx}
              />
              <AppButton
                icon={<Package size={16} />}
                disabled={!periodo_trabajo || !contabilidad_trabajo}
                onClick={abrirResumenProductos}
                sx={{ height: 38, whiteSpace: 'nowrap' }}
              >
                Resumen de productos
              </AppButton>
            </>
          )}
        />

        <TrFiltros
          periodoTrabajo={periodo_trabajo}
          periodoSelect={periodo_select}
          contabilidadTrabajo={contabilidad_trabajo}
          contabilidadSelect={contabilidad_select}
          onPeriodoSelect={handlePeriodoSelect}
          onContabilidadSelect={handleContabilidadSelect}
          compact
        />

        <Box sx={{ width: '100%', minWidth: 0, overflowX: 'auto' }}>
          <DaySelector period={periodo_trabajo} onDaySelect={handleDayFilter} />
        </Box>

        <TarjetasFiltroMovimiento
          value={filtroMovimiento}
          counts={conteosFiltros}
          onSelect={setFiltroMovimiento}
        />

        <Box
          sx={{
            mt: 1.15,
            minWidth: 0,
            maxWidth: '100%',
            overflow: 'hidden',
            borderRadius: isSmallScreen ? palette.radius.content : palette.radius.listCard,
            backgroundColor: palette.surface,
            p: isSmallScreen ? 0.25 : 0,
            '& .rdt_TableWrapper': { maxWidth: '100%', overflowX: 'auto' },
            '& .rdt_Table': { minWidth: isSmallScreen ? 960 : '100%' },
          }}
        >
          <Datatable
            theme="solarized"
            columns={columnas}
            data={movimientosVisibles}
            customStyles={ventaDesktopTableStyles}
            keyField="comprobante"
            onSelectedRowsChange={handleRowSelected}
            clearSelectedRows={toggleCleared}
            pagination
            paginationPerPage={15}
            paginationRowsPerPageOptions={[15, 50, 100]}
            paginationComponentOptions={{ rowsPerPageText: 'Filas por página:', rangeSeparatorText: 'de' }}
            selectableRowsComponent={Checkbox}
            sortIcon={<ArrowDownward />}
            highlightOnHover
            responsive
            noDataComponent="No hay movimientos para los filtros seleccionados"
          />
        </Box>
      </Box>

  </>
  );
}
