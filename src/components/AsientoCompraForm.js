import {Grid,Card,Typography,Button,CircularProgress,useMediaQuery} from '@mui/material'
import React, { useState,useEffect} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
//import axios from 'axios';
//import AddBoxRoundedIcon from '@mui/icons-material/AddToQueue';
//import BorderColorIcon from '@mui/icons-material/QrCodeRounded';
//import DeleteIcon from '@mui/icons-material/Delete';
//import IconButton from '@mui/material/IconButton';
//import LocalShippingIcon from '@mui/icons-material/LocalShipping';
//import PictureAsPdf from '@mui/icons-material/PictureAsPdf';
//import swal from 'sweetalert';
//
//import Switch from '@mui/material/Switch';
//import FormGroup from '@mui/material/FormGroup';
//import FormControlLabel from '@mui/material/FormControlLabel';
//import FormLabel from '@mui/material/FormLabel';
//

//import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
//import logo from '../alsa.png';
import AsientoRazonSocial from './AsientoRazonSocial';
import AsientoComprobante from './AsientoComprobante';
import AsientoCompraImportacion from './AsientoCompraImportacion';
import AsientoCompraMontos from './AsientoCompraMontos';

export default function AsientoCompraForm() {
  //const back_host = process.env.BACK_HOST || "http://localhost:4000";
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
  const isSmallScreen = useMediaQuery('(max-width: 600px)');
  ////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////
   
  const [registro,setRegistro] = useState({
      
      //id_anfitrion:'',
      //documento_id:'',
      //periodo:'',
      //id_libro:'',
      //id_invitado:'',

      glosa:'COMPRA',
      debe:'0',
      haber:'0',
      debe_me:'0',
      haber_me:'0',
      asiento_mayorizado:'0',
      ctrl_crea_us:'',
      r_id_doc:'',
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

      r_base001:'0',
      r_base002:'',
      r_base003:'',
      r_base004:'',
      
      r_igv001:'0',
      r_igv002:'',
      r_igv003:'',

      r_monto_isc:'',
      r_monto_icbp:'',
      r_monto_otros:'',
      r_monto_total:'',
      r_moneda:'PEN',
      r_tc:'',

      r_idbss:'',
      r_id_pais:'',
      r_id_aduana:'',
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
      await fetch(`${back_host}/asiento/${params.id_anfitrion}/${params.periodo}/${params.documento_id}/${params.id_libro}/${params.num_asiento}`, {
        method: "PUT",
        body: JSON.stringify(registro),
        headers: {"Content-Type":"application/json"}
      });
    }else{
      setRegistro(prevState => ({ ...prevState, id_anfitrion: params.id_anfitrion }));
      setRegistro(prevState => ({ ...prevState, periodo: params.periodo }));
      setRegistro(prevState => ({ ...prevState, documento_id: params.documento_id }));
      setRegistro(prevState => ({ ...prevState, id_libro: params.id_libro }));
      setRegistro(prevState => ({ ...prevState, id_invitado: params.id_invitado }));

      setRegistro(prevState => ({ ...prevState, ctrl_crea_us: params.id_invitado }));
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
    //Obtener json respuesta, para extraer num_asiento y colocarlo en modo editar ;) viejo truco del guardado y editado posterior
    navigate(`/asientoc/${params.id_usuario}/${params.id_invitado}/${params.periodo}/${params.documento_id}/${params.id_libro}/${data.num_asiento}/edit`);
    //recordatorio de navegacion al mismo formulario, pero en modo Edicion, num_asiento lo obtenemos de respuesta de insercion
    //<Route path="/asientoc/:id_anfitrion/:id_invitado/:periodo/:documento_id/:id_libro/:num_asiento/edit" element={<AsientoCompraForm />} /> 
  };
  
  //Aqui se leen parametros en caso lleguen
  useEffect( ()=> {
    if (params.num_asiento){
        mostrarRegistro(params.id_anfitrion,params.periodo,params.documento_id,params.id_libro,params.num_asiento);
    }
    //cargar datos generales en asiento
    //fusionar al arreglo registro, el campo id_invitado: 'valor', otro_campo:'valor dif'
    setRegistro(prevState => ({ ...prevState, id_anfitrion: params.id_anfitrion }));
    setRegistro(prevState => ({ ...prevState, periodo: params.periodo }));
    setRegistro(prevState => ({ ...prevState, documento_id: params.documento_id }));
    setRegistro(prevState => ({ ...prevState, id_libro: params.id_libro }));
    setRegistro(prevState => ({ ...prevState, id_invitado: params.id_invitado }));

    console.log('registro final useEffect AsientoCompraForm: ',registro);
    
  },[params.num_asiento]);


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

          r_id_doc:data.r_id_doc,
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

          r_idbss:data.r_idbss,
          r_id_pais:data.r_id_pais,
          r_id_aduana:data.r_id_aduana,
          r_ano_dam:data.r_ano_dam,

          r_contrato_id:data.r_contrato_id,
          r_contrato_porc:data.r_contrato_porc,
          r_impuesto_mat:data.r_impuesto_mat,
          
          r_id_mediopago:data.r_id_mediopago,
          r_voucher_banco:data.r_voucher_banco,
          r_cuenta10:data.r_cuenta10,

          });
    console.log("data mostrar registro: ",data);
    setEditando(true);
  };
  
  /*const mostrarRegistroDetalle = async (cod,serie,num,elem) => {
    const res = await fetch(`${back_host}/registrodet/${cod}/${serie}/${num}/${elem}`);
    const dataDet = await res.json();
    setRegistrosdet(dataDet);
    setEditando(true);
  };*/

  /*const eliminarRegistroDetalleItem = async (cod,serie,num,elem,item) => {
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
  }*/

  /*const confirmaEliminacionDet = (cod,serie,num,elem,item)=>{
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
  }*/

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
