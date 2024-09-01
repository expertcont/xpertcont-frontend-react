import {Grid,Card,Typography,TextField,Button,CircularProgress,useMediaQuery} from '@mui/material'
import React, { useState,useEffect} from 'react';
import {useNavigate, useParams, useLocation} from 'react-router-dom';
import swal2 from 'sweetalert2'
//import axios from 'axios';
//import swal from 'sweetalert';
//

export default function AsientoGenericoForm() {
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

      glosa:'',
      mayorizado:'0',
      fecha_asiento:'',
      
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
      //console.log(`${back_host}/asiento/${params.id_anfitrion}/${params.documento_id}/${params.periodo}/${params.id_libro}/${params.num_asiento}`);
      //console.log(registro);
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
      
      registro.id_anfitrion = params.id_invitado;
      registro.periodo = params.id_invitado;
      registro.documento_id = params.id_invitado;
      registro.id_libro = params.id_invitado;
      registro.id_invitado = params.id_invitado;
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
    console.log('registro final useEffect editar: ',registro);

  },[params.num_asiento]);

  useEffect( ()=> {
    //cargar datos generales en asiento
    //fusionar al arreglo registro, el campo id_invitado: 'valor', otro_campo:'valor dif'
    setRegistro(prevState => ({ ...prevState, id_anfitrion: params.id_anfitrion }));
    setRegistro(prevState => ({ ...prevState, periodo: params.periodo }));
    setRegistro(prevState => ({ ...prevState, documento_id: params.documento_id }));
    setRegistro(prevState => ({ ...prevState, id_libro: params.id_libro }));
    setRegistro(prevState => ({ ...prevState, id_invitado: params.id_invitado }));

    console.log('registro final useEffect AsientoCompraForm: ',registro);
    
  },[]);

  //Rico evento change
  const handleChange = e => {
    console.log(e.target.name, e.target.value);
    const inputValue = e.target.value;
    const valorEnMayusculas = inputValue.toUpperCase();
    setRegistro({...registro, [e.target.name]: valorEnMayusculas});
  }

  //funcion para mostrar data de formulario, modo edicion
  const mostrarRegistro = async (id_anfitrion,periodo,documento_id,id_libro,num_asiento) => {
    console.log(`${back_host}/asiento/todos/${id_anfitrion}/${documento_id}/${periodo}/${id_libro}/${num_asiento}`);
    const res = await fetch(`${back_host}/asiento/todos/${id_anfitrion}/${documento_id}/${periodo}/${id_libro}/${num_asiento}`);
    const data = await res.json();
    //Actualiza datos para enlace con controles, al momento de modo editar
    setRegistro({  
          id_anfitrion:params.id_anfitrion,
          documento_id:params.documento_id,
          periodo:params.periodo,
          id_libro:params.id_libro,
          num_asiento:num_asiento,

          fecha_asiento:data.fecha_asiento,
          glosa:data.glosa,

          });
    console.log("data mostrar registro: ",data);
    setEditando(true);
    //Habilitar clonando con consulta de parte del pathname
    setClonando(location.pathname.includes('clonar'));
  };
  
  
  
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
                clonando ? 
                (
                  "Clonar Asiento : " + (params.num_asiento || registro.num_asiento ) + " "
                ) 
                : 
                (
                  params.id_libro==='005' ?
                  "Asiento Nuevo: Diario"
                  :
                  "Asiento Nuevo: Caja"
                )
              )}
          </Typography>

          <TextField variant="outlined" 
                            label="FECHA"
                            sx={{display:'block',
                                margin:'.5rem 0'}}
                            name="fecha_asiento"
                            size='small'
                            fullWidth
                            type="date"
                            value={registro.fecha_asiento} 
                            onChange={handleChange}
                            inputProps={{ style:{color:'white', textAlign: 'center'} }}
                            InputLabelProps={{ style:{color:'skyblue'} }}
                />

          <TextField variant="outlined" 
                            //label="GLOSA"
                            placeholder="GLOSA"
                            sx={{ display:'block',
                                    margin:'.5rem 0',
                                }}
                            name="glosa"
                            size='small'
                            fullWidth
                            value={registro.glosa} 
                            onChange={handleChange}
                            inputProps={{ style:{color:'white'} }}
                            InputLabelProps={{ style:{color:'skyblue'} }}
            />

        </Card>
      </Grid>
      

      <Grid item xs={9} >

      </Grid>
    </Grid>
    
    <form onSubmit={handleSubmit} >
    
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
                                      !registro.fecha_asiento || 
                                      !registro.glosa || 
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
                              navigate(`/asientodet/${params.id_anfitrion}/${params.id_invitado}/${params.documento_id}/${params.periodo}/${params.id_libro}/${params.num_asiento}`);
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
