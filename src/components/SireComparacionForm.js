import React from 'react';
import { useEffect, useState, useMemo, useCallback } from "react"
import { Grid, Button,useMediaQuery,Select, MenuItem} from "@mui/material";
import { useNavigate,useParams } from "react-router-dom";
import FindIcon from '@mui/icons-material/FindInPage';
import UpdateIcon from '@mui/icons-material/UpdateSharp';
import Add from '@mui/icons-material/Add';
import FindInPageIcon from '@mui/icons-material/FindInPage';

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
import Tooltip from '@mui/material/Tooltip';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import LibraryAddIcon from '@mui/icons-material/LibraryAdd';
import LibraryAddRoundedIcon from '@mui/icons-material/LibraryAddRounded';
import LibraryAddCheckRoundedIcon from '@mui/icons-material/LibraryAddCheckRounded';
import axios from 'axios';

import { useAuth0 } from '@auth0/auth0-react'; //new para cargar permisos luego de verificar registro en bd
import BotonExcelVentas from './BotonExcelVentas';

export default function SireComparacionForm() {
  //Control de useffect en retroceso de formularios
  //verificamos si es pantalla pequeña y arreglamos el grid de fechas
  const isSmallScreen = useMediaQuery('(max-width: 600px)');
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

  // Agrega íconos al inicio de cada columna
  let columnasComunes;
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
      if (params.id_libro === "008") {
        navigate(`/asientoc/${params.id_anfitrion}/${params.id_invitado}/${params.periodo}/${params.documento_id}/${params.id_libro}/${num_asiento}/edit`);
      }
      if (params.id_libro === "014") {
        navigate(`/asientov/${params.id_anfitrion}/${params.id_invitado}/${params.periodo}/${params.documento_id}/${params.id_libro}/${num_asiento}/edit`);
      }
    } else {
      console.log("No estás usando un móvil");
      if (params.id_libro === "008") {
        navigate(`/asientoc/${params.id_anfitrion}/${params.id_invitado}/${params.periodo}/${params.documento_id}/${params.id_libro}/${num_asiento}/edit`);
      }
      if (params.id_libro === "014") {
        navigate(`/asientov/${params.id_anfitrion}/${params.id_invitado}/${params.periodo}/${params.documento_id}/${params.id_libro}/${num_asiento}/edit`);
      }
    }    
  };

  const calcularSumatoria = (columna) => {
    return registrosdet.reduce((acumulador, fila) => {
      const valorColumna = fila[columna];
      // Verificar si el valor no es nulo y es numérico antes de sumarlo
      if (valorColumna !== null && !isNaN(valorColumna)) {
        return acumulador + parseFloat(valorColumna);
      } else {
        return acumulador;
      }
    }, 0).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  };
  const handleMensajeTotales = () => {
    if (id_libro==='014'){
      swal2.fire({
        title: "Totales SIRE Ventas 14.01",
        html: `
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
            <p style="margin: 2px 0;">${calcularSumatoria('export')}</p>
            <p style="margin: 2px 0;">${calcularSumatoria('base')}</p>
            <p style="margin: 2px 0;">0.00</p>
            <p style="margin: 2px 0;">${calcularSumatoria('exonera')}</p>
            <p style="margin: 2px 0;">${calcularSumatoria('inafecta')}</p>
            <p style="margin: 2px 0;">0.00</p>
            <p style="margin: 2px 0;">${calcularSumatoria('igv')}</p>
            <p style="margin: 2px 0;">0.00</p>
            <p style="margin: 2px 0;">0.00</p>
            <p style="margin: 2px 0;">0.00</p>
            <p style="margin: 2px 0;">${calcularSumatoria('r_monto_icbp')}</p>
            <p style="margin: 2px 0;">${calcularSumatoria('r_monto_otros')}</p>
            <p style="margin: 2px 0;">${calcularSumatoria('r_monto_total')}</p>
            <p style="margin: 2px 0;">${registrosdet.length}</p>
          </div>
        </div>
      `                       
      });
    }
    if (id_libro==='008'){
      swal2.fire({
        title: "Totales SIRE Compras 08.01",
        html: `
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
            <p style="margin: 2px 0;">${calcularSumatoria('r_base001')}</p>
            <p style="margin: 2px 0;">${calcularSumatoria('r_igv001')}</p>
            <p style="margin: 2px 0;">${calcularSumatoria('r_base002')}</p>
            <p style="margin: 2px 0;">${calcularSumatoria('r_igv002')}</p>
            <p style="margin: 2px 0;">${calcularSumatoria('r_base003')}</p>
            <p style="margin: 2px 0;">${calcularSumatoria('r_igv003')}</p>
            <p style="margin: 2px 0;">${calcularSumatoria('r_base004')}</p>
            <p style="margin: 2px 0;">${calcularSumatoria('r_monto_isc')}</p>
            <p style="margin: 2px 0;">${calcularSumatoria('r_monto_icbp')}</p>
            <p style="margin: 2px 0;">${calcularSumatoria('r_monto_otros')}</p>
            <p style="margin: 2px 0;">${calcularSumatoria('r_monto_total')}</p>
            <p style="margin: 2px 0;">${registrosdet.length}</p>
          </div>
        </div>
      `                       
      });
    }
    
  };
  const convertirATextoSire = async() => {
    var texto;
    if (id_libro==='008'){
      cargaSireCompras();
      texto = sirecompras.map(item => {
        return Object.values(item).join('|');
      }).join('\n');
    }
    if (id_libro==='014'){
      texto = sireventas.map(item => {
        return Object.values(item).join('|');
      }).join('\n');
    }

    // Crear un blob con los datos de texto
    const blob = new Blob([texto], { type: 'text/plain' });

    // Crear una URL para el blob
    const url = URL.createObjectURL(blob);

    // Crear un enlace invisible para descargar el archivo
    const enlaceDescarga = document.createElement('a');
    enlaceDescarga.href = url;
    enlaceDescarga.download = 'datos.txt';

    // Simular un clic en el enlace para iniciar la descarga
    document.body.appendChild(enlaceDescarga);
    enlaceDescarga.click();

    // Limpiar después de la descarga
    document.body.removeChild(enlaceDescarga);
    URL.revokeObjectURL(url);
  };
  const cargaSireCompras = async () => {
    const response = await fetch(`${back_host}/sire/compras/${params.id_anfitrion}/${contabilidad_trabajo}/${contabilidad_nombre}/${periodo_trabajo}`);
    
    const data = await response.json();
    setSireCompras(data);
  }
  const cargaSireVentas = async () => {
    const response = await fetch(`${back_host}/sire/compras/${params.id_anfitrion}/${contabilidad_trabajo}/${contabilidad_nombre}/${periodo_trabajo}`);
    
    const data = await response.json();
    setSireVentas(data);
  }
  // Función que se pasa como prop al componente.js
  const handleActualizaImportaOK = () => {
    
    console.log('valorVista,periodo_trabajo,contabilidad_trabajo:', valorVista,periodo_trabajo,contabilidad_trabajo);
    cargaRegistro();
    setUpdateTrigger(Math.random());//experimento para actualizar el dom
    // Puedes realizar otras operaciones con la cantidad de filas si es necesario
  };
  
  ///////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////
  const cargaRegistro = async () => {
    var response;
    //Cargamos asientos correspondientes al id_usuario,contabilidad y periodo
    response = await fetch(`${back_host}/asientosirecompara/${params.id_anfitrion}/${params.id_invitado}/${params.periodo}/${params.documento_id}/${params.id_libro}`);

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
  const filtrar=(strBusca)=>{
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
  }

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
     
      /////////////////////////////
      //NEW codigo para autenticacion y permisos de BD
      if (isAuthenticated && user && user.email) {
        cargaPermisosMenu(); //carga permisos menus
      }
  },[isAuthenticated, user]) //Aumentamos IsAuthenticated y user

  useEffect( ()=> {
      //Carga por cada cambio de seleccion en toggleButton
      console.log('2do useeffect');

      //fcuando carga x primera vez, sale vacio ... arreglar esto
      cargaRegistro();

  },[updateTrigger]) //Aumentamos

  useEffect( ()=> {
    //Carga de Registros con permisos
    console.log('3ero useeffect ');
    cargaPermisosMenuComando();

    cargaColumnasComunes();
    //console.log('columnas comunes: ', columnasComunes);
    setColumnas([...columnasComunes]);
    
    //cuando carga x primera vez, sale vacio ... arreglar esto
    cargaRegistro();

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
          ((pVenta0102 || pCompra0202 || pCaja0302 || pDiario0402) && row.resultado==='SIRE - XPERT' ) ? (
            <Tooltip title='Clonar Registro Sire'>
            <LibraryAddRoundedIcon
              onClick={() => handleUpdate(row.num_asiento)}
              style={{
                cursor: 'pointer',
                color: 'skyblue',
                transition: 'color 0.3s ease',
              }}
            />
          </Tooltip>
          ) : null
        ),
        allowOverflow: true,
        button: true,
      },
      {//origen
        name: 'Origen',
        selector: 'resultado',
        width: '110px',
        sortable: true,
      },
      {//05
        name: 'Emision',
        selector: 'r_fecemi',
        width: '100px',
        sortable: true,
      },
      {//06
        name: 'Vcto',
        selector: 'fecvcto',
        width: '100px',
        sortable: true,
      },
      {//07-08-10
        name: 'Comprobante',
        selector: 'comprobante', //campo unido
        width: '150px',
        sortable: true,
      },
      {//11
        name: 'Tp',
        selector: 'r_id_doc',
        width: '40px',
        sortable: true,
      },
      {//12
        name: 'Ruc',
        selector: 'r_documento_id',
        width: '110px',
        sortable: true,
      },
      {//13
        name: 'Razon Social',
        selector: 'r_razon_social',
        width: '210px',
        sortable: true,
      },
      {//26
        name: 'TOTAL',
        selector: 'r_monto_total',
        width: '100px',
        sortable: true,
      },
      {//27 PEN o USD
        name: 'MONEDA',
        selector: 'r_moneda',
        width: '90px',
        sortable: true,
      },
      {//28
        name: 'TC',
        selector: 'r_tc',
        width: '70px',
        sortable: true,
      },
      {//29
        name: 'REF.Emision',
        selector: 'r_fecemi_ref',
        width: '110px',
        sortable: true,
      },
      {//30
        name: 'REF.TP',
        selector: 'r_cod_ref',
        width: '110px',
        sortable: true,
      },
      {//31
        name: 'REF.SERIE',
        selector: 'r_serie_ref',
        width: '110px',
        sortable: true,
      },
      {//32
        name: 'REF.NUM',
        selector: 'r_numero_ref',
        width: '110px',
        sortable: true,
      },

    ];
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
  }
  //////////////////////////////////////////////////////////
  const originalColor = '#1e272e';
  const conditionalRowStyles = [
    {
      when: row => row.resultado==='SIRE - XPERT',
      style: {
        backgroundColor: aclararColor(originalColor,120),
      },
    },
  ];
  function aclararColor(hex, percent) {
    // Parsear el color hexadecimal a componentes RGB
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
  
    // Calcular el porcentaje de aclarado
    let factor = 1 + percent / 100;
  
    // Ajustar los componentes RGB
    r = Math.round(r * factor);
    g = Math.round(g * factor);
    b = Math.round(b * factor);
  
    // Asegurar que los valores estén en el rango [0, 255]
    r = Math.min(255, r);
    g = Math.min(255, g);
    b = Math.min(255, b);
  
    // Convertir los componentes RGB de nuevo a formato hexadecimal
    const nuevoHex = `#${(r).toString(16).padStart(2, '0')}${(g).toString(16).padStart(2, '0')}${(b).toString(16).padStart(2, '0')}`;
  
    return nuevoHex;
  }


 return (
  <>
  <Grid container
        direction={isSmallScreen ? 'column' : 'row'}
        //alignItems={isSmallScreen ? 'center' : 'center'}
        justifyContent={isSmallScreen ? 'center' : 'center'}
  >

      <Grid item xs={11} >
          <TextField fullWidth variant="outlined" color="success" size="small"
                                      label="FILTRAR"
                                      sx={{display:'block',
                                            margin:'.0rem 0'}}
                                      name="busqueda"
                                      placeholder='Ruc   Razon Social   Comprobante'
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

      <Grid item xs={1} >
        <BotonExcelVentas registrosdet={registrosdet} 
        />          
      </Grid>

  </Grid>

  <Grid container spacing={0}
      direction={isSmallScreen ? 'column' : 'row'}
      alignItems={isSmallScreen ? 'center' : 'left'}
      justifyContent={isSmallScreen ? 'center' : 'left'}
  >

      <Grid item xs={0.4} >    

          <IconButton color="primary" 
                      style={{ padding: '0px' }}
                      onClick={() => {
                        handleMensajeTotales();
                        }
                      }
          >
                <FindInPageIcon style={{ fontSize: '40px' }}/>
          </IconButton>

      </Grid>


  </Grid>

  <Datatable
      title="SIRE Comparativo"
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
      conditionalRowStyles={conditionalRowStyles} 
  >
  </Datatable>

  </>
  );
}
