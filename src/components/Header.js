import { Box, AppBar, Toolbar, Typography } from '@mui/material';
import { useMediaQuery, useTheme } from '@mui/material';
import logo from '../Logo04small.png'; // Importa el logo

export default function Header() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const aumentoPorcentaje = 70; // Puedes ajustar este valor según tus necesidades
  const estiloAvatar = {
    width: `${aumentoPorcentaje}%`,
    height: `${aumentoPorcentaje}%`,
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        //backgroundColor: '#1e272e',
        backgroundColor: '#242e36ff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        //borderBottom: '1px solid #073642',
        // En desktop, dejamos espacio para el sidebar
        marginLeft: isMobile ? 0 : '80px', // Ajusta según el ancho colapsado del sidebar
        width: isMobile ? '100%' : 'calc(100% - 250px)', // Ajusta según el ancho colapsado
        zIndex: 1200, // Menor que el sidebar pero mayor que el contenido
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '64px',
        }}
      >
        {/* Opción 1: Logo como imagen */}
        <Box
          //component="img"
          //src={logo} // Cambia esta ruta por tu logo
          //alt="Logo"
          //sx={{
          //  height: '50px',
            //maxHeight: '50px',
          //  objectFit: 'contain',
          //}}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: -10
            //minHeight: '64px',
          }}
        >
              <img
                    src={logo} // Usa la variable de importación para el logo
                    alt="Logo de la aplicación"
                    //style={centeredLogoStyle}
                    style={estiloAvatar}
              />

        </Box>
        {/* Opción 2: Logo como texto (descomenta si prefieres texto) */}
        {/* <Typography
          variant="h5"
          sx={{
            color: '#2aa198',
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          TU EMPRESA
        </Typography> */}

        {/* Opción 3: Logo + Texto combinado (descomenta si prefieres ambos) */}
        {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            component="img"
            src="/path/to/your/logo.png"
            alt="Logo"
            sx={{
              height: '40px',
              objectFit: 'contain',
            }}
          />
          <Typography
            variant="h5"
            sx={{
              color: '#2aa198',
              fontWeight: 700,
            }}
          >
            TU EMPRESA
          </Typography>
        </Box> */}
      </Toolbar>
    </AppBar>
  );
}