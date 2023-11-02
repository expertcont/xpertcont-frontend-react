import {Grid,Card,CardContent,Typography,TextField,Button,CircularProgress} from '@mui/material'
//import { padding } from '@mui/system'
import {useState,useEffect,useRef} from 'react';
import React from 'react';
import {useNavigate, useParams} from 'react-router-dom';
//import Tooltip from '@mui/material/Tooltip';

export default function CuentaForm() {
  //const back_host = process.env.BACK_HOST || "http://localhost:4000";
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
  const [contabilidad,setContabilidad] = useState({
      id_usuario:'',
      documento_id:'',
      razon_social:'',
      activo:''
  })
  //Seccion keyDown Formulario
  const secondTextFieldRef = useRef(null);
  const terceroTextFieldRef = useRef(null);
  const cuartoTextFieldRef = useRef(null);
  const handleKeyDown = (event, nextRef) => {
    if (event.key === "Enter") {
      nextRef.current.focus();
    }
  };
  /////////////////////////////////////////////////////////

  const [cargando,setCargando] = useState(false);
  const [editando,setEditando] = useState(false);
  
  const navigate = useNavigate();
  const params = useParams();

  const handleSubmit = async(e) => {
    e.preventDefault();
    setCargando(true);
    
    //Cambiooo para controlar Edicion
    if (editando){
      console.log(`${back_host}/contabilidad/${params.id}`);
      console.log(contabilidad);
      await fetch(`${back_host}/contabilidad/${params.id}`, {
        method: "PUT",
        body: JSON.stringify(contabilidad),
        headers: {"Content-Type":"application/json"}
      });
    }else{
      console.log(`${back_host}/contabilidad`);
      console.log(contabilidad);
      await fetch(`${back_host}/contabilidad`, {
        method: "POST",
        body: JSON.stringify(contabilidad),
        headers: {"Content-Type":"application/json"}
      });
    }

    setCargando(false);
    navigate(`/contabilidad`);
  };
  
  //Aqui se leen parametros en caso lleguen
  useEffect( ()=> {
    if (params.id_usuario && params.documento_id){
      mostrarContabilidad(params.id_usuario, params.documento_id);
    }
  },[params.id]);

  //Rico evento change
  const handleChange = e => {
    setContabilidad({...contabilidad, [e.target.name]: e.target.value});
    //console.log(e.target.name, e.target.value);
  }

  //funcion para mostrar data de formulario, modo edicion
  const mostrarContabilidad = async (id_usuario,documento_id) => {
    console.log(`${back_host}/contabilidad/${id_usuario}/${documento_id}`);
    const res = await fetch(`${back_host}/contabilidad/${id_usuario}/${documento_id}`);
    const data = await res.json();
    //Actualiza datos para enlace con controles, al momento de modo editar
    setContabilidad({
            documento_id:data.documento_id,       
            razon_social:data.razon_social, 
            activo:data.activo});
    //console.log(data);
    setEditando(true);
  };

  return (
    <Grid container
          direction="column"
          alignItems="center"
          justifyContent="center">
        <Grid item xs={3}>
            <Card sx={{mt:5}}
                  style={{
                    background:'#1e272e',
                    padding:'1rem'
                  }}
                  >
                <Typography variant='5' color='white' textAlign='center'>
                    {editando ? "EDITAR CONTABILIDAD" : "CREAR CONTABILIDAD"}
                </Typography>
                <CardContent>
                    <form onSubmit={handleSubmit} >

                        <TextField variant="outlined" 
                                   label="RUC"
                                   fullWidth
                                   sx={{display:'block',
                                        margin:'.5rem 0'}}
                                   name="documento_id"
                                   value={contabilidad.documento_id}
                                   onChange={handleChange}
                                   onKeyDown={(event) => handleKeyDown(event, terceroTextFieldRef)}
                                   inputRef={secondTextFieldRef}                                   
                                   inputProps={{ style:{color:'white', textTransform: 'uppercase'} }}
                                   InputLabelProps={{ style:{color:'white'} }}
                        />
                        <TextField variant="outlined" 
                                   label="RAZON SOCIAL"
                                   fullWidth
                                   rows={2}
                                   sx={{display:'block',
                                        margin:'.5rem 0'}}
                                   name="razon_social"
                                   value={contabilidad.razon_social}
                                   onChange={handleChange}
                                   onKeyDown={(event) => handleKeyDown(event, cuartoTextFieldRef)}
                                   inputRef={terceroTextFieldRef}                                   

                                   inputProps={{ style:{color:'white', textTransform: 'uppercase'} }}
                                   InputLabelProps={{ style:{color:'white'} }}
                         />
                        <TextField variant="outlined" 
                                   label="ACTIVO"
                                   //multiline
                                   fullWidth
                                   sx={{display:'block',
                                        margin:'.5rem 0'}}
                                   name="activo"
                                   value={contabilidad.activo}
                                   onChange={handleChange}
                                   inputRef={cuartoTextFieldRef}                                   
                                   inputProps={{ style:{color:'white', textTransform: 'uppercase'} }}
                                   InputLabelProps={{ style:{color:'white'} }}
                         />

                        <Button variant='contained' 
                                color='primary' 
                                type='submit'
                                disabled={!contabilidad.documento_id || 
                                          !contabilidad.razon_social 
                                          }
                                >
                                { cargando ? (
                                <CircularProgress color="inherit" size={24} />
                                ) : (
                                  editando ?
                                'Modificar' : 'Grabar')
                                }
                        </Button>

                        <Button variant='contained' 
                                    color='success' 
                                    //sx={{mt:1}}
                                    onClick={ ()=>{
                                      navigate(-1, { replace: true });
                                      //window.location.reload();
                                      }
                                    }
                                    >
                              ANTERIOR
                        </Button>

                    </form>
                </CardContent>
            </Card>
        </Grid>
    </Grid>
  )
}
