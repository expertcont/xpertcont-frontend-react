import {Grid,Card,Typography,Button,CircularProgress,useMediaQuery} from '@mui/material'
import React, { useState,useEffect} from 'react';
import {useNavigate, useParams, useLocation} from 'react-router-dom';
import swal2 from 'sweetalert2'
//import axios from 'axios';
//import swal from 'sweetalert';
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
      mayorizado:'0',
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
  const [clonando,setClonando] = useState(false);
  const [clickGuardar,setClickGuardar] = useState(false);

  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();

  const handleSubmit = async(e) => {
    e.preventDefault();
    setCargando(true);
    var data;
    const clonarTermino = location.pathname.includes('clonar');

    //Cambiooo para controlar Edicion
    if (editando && !clonarTermino){
      console.log(`${back_host}/asiento/${params.id_anfitrion}/${params.documento_id}/${params.periodo}/${params.id_libro}/${params.num_asiento}`);
      console.log(registro);
      await fetch(`${back_host}/asiento/${params.id_anfitrion}/${params.documento_id}/${params.periodo}/${params.id_libro}/${params.num_asiento}`, {
        method: "PUT",
        body: JSON.stringify(registro),
        headers: {"Content-Type":"application/json"}
      });
      setCargando(false);
      //Obtener json respuesta, para extraer num_asiento y colocarlo en modo editar ;) viejo truco del guardado y editado posterior
      //navigate(`/asientoc/${params.id_usuario}/${params.id_invitado}/${params.periodo}/${params.documento_id}/${params.id_libro}/${params.num_asiento}/edit`);
      //desactivar boton guardar
      setClickGuardar(true);
    }else{
      setRegistro(prevState => ({ ...prevState, id_anfitrion: params.id_anfitrion }));
      setRegistro(prevState => ({ ...prevState, periodo: params.periodo }));
      setRegistro(prevState => ({ ...prevState, documento_id: params.documento_id }));
      setRegistro(prevState => ({ ...prevState, id_libro: params.id_libro }));
      setRegistro(prevState => ({ ...prevState, id_invitado: params.id_invitado }));
      
      setRegistro(prevState => ({ ...prevState, ctrl_crea_us: params.id_invitado }));
      registro.ctrl_crea_us = params.id_invitado;

      console.log(`${back_host}/asiento`);
      console.log(registro);
      const res = await fetch(`${back_host}/asiento`, {
        method: "POST",
        body: JSON.stringify(registro),
        headers: {"Content-Type":"application/json"}
      });
      //nuevo
      data = await res.json();
      //Obtener json respuesta, para extraer num_asiento y colocarlo en modo editar ;) viejo truco del guardado y editado posterior
      //navigate(`/asientoc/${params.id_usuario}/${params.id_invitado}/${params.periodo}/${params.documento_id}/${params.id_libro}/${data.num_asiento}/edit`);
      registro.num_asiento = data.num_asiento;
      setRegistro(prevState => ({ ...prevState, num_asiento: data.num_asiento }));
      //desactivar boton guardar
      setClickGuardar(true);
    }
    setCargando(false);
    setEditando(true);
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
    console.log(newFormData);
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
    //Habilitar clonando con consulta de parte del pathname
    setClonando(location.pathname.includes('clonar'));
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
              {(editando && !clonando) ? (
                "Editar Asiento : " + (params.num_asiento || registro.num_asiento ) + " "
              ) : (
                clonando ? (
                  "Clonar Asiento : " + (params.num_asiento || registro.num_asiento ) + " "
                ) : (
                  "Libro Compras"
                )
              )}
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
        direction={isSmallScreen ? 'row' : 'row'}
        alignItems={isSmallScreen ? 'center' : 'center'}
        justifyContent={isSmallScreen ? 'center' : 'center'}
      >
          <Grid item xs={isSmallScreen ? 5 : 3} >
              <AsientoComprobante formData={registro} isSmallScreen={isSmallScreen} onFormDataChange={handleChange}>
              </AsientoComprobante>
          </Grid>

          <Grid item xs={isSmallScreen ? 4 : 2} >
            <AsientoCompraImportacion formData={registro} isSmallScreen={isSmallScreen} onFormDataChange={handleChange}>
            </AsientoCompraImportacion>
          </Grid>

          <Grid item xs={isSmallScreen ? 9 : 4} >
            <AsientoCompraMontos formData={registro} isSmallScreen={isSmallScreen} onFormDataChange={handleChange}>
            </AsientoCompraMontos>
          </Grid>

      </Grid>

    
    <Grid container spacing={0.5} style={{ marginTop: "0px" }}
      direction={isSmallScreen ? 'column' : 'row'}
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
          <Grid container spacing={0.5} style={{ marginTop: "-5px" }}
            direction={isSmallScreen ? 'row' : 'row'}
            alignItems={isSmallScreen ? 'center' : 'center'}
            justifyContent={isSmallScreen ? 'center' : 'center'}
            >
                <Grid item xs={isSmallScreen ? 4 : 1.5} >
                    <Button variant='contained' 
                            color='primary' 
                            type='submit'
                            sx={{display:'block',
                            margin:'.5rem 0'}}
                            disabled={
                                      !registro.r_documento_id || 
                                      !registro.r_razon_social || 
                                      !registro.r_monto_total ||
                                      clickGuardar
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

                <Grid item xs={isSmallScreen ? 4 : 1.6} >
                    <Button variant='contained' 
                            color='warning' 
                            sx={{display:'block',
                            margin:'.5rem 0'}}
                            onClick={ ()=>{
                              navigate(-1, { replace: true });
                              //window.location.reload();
                              }
                            }
                            >
                        Anterior
                    </Button>
                </Grid>

                <Grid item xs={isSmallScreen ? 4 : 2} >
                    <Button variant='contained' 
                            color='secondary' 
                            sx={{display:'block',
                            margin:'.5rem 0'}}
                            onClick={() => {
                              swal2.fire({
                                text: "Funcionalidad en diseño pendiente",
                              });
                              }
                            }
      
                            >
                        Cuentas
                    </Button>
                </Grid>

          </Grid>
        </Card>
      </Grid>
      
    </Grid>


    </form>
      {/* /////////////////////////////////////////////////////////////// */}
      
  </div>    
  );
}
