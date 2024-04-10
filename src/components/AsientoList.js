import React from 'react';
import { useEffect, useState, useMemo, useCallback } from "react"
import { Grid, Button,useMediaQuery,Select, MenuItem} from "@mui/material";
import { useNavigate,useParams } from "react-router-dom";
import DeleteIcon from '@mui/icons-material/Delete';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import FindIcon from '@mui/icons-material/FindInPage';
import UpdateIcon from '@mui/icons-material/UpdateSharp';
import Add from '@mui/icons-material/Add';
import FindInPageIcon from '@mui/icons-material/FindInPage';
import AddBoxIcon from '@mui/icons-material/AddBox';
import BoltIcon from '@mui/icons-material/Bolt';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import DownloadIcon from '@mui/icons-material/Download';

import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import FolderDeleteIcon from '@mui/icons-material/FolderDelete';          

import IconButton from '@mui/material/IconButton';
import swal from 'sweetalert';
import swal2 from 'sweetalert2'
import Datatable, {createTheme} from 'react-data-table-component';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import '../App.css';
import 'styled-components';
//import axios from 'axios';

//import { utils, writeFile } from 'xlsx';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import axios from 'axios';

import { useAuth0 } from '@auth0/auth0-react'; //new para cargar permisos luego de verificar registro en bd
import BotonExcelVentas from './BotonExcelVentas';
import { ComprasColumnas } from './ColumnasAsiento';
import { VentasColumnas } from './ColumnasAsiento';
import { CajaColumnas } from './ColumnasAsiento';
import { DiarioColumnas } from './ColumnasAsiento';
import AsientoFileInput from './AsientoFileInput';
import { saveAs } from 'file-saver';
import AsientoMensajeTotales from './AsientoMensajeTotales';

export default function AsientoList() {
  //Control de useffect en retroceso de formularios
  //verificamos si es pantalla pequeña y arreglamos el grid de fechas
  const isSmallScreen = useMediaQuery('(max-width: 600px)');
  //Seccion Dialog
  const [isDialogOpen, setDialogOpen] = useState(false);
  const handleCancel = () => {
    console.log('Operación cancelada');
    setDialogOpen(false);
  };
  const handleAccept = (buttonValue) => {
    console.log(`Operación aceptada con el botón: ${buttonValue}`);
    if (buttonValue==='aceptar1') {
      console.log(calcularSumatoriaMoneda('r_monto_total','PEN'));
      procesarSire('PEN')
    }
    if (buttonValue==='aceptar2') {
        console.log(calcularSumatoriaMoneda('r_monto_total','USD'));
        //Mostrar Totales Previos
        procesarSire('USD')
    }
    if (buttonValue==='aceptar3') {
      //procesarVacio
  }

    setDialogOpen(false);
  };
  const procesarSire=(r_moneda) =>{
    //Mostrar Totales Previos
    if (id_libro==='014'){
      swal2.fire({
        title: "Totales SIRE Ventas RVIE - "+ r_moneda,
        html: armaMensajeTotalesVenta(r_moneda),
        showDenyButton: true, // Mostrar botón "Cancelar"
        confirmButtonText: 'Aceptar', // Texto del botón "Aceptar"
        denyButtonText: 'Cancelar' // Texto del botón "Cancelar"
        }).then((result) => {
          if (result.isConfirmed) {
            convertirATextoSire(r_moneda);
          } else if (result.isDenied || result.isDismissed) {
            console.log("Usuario canceló el mensaje");
          }
        });
    }
    if (id_libro==='008'){
      swal2.fire({
        title: "Totales SIRE Compras RCE - " + r_moneda,
        html: armaMensajeTotalesCompra(r_moneda),
        showDenyButton: true, // Mostrar botón "Cancelar"
        confirmButtonText: 'Aceptar', // Texto del botón "Aceptar"
        denyButtonText: 'Cancelar' // Texto del botón "Cancelar"      
        }).then((result) => {
          if (result.isConfirmed) {
            convertirATextoSire(r_moneda);
          } else if (result.isDenied || result.isDismissed) {
            console.log("Usuario canceló el mensaje");
          }
        });
    }
  }

  const [buttons, setButtons] = useState([
    { text: 'PEN', value: 'aceptar1' },
    { text: 'USD', value: 'aceptar2' },
    { text: 'CERO', value: 'aceptar3' }
  ]); 

  const getButtonColor = (buttonValue) => {
    switch (buttonValue) {
      case 'aceptar1':
        return 'info'; 
      case 'aceptar2':
        return 'success';
      case 'aceptar3':
        return 'inherit';
      default:
        return 'inherit'; // Color predeterminado
    }
  };  
  //Fin Seccion Dialog

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
  ////////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////
  /*function exportToExcel(data) {
    const worksheet = utils.json_to_sheet(data);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Datos');
    writeFile(workbook, 'datos.xlsx');
  }*/

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
  
  const [sirecompras,setSireCompras] = useState([]);
  const [sireventas,setSireVentas] = useState([]);

  const [contabilidad_trabajo, setContabilidadTrabajo] = useState("");
  const [contabilidad_nombre, setContabilidadNombre] = useState("");
  const [contabilidad_select,setContabilidadesSelect] = useState([]);

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
  /*const columnasComunes = [
    {
      name: '',
      width: '40px',
      cell: (row) => (
        pVenta0101 ? (
          <DriveFileRenameOutlineIcon
            onClick={() => handleUpdate(row.num_asiento)}
            style={{
              cursor: 'pointer',
              color: 'skyblue',
              transition: 'color 0.3s ease',
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
          <DeleteIcon
            onClick={() => handleDelete(row.num_asiento)}
            style={{
              cursor: 'pointer',
              color: 'orange',
              transition: 'color 0.3s ease',
            }}
          />
      ),
      allowOverflow: true,
      button: true,
    },
  ];*/
  //Permisos Nivel 01 - Menus (toggleButton)
  const [permisos, setPermisos] = useState([]); //Menu
  const [permisoVentas, setPermisoVentas] = useState(false);
  const [permisoCompras, setPermisoCompras] = useState(false);
  const [permisoCaja, setPermisoCaja] = useState(false);
  const [permisoDiario, setPermisoDiario] = useState(false);
  const [permisoReportes, setPermisoReportes] = useState(false);

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

  const [pDiario0401, setPDiario0401] = useState(false); //Nuevo (Casi libre)
  const [pDiario0402, setPDiario0402] = useState(false); //Modificar (Restringido)
  const [pDiario0403, setPDiario0403] = useState(false); //Anular (Restringido)
  const [pDiario0404, setPDiario0404] = useState(false); //Eliminar (Casi Nunca solo el administrador)

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

  const handleUpdate = (num_asiento) => {
    //var num_asiento;
    //num_asiento = selectedRows.map(r => r.num_asiento);
    //console.log("libro:", id_libro);
    //console.log("asiento:", num_asiento);

    if (navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/BlackBerry/i) || navigator.userAgent.match(/Windows Phone/i)) {
      console.log("Estás usando un dispositivo móvil!!");
      //Validamos libro a mostrar
      if (id_libro === "008") {
        navigate(`/asientoc/${params.id_anfitrion}/${params.id_invitado}/${periodo_trabajo}/${contabilidad_trabajo}/${id_libro}/${num_asiento}/edit`);
      }
      if (id_libro === "014") {
        navigate(`/asientov/${params.id_anfitrion}/${params.id_invitado}/${periodo_trabajo}/${contabilidad_trabajo}/${id_libro}/${num_asiento}/edit`);
      }
    } else {
      console.log("No estás usando un móvil");
      if (id_libro === "008") {
        navigate(`/asientoc/${params.id_anfitrion}/${params.id_invitado}/${periodo_trabajo}/${contabilidad_trabajo}/${id_libro}/${num_asiento}/edit`);
      }
      if (id_libro === "014") {
        navigate(`/asientov/${params.id_anfitrion}/${params.id_invitado}/${periodo_trabajo}/${contabilidad_trabajo}/${id_libro}/${num_asiento}/edit`);
      }
    }    
  };
  const handleDelete = (num_asiento) => {
    console.log(num_asiento);
    
    confirmaEliminacion(params.id_anfitrion,contabilidad_trabajo,periodo_trabajo,id_libro,num_asiento);
  };
  const confirmaEliminacion = async(sAnfitrion,sDocumentoId,sPeriodo,sLibro,sAsiento)=>{
    await swal({
      title:"Eliminar Asiento",
      text:"Seguro ?",
      icon:"warning",
      buttons:["No","Si"]
    }).then(respuesta=>{
        if (respuesta){
          //console.log(cod,serie,num,elem,item);
          eliminarRegistroSeleccionado(sAnfitrion,sDocumentoId,sPeriodo,sLibro,sAsiento);
          setToggleCleared(!toggleCleared);
          setRegistrosdet(registrosdet.filter(
                          registrosdet => registrosdet.num_asiento !== sAsiento
                          ));
          setTimeout(() => { // Agrega una función para que se ejecute después del tiempo de espera
              setUpdateTrigger(Math.random());//experimento
          }, 200);
                        
          swal({
            text:"Venta se ha eliminado con exito",
            icon:"success",
            timer:"2000"
          });
      }
    })
  }
  const eliminarRegistroSeleccionado = async (sAnfitrion,sDocumentoId,sPeriodo,sLibro,sAsiento) => {
    console.log(`${back_host}/asiento/${sAnfitrion}/${sDocumentoId}/${sPeriodo}/${sLibro}/${sAsiento}`);
    //En ventas solo se eliminan, detalle-cabecera
      await fetch(`${back_host}/asiento/${sAnfitrion}/${sDocumentoId}/${sPeriodo}/${sLibro}/${sAsiento}`, {
        method:"DELETE"
      });
  }
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
      cargaRegistro(valorVista,periodo_trabajo,contabilidad_trabajo);
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

  const armaMensajeTotalesVenta = (r_moneda) => {
    let strMensaje;
    strMensaje =  `
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 2px;">
      <div style="text-align: left;">
        <p style="margin: 2px 0;">Exportacion:</p>
        <p style="margin: 2px 0;">Base Imponible:</p>
        <p style="margin: 2px 0;">Descuentos Base:</p>
        <p style="margin: 2px 0;">Exonerado:</p>
        <p style="margin: 2px 0;">Inafecta:</p>
        <p style="margin: 2px 0;">ISC:</p>
        <p style="margin: 2px 0;">IGV:</p>
        <p style="margin: 2px 0;">Descuentos IGV:</p>
        <p style="margin: 2px 0;">Base IVAP:</p>
        <p style="margin: 2px 0;">IVAP:</p>
        <p style="margin: 2px 0;">ICBP:</p>
        <p style="margin: 2px 0;">Otros:</p>
        <p style="margin: 2px 0;">Total:</p>
        <p style="margin: 2px 0;">Filas Validas:</p>
      </div>
      <div style="text-align: left;">
        <p style="margin: 2px 0;">${calcularSumatoriaMoneda('export',r_moneda)}</p>
        <p style="margin: 2px 0;">${calcularSumatoriaMoneda('base',r_moneda)}</p>
        <p style="margin: 2px 0;">0.00</p>
        <p style="margin: 2px 0;">${calcularSumatoriaMoneda('exonera',r_moneda)}</p>
        <p style="margin: 2px 0;">${calcularSumatoriaMoneda('inafecta',r_moneda)}</p>
        <p style="margin: 2px 0;">0.00</p>
        <p style="margin: 2px 0;">${calcularSumatoriaMoneda('igv',r_moneda)}</p>
        <p style="margin: 2px 0;">0.00</p>
        <p style="margin: 2px 0;">0.00</p>
        <p style="margin: 2px 0;">0.00</p>
        <p style="margin: 2px 0;">${calcularSumatoriaMoneda('r_monto_icbp',r_moneda)}</p>
        <p style="margin: 2px 0;">${calcularSumatoriaMoneda('r_monto_otros',r_moneda)}</p>
        <p style="margin: 2px 0;">${calcularSumatoriaMoneda('r_monto_total',r_moneda)}</p>
        <p style="margin: 2px 0;">${calcularSumatoriaFilasMoneda(r_moneda)}</p>
      </div>
    </div>
    `;
    return strMensaje;
  };

  const armaMensajeTotalesCompra = (r_moneda) => {
    let strMensaje;
    strMensaje =  `
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 2px;">
      <div style="text-align: left;">
        <p style="margin: 2px 0;">Base(A):</p>
        <p style="margin: 2px 0;">Igv(A):</p>
        <p style="margin: 2px 0;">Base(B):</p>
        <p style="margin: 2px 0;">Igv(B):</p>
        <p style="margin: 2px 0;">Base(C):</p>
        <p style="margin: 2px 0;">Igv(C):</p>
        <p style="margin: 2px 0;">No Gravadas:</p>
        <p style="margin: 2px 0;">ISC:</p>
        <p style="margin: 2px 0;">ICBP:</p>
        <p style="margin: 2px 0;">Otros:</p>
        <p style="margin: 2px 0;">Total:</p>
        <p style="margin: 2px 0;">Filas Validas:</p>
      </div>
      <div style="text-align: left;">
        <p style="margin: 2px 0;">${calcularSumatoriaMoneda('r_base001',r_moneda)}</p>
        <p style="margin: 2px 0;">${calcularSumatoriaMoneda('r_igv001',r_moneda)}</p>
        <p style="margin: 2px 0;">${calcularSumatoriaMoneda('r_base002',r_moneda)}</p>
        <p style="margin: 2px 0;">${calcularSumatoriaMoneda('r_igv002',r_moneda)}</p>
        <p style="margin: 2px 0;">${calcularSumatoriaMoneda('r_base003',r_moneda)}</p>
        <p style="margin: 2px 0;">${calcularSumatoriaMoneda('r_igv003',r_moneda)}</p>
        <p style="margin: 2px 0;">${calcularSumatoriaMoneda('r_base004',r_moneda)}</p>
        <p style="margin: 2px 0;">${calcularSumatoriaMoneda('r_monto_isc',r_moneda)}</p>
        <p style="margin: 2px 0;">${calcularSumatoriaMoneda('r_monto_icbp',r_moneda)}</p>
        <p style="margin: 2px 0;">${calcularSumatoriaMoneda('r_monto_otros',r_moneda)}</p>
        <p style="margin: 2px 0;">${calcularSumatoriaMoneda('r_monto_total',r_moneda)}</p>
        <p style="margin: 2px 0;">${calcularSumatoriaFilasMoneda(r_moneda)}</p>
      </div>
    </div>
    `;
    return strMensaje;
  };
  
  const handleMensajeTotales = () => {
    if (isDialogOpen) {
      setDialogOpen(false);
    }else{
      
      //Calcular sumatorias y habilitar Botones
      const soles = calcularSumatoriaMoneda('r_monto_total','PEN');
      const dolares = calcularSumatoriaMoneda('r_monto_total','USD');
      //console.log(soles,dolares);

      // Eliminar el botón 'PEN' si soles es igual a '0.00'
      if (soles === '0.00') {
        setButtons(prevButtons => prevButtons.filter(button => button.text !== 'PEN'));
      }
      // Eliminar el botón 'USD' si dolares es igual a '0.00'
      if (dolares === '0.00') {
        setButtons(prevButtons => prevButtons.filter(button => button.text !== 'USD'));
      }
      // Eliminar el botón 'CERO' si tanto soles como dolares no son iguales a '0.00'
      if (soles !== '0.00' && dolares !== '0.00') {
        setButtons(prevButtons => prevButtons.filter(button => button.text !== 'CERO'));
      }      
      //console.log(buttons);
      setDialogOpen(true);
    }
  };

  const convertirATextoSire = async(moneda) => {
    //Solo actualizamos estados, y el useeffect se encarga de completar proceso
    let response;
    let nombreArchivoSire;
    let codM;
    const partes = periodo_trabajo.split('-');
    const periodoAno = partes[0];
    const periodoMes = partes[1];
    if (moneda==='PEN') {codM = '1';}
    if (moneda==='USD') {codM = '2';}

    if (id_libro==='008'){
      nombreArchivoSire = 'LE'+ contabilidad_trabajo+periodoAno+periodoMes+'00080400'+'02'+'11'+ codM + '2'+'.TXT';
      response = await fetch(`${back_host}/sire/compras/${params.id_anfitrion}/${contabilidad_trabajo}/${contabilidad_nombre}/${periodo_trabajo}/${moneda}`);
    }
    if (id_libro==='014'){
      nombreArchivoSire = 'LE'+ contabilidad_trabajo+periodoAno+periodoMes+'00140400'+'02'+'11'+ codM + '2'+'.TXT';
      response = await fetch(`${back_host}/sire/ventas/${params.id_anfitrion}/${contabilidad_trabajo}/${contabilidad_nombre}/${periodo_trabajo}/${moneda}`);
    }
    if (response.ok) {
      const data = await response.json();
      console.log("Datos obtenidos:", data);
      procesaArchivoTexto(data, nombreArchivoSire);
    } else {
      console.error("Error al obtener datos. Código de respuesta:", response.status);
    }    
  };
  const procesaArchivoTexto = (datostexto,nombreArchivoSire) =>{
    var texto;

    texto = datostexto.map(item => {
      return Object.values(item).join('|');
    }).join('\n');

    // Crear un blob con los datos de texto
    const blob = new Blob([texto], { type: 'text/plain' });

    // Crear una URL para el blob
    const url = URL.createObjectURL(blob);

    // Crear un enlace invisible para descargar el archivo
    const enlaceDescarga = document.createElement('a');
    enlaceDescarga.href = url;
    enlaceDescarga.download = nombreArchivoSire;

    // Simular un clic en el enlace para iniciar la descarga
    document.body.appendChild(enlaceDescarga);
    enlaceDescarga.click();

    // Limpiar después de la descarga
    document.body.removeChild(enlaceDescarga);
    URL.revokeObjectURL(url);
  }

  // Función que se pasa como prop al componente.js
  const handleActualizaImportaOK = () => {
    
    console.log('valorVista,periodo_trabajo,contabilidad_trabajo:', valorVista,periodo_trabajo,contabilidad_trabajo);
    cargaRegistro(valorVista,periodo_trabajo,contabilidad_trabajo);
    setUpdateTrigger(Math.random());//experimento para actualizar el dom
    // Puedes realizar otras operaciones con la cantidad de filas si es necesario
  };
  
  ///////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////
  const cargaRegistro = async (strHistorialValorVista,strHistorialPeriodo,strHistorialContabilidad) => {
    var response;
    //Cargamos asientos correspondientes al id_usuario,contabilidad y periodo
    //Pero asi es mas facil, porque todo esta en valorVista ... muaaaaaa
    //console.log(`${back_host}/asiento/${valorVista}/${params.id_anfitrion}/${params.id_invitado}/${params.periodo}/${params.documento_id}`);
    //console.log(`${back_host}/asiento/${valorVista}/${params.id_anfitrion}/${params.id_invitado}/${periodo_trabajo}/${contabilidad_trabajo}`);
    if (strHistorialValorVista==='' || strHistorialValorVista===undefined || strHistorialValorVista===null){
        response = await fetch(`${back_host}/asiento/${valorVista}/${params.id_anfitrion}/${params.id_invitado}/${periodo_trabajo}/${contabilidad_trabajo}`);
    }
    else{
        //usamos los historiales
        //console.log("historiales cargaRegistro");
        console.log(`${back_host}/asiento/${strHistorialValorVista}/${params.id_anfitrion}/${params.id_invitado}/${strHistorialPeriodo}/${strHistorialContabilidad}`);
        response = await fetch(`${back_host}/asiento/${strHistorialValorVista}/${params.id_anfitrion}/${params.id_invitado}/${strHistorialPeriodo}/${strHistorialContabilidad}`);
    }
    
    const data = await response.json();
    setRegistrosdet(data);
    setTabladet(data); //Copia para tratamiento de filtrado
    //console.log("data", data);
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
  /*const filtrar=(strBusca)=>{
      var resultadosBusqueda = [];
      resultadosBusqueda = tabladet.filter((elemento) => {
        if (elemento.r_razon_social.toString().toLowerCase().includes(strBusca.toLowerCase())
         || elemento.r_documento_id.toString().toLowerCase().includes(strBusca.toLowerCase())
         || elemento.comprobante.toString().toLowerCase().includes(strBusca.toLowerCase())
          ){
              return elemento;
          }
      });
      setRegistrosdet(resultadosBusqueda);
  }*/
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

      setPCompra0201(true); //nuevo
      setPCompra0202(true); //modificar
      setPCompra0203(true); //eliminar
      setPCompra0204(true); //eliminar masivo

      setPCaja0301(true); //nuevo
      setPCaja0302(true); //modificar
      setPCaja0303(true); //eliminar
      setPCaja0304(true); //eliminar masivo

      setPDiario0401(true); //nuevo
      setPDiario0402(true); //modificar
      setPDiario0403(true); //eliminar
      setPDiario0404(true); //eliminar masivo
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
          tienePermiso = permisosData.some(permiso => permiso.id_comando === '01-01'); //Nuevo
          if (tienePermiso) {
            setPVenta0101(true);
          }

          tienePermiso = permisosData.some(permiso => permiso.id_comando === '01-02'); //Modificar
          if (tienePermiso) {
            setPVenta0102(true);
          }else {setPVenta0102(false);}

          tienePermiso = permisosData.some(permiso => permiso.id_comando === '01-03'); //Eliminar
          if (tienePermiso) {
            setPVenta0103(true);
          }else {setPVenta0103(false);}

          tienePermiso = permisosData.some(permiso => permiso.id_comando === '01-04'); //Eliminar Masivo
          if (tienePermiso) {
            setPVenta0104(true);
          }else {setPVenta0104(false);}
          ////////////////////////////////////////////////
          tienePermiso = permisosData.some(permiso => permiso.id_comando === '02-01'); //Nuevo
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
          }else {setPCaja0304(false);}
          ////////////////////////////////////////////////
          tienePermiso = permisosData.some(permiso => permiso.id_comando === '04-01'); //Nuevo
          if (tienePermiso) {
            setPDiario0401(true);
          }
          tienePermiso = permisosData.some(permiso => permiso.id_comando === '04-02'); //Modificar
          if (tienePermiso) {
            setPDiario0402(true);
          }else {setPDiario0402(false);}
          tienePermiso = permisosData.some(permiso => permiso.id_comando === '04-03'); //Eliminar
          if (tienePermiso) {
            setPDiario0403(true);
          }else {setPDiario0403(false);}
          tienePermiso = permisosData.some(permiso => permiso.id_comando === '04-04'); //Eliminar Masivo
          if (tienePermiso) {
            setPDiario0404(true);
          }else {setPDiario0404(false);}

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
      cargaPermisosMenuComando('01'); //Por default, la 1era vez
      setValorVista('ventas'); //Por default, la 1era vez
      //st_valorVista = 'ventas'; //new 
      }else{
      setValorVista(st_valorVista);
      }
      if (st_valorVista === 'ventas') {cargaPermisosMenuComando('01');}
      if (st_valorVista === 'compras') {cargaPermisosMenuComando('02');}
      if (st_valorVista === 'caja') {cargaPermisosMenuComando('03');}
      if (st_valorVista === 'diario') {cargaPermisosMenuComando('04');}

      //fcuando carga x primera vez, sale vacio ... arreglar esto
      cargaRegistro(st_valorVista,periodo_trabajo,contabilidad_trabajo);

  },[updateTrigger]) //Aumentamos

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
      columnasEspecificas = VentasColumnas;
    }else{
      columnasEspecificas = 
          st_valorVista === 'ventas' ? VentasColumnas
        : st_valorVista === 'compras' ? ComprasColumnas
        : st_valorVista === 'caja' ? CajaColumnas
        : DiarioColumnas;
    }

    //console.log('permisosComando pVenta0103 cargado: ',pVenta0103);
    //console.log('permisosComando pCompra0203 cargado: ',pCompra0203);
    cargaColumnasComunes();        
    //console.log('columnas comunes: ', columnasComunes);
    setColumnas([...columnasComunes, ...columnasEspecificas]);
    
    //cuando carga x primera vez, sale vacio ... arreglar esto
    //cargaRegistro(st_valorVista,st_periodo_trabajo,st_contabilidad_trabajo); //anterior falla 1era vez
    cargaRegistro(st_valorVista,periodo_trabajo,contabilidad_trabajo); //new cambio

    //Datos listos en caso de volver por aqui, para envio
    setDatosCarga(prevState => ({ ...prevState, id_anfitrion: params.id_anfitrion }));
    setDatosCarga(prevState => ({ ...prevState, periodo: st_periodo_trabajo }));
    setDatosCarga(prevState => ({ ...prevState, documento_id: st_contabilidad_trabajo }));
    setDatosCarga(prevState => ({ ...prevState, id_libro: st_id_libro }));
    setDatosCarga(prevState => ({ ...prevState, id_invitado: params.id_invitado }));

  },[permisosComando, pVenta0101, pCompra0201, pCaja0301, pDiario0401, valorVista]) //Solo cuando este completo estado


  //////////////////////////////////////////////////////////
  const cargaColumnasComunes = () =>{
    //Verificar que el resto de permisos de otros libros siempre esten FALSE
    //Solo el libro en cuestion, validara TRUE OR FALSE

    columnasComunes = [
      {
        name: '',
        width: '40px',
        cell: (row) => (
          (pVenta0102 || pCompra0202 || pCaja0302 || pDiario0402) ? (
            <DriveFileRenameOutlineIcon
              onClick={() => handleUpdate(row.num_asiento)}
              style={{
                cursor: 'pointer',
                color: 'skyblue',
                transition: 'color 0.3s ease',
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
          (pVenta0103 || pCompra0203 || pCaja0303 || pDiario0403) ? (
            <DeleteIcon
              onClick={() => handleDelete(row.num_asiento)}
              style={{
                cursor: 'pointer',
                color: 'orange',
                transition: 'color 0.3s ease',
              }}
            />
          ) : null
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
      setPermisoDiario(true);
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
          tienePermiso = permisosData.some(permiso => permiso.id_menu === '04');
          if (tienePermiso) {
            setPermisoDiario(true);
          }
          tienePermiso = permisosData.some(permiso => permiso.id_menu === '05');
          if (tienePermiso) {
            setPermisoReportes(true);
          }
        })
        .catch(error => {
          console.log('Error al obtener los permisos:', error);
        });
    }
  };

  const handleDescargarExcelVacio = async () => {
    // Question view id_libro
    let filePath;
    let fileName;
    console.log(id_libro);
    if (id_libro==='014'){
      filePath = '/reg_ventas_xpertcont.xlsx';
      // Nombre del archivo para la descarga
      fileName = 'reg_ventas_xpertcont.xlsx';
    }
    if (id_libro==='008'){
      filePath = '/reg_compras_xpertcont.xlsx';
      // Nombre del archivo para la descarga
      fileName = 'reg_compras_xpertcont.xlsx';
    }

    // URL completa del archivo
    const fileUrl = process.env.PUBLIC_URL + filePath;

    try {
      // Realizar la solicitud para obtener el archivo usando axios
      const response = await axios.get(fileUrl, { responseType: 'blob' });

      // Utilizar file-saver para descargar el archivo
      saveAs(response.data, fileName);
    } catch (error) {
      console.error('Error al descargar el archivo:', error);
    }
  };
  //////////////////////////////////////////////////////////


 return (
  <>
  <Grid container
        direction={isSmallScreen ? 'column' : 'row'}
        //alignItems={isSmallScreen ? 'center' : 'center'}
        justifyContent={isSmallScreen ? 'center' : 'center'}
  >

      <Grid container spacing={0}
          direction={isSmallScreen ? 'column' : 'row'}
          alignItems={isSmallScreen ? 'center' : 'center'}
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
      </Grid>

  </Grid>

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
      <ToggleButton value="ventas">L-Ventas</ToggleButton>
      ):(
      <span></span>
      )
    }

    { permisoCompras ?
      (    
    <ToggleButton value="compras">L-Compras</ToggleButton>
    ):(
      <span></span>
      )
    }

    { permisoCaja ?
    (
    <ToggleButton value="caja">L-Caja</ToggleButton>
    ):(
      <span></span>
      )
    }

    { permisoDiario ?
    (
    <ToggleButton value="diario">L-Diario</ToggleButton>
    ):(
      <span></span>
      )
    }

    <ToggleButton value="reporte">Reportes</ToggleButton>

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
                            style={{ padding: '0px', color: 'skyblue' }}
                            onClick={() => {
                              if (navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/BlackBerry/i) || navigator.userAgent.match(/Windows Phone/i)) {
                                //Validamos libro a registrar
                                if (id_libro === "008") {
                                  navigate(`/asientoc/${params.id_anfitrion}/${params.id_invitado}/${periodo_trabajo}/${contabilidad_trabajo}/${id_libro}/new`);
                                }
                                if (id_libro === "014") {
                                  navigate(`/asientov/${params.id_anfitrion}/${params.id_invitado}/${periodo_trabajo}/${contabilidad_trabajo}/${id_libro}/new`);
                                }
                              } else {
                                //navigate(`/ventamovil/new`);
                                if (id_libro === "008") {
                                  navigate(`/asientoc/${params.id_anfitrion}/${params.id_invitado}/${periodo_trabajo}/${contabilidad_trabajo}/${id_libro}/new`);
                                }
                                if (id_libro === "014") {
                                  navigate(`/asientov/${params.id_anfitrion}/${params.id_invitado}/${periodo_trabajo}/${contabilidad_trabajo}/${id_libro}/new`);
                                }
                              }
                            }}
            >
                  <AddBoxIcon style={{ fontSize: '40px' }}/>
            </IconButton>
          </Tooltip>
        </Grid>

        <Grid item xs={isSmallScreen ? 1.2 : 0.5}  >    
          { (pVenta0104 || pCompra0204 || pCaja0304 || pDiario0404) ? (

            <Tooltip title='ELIMINAR MASIVO' >
            <IconButton color="warning" 
                            //style={{ padding: '0px'}}
                            style={{ padding: '0px', color: 'skyblue' }}
                            onClick={() => {
                              handleDeleteOrigen(params.id_anfitrion,contabilidad_trabajo,periodo_trabajo,id_libro)
                            }}
            >
                  <FolderDeleteIcon style={{ fontSize: '40px' }}/>
            </IconButton>
            </Tooltip>

          ):(
            <div></div>
          )
          }
        </Grid>

        <Grid item xs={isSmallScreen ? 1.2 : 0.5} >
            <Tooltip title='DESCARGA XLS VACIO' >
            <IconButton color="success" 
                            //style={{ padding: '0px'}}
                            style={{ padding: '0px', color: 'skyblue' }}
                            onClick={() => {
                                  handleDescargarExcelVacio();
                            }}
            >
                  <KeyboardDoubleArrowDownIcon style={{ fontSize: '40px' }}/>
            </IconButton>
            </Tooltip>
        </Grid>

        <Grid item xs={isSmallScreen ? 1.2 : 0.5} >
          <Tooltip title='GENERAR ASIENTOS' >
          <IconButton color="inherit" 
                            style={{ padding: '0px'}}
                            //style={{ padding: '0px', color: 'skyblue' }}
                            onClick={() => {
                              navigate(`/asientogenerador/${params.id_anfitrion}/${params.id_invitado}/${periodo_trabajo}/${contabilidad_trabajo}/${id_libro}`);
                            }}
            >
              <PlaylistAddCheckIcon style={{ fontSize: '40px' }}/>
            </IconButton>
          </Tooltip>
        </Grid>

        <Grid item xs={isSmallScreen ? 1.2 : 0.5} >
          <Tooltip title='EXPORTAR LIBRO XLS' >
            <BotonExcelVentas registrosdet={registrosdet} 
            />
          </Tooltip>
        </Grid>

        <Grid item xs={isSmallScreen ? 1.2 : 0.5} >    
          {(id_libro==='014' || id_libro==='008') ? 
            (
            <Tooltip title='SIRE vs SISTEMA' >
              <IconButton color="primary" 
                          style={{ padding: '0px' }}
                          onClick={() => {
                            navigate(`/sirecomparacion/${params.id_anfitrion}/${params.id_invitado}/${periodo_trabajo}/${contabilidad_trabajo}/${id_libro}`);
                            }
                          }
              >
                    <FindInPageIcon style={{ fontSize: '40px' }}/>
              </IconButton>
            </Tooltip>
            ):
            (
              <div></div>
            )
          }
        </Grid>

        <Grid item xs={isSmallScreen ? 2 : 0.7}>    
          <Tooltip title='GENERAR REEMPLAZO' >
            {(id_libro==='014' || id_libro==='008') ? 
            (
              <Button variant='contained' 
                      fullWidth
                      color='primary'
                      sx={{display:'block',margin:'.0rem 0'}}
                      onClick={() => {
                        handleMensajeTotales();
                        }
                      }
                      >
                  {(id_libro==='014') ? 
                  (
                    'RVIE'
                  ):
                  (
                    'RCE'
                  )
                  }
              </Button>
            )
            :
            (
              <div></div>
            )
            }
          </Tooltip>
        </Grid>
        
        {/* El componente del cuadro de diálogo */}
        {isDialogOpen && (
        
        <Grid item xs={isSmallScreen ? 12 : 8.8}>
            <AsientoMensajeTotales
            title="Selecciona una opción"
            buttons={buttons}
            getButtonColor={getButtonColor}
            onCancel={handleCancel}
            onAccept={handleAccept}
          />
        </Grid>

        )}

    <Grid item xs={isSmallScreen ? 12 : 8.3}>
      {(id_libro==='014' || id_libro==='008') ? 
        (
        <AsientoFileInput datosCarga={datosCarga} onActualizaImportaOK={handleActualizaImportaOK}></AsientoFileInput>
        )
        :
        (
          <div></div>
        )
      }
    </Grid>

    <Grid item xs={isSmallScreen ? 12 : 12} >
        <TextField fullWidth variant="outlined" color="success" size="small"
                                    //label="FILTRAR"
                                    sx={{display:'block',
                                          margin:'.0rem 0'}}
                                    name="busqueda"
                                    placeholder='Filtro:  Ruc   Razon Social   Comprobante'
                                    onChange={actualizaValorFiltro}
                                    inputProps={{ style:{color:'white'} }}
                                    InputProps={{
                                        startAdornment: (
                                          <InputAdornment position="start">
                                            <FindIcon />
                                          </InputAdornment>
                                        ),
                                        style:{color:'white'} 
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
