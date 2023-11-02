import React from 'react';
import logo from '../Logo02.png'; // Importa el logo
import {Grid,Card,CardContent,Typography,TextField,Button,CircularProgress,Select,MenuItem,InputLabel,Box,FormControl, List,ListItem,ListItemText,Dialog,DialogContent,DialogTitle} from '@mui/material'
import { useAuth0 } from '@auth0/auth0-react'; //new para cargar permisos luego de verificar registro en bd
import {useState,useEffect} from 'react';
import axios from 'axios';
import LoginPerfil from "./LoginPerfil" //new
import LoginLogoutBoton from "./LoginLogoutBoton" //new


const BienvenidaXpert = ({ onStartClick }) => {
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
  const {user, isAuthenticated } = useAuth0();
  const [estudios_select,setEstudioSelect] = useState([]);

  const [idAnfitrionSeleccionado, setAnfitrionSeleccionado] = useState('');

    //Aqui se leen parametros en caso lleguen
    useEffect( ()=> {
      if (isAuthenticated && user && user.email) {
        //Verificar Estudios Contables registrados
        cargaEstudiosAnfitrion();

      }  
    },[isAuthenticated, user]);

    const handleChange = e => {
      setAnfitrionSeleccionado(e.target.value);
    }
  
    const cargaEstudiosAnfitrion = () =>{
      axios
      .get(`${back_host}/usuario/estudios/${user.email}`)
      .then((response) => {
        //Cargar Arreglo
        setEstudioSelect(response.data);
        // Establece el primer valor del arreglo como valor inicial
        if (response.data.length > 0) {
          setAnfitrionSeleccionado(response.data[0].id_usuario); 
        }
      })
      .catch((error) => {
          console.log(error);
      });
    }

        
    const centeredLogoStyle = {
      display: 'block',
      margin: '0 auto', // Esto centra horizontalmente la imagen
      borderRadius: '5%', // Esto redondea los bordes de la imagen (puedes ajustar el valor)
      //width: '200px', // Ajusta el ancho de la imagen según tus necesidades
      //height: '200px', // Ajusta la altura de la imagen según tus necesidades
      //backgroundColor: 'rgba(0, 0, 0, 0.5)' // Esto agrega transparencia al fondo blanco (ajusta el valor alpha)
    };
    
    return (
    <div>

      <div></div>
    <Grid container spacing={2}
          direction="column"
          alignItems="center"
          justifyContent="center"
    >
      <Grid item xs={3}
      >
            <Card sx={{mt:1}}
                  style={{
                    background:'#1e272e',
                    //maxWidth: '400px', // Ajusta este valor según tu preferencia
                    padding:'1rem'
                  }}
                  >
                <Typography variant='h5' color='white' textAlign='center'>
                    Bienvenido
                </Typography>
                
                <CardContent >
                      <Grid container spacing={0.5}
                            direction="column"
                            //alignItems="center"
                            justifyContent="center"
                      >

                      <Grid container spacing={0.5}
                            direction="column"
                            alignItems="center"
                            justifyContent="center"
                      >
                          <Grid item xs={12}>
                              <LoginPerfil ></LoginPerfil>                
                          </Grid>
                          <Grid item xs={12}>
                              <LoginLogoutBoton ></LoginLogoutBoton>
                          </Grid>
                      </Grid>

                      <img
                        src={logo} // Usa la variable de importación para el logo
                        alt="Logo de la aplicación"
                        style={centeredLogoStyle}
                      />

                      { isAuthenticated ? 
                      ( <>
                       <Select
                              labelId="estudios_select"
                              size="small"
                              //id={tipo_op}
                              value={idAnfitrionSeleccionado}
                              name="estudios_select"
                              sx={{display:'block',
                              margin:'.1rem 0', color:"white", textAlign:'center'}}
                              //label="Operacion"
                              onChange={handleChange}
                            >
                              {   
                                  estudios_select.map(elemento => (
                                  <MenuItem key={elemento.id_usuario} value={elemento.id_usuario} >
                                    {elemento.nombres}
                                  </MenuItem>)) 
                              }
                      </Select>

                      <Button variant='contained' 
                                              color='primary' 
                                              //onClick={onStartClick}
                                              onClick={() => {
                                                // Devolvemos los props actualizados
                                                onStartClick(idAnfitrionSeleccionado, user.email);
                                              }}                                              
                                              fullWidth
                                              sx={{display:'block',margin:'.5rem 0'}}
                                              //sx={{margin:'.5rem 0', height:55}}
                                              >
                      INGRESAR CONTABILIDAD
                      </Button>

                      </>
                      ): (<></>)
                      }

                          <Grid container spacing={0}
                                //direction="column"
                                alignItems="center"
                                justifyContent="left"
                          >
                              <Grid item xs={10}>

                              </Grid>

                              <Grid item xs={1}>

                              </Grid>
                              <Grid item xs={0.5}>

                              </Grid>

                          </Grid>

                      </Grid>

                </CardContent>
            </Card>
      </Grid>

    </Grid>

    </div>
  );
};

export default BienvenidaXpert;
