import {Grid,Card,CardContent,useMediaQuery,Typography,TextField,Button,CircularProgress,Select,MenuItem,InputLabel,Box,FormControl, List,ListItem,ListItemText,Dialog,DialogContent,DialogTitle, responsiveFontSizes} from '@mui/material'
import {useState,useEffect,useRef,useMemo,useCallback} from 'react';
import {useNavigate, useParams, useLocation} from 'react-router-dom';
import axios from 'axios';
import AddIcon from '@mui/icons-material/Add';
import FindIcon from '@mui/icons-material/FindInPage';
import InputAdornment from '@mui/material/InputAdornment';
import Tooltip from '@mui/material/Tooltip';
import ReplyIcon from '@mui/icons-material/Reply';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import KeyboardIcon from '@mui/icons-material/Keyboard';

import RestartAltIcon from '@mui/icons-material/RestartAlt';
import IndeterminateCheckBox from '@mui/icons-material/IndeterminateCheckBox';
import Timer10SelectIcon from '@mui/icons-material/Timer10Select';
import AddCircleIcon from '@mui/icons-material/AddBox'; // Ícono para aumentar de 10 en 10
import Checkbox from '@mui/material/Checkbox';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import UpdateIcon from '@mui/icons-material/Update';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';

import DeleteIcon from '@mui/icons-material/DeleteForeverRounded';
import IconButton from '@mui/material/IconButton';
import { useAuth0 } from '@auth0/auth0-react'; //new para cargar permisos luego de verificar registro en bd
//import logo from '../../Logo02.png';
import logo from '../../Logo04small.png';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import numeral from 'numeral';
import ListaPopUp from '../ListaPopUp';

import Datatable, {createTheme} from 'react-data-table-component';
import QRCode from 'qrcode';
import { NumerosALetras } from 'numero-a-letras';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { useDialog } from "./AdminConfirmDialogProvider";
import AdminSunatIcon from './AdminSunatIcon';
import AdminSunatIconPdf from './AdminSunatIconPdf';

export default function AdminVentaForm() {
  const isSmallScreen = useMediaQuery('(max-width: 600px)');
  //const back_host = process.env.BACK_HOST || "http://localhost:4000";
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";  
  ////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////
  const { confirmDialog } = useDialog(); //unico dialogo
  const inputProductoRef = useRef(null); // Crear referencia al TextField
  const [updateTrigger, setUpdateTrigger] = useState({});
  const [doc_select,setDocSelect] = useState([]);
  //////////////////////////////////////////////////////////
  const [visualizando,setVisualizando] = useState(false);
  const location = useLocation();

  //const params = useParams();
  //Obtener los parámetros de URL
  const { id_anfitrion, id_invitado, periodo, documento_id, comprobante, comprobante_ref } = useParams();
  //Crear estado `params` y sincronizarlo con los valores de la URL
  const [params, setParams] = useState({
    id_anfitrion,
    id_invitado,
    periodo,
    documento_id,
    comprobante,
    comprobante_ref,
  });

  /////////
  const [showModal, setShowModal] = useState(false);
  //const [showModalProducto, setShowModalProducto] = useState(false);
  const [showModalProductoLista, setShowModalProductoLista] = useState(false);

  const [showModalEmite, setShowModalEmite] = useState(false);

  const [searchText, setSearchText] = useState('');
  const textFieldRef = useRef(null); //foco del buscador
  const [valorEmite, setValorEmite] = useState('03');
  const [comprobanteEmitido, setComprobanteEmitido] = useState(null);
  const [razonSocialBusca, setRazonSocialBusca] = useState('');
  //////////////////////////////////////////////////////////

  const [producto_select,setProductoSelect] = useState([]);
  const [precio_select,setPrecioSelect] = useState([]);
  const [grupo_select,setGrupoSelect] = useState([]); //Util para colores, si es necesario, caso contrario NULL
  const [cod_select,setCodSelect] = useState([]); //Util para comprobantes habilitados segun usuario
  
  //Permisos Nivel 02
  const {user, isAuthenticated } = useAuth0();
  const [permisosComando, setPermisosComando] = useState([]); //MenuComandos
  const [pVenta010201, setPVenta010201] = useState(false); //Grabar Cabecera Venta
  const [pVenta010202, setPVenta010202] = useState(false); //Agregar Detalle de Productos
  const [pVenta010203, setPVenta010203] = useState(false); //Det Editar Item-Modifica
  const [pVenta010204, setPVenta010204] = useState(false); //Det Editar Item-Elimina
  
  const [pVenta010205, setPVenta010205] = useState(false); //Facturar
  const [pVenta010206, setPVenta010206] = useState(false); //Boletear
  const [pVenta010207, setPVenta010207] = useState(false); //Notear

  const [registrosdet,setRegistrosdet] = useState([]);
  //const fecha_actual = new Date();
  const formasPago = ['YAPE', 'PLIN', 'TRANSFERENCIA', 'TARJETA'];
  const [motivo_select, setMotivoSelect] = useState([]);

  const actualizaValorEmite = (e) => {
    setValorEmite(e.target.value);
    setDatosEmitir(prevState => ({ ...prevState, r_cod_emitir: e.target.value }));
  }

  const cargaMotivosSelect = () =>{
    //console.log(`${back_host}/iddoc`);
    axios
    .get(`${back_host}/motivonota/07`)
    .then((response) => {
        setMotivoSelect(response.data);
    })
    .catch((error) => {
        console.log(error);
    });
  };
  const cargaDocSelect = () =>{
    //console.log(`${back_host}/iddoc`);
    axios
    .get(`${back_host}/iddoc`)
    .then((response) => {
        setDocSelect(response.data);
    })
    .catch((error) => {
        console.log(error);
    });
  };

  const cargaCodSeg = () =>{
    //console.log(`${back_host}/ad_ventasegcod/${params.id_anfitrion}/${params.documento_id}/${params.id_invitado}`);
    axios
    .get(`${back_host}/ad_ventasegcod/${params.id_anfitrion}/${params.documento_id}/${params.id_invitado}`)
    .then((response) => {
        setCodSelect(response.data.data);
        //Si es un solo registro, setear valorEmite
        //console.log(`Verificando de codigos `, response.data.data.length, response.data.data[0].r_cod);
        if (response.data.data.length === 1) {
          setValorEmite(response.data.data[0].r_cod);
        }
    })
    .catch((error) => {
        console.log(error);
    });
  };
  // Función para verificar si un código está permitido
  const isAllowed = (codigo) => {
    //console.log(`Verificando si el código ${codigo} está permitido`,cod_select);
    return cod_select.some(item => item.r_cod === codigo);
  }

  function base64ToUint8Array(base64) {
    const binaryString = window.atob(base64); // Decodificar Base64 a binario
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
  
  const [venta,setVenta] = useState({
      fecemi:'',
      r_documento_id:'', //cliente
      r_razon_social:'', //cliente
      debe:'0',
      peso_total:'0',
      ctrl_atencion: '', //alias vendedor
      registrado:'1'
  });
  
  const [producto,setProducto] = useState({
    //datos complementarios para post
    id_anfitrion:'',
    documento_id:'',
    periodo:'',
    r_cod:'',
    r_serie:'',
    r_numero:'',
    elemento:1, //antes habia 1
    r_fecemi:'',
    //datos propios del producto
    id_producto:'',
    descripcion:'',
    cantidad:null, //antes habia 1
    precio_unitario:'',
    precio_neto:'',
    porc_igv:'',
    cont_und:'',
    auxiliar:'' //precio_unitario - cont_und - porc_igv
  });

  const [datosEmitir,setDatosEmitir] = useState({
    //datos complementarios para post
    id_anfitrion:'',
    documento_id:'',
    periodo:'',
    r_cod:'',
    r_serie:'',
    r_numero:'',
    elemento:1,
    r_fecemi:'',
    //datos propios del comprobante a generar y correntista a registrar
    //solo emitidos 01,03,NV ... los 07 y 08 los generamos desde clonar para mayor facilidad
    r_cod_emitir:'',
    r_documento_id:'',
    r_id_doc:'',
    r_razon_social:'',
    efectivo:'',       
    vuelto:'0',         //default
    forma_pago2:'YAPE', //default
    efectivo2:'0',      //default
    r_direccion:'-',
    r_idmotivo_ref:'' //new
  });

  const handleCodigoKeyDown = async (event) => {
    if (event.key === '+') {
        setShowModal(true);
    }
    if (event.key === '-') {
      setShowModal(false);
    }
    //console.log(event.key);
    if (event.key === 'Enter') {
      //Selecciona el 1er elemento de la lista, en caso no haya filtrado nada
      //handleClienteSelect(filteredClientes[0].documento_id, filteredClientes[0].razon_social);

      setShowModal(false);
    }
  };
  const handleClienteSelect = (codigo, cliente) => {
    setSearchText(codigo);
    //setVenta(prevState => ({ ...prevState, documento_id: codigo, razon_social:cliente}));
    /*setVenta({...venta, documento_id:codigo, razon_social:cliente});*/
    venta.documento_id = codigo;
    venta.razon_social = cliente;

    setShowModal(false);
    //console.log(venta.documento_id,venta.razon_social);
  };
  
  const [cargando,setCargando] = useState(false);
  
  const navigate = useNavigate();

  const cargaPopUpProducto = () =>{
    axios
    .get(`${back_host}/ad_productopopup/${params.id_anfitrion}/${params.documento_id}`)
    .then((response) => {
        setProductoSelect(response.data);
    })
    .catch((error) => {
        console.log(error);
    });
  }
  const cargaPreciosRangoProducto = (sIdProducto) =>{
    let sProductoOriginal = sIdProducto;
    //Verificar "-" en id producto, En caso de encontrarlo, tomar solo la parte antes del "-"
    if (sProductoOriginal.includes('-')) {
      sProductoOriginal = sProductoOriginal.split('-')[0];
    }

    axios
    .get(`${back_host}/ad_productopreciorango/${params.id_anfitrion}/${params.documento_id}/${sProductoOriginal}`)
    .then((response) => {
        setPrecioSelect(response.data);
    })
    .catch((error) => {
        console.log(error);
    });
  }
  const cargaPopUpGrupo = () =>{
    //Utilizado para colores, si es necesario
    axios
    .get(`${back_host}/ad_grupopopup/${params.id_anfitrion}/${params.documento_id}`)
    .then((response) => {
        setGrupoSelect(response.data);
    })
    .catch((error) => {
        console.log(error);
    });
  }


  const handleSubmit = async(e) => {
    e.preventDefault();
    setCargando(true);
    
    confirmaModificaComprobante();

    setCargando(false);
    
  };
  
  //Aqui se leen parametros en caso lleguen
  useEffect( ()=> {
    //Verificar si existe venta abierta
    //APi respuesta con array, si existe valores entonces cargar modo edicion

    if (params.comprobante){

      // Dividir el string por el guion "-"
      const [COD, SERIE, NUMERO, ELEM] = params.comprobante.split('-');
      //console.log('comprobante key: ', COD, SERIE, NUMERO, ELEM);

      mostrarVenta(COD, SERIE, NUMERO, ELEM); //falta escpecificar elemento
      mostrarVentaDetalle(COD, SERIE, NUMERO, ELEM);
      
      
    }else{
      //click nuevo, genera = verificar si existe caso contrario inserta y siempre devuelve datos
      //generaVenta();
      console.log('generaVenta cuidadoooo se encargar de generar y mostrar ....');
      //console.log(obtenerFecha(params.periodo,false));
    }

    //consideraciones finales de renderizado
    //si cliente existe, renderizarlo, sino en blanco indica que esta en modo Pedido
    //cargaClienteCombo();
    cargaPopUpProducto();
    cargaPopUpGrupo();//new
    cargaDocSelect();
    cargaCodSeg(); //new array con lista de comprobantes habilitados segun usuario, utiles para control de emitir
    cargaMotivosSelect(); //new

    //NEW codigo para autenticacion y permisos de BD
    if (isAuthenticated && user.email) {
      // cargar permisos de sistema
      cargaPermisosMenuComando('20'); //Alimentamos el useState permisosComando
      //console.log(permisosComando);
    }

    //foco
    if (showModal && textFieldRef.current) {
      textFieldRef.current.focus();
    }

    setVisualizando(location.pathname.includes('view'));
    //console.log('view prueba:  ',location.pathname.includes('view'));
    //desactivar botones de modificac
    

  },[params.comprobante, isAuthenticated, textFieldRef.current]);

  useEffect( ()=> {
    //Control de producto elegido
      //console.log("click aceptar Lista Producto");

      const [PRECIO_UNITARIO, CONT_UND, PORC_IGV, PRECIO_FACTOR, PRODUCTO_SKU] = producto.auxiliar.split('-');

      setProducto(prevState => ({ ...prevState
            //,id_producto: producto.id_producto
            ,cantidad: 1
            ,precio_unitario:PRECIO_UNITARIO
            ,precio_neto:PRECIO_UNITARIO
            ,cont_und:CONT_UND
            ,porc_igv:PORC_IGV
            ,precio_factor:PRECIO_FACTOR
            ,producto_sku:PRODUCTO_SKU
      }));

      //console.log('producto en useEffect: ', producto);

      //Aqui debemos cargar precios por rango, en caso columna RANGO = '1'
      if (PRECIO_FACTOR==="1"){
        //Alimentar precio_select
        cargaPreciosRangoProducto(producto.id_producto);
        //console.log('cargaPreciosRango: ', precio_select);
        //Luego en evento cambio cantidad, se actualiza precio_unitario
      }else{
        //Liberar contenido precio_select
        setPrecioSelect([]);
      }
      

  },[producto.auxiliar]);

  useEffect( ()=> {
      //mostrar detalle actualizado y encabezado mas por el rico total
      const [COD, SERIE, NUMERO, ELEM] = params.comprobante.split('-');

      mostrarVenta(COD, SERIE, NUMERO, ELEM); 
      mostrarVentaDetalle(COD, SERIE, NUMERO, ELEM);
      //console.log('cabecera actualizado: ', venta);
      //console.log('detalle actualizado: ', registrosdet);
      

  },[updateTrigger]) //Aumentamos IsAuthenticated y user

  useEffect( ()=> {
    //Datos de emision
    if (valorEmite === '03' || valorEmite === 'NV'){
      //Regla en Boletas 
      setDatosEmitir(prevState => ({ ...prevState, r_documento_id: '00000001' }));
      setDatosEmitir(prevState => ({ ...prevState, r_razon_social: 'VARIOS' }));
      setDatosEmitir(prevState => ({ ...prevState, r_id_doc: '1' }));
      setIdDocBusca('1');
      setDatosEmitir(prevState => ({ ...prevState, r_direccion: '-' }));
      
      if (venta.r_monto_total > 700 && valorEmite === '03'){
        setDatosEmitir(prevState => ({ ...prevState, r_documento_id: '' }));
        setDatosEmitir(prevState => ({ ...prevState, r_razon_social: '' }));
        setDatosEmitir(prevState => ({ ...prevState, r_id_doc: '1' }));
        setIdDocBusca('1');
        setDatosEmitir(prevState => ({ ...prevState, r_direccion: '-' }));
      }
      setDatosEmitir(prevState => ({ ...prevState, efectivo: venta.r_monto_total }));
      //setDatosEmitir({...datosEmitir, efectivo: venta.r_monto_total });
    }
    if (valorEmite === '01' || valorEmite === '07' || valorEmite === '08'){
      setDatosEmitir(prevState => ({ ...prevState, r_documento_id: '' }));
      setDatosEmitir(prevState => ({ ...prevState, r_razon_social: '' }));
      setDatosEmitir(prevState => ({ ...prevState, r_id_doc: '6' }));
      setIdDocBusca('6');
      setDatosEmitir(prevState => ({ ...prevState, r_direccion: '-' }));

      setDatosEmitir(prevState => ({ ...prevState, efectivo: venta.r_monto_total }));
      setDatosEmitir(prevState => ({ ...prevState, r_idmotivo_ref: '01' })); //Default anulacion
      //setDatosEmitir({...datosEmitir, efectivo: venta.r_monto_total });
    }
    
  },[valorEmite]) //Cambios en Emision, actualiza 'datosEmitir'

  useEffect(() => {
    //Falta Consultar activo en parametros, precio por cantidad
    
    ///////////////////////////////////////////////////////////

    setParams({
      id_anfitrion,
      id_invitado,
      periodo,
      documento_id,
      comprobante,
      comprobante_ref,
    });
  }, [id_anfitrion, id_invitado, periodo, documento_id, comprobante, comprobante_ref]);

  const cargaPermisosMenuComando = async(idMenu)=>{
    //Realiza la consulta a la API de permisos (obtenerTodosPermisoComandos)
    if (params.id_anfitrion === params.id_invitado){
      setPVenta010201(true);
      setPVenta010202(true);
      setPVenta010203(true);
      setPVenta010204(true);
    }else{
        fetch(`${back_host}/seguridad/${params.id_anfitrion}/${params.id_invitado}/${idMenu}`, {
          method: 'GET'
        })
        .then(response => response.json())
        .then(permisosData => {
          // Guarda los permisos en el estado
          setPermisosComando(permisosData);
          //console.log('permisosComando: ',permisosComando);
          let tienePermiso;
          // Verifica si existe el permiso de acceso 'ventas'
          tienePermiso = permisosData.some(permiso => permiso.id_comando === '20-02-01'); //Graba CAB-Cambios
          if (tienePermiso) {
            setPVenta010201(true);
          }
          tienePermiso = permisosData.some(permiso => permiso.id_comando === '20-02-02'); //Item-Agrega
          if (tienePermiso) {
            setPVenta010202(true);
          }
          tienePermiso = permisosData.some(permiso => permiso.id_comando === '20-02-03'); //Item-Modifica
          if (tienePermiso) {
            setPVenta010203(true);
          }
          tienePermiso = permisosData.some(permiso => permiso.id_comando === '20-02-04'); //Item-Elimina
          if (tienePermiso) {
            setPVenta010204(true);
          }
          tienePermiso = permisosData.some(permiso => permiso.id_comando === '20-02-05'); //Facturar
          if (tienePermiso) {
            setPVenta010205(true);
          }
          tienePermiso = permisosData.some(permiso => permiso.id_comando === '20-02-06'); //Boletear
          if (tienePermiso) {
            setPVenta010206(true);
          }
          tienePermiso = permisosData.some(permiso => permiso.id_comando === '20-02-07'); //Notear
          if (tienePermiso) {
            setPVenta010207(true);
          }

        })
        .catch(error => {
          console.log('Error al obtener los permisos:', error);
        });
    }
  }

  //Rico evento change
  const handleChangeEmite = (name, value) => {
    //calcular monto efectivo2 si efectivo < venta.r_monto_total
    if (name === 'efectivo' && (parseFloat(value) < parseFloat(venta.r_monto_total) || parseFloat(value) === parseFloat(venta.r_monto_total) )) {
      setDatosEmitir(prevState => ({
        ...prevState,
        efectivo2: parseFloat(venta.r_monto_total - parseFloat(value)).toFixed(2)
      }));
      //dice que no debe usarse de modo directo el valor del useState en un mismo evento
      datosEmitir.efectivo2 = parseFloat(venta.r_monto_total - parseFloat(value)).toFixed(2)
    }

    if (name === 'efectivo2' && (parseFloat(value) < parseFloat(venta.r_monto_total) || parseFloat(value) === parseFloat(venta.r_monto_total) )) {
      setDatosEmitir(prevState => ({
        ...prevState,
        efectivo: parseFloat(venta.r_monto_total - parseFloat(value)).toFixed(2)
      }));
      //dice que no debe usarse de modo directo el valor del useState en un mismo evento
      datosEmitir.efectivo = parseFloat(venta.r_monto_total - parseFloat(value)).toFixed(2)
    }
    
    console.log('handleChangeEmite: ', datosEmitir);
    setDatosEmitir({...datosEmitir, [name]: value});
  }
    
  const handleChange = e => {
    setVenta({...venta, [e.target.name]: e.target.value});
  }
  const handleChangeProductoDatos = e => {
    let precio_unitario;
    let precio_neto;
    
    if (e.target.name === "cantidad"){
      //Falta aplicar precio por cantidades, si estubiera acvtivo en tabla mve_parametros (se verifica al inicio useEffect form Venta)
      //ya tenemos el useState precio_select, que contiene los precios por rango
      console.log('modificando cantidad, importe nuevo: ', precio_select);

      //new condition para verificar si precio_select tiene datos
      if (Array.isArray(precio_select) && precio_select.length > 0) {
        precio_unitario = obtenerPrecioPorCantidad(e.target.value);
        //new
        producto.precio_unitario = precio_unitario;
        //precio_neto = precio_unitario * e.target.value;
        precio_neto = parseFloat((precio_unitario * e.target.value).toFixed(2));
      }else{
        precio_neto = producto.precio_unitario * e.target.value;
      }

      //setProducto({...producto, [precio_neto]: precio_neto});
      console.log('modificando cantidad, importe nuevo: ', precio_neto);
      producto.precio_neto = precio_neto;
    }

    if (e.target.name === "precio_unitario"){
      precio_neto = producto.cantidad * e.target.value;
      //setProducto({...producto, [precio_neto]: precio_neto});
      console.log('modificando precio_unitario, importe nuevo: ', precio_neto);
      producto.precio_neto = precio_neto;
    }
    
    setProducto({...producto, [e.target.name]: e.target.value});
    console.log('oyeeee: ',producto);
  }

  // Función que devuelve el precio según cantidad
  const obtenerPrecioPorCantidad = (nuevaCantidad) => {
    const cantidadNum = parseFloat(nuevaCantidad);

    const rango = precio_select.find(r => {
      const min = parseFloat(r.cant_min);
      const max = parseFloat(r.cant_max);
      return cantidadNum >= min && cantidadNum <= max;
    });

    //return rango ? parseFloat(rango.precio_venta/rango.unidades) : 0; // 0 si no encuentra rango
    return rango  ? parseFloat((rango.precio_venta / rango.unidades).toFixed(2)) : 0;

  };

  //funcion para mostrar data de formulario, modo edicion
  const mostrarVenta = async (cod,serie,num,elem) => {
    const res = await fetch(`${back_host}/ad_venta/${params.periodo}/${params.id_anfitrion}/${params.documento_id}/${cod}/${serie}/${num}/${elem}`);
    const data = await res.json();
    //Actualiza datos para enlace con controles, al momento de modo editar
    setVenta((prevState) => ({
      ...prevState, // Mantiene el resto del estado anterior
      razon_social: data.razon_social, //datos para impresion
      direccion: data.direccion, //datos para impresion
      r_cod: data.r_cod,
      r_serie: data.r_serie,
      r_numero: data.r_numero,
      elemento: data.elemento,
      r_fecemi: data.fecemi, // cambio de var, por la conversión a varchar
      
      r_id_doc: data.r_id_doc, // cliente
      r_documento_id: data.r_documento_id, // cliente
      r_razon_social: data.r_razon_social, // cliente
      r_direccion: data.r_direccion, // cliente
      
      debe: data.debe,
      r_base002: data.r_base002,
      r_igv002: data.r_igv002,
      r_monto_total: data.r_monto_total,
      r_moneda: data.r_moneda,
      r_tc: data.r_tc,

      peso_total: data.peso_total,
      r_cod_ref: data.r_cod_ref,       // ref
      r_serie_ref: data.r_serie_ref,   // ref
      r_numero_ref: data.r_numero_ref, // ref
      r_fecemi_ref: data.r_fecemi_ref, // ref
      registrado: data.registrado,
      
      efectivo: data.efectivo, //new
      forma_pago2: data.forma_pago2, //new
      efectivo2: data.efectivo2, //new

      r_vfirmado: data.r_vfirmado
    }));

    setDatosEmitir((prevState) => 
      ({...prevState, 
        efectivo: data.efectivo,
        forma_pago2: data.forma_pago2,
        efectivo2: data.efectivo2
      }));
    
    //console.log(data);
    setSearchText(data.r_documento_id); //data de cliente para form
  };
  
  const mostrarVentaDetalle = async (cod,serie,num,elem) => {
    const res = await fetch(`${back_host}/ad_ventadet/${params.periodo}/${params.id_anfitrion}/${params.documento_id}/${cod}/${serie}/${num}/${elem}`);
    const dataDet = await res.json();
    setRegistrosdet(dataDet);
  };

  //Seccion Elimina Item
  const handleDelete = (item) => {
    //console.log(item);
    const [COD, SERIE, NUMERO, ELEM] = params.comprobante.split('-');
    confirmaEliminarDetalle(COD, SERIE, NUMERO,ELEM,item);
  };

   //////////////////////////////////funciones control cantidad//////////////////////////////////////////
  const parseCantidad = (cantidad) => {
    // Si el campo está vacío o es NaN, se asume valor 0
    const parsedCantidad = parseInt(cantidad, 10);
    return isNaN(parsedCantidad) ? 0 : parsedCantidad;
  };
  const handleResetCantidad = () => {
    setProducto((prevProducto) => {
      const newCantidad = 1;
      const newImporte = prevProducto.precio_unitario * newCantidad;
      return { ...prevProducto, cantidad: newCantidad.toString(), precio_neto:newImporte };
    });
    //console.log('oyeeee: ',producto);
  };
  const handleDecreaseByOne = () => {
    setProducto((prevProducto) => {
      const newCantidad = Math.max(parseCantidad(prevProducto.cantidad) - 1, 0); // Evita que sea menor a 0
      const newImporte = (prevProducto.precio_unitario * newCantidad).toFixed(2);
      return { ...prevProducto, cantidad: newCantidad.toString(), precio_neto:newImporte };      
    });
    handleChangeProductoDatos({ target: { name: 'cantidad', value: parseCantidad(producto.cantidad) - 1 } }); //new
    //console.log('oyeeee: ',producto);
  };
  const handleIncreaseByOne = () => {
    console.log('incrementando cantidad en 1, estado del producto', producto);

    setProducto((prevProducto) => {
      const newCantidad = parseCantidad(prevProducto.cantidad) + 1;
      const newImporte = (prevProducto.precio_unitario * newCantidad).toFixed(2);
      return { ...prevProducto, cantidad: newCantidad.toString(), precio_neto:newImporte };
    });
    handleChangeProductoDatos({ target: { name: 'cantidad', value: parseCantidad(producto.cantidad) + 1 } }); //new
    //console.log('oyeeee: ',producto);
  };
  const handleIncreaseByTen = () => {
    setProducto((prevProducto) => {
      const newCantidad = parseCantidad(prevProducto.cantidad) + 10;
      const newImporte = (prevProducto.precio_unitario * newCantidad).toFixed(2);
      return { ...prevProducto, cantidad: newCantidad.toString(), precio_neto:newImporte };
    });
    handleChangeProductoDatos({ target: { name: 'cantidad', value: parseCantidad(producto.cantidad) + 10 } }); //new
  };
  const handleSaveDetail = () =>{
      //Consumir API grabar
      confirmaGrabarDetalle();

      //Resetear useState producto
      const [COD, SERIE, NUMERO] = params.comprobante.split('-');    
      const estadoInicial = {
          id_anfitrion: params.id_anfitrion,
          documento_id: params.documento_id,
          periodo: params.periodo,
          r_cod: COD,
          r_serie: SERIE,
          r_numero: NUMERO,
          r_fecemi: venta.r_fecemi,
              
          id_producto: '',
          descripcion: '',
          cantidad: '',
          precio_unitario: '',
          precio_neto: '',
          auxiliar: '' // calculo de precio_unitario - cont_und - porc_igv
        };
      //setProducto(estadoInicial);

      setProducto((prevState) => ({
        ...prevState,
        ...estadoInicial
      }));

      console.log('producto reseteado: ', producto);
      //Quitar modal, con el producto.cantidad = ''
      //setShowModalProducto(false);
  }
  //////////////////////////////////////////////////////////////////////////////////////////////////////
  const confirmaGrabarDetalle = async()=>{
    //console.log('antes de comprobante y setProducto');
    const [COD, SERIE, NUMERO, ELEM] = params.comprobante.split('-');    

    producto.id_anfitrion = params.id_anfitrion;
    producto.documento_id = params.documento_id;
    producto.periodo = params.periodo;
    producto.r_cod = COD;
    producto.r_serie = SERIE;
    producto.r_numero = NUMERO;
    producto.elemento = ELEM; //verificar
    producto.r_fecemi = venta.r_fecemi;

    console.log(producto);

    const sRuta = `${back_host}/ad_ventadet`;
    fetch(sRuta, {
      method: "POST",
      body: JSON.stringify(producto), //cambiazo de elementosSeleccionados por soloNumAsientos, tamaño minimo json para evitar rechazo en backend railway
      headers: {"Content-Type":"application/json"}
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            //console.log('La operación fue exitosa');
            
            setUpdateTrigger(Math.random());//actualizad vista detalle

        } else {
            console.log('La operación falló');
            // Aquí puedes agregar lógica adicional para manejar una respuesta fallida
            confirmDialog({
                    title: "La Operacion fallo, intentelo nuevamente",
                    //message: `${sComprobante}`,
                    icon: "error", // success | error | info | warning
                    confirmText: "ACEPTAR",
                    //cancelText: "CERRAR",
            });

        }
    })
    .catch(error => {
        console.error('Hubo un problema con la solicitud fetch:', error);
        //ahora si
        // Aquí puedes agregar lógica adicional para manejar errores en la solicitud
    });
  }

  /*const confirmaModificarDetalle = async(cod,serie,num,elem,item)=>{
    //console.log('antes de comprobante y setProducto');
    const [COD, SERIE, NUMERO] = params.comprobante.split('-');    

    producto.id_anfitrion = params.id_anfitrion;
    producto.documento_id = params.documento_id;
    producto.periodo = params.periodo;
    producto.r_cod = COD;
    producto.r_serie = SERIE;
    producto.r_numero = NUMERO;
    producto.r_fecemi = venta.r_fecemi;

    console.log(producto);

    const sRuta = `${back_host}/ad_ventadet/${params.periodo}/${params.id_anfitrion}/${params.documento_id}/${cod}/${serie}/${num}/${elem}/${item}`;
    fetch(sRuta, {
      method: "POST",
      body: JSON.stringify(producto), //cambiazo de elementosSeleccionados por soloNumAsientos, tamaño minimo json para evitar rechazo en backend railway
      headers: {"Content-Type":"application/json"}
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            //console.log('La operación fue exitosa');
            swal({
              text:"Detalle actualizado con exito",
              icon:"success",
              timer:"2000"
            });
            
            setUpdateTrigger(Math.random());//actualizad vista detalle

        } else {
            console.log('La operación falló');
            // Aquí puedes agregar lógica adicional para manejar una respuesta fallida
            swal({
              text:"La Operacion fallo, intentelo nuevamente",
              icon:"warning",
              timer:"2000"
            });
        }
    })
    .catch(error => {
        console.error('Hubo un problema con la solicitud fetch:', error);
        //ahora si
        // Aquí puedes agregar lógica adicional para manejar errores en la solicitud
    });
  }*/


  const confirmaEliminarDetalle = async(cod,serie,num,elem,item)=>{
    const result = await confirmDialog({
            title: "Eliminar Item?",
            //message: `${sComprobante}`,
            icon: "success", // success | error | info | warning
            confirmText: "ELIMINAR",
            cancelText: "CANCELAR",
    });
    //console.log(result);
    if (result.isConfirmed) {
        const sRuta = `${back_host}/ad_ventadet/${params.periodo}/${params.id_anfitrion}/${params.documento_id}/${cod}/${serie}/${num}/${elem}/${item}`;
        fetch(sRuta, {
          method: "DELETE"
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                setUpdateTrigger(Math.random());//actualizad vista detalle
            } else {
                console.log('La operación falló');
                // Aquí puedes agregar lógica adicional para manejar una respuesta fallida
                confirmDialog({
                        title: "Error al eliminar  ",
                        //message: `${sComprobante}`,
                        icon: "error", // success | error | info | warning
                        confirmText: "ACEPTAR",
                        //cancelText: "CERRAR",
                });
            }
        })
        .catch(error => {
            console.error('Hubo un problema con la solicitud fetch:', error);
            //ahora si
            // Aquí puedes agregar lógica adicional para manejar errores en la solicitud
        });
    }
  }
  
  const handleSaveComprobante = () =>{
    //Consumir API grabar
    confirmaGrabarComprobante();
    //alert('origen ref: '+ venta.r_cod_ref+venta.r_serie_ref+venta.r_numero_ref);

    //Quitar modal emitir
    setShowModalEmite(false);
  }

  const handleEditarDetalleClick = ()=>{
    //especificar modo edicion y cargar datos detalle en useState del Producto
    

    //mostrar modal del producto
    //setShowModalProducto(true);
  }

  const confirmaGrabarComprobante = async()=>{
    const [COD, SERIE, NUMERO] = params.comprobante.split('-');    

    //Alimentar useState venta
    const estadoFinal = {
        id_anfitrion: params.id_anfitrion,
        documento_id: params.documento_id,
        periodo: params.periodo,
        id_invitado: params.id_invitado,

        r_cod: COD,
        r_serie: SERIE,
        r_numero: NUMERO,
        r_cod_emitir: valorEmite,
        
        r_id_doc: datosEmitir.r_id_doc,
        r_documento_id: datosEmitir.r_documento_id,
        r_razon_social: datosEmitir.r_razon_social,
        r_direccion: datosEmitir.r_direccion,

        efectivo: datosEmitir.efectivo,
        efectivo2: datosEmitir.efectivo2,
        forma_pago2: datosEmitir.forma_pago2,
        vuelto: datosEmitir.vuelto,

        r_cod_ref: venta.r_cod_ref,      //parte de la referencia a emitir, proc postgresql se encarga de procesarlo o setearlo a null
        r_serie_ref: venta.r_serie_ref,  //parte de la referencia a emitir, proc postgresql se encarga de procesarlo o setearlo a null
        r_numero_ref: venta.r_numero_ref,//parte de la referencia a emitir, proc postgresql se encarga de procesarlo o setearlo a null
        //r_idmotivo_ref: '01',//parte de la referencia a emitir (hardcodeado temporal) anulacion
        r_idmotivo_ref: datosEmitir.r_idmotivo_ref,//Actualizado :)parte de la referencia a emitir (seleccionado en combo)
      };

    //console.log(estadoFinal);

    const sRuta = `${back_host}/ad_ventacomp`;
    fetch(sRuta, {
      method: "POST",
      body: JSON.stringify(estadoFinal), //cambiazo de elementosSeleccionados por soloNumAsientos, tamaño minimo json para evitar rechazo en backend railway
      headers: {"Content-Type":"application/json"}
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            //console.log('La operación fue exitosa');
            confirmDialog({
                    title: "Comprobante emitido con exito",
                    //message: `${sComprobante}`,
                    icon: "success", // success | error | info | warning
                    confirmText: "ACEPTAR",
                    //cancelText: "CERRAR",
            });

            //setUpdateTrigger(Math.random());//actualizad vista detalle
            setParams(prevParams => ({
              ...prevParams,         // Mantenemos los valores previos
              comprobante: (data.r_cod + '-' + data.r_serie + '-' + data.r_numero ) //actualizamos comprobante
            }));
            //console.log(params);
            //console.log(data);
            console.log(data.r_cod + '-' + data.r_serie + '-' + data.r_numero + '-' + data.elemento);
            
            const sComprobanteGenerado = data.r_cod + '-' + data.r_serie + '-' + data.r_numero + '-' + data.elemento;
            //renderizado automatico
            navigate(`/ad_venta/${params.id_anfitrion}/${params.id_invitado}/${params.periodo}/${params.documento_id}/${sComprobanteGenerado}/view`,
                    { replace: true }
                    );


        } else {
            //console.log('La operación falló');
            // Aquí puedes agregar lógica adicional para manejar una respuesta fallida
            confirmDialog({
                    title: "La Operacion fallo, intentelo nuevamente",
                    //message: `${sComprobante}`,
                    icon: "error", // success | error | info | warning
                    confirmText: "ACEPTAR",
                    //cancelText: "CERRAR",
            });
        }
    })
    .catch(error => {
        console.error('Hubo un problema con la solicitud fetch:', error);
        //ahora si
        // Aquí puedes agregar lógica adicional para manejar errores en la solicitud
    });
    
  }

  const confirmaModificaComprobante = async()=>{
    //console.log('modificando datos previos al envio');
    const [COD, SERIE, NUMERO, ELEM] = params.comprobante.split('-');
  
    //Alimentar useState venta
    const estadoFinal = {
        id_anfitrion: params.id_anfitrion,
        documento_id: params.documento_id,
        periodo: params.periodo,
        id_invitado: params.id_invitado,

        r_cod: COD,
        r_serie: SERIE,
        r_numero: NUMERO,
        elemento: ELEM, 
        fecha: venta.r_fecemi,
        
        r_id_doc: venta.r_id_doc,
        r_documento_id: venta.r_documento_id,
        r_razon_social: venta.r_razon_social,
        r_direccion: venta.r_direccion,
        
        efectivo: datosEmitir.efectivo,       //new
        forma_pago2: datosEmitir.forma_pago2, //new
        efectivo2: datosEmitir.efectivo2,     //new
      };

    console.log(estadoFinal);
    
    const sRuta = `${back_host}/ad_venta`;
    console.log(sRuta);
    fetch(sRuta, {
      method: "PUT",
      body: JSON.stringify(estadoFinal), //cambiazo de elementosSeleccionados por soloNumAsientos, tamaño minimo json para evitar rechazo en backend railway
      headers: {"Content-Type":"application/json"}
    })
    .then(response => response.json())
    .then(data => {
        //console.log('responseeeee : ',data);

        if (data.success) {
            //console.log('La operación fue exitosa');
            confirmDialog({
                    title: "Cambios registrados con exito",
                    //message: `${sComprobante}`,
                    icon: "success", // success | error | info | warning
                    confirmText: "ACEPTAR",
                    //cancelText: "CERRAR",
            });
            
            //setUpdateTrigger(Math.random());//actualizad vista detalle
            setParams(prevParams => ({
              ...prevParams,         // Mantenemos los valores previos
              comprobante: (data.r_cod + '-' + data.r_serie + '-' + data.r_numero ) //actualizamos comprobante
            }));
            //console.log(params);
            //console.log(data);
            //console.log(data.r_cod + '-' + data.r_serie + '-' + data.r_numero);

        } else {
            console.log('La operación falló');
            // Aquí puedes agregar lógica adicional para manejar una respuesta fallida
            confirmDialog({
                    title: "La Operacion fallo, intentelo nuevamente",
                    //message: `${sComprobante}`,
                    icon: "error", // success | error | info | warning
                    confirmText: "ACEPTAR",
                    //cancelText: "CERRAR",
            });
        }
    })
    .catch(error => {
        console.error('Hubo un problema con la solicitud fetch:', error);
        //ahora si
        // Aquí puedes agregar lógica adicional para manejar errores en la solicitud
    });
    
  }


  /////////////////////////////////////////////////seccion datatable/////////////
  const [selectedRows, setSelectedRows] = useState([]);
  const [copiedRowId, setCopiedRowId] = useState(null);
  const columnas = [
    {
      name: '',
      width: '40px',
      cell: (row) => (
        (!visualizando) ? 
        (
          <DriveFileRenameOutlineIcon
            onClick={() => handleEditarDetalleClick(row.item)}
            style={{
              cursor: 'pointer',
              color: copiedRowId === row.documento_id ? 'green' : 'skyblue',
              transition: 'color 0.3s ease',
            }}
          />
        ):null
      ),
      allowOverflow: true,
      button: true,
    },
    {
      name: '',
      width: '40px',
      cell: (row) => (
        (!visualizando) ? 
        (  //modificar urgente con permiso para eliminar detalle
          <DeleteIcon
            onClick={() => handleDelete(row.item)}
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
    { name:'DESCRIPCION', 
      selector:row => row.descripcion,
      sortable: true,
      width: '410px'
      //key:true
    },
    { name:'CANTIDAD', 
      selector:row => row.cantidad,
      sortable: true,
      width: '100px'
      //key:true
    },
    { name:'P.UNIT', 
      selector:row => row.precio_unitario,
      sortable: true,
      width: '100px'
      //key:true
    },
    { name:'IMPORTE', 
      selector:row => row.precio_neto,
      sortable: true,
      width: '100px'
      //key:true
    },
    { name:'UND', 
      selector:row => row.cont_und,
      sortable: true,
      width: '100px'
      //key:true
    },
  ];

  const handleRowSelected = useCallback(state => {
		setSelectedRows(state.selectedRows);
	}, []);
  
  const contextActions = useMemo(() => {
    //console.log("asaaa");

    const handleUpdate = () => {
			var strSeleccionado;
      strSeleccionado = selectedRows.map(r => r.documento_id);
			navigate(`/contabilidad/${strSeleccionado}/edit`);
		};

		return (
      <>
			<Button key="modificar" onClick={handleUpdate} >
        MODIFICAR
      <UpdateIcon/>
			</Button>

      </>
		);
	}, [registrosdet, selectedRows]);

  
  const actions = (
    <>
    <IconButton color="warning" 
      onClick = {()=> {
                  //Icono retroceder pagina
                  navigate(-1, { replace: true });
                }
              }
    >
      <ReplyIcon />
    </IconButton>

    <AdminSunatIcon
      comprobante_key={params.comprobante} //Por default llega el key completo, 
      // Procesar en el comprobante para links
      comprobante = { (venta.r_cod_ref==null) ?
                      venta.r_cod+"-"+venta.r_serie+"-"+venta.r_numero
                      :
                      venta.r_cod_ref+"-"+venta.r_serie_ref+"-"+venta.r_numero_ref
      }
      cdr_pendiente={venta.cdr_pendiente} //new
      elemento={params.comprobante.split("-").pop()}   // ✅ último valor después del último "-"
      firma={venta.r_vfirmado}
      documentoId={params.documento_id}
      periodoTrabajo={params.periodo}
      idAnfitrion={params.id_anfitrion}
      contabilidadTrabajo={params.documento_id}
      backHost={back_host}
      onRefresh={() => setUpdateTrigger(Math.random())} // ✅ refresca al cerrar el modal
      size={26}
    />

    <AdminSunatIconPdf
      comprobante_key={params.comprobante}
      comprobante = { (venta.r_cod_ref==null) ?
                      venta.r_cod+"-"+venta.r_serie+"-"+venta.r_numero
                      :
                      venta.r_cod_ref+"-"+venta.r_serie_ref+"-"+venta.r_numero_ref
      }
      elemento={params.comprobante.split("-").pop()}   // ✅ último valor después del último "-"
      firma={venta.r_vfirmado}
      documentoId={params.documento_id}
      periodoTrabajo={params.periodo}
      idAnfitrion={params.id_anfitrion}
      contabilidadTrabajo={params.documento_id}
      backHost={back_host}
      onRefresh={() => setUpdateTrigger(Math.random())} // ✅ refresca al cerrar el modal
      size={26}
    />

    
    { pVenta010202 && !visualizando ?
    (
    <IconButton color="primary" 
      onClick = {()=> {
                  //Agregar Producto
                  //setShowModalProducto(true);   
                  setProducto(prevState => ({ ...prevState, cantidad: '', auxiliar: '' }));
                  setProducto({ ...producto, cantidad: '', auxiliar: '' }); //limpia cantidad para nuevo ingreso

                  console.log('producto estado actual: ', producto);
                  setShowModalProductoLista(true);
                }
              }
    >
      <AddIcon />
    </IconButton>
    ):
    (<div></div>)
    }

    </>
);

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

  const [id_docBusca, setIdDocBusca] = useState("");
  const mostrarRazonSocialGenera = (sDocumentoId) => {
    axios
        .post(`${back_host}/correntistagenera`, {
            ruc: sDocumentoId
        })
        .then((response) => {
            console.log(response.data);
            const { nombre_o_razon_social,r_id_doc,direccion_completa } = response.data;
            setRazonSocialBusca(nombre_o_razon_social);
            setIdDocBusca(r_id_doc);
            
            setDatosEmitir(prevState => ({ ...prevState, r_id_doc: r_id_doc }));
            setDatosEmitir(prevState => ({ ...prevState, r_razon_social: nombre_o_razon_social }));
            setDatosEmitir(prevState => ({ ...prevState, r_direccion: direccion_completa? direccion_completa:'-' }));
            console.log(datosEmitir);
        })
        .catch((error) => {
            console.log(error);
        });
  };

  const handleFocus = (event) => {
    if (isSmallScreen) {
      event.target.blur(); // Evita que se abra el teclado móvil automáticamente
    }
  };
  const handleMostrarTecladoCelular = () => {
    if (inputProductoRef.current) {
      inputProductoRef.current.focus(); // Enfoca el campo de texto manualmente
    }
  };

  // Función para intercambiar valores al hacer clic en la flecha
  const handleSwitch = (from) => {
    setDatosEmitir((prev) => {
      if (from === "efectivo") {
        return { ...prev, efectivo2: prev.efectivo, efectivo: 0 };
      }
      if (from === "efectivo2") {
        return { ...prev, efectivo: prev.efectivo2, efectivo2: 0 };
      }
      return prev;
    });
  };

  return (
  <div> 
      <div></div>
            <Card sx={{mt:1}}
                  style={{
                    background:'#1e272e',
                    //width: '700px', // Ajusta este valor según tu preferencia
                    padding:'0rem'
                  }}
            >
                <CardContent >
                    <form onSubmit={handleSubmit} >

                          <Grid container spacing={0}
                                  //direction= {isSmallScreen ? "column": "row"} 
                                  alignItems="center"
                                  justifyContent="left"
                          >
                            <Grid item xs={isSmallScreen ? 12 : 2}>
                              <Typography variant='h6' color='white' textAlign='center'>
                                  { comprobanteEmitido ? 
                                    (
                                      ('Emitido Final')
                                    )
                                    :
                                    (
                                      params.comprobante.includes('NP') ?
                                      ('NP en Proceso')
                                      :
                                      (  //cambiamos la vista del comprobante a mostrar
                                        (venta.r_cod_ref==null) ?
                                        venta.r_cod+"-"+venta.r_serie+"-"+venta.r_numero
                                        :
                                        venta.r_cod_ref+"-"+venta.r_serie_ref+"-"+venta.r_numero_ref
                                      ) 
                                    )
                                  }
                              </Typography>
                            </Grid>

                            <Grid item xs={isSmallScreen ? 12 : 2}>
                              <TextField variant="outlined" 
                                        //label="fecha"
                                        fullWidth
                                        size="small"
                                        sx={{display:'block',
                                              margin:'.5rem 0'}}
                                        name="r_fecemi"
                                        type="date"
                                        //format="yyyy/MM/dd"
                                        value={venta.r_fecemi}
                                        onChange={handleChange}
                                        inputProps={{ style:{color:'white'} }}
                                        InputLabelProps={{ style:{color:'white'} }}
                                />
                              </Grid>

                              <Grid item xs={isSmallScreen ? 12 : 4}>
                                <Typography variant='h5' color='white' textAlign='center'>
                                  {
                                    (`Total: S/ ${parseFloat(venta.r_monto_total).toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                    })}`) 
                                  }
                                </Typography>
                              </Grid>

                              
                              <Grid item xs={isSmallScreen ? 12 : 1}>
                                  {//En caso de NP en Proceso, n o se muestra este campo
                                  params.comprobante.includes('NP') ?
                                  (
                                    <div></div>
                                  )
                                  :
                                  (  //Caso contrario, solo se modifica pero 'NV' (Notas de Venta)
                                      <TextField
                                        variant="outlined"
                                        //placeholder="EFECTIVO"
                                        label="EFECTIVO"
                                        size="small"
                                        sx={{ mt: 1 }}
                                        fullWidth
                                        name="efectivo"
                                        //value={venta.efectivo}
                                        //onChange={handleChange}
                                        value={datosEmitir.efectivo}
                                        onChange={(e) => handleChangeEmite("efectivo", e.target.value)}

                                        onKeyDown={handleCodigoKeyDown}
                                        inputProps={{ style: { color: 'white' } }}
                                        InputLabelProps={{ style: {color: 'white'}, shrink: true }}
                                      />                                
                                  )
                                  }
                              </Grid>

                              <Grid item xs={isSmallScreen ? 12 : 0.8}>
                                  {//En caso de NP en Proceso, n o se muestra este campo
                                  params.comprobante.includes('NP') ?
                                  (
                                    <div></div>
                                  )
                                  :
                                  (  //Caso contrario, solo se modifica pero 'NV' (Notas de Venta)
                                    <Select
                                          size='small'
                                          value={datosEmitir.forma_pago2}
                                          name="forma_pago2"
                                          sx={{display:'block',
                                          margin:'.1rem 0', color:"skyblue", fontSize: '16px',mt:1 }}
                                          onChange={(e) => handleChangeEmite("forma_pago2", e.target.value)}
                                          >
                                            <MenuItem value="default">SELECCIONA </MenuItem>
                                          {   
                                              formasPago.map(elemento => (
                                              <MenuItem key={elemento} value={elemento}>
                                                {elemento}
                                              </MenuItem>)) 
                                          }
                                    </Select>
                                  )
                                  }
                              </Grid>
                              <Grid item xs={isSmallScreen ? 12 : 1}>
                                  {//En caso de NP en Proceso, n o se muestra este campo
                                  params.comprobante.includes('NP') ?
                                  (
                                    <div></div>
                                  )
                                  :
                                  (  //Caso contrario, solo se modifica pero 'NV' (Notas de Venta)
                                    <TextField
                                      variant="outlined"
                                      //placeholder="OTROS"
                                      label="OTROS"
                                      size="small"
                                      sx={{ mt: 1 }}
                                      fullWidth
                                      name="efectivo2"
                                      //value={venta.efectivo2}
                                      //onChange={handleChange}
                                      value={datosEmitir.efectivo2}
                                      onChange={(e) => handleChangeEmite("efectivo2", e.target.value)}

                                      onKeyDown={handleCodigoKeyDown}
                                      inputProps={{ style: { color: 'white' } }}
                                      InputLabelProps={{ style: { color:'white'}, shrink: true }}
                                    />                                
                                  )
                                  }
                              </Grid>

                              <Grid item xs={isSmallScreen ? 12 : 1.2}>
                              {//En caso de NP en Proceso, solo se emite comprobante
                               params.comprobante.includes('NP') ?
                               (
                                  <Button variant='contained' 
                                          color='primary' 
                                          //type='submit'
                                          fullWidth
                                          sx={{display:'block',
                                          margin:'.5rem 0'}}
                                          onClick = { () => {
                                            //Valores deafult
                                            //setValorEmite('03'); //por default
                                            setDatosEmitir(prevState => ({
                                              ...prevState,
                                              efectivo: venta.r_monto_total
                                            }));
                                            setDatosEmitir(prevState => ({
                                              ...prevState,
                                              efectivo2: 0
                                            }));
                                            setShowModalEmite(true);
                                            }
                                          }
                                          disabled={
                                                    !venta.r_fecemi 
                                                    }
                                          >
                                          { cargando ? (
                                          <CircularProgress color="inherit" size={24} />
                                          ) : (
                                          'EMITIR')
                                          }
                                  </Button>
                               )
                               :
                               (  //Caso contrario, solo se modifica pero 'NV' (Notas de Venta)
                                  //Comprobantes Sunat NO, porque ya estan declarados en OSE-sunat
                                  <Button variant='contained' 
                                          color='primary' 
                                          type='submit'
                                          fullWidth
                                          sx={{display:'block',
                                          margin:'.5rem 0'}}
                                          disabled={
                                                    !venta.r_fecemi 
                                                    //|| !venta.r_documento_id 
                                                    //|| !pVenta010201 
                                                    //|| !params.comprobante.includes('NV')
                                                    }
                                          >
                                          { cargando ? (
                                          <CircularProgress color="inherit" size={24} />
                                          ) : (
                                          'MODIFICA')
                                          }
                                  </Button>
                               )
                              }

                              </Grid>

                              {!params.comprobante.includes('NP') && (
                              <Grid container spacing={0}
                                      //direction= {isSmallScreen ? "column": "row"} 
                                      alignItems="center"
                                      justifyContent="left"
                              >
                                    <Grid item xs={isSmallScreen ? 12 : 2}>
                                        <TextField
                                          variant="outlined"
                                          placeholder="RUC/DNI"
                                          size="small"
                                          sx={{ mt: 1 }}
                                          fullWidth
                                          name="r_documento_id"
                                          value={venta.r_documento_id}
                                          onChange={handleChange}
                                          onKeyDown={handleCodigoKeyDown}
                                          inputProps={{ style: { color: 'white' } }}
                                          InputLabelProps={{ style: { color: 'white' } }}
                                          InputProps={{
                                            endAdornment: (
                                              <InputAdornment position="end">
                                                <IconButton
                                                  color="warning"
                                                  onClick={() => {
                                                    // acción del botón de búsqueda
                                                  }}
                                                  edge="end"
                                                >
                                                  <FindIcon />
                                                </IconButton>
                                              </InputAdornment>
                                            ),
                                          }}
                                        />                                
                                    </Grid>

                                    <Grid item xs={isSmallScreen ? 12 :3.5}>
                                        <TextField variant="outlined" 
                                                    placeholder="RAZON SOCIAL"
                                                    size="small"
                                                    sx={{mt:1}}
                                                    fullWidth
                                                    name="r_razon_social"
                                                    value={venta.r_razon_social}
                                                    onChange={handleChange} //new para busqueda
                                                    onKeyDown={handleCodigoKeyDown} //new para busqueda
                                                    inputProps={{ style:{color:'white'} }}
                                                    InputLabelProps={{ style:{color:'white'} }}
                                        />
                                    </Grid>

                                    <Grid item xs={isSmallScreen ? 12 : 6}>
                                        <TextField variant="outlined" 
                                                placeholder="DIRECCION"
                                                fullWidth
                                                size="small"
                                                //sx={{display:'block',
                                                //      margin:'.5rem 0'}}
                                                sx={{mt:1}}
                                                name="r_direccion"
                                                value={venta.r_direccion}
                                                onChange={handleChange}
                                                inputProps={{ style:{color:'white'} }}
                                                InputLabelProps={{ style:{color:'white'} }}
                                        />
                                    </Grid>

                              </Grid>
                              )}                            
                          </Grid>
                          
                          { (showModalProductoLista) ?
                            (
                              <ListaPopUp
                                  registroPopUp={producto_select}
                                  gruposPopUp={grupo_select}
                                  showModal={showModalProductoLista}
                                  setShowModal={setShowModalProductoLista}
                                  registro={producto}                    
                                  setRegistro={setProducto}                    
                                  idCodigoKey="id_producto"
                                  descripcionKey="descripcion"
                                  auxiliarKey="auxiliar"
                              />
                            )
                            :
                            (
                              <></>
                            )
                          }

                          { (producto.auxiliar) ?
                            (   <>
                                        {/* Seccion para mostrar Dialog tipo Modal, para busqueda incremental cuentas */}
                                        <Dialog
                                          //open={showModalProducto}
                                          //onClose={() => setShowModalProducto(false)}
                                          open={true}
                                          onClose={() => {
                                            setProducto({ ...producto, auxiliar: '' });

                                            }
                                          } // o setProducto({})                                          
                                          //onClose={() => setProducto(prev => ({ ...prev, cantidad: '' }))} // o setProducto({})                                          
                                          maxWidth="md" // Valor predeterminado de 960px
                                          disableScrollLock // Evita que se modifique el overflow del body
                                          PaperProps={{
                                            style: {
                                              top: isSmallScreen ? "-10vh" : "0vh", // Ajusta la distancia desde arriba
                                              left: isSmallScreen ? "0%" : "0%", // Centrado horizontal
                                              display: 'flex',
                                              flexDirection: 'column',
                                              alignItems: 'center',
                                              marginTop: '10vh', // Ajusta este valor según tus necesidades
                                              //background:'#1e272e',
                                              //background: 'rgba(33, 150, 243, 0.8)', // Cambiado a color RGBA para la transparencia                              
                                              background: 'rgba(30, 39, 46, 0.9)', // Plomo transparencia                                                                            
                                              color:'white',
                                              width: isSmallScreen ? ('70%') : ('30%'), // Ajusta este valor según tus necesidades
                                              //width: isSmallScreen ? ('100%') : ('40%'), // Ajusta este valor según tus necesidades
                                              //maxWidth: 'none' // Esto es importante para permitir que el valor de width funcione
                                            },
                                          }}
                                        >
                                        <DialogTitle>Producto - Item</DialogTitle>
                                            <Tooltip title={producto.descripcion}>
                                            <TextField
                                              variant="outlined"
                                              placeholder="PRODUCTO"
                                              inputRef={inputProductoRef} // Asocia la referencia al campo de texto
                                              onFocus={handleFocus} //Si esta en celular, quita el foco y desaparece automaticament el teclado
                                              autoFocus
                                              size="small"
                                              name="id_producto"
                                              value={producto.descripcion}
                                              InputLabelProps={{ style: { color: 'white' } }}
                                              InputProps={{
                                                style: { color: 'white', width: 270 },
                                                startAdornment: (
                                                  <InputAdornment position="start">
                                                    
                                                    <IconButton
                                                      color="primary"
                                                      //color = 'rgba(33, 150, 243, 0.8)'
                                                      aria-label="upload picture"
                                                      component="label"
                                                      size="small"
                                                      sx={{
                                                        position: 'absolute',
                                                        top: '50%',
                                                        left: 0,
                                                        transform: 'translateY(-50%)',
                                                      }}
                                                      onClick={() => {
                                                        setShowModalProductoLista(true);
                                                      }}
                                                    >
                                                      <FindIcon />
                                                    </IconButton>
                                                    
                                                    { //En caso celular, mostrar icono teclado, (desactivado teclado al momento del foco)
                                                    isSmallScreen ? (
                                                    <IconButton
                                                      color="default"
                                                      aria-label="Muestra teclado"
                                                      size="small"
                                                      onClick={handleMostrarTecladoCelular} // Mostrar teclado virtual en celular
                                                      sx={{
                                                        padding: '0px',
                                                        //height:'30',
                                                        marginLeft:'20px',
                                                        marginRight: '-30px',
                                                        backgroundColor: 'primary', // Color de fondo del ícono
                                                        borderRadius: '4px', // Bordes redondeados
                                                        '&:hover': {
                                                          backgroundColor: 'skyblue', // Color de fondo al hacer hover
                                                        },
                                                      }}                                                        
                                                    >
                                                      <KeyboardIcon />
                                                    </IconButton>
                                                    )
                                                    :
                                                    null
                                                  }

                                                  </InputAdornment>
                                                ),

                                                // Aquí se ajusta el padding del texto sin afectar el icono
                                                inputProps: {
                                                  style: {
                                                    paddingLeft: '32px', // Mueve solo el texto a la derecha
                                                      fontSize: '12px', // Ajusta el tamaño de letra aquí
                                                  },
                                                },
                                              }}
                                            />
                                            </Tooltip>
                                                  {/*
                                                  <ListaPopUp
                                                      registroPopUp={producto_select}
                                                      gruposPopUp={grupo_select}
                                                      showModal={showModalProductoLista}
                                                      setShowModal={0}
                                                      registro={producto}                    
                                                      setRegistro={setProducto}                    
                                                      idCodigoKey="id_producto"
                                                      descripcionKey="descripcion"
                                                      auxiliarKey="auxiliar"
                                                  /> */}

                                            <TextField
                                              variant="outlined"
                                              placeholder="CANTIDAD"
                                              label="CANTIDAD"
                                              autoFocus
                                              size="small"
                                              sx={{ mt: 2 }}
                                              name="cantidad"
                                              value={producto.cantidad}
                                              onChange={handleChangeProductoDatos}
                                              inputProps={{
                                                style: {
                                                  color: 'white',
                                                  width: 110,
                                                  textAlign: 'right',
                                                  readOnly: true,
                                                },
                                              }}
                                              InputLabelProps={{ style: { color: 'white' } }}
                                              InputProps={{
                                                startAdornment: (
                                                  <InputAdornment position="start">
                                                    <IconButton
                                                      color="default"
                                                      aria-label="reiniciar a 1"
                                                      size="small"
                                                      onClick={handleResetCantidad} // Función para retroceder cambios
                                                      sx={{
                                                        padding: '0px',
                                                        height:'30',
                                                        marginLeft:'-10px',
                                                        marginRight: '0px',
                                                        backgroundColor: 'primary', // Color de fondo del ícono
                                                        borderRadius: '4px', // Bordes redondeados
                                                        '&:hover': {
                                                          backgroundColor: 'skyblue', // Color de fondo al hacer hover
                                                        },
                                                      }}                                                        
                                                    >
                                                      <RestartAltIcon />
                                                    </IconButton>
                                                    

                                                  </InputAdornment>
                                                ),
                                                endAdornment: (
                                                  <InputAdornment position="end">

                                                    <IconButton
                                                      color="default"
                                                      aria-label="disminuir en 1"
                                                      size="small"
                                                      onClick={handleDecreaseByOne} // Función para retroceder cambios
                                                      sx={{
                                                        padding: '0px',
                                                        height: '48px',      // alto mayor
                                                        marginRight: '0px',
                                                        backgroundColor: 'primary', // Color de fondo del ícono
                                                        borderRadius: '4px', // Bordes redondeados
                                                        '&:hover': {
                                                          backgroundColor: 'skyblue', // Color de fondo al hacer hover
                                                        },
                                                      }}                                                        
                                                    >
                                                      <IndeterminateCheckBox  color="inherit" style={{ width: 35, height: 35 }} />
                                                    </IconButton>

                                                    <IconButton
                                                      color="default"
                                                      aria-label="aumentar de 1 en 1"
                                                      size="small"
                                                      onClick={handleIncreaseByOne} // Función para aumentar de 1 en 1
                                                      sx={{
                                                        padding: '0px',
                                                        marginRight: '5px',
                                                        backgroundColor: 'primary', // Color de fondo del ícono
                                                        borderRadius: '4px', // Bordes redondeados
                                                        '&:hover': {
                                                          backgroundColor: 'skyblue', // Color de fondo al hacer hover
                                                        },
                                                      }}                                                        
                                                    >
                                                      <AddCircleIcon color="success" style={{ width: 35, height: 35 }}/>
                                                    </IconButton>

                                                    <IconButton
                                                      color="default"
                                                      aria-label="aumentar de 10 en 10"
                                                      size="large"
                                                      onClick={handleIncreaseByTen} // Función para aumentar de 10 en 10
                                                      sx={{
                                                        padding: '0px',
                                                        marginRight: '-10px',
                                                        backgroundColor: 'primary', // Color de fondo del ícono
                                                        borderRadius: '4px', // Bordes redondeados
                                                        '&:hover': {
                                                          backgroundColor: 'skyblue', // Color de fondo al hacer hover
                                                        },
                                                      }}                                                        
                                                    >
                                                        <Box
                                                          sx={{
                                                            width: 25, 
                                                            height: 35, 
                                                            overflow: 'hidden' // recorta lo que sobre
                                                          }}
                                                        >
                                                          <Timer10SelectIcon 
                                                            color="success" 
                                                            sx={{ fontSize: 35 }} 
                                                          />
                                                        </Box>
                                                    </IconButton>
                                                  </InputAdornment>
                                                ),
                                              }}
                                            />

                                            <TextField variant="outlined" 
                                                      //maxWidth="md"
                                                      placeholder='PRECIO U.'
                                                      label='PRECIO U.'
                                                      autoFocus
                                                      size="small"
                                                      //sx={{mt:-1}}
                                                      name="precio_unitario"
                                                      value={producto.precio_unitario}
                                                      onChange={handleChangeProductoDatos}
                                                      //onKeyDown={handleCodigoKeyDown} //new para busqueda
                                                      inputProps={{ style:{color:'white',width: 240, textAlign: 'center',  readOnly: true} }}
                                                      InputLabelProps={{ style:{color:'white'} }}
                                            />
                                            <TextField variant="outlined" 
                                                      //maxWidth="md"
                                                      placeholder='IMPORTE'
                                                      label='IMPORTE'
                                                      autoFocus
                                                      size="small"
                                                      //sx={{mt:-1}}
                                                      name="precio_neto"
                                                      value={producto.precio_neto}
                                                      //onChange={handleSearchTextCuentaChange} //new para busqueda
                                                      //onKeyDown={handleCodigoKeyDown} //new para busqueda
                                                      inputProps={{ style:{color:'white',width: 240, textAlign: 'center',  readOnly: true} }}
                                                      InputLabelProps={{ style:{color:'white'} }}
                                            />
                                            <Button variant='contained' 
                                                        color='success' 
                                                        //size='small'
                                                        //startIcon={<AssessmentRoundedIcon />}
                                                        onClick={ ()=> {
                                                          handleSaveDetail();
                                                          setProducto({ ...producto, cantidad: '', auxiliar: '' });
                                                          }
                                                        }
                                                        sx={{display:'block',margin:'.5rem 0', width: 270}}
                                                        //sx={{margin:'.5rem 0', height:55}}
                                                        >
                                                        AGREGAR
                                            </Button>
                                            <Button variant='contained' 
                                                        //color='warning' 
                                                        //size='small'
                                                        onClick={()=>{
                                                              //setShowModalProducto(false);
                                                              //setProducto(prevState => ({ ...prevState, cantidad: '' }));
                                                              //setProducto({ ...producto, cantidad: '' });
                                                              setProducto(prevState => ({ ...prevState, cantidad: '', auxiliar: '' }));
                                                              setProducto({ ...producto, cantidad: '', auxiliar: '' }); //limpia cantidad para nuevo ingreso
                                                              //actualizar el estado previo tambien
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
                                        {/* FIN Seccion para mostrar Dialog tipo Modal */}
                                </>
                            )
                            :
                            (   
                              <>
                              </>
                            )
                          }



                          { (showModalEmite) ?
                            (   <>
                                        {/* Seccion para mostrar Dialog tipo Modal, para busqueda incremental cuentas */}
                                        <Dialog
                                          open={showModalEmite}
                                          onClose={() => setShowModalEmite(false)}
                                          maxWidth="md" // Valor predeterminado de 960px
                                          //fullWidth
                                          disableScrollLock // Evita que se modifique el overflow del body
                                          PaperProps={{
                                            style: {
                                              top: isSmallScreen ? "-10vh" : "0vh", // Ajusta la distancia desde arriba
                                              left: isSmallScreen ? "0%" : "0%", // Centrado horizontal
                                              display: 'flex',
                                              flexDirection: 'column',
                                              alignItems: 'center',
                                              marginTop: '10vh', // Ajusta este valor según tus necesidades
                                              //background:'#1e272e',
                                              background: 'rgba(30, 39, 46, 0.95)', // Plomo transparencia                              
                                              //background: 'rgba(16, 27, 61, 0.95)', // Azul transparencia                              
                                              color:'white',
                                              width: isSmallScreen ? ('70%') : ('30%'), // Ajusta este valor según tus necesidades
                                              //width: isSmallScreen ? ('100%') : ('40%'), // Ajusta este valor según tus necesidades
                                              //maxWidth: 'none' // Esto es importante para permitir que el valor de width funcione
                                            },
                                          }}
                                        >
                                        <DialogTitle>Datos - Emision</DialogTitle>

                                            <ToggleButtonGroup
                                                color="success"
                                                value={valorEmite}
                                                exclusive
                                                size="small"
                                                onChange={actualizaValorEmite}
                                                aria-label="Platform"
                                                sx={{
                                                  width: 270, // Ajusta el ancho que quieres
                                                  margin: '0.5rem 0', // Opcional: márgenes
                                                }}                                                
                                            >
                                                {/*asignar permisos a cada ToggleButton, desde conf seguridad_serie (r_cod) cod_select*/}
                                              {isAllowed('01') && (
                                              <ToggleButton value="01"
                                                            sx={{ flex: 1 }} // Cada botón ocupa el mismo espacio
                                                            style={{
                                                              backgroundColor: valorEmite === '01' ? 'lightblue' : 'transparent',
                                                              color: valorEmite === '01' ? "orange" : "gray",
                                                              borderRadius: '4px', // Puedes ajustar este valor según la cantidad de redondeo que desees                    
                                                            }}
                                              >FACT</ToggleButton>
                                              )}  

                                              {isAllowed('03') && (
                                              <ToggleButton value="03"
                                                            sx={{ flex: 1 }} // Cada botón ocupa el mismo espacio
                                                            style={{
                                                              backgroundColor: valorEmite === '03' ? 'lightblue' : 'transparent',
                                                              color: valorEmite === '03' ? 'orange' : 'gray',
                                                              borderRadius: '4px', // Puedes ajustar este valor según la cantidad de redondeo que desees                    
                                                            }}
                                              >BOL</ToggleButton>
                                              )}  

                                              {isAllowed('NV') && (
                                              <ToggleButton value="NV"
                                                            sx={{ flex: 1 }} // Cada botón ocupa el mismo espacio
                                                            style={{
                                                              backgroundColor: valorEmite === 'NV' ? 'lightblue' : 'transparent',
                                                              color: valorEmite === 'NV' ? 'orange' : 'gray',
                                                              borderRadius: '4px', // Puedes ajustar este valor según la cantidad de redondeo que desees                    
                                                            }}
                                              >NV</ToggleButton>
                                              )}  

                                              {isAllowed('07') && (
                                              <ToggleButton value="07"
                                                            sx={{ flex: 1 }} // Cada botón ocupa el mismo espacio
                                                            style={{
                                                              backgroundColor: valorEmite === '07' ? 'lightblue' : 'transparent',
                                                              color: valorEmite === '07' ? 'orange' : 'gray',
                                                              borderRadius: '4px', // Puedes ajustar este valor según la cantidad de redondeo que desees                    
                                                            }}
                                              >NCred</ToggleButton>
                                              )}  

                                            </ToggleButtonGroup>

                                            <TextField
                                                    variant="outlined"
                                                    placeholder="RUC/DNI"
                                                    autoFocus
                                                    size="small"
                                                    autoComplete="off"
                                                    name="r_documento_id"
                                                    value={datosEmitir.r_documento_id}
                                                    onChange={(e) => handleChangeEmite('r_documento_id', e.target.value)}
                                                    InputLabelProps={{ style: { color: 'white' } }}
                                                    InputProps={{
                                                      style: { color: 'white', width: 270 },
                                                      endAdornment: (
                                                        <IconButton
                                                          color="default"
                                                          aria-label="upload picture"
                                                          component="label"
                                                          size="small"
                                                          sx={{
                                                            position: 'absolute',
                                                            top: '50%',
                                                            right: 0,
                                                            transform: 'translateY(-50%)',
                                                            color: 'orange',
                                                          }}
                                                          onClick={() => {
                                                            //
                                                            mostrarRazonSocialGenera(datosEmitir.r_documento_id);
                                                          }}
                                                        >
                                                          <FindIcon />
                                                        </IconButton>
                                                      ),
                                                      inputProps: {
                                                        style: {
                                                          paddingLeft: '32px', // Mueve solo el texto a la derecha
                                                          fontSize: '18px', // Ajusta el tamaño de letra aquí
                                                        },
                                                      },
                                                    }}
                                                    sx={{
                                                      mt:-1,
                                                      '& .MuiInputBase-input': {
                                                        textAlign: 'center', // Alinea el texto del campo
                                                      },
                                                    }}
                                             />
                                            
                                             <Select
                                                    labelId="documento_select"
                                                    value={ id_docBusca || datosEmitir.r_id_doc}  // 
                                                    size='small'
                                                    name="r_id_doc"
                                                    //fullWidth
                                                    sx={{display:'block',
                                                         //margin:'.4rem 0', 
                                                         mt:0,
                                                         width: '270px',  // Establece el ancho fijo aquí
                                                         textAlign: 'center',  // Centrar el texto seleccionado
                                                         '.MuiSelect-select': { 
                                                           textAlign: 'center',  // Centrar el valor dentro del Select
                                                         },                                                         
                                                         color:"white"}}
                                                    label="doc"
                                                    onChange={(e) => handleChangeEmite('r_id_doc', e.target.value)}
                                                >
                                                    {   
                                                        doc_select.map(elemento => (
                                                        <MenuItem key={elemento.codigo} value={elemento.codigo}
                                                                  sx={{ justifyContent: 'center' }} // Centra el texto en cada opción
                                                        >
                                                        {elemento.descripcion}
                                                        </MenuItem>)) 
                                                    }
                                            </Select>

                                            <Tooltip title={datosEmitir.r_razon_social}>
                                                <TextField variant="outlined" 
                                                          //maxWidth="md"
                                                          placeholder='RAZON SOCIAL'
                                                          //label='RAZON SOCIAL'
                                                          autoFocus
                                                          size="small"
                                                          autoComplete="off"
                                                          sx={{mt:0}}
                                                          name="r_razon_social"
                                                          value={datosEmitir.r_razon_social}
                                                          onChange={(e) => handleChangeEmite('r_razon_social', e.target.value)}
                                                          //onKeyDown={handleCodigoKeyDown} //new para busqueda
                                                          inputProps={{ style:{color:'white',width: 240, textAlign: 'center',  readOnly: true} }}
                                                          InputLabelProps={{ style:{color:'white'} }}
                                                />
                                            </Tooltip>
                                            <TextField variant="outlined" 
                                                      //maxWidth="md"
                                                      placeholder='DIRECCION'
                                                      //label='DIRECCION'
                                                      autoFocus
                                                      size="small"
                                                      autoComplete="off"
                                                      //sx={{mt:-1}}
                                                      name="r_direccion"
                                                      value={datosEmitir.r_direccion}
                                                      //onChange={handleSearchTextCuentaChange} //new para busqueda
                                                      onChange={(e) => handleChangeEmite('r_direccion', e.target.value)}
                                                      //onKeyDown={handleCodigoKeyDown} //new para busqueda
                                                      inputProps={{ style:{color:'white',width: 240, textAlign: 'center',  readOnly: true} }}
                                                      InputLabelProps={{ style:{color:'white'} }}
                                            />
                                            {(valorEmite==='07') && (
                                            <Select
                                                    labelId="motivo_select"
                                                    label="motivo"
                                                    value={datosEmitir.r_idmotivo_ref}  // 
                                                    size='small'
                                                    name="r_idmotivo_ref"
                                                    //fullWidth
                                                    sx={{display:'block',
                                                         //margin:'.4rem 0', 
                                                         mt:0,
                                                         width: '270px',  // Establece el ancho fijo aquí
                                                         textAlign: 'center',  // Centrar el texto seleccionado
                                                         '.MuiSelect-select': { 
                                                           textAlign: 'center',  // Centrar el valor dentro del Select
                                                         },                                                         
                                                         color:"white"}}
                                                    onChange={(e) => handleChangeEmite('r_idmotivo_ref', e.target.value)}
                                            >
                                                    {   
                                                        motivo_select.map(elemento => (
                                                        <MenuItem key={elemento.codigo} value={elemento.codigo}
                                                                  sx={{ justifyContent: 'center' }} // Centra el texto en cada opción
                                                        >
                                                        {elemento.descripcion}
                                                        </MenuItem>)) 
                                                    }
                                            </Select>)}


                                          {/* Campo EFECTIVO */}
                                          <Box sx={{ display: "inline-block" }}>
                                            <TextField
                                              variant="outlined"
                                              autoFocus
                                              size="small"
                                              autoComplete="off"
                                              name="efectivo"
                                              value={datosEmitir.efectivo}
                                              onChange={(e) => handleChangeEmite("efectivo", e.target.value)}
                                              InputProps={{
                                                startAdornment: (
                                                  <InputAdornment position="start">
                                                    <Box sx={{ color: "gray", fontSize: "0.85rem" }}>EFECTIVO</Box>
                                                  </InputAdornment>
                                                ),
                                                endAdornment:
                                                  datosEmitir.efectivo > 0 && (
                                                    <InputAdornment position="end">
                                                      <IconButton size="small" onClick={() => handleSwitch("efectivo")}>
                                                        <CompareArrowsIcon sx={{ color: "white" }} />
                                                      </IconButton>
                                                    </InputAdornment>
                                                  ),
                                              }}
                                              sx={{
                                                width: 270,
                                                "& input": {
                                                  textAlign: "center",
                                                  color: "white",
                                                },
                                                "& .MuiOutlinedInput-root": {
                                                  paddingRight: "4px", // para que el botón no corte el borde
                                                },
                                              }}

                                              InputLabelProps={{ style: { color: "white" } }}
                                            />
                                          </Box>

                                          {/* Campo EFECTIVO2 */}
                                          <Box sx={{ position: "relative", width: 270 }}>
                                            <TextField
                                              variant="outlined"
                                              size="small"
                                              autoComplete="off"
                                              name="efectivo2"
                                              value={datosEmitir.efectivo2}
                                              onChange={(e) => handleChangeEmite("efectivo2", e.target.value)}
                                              InputProps={{
                                                startAdornment: (
                                                  <InputAdornment position="start">
                                                    <Select
                                                      value={datosEmitir.forma_pago2 || "YAPE"}
                                                      onChange={(e) => handleChangeEmite("forma_pago2", e.target.value)}
                                                      variant="standard"
                                                      disableUnderline
                                                      sx={{
                                                        color: "gray",
                                                        fontSize: "0.85rem",
                                                        width: 90,
                                                        "& .MuiSelect-icon": { color: "gray" },
                                                      }}
                                                    >
                                                      {formasPago.map((forma) => (
                                                        <MenuItem key={forma} value={forma}>
                                                          {forma}
                                                        </MenuItem>
                                                      ))}
                                                    </Select>
                                                  </InputAdornment>
                                                ),
                                                endAdornment: datosEmitir.efectivo2 > 0 && (
                                                  <InputAdornment position="end">
                                                    <IconButton size="small" onClick={() => handleSwitch("efectivo2")}>
                                                      <CompareArrowsIcon sx={{ color: "white" }} />
                                                    </IconButton>
                                                  </InputAdornment>
                                                ),
                                              }}
                                              sx={{
                                                width: 270,
                                                "& input": {
                                                  textAlign: "center",
                                                  color: "white",
                                                },
                                                "& .MuiOutlinedInput-root": {
                                                  paddingRight: "4px", // para que el botón no corte el borde
                                                },
                                              }}
                                              InputLabelProps={{ style: { color: "white" } }}
                                            />
                                          </Box>


                                            <Button variant='contained' 
                                                        color='primary' 
                                                        //size='small'
                                                        onClick={handleSaveComprobante}
                                                        sx={{display:'block',margin:'.5rem 0', width: 270}}
                                                        >
                                                        GRABAR
                                            </Button>
                                            <Button variant='contained' 
                                                        //color='warning' 
                                                        //size='small'
                                                        onClick={()=>{
                                                              setShowModalEmite(false);
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
                                        {/* FIN Seccion para mostrar Dialog tipo Modal */}
                                </>
                            )
                            :
                            (   
                              <>
                              </>
                            )
                          }

                    </form>
                </CardContent>
            </Card>


    <Card sx={{mt:1}}
                  style={{
                    background:'#1e272e',
                    //maxWidth: '700px', // Ajusta este valor según tu preferencia
                    padding:'1rem',
                  }}
            >
              <Datatable
                //title={actions}
                theme="solarized"
                columns={columnas}
                data={registrosdet}
                contextActions={contextActions}
                actions={actions}
                onSelectedRowsChange={handleRowSelected}
                selectableRowsComponent={Checkbox} // Pass the function only
                sortIcon={<ArrowDownward />}
                dense={true}
                highlightOnHover //resalta la fila
              >
              </Datatable>
            </Card>

  </div>    
  );
}
