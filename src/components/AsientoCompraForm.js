import {Grid,Card,CardContent,Typography,TextField,Button,CircularProgress,Select, MenuItem, InputLabel, Box, FormControl, useMediaQuery} from '@mui/material'
import React, { useState,useEffect} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import axios from 'axios';
import AddBoxRoundedIcon from '@mui/icons-material/AddToQueue';
import BorderColorIcon from '@mui/icons-material/QrCodeRounded';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PictureAsPdf from '@mui/icons-material/PictureAsPdf';
import swal from 'sweetalert';
//
import Switch from '@mui/material/Switch';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import { createTheme, ThemeProvider } from '@mui/material/styles';
//

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import logo from '../alsa.png';
import AsientoRazonSocial from './AsientoRazonSocial';
import AsientoComprobante from './AsientoComprobante';
import AsientoCompraImportacion from './AsientoCompraImportacion';
import AsientoCompraMontos from './AsientoCompraMontos';
//import AsientoCompraBases from './AsientoCompraBases';
//import AsientoCompraImpuestos from './AsientoCompraImpuestos';

export default function AsientoCompraForm() {
  //const back_host = process.env.BACK_HOST || "http://localhost:4000";
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production.up.railway.app";  
  const isSmallScreen = useMediaQuery('(max-width: 600px)');
  const theme = createTheme({
    components: {
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'gray', // Cambia 'red' al color que desees
            },
          },
        },
      },
    },
  });  
  ////////////////////////////////////////////////////////////////////////////////////////
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
      x: 1,
      y: 780,
      width: pngDims.width,
      height: pngDims.height,
    })

    const fontSize = 12;
    const lineHeight = fontSize * 1.2;
    const margin = 50;
    const x = margin;
    const y = height - margin - lineHeight - 10;

    // Draw column headers
    page.drawText('Nombre', { x, y, size: fontSize });
    page.drawText('Zona', { x: x + 200, y, size: fontSize });

    // Draw table data
    let row = 1;
    registrosdet.forEach((person) => {
      const text = `${person.descripcion}`;
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const textHeight = font.heightAtSize(fontSize);
      const textX = x;
      const textY = y - lineHeight * row;

      page.drawText(text, { x: textX, y: textY, size: fontSize, font });
      page.drawLine({
        start: { x: textX, y: textY - textHeight / 2 + 2},
        end: { x: textX + 300, y: textY - textHeight / 2 + 2 },
        thickness: 1,
        color: rgb(0, 0, 0),
        opacity: 0.5
      });

      page.drawText(person.cantidad.toString(), { x: x + 200, y: textY, size: fontSize, font });
      /*page.drawLine({
        start: { x: x + 200, y: textY - textHeight / 2 },
        end: { x: x + 200 + 50, y: textY - textHeight / 2 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });*/

      row++;
    });
 
    const pdfBytes = await pdfDoc.saveAsBase64({ dataUri: true });

    // Creamos un enlace para descargar el archivo
    const link = document.createElement('a');
    link.href = pdfBytes;
    link.download = 'mi-documento.pdf';
    link.target = '_blank'; // Abrir el PDF en una nueva pestaña
    document.body.appendChild(link);

    // Hacemos clic en el enlace para descargar el archivo
    link.click();
  }
  ////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////
   
  const [cliente_select,setClienteSelect] = useState([]);
  //const [moneda_select,setMonedaSelect] = useState([]);

  const [registrosdet,setRegistrosdet] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substr(0, 10));

  var fecha_actual="";
  const iniciaFechaActual = ()=>{
    var strFecha=""
    let nPos=0;
    const fecha = new Date(); //ok fecha y hora actual
    strFecha = fecha.toISOString(); //formato texto
    nPos = strFecha.indexOf('T');
    fecha_actual = strFecha.substr(0,nPos);
    //console.log(fecha_actual);
    setRegistro(prevState => ({ ...prevState, comprobante_original_fecemi: fecha_actual }));
  }

  const [registro,setRegistro] = useState({
      
      id_anfitrion:'',
      documento_id:'',
      periodo:'',
      id_libro:'',
      id_invitado:'',

      fecha_asiento:'',
      glosa:'COMPRA',
      debe:'0',
      haber:'0',
      debe_me:'0',
      haber_me:'0',
      asiento_mayorizado:'0',
      ctrl_crea_us:'',
      r_documento_id:'',
      r_razon_social:'',

      r_cod:'',
      r_serie:'',
      r_numero:'',
      r_numero2:'',
      fecemi:'',
      fecvcto:'',

      r_cod_ref:'',
      r_serie_ref:'',
      r_numero_ref:'',
      fecemi_ref:'',

      r_base001:'',
      r_base002:'',
      r_base003:'',
      r_base004:'',
      
      r_igv001:'',
      r_igv002:'',
      r_igv003:'',

      r_monto_isc:'',
      r_monto_icbp:'',
      r_monto_otros:'',
      r_monto_total:'',
      r_moneda:'PEN',
      r_tc:'',

      r_ibss:'',
      r_ib_pais:'',
      r_ib_aduana:'',
      r_ano_dam:'',

      r_contrato_id:'',
      r_contrato_porc:'',
      r_impuesto_mat:'',
      
      r_id_mediopago:'',
      r_voucher_banco:'',
      r_cuenta10:'',
      
      registrado:'1'
  })
  
  const [cargando,setCargando] = useState(false);
  const [editando,setEditando] = useState(false);
  
  const navigate = useNavigate();
  const params = useParams();

  const handleSubmit = async(e) => {
    e.preventDefault();
    setCargando(true);
    var data;

    //Cambiooo para controlar Edicion
    if (editando){
      await fetch(`${back_host}/registro/${params.cod}/${params.serie}/${params.num}/${params.elem}`, {
        method: "PUT",
        body: JSON.stringify(registro),
        headers: {"Content-Type":"application/json"}
      });
    }else{
      console.log(`${back_host}/asiento`);
      console.log(registro);
      const res = await fetch(`${back_host}/asiento`, {
        method: "POST",
        body: JSON.stringify(registro),
        headers: {"Content-Type":"application/json"}
      });
      //nuevo
      data = await res.json();
    }
    setCargando(false);
    
    setEditando(true);
    //Obtener json respuesta, para extraer cod,serie,num y elemento
    navigate(`/asiento/${params.id_anfitrion}/${params.id_invitado}/${params.periodo}/${params.id_libro}`);
  };
  
  //Aqui se leen parametros en caso lleguen
  useEffect( ()=> {
    if (params.num_asiento){
      mostrarRegistro(params.id_anfitrion,params.periodo,params.documento_id,params.id_libro,params.num_asiento);
      //mostrarRegistroDetalle(params.id_anfitrion,params.id_invitado,params.periodo,params.documento_id,params.id_libro);
    }
    iniciaFechaActual();
    //cargar datos generales en asiento
    //fusionar al arreglo registro, el campo id_invitado: 'valor', otro_campo:'valor dif'
    setRegistro({...registro, id_anfitrion:params.id_anfitrion});
    setRegistro({...registro, periodo:params.periodo});
    setRegistro({...registro, documento_id:params.documento_id});
    setRegistro({...registro, id_libro:params.id_libro});
    setRegistro({...registro, id_invitado:params.id_invitado});

    //console.log('invitado: ',params.id_invitado);
    console.log('registro despues de set invitado: ',registro);
    
  },[params.cod]);

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

  //Rico evento change
  const handleChange = (newFormData) => {
    //var index;
    //var sTexto;
    console.log(newFormData);
    
    /*if (nameTarget === "r_documento_id") {
      const arrayCopia = cliente_select.slice();
      index = arrayCopia.map(elemento => elemento.documento_id).indexOf(valueTarget);
      sTexto = arrayCopia[index].razon_social;
      setRegistro({...registro, [nameTarget]: valueTarget, razon_social:sTexto});
      return;
    }*/

    
    //setRegistro({...registro, [nameTarget]: valueTarget});
    //newFormData = {...registro, [nameTarget]: valueTarget} //rico arreglo estilo js
    setRegistro(newFormData);
  }

  //funcion para mostrar data de formulario, modo edicion
  const mostrarRegistro = async (id_anfitrion,periodo,documento_id,id_libro,num_asiento) => {
    const res = await fetch(`${back_host}/asiento/todos/${id_anfitrion}/${documento_id}/${periodo}/${id_libro}/${num_asiento}`);
    const data = await res.json();
    //Actualiza datos para enlace con controles, al momento de modo editar
    setRegistro({  
          id_anfitrion:params.id_anfitrion,
          documento_id:params.documento_id,
          periodo:params.periodo,
          id_libro:params.id_libro,
          num_asiento:num_asiento,

          r_documento_id:data.r_documento_id,
          r_razon_social:data.r_razon_social,

          r_cod:data.r_cod,
          r_serie:data.r_serie,
          r_numero:data.r_numero,
          r_numero2:data.r_numero2,
          fecemi:data.fecemi,
          fecvcto:data.fecvcto,

          r_cod_ref:data.r_cod_ref,
          r_serie_ref:data.r_serie_ref,
          r_numero_ref:data.r_numero_ref,
          fecemi_ref:data.fecemi_ref,

          r_base001:data.r_base001,
          r_base002:data.r_base002,
          r_base003:data.r_base003,
          r_base004:data.r_base004,
          
          r_igv001:data.r_igv001,
          r_igv002:data.r_igv002,
          r_igv003:data.r_igv003,

          r_monto_isc:data.r_monto_isc,
          r_monto_icbp:data.r_monto_icbp,
          r_monto_otros:data.r_monto_otros,
          r_monto_total:data.r_monto_total,
          r_moneda:data.r_moneda,
          r_tc:data.r_tc,

          r_ibss:data.r_ibss,
          r_ib_pais:data.r_ib_pais,
          r_ib_aduana:data.r_ib_aduana,
          r_ano_dam:data.r_ano_dam,

          r_contrato_id:data.r_contrato_id,
          r_contrato_porc:data.r_contrato_porc,
          r_impuesto_mat:data.r_impuesto_mat,
          
          r_id_mediopago:data.r_id_mediopago,
          r_voucher_banco:data.r_voucher_banco,
          r_cuenta10:data.r_cuenta10,

          });
    //console.log(data);
    setEditando(true);
  };
  
  const mostrarRegistroDetalle = async (cod,serie,num,elem) => {
    const res = await fetch(`${back_host}/registrodet/${cod}/${serie}/${num}/${elem}`);
    const dataDet = await res.json();
    setRegistrosdet(dataDet);
    setEditando(true);
  };

  const eliminarRegistroDetalleItem = async (cod,serie,num,elem,item) => {
    await fetch(`${back_host}/registrodet/${cod}/${serie}/${num}/${elem}/${item}`, {
      method:"DELETE"
    });
    
    setRegistrosdet(registrosdet.filter(registrosdet => registrosdet.comprobante_original_codigo !== cod ||
                                                        registrosdet.comprobante_original_serie !== serie ||
                                                        registrosdet.comprobante_original_numero !== num ||
                                                        registrosdet.elemento !== elem ||
                                                        registrosdet.item !== item                                                        
    ));
    //console.log(data);
  }

  const confirmaEliminacionDet = (cod,serie,num,elem,item)=>{
    swal({
      title:"Eliminar Detalle de registro",
      text:"Seguro ?",
      icon:"warning",
      timer:"3000",
      buttons:["No","Si"]
    }).then(respuesta=>{
        if (respuesta){
          eliminarRegistroDetalleItem(cod,serie,num,elem,item);
            swal({
            text:"Detalle de registro eliminado con exito",
            icon:"success",
            timer:"2000"
          });
      }
    })
  }

  //Body para Modal de Busqueda Incremental de Pedidos

  return (
  <div> 
    <Grid container spacing={0.5} style={{ marginTop: "0px" }}
      //direction={isSmallScreen ? 'column' : 'row'}
      alignItems={isSmallScreen ? 'center' : 'center'}
      justifyContent={isSmallScreen ? 'center' : 'center'}
    >
      <Grid item xs={9} >
        <Card
            style={{
              background:'#1e272e',
              //width: '750px', // Aquí estableces el ancho
              marginTop: "0px",
              //margin:'auto',
              borderRadius: '10px',
              padding:'1rem'
            }}
        >
          <Typography variant='h6' color='white' textAlign='center'>
              {editando ? ("Editar Asiento : " + params.num_asiento + " ") : ("Libro Compras")}
          </Typography>
        </Card>
      </Grid>
      

      <Grid item xs={9} >
        <form onSubmit={handleSubmit} >
            <AsientoRazonSocial formData={registro} isSmallScreen={isSmallScreen} onFormDataChange={handleChange}>

            </AsientoRazonSocial>
        </form>
      </Grid>
    </Grid>
    
    <form onSubmit={handleSubmit} >
    <Grid container spacing={0.5} style={{ marginTop: "-5px" }}
        direction={isSmallScreen ? 'column' : 'row'}
        alignItems={isSmallScreen ? 'center' : 'center'}
        justifyContent={isSmallScreen ? 'center' : 'center'}
      >
          <Grid item xs={3} >
            <AsientoComprobante formData={registro} isSmallScreen={isSmallScreen} onFormDataChange={handleChange}>
            
            </AsientoComprobante>
          </Grid>

          <Grid item xs={2} >
            <AsientoCompraImportacion formData={registro} isSmallScreen={isSmallScreen} onFormDataChange={handleChange}>
            
            </AsientoCompraImportacion>
          </Grid>

          <Grid item xs={4} >
            <AsientoCompraMontos formData={registro} isSmallScreen={isSmallScreen} onFormDataChange={handleChange}>
            
            </AsientoCompraMontos>
          </Grid>

          {/*
          <Grid item xs={2} >
            <AsientoCompraImpuestos formData={registro} isSmallScreen={isSmallScreen} onFormDataChange={handleChange}>
            
            </AsientoCompraImpuestos>
          </Grid>
          */}
      </Grid>

          <Grid container spacing={0.5} style={{ marginTop: "-15px" }}
            direction={isSmallScreen ? 'column' : 'row'}
            alignItems={isSmallScreen ? 'center' : 'center'}
            //justifyContent={isSmallScreen ? 'center' : 'center'}
          >
              <Grid item xs={2}>
                  <Button variant='contained' 
                          color='primary' 
                          type='submit'
                          sx={{display:'block',
                          margin:'.5rem 0'}}
                          disabled={
                                    !registro.r_documento_id || 
                                    !registro.r_razon_social || 
                                    !registro.r_monto_total
                                    }
                          >
                          { cargando ? (
                          <CircularProgress color="inherit" size={24} />
                          ) : (
                            editando ?
                          'Modificar' : 'Grabar')
                          }
                  </Button>
              </Grid>
          </Grid>
    </form>
      {/* /////////////////////////////////////////////////////////////// */}
      
  </div>    
  );
}
