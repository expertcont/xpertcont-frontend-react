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

const LoginLogoutBoton = ({ sidebar = false, compact = false }) => {
    const {loginWithRedirect,logout} = useAuth0();
    const {user, isAuthenticated } = useAuth0();

    if (sidebar) {
        return (
            <ButtonGroup
                variant="contained"
                aria-label="boton de sesion"
                sx={{
                    width: compact ? "auto" : "100%",
                    display: "flex",
                    justifyContent: "center",
                    boxShadow: "none",
                    "& .MuiButtonGroup-grouped": {
                        border: 0,
                    },
                }}
            >
                {isAuthenticated ? (
                    <Button
                        variant="contained"
                        onClick={() => { logout(); }}
                        endIcon={compact ? null : <LogoutIcon />}
                        sx={{
                            minWidth: compact ? 42 : "100%",
                            maxWidth: compact ? 42 : 132,
                            height: compact ? 42 : 38,
                            px: compact ? 0 : 1.5,
                            borderRadius: compact ? "12px !important" : "10px !important",
                            backgroundColor: "rgba(42,161,152,0.16)",
                            color: "#dff7f3",
                            border: "1px solid rgba(42,161,152,0.35)",
                            fontSize: compact ? 0 : "12px",
                            fontWeight: 800,
                            letterSpacing: 0,
                            textTransform: "none",
                            boxShadow: "none",
                            justifyContent: "center",
                            "&:hover": {
                                backgroundColor: "#2aa198",
                                color: "#ffffff",
                                boxShadow: "0 8px 18px rgba(42,161,152,0.18)",
                            },
                        }}
                    >
                        {compact ? <LogoutIcon fontSize="small" /> : "Salir"}
                    </Button>
                ) : (
                    <Button
                        variant="contained"
                        color="info"
                        onClick={() => { loginWithRedirect(); }}
                        sx={{
                            minWidth: compact ? 42 : "100%",
                            maxWidth: compact ? 42 : 132,
                            height: compact ? 42 : 38,
                            px: compact ? 0 : 1.5,
                            borderRadius: compact ? "12px !important" : "10px !important",
                            fontSize: compact ? 0 : "12px",
                            fontWeight: 800,
                            textTransform: "none",
                            boxShadow: "none",
                            justifyContent: "center",
                        }}
                    >
                        {compact ? "In" : "Ingresar"}
                    </Button>
                )}
            </ButtonGroup>
        );
    }

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
