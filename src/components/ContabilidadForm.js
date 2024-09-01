import {Grid,Card,CardContent,Typography,TextField,Button,CircularProgress,Select,MenuItem} from '@mui/material'
//import { padding } from '@mui/system'
import {useState,useEffect,useRef} from 'react';
import React from 'react';
import {useNavigate, useParams} from 'react-router-dom';
//import Tooltip from '@mui/material/Tooltip';
import Switch from '@mui/material/Switch';

export default function ContabilidadForm() {
  //const back_host = process.env.BACK_HOST || "http://localhost:4000";
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
  const [contabilidad,setContabilidad] = useState({
      id_anfitrion:'',
      documento_id:'',
      tipo:'',
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
  const [activoCont,setActivoCont] = useState(false);
  
  const navigate = useNavigate();
  const params = useParams();

  const handleSubmit = async(e) => {
    e.preventDefault();
    setCargando(true);
    
    //Cambiooo para controlar Edicion
    if (editando){
      //console.log(`${back_host}/contabilidad/${params.id_anfitrion}/${params.documento_id}`);
      //console.log(contabilidad);
      await fetch(`${back_host}/contabilidad/${params.id_anfitrion}/${params.documento_id}/${params.tipo}`, {
        method: "PUT",
        body: JSON.stringify(contabilidad),
        headers: {"Content-Type":"application/json"}
      });
    }else{
      setContabilidad(prevState => ({ ...prevState, id_anfitrion: params.id_anfitrion }));
      contabilidad.id_anfitrion = params.id_anfitrion;

      //console.log(`${back_host}/contabilidad`);
      //console.log(contabilidad);
      await fetch(`${back_host}/contabilidad`, {
        method: "POST",
        body: JSON.stringify(contabilidad),
        headers: {"Content-Type":"application/json"}
      });
    }

    setCargando(false);
    //navigate(`/contabilidades/${params.id_anfitrion}`);
    navigate(-1, { replace: true });
  };
  
  //Aqui se leen parametros en caso lleguen
  useEffect( ()=> {
    if (params.id_anfitrion && params.documento_id){
      mostrarContabilidad(params.id_anfitrion, params.documento_id,params.tipo);
      setContabilidad(prevState => ({ ...prevState, id_anfitrion: params.id_anfitrion }));
      
    }
  },[params.id]);

  const handleChangeActivo = e => {
    console.log(e.target.name, e.target.checked);

    const { name, checked } = e.target;
    if (name === 'activoCont') {
      if (checked){
        setContabilidad(prevState => ({ ...prevState, activo: '1' }));
        setActivoCont(true);
      }
      else{
        setContabilidad(prevState => ({ ...prevState, activo: '0' }));
        setActivoCont(false);
      }
      
    }
  }

  //Rico evento change
  const handleChange = e => {
    console.log(e.target.name, e.target.value);
    const inputValue = e.target.value;
    const valorEnMayusculas = inputValue.toUpperCase();
    setContabilidad({...contabilidad, [e.target.name]: valorEnMayusculas});
  }

  //funcion para mostrar data de formulario, modo edicion
  const mostrarContabilidad = async (id_anfitrion,documento_id,tipo) => {
    //console.log(`${back_host}/contabilidad/${id_anfitrion}/${documento_id}`);
    const res = await fetch(`${back_host}/contabilidad/${id_anfitrion}/${documento_id}/${tipo}`);
    const data = await res.json();
    //Actualiza datos para enlace con controles, al momento de modo editar
    setContabilidad({
            id_anfitrion:data.id_usuario,       
            documento_id:data.documento_id,
            tipo:data.tipo, //new fusion admin ;)
            razon_social:data.razon_social, 
            activo:data.activo});
    //console.log(data);
    setEditando(true);
    if (data.activo==='1'){
      setActivoCont(true);
      console.log('inicial true');
    }
  };

  return (
    <Grid container
          direction="column"
          alignItems="center"
          justifyContent="center">
          
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
                      <Grid item xs={12}>
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
                      </Grid>
                      <Grid item xs={12}>
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
                        </Grid>
                        
                        <Grid item xs={12}>
                          <Select
                                  labelId="role-select-label"
                                  name="tipo"
                                  value={contabilidad.tipo}
                                  onChange={handleChange}
                                  label="Tipo"
                                  fullWidth
                                  sx={{display:'block',
                                    margin:'.5rem 0', color:"white"}}
                          >
                                  <MenuItem value="CONT">CONT</MenuItem>
                                  <MenuItem value="ADMIN">ADMIN</MenuItem>
                          </Select>
                        </Grid>

                        <Grid item xs={12}>
                        <Switch
                          checked={activoCont} // Utilizamos el valor correspondiente al índice en el array
                          fullWidth
                          onChange={handleChangeActivo}
                          color="primary"
                          name="activoCont"
                          inputProps={{ 'aria-label': 'toggle switch' }}
                        />
                        <Typography variant='6' color='white' textAlign='center'>
                            {activoCont ? "Activo" : "Inactivo"}
                        </Typography>
                        </Grid>

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
  )
}
