import {Grid,Card,CardContent,useMediaQuery,Typography,TextField,Button,CircularProgress,Select,MenuItem,InputLabel,Box,FormControl, List,ListItem,ListItemText,Dialog,DialogContent,DialogTitle, responsiveFontSizes} from '@mui/material'
import {useState,useEffect,useRef,useMemo,useCallback} from 'react';
import {useNavigate, useParams, useLocation} from 'react-router-dom';
import axios from 'axios';
import AddIcon from '@mui/icons-material/Add';
import FindIcon from '@mui/icons-material/FindInPage';
import InputAdornment from '@mui/material/InputAdornment';
import Tooltip from '@mui/material/Tooltip';
import ReplyIcon from '@mui/icons-material/Reply';

import UpdateIcon from '@mui/icons-material/Update';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';

import DeleteIcon from '@mui/icons-material/DeleteForeverRounded';
import IconButton from '@mui/material/IconButton';
import { useAuth0 } from '@auth0/auth0-react'; //new para cargar permisos luego de verificar registro en bd
//import logo from '../../Logo02.png';
import logo from '../../../../Logo04small.png';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import numeral from 'numeral';

import QRCode from 'qrcode';
import { NumerosALetras } from 'numero-a-letras';
import { useDialog } from "../../AdminConfirmDialogProvider";
import AdminSunatIcon from '../../AdminSunatIcon';
import AdminSunatIconPdf from '../../AdminSunatIconPdf';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';

import AdminVentaFormFactPedido from '../../AdminVentaFormFactPedido';
import { ensureAdminVentaTableTheme } from '../common/adminVentaTableTheme';
import AdminVentaProductoModal from './AdminVentaProductoModal';
import AdminVentaEmisionModal from './AdminVentaEmisionModal';
import AdminVentaFormTables from './AdminVentaFormTables';

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
  const [showModalFactPedidos, setShowModalFactPedidos] = useState(false);
  const [referenciasSeleccionadas, setReferenciasSeleccionadas] = useState([]); //New recibir resultados si op. grabar es exitosa

  const [showModalEmite, setShowModalEmite] = useState(false);
  const [detalleValores, setDetalleValores] = useState(null);

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
  const [registrosref,setRegistrosref] = useState([]);
  //const fecha_actual = new Date();
  const formasPago = ['YAPE', 'PLIN', 'TRANSFERENCIA', 'TARJETA'];
  const [motivo_select, setMotivoSelect] = useState([]);
  const [serie_select, setSerieSelect] = useState([]); //Serie autorizada por (usuario@gmail)
  const [serieEmite, setSerieEmite] = useState('0001');//por default para NV

  const abrirModalPedidos = () => {
    setShowModalFactPedidos(true);
  };
  const cerrarModalPedidos = () => {
    setShowModalFactPedidos(false);
  };
  const handleCloseFactPedidos = async (payload) => {
    if (!payload) {
      cerrarModalPedidos();
      return;
    }

    try {
      const response = await axios.post(`${back_host}/ad_ventainsrefgrupo`,payload);

      if (response.data?.success === true) {
        //GUARDAR SOLO REFERENCIAS
        setReferenciasSeleccionadas(
          payload.referencias || []
        );

        cerrarModalPedidos();

        /*swal({
          text:
            'Pedidos agrupados correctamente',
          icon: 'success',
          timer: 2000
        });*/
        setUpdateTrigger(Math.random());//actualizad vista detalle
        alert('Pedidos agrupados correctamente');
      } else {
          /*swal({
            text:
              response.data?.message ||
              'Error procesando pedidos',
            icon: 'error'
          });*/
          alert('Error procesando pedidos');
      }

    } catch (error) {
      console.log(error);
      /*swal({
        text:
          'Error conectando con servidor',
        icon: 'error'
      });*/
      alert('Error conectando con servidor');
    }
  };


  const actualizaValorEmite = (e) => {
    setValorEmite(e.target.value);
    setDatosEmitir(prevState => ({ ...prevState, r_cod_emitir: e.target.value }));
    //Aqui cargamos las series acordes cal comprobante
    //New
    cargaSeriesUsuario(e.target.value);
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
  const cargaSeriesUsuario = (r_cod) =>{
    //Series habilitadas para ventas (usuario@gmail.com)
    console.log(`${back_host}/ad_ventaseries/${params.id_anfitrion}/${params.documento_id}/${params.id_invitado}/${r_cod}`);
    axios
    .get(`${back_host}/ad_ventaseries/${params.id_anfitrion}/${params.documento_id}/${params.id_invitado}/${r_cod}`)
    .then((response) => {
        setSerieSelect(response.data.data);
        //Si es un solo registro, setear valorEmite
        console.log(`Verificando 1era serie: `, response.data.data.length, response.data.data[0].r_serie);
        if (response.data.data.length > 0) {
          setSerieEmite(response.data.data[0].r_serie);
        }
        /*if (response.data.data.length === 1) {
          setSerieEmite(response.data.data.r_serie);
        }*/
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
    r_moneda:'PEN',         //new default
    r_forma_pago_id:'Contado', //new default
    dias_credito:0,         //new default
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
      mostrarVentaRef(COD, SERIE, NUMERO);
      
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
    cargaSeriesUsuario("03"); //new default

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
      if (producto.modoEdicionValores) {
        return;
      }

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
      

  },[producto.auxiliar, producto.modoEdicionValores]);

  useEffect( ()=> {
      //mostrar detalle actualizado y encabezado mas por el rico total
      const [COD, SERIE, NUMERO, ELEM] = params.comprobante.split('-');

      mostrarVenta(COD, SERIE, NUMERO, ELEM); 
      mostrarVentaDetalle(COD, SERIE, NUMERO, ELEM);
      mostrarVentaRef(COD, SERIE, NUMERO);
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
  const handleFormaPago = (formaPago) => {
    setDatosEmitir(prev => ({
      ...prev,
      r_forma_pago_id: formaPago,
      dias_credito: formaPago === 'Credito' ? 15 : 0
    }));
  };
  const handleDiasCredito = (value) => {
    setDatosEmitir(prev => ({
      ...prev,
      dias_credito: value
    }));
  };

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
    //new control de series
    if (name === 'r_serie'){
      setSerieEmite(value);
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
        
        //redondeamos a 2 decimales, presentacion en formulario
        producto.precio_unitario = parseFloat(precio_unitario).toFixed(2);
        
        //pero el calculo lo hacemos con todos los decimales de (precio_unitario), para evitar errores de redondeo
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

    if (e.target.name === "precio_neto"){
      const cantidad = parseFloat(producto.cantidad);
      if (cantidad > 0) {
        producto.precio_unitario = (parseFloat(e.target.value || 0) / cantidad).toFixed(6);
      }
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

    //devolvemos todos los decimales, para evitar errores de redondeo
    return rango ? parseFloat(rango.precio_venta/rango.unidades) : 0; // 0 si no encuentra rango
    //return rango  ? parseFloat((rango.precio_venta / rango.unidades).toFixed(2)) : 0;

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

  const mostrarVentaRef = async (cod,serie,num) => {
    console.log(`${back_host}/ad_ventadetref/${params.id_anfitrion}/${params.documento_id}/${cod}/${serie}/${num}`);
    const res = await fetch(`${back_host}/ad_ventadetref/${params.id_anfitrion}/${params.documento_id}/${cod}/${serie}/${num}`);
    const dataDet = await res.json();
    setRegistrosref(dataDet);
    //console.log(dataDet);
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
      if (detalleValores) {
        confirmaModificarDetalleValores();
        return;
      }

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

    //Quitar modal emitir
    setShowModalEmite(false);
  }

  const handleEditarDetalleClick = (row)=>{
    handleEditarDetalleValoresClick(row);
  }

  const toDetalleNumber = (value) => {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const handleEditarDetalleValoresClick = (row) => {
    const detalleSeleccionado = {
      ...row,
      cantidad: row.cantidad ?? '',
      precio_unitario: row.precio_unitario ?? '',
      precio_neto: row.precio_neto ?? '',
      precio_neto_original: row.precio_neto ?? 0,
    };

    setDetalleValores(detalleSeleccionado);
    setProducto((prevState) => ({
      ...prevState,
      ...detalleSeleccionado,
      modoEdicionValores: true,
      auxiliar: detalleSeleccionado.auxiliar || `${detalleSeleccionado.precio_unitario}-${detalleSeleccionado.cont_und}-${detalleSeleccionado.porc_igv}`,
    }));
  };

  const handleCloseDetalleValores = () => {
    setDetalleValores(null);
    setProducto((prevState) => ({ ...prevState, cantidad: '', auxiliar: '', modoEdicionValores: false }));
  };

  const totalPrevioDetalle = detalleValores
    ? toDetalleNumber(venta.r_monto_total) - toDetalleNumber(detalleValores.precio_neto_original) + toDetalleNumber(producto.precio_neto)
    : null;

  const confirmaModificarDetalleValores = async () => {
    if (!detalleValores) {
      return;
    }

    const cantidad = toDetalleNumber(producto.cantidad);
    const precioUnitario = toDetalleNumber(producto.precio_unitario);
    const precioNeto = toDetalleNumber(producto.precio_neto);

    if (cantidad <= 0 || precioNeto < 0) {
      confirmDialog({
        title: 'Revise cantidad e importe',
        icon: 'warning',
        confirmText: 'ACEPTAR',
      });
      return;
    }

    const [COD, SERIE, NUMERO, ELEM] = params.comprobante.split('-');
    const sRuta = `${back_host}/ad_ventadet/${params.periodo}/${params.id_anfitrion}/${params.documento_id}/${COD}/${SERIE}/${NUMERO}/${ELEM}/${detalleValores.item}`;
    const payload = {
      descripcion: detalleValores.descripcion,
      r_fecemi: venta.r_fecemi,
      cantidad,
      precio_unitario: precioUnitario,
      precio_neto: precioNeto,
      porc_igv: detalleValores.porc_igv,
    };

    try {
      const response = await fetch(sRuta, {
        method: 'PUT',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();

      if (data.success) {
        handleCloseDetalleValores();
        setUpdateTrigger(Math.random());
        return;
      }

      confirmDialog({
        title: 'La Operacion fallo, intentelo nuevamente',
        icon: 'error',
        confirmText: 'ACEPTAR',
      });
    } catch (error) {
      console.error('Hubo un problema con la solicitud fetch:', error);
      confirmDialog({
        title: 'Error conectando con servidor',
        icon: 'error',
        confirmText: 'ACEPTAR',
      });
    }
  };

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
        r_serie_emitir: serieEmite, //new caso solo(03,01,NV)
        
        r_id_doc: datosEmitir.r_id_doc,
        r_documento_id: datosEmitir.r_documento_id,
        r_razon_social: datosEmitir.r_razon_social,
        r_direccion: datosEmitir.r_direccion,

        efectivo: datosEmitir.efectivo,
        efectivo2: datosEmitir.efectivo2,
        forma_pago2: datosEmitir.forma_pago2,
        vuelto: datosEmitir.vuelto,
        r_moneda:datosEmitir.r_moneda,                //new
        r_forma_pago_id:datosEmitir.r_forma_pago_id,  //new
        dias_credito:datosEmitir.dias_credito,        //new

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

  
  //Usamos funcion eliminar para liberar proceso
  const handleLiberarProceso = (comprobante,elemento) => {
    //Recuerda que el comprobante enviado es el comprobante_key --> contiene el key del registro ;)
    confirmaLiberacion(params.id_anfitrion,params.documento_id,params.periodo,comprobante,elemento);
  };
  const confirmaLiberacion = async(sAnfitrion,sDocumentoId,sPeriodo,sComprobante,sElemento)=>{
    const result = await confirmDialog({
        title: "Eliminar Comprobante?",
        message: `${sComprobante}`,
        icon: "warning", // success | error | info | warning
        confirmText: "ELIMINAR",
        cancelText: "CANCELAR",
    });
    if (result.isConfirmed) {
          console.log("✅ Liberado:", sComprobante);
          eliminarRegistroSeleccionado(sAnfitrion,sDocumentoId,sPeriodo,sComprobante,sElemento);
          //navegar a la pagina anterior
          navigate(-1, { replace: true });

          //setToggleCleared(!toggleCleared);
          //setRegistrosdet(registrosdet.filter(registrosdet => registrosdet.comprobante !== sComprobante));
          //setTimeout(() => { setUpdateTrigger(Math.random());}, 200);
    } else {
      console.log("❌ Cancelado");
      return; // Salimos si el usuario cancela
    }
  };
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
                  title: "Proceso se ha eliminado con exito",
                  //message: `${sComprobante}`,
                  icon: "success", // success | error | info | warning
                  confirmText: "ACEPTAR"
                  //cancelText: "CERRAR",
          });
        } else {
          confirmDialog({
            title: "No se puede Eliminar Proceso, solo la ultima",
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


  /////////////////////////////////////////////////seccion datatable/////////////
  const [selectedRows, setSelectedRows] = useState([]);
  const [copiedRowId, setCopiedRowId] = useState(null);
  const columnas = [
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
    {
      name: '',
      width: '40px',
      cell: (row) => (
        (!visualizando) ? 
        (
          <DriveFileRenameOutlineIcon
            onClick={() => handleEditarDetalleClick(row)}
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
  const columnasref = [
    { name:'', 
      selector:row => '',
      sortable: true,
      width: '40px'
      //key:true
    },
    { name:'', 
      selector:row => '',
      sortable: true,
      width: '40px'
      //key:true
    },
    { name:'REFERENCIA', 
      selector:row => row.nv_cod + '-' + row.nv_serie + '-' + row.nv_num,
      sortable: true,
      width: '200px'
      //key:true
    },
    /*{ name:'SERIE', 
      selector:row => row.nv_serie,
      sortable: true,
      width: '100px'
      //key:true
    },
    { name:'NUMERO', 
      selector:row => row.nv_num,
      sortable: true,
      width: '120px'
      //key:true
    },*/
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
    <Tooltip title="Agregar Productos" arrow>
      <IconButton color="primary" 
        sx={{ width: 40, height: 40 }}
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
        <AddIcon sx={{ fontSize: 50 }} />
      </IconButton>
    </Tooltip>
    ):
    (<div></div>)
    }

    { pVenta010202 && !visualizando ?
    (
    <Tooltip title="Agregar Notas Venta" arrow>
      <IconButton color="primary" 
        sx={{ width: 40, height: 40 }}
        onClick = {()=> {
                    //Agregar Pedidos en forma de popup form AdminventaFormFactPedido
                    abrirModalPedidos();
                  }
                }
      >
        <AssignmentTurnedInIcon sx={{ fontSize: 40 }}/>
      </IconButton>
    </Tooltip>
    ):
    (<div></div>)
    }

    </>
);

  ensureAdminVentaTableTheme();

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
            {/* ========================================================== */}
            {/* MODAL PEDIDOS */}
            {/* ========================================================== */}
            <Dialog
              open={showModalFactPedidos}
              onClose={cerrarModalPedidos}
              maxWidth="xl"
              fullWidth
            >
              <DialogContent
                sx={{
                  background: '#1e272e',
                  padding: 2
                }}
              >
                <AdminVentaFormFactPedido
                  id_anfitrion={params.id_anfitrion}
                  documento_id={params.documento_id}
                  r_cod={venta.r_cod}
                  r_serie={venta.r_serie}
                  r_numero={venta.r_numero}
                  r_fecemi={venta.r_fecemi}
                  periodo_trabajo={params.periodo}
                  onClose={handleCloseFactPedidos}
                />
              </DialogContent>
            </Dialog>

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

                              <Grid item xs={isSmallScreen ? 12 : 2.5}>
                                <Typography variant='h5' color='white' textAlign='center'>
                                  {
                                    (`Total: S/ ${parseFloat(venta.r_monto_total).toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                    })}`) 
                                  }
                                </Typography>
                              </Grid>

                              <Grid item xs={isSmallScreen ? 8 : 1}>
                                    <Select
                                          size='small'
                                          value={datosEmitir.forma_pago}
                                          name="forma_pago"
                                          sx={{display:'block',
                                          margin:'.1rem 0', color:"skyblue", fontSize: '16px',mt:1 }}
                                          onChange={(e) => handleChangeEmite("forma_pago", e.target.value)}
                                          >
                                            <MenuItem value="Contado">CONTADO</MenuItem>
                                            <MenuItem value="Credito">CREDITO</MenuItem>
                                    </Select>
                              </Grid>
                              <Grid item xs={isSmallScreen ? 4 : 0.5}>
                                    <Select
                                          size='small'
                                          value={datosEmitir.r_moneda}
                                          name="r_moneda"
                                          sx={{display:'block',
                                          margin:'.1rem 0', color:"skyblue", fontSize: '16px',mt:1 }}
                                          onChange={(e) => handleChangeEmite("r_moneda", e.target.value)}
                                          >
                                            <MenuItem value="PEN">PEN</MenuItem>
                                            <MenuItem value="USD">USD</MenuItem>
                                    </Select>
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

                              <Grid item xs={isSmallScreen ? 11 : 1}>
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

                              <Grid item xs={isSmallScreen ? 1 : 0.2} 
                                sx={{ ml: -1.5}}
                              >
                              {
                                params.comprobante.includes('NP') ? (
                                  <Tooltip title="Liberar Proceso">
                                    <span>
                                      <IconButton
                                        color="primary"
                                        onClick={() => {

                                          handleLiberarProceso(params.comprobante, 1);
                                        }}
                                        disabled={!venta.r_fecemi}
                                        size="large"
                                      >
                                        {cargando ? (
                                          <CircularProgress size={20} />
                                        ) : (
                                          <DeleteIcon sx={{ fontSize: 45 }} />
                                        )}
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                ) : (
                                  <></>
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
                          
                          <AdminVentaProductoModal
                            isSmallScreen={isSmallScreen}
                            producto={producto}
                            setProducto={setProducto}
                            productoSelect={producto_select}
                            grupoSelect={grupo_select}
                            showModalProductoLista={showModalProductoLista}
                            setShowModalProductoLista={setShowModalProductoLista}
                            inputProductoRef={inputProductoRef}
                            onFocus={handleFocus}
                            onMostrarTecladoCelular={handleMostrarTecladoCelular}
                            onChangeProductoDatos={handleChangeProductoDatos}
                            onResetCantidad={handleResetCantidad}
                            onDecreaseByOne={handleDecreaseByOne}
                            onIncreaseByOne={handleIncreaseByOne}
                            onIncreaseByTen={handleIncreaseByTen}
                            onSaveDetail={handleSaveDetail}
                            modoEdicionValores={Boolean(detalleValores)}
                            totalActual={venta.r_monto_total}
                            totalPrevio={totalPrevioDetalle}
                            onCloseProducto={handleCloseDetalleValores}
                          />

                          <AdminVentaEmisionModal
                            open={showModalEmite}
                            isSmallScreen={isSmallScreen}
                            valorEmite={valorEmite}
                            serieEmite={serieEmite}
                            datosEmitir={datosEmitir}
                            docSelect={doc_select}
                            serieSelect={serie_select}
                            motivoSelect={motivo_select}
                            formasPago={formasPago}
                            idDocBusca={id_docBusca}
                            isAllowed={isAllowed}
                            onValorEmiteChange={actualizaValorEmite}
                            onChangeEmite={handleChangeEmite}
                            onBuscarRazonSocial={mostrarRazonSocialGenera}
                            onFormaPago={handleFormaPago}
                            onDiasCredito={handleDiasCredito}
                            onSwitchPago={handleSwitch}
                            onSaveComprobante={handleSaveComprobante}
                            onClose={() => setShowModalEmite(false)}
                          />

                    </form>
                </CardContent>
            </Card>


            <AdminVentaFormTables
              columnas={columnas}
              columnasref={columnasref}
              registrosdet={registrosdet}
              registrosref={registrosref}
              contextActions={contextActions}
              actions={actions}
              handleRowSelected={handleRowSelected}
            />


  </div>    
  );
}
