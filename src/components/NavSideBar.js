import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Typography, useMediaQuery, Divider, IconButton, useTheme, Fab, Collapse, Tooltip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import HomeIcon from '@mui/icons-material/Home';
import GradingIcon from '@mui/icons-material/Grading';
import InsertChartIcon from '@mui/icons-material/InsertChart';
import PaidIcon from '@mui/icons-material/Paid';
import axios from 'axios';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import NextWeekIcon from '@mui/icons-material/NextWeek';
import SystemSecurityUpdateGoodIcon from '@mui/icons-material/SystemSecurityUpdateGood';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SummarizeIcon from '@mui/icons-material/Summarize';
import TableRowsIcon from '@mui/icons-material/TableRows';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import CropFreeIcon from '@mui/icons-material/CropFree';

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
const sidebarColors = {
  bg: '#172027',
  surface: '#1e2931',
  surfaceSoft: '#25323b',
  border: 'rgba(125, 150, 164, 0.18)',
  text: '#f5f7f8',
  muted: '#90a4ae',
  accent: '#2aa198',
  accentSoft: 'rgba(42, 161, 152, 0.16)',
  danger: '#ff8a65',
};

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
  const [openVentas, setOpenVentas] = useState(false);
  
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

  const handleVentasClick = () => {
    setOpenVentas(!openVentas);
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

  const itemLabelVisible = isMobile || isExpanded;

  const MenuItem = ({ icon, label, isActive, onClick, badge, hasSubmenu, isSubmenuOpen }) => {
    const item = (
      <ListItem
        button
        onClick={onClick}
        sx={{
          position: 'relative',
          minHeight: 46,
          paddingY: 1,
          paddingX: itemLabelVisible ? 1.5 : 0,
          justifyContent: itemLabelVisible ? 'flex-start' : 'center',
          backgroundColor: isActive ? sidebarColors.accentSoft : 'transparent',
          color: sidebarColors.text,
          '&:before': {
            content: '""',
            position: 'absolute',
            left: 6,
            top: 10,
            bottom: 10,
            width: 3,
            borderRadius: 4,
            backgroundColor: isActive ? sidebarColors.accent : 'transparent',
          },
          '&:hover': {
            backgroundColor: isActive ? sidebarColors.accentSoft : 'rgba(255,255,255,.055)',
          },
          borderRadius: 2,
          marginY: 0.35,
          marginX: 1,
          transition: 'background-color .18s ease, color .18s ease',
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: itemLabelVisible ? 38 : 0,
            color: isActive ? sidebarColors.accent : sidebarColors.muted,
            justifyContent: 'center',
            '& svg': { fontSize: 21 },
          }}
        >
          {badge && (
            <Box sx={{ position: 'relative', display: 'flex' }}>
              {icon}
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  top: -9,
                  right: -9,
                  px: 0.45,
                  minWidth: 15,
                  height: 15,
                  borderRadius: 8,
                  backgroundColor: sidebarColors.accent,
                  color: '#08221f',
                  fontSize: '0.58rem',
                  fontWeight: 800,
                  fontFamily: sidebarFont,
                  lineHeight: '15px',
                  textAlign: 'center',
                }}
              >
                {badge}
              </Typography>
            </Box>
          )}
          {!badge && icon}
        </ListItemIcon>
        {itemLabelVisible && (
          <>
            <ListItemText
              primary={label}
              primaryTypographyProps={{
                fontFamily: sidebarFont,
                fontSize: '0.86rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? sidebarColors.text : '#dfe7ea',
              }}
            />
            {hasSubmenu && (isSubmenuOpen ? <ExpandLess sx={{ color: sidebarColors.muted }} /> : <ExpandMore sx={{ color: sidebarColors.muted }} />)}
          </>
        )}
      </ListItem>
    );

    return itemLabelVisible ? item : (
      <Tooltip title={label} placement="right" arrow>
        {item}
      </Tooltip>
    );
  };

  const SubMenuItem = ({ icon, label, isActive, onClick }) => {
    const item = (
      <ListItem
        button
        onClick={onClick}
        sx={{
          minHeight: 38,
          paddingY: 0.65,
          paddingLeft: itemLabelVisible ? 5.75 : 0,
          paddingRight: itemLabelVisible ? 1.5 : 0,
          justifyContent: itemLabelVisible ? 'flex-start' : 'center',
          backgroundColor: isActive ? 'rgba(42,161,152,.12)' : 'transparent',
          '&:hover': {
            backgroundColor: isActive ? 'rgba(42,161,152,.16)' : 'rgba(255,255,255,.045)',
          },
          borderRadius: 1.5,
          marginY: 0.15,
          marginX: 1,
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: itemLabelVisible ? 30 : 0,
            color: isActive ? sidebarColors.accent : '#78909c',
            justifyContent: 'center',
            '& svg': { fontSize: 17 },
          }}
        >
          {icon}
        </ListItemIcon>
        {itemLabelVisible && (
          <ListItemText
            primary={label}
            primaryTypographyProps={{
              fontFamily: sidebarFont,
              fontSize: '0.8rem',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? sidebarColors.text : '#c5d0d6',
            }}
          />
        )}
      </ListItem>
    );

    return itemLabelVisible ? item : (
      <Tooltip title={label} placement="right" arrow>
        {item}
      </Tooltip>
    );
  };

  const drawerContent = (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(180deg, ${sidebarColors.bg} 0%, #11181e 100%)`,
        borderRight: `1px solid ${sidebarColors.border}`,
        boxShadow: '10px 0 28px rgba(0,0,0,.16)',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: (isMobile || isExpanded) ? 'space-between' : 'center',
          px: itemLabelVisible ? 2 : 1,
          py: 1.5,
          minHeight: 70,
          backgroundColor: 'rgba(255,255,255,.018)',
          borderBottom: `1px solid ${sidebarColors.border}`,
        }}
      >
        {itemLabelVisible ? (
          <Box>
            <Typography sx={{ color: sidebarColors.text, fontWeight: 800, fontSize: '1rem', lineHeight: 1, letterSpacing: 0, fontFamily: sidebarFont }}>
              XpertCont
            </Typography>
            <Typography sx={{ color: sidebarColors.muted, fontWeight: 600, fontSize: '.68rem', mt: 0.45, fontFamily: sidebarFont }}>
              Gestion comercial
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              backgroundColor: sidebarColors.accentSoft,
              color: sidebarColors.accent,
              fontWeight: 900,
              fontFamily: sidebarFont,
            }}
          >
            X
          </Box>
        )}
        {itemLabelVisible && (
          <IconButton onClick={toggleDrawer} size="small" sx={{ color: sidebarColors.muted, '&:hover': { color: sidebarColors.text, backgroundColor: sidebarColors.surfaceSoft } }}>
            {isMobile ? <CloseIcon /> : <ArrowBackIosIcon sx={{ fontSize: 18 }} />}
          </IconButton>
        )}
      </Box>

      <Divider sx={{ borderColor: sidebarColors.border }} />

      {/* Usuario y Logout */}
      <Box sx={{ px: itemLabelVisible ? 2 : 1, py: 1.75, textAlign: 'center' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: itemLabelVisible ? 1.25 : 1,
          }}
        >
          <IconButton
            onClick={() => {
              navigate(`/${props.idAnfitrion}/${props.idInvitado}`);
              handleClick('icono00');
            }}
            sx={{
              p: 0.55,
              border: `1px solid ${sidebarColors.border}`,
              backgroundColor: 'rgba(255,255,255,.035)',
              boxShadow: '0 10px 22px rgba(0,0,0,.18)',
              '& .MuiAvatar-root': {
                width: itemLabelVisible ? 52 : 42,
                height: itemLabelVisible ? 52 : 42,
              },
              '&:hover': {
                backgroundColor: sidebarColors.accentSoft,
                borderColor: 'rgba(42,161,152,.45)',
              },
            }}
          >
            <LoginPerfil />
          </IconButton>
          {itemLabelVisible && (
            <Box sx={{ width: '100%', maxWidth: 150, mx: 'auto', display: 'flex', justifyContent: 'center' }}>
              <LoginLogoutBoton sidebar />
            </Box>
          )}
          {!itemLabelVisible && (
            <>
              <LoginLogoutBoton sidebar compact />
              <IconButton onClick={toggleDrawer} size="small" sx={{ color: sidebarColors.muted, '&:hover': { color: sidebarColors.text, backgroundColor: sidebarColors.surfaceSoft } }}>
                <MenuIcon />
              </IconButton>
            </>
          )}
        </Box>
      </Box>

      <Divider sx={{ borderColor: sidebarColors.border }} />

      {/* Lista de menú */}
      <List sx={{ 
        flexGrow: 1, 
        paddingTop: 1.25, 
        paddingBottom: 2,
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
          <>
            <MenuItem
              icon={<ShoppingCartIcon />}
              label="Ventas"
              //isActive={selectedButton === 'icono02'}
              onClick={handleVentasClick}
              hasSubmenu={true}
              isSubmenuOpen={openVentas}
            />
            <Collapse in={openVentas} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <SubMenuItem
                  icon={<CropFreeIcon />}
                  label="Registros"
                  isActive={selectedButton === 'icono02-1'}
                  onClick={() => {
                  //navigate(`/ad_venta/${props.idAnfitrion}/${props.idInvitado}/${periodo_trabajo}/${contabilidad_trabajo}`);
                  navigate(`/ad_venta/${props.idAnfitrion}/${props.idInvitado}/${periodo_trabajo}/-`);
                  handleClick('icono02-1');
                  }}
                />
                
                <SubMenuItem
                  icon={<CropFreeIcon />}
                  label="Presupuestos"
                  isActive={selectedButton === 'icono02-4'}
                  onClick={() => {
                  navigate(`/ad_ventapresupuesto/${props.idAnfitrion}/${props.idInvitado}/${periodo_trabajo}/${contabilidad_trabajo}`);
                  handleClick('icono02-4');
                  }}
                />

                <SubMenuItem
                  icon={<TableRowsIcon />}
                  label="Detalle"
                  isActive={selectedButton === 'icono02-2'}
                  onClick={() => {
                    navigate(`/ad_ventarepdet/${props.idAnfitrion}/${props.idInvitado}/${periodo_trabajo}/${contabilidad_trabajo}`);
                    handleClick('icono02-2');
                  }}
                />
                <SubMenuItem
                  //icon={<ShoppingCartIcon />}
                  label="Resumen"
                  isActive={selectedButton === 'icono02-3'}
                  onClick={() => {
                    navigate(`/ad_ventarepref/${props.idAnfitrion}/${props.idInvitado}/${periodo_trabajo}/${contabilidad_trabajo}`);
                    handleClick('icono02-3');
                  }}
                />
              </List>
            </Collapse>
          </>
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
                    //navigate(`/ad_stock/${props.idAnfitrion}/${props.idInvitado}/${contabilidad_trabajo}`);
                    navigate(`/ad_stock/${props.idAnfitrion}/${props.idInvitado}/-`);
                    handleClick('icono10-1');
                  }}
                />
                <SubMenuItem
                  icon={<CompareArrowsIcon />}
                  label="Detalle"
                  isActive={selectedButton === 'icono10-2'}
                  onClick={() => {
                    navigate(`/ad_stockrepdet/${props.idAnfitrion}/${props.idInvitado}/${periodo_trabajo}/${contabilidad_trabajo}`);
                    handleClick('icono10-2');
                  }}
                />
                <SubMenuItem
                  icon={<SummarizeIcon />}
                  label="Inventarios Kardex"
                  isActive={selectedButton === 'icono10-3'}
                  onClick={() => {
                    navigate(`/ad_stockrepinventario/${props.idAnfitrion}/${props.idInvitado}/${periodo_trabajo}/${contabilidad_trabajo}`);
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

        <Divider sx={{ marginY: 1.5, borderColor: sidebarColors.border }} />

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
            label="Usuarios Grupo"
            isActive={selectedButton === 'icono11'}
            onClick={() => {
              navigate(`/ad_usuariogrupo/${props.idAnfitrion}/${props.idInvitado}`);
              handleClick('icono11');
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
