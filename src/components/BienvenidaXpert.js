import React from 'react';
import logo from '../Logo04small-retocado-teal.png'; // Importa el logo
import {Grid,Card,Select,MenuItem,CardContent,Typography,Button,Box} from '@mui/material'
import { useAuth0 } from '@auth0/auth0-react'; //new para cargar permisos luego de verificar registro en bd
import {useState,useEffect} from 'react';
import axios from 'axios';
import LoginPerfil from "./LoginPerfil" //new
import LoginLogoutBoton from "./LoginLogoutBoton" //new
import palette from '../theme/palette';


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
      const estudio = estudios_select.find((item) => item.id_usuario === e.target.value);
      if (estudio?.rubro) {
        sessionStorage.setItem('rubro_trabajo', estudio.rubro);
      }
      sessionStorage.setItem('super', estudio?.super || '0');
    }
  
    const cargaEstudiosAnfitrion = () =>{
      console.log(`${back_host}/usuario/estudios/${user.email}`);
      axios
      .get(`${back_host}/usuario/estudios/${user.email}`)
      .then((response) => {
        //Cargar Arreglo
        setEstudioSelect(response.data);
        // Establece el primer valor del arreglo como valor inicial
        if (response.data.length > 0) {
          setAnfitrionSeleccionado(response.data[0].id_usuario); 
          sessionStorage.setItem('rubro_trabajo', response.data[0].rubro || 'COMERCIAL');
          sessionStorage.setItem('super', response.data[0].super || '0');
        }
      })
      .catch((error) => {
          console.log(error);
      });
    }

        
    const centeredLogoStyle = {
      display: 'block',
      width: 'min(260px, 76vw)',
      maxHeight: '150px',
      objectFit: 'contain',
      margin: '0 auto',
    };
    
    return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 4,
        background: `radial-gradient(circle at 50% 0%, rgba(42,161,152,0.16), transparent 34%), linear-gradient(180deg, ${palette.bg} 0%, #11181d 100%)`,
      }}
    >

      <div></div>
    <Grid container spacing={2}
          direction="column"
          alignItems="center"
          justifyContent="center"
    >
      <Grid item xs={3}
      >
            <Card
                  sx={{
                    mt: 1,
                    width: 'min(430px, calc(100vw - 32px))',
                    background: `linear-gradient(180deg, ${palette.surfaceAlt} 0%, ${palette.surface} 100%)`,
                    border: `1px solid ${palette.border}`,
                    borderRadius: '8px',
                    boxShadow: '0 22px 70px rgba(0,0,0,0.34)',
                    overflow: 'hidden',
                  }}
            >
                <Box
                  sx={{
                    px: 3,
                    pt: 2.5,
                    pb: 1.5,
                    borderBottom: `1px solid ${palette.borderSoft}`,
                    textAlign: 'center',
                  }}
                >
                <Typography
                  variant='h5'
                  sx={{
                    color: palette.text,
                    fontSize: '21px',
                    fontWeight: 800,
                    lineHeight: 1.18,
                  }}
                >
                    Facturación/Contabilidad Móvil
                </Typography>
                <Typography sx={{ color: palette.muted, fontSize: '12px', mt: 0.6 }}>
                  XpertCont
                </Typography>
                </Box>
                
                <CardContent sx={{ px: 3, py: 2.5 }}>
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

                      <Box
                        sx={{
                          my: 2,
                          py: 2,
                          px: 1.5,
                          borderRadius: '8px',
                          backgroundColor: palette.accentSoft,
                          border: '1px solid rgba(42,161,152,0.26)',
                        }}
                      >
                        <img
                          src={logo} // Usa la variable de importación para el logo
                          alt="Logo de la aplicación"
                          style={centeredLogoStyle}
                        />
                      </Box>

                      { isAuthenticated ? 
                      ( <>
                       <Select
                              labelId="estudios_select"
                              size="small"
                              //id={tipo_op}
                              value={idAnfitrionSeleccionado}
                              name="estudios_select"
                              sx={{
                                display:'block',
                                margin:'.1rem 0',
                                color: palette.text,
                                textAlign:'center',
                                backgroundColor: palette.chip,
                                borderRadius: '8px',
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: palette.border,
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: palette.accent,
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: palette.accent,
                                },
                                '& .MuiSelect-icon': {
                                  color: palette.muted,
                                },
                              }}
                              MenuProps={{
                                PaperProps: {
                                  sx: {
                                    backgroundColor: palette.surface,
                                    color: palette.text,
                                    border: `1px solid ${palette.border}`,
                                    '& .MuiMenuItem-root:hover': {
                                      backgroundColor: palette.accentSoft,
                                    },
                                  },
                                },
                              }}
                              //label="Operacion"
                              onChange={handleChange}
                            >
                              {   
                                  estudios_select.map(elemento => (
                                  <MenuItem key={elemento.id_usuario} value={elemento.id_usuario} >
                                    {elemento.razon_social}
                                  </MenuItem>)) 
                              }
                      </Select>

                      <Button variant='contained' 
                                              color='primary' 
                                              onClick={() => {
                                                // Devolvemos los props actualizados
                                                const estudio = estudios_select.find((item) => item.id_usuario === idAnfitrionSeleccionado);
                                                const rubro = estudio?.rubro || sessionStorage.getItem('rubro_trabajo') || 'COMERCIAL';
                                                const superAcceso = estudio?.super || sessionStorage.getItem('super') || '0';
                                                sessionStorage.setItem('rubro_trabajo', rubro);
                                                sessionStorage.setItem('super', superAcceso);
                                                onStartClick(idAnfitrionSeleccionado, user.email, rubro, superAcceso);
                                              }}                                              
                                              fullWidth
                                              sx={{
                                                display:'block',
                                                margin:'.8rem 0 0',
                                                py: 1.05,
                                                borderRadius: '8px',
                                                backgroundColor: palette.accent,
                                                color: palette.bg,
                                                fontWeight: 900,
                                                boxShadow: 'none',
                                                '&:hover': {
                                                  backgroundColor: '#7ddbd3',
                                                  boxShadow: '0 10px 24px rgba(42,161,152,0.2)',
                                                },
                                              }}
                                              //sx={{margin:'.5rem 0', height:55}}
                                              >
                      INGRESAR
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

    </Box>
  );
};

export default BienvenidaXpert;
