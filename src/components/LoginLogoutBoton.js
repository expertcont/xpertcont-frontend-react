import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import {Button} from '@mui/material'
import ButtonGroup from '@mui/material/ButtonGroup';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import LogoutIcon from '@mui/icons-material/Logout';

// Crear un tema personalizado
const theme = createTheme({
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            backgroundColor: 'darkslategrey', // Cambia el color de fondo del botón aquí
            color: 'white', // Cambia el color de texto del botón aquí
            // Agrega otros estilos personalizados según tus necesidades
          },
        },
      },
    },
  });

const LoginLogoutBoton = () => {
    const {loginWithRedirect,logout} = useAuth0();
    const {user, isAuthenticated } = useAuth0();
    return( 
        <ButtonGroup variant="contained" aria-label="outlined primary button group">
            { isAuthenticated ?
            (
            <ThemeProvider theme={theme}>
            <Button variant='contained' onClick={()=>{logout();}} endIcon={<LogoutIcon />}>out</Button>
            </ThemeProvider>
            ):
            (
            <Button variant='contained' color='info' onClick={()=>{loginWithRedirect();}} >LOGIN</Button>
            )
            }
        </ButtonGroup>
    );
};

export default LoginLogoutBoton;