import {Grid,Card,CardContent,Typography,TextField,Button,CircularProgress,Select, MenuItem, InputLabel, Box, FormControl} from '@mui/material'
//import { padding } from '@mui/system'
import {useState,useEffect} from 'react';
import React from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import axios from 'axios';
import { ConstructionOutlined } from '@mui/icons-material';

export default function ProductoFormPrecio() {
  //const back_host = process.env.BACK_HOST || "http://localhost:4000";
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";  
  //Select(Combos) para llenar, desde tabla
    
  //Estado para variables del formulario
  const [producto_precio,setProductoPrecio] = useState({
      nombre:'',
      id_producto:'',
      unidades:'',
      precio_venta:0,
      cant_min:'',
      cant_max:'',
      origen:'MANUAL'
  })

  const [cargando,setCargando] = useState(false);
  const [editando,setEditando] = useState(false);
  
  const navigate = useNavigate();
  const params = useParams();

  const handleSubmit = async(e) => {
    e.preventDefault();
    setCargando(true);
    console.log('antes:', producto_precio);

    //Cambiooo para controlar Edicion
    if (editando){
      await fetch(`${back_host}/ad_productoprecio/${params.id_anfitrion}/${params.documento_id}/${params.id_producto}/${params.unidades}`, {
        method: "PUT",
        body: JSON.stringify(producto_precio),
        headers: {"Content-Type":"application/json"}
      });
    }else{
      producto_precio.id_anfitrion = params.id_anfitrion;
      producto_precio.documento_id = params.documento_id;
      console.log('antes de grabar:', producto_precio);

      await fetch(`${back_host}/ad_productoprecio`, {
        method: "POST",
        body: JSON.stringify(producto_precio),
        headers: {"Content-Type":"application/json"}
      });
    }

    setCargando(false);
    navigate(`/ad_producto/${params.id_anfitrion}/${params.id_invitado}/${params.documento_id}`);
  };
  
  //Aqui se leen parametros en caso lleguen
  useEffect( ()=> {
    
    if (params.id_producto){
    console.log('Editando precio:', params.id_anfitrion,params.documento_id,params.id_producto, params.unidades);
      mostrarProductoPrecio(params.id_anfitrion,params.documento_id,params.id_producto, params.unidades);
      setEditando(true);
    }
    else{
      setEditando(false);
    }
    
    //////////////////////////////////////////
    //////////////////////////////////////////
    //////////////////////////////////////////

  },[]);

  //Rico evento change
  const handleChange = e => {
    setProductoPrecio({...producto_precio, [e.target.name]: devuelveValor(e)});
    //console.log(e.target.name, e.target.value);
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
  const mostrarProductoPrecio = async (sAnfitrion,sDocumentoId,sIdProducto,sUnidades) => {
    console.log('mostrarProductoPrecio: ',`${back_host}/ad_productoprecio/${sAnfitrion}/${sDocumentoId}/${sIdProducto}/${sUnidades}`);
    const res = await fetch(`${back_host}/ad_productoprecio/${sAnfitrion}/${sDocumentoId}/${sIdProducto}/${sUnidades}`);
    const data = await res.json();
    //Actualiza datos para enlace con controles, al momento de modo editar
    console.log('Precio encontrado: ',data);
    setProductoPrecio({
                    id_producto:data.id_producto, 
                    nombre:data.nombre, 
                    precio_venta:data.precio_venta, 
                    cant_min:data.cant_min,
                    cant_max:data.cant_max
                  });
    //console.log(data.relacionado);
    setEditando(true);
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
                    {editando ? "EDITAR PRODUCTO" : "CREAR PRODUCTO"}
                </Typography>
                <CardContent >
                    <form onSubmit={handleSubmit} autoComplete="off">
                          
                         
                        <TextField variant="outlined" 
                                label="Codigo"
                                fullWidth
                                size='small'
                                //multiline
                                sx={{display:'block',margin:'.5rem 0'}}
                                name="id_producto"
                                value={producto_precio.id_producto}
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
                                   value={producto_precio.nombre}
                                   onChange={handleChange}
                                   inputProps={{ style:{color:'white', textTransform: 'uppercase'} }}
                                   InputLabelProps={{ style:{color:'white'} }}
                        />

                        <TextField variant="outlined" 
                                   label="Precio Venta" 
                                   fullWidth
                                   size='small'
                                   //multiline
                                   sx={{display:'block',
                                        margin:'.5rem 1'}}
                                   name="precio_venta"
                                   value={producto_precio.precio_venta}
                                   onChange={handleChange}
                                   inputProps={{ style:{color:'white', textTransform: 'uppercase'} }}
                                   InputLabelProps={{ style:{color:'white'} }}
                        />

                        <TextField variant="outlined" 
                                   label="Cant Min"
                                   fullWidth
                                   size='small'
                                   //multiline
                                   sx={{display:'block',
                                        margin:'.5rem 1'}}
                                   name="cant_min"
                                   value={producto_precio.cant_min}
                                   onChange={handleChange}
                                   inputProps={{ style:{color:'white', textTransform: 'uppercase'} }}
                                   InputLabelProps={{ style:{color:'white'} }}
                        />
                        <TextField variant="outlined" 
                                   label="Cant Max"
                                   fullWidth
                                   size='small'
                                   //multiline
                                   sx={{display:'block',
                                        margin:'.5rem 1'}}
                                   name="cant_max"
                                   value={producto_precio.cant_max}
                                   onChange={handleChange}
                                   inputProps={{ style:{color:'white', textTransform: 'uppercase'} }}
                                   InputLabelProps={{ style:{color:'white'} }}
                        />


                        <Button variant='contained' 
                                color='primary' 
                                type='submit'
                                disabled={!producto_precio.cant_min || 
                                          !producto_precio.cant_max ||
                                          !producto_precio.precio_venta }
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
