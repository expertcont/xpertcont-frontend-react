import {Box, Container, Toolbar, Typography} from "@mui/material";
import {Grid,Select,MenuItem,useMediaQuery} from '@mui/material'
import {useNavigate} from "react-router-dom";
import IconButton from '@mui/material/IconButton';

import HomeIcon from '@mui/icons-material/Home';
import GradingIcon from '@mui/icons-material/Grading';
import InsertChartIcon from '@mui/icons-material/InsertChart';
import GroupIcon from '@mui/icons-material/Group';
import PaidIcon from '@mui/icons-material/Paid';
import axios from 'axios';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import { blueGrey } from '@mui/material/colors';
import Tooltip from '@mui/material/Tooltip';
import NextWeekIcon from '@mui/icons-material/NextWeek';
import SystemSecurityUpdateGoodIcon from '@mui/icons-material/SystemSecurityUpdateGood';
import UpdateIcon from '@mui/icons-material/Update';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import QrCodeIcon from '@mui/icons-material/QrCode';

import React, { useState } from 'react';
import LoginPerfil from "./LoginPerfil" //new
import LoginLogoutBoton from "./LoginLogoutBoton" //new
import { useAuth0 } from '@auth0/auth0-react'; //new para cargar permisos luego de verificar registro en bd
import { useEffect } from "react"
//import { Button } from "reactstrap";

export default function NavBar(props) {
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";  
  const navigate  = useNavigate();
  const isSmallScreen = useMediaQuery('(max-width: 600px)');
  const [selectedButton, setSelectedButton] = useState(null);
  
  const {user, isAuthenticated } = useAuth0();
  const [permisos, setPermisos] = useState([]); //Menu

  const [permisoVentas, setPermisoVentas] = useState(false);
  const [permisoCompras, setPermisoCompras] = useState(false);
  const [permisoCaja, setPermisoCaja] = useState(false);
  const [permisoDiario, setPermisoDiario] = useState(false);
  const [permisoReportes, setPermisoReportes] = useState(false);
  
  //Determina cargar icono o acceso en NavBar /////////////////////
  const [accesoAdmin, setAccesoAdmin] = useState(false);
  const [accesoCont, setAccesoCont] = useState(false);
  /////////////////////////////////////////////////////////////////

  const [permisoContabilidades, setPermisoContabilidades] = useState(false);
  const [permisoTipoCambio, setPermisoTipoCambio] = useState(false);
  const [permisoCorrentista, setPermisoCorrentista] = useState(false);
  const [permisoCentroCosto, setPermisoCentroCosto] = useState(false);
  const [permisoSeguridad, setPermisoSeguridad] = useState(false);

  const [periodo_trabajo, setPeriodoTrabajo] = useState("");
  const [periodo_select,setPeriodosSelect] = useState([]);

  const [contabilidad_trabajo, setContabilidadTrabajo] = useState("");
  const [contabilidad_select,setContabilidadesSelect] = useState([]);
  
    const handleClick = (buttonId) => {
    setSelectedButton(buttonId);
  }

  const handleChange = e => {
    //Para todos los demas casos ;)
    if (e.target.name==="periodo"){
      setPeriodoTrabajo(e.target.value);
    }
    if (e.target.name==="contabilidad"){
      setContabilidadTrabajo(e.target.value);
    }

  }

  //////////////////////////////////////////////////////////
  useEffect(() => {
    if (isAuthenticated && user && user.email) {
      //Actualizar variables de estado CONT o ADMIN
      //Carga dual de sistema 
      cargaModulosAnfitrion();

      // cargar permisos de sistema
      cargaPermisosMenu();
      console.log("idAnfitrion: ", props.idAnfitrion);
      console.log("idInvitado: ",props.idInvitado);
      
      //Verificar Estudios Contables registrados
      cargaPeriodosAnfitrion();

      //Solo carga ultima contabilidad habilitada
      //Luego se controla si se paso de limites, al momento de procesar
      cargaContabilidadesAnfitrion();
      /////////////////////////////
    }
  }, [isAuthenticated, user]);


  //////////////////////////////////////////////////////////
  const cargaModulosAnfitrion = () =>{
    axios
    .get(`${back_host}/usuario/modulos/${props.idAnfitrion}/${props.idInvitado}`)
    .then((response) => {
      if (response.data.length > 0) {
        setAccesoAdmin(response.data.some(item =>item.tipo==='ADMIN'));
        setAccesoCont(response.data.some(item =>item.tipo==='CONT'));
        console.log('modulos: ',response.data);
      }
    })
    .catch((error) => {
        console.log(error);
    });
  }

  const cargaPeriodosAnfitrion = () =>{
    axios
    .get(`${back_host}/usuario/periodos/${props.idAnfitrion}`)
    .then((response) => {
      setPeriodosSelect(response.data);
      //Establecer 1er elemento en select//////////////////////
      if (response.data.length > 0) {
        setPeriodoTrabajo(response.data[0].periodo); 
        console.log('setPeriodoTrabajo: ',response.data[0].periodo);
      }
      /////////////////////////////////////////////////////////
    })
    .catch((error) => {
        console.log(error);
    });
  }
  const cargaContabilidadesAnfitrion = () =>{
    //console.log(`${back_host}/usuario/contabilidades/${props.idAnfitrion}/${props.idInvitado}`);
    axios
    //Aqui debemos agregar restriccion de contabilidad por(usuario auxiliar)
    .get(`${back_host}/usuario/contabilidades/${props.idAnfitrion}/${props.idInvitado}`)
    .then((response) => {
      setContabilidadesSelect(response.data);
        //Establecer 1er elemento en select//////////////////////
        if (response.data.length > 0) {
          setContabilidadTrabajo(response.data[0].documento_id); 
          console.log('setContabilidadTrabajo: ',response.data[0].documento_id);
        }
        /////////////////////////////////////////////////////////
    })
    .catch((error) => {
        console.log(error);
    });
  }

  //////////////////////////////////////////////////////////
  const cargaPermisosMenu = async()=>{
      //Si es el usuario anfitrion, tiene acceso a todo
      if (props.idAnfitrion === props.idInvitado){
        //New dual
        setAccesoCont(true);
        setAccesoAdmin(true);
        //
        setPermisoVentas(true);
        setPermisoCompras(true);
        setPermisoCaja(true);
        setPermisoDiario(true);
        setPermisoReportes(true);
        setPermisoContabilidades(true);
        setPermisoTipoCambio(true);
        setPermisoCorrentista(true);
        setPermisoCentroCosto(true);
        setPermisoSeguridad(true);
      }
      else {
        //console.log(`${back_host}/seguridadmenu/${props.idAnfitrion}/${props.idInvitado}`);
        //Realiza la consulta a la API de permisos, puro Menu (obtenerTodosMenu)
        fetch(`${back_host}/seguridadmenu/${props.idAnfitrion}/${props.idInvitado}`, {
          method: 'GET',
          //headers: {
          //  'Authorization': 'TOKEN_DE_AUTORIZACION' // Si es necesario
          // }
        })
        .then(response => response.json())
        .then(permisosData => {
          // Guarda los permisos en el estado
          setPermisos(permisosData);
      
          let tienePermiso;
          // Verifica si existe el permiso de acceso 'ventas'
          tienePermiso = permisosData.some(permiso => permiso.id_menu === '01');
          if (tienePermiso) {
            setPermisoVentas(true);
            //console.log("permisos Ventas: ", user.email, permisoVentas);
          }
          tienePermiso = permisosData.some(permiso => permiso.id_menu === '02');
          if (tienePermiso) {
            setPermisoCompras(true);
            //console.log("permisos Ocarga: ", user.email);
          }
          tienePermiso = permisosData.some(permiso => permiso.id_menu === '03');
          if (tienePermiso) {
            setPermisoCaja(true);
          }
          tienePermiso = permisosData.some(permiso => permiso.id_menu === '04');
          if (tienePermiso) {
            setPermisoDiario(true);
          }
          tienePermiso = permisosData.some(permiso => permiso.id_menu === '05');
          if (tienePermiso) {
            setPermisoReportes(true);
          }
          tienePermiso = permisosData.some(permiso => permiso.id_menu === '06');
          if (tienePermiso) {
            setPermisoContabilidades(true);
          }
          tienePermiso = permisosData.some(permiso => permiso.id_menu === '07');
          if (tienePermiso) {
            setPermisoTipoCambio(true);
          }
          tienePermiso = permisosData.some(permiso => permiso.id_menu === '08');
          if (tienePermiso) {
            setPermisoCorrentista(true);
          }
          tienePermiso = permisosData.some(permiso => permiso.id_menu === '09');
          if (tienePermiso) {
            setPermisoCentroCosto(true);
          }
          tienePermiso = permisosData.some(permiso => permiso.id_menu === '10');
          if (tienePermiso) {
            setPermisoSeguridad(true);
          }
        })
        .catch(error => {
          console.log('Error al obtener los permisos:', error);
        });
      }
  }

  return (
    <Box sx={{ flexGrow:1 }} >
        <Container>
            <Toolbar>

                    <IconButton  
                        sx={{
                          color: selectedButton === 'icono00' ? 'primary.main' : blueGrey[300],flexGrow:1
                        }}
                        aria-label="upload picture" component="label" size="large"
                                onClick = {()=> {
                                  navigate(`/${props.idAnfitrion}/${props.idInvitado}`);
                                  handleClick('icono00');
                                                }
                                }
                    >
                      <LoginPerfil></LoginPerfil>
                    </IconButton>

                    <IconButton  
                        sx={{
                          color: blueGrey[300],flexGrow:1
                        }}
                        aria-label="upload picture" component="label" size="large"
                                onClick = {()=> {
                                  navigate(`/${props.idAnfitrion}/${props.idInvitado}`);
                                                }
                                }
                    >
                    <LoginLogoutBoton></LoginLogoutBoton>
                    </IconButton>
                  
                    <IconButton  
                        sx={{
                          color: selectedButton === 'icono01' ? 'primary.main' : blueGrey[300],flexGrow:1
                        }}
                        aria-label="upload picture" component="label" size="large"
                                onClick = {()=> {
                                  navigate(`/${props.idAnfitrion}/${props.idInvitado}`);
                                  handleClick('icono01');
                                                }
                                }
                    >
                      <HomeIcon />
                    </IconButton>

                    { accesoAdmin ?
                    (
                    <Tooltip title="ADMIN Ventas">
                    <IconButton  
                        sx={{
                          color: selectedButton === 'icono02' ? 'primary.main' : blueGrey[300],flexGrow:1
                        }}
                        aria-label="upload picture" component="label" size="large"
                                onClick = {()=> {
                                    //el ventalist se encargara de verificar permisos Comandos, con email
                                    //cuidado estamos enviando el periodo y el ruc de la contabilidad inicial del anfitrion
                                    console.log(`/ad_venta/${props.idAnfitrion}/${props.idInvitado}/${periodo_trabajo}/${contabilidad_trabajo}`);
                                    navigate(`/ad_venta/${props.idAnfitrion}/${props.idInvitado}/${periodo_trabajo}/${contabilidad_trabajo}`);
                                    handleClick('icono02');
                                                }
                                }
                    >
                      <ShoppingCartIcon />
                    </IconButton>
                    </Tooltip>
                    ):(
                      <span></span>
                    )
                    }
                    { accesoAdmin ?
                    (
                    <Tooltip title="ADMIN Productos">
                    <IconButton  
                        sx={{
                          color: selectedButton === 'icono03' ? 'primary.main' : blueGrey[300],flexGrow:1
                        }}
                        aria-label="upload picture" component="label" size="large"
                                onClick = {()=> {
                                    //el ventalist se encargara de verificar permisos Comandos, con email
                                    //cuidado estamos enviando el periodo y el ruc de la contabilidad inicial del anfitrion
                                    navigate(`/ad_producto/${props.idAnfitrion}/${props.idInvitado}/${contabilidad_trabajo}`);
                                    handleClick('icono03');
                                                }
                                }
                    >
                      <QrCodeIcon />
                    </IconButton>
                    </Tooltip>
                    ):(
                      <span></span>
                    )
                    }



                    { 
                    ((permisoVentas || permisoCompras || permisoCaja || permisoDiario)) ?
                    //((permisoVentas || permisoCompras || permisoCaja || permisoDiario) && accesoCont) ?
                    (
                    <Tooltip title="REGISTRO Asientos">
                    <IconButton  
                        sx={{
                          color: selectedButton === 'icono04' ? 'primary.main' : blueGrey[300],flexGrow:1
                        }}
                        aria-label="upload picture" component="label" size="large"
                                onClick = {()=> {
                                    //el ventalist se encargara de verificar permisos Comandos, con email
                                    //cuidado estamos enviando el periodo y el ruc de la contabilidad inicial del anfitrion
                                    //console.log(`/asiento/${props.idAnfitrion}/${props.idInvitado}/${periodo_trabajo}/${contabilidad_trabajo}`);
                                    navigate(`/asiento/${props.idAnfitrion}/${props.idInvitado}/${periodo_trabajo}/${contabilidad_trabajo}`);
                                    handleClick('icono04');
                                                }
                                }
                    >
                      <Typography variant="subtitle2" sx={{ ml: 1 }}>
                      A
                      </Typography>                    
                      <GradingIcon />
                    </IconButton>
                    </Tooltip>
                    ):(
                      <span></span>
                    )
                    }

                    { permisoReportes ?
                    (
                    <Tooltip title="REPORTES">
                    <IconButton  
                        sx={{
                          color: selectedButton === 'icono05' ? 'primary.main' : blueGrey[300],flexGrow:1
                        }}
                        color="primary" aria-label="upload picture" component="label" size="large"
                                onClick = {()=> {
                                  navigate(`/reporte/${props.idAnfitrion}/${props.idInvitado}`);
                                  handleClick('icono05');
                                                }
                                }
                    >
                      <Typography variant="subtitle2" sx={{ ml: 1 }}>
                      R
                      </Typography>                    
                      <InsertChartIcon />
                    </IconButton>
                    </Tooltip>
                    ):(
                      <span></span>
                    )
                    }

                    { permisoContabilidades ?
                    (
                    <Tooltip title="Panel 01 CONTABILIDADES">
                    <IconButton  
                        sx={{
                          color: selectedButton === 'icono06' ? 'primary.main' : blueGrey[300],flexGrow:1
                        }}
                                component="label" size="large" color="success"
                                onClick = {()=> {
                                  navigate(`/contabilidades/${props.idAnfitrion}/${props.idInvitado}`);
                                  handleClick('icono06');
                                                }
                                }
                    >
                      <Typography variant="subtitle2" sx={{ ml: 1 }}>
                      01
                      </Typography>                    
                      <NextWeekIcon />
                    </IconButton>
                    </Tooltip>
                    ):(
                      <span></span>
                    )
                    }

                    { permisoTipoCambio ?
                    (
                    <Tooltip title="Panel 02 TIPO-CAMBIO">
                    <IconButton  
                        sx={{
                          color: selectedButton === 'icono07' ? 'primary.main' : blueGrey[300],flexGrow:1
                        }}
                        aria-label="upload picture" component="label" size="large"
                                onClick = {()=> {
                                  navigate(`/correntista`);
                                  handleClick('icono07');
                                                }
                                }
                    >
                      <Typography variant="subtitle2" sx={{ ml: 1 }}>
                      02
                      </Typography>                    
                      <PaidIcon />
                    </IconButton>
                    </Tooltip>
                    ):(
                      <span></span>
                    )
                    }


                    { permisoCentroCosto ?
                    (
                    <Tooltip title="Panel 03 CENTRO COSTOS">
                    <IconButton  
                        sx={{
                          color: selectedButton === 'icono08' ? 'primary.main' : blueGrey[300],flexGrow:1
                        }}
                        aria-label="upload picture" component="label" size="large"
                                onClick = {()=> {
                                  navigate(`/producto`);
                                  handleClick('icono08');
                                                }
                                }
                    >
                      <Typography variant="subtitle2" sx={{ ml: 1 }}>
                      03
                      </Typography>                    
                      <CenterFocusStrongIcon />
                    </IconButton>
                    </Tooltip>
                    ):(
                      <span></span>
                    )
                    }

                    { permisoSeguridad ?
                    (
                    <Tooltip title="Panel 04 SEGURIDAD USUARIOS">
                    <IconButton  
                        sx={{
                          color: selectedButton === 'icono09' ? 'primary.main' : blueGrey[300],flexGrow:1
                        }}
                        aria-label="upload picture" component="label" size="large"
                                onClick = {()=> {
                                  navigate(`/seguridad/${props.idAnfitrion}`);
                                  handleClick('icono09');
                                                }
                                }
                    >
                      <Typography variant="subtitle2" sx={{ ml: 1 }}>
                      04
                      </Typography>                    
                      <SystemSecurityUpdateGoodIcon />
                    </IconButton>
                    </Tooltip>
                    ):(
                      <span></span>
                    )
                    }


            </Toolbar>


        </Container>
    </Box>
  );
}
