import {Grid,Card,CardContent,useMediaQuery,Typography,TextField,Button,CircularProgress,Select,MenuItem,InputLabel,Box,FormControl, List,ListItem,ListItemText,Dialog,DialogContent,DialogTitle} from '@mui/material'
import {useState,useEffect,useRef,useMemo,useCallback} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import axios from 'axios';
import AddBoxRoundedIcon from '@mui/icons-material/ShoppingCart';
import FindIcon from '@mui/icons-material/FindInPage';
import InputAdornment from '@mui/material/InputAdornment';
import Tooltip from '@mui/material/Tooltip';
import PrintIcon from '@mui/icons-material/Print';
import ReplyIcon from '@mui/icons-material/Reply';

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
import logo from '../../Logo02.png';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import numeral from 'numeral';
import ListaPopUp from '../ListaPopUp';

import swal from 'sweetalert';
import Datatable, {createTheme} from 'react-data-table-component';

export default function AdminVentaForm() {
  const isSmallScreen = useMediaQuery('(max-width: 600px)');
  //const back_host = process.env.BACK_HOST || "http://localhost:4000";
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";  
  ////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////
  const [updateTrigger, setUpdateTrigger] = useState({});
  const [cliente_select,setClienteSelect] = useState([]);
  //////////////////////////////////////////////////////////
  const [showModal, setShowModal] = useState(false);
  const [showModalProducto, setShowModalProducto] = useState(false);
  const [showModalProductoLista, setShowModalProductoLista] = useState(false);
  const [searchText, setSearchText] = useState('');
  const textFieldRef = useRef(null); //foco del buscador
  const [razonSocialBusca, setRazonSocialBusca] = useState("");
  //////////////////////////////////////////////////////////

  const [producto_select,setProductoSelect] = useState([]);
  
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

  const createPdf = async () => {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Add logo to the top of the page
    //const logoImage = pdfDoc.embedPng(logo);
    const pngImage = await pdfDoc.embedPng(logo);
    const pngDims = pngImage.scale(0.5)

    page.drawImage(pngImage, {
      //x: page.getWidth() / 2 - pngDims.width / 2 + 75,
      //y: page.getHeight() / 2 - pngDims.height + 250,
      x: 210,
      y: 780,
      width: pngDims.width,
      height: pngDims.height,
    })

    const fontSize = 12;
    const lineHeight = fontSize * 1.2;
    const margin = 50;
    let x = margin;
    let y = height - margin - lineHeight - 10;
    
    y = y - 10;

    // Draw column headers
    page.drawText(venta.tipo_op + ": "+ params.r_cod+"-"+params.r_serie+"-"+params.r_numero, { x:220, y, size: 16 });
    y=y-12; //aumentamos linea nueva
    y=y-5; //aumentamos linea nueva

    //Calculamos el punto x, acorde al largo de la razon social (centradito chochera ... claro pi cojuda)
    let centro;
    if (venta.razon_social===null) {
      centro = 0;
    }else{
      centro = (page.getWidth()/2) - (("CLIENTE: "+venta.razon_social).toString().length)/2 - margin - 40;
      page.drawText("CLIENTE: " + venta.razon_social?.toString() ?? "", { x:centro, y, size: 12 });
    }
    y=y-5; //aumentamos linea nueva
    y=y-12; //aumentamos linea nueva
    y=y-12; //aumentamos linea nueva
    
    ////////////////////////////////////////////////////////////////////
    page.drawRectangle({
      x: margin,
      y: y,
      width: (page.getWidth()-margin-50), //TODA ANCHO DE LA HOJA
      height: (lineHeight+7),
      borderWidth: 1,
      //color: rgb(0.778, 0.778, 0.778),
      borderColor: rgb(0.8,0.8,0.8)
    });
    page.drawText("FECHA: ", { x:55, y:y+4, size: 10 });
    page.drawText(venta.comprobante_original_fecemi, { x:100, y:y+4, size: 12 });

    page.drawText("ZONA: ", { x:55+140, y:y+4, size: 10 });
    page.drawText(venta.zona_venta, { x:100+140, y:y+4, size: 12 });

    ////////////////////////////////////////////////////////////////////
    page.drawText("VENDEDOR: ", { x:55+220+100, y:y+4, size: 10 });
    page.drawText(venta.vendedor, { x:260+160+30, y:y+4, size: 12 });
    
    ////////////////////////////////////////////////////////////////////
    
    //person.pedido?.toString() ?? ""
    y=y-12; //aumentamos linea nueva
    y=y-12; //aumentamos linea nueva
    y=y-5; //aumentamos linea nueva

    page.drawText("PAGO: ", { x:55, y:y+4, size: 10 });
    page.drawText(venta.formapago, { x:130, y:y+4, size: 10 });
    y=y-12; //aumentamos linea nueva
    page.drawText("VENTA: ", { x:55, y:y+4, size: 10 });
    page.drawText(venta.cond_venta, { x:130, y:y+4, size: 10 });
    y=y-12; //aumentamos linea nueva
    page.drawText("ENTREGA: ", { x:55, y:y+4, size: 10 });
    page.drawText(venta.cond_entrega, { x:130, y:y+4, size: 10 });

    ////////////////////////////////////////////////////////////////////
    // Draw table data
    let row = 1;
    let espaciadoDet = 0; //iniciamos en la 1era fila
    
    let precio_total = 0;
    espaciadoDet = espaciadoDet+20; ///NEW
    registrosdet.forEach((person) => {
      const text = `${person.descripcion}`;
      const textY = y - lineHeight; //corregimos aca, porque se duplicaba espacio en cada grupo
      page.drawRectangle({
        x: margin,
        y: y-espaciadoDet+2,
        width: (page.getWidth()-margin-50), //TODA ANCHO DE LA HOJA
        height: (lineHeight+2),
        borderWidth: 1,
        color: rgb(0.778, 0.778, 0.778),
        borderColor: rgb(0.8,0.8,0.8)
      });

      //1ERA LINEA
      //Desglosar 2da Linea, DECREMENTAR LA POS Y UNA LINEA MAS ABAJO //NEW
      page.drawText(person.cantidad.toString(), { x:margin, y:y+4-espaciadoDet, size: 12, font });
      page.drawText(person.unidad_medida?.toString() ?? "", { x:x+40, y:y+4-espaciadoDet, size: 12, font }); //Actualizar urgente
      page.drawText(text, { x:x+80, y:y+4-espaciadoDet, size: 12, font }); //Texto de Titulo de Barra ()
      page.drawText(person.moneda?.toString() ?? "", { x:x+410, y:y+4-espaciadoDet, size: 12, font }); //Actualizar urgente
      page.drawText(numeral(person.precio_unitario).format('0,0.00')?.toString() ?? "", { x:x+440, y:y+4-espaciadoDet, size: 12, font }); //Actualizar urgente
      
      precio_total = precio_total + person.precio_unitario*person.cantidad;
      page.drawText("IGV% "+person.porc_igv.toString(), { x:x+440, y:textY-espaciadoDet, size: 10, font }); //igv
      //No usaremos campo base, para pedidos
      //page.drawText("BAS.", { x:x+410, y:textY-espaciadoDet, size: 10, font }); //igv
      //page.drawText(numeral(person.precio_unitario/(1+person.porc_igv/100))?.format('0,0.00').toString() ?? "", { x:x+440, y:textY-espaciadoDet, size: 10, font,color:rgb(0,0,0.7) }); //Actualizar urgente

      page.drawText("ENTREGA", { x:x, y:textY-espaciadoDet, size: 7 });
      page.drawText("PLACA", { x:x+80, y:textY-espaciadoDet, size: 7 });
      page.drawText("TRANSPORTE", { x:x+130, y:textY-espaciadoDet, size: 7 });
      espaciadoDet = espaciadoDet+15;
      page.drawText(person.zona_entrega.toString(), { x:x, y: textY-espaciadoDet, size: 10, font });
      page.drawText(person.tr_placa?.toString() ?? "", { x:x+80, y: textY-espaciadoDet, size: 10, font }); //Actualizar urgente
      page.drawText(person.tr_razon_social?.toString() ?? "", { x:x+130, y: textY-espaciadoDet, size: 10, font }); //Actualizar urgente

      //2DA LINEA
      espaciadoDet = espaciadoDet+15;
      page.drawText("CHOFER", { x, y:textY-espaciadoDet, size: 7 });
      page.drawText("FECH.CARGA", { x:x+80, y:textY-espaciadoDet, size: 7 });
      page.drawText("NOMBRE", { x:x+130, y:textY-espaciadoDet, size: 7 });

      espaciadoDet = espaciadoDet+15;
      if (person.tr_celular===null) {
        page.drawText("-", { x, y: textY-espaciadoDet, size: 10, font });
      }else{
        page.drawText(person.tr_celular, { x, y: textY-espaciadoDet, size: 10, font });
      }
      if (person.tr_fecha_carga===null) {
        page.drawText("-", { x:x+80, y: textY-espaciadoDet, size: 10, font });
      }else{
        page.drawText(person.tr_fecha_carga.toString().substring(0,10), { x:x+80, y: textY-espaciadoDet, size: 10, font });
      }
      if (person.tr_chofer===null) {
        page.drawText("-", { x:x+130, y: textY-espaciadoDet, size: 10, font });
      }else{
        page.drawText(person.tr_chofer, { x:x+135, y: textY-espaciadoDet, size: 10, font });
      }

      //2ERA LINEA
      espaciadoDet = espaciadoDet+15;
      page.drawText("FACT. RUC", { x, y:textY-espaciadoDet, size: 7 });
      page.drawText("FACT. RAZON SOCIAL", { x:x+80, y:textY-espaciadoDet, size: 7 });
      page.drawText("FACT.", { x:x+450, y:textY-espaciadoDet, size: 7 });

      espaciadoDet = espaciadoDet+15;
      if (person.ref_documento_id===null) {
        page.drawText("-", { x, y: textY-espaciadoDet, size: 10, font });
      }else{
        page.drawText(person.ref_documento_id, { x, y: textY-espaciadoDet, size: 10, font });
      }
      if (person.ref_razon_social===null) {
        page.drawText("-", { x:x+80, y: textY-espaciadoDet, size: 10, font });
      }else{
        page.drawText(person.ref_razon_social, { x:x+80, y: textY-espaciadoDet, size: 10, font });
      }
      page.drawText(numeral(person.precio_unitario*person.cantidad).format('0,0.00'), { x:x+440, y: textY-espaciadoDet, size: 10, font });

      //al final del bucle, aumentamos una linea simple :) claro pi ...
      espaciadoDet = espaciadoDet+50;
      row++;
    });
    
    //Linea del total facturado, solo para casos que sea misma moneda en todos los detalles
    //en este caso, la facturacion es por cada detalle, saludos terricolas
    //page.drawText(numeral(precio_total).format('0,0.00'), { x:x+440, y: y-espaciadoDet, size: 10, font });

    //Final
    page.drawRectangle({
      x: margin,
      y: y-espaciadoDet-30,
      width: (page.getWidth()-margin-50), //TODA ANCHO DE LA HOJA
      height: (lineHeight+40),
      borderWidth: 1,
      //color: rgb(0.778, 0.778, 0.778),
      borderColor: rgb(0.8,0.8,0.8)
    });
    
    const pdfBytes = await pdfDoc.save();

    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    // Crea una URL de objeto para el archivo Blob
    const url = URL.createObjectURL(blob);
    // Abre la URL en una nueva pestaña del navegador
    window.open(url, '_blank');
    
  }

  const [venta,setVenta] = useState({
      fecemi:'',
      r_documento_id:'', //cliente
      r_razon_social:'', //cliente
      debe:'0',
      peso_total:'0',

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
    elemento:1,
    r_fecemi:'',
    //datos propios del producto
    id_producto:'',
    descripcion:'',
    cantidad:'1',
    precio_unitario:'',
    precio_neto:'',
    porc_igv:'',
    cont_und:'',
    auxiliar:'' //precio_unitario - cont_und - porc_igv
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
      handleClienteSelect(filteredClientes[0].documento_id, filteredClientes[0].razon_social);

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
    console.log(venta.documento_id,venta.razon_social);
  };
  const handleSearchTextChange = (event) => {
    setSearchText(event.target.value.replace('+', '').replace('-',''));
    setVenta({...venta, documento_id:event.target.value.replace('+', '').replace('-','')});
  };
  const filteredClientes = cliente_select.filter((c) =>
  `${c.documento_id} ${c.razon_social}`.toLowerCase().includes(searchText.toLowerCase())
  );
  const handleCobrar = () => {
    //mostramos modal de cuenta contable
    setShowModal(true);
    
  };
  
  const [cargando,setCargando] = useState(false);
  const [editando,setEditando] = useState(false);
  
  const navigate = useNavigate();
  const params = useParams();

  const [cuenta_select,setCuentaSelect] = useState([]); //Cuenta 6X
  const [searchTextCuenta, setSearchTextCuenta] = useState('');
  const filteredCuentas = cuenta_select.filter((c) =>
    `${c.id_cuenta} ${c.descripcion}`.toLowerCase().includes(searchTextCuenta.toLowerCase())
  );
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

  const handleCuentaSelect = (codigo, descripcion, sNombreCuenta) => {
      setSearchTextCuenta(codigo);
      console.log(codigo,descripcion);
      //confirmaRegistroAsiento(codigo,id_anfitrion,documento_id,periodo_trabajo);

      setShowModal(false);
  };
  const handleSearchTextCuentaChange = (event) => {
    console.log(event.target.value);
    setSearchTextCuenta(event.target.value.replace('+', '').replace('-',''));
  };


  const handleSubmit = async(e) => {
    e.preventDefault();
    setCargando(true);
    var data;

    //Cambiooo para controlar Edicion
    if (editando){
      await fetch(`${back_host}/venta/${params.r_cod}/${params.r_serie}/${params.r_numero}/${params.elemento}`, {
        method: "PUT",
        body: JSON.stringify(venta),
        headers: {"Content-Type":"application/json"}
      });
    }else{
      console.log(`${back_host}/venta`);
      console.log(venta);
      const res = await fetch(`${back_host}/venta`, {
        method: "POST",
        body: JSON.stringify(venta),
        headers: {"Content-Type":"application/json"}
      });
      //nuevo
      data = await res.json();
    }
    setCargando(false);
    
    setEditando(true);
    //Obtener json respuesta, para extraer cod,serie,num y elemento
    if (navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/BlackBerry/i) || navigator.userAgent.match(/Windows Phone/i)) {
      navigate(`/ventamovil/${data.comprobante_original_codigo}/${data.comprobante_original_serie}/${data.comprobante_original_numero}/${data.elemento}/edit`);
    }else{
      navigate(`/ventamovil/${data.comprobante_original_codigo}/${data.comprobante_original_serie}/${data.comprobante_original_numero}/${data.elemento}/edit`);
    }
  };
  
  //Aqui se leen parametros en caso lleguen
  useEffect( ()=> {
    //Verificar si existe venta abierta
    //APi respuesta con array, si existe valores entonces cargar modo edicion

    if (params.comprobante){
      //parametro llega con click en modificar
      //if (!editando){}
      // Dividir el string por el guion "-"
      const [COD, SERIE, NUMERO] = params.comprobante.split('-');

      mostrarVenta(COD, SERIE, NUMERO, '1'); //falta escpecificar elemento
      mostrarVentaDetalle(COD, SERIE, NUMERO, '1');
      
    }else{
      //click nuevo, genera = verificar si existe caso contrario inserta y siempre devuelve datos
      //generaVenta();
      console.log('generaVenta cuidadoooo se encargar de generar y mostrar ....');
      //console.log(obtenerFecha(params.periodo,false));
    }

    //consideraciones finales de renderizado
    //si cliente existe, renderizarlo, sino en blanco indica que esta en modo Pedido
    cargaClienteCombo();
    cargaPopUpProducto();

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
  
  },[params.comprobante, isAuthenticated, textFieldRef.current, editando]);

  useEffect( ()=> {
    //Control de producto elegido
      console.log("click aceptar Lista Producto");

      //procesar el auxiliar y desglosar precio_unitario, cont_und, porc_igv
      //producto.cantidad = 1;
      const [PRECIO_UNITARIO, CONT_UND, PORC_IGV] = producto.auxiliar.split('-');

      setProducto(prevState => ({ ...prevState
            //,id_producto: producto.id_producto
            ,cantidad: 1
            ,precio_unitario: PRECIO_UNITARIO
            ,precio_neto:PRECIO_UNITARIO
            ,cont_und:CONT_UND
            ,porc_igv:PORC_IGV
      }));

  },[producto.auxiliar]);

  useEffect( ()=> {
      //mostrar detalle actualizado
      const [COD, SERIE, NUMERO] = params.comprobante.split('-');
      mostrarVentaDetalle(COD, SERIE, NUMERO, '1');
      console.log('actualiza detalle:', registrosdet);

    /////////////////////////////
    //NEW codigo para autenticacion y permisos de BD
    /*if (isAuthenticated && user && user.email) {
      cargaPermisosMenuComando('01');
    }*/
  },[updateTrigger]) //Aumentamos IsAuthenticated y user

  const cargaClienteCombo = () =>{
    axios
    .get(`${back_host}/correntista`)
    .then((response) => {
        setClienteSelect(response.data);
    })
    .catch((error) => {
        console.log(error);
    });
  }

  const cargaPermisosMenuComando = async(idMenu)=>{
    //Realiza la consulta a la API de permisos (obtenerTodosPermisoComandos)
    fetch(`${back_host}/seguridad/${params.id_anfitrion}/${params.id_invitado}/${idMenu}`, {
      method: 'GET'
    })
    .then(response => response.json())
    .then(permisosData => {
      // Guarda los permisos en el estado
      setPermisosComando(permisosData);
      console.log('permisosComando: ',permisosComando);
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

  //Rico evento change
  const handleChange = e => {
    setVenta({...venta, [e.target.name]: e.target.value});
  }
  const handleChangeProductoDatos = e => {
    let precio_neto;
    
    if (e.target.name === "cantidad"){
      precio_neto = producto.precio_unitario * e.target.value;
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
  }

  //funcion para mostrar data de formulario, modo edicion
  const mostrarVenta = async (cod,serie,num,elem) => {
    const res = await fetch(`${back_host}/ad_venta/${params.periodo}/${params.id_anfitrion}/${params.documento_id}/${cod}/${serie}/${num}/${elem}`);
    const data = await res.json();
    //Actualiza datos para enlace con controles, al momento de modo editar
    setVenta({  
                r_cod:data.r_cod,
                r_serie:data.r_serie,
                r_numero:data.r_numero,
                elemento:data.elemento,
                r_fecemi:data.fecemi, //cambio de var, por la conversion a varchar
                r_documento_id:data.r_documento_id, //cliente
                r_razon_social:data.r_razon_social, //cliente
                debe:data.debe,
                r_monto_total:data.r_monto_total,
                peso_total:data.peso_total,
                r_cod_ref:data.r_cod_ref,       //ref
                r_serie_ref:data.r_serie_ref,   //ref
                r_numero_ref:data.r_numero_ref, //ref
                r_fecemi_ref:data.r_fecemi_ref, //ref
                registrado:data.registrado
              });
    //console.log(data);
    setSearchText(data.r_documento_id); //data de cliente para form
    setEditando(true);
  };
  
  const mostrarVentaDetalle = async (cod,serie,num,elem) => {
    //console.log(`${back_host}/ad_ventadet/${params.periodo}/${params.id_anfitrion}/${params.documento_id}/${cod}/${serie}/${num}/${elem}`);
    const res = await fetch(`${back_host}/ad_ventadet/${params.periodo}/${params.id_anfitrion}/${params.documento_id}/${cod}/${serie}/${num}/${elem}`);
    const dataDet = await res.json();
    setRegistrosdet(dataDet);
    //console.log('detalle',dataDet);
    setEditando(true);
  };

  const eliminarVentaDetalleItem = async (cod,serie,num,elem,item) => {
    await fetch(`${back_host}/ad_ventadet/${params.periodo}/${params.id_anfitrion}/${params.documento_id}/${cod}/${serie}/${num}/${elem}/${item}`, {
      method:"DELETE"
    });
    
    setRegistrosdet(registrosdet.filter(registrosdet => registrosdet.r_cod !== cod ||
                                                        registrosdet.r_serie !== serie ||
                                                        registrosdet.r_numero !== num ||
                                                        registrosdet.elemento !== elem ||
                                                        registrosdet.item !== item                                                        
    ));
    //console.log(data);
  }

  const confirmaEliminacionDet = (cod,serie,num,elem,item)=>{
    swal({
      title:"Eliminar Detalle de Venta",
      text:"Seguro ?",
      icon:"warning",
      timer:"3000",
      buttons:["No","Si"]
    }).then(respuesta=>{
        if (respuesta){
          eliminarVentaDetalleItem(cod,serie,num,elem,item);
            swal({
            text:"Detalle de venta eliminado con exito",
            icon:"success",
            timer:"2000"
          });
      }
    })
  }

 
  //////////////////////////////////funciones control cantidad//////////////////////////////////////////
  const parseCantidad = (cantidad) => {
    // Si el campo está vacío o es NaN, se asume valor 0
    const parsedCantidad = parseInt(cantidad, 10);
    return isNaN(parsedCantidad) ? 0 : parsedCantidad;
  };
  const handleResetCantidad = () => {
    //setProducto({ ...producto, cantidad: '1' });
    setProducto((prevProducto) => {
      const newCantidad = 1;
      const newImporte = prevProducto.precio_unitario * newCantidad;
      return { ...prevProducto, cantidad: newCantidad.toString(), precio_neto:newImporte };
    });
  };
  const handleDecreaseByOne = () => {
    setProducto((prevProducto) => {
      const newCantidad = Math.max(parseCantidad(prevProducto.cantidad) - 1, 0); // Evita que sea menor a 0
      const newImporte = (prevProducto.precio_unitario * newCantidad).toFixed(2);
      return { ...prevProducto, cantidad: newCantidad.toString(), precio_neto:newImporte };      
    });
  };
  const handleIncreaseByOne = () => {
    /*const newCantidad = parseCantidad(producto.cantidad) + 1;
    const newImporte = producto.precio_unitario*newCantidad;
    setProducto({...producto, cantidad: newCantidad, precio_neto:newImporte});*/

    setProducto((prevProducto) => {
      const newCantidad = parseCantidad(prevProducto.cantidad) + 1;
      const newImporte = (prevProducto.precio_unitario * newCantidad).toFixed(2);
      return { ...prevProducto, cantidad: newCantidad.toString(), precio_neto:newImporte };
    });
  };
  const handleIncreaseByTen = () => {
    setProducto((prevProducto) => {
      const newCantidad = parseCantidad(prevProducto.cantidad) + 10;
      const newImporte = (prevProducto.precio_unitario * newCantidad).toFixed(2);
      return { ...prevProducto, cantidad: newCantidad.toString(), precio_neto:newImporte };
    });
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
      setProducto(estadoInicial);

      //Quitar modal
      setShowModalProducto(false);
      
  }
  //////////////////////////////////////////////////////////////////////////////////////////////////////
  const confirmaGrabarDetalle = async()=>{
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
            swal({
              text:"Detalle registrado con exito",
              icon:"success",
              timer:"2000"
            });
            
            setUpdateTrigger(Math.random());//experimento

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
  }

  /////////////////////////////////////////////////seccion datatable/////////////
  const [selectedRows, setSelectedRows] = useState([]);
  const [copiedRowId, setCopiedRowId] = useState(null);
  const columnas = [
    {
      name: '',
      width: '40px',
      cell: (row) => (
          <DriveFileRenameOutlineIcon
            //onClick={() => handleCopyClick(row.item)}
            style={{
              cursor: 'pointer',
              color: copiedRowId === row.documento_id ? 'green' : 'skyblue',
              transition: 'color 0.3s ease',
            }}
          />
      ),
      allowOverflow: true,
      button: true,
    },
    {
      name: '',
      width: '40px',
      cell: (row) => (
        (true) ? (  //modificar urgente con permiso para eliminar detalle
          <DeleteIcon
            //onClick={() => handleDelete(row.item)}
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
      width: '210px'
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

    <IconButton color="inherit" 
        onClick = {()=> {
                    //Icono Imprimir
                  }
                }
        >
        <PrintIcon />
    </IconButton>
    
    { pVenta010202 ?
    (
    <IconButton color="primary" 
      onClick = {()=> {
                  //Agregar Producto
                  setShowModalProducto(true);                  
                }
              }
    >
      <AddBoxRoundedIcon />
    </IconButton>
    ):
    (<div></div>)
    }

    </>
);

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
                                  { !params.comprobante.includes('NP') ?
                                    (venta.r_cod+"-"+venta.r_serie+"-"+venta.r_numero) 
                                    :
                                    ('NP en Proceso')
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

                              <Grid item xs={isSmallScreen ? 12 : 2.8}>

                              </Grid>

                              <Grid item xs={isSmallScreen ? 12 : 1.2}>
                              {//En caso de NP en Proceso, solo se emite comprobante
                               params.comprobante.includes('NP') ?
                               (
                                  <Button variant='contained' 
                                          color='primary' 
                                          type='submit'
                                          fullWidth
                                          sx={{display:'block',
                                          margin:'.5rem 0'}}
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
                                                    !venta.r_fecemi || 
                                                    !venta.r_documento_id ||
                                                    !pVenta010201 ||
                                                    !params.comprobante.includes('NV')
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
                                    <Grid item xs={isSmallScreen ? 11 : 2}>
                                        <TextField variant="outlined" 
                                                    placeholder="RUC/DNI"
                                                    size="small"
                                                    sx={{mt:1}}
                                                    fullWidth
                                                    name="r_documento_id"
                                                    //value={venta.documento_id}
                                                    //onChange={handleChange}
                                                    value={venta.r_documento_id}
                                                    onChange={handleChange} //new para busqueda
                                                    onKeyDown={handleCodigoKeyDown} //new para busqueda
                                                    inputProps={{ style:{color:'white',width: 140} }}
                                                    InputLabelProps={{ style:{color:'white'} }}
                                        />
                                    </Grid>
                                    <Grid item xs={isSmallScreen ? 1 : 0.5}>
                                        <IconButton color="warning" aria-label="upload picture" component="label" size="small"
                                            sx={{mt:1}}
                                            onClick = { () => {
                                                //busqueda en internet
                                                
                                              }
                                            }
                                          >
                                          <FindIcon />
                                        </IconButton>
                                    </Grid>
                                    <Grid item xs={isSmallScreen ? 12 :3.5}>
                                        <TextField variant="outlined" 
                                                    placeholder="RAZON SOCIAL"
                                                    size="small"
                                                    sx={{mt:1}}
                                                    fullWidth
                                                    name="r_razon_social"
                                                    //value={venta.r_razon_social}
                                                    //onChange={handleChange}
                                                    value={venta.r_razon_social}
                                                    onChange={handleChange} //new para busqueda
                                                    onKeyDown={handleCodigoKeyDown} //new para busqueda
                                                    inputProps={{ style:{color:'white',width: 140} }}
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

                          { (showModalProducto) ?
                            (   <>
                                        {/* Seccion para mostrar Dialog tipo Modal, para busqueda incremental cuentas */}
                                        <Dialog
                                          open={showModalProducto}
                                          onClose={() => setShowModalProducto(false)}
                                          maxWidth="md" // Valor predeterminado de 960px
                                          fullWidth
                                          PaperProps={{
                                            style: {
                                              display: 'flex',
                                              flexDirection: 'column',
                                              alignItems: 'center',
                                              marginTop: '10vh', // Ajusta este valor según tus necesidades
                                              //background:'#1e272e',
                                              background: 'rgba(33, 150, 243, 0.8)', // Cambiado a color RGBA para la transparencia                              
                                              color:'white',
                                              width: isSmallScreen ? ('100%') : ('40%'), // Ajusta este valor según tus necesidades
                                              maxWidth: 'none' // Esto es importante para permitir que el valor de width funcione
                                            },
                                          }}
                                        >
                                        <DialogTitle>Producto - Item</DialogTitle>
                                            <Tooltip title={producto.descripcion}>
                                            <TextField
                                              variant="outlined"
                                              placeholder="PRODUCTO"
                                              autoFocus
                                              size="small"
                                              name="id_producto"
                                              value={producto.descripcion}
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
                                                      left: 0,
                                                      transform: 'translateY(-50%)',
                                                    }}
                                                    onClick={() => {
                                                      setShowModalProductoLista(true);
                                                    }}
                                                  >
                                                    <FindIcon />
                                                  </IconButton>
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
                                                  <ListaPopUp
                                                      registroPopUp={producto_select}
                                                      showModal={showModalProductoLista}
                                                      setShowModal={setShowModalProductoLista}
                                                      registro={producto}                    
                                                      setRegistro={setProducto}                    
                                                      idCodigoKey="id_producto"
                                                      descripcionKey="descripcion"
                                                      auxiliarKey="auxiliar"
                                                  />

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
                                                  width: 145,
                                                  textAlign: 'center',
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
                                                    
                                                    <IconButton
                                                      color="default"
                                                      aria-label="disminuir en 1"
                                                      size="small"
                                                      onClick={handleDecreaseByOne} // Función para retroceder cambios
                                                      sx={{
                                                        padding: '0px',
                                                        height:'30',
                                                        marginRight: '0px',
                                                        backgroundColor: 'primary', // Color de fondo del ícono
                                                        borderRadius: '4px', // Bordes redondeados
                                                        '&:hover': {
                                                          backgroundColor: 'skyblue', // Color de fondo al hacer hover
                                                        },
                                                      }}                                                        
                                                    >
                                                      <IndeterminateCheckBox />
                                                    </IconButton>

                                                  </InputAdornment>
                                                ),
                                                endAdornment: (
                                                  <InputAdornment position="end">
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
                                                      <AddCircleIcon />
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
                                                      <Timer10SelectIcon />
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
                                                        onClick={handleSaveDetail}
                                                        sx={{display:'block',margin:'.5rem 0', width: 270}}
                                                        //sx={{margin:'.5rem 0', height:55}}
                                                        >
                                                        AGREGAR
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
