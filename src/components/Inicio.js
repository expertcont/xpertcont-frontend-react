import {Grid,Card,CardContent,Select,MenuItem,Typography,TextField,Button,CircularProgress,useMediaQuery} from '@mui/material'
//import { padding } from '@mui/system'
import {useState,useEffect,useRef} from 'react';
import React from 'react';
import {useNavigate, useParams} from 'react-router-dom';
//import Tooltip from '@mui/material/Tooltip';

import MuiPhone from './MuiPhone';
import Avatar from '@mui/material/Avatar';
import { useAuth0 } from '@auth0/auth0-react';
import swal2 from 'sweetalert2'
import logo from '../Logo02.png'; // Importa el logo
import AccountCircle from '@mui/icons-material/AccountCircle';
import InputAdornment from '@mui/material/InputAdornment';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import EventIcon from '@mui/icons-material/Event';
import FormControl from '@mui/material/FormControl';
import CalendarViewDayIcon from '@mui/icons-material/CalendarViewDay';
import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';
import axios from 'axios';

export default function Inicio() {
  //const back_host = process.env.BACK_HOST || "http://localhost:4000";
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
  const [anfitrion,setAnfitrion] = useState({
      id_usuario:'',
      razon_social:'',
      documento_id:'',
      periodo_ano:'',
      periodo_mes:'',
      periodo:'',
      telefono:''
  });
  const [periodo_ano_select] = useState([
    {ano:'2023'},
    {ano:'2024'}
  ]);
  const [periodo_mes_select] = useState([
    {mes:'ENERO'},
    {mes:'FEBRERO'},
    {mes:'MARZO'},
    {mes:'ABRIL'},
    {mes:'MAYO'},
    {mes:'JUNIO'},
    {mes:'JULIO'},
    {mes:'AGOSTO'},
    {mes:'SEPTIEMBRE'},
    {mes:'NOVIEMBRE'},
    {mes:'DICIEMBRE'},
  ]);

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
  const [phoneNumber, setPhoneNumber] = useState();
  const [dialNumber, setDialNumber] = useState();
  const [bNumberIncomplete, setNumberIncomplete] = useState(true);//indicar si numero es mayor al codigo pais

  const [cargando,setCargando] = useState(false);
  const [editando,setEditando] = useState(false);
  const {user, isAuthenticated } = useAuth0();
  const isSmallScreen = useMediaQuery('(max-width: 600px)');
  const [licencias_select,setLicenciaSelect] = useState([]);

  const navigate = useNavigate();
  const params = useParams();
  
  const aumentoPorcentaje = 80; // Puedes ajustar este valor según tus necesidades
  const estiloAvatar = {
    width: `${aumentoPorcentaje}%`,
    height: `${aumentoPorcentaje}%`,
  };

  const cargaLicenciasOferta = () =>{
    console.log(`${back_host}/licencias`);
    axios
    .get(`${back_host}/licencias`)
    .then((response) => {
      //Cargar Arreglo
      setLicenciaSelect(response.data);
      // Establece el primer valor del arreglo como valor inicial
      if (response.data.length > 0) {
        setAnfitrion.Seleccionado(response.data[0].id_licencia); 
      }
    })
    .catch((error) => {
        console.log(error);
    });
  }

  const handleSubmit = async(e) => {
    e.preventDefault();
    setCargando(true);
    anfitrion.id_usuario = user.email;
    anfitrion.razon_social = user.name;
    anfitrion.telefono = anfitrion.telefono.replace(/\+/g, '');
    anfitrion.periodo = anfitrion.periodo_ano+'-'+anfitrion.periodo_mes;

    console.log(anfitrion);
    //Cambiooo para controlar Edicion
    /*if (editando){
      console.log(`${back_host}/contabilidad/${params.id}`);
      console.log(anfitrion);
      await fetch(`${back_host}/contabilidad/${params.id}`, {
        method: "PUT",
        body: JSON.stringify(anfitrion),
        headers: {"Content-Type":"application/json"}
      });
    }else{
      console.log(`${back_host}/contabilidad`);
      console.log(anfitrion);
      await fetch(`${back_host}/contabilidad`, {
        method: "POST",
        body: JSON.stringify(anfitrion),
        headers: {"Content-Type":"application/json"}
      });
    }*/

    setCargando(false);
    //navigate(`/contabilidad`);
  };
  
  //Aqui se leen parametros en caso lleguen
  useEffect( ()=> {
    if (params.id_anfitrion === params.id_invitado){
      //mostrarAnfitrion(params.id_usuario, params.documento_id);
      console.log('Anfitrionnnnn');
    }
    else{
      //Hasta aqui, ya fue invitado,porque existe id_anfitrion
      console.log('invitado');

      //examinemos si no existre anfitrion
    }

  },[]);

  //Evento change, recibe parametros de componente
  //en el mismo orden onChange(data.phone,data.country);
  const handleChange = (ePhoneNumber,eDataCountry) => {
    //console.log(ePhoneNumber);
    //console.log(eDataCountry.dialCode);
    
    setPhoneNumber(ePhoneNumber);
    setDialNumber(eDataCountry.dialCode);
    if (ePhoneNumber===('+'+eDataCountry.dialCode)){
      setNumberIncomplete(true);
    }else{
      setNumberIncomplete(false);
    }
    setAnfitrion({...anfitrion, ['telefono']: ePhoneNumber});
  }
  const handleChangeForm = (e) => {
    //documento_id unico procesado por el mmomento
    setAnfitrion({...anfitrion, [e.target.name]: e.target.value});
  }

  //funcion para mostrar data de formulario, modo edicion
  const mostrarAnfitrion = async (id_usuario,documento_id) => {
    console.log(`${back_host}/contabilidad/${id_usuario}/${documento_id}`);
    const res = await fetch(`${back_host}/contabilidad/${id_usuario}/${documento_id}`);
    const data = await res.json();
    //Actualiza datos para enlace con controles, al momento de modo editar
    setAnfitrion({
            documento_id:data.documento_id,       
            razon_social:data.razon_social, 
            activo:data.activo});
    console.log(data);
    setEditando(true);
  };
  

  return (
  <div>
    <form onSubmit={handleSubmit} >
    <Grid container spacing={0.5} style={{ marginTop: "0px" }}
      direction={isSmallScreen ? 'column' : 'column'}
      alignItems={isSmallScreen ? 'center' : 'center'}
      justifyContent={isSmallScreen ? 'center' : 'center'}
    >
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

          <Grid container spacing={0.5}
                            direction="column"
                            alignItems="center"
                            justifyContent="center"
          >
              <img
                    src={logo} // Usa la variable de importación para el logo
                    alt="Logo de la aplicación"
                    //style={centeredLogoStyle}
                    style={estiloAvatar}
              />
              
              <Typography variant='subtitle1' color='skyblue' textAlign='center'>
                  {(editando) ? (
                    "Editar Asiento"
                  ) : (
                    "Cuenta Anfitrión"
                  )}
              </Typography>

              <TextField variant="outlined" 
                                   fullWidth
                                   sx={{display:'block',
                                        margin:'.2rem 0'
                                        }}
                                    placeholder='Razon Social o Nombres Apellidos'
                                   name="email"
                                   size="small"
                                   value={user.email}
                                   //onChange={handleChange}
                                   inputProps={{ style:{color:'skyblue'} }}
                                   InputLabelProps={{ style:{color:'white'} }}
                                   InputProps={{
                                    startAdornment: (
                                      <InputAdornment position="start" sx={{ position: 'absolute', left: '0.5rem' }}>
                                        <MarkEmailReadIcon />
                                      </InputAdornment>
                                    ),
                                    style: {
                                      paddingLeft: '4.5rem' 
                                    }                                    
                                  }}                                   
              />

              <TextField variant="outlined" 
                                   fullWidth
                                   sx={{display:'block',
                                        margin:'.2rem 0',
                                        }}
                                    placeholder='Razon Social o Nombres Apellidos'
                                   name="razon_social"
                                   size="small"
                                   value={user.name}
                                   //onChange={handleChange}
                                   inputProps={{ style:{color:'skyblue', textTransform: 'uppercase'} }}
                                   InputLabelProps={{ style:{color:'white'} }}
                                   InputProps={{
                                    startAdornment: (
                                      <InputAdornment position="start" sx={{ position: 'absolute', left: '0.5rem' }}>
                                        <AccountCircle />
                                      </InputAdornment>
                                    ),
                                    style: {
                                      paddingLeft: '4.5rem' 
                                    }                                    
                                  }}                                   
              />
              <TextField variant="outlined" 
                                   fullWidth
                                   size="small"
                                   placeholder='DNI ó RUC'
                                   sx={{display:'block',
                                        margin:'.2rem 0',
                                        }}
                                   name="documento_id"
                                   value={anfitrion.documento_id}
                                   onChange={handleChangeForm}
                                   inputProps={{ style:{color:'white'} }}
                                   InputLabelProps={{ style:{color:'white'} }}
                                   InputProps={{
                                    startAdornment: (
                                      <InputAdornment position="start" sx={{ position: 'absolute', left: '0.5rem' }}>
                                        <FingerprintIcon/>
                                      </InputAdornment>
                                    ),
                                    style: {
                                      paddingLeft: '4.5rem' 
                                    }                                    
                                  }}                                   

              />

              <MuiPhone value={phoneNumber} onChange={handleChange} 
                              defaultCountry="pe"
                              fullWidth
                              size="small"
                              //onChange={handleChange}
                              //value={phoneNumber}
                              inputProps={{ style:{color:'white', textTransform: 'uppercase'} }}
                              //autoFocus
              />

              <FormControl fullWidth>
                  <Select
                        IconComponent={iconProps => (
                              <QueryBuilderIcon {...iconProps} style={{ fontSize: 24, marginRight: '330px' }} /> 
                            )}                  
                        size="small"
                        fullWidth
                        value={anfitrion.periodo_ano}
                        name="periodo_ano"
                        sx={{ display:'block',
                              margin:'.1rem 0', color: 'white', textAlign:'center',
                            }}
                        displayEmpty
                        onChange={handleChangeForm}
                      >
                            <MenuItem value="" disabled >
                              LICENCIA MENSUAL
                            </MenuItem>
                        {   
                            periodo_ano_select.map(elemento => (
                            <MenuItem key={elemento.ano} value={elemento.ano} >
                              {elemento.ano}
                            </MenuItem>)) 
                        }
                  </Select>
              </FormControl>

              <Grid container spacing={0.5} style={{ marginTop: "0px" }}
                direction='row'
                alignItems='center'
                justifyContent='center'
              >
                <Grid item xs={6}>
                <FormControl fullWidth>
                  <Select
                        IconComponent={iconProps => (
                              <CalendarViewDayIcon {...iconProps} style={{ fontSize: 24, marginRight: '140px' }} /> 
                            )}                  
                        size="small"
                        fullWidth
                        value={anfitrion.periodo_ano}
                        name="periodo_ano"
                        sx={{ display:'block',
                              margin:'.1rem 0', color: 'white', textAlign:'center',
                            }}
                        displayEmpty
                        onChange={handleChangeForm}
                      >
                            <MenuItem value="" disabled >
                              AÑO INICIO
                            </MenuItem>
                        {   
                            periodo_ano_select.map(elemento => (
                            <MenuItem key={elemento.ano} value={elemento.ano} >
                              {elemento.ano}
                            </MenuItem>)) 
                        }
                  </Select>
                </FormControl>
                </Grid>

                <Grid item xs={6}>
                <FormControl fullWidth>
                  <Select
                        IconComponent={iconProps => (
                          <EventIcon {...iconProps} style={{ fontSize: 24, marginRight: '140px' }} /> 
                        )}                  
                        size="small"
                        fullWidth
                        value={anfitrion.periodo_mes}
                        name="periodo_mes"
                        sx={{display:'block',
                        margin:'.1rem 0', color:"white", textAlign:'center'}}
                        displayEmpty
                        //inputProps={{ 'aria-label': 'Mes de Inicio' }}
                        onChange={handleChangeForm}
                      >
                            <MenuItem value="" disabled>
                              MES INICIO
                            </MenuItem>
                        {   
                            periodo_mes_select.map(elemento => (
                            <MenuItem key={elemento.mes} value={elemento.mes}>
                              {elemento.mes}
                            </MenuItem>)) 
                        }
                  </Select>
                </FormControl>
                </Grid>

              </Grid>

              <Grid item xs={12}>
              </Grid>
              <Grid item xs={12}>
              </Grid>

              <Button variant='contained' 
                  color='primary' 
                  type='submit'
                  fullWidth
                  disabled={
                            bNumberIncomplete ||
                            !anfitrion.documento_id ||
                            !anfitrion.periodo_ano ||
                            !anfitrion.periodo_mes
                            }
                  >
                  { cargando ? (
                  <CircularProgress color="inherit" size={24} />
                  ) : (
                    editando ?
                  'Modificar' : 'REGISTRAR')
                  }
              </Button>
                
          </Grid>


        </Card>
      
      
      
      
    </Grid>
     
    </form>
  </div>
  )
}
