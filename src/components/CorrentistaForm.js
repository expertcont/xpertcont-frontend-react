import {Grid,Card,CardContent,Typography,TextField,Button,CircularProgress,Select, MenuItem, InputLabel, Box, FormControl} from '@mui/material'
//import { padding } from '@mui/system'
import {useState,useEffect} from 'react';
import React from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import axios from 'axios';

export default function CorrentistaForm() {
  //const back_host = process.env.BACK_HOST || "http://localhost:4000";
  const back_host = process.env.BACK_HOST || "https://alsa-backend-js-production.up.railway.app";  
  //Select(Combos) para llenar, desde tabla
  const [vendedor_select,setVendedorSelect] = useState([]);
  const [zona_select,setZonaSelect] = useState([]);
  
  const documento_select=[
    {id_documento:"01",nombre:"DNI"},
    {id_documento:"06",nombre:"RUC"}
  ];
  
  //Estado para variables del formulario
  const [correntista,setCorrentista] = useState({
      id_documento:'',
      razon_social:'',
      codigo:'',
      contacto:'',
      telefono:'',
      telefono2:'',
      email:'',
      email2:'',
      id_vendedor:'',
      id_zonadet:'',
      relacionado:'',
      base:''
  })

  const [cargando,setCargando] = useState(false);
  const [editando,setEditando] = useState(false);
  
  const navigate = useNavigate();
  const params = useParams();

  const handleSubmit = async(e) => {
    e.preventDefault();
    setCargando(true);
    
    //Cambiooo para controlar Edicion
    if (editando){
      //console.log(`${back_host}/correntista/${params.id}`);
      //console.log(correntista);
      await fetch(`${back_host}/correntista/${params.id}`, {
        method: "PUT",
        body: JSON.stringify(correntista),
        headers: {"Content-Type":"application/json"}
      });
    }else{
      //console.log(`${back_host}/correntista/${params.id}`);
      await fetch(`${back_host}/correntista`, {
        method: "POST",
        body: JSON.stringify(correntista),
        headers: {"Content-Type":"application/json"}
      });
    }

    setCargando(false);
    navigate(`/correntista`);
  };
  
  //Aqui se leen parametros en caso lleguen
  useEffect( ()=> {
    if (params.id){
      mostrarCorrentista(params.id);
    }
    //////////////////////////////////////////
    axios
    .get(`${back_host}/usuario/vendedores`)
    .then((response) => {
        //console.log(response.data);
        setVendedorSelect(response.data);
    })
    .catch((error) => {
        console.log(error);
    });
    //////////////////////////////////////////
    axios
    .get(`${back_host}/zonadet`)
    .then((response) => {
        setZonaSelect(response.data);
    })
    .catch((error) => {
        console.log(error);
    });
    //////////////////////////////////////////

  },[params.id]);

  //Rico evento change
  const handleChange = e => {
    setCorrentista({...correntista, [e.target.name]: devuelveValor(e)});
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
  const mostrarCorrentista = async (id) => {
    console.log(`${back_host}/correntista/${id}`);
    const res = await fetch(`${back_host}/correntista/${id}`);
    const data = await res.json();
    //Actualiza datos para enlace con controles, al momento de modo editar
    setCorrentista({
                    id_documento:data.id_documento, 
                    documento_id:data.documento_id, 
                    razon_social:data.razon_social, 
                    codigo:data.codigo,  //new
                    contacto:data.contacto, 
                    telefono:data.telefono,
                    telefono2:data.telefono2, //new
                    email:data.email,
                    email2:data.email2, //new
                    id_vendedor:data.id_vendedor,
                    id_zonadet:data.id_zonadet, //new
                    relacionado:data.relacionado,
                    base:data.base
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
                    {editando ? "EDITAR CORRENTISTA" : "CREAR CORRENTISTA"}
                </Typography>
                <CardContent >
                    <form onSubmit={handleSubmit} autoComplete="off">
                        <Grid container>
                          <Grid item xs={4} >
                              <Box sx={{ minWidth: 120 }}>
                                    <FormControl fullWidth>
                                      <InputLabel id="demo-simple-select-label" 
                                                  inputProps={{ style:{color:'white'} }}
                                                  InputLabelProps={{ style:{color:'white'} }}
                                                  sx={{mt:1, color:'#5DADE2'}}
                                      >Documento</InputLabel>
                                      <Select
                                        labelId="documento_select"
                                        size='small'
                                        autoFocus
                                        id={correntista.id_documento}
                                        value={correntista.id_documento}
                                        name="id_documento"
                                        sx={{display:'block',
                                        margin:'.5rem 0', color:"white"}}
                                        label="Zona"
                                        onChange={handleChange}
                                        inputProps={{ style:{color:'white'} }}
                                        InputLabelProps={{ style:{color:'white'} }}
                                      >
                                        {   
                                            documento_select.map(elemento => (
                                            <MenuItem key={elemento.id_documento} value={elemento.id_documento}>
                                              {elemento.nombre}
                                            </MenuItem>)) 
                                        }
                                      </Select>
                                    </FormControl>
                              </Box>
                          </Grid>
                          <Grid item xs={6} >
                              <TextField variant="outlined" 
                                      //label="Dni-Ruc"
                                      fullWidth
                                      size='small'
                                      //multiline
                                      sx={{display:'block',margin:'.5rem 0'}}
                                      name="documento_id"
                                      value={correntista.documento_id}
                                      onChange={handleChange}
                                      onKeyPress={(event) => {
                                        const numericRegex = /^[0-9]*$/
                                        if (!numericRegex.test(event.key)) {
                                            event.preventDefault();
                                        }
                                      }}
                                      inputProps={{ inputMode: 'numeric',
                                      style:{color:'white'} }}
                                      InputLabelProps={{ style:{color:'white'} }}
                              />
                          </Grid>  
                        </Grid>  

                        <TextField variant="outlined" 
                                   label="Razon Social"
                                   fullWidth
                                   size='small'
                                   //multiline
                                   sx={{display:'block',
                                        margin:'.5rem 1'}}
                                   name="razon_social"
                                   value={correntista.razon_social}
                                   onChange={handleChange}
                                   inputProps={{ style:{color:'white', textTransform: 'uppercase'} }}
                                   InputLabelProps={{ style:{color:'white'} }}
                        />
                        <TextField variant="outlined" 
                                   label="Codigo Interno"
                                   size='small'
                                   fullWidth
                                   //multiline
                                   sx={{display:'block',
                                        margin:'.5rem 0'}}
                                   name="codigo"
                                   value={correntista.codigo}
                                   onChange={handleChange}
                                   inputProps={{ style:{color:'white', textTransform: 'uppercase'} }}
                                   InputLabelProps={{ style:{color:'white'} }}
                        />

                        <TextField variant="outlined" 
                                   label="Contacto"
                                   size='small'
                                   fullWidth
                                   sx={{display:'block',
                                        margin:'.5rem 0'}}
                                   name="contacto"
                                   value={correntista.contacto}
                                   onChange={handleChange}
                                   inputProps={{ style:{color:'white', textTransform: 'uppercase'} }}
                                   InputLabelProps={{ style:{color:'white'} }}
                         />
                        <TextField variant="outlined" 
                                   label="Telefono"
                                   size='small'
                                   fullWidth
                                   sx={{display:'block',
                                        margin:'.5rem 0'}}
                                   name="telefono"
                                   value={correntista.telefono}
                                   onChange={handleChange}
                                   inputProps={{ style:{color:'white'} }}
                                   InputLabelProps={{ style:{color:'white'} }}
                         />
                        <TextField variant="outlined" 
                                   label="Telefono Alternativo"
                                   size='small'
                                   fullWidth
                                   sx={{display:'block',
                                        margin:'.5rem 0'}}
                                   name="telefono2"
                                   value={correntista.telefono2}
                                   onChange={handleChange}
                                   inputProps={{ style:{color:'white'} }}
                                   InputLabelProps={{ style:{color:'white'} }}
                         />

                        <TextField variant="outlined" 
                                   label="email"
                                   size='small'
                                   fullWidth
                                   sx={{display:'block',
                                        margin:'.5rem 0'}}
                                   name="email"
                                   value={correntista.email}
                                   onChange={handleChange}
                                   inputProps={{ style:{color:'white'} }}
                                   InputLabelProps={{ style:{color:'white'} }}
                         />

                          <TextField variant="outlined" 
                                   label="email adicional"
                                   size='small'
                                   fullWidth
                                   sx={{display:'block',
                                        margin:'.5rem 0'}}
                                   name="email2"
                                   value={correntista.email2}
                                   onChange={handleChange}
                                   inputProps={{ style:{color:'white'} }}
                                   InputLabelProps={{ style:{color:'white'} }}
                         />

                        <Box sx={{ minWidth: 120 }}>
                                <FormControl fullWidth>
                                  <InputLabel id="demo-simple-select-label" 
                                              inputProps={{ style:{color:'white'} }}
                                              InputLabelProps={{ style:{color:'white'} }}
                                              sx={{mt:1, color:'#5DADE2'}}
                                  >Vendedor</InputLabel>
                                  <Select
                                    labelId="vendedor_select"
                                    size='small'
                                    id={correntista.id_vendedor}
                                    value={correntista.id_vendedor}
                                    name="id_vendedor"
                                    sx={{display:'block',
                                    margin:'.5rem 0', color:"white"}}
                                    label="Vendedor"
                                    onChange={handleChange}
                                    inputProps={{ style:{color:'white'} }}
                                    InputLabelProps={{ style:{color:'white'} }}
                                  >
                                    {   
                                        vendedor_select.map(elemento => (
                                        <MenuItem key={elemento.id_vendedor} value={elemento.id_vendedor}>
                                          {elemento.nombre}
                                        </MenuItem>)) 
                                    }
                                  </Select>
                                </FormControl>
                        </Box>

                        <Box sx={{ minWidth: 120 }}>
                                <FormControl fullWidth>
                                  <InputLabel id="demo-simple-select-label" 
                                              inputProps={{ style:{color:'white'} }}
                                              InputLabelProps={{ style:{color:'white'} }}
                                              sx={{mt:1, color:'#5DADE2'}}
                                  >Zona</InputLabel>
                                  <Select
                                    labelId="zona_select"
                                    size='small'
                                    id={correntista.id_zonadet}
                                    value={correntista.id_zonadet}
                                    name="id_zonadet"
                                    sx={{display:'block',
                                    margin:'.5rem 0', color:"white"}}
                                    label="Zona"
                                    onChange={handleChange}
                                    inputProps={{ style:{color:'white'} }}
                                    InputLabelProps={{ style:{color:'white'} }}
                                  >
                                    {   
                                        zona_select.map(elemento => (
                                        <MenuItem key={elemento.id_zonadet} value={elemento.id_zonadet}>
                                          {elemento.nombre}
                                        </MenuItem>)) 
                                    }
                                  </Select>
                                </FormControl>
                        </Box>

                        <Button variant='contained' 
                                color='primary' 
                                type='submit'
                                disabled={!correntista.razon_social || 
                                          !correntista.telefono}
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
