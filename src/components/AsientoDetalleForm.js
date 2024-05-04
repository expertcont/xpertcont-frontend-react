import {Grid,Card,Typography,Button,CircularProgress,useMediaQuery,TextField,FormControl,List,ListItem,ListItemText, Dialog, DialogContent, DialogTitle} from '@mui/material'
import React, { useState,useEffect,useRef} from 'react';
import {useNavigate, useParams, useLocation} from 'react-router-dom';
import axios from 'axios';
import Tooltip from '@mui/material/Tooltip';
import swal2 from 'sweetalert2'
//import axios from 'axios';
//import swal from 'sweetalert';
//import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
//import logo from '../alsa.png';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import ListaPopUp from './ListaPopUp';
import IconButton from '@mui/material/IconButton';
import FindIcon from '@mui/icons-material/FindInPage';

export default function AsientoDetalleForm() {
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
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

  const isSmallScreen = useMediaQuery('(max-width: 600px)');
  ////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////
  const [searchText, setSearchText] = useState(''); //Para busqueda en opcion Text(Cuenta, ruc, doc, etc)
  
  const [showModalCuenta, setShowModalCuenta] = useState(false);
  const [showModalCorrentista, setShowModalCorrentista] = useState(false);
  const [showModalTipoDoc, setShowModalTipoDoc] = useState(false);
  const [showModalComprobante, setShowModalComprobante] = useState(false);
  const [showModalComprobanteRef, setShowModalComprobanteRef] = useState(false);
  const [showModalCCosto, setShowModalCCosto] = useState(false);
  const [showModalMedioPago, setShowModalMedioPago] = useState(false);

  const [cuenta,setCuenta] = useState([]);
  const [correntista,setCorrentista] = useState([]);
  const [tipodoc,setTipoDoc] = useState([]);
  const [comprobante,setComprobante] = useState([]);
  const [mediopago,setMedioPago] = useState([]);
  const [ccosto,setCCosto] = useState([]);

  const [registro,setRegistro] = useState({
      //id_anfitrion:'',
      //documento_id:'',
      //periodo:'',
      //id_libro:'',
      //id_invitado:'',

      id_cuenta:'',
      cuenta_descripcion:'',
      r_id_doc:'',
      r_documento_id:'',
      r_razon_social:'',
      r_cod:'',
      r_serie:'',
      r_numero:'',
      r_fecemi:'',
      r_fecvcto:'',
      r_cod_ref:'',
      r_serie_ref:'',
      r_numero_ref:'',
      r_fecemi_ref:'',

      debe_nac:'0',
      haber_nac:'0',
      debe_me:'',
      haber_me:'',                    

      r_moneda:'',
      r_tc:'',

      r_ccosto:'',
      r_id_mediopago:'',
      mediopago:'', //solo lectura
      r_voucher_banco:'',
  
  })
  
  const [cargando,setCargando] = useState(false);
  const [editando,setEditando] = useState(false);
  
  const [clickGuardar,setClickGuardar] = useState(false);

  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();

  ///////////////////////////////////////////////////////////
  //Seccion keyDown Formulario
  const TextFieldRef01 = useRef(null);
  const TextFieldRef02 = useRef(null);
  const TextFieldRef03 = useRef(null);
  const TextFieldRef04 = useRef(null);
  const TextFieldRef05 = useRef(null);
  const TextFieldRef06 = useRef(null);
  const TextFieldRef07 = useRef(null);
  const TextFieldRef08 = useRef(null);
  const TextFieldRef09 = useRef(null);
  const TextFieldRef10 = useRef(null);
  const TextFieldRef11 = useRef(null);
  const TextFieldRef12 = useRef(null);
  const TextFieldRef13 = useRef(null);
  const TextFieldRef14 = useRef(null);
  const TextFieldRef15 = useRef(null);
  const TextFieldRef16 = useRef(null);
  const TextFieldRef17 = useRef(null);
  const TextFieldRef18 = useRef(null);
  const TextFieldRef19 = useRef(null);
  const TextFieldRef20 = useRef(null);
  const TextFieldRef21 = useRef(null);
  const TextFieldRef22 = useRef(null);

  const handleKeyDown = (event, nextRef, prevRef) => {
    switch (event.key) {
      case "+":
        if (event.target.name==='id_cuenta'){setShowModalCuenta(true);}
        if (event.target.name==='r_documento_id'){setShowModalCorrentista(true);}
        if (event.target.name==='r_id_doc'){setShowModalTipoDoc(true);}
        if (event.target.name==='r_cod'){setShowModalComprobante(true);}
        if (event.target.name==='r_cod_ref'){setShowModalComprobanteRef(true);}
        if (event.target.name==='r_id_mediopago'){setShowModalMedioPago(true);}
        if (event.target.name==='r_ccosto'){setShowModalCCosto(true);}
        
        break;
      case "-":
        setShowModalCuenta(false);
        break;
      case "Enter":
        //si tiene contenido, pasa al siguiente, en caso de campo busqueda
        if (event.target.value===""){
          //Solo cuenta contable, obligatorio en cualquier asiento, el resto opcional tecla (+)
          if (event.target.name==='id_cuenta'){
            setShowModalCuenta(true);
          }else{
            nextRef.current.focus();
          }
        }else{
          //handlePopUpSelect(filteredPopUp[0].codigo, filteredPopUp[0].descripcion);
          //console.log(event.target.value);
          nextRef.current.focus();
        }

        break;
      case "ArrowDown":
        if (nextRef.current) {
          nextRef.current.focus();
        }
        break;
      case "ArrowUp":
        if (prevRef.current) {
          prevRef.current.focus();
        }
        break;
      default:
        break;
    }
  };
  /////////////////////////////////////////////////////////
  
  const handleSubmit = async(e) => {
    e.preventDefault();
    setCargando(true);
    var data;

    //Cambiooo para controlar Edicion
    if (editando){
      console.log(`${back_host}/asientodet/${params.id_anfitrion}/${params.documento_id}/${params.periodo}/${params.id_libro}/${params.num_asiento}/${params.item}`);
      console.log(registro);
      await fetch(`${back_host}/asientodet/${params.id_anfitrion}/${params.documento_id}/${params.periodo}/${params.id_libro}/${params.num_asiento}/${params.item}`, {
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
      setRegistro(prevState => ({ ...prevState, num_asiento: params.num_asiento })); //new
      setRegistro(prevState => ({ ...prevState, item: params.item })); //new
      
      setRegistro(prevState => ({ ...prevState, ctrl_crea_us: params.id_invitado }));
      registro.ctrl_crea_us = params.id_invitado;

      console.log(`${back_host}/asientodet`);
      console.log(registro);
      const res = await fetch(`${back_host}/asientodet`, {
        method: "POST",
        body: JSON.stringify(registro),
        headers: {"Content-Type":"application/json"}
      });
      //nuevo
      data = await res.json();
      //Obtener json respuesta, para extraer num_asiento y colocarlo en modo editar ;) viejo truco del guardado y editado posterior
      //navigate(`/asientoc/${params.id_usuario}/${params.id_invitado}/${params.periodo}/${params.documento_id}/${params.id_libro}/${data.num_asiento}/edit`);
      registro.item = data.item;
      setRegistro(prevState => ({ ...prevState, item: data.item }));
      //desactivar boton guardar
      setClickGuardar(true);
    }
    setCargando(false);
    setEditando(true);
  };
  
  //Aqui se leen parametros en caso lleguen
  useEffect( ()=> {
    if (params.item){
        mostrarRegistro(params.id_anfitrion,params.periodo,params.documento_id,params.id_libro,params.num_asiento,params.item);
    }
    //cargar datos generales en asiento
    //fusionar al arreglo registro, el campo id_invitado: 'valor', otro_campo:'valor dif'
    setRegistro(prevState => ({ ...prevState, id_anfitrion: params.id_anfitrion }));
    setRegistro(prevState => ({ ...prevState, periodo: params.periodo }));
    setRegistro(prevState => ({ ...prevState, documento_id: params.documento_id }));
    setRegistro(prevState => ({ ...prevState, id_libro: params.id_libro }));
    setRegistro(prevState => ({ ...prevState, id_invitado: params.id_invitado }));
    setRegistro(prevState => ({ ...prevState, num_asiento: params.num_asiento })); //new

    //console.log('registro final useEffect AsientoCompraForm: ',registro);
    //console.log('params p:', params.num_asiento);
    cargaPopUpCuenta();
    cargaPopUpCorrentista();
    cargaPopUpTipoDoc();
    cargaPopUpComprobante();
    cargaPopUpMedioPago();
    cargaPopUpCCosto();
  },[params.item]);

  //Rico evento change
  const handleChange = (e) => {
    setRegistro({...registro, [e.target.name]: e.target.value});
    //console.log(e.target.name, e.target.value);
  }

  const handleSearchTextChange = (event) => {
    //Change local del textBuscado
    setSearchText(event.target.value.replace('+', '').replace('-',''));
    //actualizamos en el arreglo principal
    setRegistro({...registro, id_cuenta:event.target.value.replace('+', '').replace('-','')});
  };
  

  //funcion para mostrar data de formulario, modo edicion
  const mostrarRegistro = async (id_anfitrion,periodo,documento_id,id_libro,num_asiento,item) => {
    const res = await fetch(`${back_host}/asientodet/${id_anfitrion}/${documento_id}/${periodo}/${id_libro}/${num_asiento}/${item}`);
    const data = await res.json();
    //Actualiza datos para enlace con controles, al momento de modo editar
    setRegistro({  
          id_anfitrion:params.id_anfitrion,
          documento_id:params.documento_id,
          periodo:params.periodo,
          id_libro:params.id_libro,
          num_asiento:params.num_asiento,

          id_cuenta:data.id_cuenta,
          cuenta_descripcion:data.descripcion,
          
          r_doc:data.r_doc,
          r_id_doc:data.r_id_doc,
          r_documento_id:data.r_documento_id,

          r_razon_social:data.r_razon_social,
          r_cod:data.r_cod,
          r_serie:data.r_serie,
          r_numero:data.r_numero,
          r_fecemi:data.r_fecemi2,
          r_fecvcto:data.r_fecvcto2,
          r_cod_ref:data.r_cod_ref,
          r_serie_ref:data.r_serie_ref,
          r_numero_ref:data.r_numero_ref,
          r_fecemi_ref:data.r_fecemi_ref2,

          debe_nac:data.debe_nac,
          haber_nac:data.haber_nac,
          debe_me:data.debe_me,
          haber_me:data.haber_me,           

          r_moneda:data.r_moneda,
          r_tc:data.r_tc,

          r_ccosto:data.r_ccosto,
          r_id_mediopago:data.r_id_mediopago,
          mediopago:data.r_mediopago, //solo lectura
          r_voucher_banco:data.r_voucher_banco,

          });
    console.log("data mostrar registro: ",data);
    setEditando(true);
  };
  
  const cargaPopUpCuenta = () =>{
    //console.log(`${back_host}/cuentassimplepopup/${params.id_anfitrion}/${params.documento_id}/1`);
    axios
    .get(`${back_host}/cuentassimplepopup/${params.id_anfitrion}/${params.documento_id}/1`)
    .then((response) => {
        setCuenta(response.data);
    })
    .catch((error) => {
        console.log(error);
    });
  }
  const cargaPopUpCorrentista = () =>{
    //console.log(`${back_host}/correntistapopup/${params.id_anfitrion}/${params.documento_id}`);
    axios
    .get(`${back_host}/correntistapopup/${params.id_anfitrion}/${params.documento_id}`)
    .then((response) => {
        setCorrentista(response.data);
    })
    .catch((error) => {
        console.log(error);
    });
  }
  const cargaPopUpComprobante = () =>{
    axios
    .get(`${back_host}/comprobantepopup`)
    .then((response) => {
        setComprobante(response.data);
    })
    .catch((error) => {
        console.log(error);
    });
  }
  const cargaPopUpTipoDoc = () =>{
    axios
    .get(`${back_host}/iddoc`)
    .then((response) => {
        setTipoDoc(response.data);
        console.log('tipodoc: ',response.data);
    })
    .catch((error) => {
        console.log(error);
    });
  }

const cargaPopUpMedioPago = () =>{
    axios
    .get(`${back_host}/formapagopopup`)
    .then((response) => {
        setMedioPago(response.data);
    })
    .catch((error) => {
        console.log(error);
    });
  }

  const cargaPopUpCCosto = () =>{
    //console.log('Verificar ccosto: ',`${back_host}/ccosto/${params.id_anfitrion}/${params.documento_id}`);
    axios
    .get(`${back_host}/ccosto/${params.id_anfitrion}/${params.documento_id}`)
    .then((response) => {
        setCCosto(response.data);
    })
    .catch((error) => {
        console.log(error);
    });
  }

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
    <Grid container spacing={0.5} style={{ marginTop: "-5px" }}
      direction={isSmallScreen ? 'column' : 'column'}
      alignItems={isSmallScreen ? 'center' : 'center'}
      justifyContent={isSmallScreen ? 'center' : 'center'}
    >

      <Grid xs={isSmallScreen ? 12 : 5}>
        <Card
            style={{
                background:'#1e272e',
                //width: '210px', // Aquí estableces el ancho
                //height: '420px', // Altura del Card
                marginTop: "5px",
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
              <Grid item xs={12} >
                <Typography variant='h6' color='skyblue' textAlign='center'>
                    {(editando) ? 
                    (
                      "Editar Cta: " + (params.num_asiento || registro.num_asiento ) + " "
                    ) : 
                    (
                      "Registrar Cta: " + (params.num_asiento || registro.num_asiento ) + " "
                    )}
                </Typography>
              </Grid>
              <Grid item xs={isSmallScreen ? 4 : 3} >
                <TextField variant="outlined" 
                        label="CTA"
                        placeholder="CTA"
                        sx={{ display:'block',
                                margin:'.5rem 0',
                            }}
                        name="id_cuenta"
                        size='small'
                        fullWidth
                        //value={registro.r_numero} 
                        value={registro.id_cuenta} //Para todos los campos con Busqueda
                        onChange={handleSearchTextChange} //Change Personalizado para Busqueda
                        inputRef={TextFieldRef01}
                        onKeyDown={(event) => handleKeyDown(event, TextFieldRef02)}
                        inputProps={{ style:{color:'white'} }}
                        InputLabelProps={{ style:{color:'skyblue'} }}
                        InputProps={{ // Estilos para el contenedor del input
                          endAdornment: (
                            <IconButton 
                              color="warning" 
                              aria-label="upload picture" 
                              component="label" 
                              size="small"
                              sx={{
                                position: 'absolute', // Posicionamiento absoluto para el IconButton
                                top: '50%', // Centrar verticalmente
                                right: 0, // Alinear a la derecha
                                transform: 'translateY(-50%)', // Centrar verticalmente
                              }}
                              onClick={() => {
                                // Acción al hacer clic en el IconButton
                                setShowModalCuenta(true);
                              }}
                            >
                              <FindIcon />
                            </IconButton>
                          ),
                        }}                                
                />
                      <ListaPopUp
                          registroPopUp={cuenta}
                          showModal={showModalCuenta}
                          setShowModal={setShowModalCuenta}
                          registro={registro}                    
                          setRegistro={setRegistro}                    
                          idCodigoKey="id_cuenta"
                          descripcionKey="cuenta_descripcion"
                      />
              </Grid>
              <Grid item xs={isSmallScreen ? 3.5 : 3} >
                <TextField variant="outlined" 
                                  placeholder="CCOST"
                                  sx={{ display:'block',
                                          margin:'.5rem 0',
                                      }}
                                  name="r_ccosto"
                                  size='small'
                                  fullWidth
                                  value={registro.r_ccosto} 
                                  onChange={handleChange}
                                  inputRef={TextFieldRef02}
                                  onKeyDown={(event) => handleKeyDown(event, TextFieldRef03,TextFieldRef01)}
                                  inputProps={{ style:{color:'white'} }}
                                  InputLabelProps={{ style:{color:'skyblue'} }}
                                  InputProps={{ // Estilos para el contenedor del input
                                    endAdornment: (
                                      <IconButton 
                                        color="default" 
                                        aria-label="upload picture" 
                                        component="label" 
                                        size="small"
                                        sx={{
                                          position: 'absolute', // Posicionamiento absoluto para el IconButton
                                          top: '50%', // Centrar verticalmente
                                          right: 0, // Alinear a la derecha
                                          transform: 'translateY(-50%)', // Centrar verticalmente
                                        }}
                                        onClick={() => {
                                          // Acción al hacer clic en el IconButton
                                          setShowModalCCosto(true);
                                        }}
                                      >
                                        <FindIcon />
                                      </IconButton>
                                    ),
                                  }}                                
                />
                    {/* Seccion para mostrar Dialog tipo Modal, para busqueda incremental registro-cuenta */}
                    <ListaPopUp
                        registroPopUp={ccosto}
                        showModal={showModalCCosto}
                        setShowModal={setShowModalCCosto}
                        registro={registro}                    
                        setRegistro={setRegistro}                    
                        idCodigoKey="r_ccosto"
                        descripcionKey="r_ccosto"
                    />
                    {/* FIN Seccion para mostrar Dialog tipo Modal */}
              </Grid>
              <Grid item xs={isSmallScreen ? 4.5 : 6} >
                  <Typography variant='inherit' 
                              color='white' 
                              textAlign='center'
                              sx={{ 
                                overflow: 'hidden', // Ocultar el texto que se desborda
                                textOverflow: 'ellipsis', // Agregar puntos suspensivos
                                whiteSpace: 'nowrap', // Evitar que el texto se rompa en múltiples líneas
                              }}                              
                  >
                    {registro.cuenta_descripcion} 
                  </Typography>
              </Grid>
            </Grid>

            <Grid container spacing={0.5} style={{ marginTop: "-5px" }}
                direction={isSmallScreen ? 'row' : 'row'}
                alignItems={isSmallScreen ? 'center' : 'center'}
                justifyContent={isSmallScreen ? 'center' : 'center'}
            >
                <Grid item xs={4.8} >
                  <TextField variant="outlined" 
                          //label="DEBE"
                          placeholder="DEBE"
                          sx={{ display:'block',
                                  margin:'.5rem 0',
                              }}
                          name="debe_nac"
                          size='small'
                          fullWidth
                          value={registro.debe_nac} 
                          onChange={handleChange}
                          onKeyPress={(event) => {
                            const numericRegex = /^[0-9]*$/
                            if (!numericRegex.test(event.key)) {
                                event.preventDefault();
                            }
                          }}
                          inputRef={TextFieldRef03}
                          onKeyDown={(event) => handleKeyDown(event, TextFieldRef04,TextFieldRef02)}
                          inputProps={{ style:{color:'white'} }}
                          InputLabelProps={{ style:{color:'skyblue'} }}
                          InputProps={{ // Estilos para el contenedor del input
                            endAdornment: (
                              <IconButton 
                                color="info" 
                                aria-label="upload picture" 
                                component="label" 
                                size="small"
                                sx={{
                                  position: 'absolute', // Posicionamiento absoluto para el IconButton
                                  top: '50%', // Centrar verticalmente
                                  right: 0, // Alinear a la derecha
                                  transform: 'translateY(-50%)', // Centrar verticalmente
                                }}
                              >
                              <Typography variant="caption" sx={{ fontSize: '0.85rem' }}>DEBE</Typography>
                              </IconButton>
                            ),
                          }}                                
                    />
                </Grid>
                <Grid item xs={4.8} >
                  <TextField variant="outlined" 
                          //label="HABER"
                          placeholder="HABER"
                          sx={{ display:'block',
                                  margin:'.5rem 0',
                              }}
                          name="haber_nac"
                          size='small'
                          fullWidth
                          value={registro.haber_nac} 
                          onChange={handleChange}
                          inputRef={TextFieldRef04}
                          onKeyDown={(event) => handleKeyDown(event, TextFieldRef05,TextFieldRef03)}
                          inputProps={{ style:{color:'white'} }}
                          InputLabelProps={{ style:{color:'skyblue'} }}
                          InputProps={{ // Estilos para el contenedor del input
                            endAdornment: (
                              <IconButton 
                                color="info" 
                                aria-label="upload picture" 
                                component="label" 
                                size="small"
                                sx={{
                                  position: 'absolute', // Posicionamiento absoluto para el IconButton
                                  top: '50%', // Centrar verticalmente
                                  right: 0, // Alinear a la derecha
                                  transform: 'translateY(-50%)', // Centrar verticalmente
                                }}
                              >
                                <Typography variant="caption" sx={{ fontSize: '0.85rem' }}>HABER</Typography>
                              </IconButton>
                            ),
                          }}                                
                  />
                </Grid>
                <Grid item xs={2.4} >

                </Grid>
            </Grid>

            <Grid container spacing={0.5} style={{ marginTop: "-5px" }}
                direction={isSmallScreen ? 'row' : 'row'}
                alignItems={isSmallScreen ? 'center' : 'center'}
                justifyContent={isSmallScreen ? 'center' : 'center'}
            >
                <Grid item xs={4.8} >
                  <TextField variant="outlined" 
                          //label="DEBE"
                          placeholder="DEBE"
                          sx={{ display:'block',
                                  margin:'.5rem 0',
                              }}
                          name="debe_me"
                          size='small'
                          fullWidth
                          value={registro.debe_me} 
                          onChange={handleChange}
                          onKeyPress={(event) => {
                            const numericRegex = /^[0-9]*$/
                            if (!numericRegex.test(event.key)) {
                                event.preventDefault();
                            }
                          }}
                          inputRef={TextFieldRef05}
                          onKeyDown={(event) => handleKeyDown(event, TextFieldRef06,TextFieldRef04)}
                          inputProps={{ style:{color:'white'} }}
                          InputLabelProps={{ style:{color:'skyblue'} }}
                          InputProps={{ // Estilos para el contenedor del input
                            endAdornment: (
                              <IconButton 
                                color="success" 
                                aria-label="upload picture" 
                                component="label" 
                                size="small"
                                sx={{
                                  position: 'absolute', // Posicionamiento absoluto para el IconButton
                                  top: '50%', // Centrar verticalmente
                                  right: 0, // Alinear a la derecha
                                  transform: 'translateY(-50%)', // Centrar verticalmente
                                }}
                              >
                                <Typography variant="caption" sx={{ fontSize: '0.85rem' }}>USD</Typography>
                              </IconButton>
                            ),
                          }}                                
                  />
                </Grid>
                <Grid item xs={4.8} >
                  <TextField variant="outlined" 
                          //label="HABER"
                          placeholder="HABER"
                          sx={{ display:'block',
                                  margin:'.5rem 0',
                              }}
                          name="haber_me"
                          size='small'
                          fullWidth
                          value={registro.haber_me} 
                          onChange={handleChange}
                          inputRef={TextFieldRef06}
                          onKeyDown={(event) => handleKeyDown(event, TextFieldRef07,TextFieldRef05)}
                          inputProps={{ style:{color:'white'} }}
                          InputLabelProps={{ style:{color:'skyblue'} }}
                          InputProps={{ // Estilos para el contenedor del input
                            endAdornment: (
                              <IconButton 
                                color="success" 
                                aria-label="upload picture" 
                                component="label" 
                                size="small"
                                sx={{
                                  position: 'absolute', // Posicionamiento absoluto para el IconButton
                                  top: '50%', // Centrar verticalmente
                                  right: 0, // Alinear a la derecha
                                  transform: 'translateY(-50%)', // Centrar verticalmente
                                }}
                              >
                                <Typography variant="caption" sx={{ fontSize: '0.85rem' }}>USD</Typography>
                              </IconButton>
                            ),
                          }}                                
                  />
                </Grid>
                <Grid item xs={2.4} >
                  <TextField variant="outlined" 
                          //label="USD"
                          placeholder="T.C"
                          sx={{ display:'block',
                                  margin:'.5rem 0',
                              }}
                          name="r_tc"
                          size='small'
                          fullWidth
                          value={registro.r_tc}
                          onChange={handleChange}
                          inputRef={TextFieldRef07}
                          onKeyDown={(event) => handleKeyDown(event, TextFieldRef08,TextFieldRef06)}
                          inputProps={{ style:{color:'green'} }}
                          InputLabelProps={{ style:{color:'skyblue'} }}
                  />
                </Grid>
            </Grid>

            <Grid container spacing={0.5} style={{ marginTop: "-5px" }}
                direction={isSmallScreen ? 'row' : 'row'}
                alignItems={isSmallScreen ? 'center' : 'center'}
                justifyContent={isSmallScreen ? 'center' : 'center'}
            >
                <Grid item xs={6} >
                    <TextField variant="outlined" 
                        //label="RUC/DNI"
                        placeholder="RUC/DNI"
                        sx={{ display:'block',
                                margin:'.5rem 0',
                            }}
                        name="r_documento_id"
                        size='small'
                        fullWidth
                        value={registro.r_documento_id} 
                        onChange={handleChange}
                        inputRef={TextFieldRef08}
                        onKeyDown={(event) => handleKeyDown(event, TextFieldRef09,TextFieldRef07)}
                        inputProps={{ style:{color:'white'} }}
                        InputLabelProps={{ style:{color:'skyblue'} }}
                        InputProps={{ // Estilos para el contenedor del input
                          endAdornment: (
                            <IconButton 
                              color="default" 
                              aria-label="upload picture" 
                              component="label" 
                              size="small"
                              sx={{
                                position: 'absolute', // Posicionamiento absoluto para el IconButton
                                top: '50%', // Centrar verticalmente
                                right: 0, // Alinear a la derecha
                                transform: 'translateY(-50%)', // Centrar verticalmente
                              }}
                              onClick={() => {
                                // Acción al hacer clic en el IconButton
                                setShowModalCorrentista(true);
                              }}
                            >
                              <FindIcon />
                            </IconButton>
                          ),
                        }}                                
                    />
                    <ListaPopUp
                        registroPopUp={correntista}
                        showModal={showModalCorrentista}
                        setShowModal={setShowModalCorrentista}
                        registro={registro}
                        setRegistro={setRegistro}                    
                        idCodigoKey="r_documento_id"
                        descripcionKey="r_razon_social"
                        auxiliarKey="r_id_doc"
                    />
                </Grid>

                <Grid item xs={isSmallScreen ? 3 : 2} >
                    <TextField variant="outlined" 
                        //label=""
                        placeholder="TIPO"
                        sx={{ display:'block',
                                margin:'.5rem 0',
                            }}
                        name="r_id_doc"
                        size='small'
                        fullWidth
                        value={registro.r_id_doc} 
                        onChange={handleChange}
                        inputRef={TextFieldRef09}
                        onKeyDown={(event) => handleKeyDown(event, TextFieldRef10,TextFieldRef08)}
                        inputProps={{ style:{color:'white'} }}
                        InputLabelProps={{ style:{color:'skyblue'} }}
                        InputProps={{ // Estilos para el contenedor del input
                          endAdornment: (
                            <IconButton 
                              color="default" 
                              aria-label="upload picture" 
                              component="label" 
                              size="small"
                              sx={{
                                position: 'absolute', // Posicionamiento absoluto para el IconButton
                                top: '50%', // Centrar verticalmente
                                right: 0, // Alinear a la derecha
                                transform: 'translateY(-50%)', // Centrar verticalmente
                              }}
                              onClick={() => {
                                // Acción al hacer clic en el IconButton
                                setShowModalTipoDoc(true);
                              }}
                            >
                              <FindIcon />
                            </IconButton>
                          ),
                        }}                                
                    />
                        <ListaPopUp
                            registroPopUp={tipodoc}
                            showModal={showModalTipoDoc}
                            setShowModal={setShowModalTipoDoc}
                            registro={registro}
                            setRegistro={setRegistro}                    
                            idCodigoKey="r_id_doc"
                            descripcionKey="r_doc"
                            auxiliarKey=""
                        />
                </Grid>
                <Grid xs={isSmallScreen ? 3 : 4}>
                  <Typography variant='inherit' 
                              color='white' 
                              textAlign='center'
                              sx={{ 
                                overflow: 'hidden', // Ocultar el texto que se desborda
                                textOverflow: 'ellipsis', // Agregar puntos suspensivos
                                whiteSpace: 'nowrap', // Evitar que el texto se rompa en múltiples líneas
                              }}                              
                  >
                        {registro.r_doc}
                  </Typography>
                </Grid>

            </Grid>

            <TextField variant="outlined" 
                    //label="RAZON SOCIAL"
                    placeholder="RAZON SOCIAL"
                    sx={{ display:'block',
                            margin:'.5rem 0',
                        }}
                    name="r_razon_social"
                    size='small'
                    fullWidth
                    value={registro.r_razon_social} 
                    onChange={handleChange}
                    inputRef={TextFieldRef10}
                    onKeyDown={(event) => handleKeyDown(event, TextFieldRef11,TextFieldRef09)}
                    inputProps={{ style:{color:'white'} }}
                    InputLabelProps={{ style:{color:'skyblue'} }}
            />


            <Grid item xs={isSmallScreen ? 12 : 12} >
                <Grid container spacing={0.5} style={{ marginTop: "-5px" }}
                          direction={isSmallScreen ? 'row' : 'row'}
                          alignItems={isSmallScreen ? 'center' : 'center'}
                          justifyContent={isSmallScreen ? 'center' : 'center'}
                >
                      <Grid item xs={isSmallScreen ? 3.5 : 2.5} >
                        <TextField variant="outlined"
                                label="COD"
                                sx={{ display:'block',
                                        margin:'.5rem 0',
                                    }}
                                name="r_cod"
                                size='small'
                                fullWidth
                                value={registro.r_cod} 
                                onChange={handleChange}
                                inputRef={TextFieldRef11}
                                onKeyDown={(event) => handleKeyDown(event, TextFieldRef12,TextFieldRef10)}
                                inputProps={{ style:{color:'white'} }}
                                InputLabelProps={{ style:{color:'skyblue'} }}
                                InputProps={{ // Estilos para el contenedor del input
                                  endAdornment: (
                                    <IconButton 
                                      color="default" 
                                      aria-label="upload picture" 
                                      component="label" 
                                      size="small"
                                      sx={{
                                        position: 'absolute', // Posicionamiento absoluto para el IconButton
                                        top: '50%', // Centrar verticalmente
                                        right: 0, // Alinear a la derecha
                                        transform: 'translateY(-50%)', // Centrar verticalmente
                                      }}
                                      onClick={() => {
                                        // Acción al hacer clic en el IconButton
                                        setShowModalComprobante(true);
                                      }}
                                    >
                                      <FindIcon />
                                    </IconButton>
                                  ),
                                }}                                
                        />
                            <ListaPopUp
                                registroPopUp={comprobante}
                                showModal={showModalComprobante}
                                setShowModal={setShowModalComprobante}
                                registro={registro}
                                setRegistro={setRegistro}
                                idCodigoKey="r_cod"
                                descripcionKey=""
                                auxiliarKey=""
                            />
                      </Grid>

                      <Grid item xs={isSmallScreen ? 3.5 : 3} >
                        <TextField variant="outlined"
                                label="SERIE"
                                sx={{ display:'block',
                                        margin:'.5rem 0',
                                    }}
                                name="r_serie"
                                size='small'
                                fullWidth
                                value={registro.r_serie} 
                                onChange={handleChange}
                                inputRef={TextFieldRef12}
                                onKeyDown={(event) => handleKeyDown(event, TextFieldRef13,TextFieldRef11)}
                                inputProps={{ style:{color:'white'} }}
                                InputLabelProps={{ style:{color:'skyblue'} }}
                        />
                      </Grid>
                      <Grid item xs={isSmallScreen ? 5 : 6.5} >
                        <TextField variant="outlined" 
                                //label="NUMERO"
                                placeholder="NUMERO"
                                sx={{ display:'block',
                                        margin:'.5rem 0',
                                    }}
                                name="r_numero"
                                size='small'
                                fullWidth
                                value={registro.r_numero} 
                                onChange={handleChange}
                                inputRef={TextFieldRef13}
                                onKeyDown={(event) => handleKeyDown(event, TextFieldRef14,TextFieldRef12)}
                                inputProps={{ style:{color:'white'} }}
                                InputLabelProps={{ style:{color:'skyblue'} }}
                        />
                      </Grid>
                </Grid>
            </Grid>


            <Grid container spacing={0.5} style={{ marginTop: "-5px" }}
              direction={isSmallScreen ? 'row' : 'row'}
              alignItems={isSmallScreen ? 'center' : 'center'}
              justifyContent={isSmallScreen ? 'center' : 'center'}
            >
              <Grid item xs={6} >
                  <TextField variant="outlined" 
                              label="FECMI"
                              //placeholder="FECMI"
                              sx={{display:'block',
                                  margin:'.5rem 0'}}
                              name="r_fecemi"
                              size='small'
                              fullWidth
                              type="date"
                              value={registro.r_fecemi} 
                              onChange={handleChange}
                              inputRef={TextFieldRef14}
                              onKeyDown={(event) => handleKeyDown(event, TextFieldRef15,TextFieldRef12)}
                              inputProps={{ style:{color:'white', textAlign: 'right'} }}
                              InputLabelProps={{ style:{color:'skyblue'} }}
                  />
              </Grid>
              <Grid item xs={6} >
                  <TextField variant="outlined" 
                          label="VCTO"
                          //placeholder="VCTO"
                          sx={{display:'block',
                              margin:'.5rem 0'}}
                          name="r_fecvcto"
                          size='small'
                          fullWidth
                          type="date"
                          //format="yyyy/MM/dd"
                          value={registro.r_fecvcto} 
                          onChange={handleChange}
                          inputRef={TextFieldRef15}
                          onKeyDown={(event) => handleKeyDown(event, TextFieldRef16,TextFieldRef14)}
                          inputProps={{ style:{color:'white',textAlign: 'right'} }}
                          InputLabelProps={{ style:{color:'skyblue'} }}
                  />
              </Grid>
            </Grid>

                
            <ThemeProvider theme={theme}>
            <Grid container spacing={0.5} style={{ marginTop: "-5px" }}
                direction={isSmallScreen ? 'row' : 'row'}
                alignItems={isSmallScreen ? 'center' : 'center'}
                justifyContent={isSmallScreen ? 'center' : 'center'}
            >
                <Grid item xs={3} >
                    <TextField variant="outlined" 
                            label="COD"
                            sx={{ display:'block',
                                    margin:'.5rem 0',
                                }}
                            name="r_cod_ref"
                            size='small'
                            fullWidth
                            value={registro.r_cod_ref} 
                            onChange={handleChange}
                            inputRef={TextFieldRef16}
                            onKeyDown={(event) => handleKeyDown(event, TextFieldRef17,TextFieldRef15)}
                            inputProps={{ style:{color:'white'} }}
                            InputLabelProps={{ style:{color:'skyblue'} }}
                    />
                            <ListaPopUp
                                registroPopUp={comprobante}
                                showModal={showModalComprobanteRef}
                                setShowModal={setShowModalComprobanteRef}
                                registro={registro}
                                setRegistro={setRegistro}
                                idCodigoKey="r_cod_ref"
                                descripcionKey=""
                                auxiliarKey=""
                            />
                </Grid>
                <Grid item xs={3.3} >
                    <TextField variant="outlined" 
                            label="SERIE"
                            sx={{ display:'block',
                                margin:'.5rem 0',
                                }}
                            name="r_serie_ref"
                            size='small'
                            fullWidth
                            value={registro.r_serie_ref} 
                            onChange={handleChange}
                            inputRef={TextFieldRef17}
                            onKeyDown={(event) => handleKeyDown(event, TextFieldRef18,TextFieldRef16)}
                            inputProps={{ style:{color:'white'} }}
                            InputLabelProps={{ style:{color:'skyblue'} }}
                    />
                </Grid>
                <Grid item xs={5.7} >
                    <TextField variant="outlined" 
                            label="NUM REF"
                            sx={{ display:'block',
                                    margin:'.5rem 0',
                                }}
                            name="r_numero_ref"
                            size='small'
                            fullWidth
                            value={registro.r_numero_ref} 
                            onChange={handleChange}
                            inputRef={TextFieldRef18}
                            onKeyDown={(event) => handleKeyDown(event, TextFieldRef19,TextFieldRef17)}
                            inputProps={{ style:{color:'white'} }}
                            InputLabelProps={{ style:{color:'skyblue'} }}
                    />
                </Grid>
            </Grid>
            <TextField variant="outlined" 
                    //label="EMI Ref."
                    sx={{display:'block',
                            margin:'.5rem 0'}}
                    name="r_fecemi_ref"
                    size='small'
                    fullWidth
                    type="date"
                    //format="yyyy/MM/dd"
                    value={registro.r_fecemi_ref} 
                    onChange={handleChange}
                    inputRef={TextFieldRef19}
                    onKeyDown={(event) => handleKeyDown(event, TextFieldRef20,TextFieldRef18)}
                    inputProps={{ style:{color:'white',textAlign: 'center'} }}
                    InputLabelProps={{ style:{color:'skyblue'} }}
            />
            </ThemeProvider>


            <Grid container spacing={0.5} style={{ marginTop: "-5px" }}
              direction={isSmallScreen ? 'row' : 'row'}
              alignItems={isSmallScreen ? 'center' : 'center'}
              justifyContent={isSmallScreen ? 'center' : 'center'}
            >
              <Grid item xs={isSmallScreen ? 4 : 3} >
                  <TextField variant="outlined" 
                          //label="MEDIO"
                          placeholder="M.PAGO"
                          sx={{ display:'block',
                                  margin:'.5rem 0',
                              }}
                          name="r_id_mediopago"
                          size='small'
                          fullWidth
                          value={registro.r_id_mediopago} 
                          onChange={handleChange}
                          inputRef={TextFieldRef20}
                          onKeyDown={(event) => handleKeyDown(event, TextFieldRef21,TextFieldRef19)}
                          inputProps={{ style:{color:'white'} }}
                          InputLabelProps={{ style:{color:'skyblue'} }}
                          InputProps={{ // Estilos para el contenedor del input
                            endAdornment: (
                              <IconButton 
                                color="default" 
                                aria-label="upload picture" 
                                component="label" 
                                size="small"
                                sx={{
                                  position: 'absolute', // Posicionamiento absoluto para el IconButton
                                  top: '50%', // Centrar verticalmente
                                  right: 0, // Alinear a la derecha
                                  transform: 'translateY(-50%)', // Centrar verticalmente
                                }}
                                onClick={() => {
                                  // Acción al hacer clic en el IconButton
                                  setShowModalMedioPago(true);
                                }}
                              >
                                <FindIcon />
                              </IconButton>
                            ),
                          }}                                
                  />
                        <ListaPopUp
                            registroPopUp={mediopago}
                            showModal={showModalMedioPago}
                            setShowModal={setShowModalMedioPago}
                            registro={registro}
                            setRegistro={setRegistro}                    
                            idCodigoKey="r_id_mediopago"
                            descripcionKey="r_mediopago"
                            auxiliarKey=""
                        />
              </Grid>
              <Grid item xs={isSmallScreen ? 8 : 9} >
                  <TextField variant="outlined" 
                          //label="DESCRIPCION PAGO"
                          placeholder="F. MEDIO DE PAGO"
                          sx={{ display:'block',
                                  margin:'.5rem 0',
                              }}
                          name="r_mediopago"
                          size='small'
                          fullWidth
                          value={registro.r_mediopago} 
                          onChange={handleChange}
                          inputRef={TextFieldRef21}
                          onKeyDown={(event) => handleKeyDown(event, TextFieldRef22,TextFieldRef20)}
                          inputProps={{ style:{color:'white'} }}
                          InputLabelProps={{ style:{color:'skyblue'} }}
                  />
              </Grid>
            </Grid>

            <TextField variant="outlined" 
                      //label="VOUCHER"
                      placeholder="F. VOUCHER BANCARIO"
                      sx={{ display:'block',
                              margin:'.5rem 0',
                          }}
                      name="r_voucher_banco"
                      size='small'
                      fullWidth
                      value={registro.r_voucher_banco} 
                      onChange={handleChange}
                      inputRef={TextFieldRef22}
                      onKeyDown={(event) => handleKeyDown(event,null,TextFieldRef21)}
                      inputProps={{ style:{color:'white'} }}
                      InputLabelProps={{ style:{color:'skyblue'} }}
            />

        </Card>

      </Grid>

    </Grid>
    
    <form onSubmit={handleSubmit} >

    
          <Grid container spacing={0.5} style={{ marginTop: "-5px" }}
            direction={isSmallScreen ? 'row' : 'row'}
            alignItems={isSmallScreen ? 'center' : 'center'}
            justifyContent={isSmallScreen ? 'center' : 'center'}
            >
                <Grid item xs={isSmallScreen ? 4 : 2} >
                    <Button variant='contained' 
                            color='primary' 
                            type='submit'
                            sx={{display:'block',
                            margin:'.5rem 0'}}
                            disabled={
                                      !registro.id_cuenta || 
                                      !registro.cuenta_descripcion ||
                                      !registro.debe_nac ||
                                      !registro.haber_nac ||
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

                <Grid item xs={isSmallScreen ? 4 : 2} >
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

          </Grid>
    


    </form>
      {/* /////////////////////////////////////////////////////////////// */}
      
  </div>    
  );
}
