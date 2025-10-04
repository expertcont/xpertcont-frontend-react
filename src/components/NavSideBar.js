import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Typography, useMediaQuery, Divider, IconButton, useTheme, Fab, Collapse } from "@mui/material";
import { useNavigate } from "react-router-dom";
import HomeIcon from '@mui/icons-material/Home';
import GradingIcon from '@mui/icons-material/Grading';
import InsertChartIcon from '@mui/icons-material/InsertChart';
import PaidIcon from '@mui/icons-material/Paid';
import axios from 'axios';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import { blueGrey } from '@mui/material/colors';
import NextWeekIcon from '@mui/icons-material/NextWeek';
import SystemSecurityUpdateGoodIcon from '@mui/icons-material/SystemSecurityUpdateGood';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import QrCodeIcon from '@mui/icons-material/QrCode';
import HolidayVillageIcon from '@mui/icons-material/HolidayVillage';
import MenuIcon from '@mui/icons-material/Menu';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import CloseIcon from '@mui/icons-material/Close';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import React, { useState, useEffect } from 'react';
import LoginPerfil from "./LoginPerfil";
import LoginLogoutBoton from "./LoginLogoutBoton";
import { useAuth0 } from '@auth0/auth0-react';

const drawerWidthExpanded = 240;
const drawerWidthCollapsed = 80;

// Fuente personalizada para todo el Sidebar
//const sidebarFont = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const sidebarFont = 'Montserrat, sans-serif';
//const sidebarFont = 'IBM Plex Sans, sans-serif';

export default function NavSideBar(props) {
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";  
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedButton, setSelectedButton] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const { user, isAuthenticated } = useAuth0();
  const [permisos, setPermisos] = useState([]);

  const [permisoVentas, setPermisoVentas] = useState(false);
  const [permisoCompras, setPermisoCompras] = useState(false);
  const [permisoCaja, setPermisoCaja] = useState(false);
  const [permisoDiario, setPermisoDiario] = useState(false);
  const [permisoReportes, setPermisoReportes] = useState(false);
  
  const [accesoAdmin, setAccesoAdmin] = useState(false);
  const [accesoCont, setAccesoCont] = useState(false);

  const [permisoContabilidades, setPermisoContabilidades] = useState(false);
  const [permisoTipoCambio, setPermisoTipoCambio] = useState(false);
  const [permisoCorrentista, setPermisoCorrentista] = useState(false);
  const [permisoCentroCosto, setPermisoCentroCosto] = useState(false);
  const [permisoSeguridad, setPermisoSeguridad] = useState(false);

  const [periodo_trabajo, setPeriodoTrabajo] = useState("");
  const [periodo_select, setPeriodosSelect] = useState([]);

  const [contabilidad_trabajo, setContabilidadTrabajo] = useState("");
  const [contabilidad_select, setContabilidadesSelect] = useState([]);
  
  const [openStocks, setOpenStocks] = useState(false);
  
  const handleClick = (buttonId) => {
    setSelectedButton(buttonId);
    if (isMobile) {
      setMobileOpen(false);
    }
  }

  const toggleDrawer = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setIsExpanded(!isExpanded);
    }
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleStocksClick = () => {
    setOpenStocks(!openStocks);
  };

  useEffect(() => {
    if (isAuthenticated && user && user.email) {
      cargaModulosAnfitrion();
      cargaPermisosMenu();
      console.log("idAnfitrion: ", props.idAnfitrion);
      console.log("idInvitado: ", props.idInvitado);
      cargaPeriodosAnfitrion();
      cargaContabilidadesAnfitrion();
    }
  }, [isAuthenticated, user]);

  const cargaModulosAnfitrion = () => {
    axios
      .get(`${back_host}/usuario/modulos/${props.idAnfitrion}/${props.idInvitado}`)
      .then((response) => {
        if (response.data.length > 0) {
          if (!accesoAdmin) {
            setAccesoAdmin(response.data.some(item => item.tipo === 'ADMIN'));
          }
          if (!accesoCont) {
            setAccesoCont(response.data.some(item => item.tipo === 'CONT'));
          }
          console.log('modulos: ', response.data);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  const cargaPeriodosAnfitrion = () => {
    axios
      .get(`${back_host}/usuario/periodos/${props.idAnfitrion}`)
      .then((response) => {
        setPeriodosSelect(response.data);
        if (response.data.length > 0) {
          setPeriodoTrabajo(response.data[0].periodo);
          console.log('setPeriodoTrabajo: ', response.data[0].periodo);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  const cargaContabilidadesAnfitrion = () => {
    axios
      .get(`${back_host}/usuario/contabilidades/${props.idAnfitrion}/${props.idInvitado}`)
      .then((response) => {
        setContabilidadesSelect(response.data);
        if (response.data.length > 0) {
          setContabilidadTrabajo(response.data[0].documento_id);
          console.log('setContabilidadTrabajo: ', response.data[0].documento_id);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  const cargaPermisosMenu = async () => {
    if (props.idAnfitrion === props.idInvitado) {
      setAccesoCont(true);
      setAccesoAdmin(true);
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
    } else {
      fetch(`${back_host}/seguridadmenu/${props.idAnfitrion}/${props.idInvitado}`, {
        method: 'GET',
      })
        .then(response => response.json())
        .then(permisosData => {
          setPermisos(permisosData);
          let tienePermiso;
          tienePermiso = permisosData.some(permiso => permiso.id_menu === '01');
          if (tienePermiso) setPermisoVentas(true);
          tienePermiso = permisosData.some(permiso => permiso.id_menu === '02');
          if (tienePermiso) setPermisoCompras(true);
          tienePermiso = permisosData.some(permiso => permiso.id_menu === '03');
          if (tienePermiso) setPermisoCaja(true);
          tienePermiso = permisosData.some(permiso => permiso.id_menu === '04');
          if (tienePermiso) setPermisoDiario(true);
          tienePermiso = permisosData.some(permiso => permiso.id_menu === '05');
          if (tienePermiso) setPermisoReportes(true);
          tienePermiso = permisosData.some(permiso => permiso.id_menu === '06');
          if (tienePermiso) setPermisoContabilidades(true);
          tienePermiso = permisosData.some(permiso => permiso.id_menu === '07');
          if (tienePermiso) setPermisoTipoCambio(true);
          tienePermiso = permisosData.some(permiso => permiso.id_menu === '08');
          if (tienePermiso) setPermisoCorrentista(true);
          tienePermiso = permisosData.some(permiso => permiso.id_menu === '09');
          if (tienePermiso) setPermisoCentroCosto(true);
          tienePermiso = permisosData.some(permiso => permiso.id_menu === '10');
          if (tienePermiso) setPermisoSeguridad(true);
        })
        .catch(error => {
          console.log('Error al obtener los permisos:', error);
        });
    }
  }

  const MenuItem = ({ icon, label, isActive, onClick, badge, hasSubmenu, isSubmenuOpen }) => (
    <ListItem
      button
      onClick={onClick}
      sx={{
        paddingY: 1.5,
        paddingX: 2,
        backgroundColor: isActive ? '#6e6b6aff' : 'transparent',
        '&:hover': {
          backgroundColor: isActive ? '#6e6b6aff' : 'rgba(0,0,0,.08)',
        },
        borderRadius: 1,
        marginY: 0.5,
        marginX: 1,
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: (isMobile || isExpanded) ? 40 : 'auto',
          color: isActive ? '#FFFFFF' : blueGrey[300],
          justifyContent: 'center',
        }}
      >
        {badge && (
          <Box sx={{ position: 'relative' }}>
            {icon}
            <Typography
              variant="caption"
              sx={{
                position: 'absolute',
                top: -8,
                right: -8,
                fontSize: '0.65rem',
                fontWeight: 'bold',
                fontFamily: sidebarFont,
                color: isActive ? '#FFFFFF' : '#2aa198',
              }}
            >
              {badge}
            </Typography>
          </Box>
        )}
        {!badge && icon}
      </ListItemIcon>
      {(isMobile || isExpanded) && (
        <>
          <ListItemText
            primary={label}
            primaryTypographyProps={{
              fontFamily: sidebarFont,
              fontSize: '0.9rem',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#FFFFFF' : '#ffffff',
            }}
          />
          {hasSubmenu && (isSubmenuOpen ? <ExpandLess sx={{ color: blueGrey[300] }} /> : <ExpandMore sx={{ color: blueGrey[300] }} />)}
        </>
      )}
    </ListItem>
  );

  const SubMenuItem = ({ icon, label, isActive, onClick }) => (
    <ListItem
      button
      onClick={onClick}
      sx={{
        paddingY: 1,
        paddingLeft: (isMobile || isExpanded) ? 6 : 2,
        paddingRight: 2,
        backgroundColor: isActive ? '#6e6b6aff' : 'transparent',
        '&:hover': {
          backgroundColor: isActive ? '#6e6b6aff' : 'rgba(0,0,0,.08)',
        },
        borderRadius: 1,
        marginY: 0.25,
        marginX: 1,
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: (isMobile || isExpanded) ? 40 : 'auto',
          color: isActive ? '#FFFFFF' : blueGrey[300],
          justifyContent: 'center',
        }}
      >
        {icon}
      </ListItemIcon>
      {(isMobile || isExpanded) && (
        <ListItemText
          primary={label}
          primaryTypographyProps={{
            fontFamily: sidebarFont,
            fontSize: '0.85rem',
            fontWeight: isActive ? 600 : 400,
            color: isActive ? '#FFFFFF' : '#ffffff',
          }}
        />
      )}
    </ListItem>
  );

  const drawerContent = (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1e272e',
        borderRight: 'none',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: (isMobile || isExpanded) ? 'space-between' : 'center',
          padding: 2,
          minHeight: 64,
          backgroundColor: '#1e272e',
          borderBottom: '1px solid #073642',
        }}
      >
      </Box>

      <Divider sx={{ borderColor: '#073642' }} />

      {/* Usuario y Logout */}
      <Box sx={{ paddingY: 2, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', marginBottom: 1 }}>
          <IconButton
            onClick={() => {
              navigate(`/${props.idAnfitrion}/${props.idInvitado}`);
              handleClick('icono00');
            }}
          >
            <LoginPerfil />
          </IconButton>

          <IconButton onClick={toggleDrawer} size="small" sx={{ color: '#ffffff' }}>
            {isMobile ? <CloseIcon /> : (isExpanded ? <ArrowBackIosIcon /> : <MenuIcon />)}
          </IconButton>
        </Box>
        {!isExpanded && !isMobile && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <IconButton onClick={() => navigate(`/${props.idAnfitrion}/${props.idInvitado}`)}>
              <LoginLogoutBoton />
            </IconButton>
          </Box>
        )}
        {(isExpanded || isMobile) && (
          <LoginLogoutBoton />
        )}
      </Box>

      <Divider sx={{ borderColor: '#073642' }} />

      {/* Lista de menú */}
      <List sx={{ 
        flexGrow: 1, 
        paddingTop: 2, 
        overflowY: 'auto',
        '&::-webkit-scrollbar': {
          width: '0px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'transparent',
        },
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        <MenuItem
          icon={<HomeIcon />}
          label="Inicio"
          isActive={selectedButton === 'icono01'}
          onClick={() => {
            navigate(`/${props.idAnfitrion}/${props.idInvitado}`);
            handleClick('icono01');
          }}
        />

        {accesoAdmin && (
          <MenuItem
            icon={<ShoppingCartIcon />}
            label="Ventas"
            isActive={selectedButton === 'icono02'}
            onClick={() => {
              navigate(`/ad_venta/${props.idAnfitrion}/${props.idInvitado}/${periodo_trabajo}/${contabilidad_trabajo}`);
              handleClick('icono02');
            }}
          />
        )}

        {accesoAdmin && (
          <MenuItem
            icon={<QrCodeIcon />}
            label="Productos"
            isActive={selectedButton === 'icono03'}
            onClick={() => {
              navigate(`/ad_producto/${props.idAnfitrion}/${props.idInvitado}/${contabilidad_trabajo}`);
              handleClick('icono03');
            }}
          />
        )}

        {accesoAdmin && (
          <>
            <MenuItem
              icon={<HolidayVillageIcon />}
              label="Stocks"
              isActive={selectedButton === 'icono10'}
              onClick={handleStocksClick}
              hasSubmenu={true}
              isSubmenuOpen={openStocks}
            />
            <Collapse in={openStocks} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <SubMenuItem
                  icon={<QrCodeIcon />}
                  label="Movimientos"
                  isActive={selectedButton === 'icono10-1'}
                  onClick={() => {
                    navigate(`/ad_stock/${props.idAnfitrion}/${props.idInvitado}/${contabilidad_trabajo}`);
                    handleClick('icono10-1');
                  }}
                />
                <SubMenuItem
                  icon={<ShoppingCartIcon />}
                  label="Kardex"
                  isActive={selectedButton === 'icono10-2'}
                  onClick={() => {
                    navigate(`/ad_stock_ingreso/${props.idAnfitrion}/${props.idInvitado}/${contabilidad_trabajo}`);
                    handleClick('icono10-2');
                  }}
                />
                <SubMenuItem
                  icon={<HomeIcon />}
                  label="Inventarios"
                  isActive={selectedButton === 'icono10-3'}
                  onClick={() => {
                    navigate(`/ad_stock_salida/${props.idAnfitrion}/${props.idInvitado}/${contabilidad_trabajo}`);
                    handleClick('icono10-3');
                  }}
                />
              </List>
            </Collapse>
          </>
        )}

        {(permisoVentas || permisoCompras || permisoCaja || permisoDiario) && (
          <MenuItem
            icon={<GradingIcon />}
            label="Asientos"
            isActive={selectedButton === 'icono04'}
            onClick={() => {
              navigate(`/asiento/${props.idAnfitrion}/${props.idInvitado}/${periodo_trabajo}/${contabilidad_trabajo}`);
              handleClick('icono04');
            }}
          />
        )}

        {permisoReportes && (
          <MenuItem
            icon={<InsertChartIcon />}
            label="Reportes"
            isActive={selectedButton === 'icono05'}
            onClick={() => {
              navigate(`/reporte/${props.idAnfitrion}/${props.idInvitado}`);
              handleClick('icono05');
            }}
          />
        )}

        <Divider sx={{ marginY: 2, borderColor: '#073642' }} />

        {permisoContabilidades && (
          <MenuItem
            icon={<NextWeekIcon />}
            label="Contabilidades"
            isActive={selectedButton === 'icono06'}
            onClick={() => {
              navigate(`/contabilidades/${props.idAnfitrion}/${props.idInvitado}`);
              handleClick('icono06');
            }}
          />
        )}

        {permisoTipoCambio && (
          <MenuItem
            icon={<PaidIcon />}
            label="Tipo Cambio"
            isActive={selectedButton === 'icono07'}
            onClick={() => {
              navigate(`/correntista`);
              handleClick('icono07');
            }}
          />
        )}

        {permisoCentroCosto && (
          <MenuItem
            icon={<CenterFocusStrongIcon />}
            label="Centro Costos"
            isActive={selectedButton === 'icono08'}
            onClick={() => {
              navigate(`/ad_equipo/${props.idAnfitrion}/${props.idInvitado}/${contabilidad_trabajo}`);
              handleClick('icono08');
            }}
          />
        )}

        {permisoSeguridad && (
          <MenuItem
            icon={<SystemSecurityUpdateGoodIcon />}
            label="Seguridad"
            isActive={selectedButton === 'icono09'}
            onClick={() => {
              navigate(`/seguridad/${props.idAnfitrion}`);
              handleClick('icono09');
            }}
          />
        )}
      </List>
    </Box>
  );

  return (
    <>
      {isMobile && (
        <Fab
          color="primary"
          aria-label="menu"
          onClick={handleDrawerToggle}
          sx={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 1300,
            boxShadow: 3,
          }}
        >
          <MenuIcon />
        </Fab>
      )}

      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: isExpanded ? drawerWidthExpanded : drawerWidthCollapsed,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: isExpanded ? drawerWidthExpanded : drawerWidthCollapsed,
              boxSizing: 'border-box',
              transition: 'width 0.3s ease',
              overflowX: 'hidden',
              overflowY: 'hidden',
              border: 'none',
              backgroundColor: '#1e272e',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              width: drawerWidthExpanded,
              boxSizing: 'border-box',
              border: 'none',
              backgroundColor: '#1e272e',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  );
}