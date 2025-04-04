import {Grid,Card,CardContent,Typography,TextField,Button,CircularProgress,Select, MenuItem, InputLabel, Box, FormControl} from '@mui/material'
//import { padding } from '@mui/system'
import {useState,useEffect} from 'react';
import React from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import axios from 'axios';

export default function EquipoForm() {
  //const back_host = process.env.BACK_HOST || "http://localhost:4000";
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";  
  //Select(Combos) para llenar, desde tabla
  const [unidad_select,setUnidadSelect] = useState([]);
  
  //Estado para variables del formulario
  const [producto,setProducto] = useState({
      id_equipo:'',
      nombre:'',
      descripcion:'',
      placa:'',
      marca:'',
      modelo:'',
      serie:'',
      precio_dia:'',
      precio_mes:'',
      estado:'BODEGA',
      origen:'MANUAL',
  })

  const [cargando,setCargando] = useState(false);
  const [editando,setEditando] = useState(false);
  
  const navigate = useNavigate();
  const params = useParams();

  const handleSubmit = async(e) => {
    e.preventDefault();
    setCargando(true);
    console.log('antes:', producto);

    //Cambiooo para controlar Edicion
    if (editando){
      await fetch(`${back_host}/ad_equipo/${params.id_anfitrion}/${params.documento_id}/${params.id_equipo}`, {
        method: "PUT",
        body: JSON.stringify(producto),
        headers: {"Content-Type":"application/json"}
      });
    }else{
      producto.id_anfitrion = params.id_anfitrion;
      producto.documento_id = params.documento_id;
      console.log('antes de grabar:', producto);

      await fetch(`${back_host}/ad_equipo`, {
        method: "POST",
        body: JSON.stringify(producto),
        headers: {"Content-Type":"application/json"}
      });
    }

    setCargando(false);
    navigate(`/ad_equipo/${params.id_anfitrion}/${params.id_invitado}/${params.documento_id}`);
    //navigate(`/ad_equipo`);
  };
  
  //Aqui se leen parametros en caso lleguen
  useEffect( ()=> {
    //console.log('aaaa ',params.id_anfitrion,params.id_invitado,params.documento_id,params.id_equipo);
    cargaUnidad();

    if (params.id_equipo){
      mostrarProducto(params.id_anfitrion,params.documento_id,params.id_equipo);
      setEditando(true);
    }
    else{
      setEditando(false);
    }
    
    //console.log(producto);
    //////////////////////////////////////////
    //////////////////////////////////////////
    //////////////////////////////////////////

  },[]);

  //Rico evento change
  const handleChange = e => {
    setProducto({...producto, [e.target.name]: devuelveValor(e)});
    //console.log(e.target.name, e.target.value);
    //console.log(producto);
  }
  
  const devuelveValor = e =>{
      let strNombre;
      strNombre = e.target.name;
      strNombre = strNombre.substring(0,3);
      console.log(e.target.name);  
      if (strNombre === "chk"){
        console.log(e.target.checked);  
        return(e.target.checked);
      }else{
        console.log(e.target.value);
        return(e.target.value);
      }
  }

  //funcion para mostrar data de formulario, modo edicion
  const mostrarProducto = async (sAnfitrion,sDocumentoId,sIdProducto) => {
    //console.log(`${back_host}/producto/${id}`);
    const res = await fetch(`${back_host}/ad_equipo/${sAnfitrion}/${sDocumentoId}/${sIdProducto}`);
    const data = await res.json();
    //Actualiza datos para enlace con controles, al momento de modo editar
    setProducto({
                    id_equipo:data.id_equipo, 
                    nombre:data.nombre, 
                    descripcion:data.descripcion, 
                    placa:data.placa, 
                    marca:data.marca, 
                    modelo:data.modelo, 
                    serie:data.serie, 
                    precio_dia:data.precio_dia, 
                    precio_mes:data.precio_mes, 
                    estado:data.estado,
                  });
    //console.log(data.relacionado);
    setEditando(true);
  };

  const cargaUnidad = () =>{
    //console.log(`${back_host}/unidadmedida`);
    axios
    .get(`${back_host}/unidadmedida`)
    .then((response) => {
        setUnidadSelect(response.data);
    })
    .catch((error) => {
        console.log(error);
    });
  };

  return (
    <Grid container
          direction="column"
          alignItems="center"
          justifyContent="center"
    >
        <Grid item xs={12} >
            <Card //sx={{mt:1}}
                  sx={{ minWidth: 275 }}            
                  style={{
                    background:'#1e272e',
                    padding:'.1rem'
                  }}
                  >
                <Typography variant='subtitle2' color='white' textAlign='center'>
                    {editando ? "EDITAR EQUIPO" : "CREAR EQUIPO"}
                </Typography>
                <CardContent >
                    <form onSubmit={handleSubmit} autoComplete="off">
                          
                          
                        <TextField variant="outlined" 
                                label="Codigo"
                                fullWidth
                                size='small'
                                //multiline
                                sx={{display:'block',margin:'.5rem 0'}}
                                name="id_equipo"
                                value={producto.id_equipo}
                                onChange={handleChange}
                                inputProps={{ style:{color:'white', textTransform: 'uppercase'} }}
                                InputLabelProps={{ style:{color:'white'} }}
                        />
                          
                        <TextField variant="outlined" 
                                   label="Nombre"
                                   fullWidth
                                   size='small'
                                   //multiline
                                   sx={{display:'block',
                                        margin:'.5rem 1'}}
                                   name="nombre"
                                   value={producto.nombre}
                                   onChange={handleChange}
                                   inputProps={{ style:{color:'white', textTransform: 'uppercase'} }}
                                   InputLabelProps={{ style:{color:'white'} }}
                        />

                        <TextField variant="outlined" 
                                   label="Descripcion"
                                   fullWidth
                                   size='small'
                                   //multiline
                                   sx={{display:'block',
                                        margin:'.5rem 1'}}
                                   name="descripcion"
                                   value={producto.descripcion}
                                   onChange={handleChange}
                                   inputProps={{ style:{color:'white', textTransform: 'uppercase'} }}
                                   InputLabelProps={{ style:{color:'white'} }}
                        />

                        <TextField variant="outlined" 
                                   label="Placa"
                                   fullWidth
                                   size='small'
                                   //multiline
                                   sx={{display:'block',
                                        margin:'.5rem 1'}}
                                   name="placa"
                                   value={producto.placa}
                                   onChange={handleChange}
                                   inputProps={{ style:{color:'white', textTransform: 'uppercase'} }}
                                   InputLabelProps={{ style:{color:'white'} }}
                        />
                        <TextField variant="outlined" 
                                   label="Marca"
                                   fullWidth
                                   size='small'
                                   //multiline
                                   sx={{display:'block',
                                        margin:'.5rem 1'}}
                                   name="marca"
                                   value={producto.marca}
                                   onChange={handleChange}
                                   inputProps={{ style:{color:'white', textTransform: 'uppercase'} }}
                                   InputLabelProps={{ style:{color:'white'} }}
                        />
                        <TextField variant="outlined" 
                                   label="Modelo"
                                   fullWidth
                                   size='small'
                                   //multiline
                                   sx={{display:'block',
                                        margin:'.5rem 1'}}
                                   name="modelo"
                                   value={producto.modelo}
                                   onChange={handleChange}
                                   inputProps={{ style:{color:'white', textTransform: 'uppercase'} }}
                                   InputLabelProps={{ style:{color:'white'} }}
                        />
                        <TextField variant="outlined" 
                                   label="Serie"
                                   fullWidth
                                   size='small'
                                   //multiline
                                   sx={{display:'block',
                                        margin:'.5rem 1'}}
                                   name="serie"
                                   value={producto.serie}
                                   onChange={handleChange}
                                   inputProps={{ style:{color:'white', textTransform: 'uppercase'} }}
                                   InputLabelProps={{ style:{color:'white'} }}
                        />
                        <TextField variant="outlined" 
                                   label="Prec. DIA"
                                   fullWidth
                                   size='small'
                                   //multiline
                                   sx={{display:'block',
                                        margin:'.5rem 1'}}
                                   name="precio_dia"
                                   value={producto.precio_dia}
                                   onChange={handleChange}
                                   inputProps={{ style:{color:'white', textTransform: 'uppercase'} }}
                                   InputLabelProps={{ style:{color:'white'} }}
                        />
                        <TextField variant="outlined" 
                                   label="Prec. MES"
                                   fullWidth
                                   size='small'
                                   //multiline
                                   sx={{display:'block',
                                        margin:'.5rem 1'}}
                                   name="precio_mes"
                                   value={producto.precio_mes}
                                   onChange={handleChange}
                                   inputProps={{ style:{color:'white', textTransform: 'uppercase'} }}
                                   InputLabelProps={{ style:{color:'white'} }}
                        />



                        <Button variant='contained' 
                                color='primary' 
                                type='submit'
                                disabled={!producto.id_equipo || 
                                          !producto.nombre}
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
