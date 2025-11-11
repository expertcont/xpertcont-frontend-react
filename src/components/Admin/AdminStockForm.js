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
import { useDialog } from "./AdminConfirmDialogProvider";
import { da } from 'date-fns/locale';
import { ConstructionOutlined } from '@mui/icons-material';

export default function AdminStockForm() {
  const isSmallScreen = useMediaQuery('(max-width: 600px)');
  //const back_host = process.env.BACK_HOST || "http://localhost:4000";
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";  
  ////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////
  const { confirmDialog } = useDialog(); //unico dialogo
  const inputProductoRef = useRef(null); // Crear referencia al TextField
  const [updateTrigger, setUpdateTrigger] = useState({});
  const [cliente_select,setClienteSelect] = useState([]);
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
  const [showModalProducto, setShowModalProducto] = useState(false);
  const [showModalProductoLista, setShowModalProductoLista] = useState(false);

  const [showModalEmite, setShowModalEmite] = useState(false);

  const [searchText, setSearchText] = useState('');
  const textFieldRef = useRef(null); //foco del buscador
  const [valorEmite, setValorEmite] = useState('IA');
  const [comprobanteEmitido, setComprobanteEmitido] = useState(null);
  const [razonSocialBusca, setRazonSocialBusca] = useState('');
  //////////////////////////////////////////////////////////

  const [producto_select,setProductoSelect] = useState([]);
  const [precio_select,setPrecioSelect] = useState([]);
  const [grupo_select,setGrupoSelect] = useState([]); //Util para colores, si es necesario, caso contrario NULL
  
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
  const [almacen_select,setAlmacenSelect] = useState([]);
  const [almacen_trabajo,setAlmacenTrabajo] = useState('');

  const [motivo_select,setMotivoSelect] = useState([]);
  const [serie_select,setSerieSelect] = useState([]);
  const [serie_selectIA,setSerieSelectIA] = useState([]);
  //const [motivo_movimiento,setMotivoMovimiento] = useState('');

  const [opTransformacion, setOpTransformacion] = useState(false);
  const [opTraslado, setOpTraslado] = useState(false);

  const actualizaValorEmite = (e) => {
    setValorEmite(e.target.value);
    setDatosEmitir(prevState => ({ ...prevState, r_cod_emitir: e.target.value }));
    //Cambiar motivos
    cargaMotivoSelect(e.target.value);
    cargaSeguridadSeriesSelect(e.target.value);

  }
  
  const cargaDocSelect = () =>{
    console.log(`${back_host}/iddoc`);
    axios
    .get(`${back_host}/iddoc`)
    .then((response) => {
        setDocSelect(response.data);
    })
    .catch((error) => {
        console.log(error);
    });
  };

  function base64ToUint8Array(base64) {
    const binaryString = window.atob(base64); // Decodificar Base64 a binario
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
  
  const createPdfTicket = async (size) => {
    const pdfDoc = await PDFDocument.create()

    // Definir el ancho según el tamaño del ticket
    const width = (size === '80mm') ? 226.77 : 164.41; // 80mm o 58mm
    const fontSize = (size === '80mm') ? 10 : 8; // 80mm o 58mm
    const marginLeftSize = (size === '80mm') ? 0 : 62.36; // 80mm o 58mm

    const lineHeight = fontSize * 1.2;

    //caso contrario restar 22mm a la izquierda y disminuir la fuente en 2 puntos, probando

    // Altura inicial (puedes ajustarla dinámicamente)
    let height = 800;
    const page = pdfDoc.addPage([width, height]);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontNegrita = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Add logo to the top of the page
    //const logoImage = pdfDoc.embedPng(logo);
    const pngImage = await pdfDoc.embedPng(logo);
    const pngDims = pngImage.scale(0.6)
    const margin = 5;

    page.drawImage(pngImage, {
      x: margin+50-(marginLeftSize/2),
      y: 730,
      width: pngDims.width,
      height: pngDims.height,
    })

    let x = margin;
    let y = 720;

    //Documento electronico y logo expertcont
    const COD = params.comprobante.slice(0,2);
    const documentos = {
      '01': 'FACTURA ELECTRONICA',
      '03': 'BOLETA ELECTRONICA',
      '07': 'NOTA CRED. ELECTRONICA',
      '08': 'NOTA DEB. ELECTRONICA'
    };
    const sDocumento = documentos[COD] || 'DOCUMENTO'; // Manejo de caso por defecto

    const ticketWidth = 227; // Ancho del ticket en puntos (80mm)
   
    //////////////////
    let textWidth = fontNegrita.widthOfTextAtSize(sDocumento, fontSize);
    // Calcular el punto x para alinear a la derecha
    x = (ticketWidth - textWidth - marginLeftSize)/2;
    page.drawText(sDocumento, { x, y, size: fontSize, font:fontNegrita });
    y=y-12; //aumentamos linea nueva

    //////////////////
    textWidth = fontNegrita.widthOfTextAtSize(('RUC '+params.documento_id), fontSize+1);
    // Calcular el punto x para alinear a la derecha
    x = (ticketWidth - textWidth - marginLeftSize)/2;
    page.drawText('RUC '+params.documento_id, { x, y, size: fontSize+1, font:fontNegrita });
    y=y-12; //aumentamos linea nueva

    //////////////////
    textWidth = fontNegrita.widthOfTextAtSize(formulario.razon_social, fontSize);
    // Calcular el punto x para alinear a la derecha
    x = (ticketWidth - textWidth - marginLeftSize)/2;
    page.drawText(formulario.razon_social, { x, y, size: fontSize });
    y=y-12; //aumentamos linea nueva

    //////////////////
    textWidth = fontNegrita.widthOfTextAtSize(formulario.direccion, fontSize);
    // Calcular el punto x para alinear a la derecha
    x = ((ticketWidth - textWidth)/2)>0 ? ((ticketWidth - textWidth)/2) : margin;
    page.drawText(formulario.direccion, { x, y, size: 8 });
    y=y-12; //aumentamos linea nueva


    //////////////////
    textWidth = fontNegrita.widthOfTextAtSize(params.comprobante.slice(3), 12);
    // Calcular el punto x para alinear a la derecha
    x = (ticketWidth - textWidth - marginLeftSize)/2;
    page.drawText(params.comprobante.slice(3), { x, y, size: 12, font:fontNegrita });
    y=y-12; //aumentamos linea nueva

    //////////////////
    textWidth = fontNegrita.widthOfTextAtSize("FECHA: " + formulario.fecemi, fontSize);
    // Calcular el punto x para alinear a la derecha
    x = (ticketWidth - textWidth - marginLeftSize)/2;
    page.drawText("FECHA: " + formulario.fecemi, { x, y, size: fontSize });
    y=y-15 //aumentamos linea nueva
    //y=y-12; //aumentamos linea nueva

    page.drawRectangle({
      x: margin,
      y: y-2,
      width: (page.getWidth()-margin-5), //TODA ANCHO DE LA HOJA
      height: (lineHeight+2),
      borderWidth: 1,
      color: rgb(0.778, 0.778, 0.778),
      borderColor: rgb(0.8,0.8,0.8)
    });
    //////////////////
    textWidth = fontNegrita.widthOfTextAtSize("DATOS CLIENTE: ", fontSize-1);
    // Calcular el punto x para alinear a la derecha
    x = (ticketWidth - textWidth - marginLeftSize)/2;
    page.drawText("DATOS DEL CLIENTE: ", { x, y, size: fontSize-1 });
    y=y-12; //aumentamos linea nueva

    //////////////////
    textWidth = fontNegrita.widthOfTextAtSize(formulario.r_razon_social, fontSize);
    // Calcular el punto x para alinear a la derecha
    x = (ticketWidth - textWidth - marginLeftSize)/2;
    page.drawText(formulario.r_razon_social?.toString() ?? "", { x, y, size: fontSize});
    y=y-12; //aumentamos linea nueva

    //////////////////
    textWidth = fontNegrita.widthOfTextAtSize("RUC/DNI: " + formulario.r_documento_id, fontSize);
    // Calcular el punto x para alinear a la derecha
    x = (ticketWidth - textWidth - marginLeftSize)/2;
    page.drawText("RUC/DNI: " + formulario.r_documento_id?.toString() ?? "", { x, y, size: fontSize });
    y=y-12; //aumentamos linea nueva

    //////////////////
    textWidth = fontNegrita.widthOfTextAtSize(formulario.r_direccion, fontSize);
    // Calcular el punto x para alinear a la derecha
    x = (ticketWidth - textWidth - marginLeftSize)/2;
    page.drawText(formulario.r_direccion?.toString() ?? "", { x, y, size: fontSize });
    y=y-12; //aumentamos linea nueva

    ////////////////// cambiar por ctrl_us_crea correo que lo registro
    textWidth = fontNegrita.widthOfTextAtSize("USUARIO: "+params.id_invitado.split('@')[0].slice(0,14), fontSize);
    // Calcular el punto x para alinear a la derecha
    x = (ticketWidth - textWidth - marginLeftSize)/2;
    page.drawText("USUARIO: "+params.id_invitado.split('@')[0].slice(0,14), { x, y, size: fontSize });
    y=y-12; //aumentamos linea nueva

    //////////////////
    textWidth = fontNegrita.widthOfTextAtSize("PAGO: CONTADO", fontSize);
    // Calcular el punto x para alinear a la derecha
    x = (ticketWidth - textWidth - marginLeftSize)/2;
    page.drawText("PAGO: CONTADO", { x, y, size: fontSize });
    
    y=y-15; //aumentamos linea nueva
    //y=y-12; //aumentamos linea nueva
    
    ////////////////////////////////////////////////////////////////////
    // Draw table data
    let row = 1;
    let espaciadoDet = 0; //iniciamos en la 1era fila
    
    //let precio_total = 0;
    espaciadoDet = espaciadoDet+20; ///NEW

    page.drawRectangle({
      x: margin,
      y: y-2,
      width: (page.getWidth()-margin-5), //TODA ANCHO DE LA HOJA
      height: (lineHeight+2),
      borderWidth: 1,
      color: rgb(0.778, 0.778, 0.778),
      borderColor: rgb(0.8,0.8,0.8)
    });

    page.drawText("DESCRIPCION", { x:margin, y, size: fontSize-1 });

    textWidth = fontNegrita.widthOfTextAtSize('P.UNIT', fontSize-1);
    // Calcular el punto x para alinear a la derecha
    x = (ticketWidth - textWidth - margin - 50 - marginLeftSize); //50 por columna IMPORTE
    page.drawText("P.UNIT", { x, y, size: fontSize-1 });    

    textWidth = fontNegrita.widthOfTextAtSize('IMPORTE', fontSize-1);
    // Calcular el punto x para alinear a la derecha
    x = (ticketWidth - textWidth - margin - marginLeftSize);
    page.drawText("IMPORTE", { x, y, size: fontSize-1 });
    
    
    registrosdet.forEach((person) => {
      const text = `${person.descripcion}`;
      const textY = y - lineHeight; //corregimos aca, porque se duplicaba espacio en cada grupo

      //1ERA LINEA
      //page.drawText(person.cont_und?.toString() ?? "", { x:x+40, y:y+4-espaciadoDet, size: 10, font }); //Actualizar urgente
      page.drawText(text, { x:margin, y:y+4-espaciadoDet, size: fontSize-1, font }); //Texto de Titulo de Barra ()

      //2da Linea
      espaciadoDet = espaciadoDet+10;
      page.drawText('Cant: '+person.cantidad, { x:margin, y:y+4-espaciadoDet, size: fontSize-1 });

      textWidth = fontNegrita.widthOfTextAtSize(numeral(person.precio_unitario).format('0,0.00'), fontSize);
      // Calcular el punto x para alinear a la derecha
      x = (ticketWidth - textWidth - margin - 50 - marginLeftSize); //50 por columna precio_neto
      page.drawText(person.precio_unitario, { x, y:y+4-espaciadoDet, size: fontSize-1 });
      
      textWidth = fontNegrita.widthOfTextAtSize(numeral(person.precio_neto).format('0,0.00'), fontSize);
      // Calcular el punto x para alinear a la derecha
      x = (ticketWidth - textWidth - margin - marginLeftSize);
      page.drawText(person.precio_neto, { x, y:y+4-espaciadoDet, size: fontSize-1 });

      page.drawLine({
        start: { x: margin, y: y + 2 - espaciadoDet }, // Punto inicial
        end: { x: page.getWidth() - margin - 5, y: y + 2 - espaciadoDet }, // Punto final
        thickness: 1, // Grosor de la línea
        color: rgb(0.778, 0.778, 0.778), // Color de la línea
      });

      //al final del bucle, aumentamos una linea simple :) claro pi ...
      espaciadoDet = espaciadoDet+10;
      row++;
    });
    
    y=y-15; //aumentamos linea nueva
    y=y-15; //aumentamos linea nueva

    let MontoEnLetras = NumerosALetras(formulario.r_monto_total, {
      plural: 'SOLES', //pinches opciones no funcionan, tengo q arreglarlas en la siguiente linea
      singular: 'SOL', //todos mis movimientos estan friamente calculados
      centPlural: 'CÉNTIMOS', //siganme los buenos ...  :)
      centSingular: 'CÉNTIMO',
    });
    MontoEnLetras = 'SON: ' + MontoEnLetras.toUpperCase().replace('PESOS', 'SOLES CON').replace('PESO', 'SOL CON').replace('M.N.','');
    page.drawText(MontoEnLetras, { x:margin, y:y-espaciadoDet+30, size: 8 }); //Actualizar urgente


    const moneda = {
      'PEN': 'S/',
      'USD': '$ USD'
    };
    const sMoneda = moneda[formulario.r_moneda] || ''; // Manejo de caso por defecto
    console.log(formulario.r_moneda, sMoneda);

    //////////////////
    x = margin;
    page.drawText("BASE:",{ x, y:y-espaciadoDet+4, size: 9 });

    textWidth = fontNegrita.widthOfTextAtSize(numeral(formulario.r_base002).format('0,0.00'), fontSize+2);
    // Calcular el punto x para alinear a la derecha
    x = (ticketWidth - textWidth - margin - marginLeftSize);
    page.drawText(numeral(formulario.r_base002).format('0,0.00')?.toString() ?? "", { x, y:y+4-espaciadoDet, size: 10, font }); //Actualizar urgente

    x = margin;
    page.drawText("IGV.: ",{ x, y:y-espaciadoDet+4-10, size: 9 });

    textWidth = fontNegrita.widthOfTextAtSize(numeral(formulario.r_igv002).format('0,0.00'), fontSize+2);
    // Calcular el punto x para alinear a la derecha
    x = (ticketWidth - textWidth - margin - marginLeftSize);
    page.drawText(numeral(formulario.r_igv002).format('0,0.00')?.toString() ?? "", { x, y:y+4-espaciadoDet-10, size: 10, font }); //Actualizar urgente

    x = margin;
    page.drawText("TOTAL.:" + sMoneda,{ x, y:y-espaciadoDet+4-25, size: fontSize+2, font:fontNegrita });

    textWidth = fontNegrita.widthOfTextAtSize(numeral(formulario.r_monto_total).format('0,0.00'), fontSize+2);
    // Calcular el punto x para alinear a la derecha
    x = (ticketWidth - textWidth - margin - marginLeftSize);
    page.drawText(numeral(formulario.r_monto_total).format('0,0.00')?.toString() ?? "", { x, y:y+4-espaciadoDet-25, size: fontSize+2, font:fontNegrita }); //Actualizar urgente

    //SeccionQR
    // Generar el código QR como base64
    const partes = comprobante.split('-');
    const numeroFormateado = partes[2].padStart(8, '0');
    const comprobanteConvertido = `${partes[0]}|${partes[1]}|${numeroFormateado}`;

    const qrImage = await QRCode.toDataURL(params.documento_id + '|' + comprobanteConvertido + '|' + formulario.r_igv002 + '|' + formulario.r_monto_total + '|' + formulario.fecemi + '|' + formulario.r_id_doc + '|' + formulario.r_documento_id + '|');
    // Convertir la imagen base64 a formato compatible con pdf-lib
    const qrImageBytes = qrImage.split(',')[1]; // Eliminar el encabezado base64
    //const qrImageBuffer = Uint8Array.from(atob(qrImageBytes), (c) => c.charCodeAt(0));
    const qrImageBuffer = base64ToUint8Array(qrImageBytes);
    
    const qrImageEmbed = await pdfDoc.embedPng(qrImageBuffer);
    // Obtener dimensiones de la imagen
    const qrWidth = 45;
    const qrHeight = 45;
    // Calcular el punto x para alinear a la derecha
    x = (ticketWidth - 45 - marginLeftSize)/2;

    // Dibujar el código QR en el PDF
    page.drawImage(qrImageEmbed, {
      x,
      y: y-espaciadoDet-26-45,
      width: qrWidth,
      height: qrHeight,
    });

    const pdfBytes = await pdfDoc.save();

    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    // Crea una URL de objeto para el archivo Blob
    const url = URL.createObjectURL(blob);
    // Abre la URL en una nueva pestaña del navegador
    window.open(url, '_blank');
  }

  const [formulario,setFormulario] = useState({
      fecha_emision:'',
      r_documento_id:'',  //correntista
      r_razon_social:'',  //correntista
      r_cod:'',           //correntista
      r_serie:'',         //correntista
      r_numero:'',        //correntista
      fecemi:'',        //correntista
      gre_serie:'',       //correntista
      gre_numero:'',      //correntista
      
      id_almacen:'',
      almacen:'', 
      
      id_motivo:'',
      motivo:'', 
      
      peso_total:'0',
      ctrl_atencion: '', //alias vendedor
      registrado:'1'
  });
  
  const [producto,setProducto] = useState({
    //datos complementarios para post
    id_anfitrion:'',
    documento_id:'',
    periodo:'',
    cod:'',
    serie:'',
    numero:'',
    fecemi:'',
    //datos propios del producto
    id_producto:'',
    descripcion:'',
    cantidad:'1',
    precio_unitario:'',
    precio_neto:'',
    porc_igv:'',
    cont_und:'',

    r_cod:'',
    r_serie:'',
    r_numero:'',
    r_fecemi:'',

    auxiliar:'' //precio_unitario - cont_und - porc_igv
  });

  const [datosEmitir,setDatosEmitir] = useState({
    //datos complementarios para post
    id_anfitrion:'',
    documento_id:'',
    periodo:'',
    id_almacen:'',  //new
    id_serie:'',    //new
    id_motivo:'',   //new
    
    r_cod:'',
    r_serie:'',
    r_numero:'',
    r_fecemi:'',
    //datos propios del comprobante a generar y correntista a registrar
    //solo emitidos 01,03,NV ... los 07 y 08 los generamos desde clonar para mayor facilidad
    r_cod_emitir:'',
    r_documento_id:'',
    r_id_doc:'',
    r_razon_social:'',

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
    formulario.documento_id = codigo;
    formulario.razon_social = cliente;

    setShowModal(false);
    console.log(formulario.documento_id,formulario.razon_social);
  };
  const handleSearchTextChange = (event) => {
    setSearchText(event.target.value.replace('+', '').replace('-',''));
    setFormulario({...formulario, documento_id:event.target.value.replace('+', '').replace('-','')});
  };
  const filteredClientes = cliente_select.filter((c) =>
  `${c.documento_id} ${c.razon_social}`.toLowerCase().includes(searchText.toLowerCase())
  );
  const handleCobrar = () => {
    //mostramos modal de cuenta contable
    setShowModal(true);
    
  };
  
  const [cargando,setCargando] = useState(false);
  
  const navigate = useNavigate();

  const cargaMotivoSelect = (sValorEmitir) =>{
    axios
    .get(`${back_host}/ad_stockmotivo/${sValorEmitir}`)
    .then((response) => {
        setMotivoSelect(response.data);
        //console.log('motivos cargados: ', response.data);
        if (response.data.length > 0) {
          setFormulario(prevState => ({ ...prevState, id_motivo: response.data[0].id_motivo })); // o el campo correcto del API
          setFormulario({ ...formulario, id_motivo: response.data[0].id_motivo }); // o el campo correcto del API
          //console.log('motivo por defecto: ', response.data[0].id_motivo);
        }
    })
    .catch((error) => {
        console.log(error);
    });
  }

  const cargaSeguridadSeriesSelect = (sValorEmitir) =>{
    axios
    .get(`${back_host}/seguridadserie/${params.id_anfitrion}/${params.documento_id}/${params.id_invitado}/${sValorEmitir}`)
    .then((response) => {
        setSerieSelect(response.data);
        console.log('series cargadas: ', response.data);
    })
    .catch((error) => {
        console.log(error);
    });
  }
const cargaSeguridadSeriesSelectIA = () =>{
    axios
    .get(`${back_host}/seguridadserie/${params.id_anfitrion}/${params.documento_id}/${params.id_invitado}/IA`) //Solo para Ingresos Almacen
    .then((response) => {
        setSerieSelectIA(response.data);
        console.log('series cargadas: ', response.data);
    })
    .catch((error) => {
        console.log(error);
    });
  }

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
      const [COD, SERIE, NUMERO] = params.comprobante.split('-');
      console.log('comprobante key: ', COD, SERIE, NUMERO);

      mostrarMovimiento(COD, SERIE, NUMERO); 
      mostrarMovimientoDetalle(COD, SERIE, NUMERO);
      
    }else{
      //click nuevo, genera = verificar si existe caso contrario inserta y siempre devuelve datos
      //generaVenta();
      console.log('generaVenta cuidadoooo se encargar de generar y mostrar ....');
      //console.log(obtenerFecha(params.periodo,false));
    }

    //consideraciones finales de renderizado
    //si cliente existe, renderizarlo, sino en blanco indica que esta en modo Pedido
    //cargaMotivoSelect(valorEmite);
    cargaPopUpProducto();
    cargaPopUpGrupo();//new
    cargaDocSelect();

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
    //desactivar botones de modificacion

  },[params.comprobante, isAuthenticated, textFieldRef.current]);

  useEffect( ()=> {
    //Control de producto elegido
      console.log("click aceptar Lista Producto");

      //procesar el auxiliar y desglosar precio_unitario, cont_und, porc_igv
      //producto.cantidad = 1;
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

      console.log('producto en useEffect: ', producto);

      //Aqui debemos cargar precios por rango, en caso columna RANGO = '1'
      if (PRECIO_FACTOR==="1"){
        //Alimentar precio_select
        cargaPreciosRangoProducto(producto.id_producto);
        console.log('cargaPreciosRango: ', precio_select);
        //Luego en evento cambio cantidad, se actualiza precio_unitario
      }else{
        //Liberar contenido precio_select
        setPrecioSelect([]);
      }

  },[producto.auxiliar]);

  useEffect( ()=> {
      //mostrar detalle actualizado y encabezado mas por el rico total
      const [COD, SERIE, NUMERO] = params.comprobante.split('-');

      mostrarMovimiento(COD, SERIE, NUMERO); 
      mostrarMovimientoDetalle(COD, SERIE, NUMERO);
      console.log('cabecera actualizado: ', formulario);
      console.log('detalle actualizado: ', registrosdet);

  },[updateTrigger]) //Aumentamos IsAuthenticated y user

  /*useEffect( ()=> {
    cargaMotivoSelect(valorEmite);
  },[valorEmite])*/

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
  }

  //Rico evento change
  const handleChangeEmite = (name, value) => {
    if (name === 'id_motivo') {
      const [ID_MOT, SA_TRANSF, SA_TRASL] = value.split('-');    
      console.log('Motivo seleccionado: ', ID_MOT, SA_TRANSF, SA_TRASL);
      
      //Actualizar useState opTraslado y opTransformacion
      if (SA_TRASL === '1'){
        setOpTraslado(true);
        //cargar select_almacen2 para IA
        cargaSeguridadSeriesSelectIA();
      }else{
        setOpTraslado(false);
      }
      if (SA_TRANSF === '1'){
        setOpTransformacion(true);
      }else{
        setOpTransformacion(false);
      }
    }

    if (name === 'id_almacen_ia') {
       // Buscar el almacén seleccionado en tu arreglo
      const almacenSeleccionadoIA = serie_selectIA.find(item => item.id_almacen === value);

      if (almacenSeleccionadoIA) {
        // Extraer la parte antes del guion ("0001" de "0001-CENTRAL")
        const idSerieIA = almacenSeleccionadoIA.descripcion.split('-')[0].trim();

        // Actualizar tanto el id_almacen como el código extraído
        setDatosEmitir(prev => ({
          ...prev,
          id_almacen_ia: value,
          serie_ia: idSerieIA, // puedes guardar el código en un nuevo campo
        }));

        console.log('Código de serie IA:', idSerieIA);
      } else {
        // Si no se encuentra el almacén, solo actualiza normalmente
        setDatosEmitir(prev => ({ ...prev, [name]: value }));
      }
    }

    // Si el campo que cambia es "id_almacen"
    if (name === 'id_almacen') {
      // Buscar el almacén seleccionado en tu arreglo
      const almacenSeleccionado = serie_select.find(item => item.id_almacen === value);

      if (almacenSeleccionado) {
        // Extraer la parte antes del guion ("0001" de "0001-CENTRAL")
        const idSerie = almacenSeleccionado.descripcion.split('-')[0].trim();

        // Actualizar tanto el id_almacen como el código extraído
        setDatosEmitir(prev => ({
          ...prev,
          id_almacen: value,
          id_serie: idSerie, // puedes guardar el código en un nuevo campo
        }));

        console.log('Código de serie:', idSerie);
      } else {
        // Si no se encuentra el almacén, solo actualiza normalmente
        setDatosEmitir(prev => ({ ...prev, [name]: value }));
      }
    } else {
      // Para otros campos, actualización normal
      setDatosEmitir(prev => ({ ...prev, [name]: value }));
    }
  };
    
  const handleChange = e => {
    /*if (e.target.name === "id_motivo"){
      setMotivoMovimiento(e.target.value);
    }*/

    setFormulario({...formulario, [e.target.name]: e.target.value});
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
  }

  // Función que devuelve el precio según cantidad
  const obtenerPrecioPorCantidad = (nuevaCantidad) => {
    const cantidadNum = parseFloat(nuevaCantidad);

    const rango = precio_select.find(r => {
      const min = parseFloat(r.cant_min);
      const max = parseFloat(r.cant_max);
      return cantidadNum >= min && cantidadNum <= max;
    });

    return rango  ? parseFloat((rango.precio_venta / rango.unidades).toFixed(2)) : 0;

  };

  //funcion para mostrar data de formulario, modo edicion
  const mostrarMovimiento = async (cod,serie,num) => {
    const res = await fetch(`${back_host}/ad_stock/${params.periodo}/${params.id_anfitrion}/${params.documento_id}/${cod}/${serie}/${num}`);
    const data = await res.json();
    console.log('data mst_movimiento: ',data);

    //Actualiza datos para enlace con controles, al momento de modo editar
    setFormulario((prevState) => ({
      ...prevState, // Mantiene el resto del estado anterior
      razon_social: data.razon_social, //datos para impresion
      
      fecha_emision: data.fecha_emision, //datos generales
      cod: data.cod,                //datos generales
      serie: data.serie,            //datos generales
      numero: data.numero,          //datos generales
      fecemi: data.fecemi,          //datos generales
      
      id_motivo: data.id_motivo,    //datos generales
      id_almacen: data.id_almacen,  //datos generales
      peso_total: data.peso_total,  //datos generales
      registrado: data.registrado,  //datos generales

      r_id_doc: data.r_id_doc,              //datos ingreso
      r_documento_id: data.r_documento_id,  //datos ingreso
      r_razon_social: data.r_razon_social,  //datos ingreso
      r_cod: data.r_cod,                    //datos ingreso
      r_serie: data.r_serie,                //datos ingreso
      r_numero: data.r_numero,              //datos ingreso
      r_fecemi: data.r_fecemi,              //datos ingreso
      
      gre_cod: data.gre_cod,                  //datos ingreso
      gre_serie: data.gre_serie,              //datos ingreso
      gre_numero: data.gre_numero,            //datos ingreso
    }));
      
    //console.log(data);
    setSearchText(data.r_documento_id); //data de cliente para form
  };
  
  const mostrarMovimientoDetalle = async (cod,serie,num) => {
    const res = await fetch(`${back_host}/ad_stockdet/${params.periodo}/${params.id_anfitrion}/${params.documento_id}/${cod}/${serie}/${num}`);
    const dataDet = await res.json();
    console.log('data detalle: ',dataDet);
    setRegistrosdet(dataDet);
  };

  //Seccion Elimina Item
  const handleDelete = (item) => {
    console.log(item);
    const [COD, SERIE, NUMERO] = params.comprobante.split('-');
    confirmaEliminarDetalle(COD, SERIE, NUMERO,item);
  };

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
    handleChangeProductoDatos({ target: { name: 'cantidad', value: parseCantidad(producto.cantidad) - 1 } }); //new
  };
  const handleIncreaseByOne = () => {
    console.log('incrementando cantidad en 1, estado del producto', producto);

    setProducto((prevProducto) => {
      const newCantidad = parseCantidad(prevProducto.cantidad) + 1;
      const newImporte = (prevProducto.precio_unitario * newCantidad).toFixed(2);
      return { ...prevProducto, cantidad: newCantidad.toString(), precio_neto:newImporte };
    });
    handleChangeProductoDatos({ target: { name: 'cantidad', value: parseCantidad(producto.cantidad) + 1 } }); //new
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
          r_fecemi: formulario.r_fecemi,
              
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
    producto.cod = COD;
    producto.serie = SERIE;
    producto.numero = NUMERO;
    producto.fecha_emision = formulario.fecha_emision;

    console.log('json producto: ',producto);

    const sRuta = `${back_host}/ad_stockdet`;
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


  const confirmaEliminarDetalle = async(cod,serie,num,item)=>{
    const result = await confirmDialog({
            title: "Eliminar Item?",
            //message: `${sComprobante}`,
            icon: "success", // success | error | info | warning
            confirmText: "ELIMINAR",
            cancelText: "CANCELAR",
    });
    //console.log(result);
    if (result.isConfirmed) {
        const sRuta = `${back_host}/ad_stockdet/${params.periodo}/${params.id_anfitrion}/${params.documento_id}/${cod}/${serie}/${num}/${item}`;
        console.log(sRuta);
        
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

  const handleEditarDetalleClick = ()=>{
    //especificar modo edicion y cargar datos detalle en useState del Producto
    

    //mostrar modal del producto
    setShowModalProducto(true);
  }

  const confirmaGrabarComprobante = async()=>{
    //console.log(params.comprobante,params.comprobante_ref);
    const [COD, SERIE, NUMERO] = params.comprobante.split('-');    
    const [ID_MOT, SA_TRANSF, SA_TRASL] = datosEmitir.id_motivo.split('-');    

    //const [COD_REF, SERIE_REF, NUMERO_REF] = params.comprobante_ref !== "-" ? 
    //                                          params.comprobante_ref.split('-') : [null, null, null];
    
    //Alimentar useState venta
    const estadoFinal = {
        id_anfitrion: params.id_anfitrion,
        documento_id: params.documento_id,
        periodo: params.periodo,
        id_invitado: params.id_invitado,
        r_cod_emitir: valorEmite,
        
        id_motivo: ID_MOT,
        id_almacen: datosEmitir.id_almacen,
        id_serie: datosEmitir.id_serie,

        r_id_doc: datosEmitir.r_id_doc,
        r_documento_id: datosEmitir.r_documento_id,
        r_razon_social: datosEmitir.r_razon_social,
        r_cod: datosEmitir.r_cod,
        r_serie: datosEmitir.r_serie,
        r_numero: datosEmitir.r_numero,
        r_fecemi: datosEmitir.r_fecemi,

        gre_cod: datosEmitir.gre_cod,
        gre_serie: datosEmitir.gre_serie,
        gre_numero: datosEmitir.gre_numero,

        ref_cod: COD,      //parte de la referencia a emitir, proc postgresql se encarga de procesarlo o setearlo a null
        ref_serie: SERIE,  //parte de la referencia a emitir, proc postgresql se encarga de procesarlo o setearlo a null
        ref_numero: NUMERO,//parte de la referencia a emitir, proc postgresql se encarga de procesarlo o setearlo a null

        id_almacen_ia: datosEmitir.id_almacen_ia,
        serie_ia: datosEmitir.serie_ia,
        sa_transf: SA_TRANSF, //Nuevo, convierte id_producto en id_producto2 en caso '1'
        sa_trasl: SA_TRASL, //Nuevo, convierteexisge almacen destino en caso '1'(frontend)

      };

    console.log('estadoFinal: ', estadoFinal);

    const sRuta = `${back_host}/ad_stockcomp/${params.periodo}/${params.id_anfitrion}/${params.documento_id}/${params.id_invitado}/${valorEmite}`;
    fetch(sRuta, {
      method: "POST",
      body: JSON.stringify(estadoFinal), 
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
              comprobante: (data.cod + '-' + data.serie + '-' + data.numero ) //actualizamos comprobante
            }));
            //console.log(params);
            //console.log(data);
            console.log(data.cod + '-' + data.serie + '-' + data.numero);
            
            const sComprobanteGenerado = data.cod + '-' + data.serie + '-' + data.numero;
            //renderizado automatico
            navigate(`/ad_stock/${params.id_anfitrion}/${params.id_invitado}/${params.periodo}/${params.documento_id}/${sComprobanteGenerado}/view`,
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
    //console.log(params.comprobante,params.comprobante_ref);
    const [COD, SERIE, NUMERO, ELEM] = params.comprobante.split('-');
  
    //Alimentar useState venta
    const estadoFinal = {
        id_anfitrion: params.id_anfitrion,
        documento_id: params.documento_id,
        periodo: params.periodo,
        id_invitado: params.id_invitado,

        fecha_emision: formulario.fecha_emision,
        cod: COD,
        serie: SERIE,
        numero: NUMERO,
        fecemi: formulario.fecemi,

        r_id_doc: formulario.r_id_doc,
        r_documento_id: formulario.r_documento_id,
        r_razon_social: formulario.r_razon_social,
        r_cod: formulario.r_cod,
        r_serie: formulario.r_serie,
        r_numero: formulario.r_numero,

      };

    console.log(estadoFinal);
    
    const sRuta = `${back_host}/ad_stock`;
    console.log(sRuta);
    fetch(sRuta, {
      method: "PUT",
      body: JSON.stringify(estadoFinal), 
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

   
    { pVenta010202 && !visualizando ?
    (
    <IconButton color="primary" 
      onClick = {()=> {
                  //Agregar Producto
                  setShowModalProducto(true);                  
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
            setDatosEmitir(prevState => ({ ...prevState, r_direccion: direccion_completa }));
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
                                      params.comprobante.includes('MV') ?
                                      ('MV en Proceso')
                                      :
                                      (  //cambiamos la vista del comprobante a mostrar
                                        (formulario.r_cod_ref==null) ?
                                        formulario.cod+"-"+formulario.serie+"-"+formulario.numero
                                        :
                                        formulario.r_cod_ref+"-"+formulario.r_serie_ref+"-"+formulario.r_numero_ref
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
                                        name="fecha_emision"
                                        type="date"
                                        //format="yyyy/MM/dd"
                                        value={formulario.fecha_emision}
                                        onChange={handleChange}
                                        inputProps={{ style:{color:'white'} }}
                                        InputLabelProps={{ style:{color:'white'} }}
                                />
                              </Grid>

                              <Grid item xs={isSmallScreen ? 12 : 4}>
                                  {params.comprobante.includes('MV') ?
                                    (
                                      <Typography variant='h6' color='white' textAlign='center'>
                                          Almacen: {formulario.id_almacen}
                                      </Typography>
                                    ):
                                    (
                                      <Select
                                          labelId="almacen_select"
                                          size='small'
                                          value={formulario.id_almacen}
                                          name="almacen"
                                          sx={{display:'block',
                                          margin:'.1rem 0', color:"white", fontSize: '13px' }}
                                          label="Almacen"
                                          onChange={handleChange}
                                          >
                                          <MenuItem value="default">SELECCIONA </MenuItem>
                                          {   
                                              almacen_select.map(elemento => (
                                              <MenuItem key={elemento.id_almacen} value={elemento.id_almacen}>
                                                {elemento.nombre}
                                              </MenuItem>)) 
                                          }
                                      </Select>
                                    )
                                  }
                              </Grid>

                              
                              <Grid item xs={isSmallScreen ? 12 : 2.8}>
                                  {params.comprobante.includes('MV') ?
                                    (
                                      <Typography variant='h6' color='white' textAlign='center'>
                                          Motivo: {formulario.id_motivo}
                                      </Typography>
                                    ):
                                    (
                                      <Select
                                            labelId="motivo_select"
                                            size='small'
                                            value={formulario.id_motivo}
                                            name="id_motivo"
                                            sx={{display:'block',
                                            margin:'.1rem 0', color:"white", fontSize: '13px' }}
                                            label="Motivo"
                                            onChange={handleChange}
                                            >
                                              <MenuItem value="default">SELECCIONA </MenuItem>
                                            {   
                                                motivo_select.map(elemento => (
                                                <MenuItem key={elemento.id_motivo} value={elemento.id_motivo}>
                                                  {elemento.nombre}
                                                </MenuItem>)) 
                                            }
                                      </Select>
                                    )
                                  }
                              </Grid>

                              <Grid item xs={isSmallScreen ? 12 : 1.2}>
                              {//En caso de MV en Proceso, solo se emite comprobante
                               params.comprobante.includes('MV') ?
                               (
                                  <Button variant='contained' 
                                          color='primary' 
                                          //type='submit'
                                          fullWidth
                                          sx={{display:'block',
                                          margin:'.5rem 0'}}
                                          onClick = { () => {
                                            //Valores deafult
                                            setValorEmite('IA'); //por default
                                            cargaMotivoSelect('IA'); //por default
                                            cargaSeguridadSeriesSelect('IA'); //por default
                                            setShowModalEmite(true);
                                            }
                                          }
                                          disabled={
                                                    !formulario.fecha_emision 
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
                               (  //Caso contrario, solo se modifica pero 'NV' (Notas)
                                  //Comprobantes Sunat NO, porque ya estan declarados en OSE-sunat
                                  <Button variant='contained' 
                                          color='primary' 
                                          type='submit'
                                          fullWidth
                                          sx={{display:'block',
                                          margin:'.5rem 0'}}
                                          disabled={
                                                    !formulario.fecemi 
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

                              {!params.comprobante.includes('MV') && (
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
                                          value={formulario.r_documento_id}
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
                                                    value={formulario.r_razon_social}
                                                    onChange={handleChange} //new para busqueda
                                                    onKeyDown={handleCodigoKeyDown} //new para busqueda
                                                    inputProps={{ style:{color:'white'} }}
                                                    InputLabelProps={{ style:{color:'white'} }}
                                        />
                                    </Grid>

                                    <Grid item xs={isSmallScreen ? 12 : 5}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                        <TextField variant="outlined" 
                                                placeholder="COD"
                                                fullWidth
                                                size="small"
                                                //sx={{display:'block',
                                                //      margin:'.5rem 0'}}
                                                sx={{mt:1}}
                                                name="r_cod"
                                                value={formulario.r_cod}
                                                onChange={handleChange}
                                                inputProps={{ style:{color:'white'} }}
                                                InputLabelProps={{ style:{color:'white'} }}
                                        />
                                        <TextField variant="outlined" 
                                                placeholder="SERIE"
                                                fullWidth
                                                size="small"
                                                //sx={{display:'block',
                                                //      margin:'.5rem 0'}}
                                                sx={{mt:1}}
                                                name="r_serie"
                                                value={formulario.r_serie}
                                                onChange={handleChange}
                                                inputProps={{ style:{color:'white'} }}
                                                InputLabelProps={{ style:{color:'white'} }}
                                        />
                                        <TextField variant="outlined" 
                                                placeholder="NUMERO"
                                                fullWidth
                                                size="small"
                                                //sx={{display:'block',
                                                //      margin:'.5rem 0'}}
                                                sx={{mt:1}}
                                                name="r_numero"
                                                value={formulario.r_numero}
                                                onChange={handleChange}
                                                inputProps={{ style:{color:'white'} }}
                                                InputLabelProps={{ style:{color:'white'} }}
                                        />
                                        <TextField variant="outlined" 
                                                placeholder="FECHA"
                                                fullWidth
                                                size="small"
                                                //sx={{display:'block',
                                                //      margin:'.5rem 0'}}
                                                sx={{mt:1}}
                                                name="fecemi"
                                                value={formulario.fecemi}
                                                onChange={handleChange}
                                                inputProps={{ style:{color:'white'} }}
                                                InputLabelProps={{ style:{color:'white'} }}
                                        />
                                      </Box>
                                    </Grid>

                                    <Grid item xs={isSmallScreen ? 12 : 1.5}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                        <TextField variant="outlined" 
                                                placeholder="GRE-SERIE"
                                                fullWidth
                                                size="small"
                                                //sx={{display:'block',
                                                //      margin:'.5rem 0'}}
                                                sx={{mt:1}}
                                                name="gre_serie"
                                                value={formulario.gre_serie}
                                                onChange={handleChange}
                                                inputProps={{ style:{color:'white'} }}
                                                InputLabelProps={{ style:{color:'white'} }}
                                        />
                                        <TextField variant="outlined" 
                                                placeholder="GRE-NUMERO"
                                                fullWidth
                                                size="small"
                                                //sx={{display:'block',
                                                //      margin:'.5rem 0'}}
                                                sx={{mt:1}}
                                                name="gre_numero"
                                                value={formulario.gre_numero}
                                                onChange={handleChange}
                                                inputProps={{ style:{color:'white'} }}
                                                InputLabelProps={{ style:{color:'white'} }}
                                        />
                                      </Box>
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
                                                        onClick={handleSaveDetail}
                                                        sx={{display:'block',margin:'.5rem 0', width: 270}}
                                                        //sx={{margin:'.5rem 0', height:55}}
                                                        >
                                                        AGREGAR
                                            </Button>
                                            <Button variant='contained' 
                                                        //color='warning' 
                                                        //size='small'
                                                        onClick={()=>{
                                                              setShowModalProducto(false);
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
                                              <ToggleButton value="IA"
                                                            sx={{ flex: 1 }} // Cada botón ocupa el mismo espacio
                                                            style={{
                                                              backgroundColor: valorEmite === 'IA' ? 'lightblue' : 'transparent',
                                                              color: valorEmite === 'IA' ? "orange" : "gray",
                                                              borderRadius: '4px', // Puedes ajustar este valor según la cantidad de redondeo que desees                    
                                                            }}
                                              >INGRESO</ToggleButton>

                                              <ToggleButton value="SA"
                                                            sx={{ flex: 1 }} // Cada botón ocupa el mismo espacio
                                                            style={{
                                                              backgroundColor: valorEmite === 'SA' ? 'lightblue' : 'transparent',
                                                              color: valorEmite === 'SA' ? 'orange' : 'gray',
                                                              borderRadius: '4px', // Puedes ajustar este valor según la cantidad de redondeo que desees                    
                                                            }}
                                              >SALIDA</ToggleButton>


                                            </ToggleButtonGroup>

                                             <Select
                                                    labelId="serie_select"
                                                    value={datosEmitir.id_almacen}  // 
                                                    size='small'
                                                    name="id_almacen"
                                                    //fullWidth
                                                    sx={{display:'block',
                                                         //margin:'.4rem 0', 
                                                         mt:0,
                                                         top: '-7px',
                                                         width: '270px',  // Establece el ancho fijo aquí
                                                         textAlign: 'center',  // Centrar el texto seleccionado
                                                         '.MuiSelect-select': { 
                                                           textAlign: 'center',  // Centrar el valor dentro del Select
                                                         },                                                         
                                                         color:"white"}}
                                                    label="Serie"
                                                    onChange={(e) => handleChangeEmite('id_almacen', e.target.value)}
                                             >
                                                    {   
                                                        serie_select.map(elemento => (
                                                        <MenuItem key={elemento.id_almacen} value={elemento.id_almacen}
                                                                  sx={{ justifyContent: 'center' }} // Centra el texto en cada opción
                                                        >
                                                        {elemento.descripcion}
                                                        </MenuItem>)) 
                                                    }
                                             </Select>

                                             <Select
                                                    labelId="motivo_select"
                                                    value={datosEmitir.id_motivo}  // 
                                                    size='small'
                                                    name="id_motivo"
                                                    //fullWidth
                                                    sx={{display:'block',
                                                         //margin:'.4rem 0', 
                                                         mt:0,
                                                         top: '-7px',
                                                         width: '270px',  // Establece el ancho fijo aquí
                                                         textAlign: 'center',  // Centrar el texto seleccionado
                                                         '.MuiSelect-select': { 
                                                           textAlign: 'center',  // Centrar el valor dentro del Select
                                                         },                                                         
                                                         color:"white"}}
                                                    label="Motivo"
                                                    onChange={(e) => handleChangeEmite('id_motivo', e.target.value)}
                                             >
                                                    {   
                                                        motivo_select.map(elemento => (
                                                        <MenuItem key={elemento.id_motivo} value={elemento.id_motivo}
                                                                  sx={{ justifyContent: 'center' }} // Centra el texto en cada opción
                                                        >
                                                        {elemento.nombre}
                                                        </MenuItem>)) 
                                                    }
                                             </Select>
                                             
                                            { (opTraslado) ?
                                            (   
                                              <Select
                                                      value={datosEmitir.id_almacen_ia}  // 
                                                      size='small'
                                                      name="id_almacen_ia"
                                                      //fullWidth
                                                      sx={{display:'block',
                                                          //margin:'.4rem 0', 
                                                          mt:0,
                                                          top: '-7px',
                                                          width: '270px',  // Establece el ancho fijo aquí
                                                          textAlign: 'center',  // Centrar el texto seleccionado
                                                          '.MuiSelect-select': { 
                                                            textAlign: 'center',  // Centrar el valor dentro del Select
                                                          },                                                         
                                                          color:"white"}}
                                                      onChange={(e) => handleChangeEmite('id_almacen_ia', e.target.value)}
                                              >
                                                      {   
                                                          serie_selectIA.map(elemento => (
                                                          <MenuItem key={elemento.id_almacen} value={elemento.id_almacen}
                                                                    sx={{ justifyContent: 'center' }} // Centra el texto en cada opción
                                                          >
                                                          {elemento.descripcion}
                                                          </MenuItem>)) 
                                                      }
                                              </Select>
                                            )
                                            :
                                            (
                                              <></>
                                            )
                                            }


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
                                                          placeholder='RAZON SOCIAL'
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
                                            
                                            <Box>
                                            <TextField variant="outlined" 
                                                      //maxWidth="md"
                                                      placeholder='COD'
                                                      autoFocus
                                                      size="small"
                                                      autoComplete="off"
                                                      //sx={{mt:-1}}
                                                      name="r_cod"
                                                      value={datosEmitir.r_cod}
                                                      onChange={(e) => handleChangeEmite('r_cod', e.target.value)}
                                                      //onKeyDown={handleCodigoKeyDown} //new para busqueda
                                                      inputProps={{ style:{color:'white',width: 40, textAlign: 'center',  readOnly: true} }}
                                                      InputLabelProps={{ style:{color:'white'} }}
                                            />
                                            <TextField variant="outlined" 
                                                      //maxWidth="md"
                                                      placeholder='SERIE'
                                                      autoFocus
                                                      size="small"
                                                      autoComplete="off"
                                                      //sx={{mt:-1}}
                                                      name="r_serie"
                                                      value={datosEmitir.r_serie}
                                                      onChange={(e) => handleChangeEmite('r_serie', e.target.value)}
                                                      //onKeyDown={handleCodigoKeyDown} //new para busqueda
                                                      inputProps={{ style:{color:'white',width: 45, textAlign: 'center',  readOnly: true} }}
                                                      InputLabelProps={{ style:{color:'white'} }}
                                            />
                                            <TextField variant="outlined" 
                                                      //maxWidth="md"
                                                      placeholder='NUMERO'
                                                      autoFocus
                                                      size="small"
                                                      autoComplete="off"
                                                      //sx={{mt:-1}}
                                                      name="r_numero"
                                                      value={datosEmitir.r_numero}
                                                      onChange={(e) => handleChangeEmite('r_numero', e.target.value)}
                                                      //onKeyDown={handleCodigoKeyDown} //new para busqueda
                                                      inputProps={{ style:{color:'white',width: 95, textAlign: 'center',  readOnly: true} }}
                                                      InputLabelProps={{ style:{color:'white'} }}
                                            />
                                            </Box>

                                            <TextField variant="outlined" 
                                                    placeholder="FECHA"
                                                    size="small"
                                                    type="date"
                                                    sx={{mt:1}}
                                                    name="r_fecemi"
                                                    value={datosEmitir.r_fecemi}
                                                    onChange={(e) => handleChangeEmite('r_fecemi', e.target.value)}
                                                    inputProps={{ style:{color:'white',width: 240, textAlign: 'center',  readOnly: true} }}
                                                    InputLabelProps={{ style:{color:'white'} }}
                                            />

                                            <Box>
                                            <TextField variant="outlined" 
                                                      //maxWidth="md"
                                                      placeholder='GRE'
                                                      autoFocus
                                                      size="small"
                                                      autoComplete="off"
                                                      //sx={{mt:-1}}
                                                      name="gre_cod"
                                                      value={datosEmitir.gre_cod}
                                                      onChange={(e) => handleChangeEmite('gre_cod', e.target.value)}
                                                      //onKeyDown={handleCodigoKeyDown} //new para busqueda
                                                      inputProps={{ style:{color:'white',width: 40, textAlign: 'center',  readOnly: true} }}
                                                      InputLabelProps={{ style:{color:'white'} }}
                                            />
                                            <TextField variant="outlined" 
                                                      //maxWidth="md"
                                                      placeholder='GSERIE'
                                                      autoFocus
                                                      size="small"
                                                      autoComplete="off"
                                                      //sx={{mt:-1}}
                                                      name="gre_serie"
                                                      value={datosEmitir.gre_serie}
                                                      onChange={(e) => handleChangeEmite('gre_serie', e.target.value)}
                                                      //onKeyDown={handleCodigoKeyDown} //new para busqueda
                                                      inputProps={{ style:{color:'white',width: 45, textAlign: 'center',  readOnly: true} }}
                                                      InputLabelProps={{ style:{color:'white'} }}
                                            />
                                            <TextField variant="outlined" 
                                                      //maxWidth="md"
                                                      placeholder='GNUM'
                                                      autoFocus
                                                      size="small"
                                                      autoComplete="off"
                                                      //sx={{mt:-1}}
                                                      name="gre_numero"
                                                      value={datosEmitir.gre_numero}
                                                      onChange={(e) => handleChangeEmite('gre_numero', e.target.value)}
                                                      //onKeyDown={handleCodigoKeyDown} //new para busqueda
                                                      inputProps={{ style:{color:'white',width: 95, textAlign: 'center',  readOnly: true} }}
                                                      InputLabelProps={{ style:{color:'white'} }}
                                            />
                                            </Box>

                                            <Button variant='contained' 
                                                        color='primary' 
                                                        //size='small'
                                                        onClick={handleSaveComprobante}
                                                        sx={{display:'block',margin:'.5rem 0', width: 270}}
                                                        disabled={
                                                                  !datosEmitir.id_almacen 
                                                                  || !datosEmitir.id_motivo 
                                                                  //|| !pVenta010201 
                                                                  //|| !params.comprobante.includes('NV')
                                                                  }
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
