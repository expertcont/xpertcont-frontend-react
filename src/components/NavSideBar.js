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
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import BadgeIcon from '@mui/icons-material/Badge';

import QrCodeIcon from '@mui/icons-material/QrCode';
import HolidayVillageIcon from '@mui/icons-material/HolidayVillage';
import MenuIcon from '@mui/icons-material/Menu';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import CloseIcon from '@mui/icons-material/Close';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import logo from '../Logo04small-retocado-teal.png';

const drawerWidthExpanded = 240;
const drawerWidthCollapsed = 80;
const sidebarColors = {
  bg: '#0f171d',
  surface: '#142027',
  surfaceSoft: '#1b2a33',
  border: 'rgba(125, 150, 164, 0.20)',
  text: '#f5f7f8',
  muted: '#90a4ae',
  accent: '#2aa198',
  accentSoft: 'rgba(42, 161, 152, 0.14)',
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
  const [openTransportes, setOpenTransportes] = useState(false);
  const [openContable, setOpenContable] = useState(false);
  
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

  const handleTransportesClick = () => {
    setOpenTransportes(!openTransportes);
  };

  const handleContableClick = () => {
    setOpenContable(!openContable);
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
  const rubroTrabajo = String(props.rubro || sessionStorage.getItem('rubro_trabajo') || 'COMERCIAL').trim().toUpperCase();
  const esRubroTransporte = rubroTrabajo === 'TRANSPORTE' || rubroTrabajo === 'TRANSPORTES';
  const esRubroProyectos = rubroTrabajo === 'PROYECTO' || rubroTrabajo === 'PROYECTOS';
  const esRubroContable = rubroTrabajo === 'CONTABLE' || rubroTrabajo === 'CONTABILIDAD';
  const esRubroComercial = !esRubroTransporte && !esRubroProyectos && !esRubroContable;
  const etiquetaPuntosVenta = esRubroTransporte ? 'Agencias' : 'Puntos venta';
  const subtituloRubro = esRubroTransporte
    ? 'Gestion transportes'
    : esRubroProyectos
      ? 'Gestion proyectos'
      : esRubroContable
        ? 'Gestion contable'
        : 'Gestion comercial';
  const tieneOpcionesContables = (
    permisoVentas ||
    permisoCompras ||
    permisoCaja ||
    permisoDiario ||
    permisoReportes ||
    permisoContabilidades ||
    permisoTipoCambio ||
    permisoCentroCosto
  );

  const MenuItem = ({ icon, label, isActive, onClick, badge, hasSubmenu, isSubmenuOpen }) => {
    const item = (
      <ListItem
        button
        onClick={onClick}
        sx={{
          position: 'relative',
          minHeight: 54,
          paddingY: 1.05,
          paddingLeft: itemLabelVisible ? 2.75 : 0,
          paddingRight: itemLabelVisible ? 2 : 0,
          justifyContent: itemLabelVisible ? 'flex-start' : 'center',
          background: isActive
            ? 'linear-gradient(90deg, rgba(255,255,255,0.065) 0%, rgba(42,161,152,0.11) 58%, rgba(42,161,152,0.15) 100%)'
            : 'transparent',
          color: sidebarColors.text,
          '&:before': {
            content: '""',
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 3,
            borderRadius: '3px 0 0 3px',
            backgroundColor: isActive ? sidebarColors.accent : 'transparent',
            boxShadow: isActive ? '0 0 10px rgba(42,161,152,0.24)' : 'none',
          },
          '&:after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            borderTop: isActive ? '1px solid rgba(255,255,255,0.055)' : '1px solid transparent',
            borderBottom: isActive ? '1px solid rgba(0,0,0,0.22)' : '1px solid transparent',
          },
          '&:hover': {
            background: isActive
              ? 'linear-gradient(90deg, rgba(255,255,255,0.075) 0%, rgba(42,161,152,0.14) 58%, rgba(42,161,152,0.18) 100%)'
              : 'linear-gradient(90deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.025) 100%)',
          },
          borderRadius: 0,
          marginY: 0,
          marginX: 0,
          transition: 'background .18s ease, color .18s ease, box-shadow .18s ease',
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: itemLabelVisible ? 38 : 0,
            color: isActive ? sidebarColors.accent : 'rgba(210,222,228,0.72)',
            justifyContent: 'center',
            '& svg': { fontSize: 22 },
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
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#ffffff' : 'rgba(223,231,234,0.88)',
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
          paddingLeft: itemLabelVisible ? 6.25 : 0,
          paddingRight: itemLabelVisible ? 1.5 : 0,
          justifyContent: itemLabelVisible ? 'flex-start' : 'center',
          background: isActive
            ? 'linear-gradient(90deg, rgba(42,161,152,0.10) 0%, rgba(42,161,152,0.14) 100%)'
            : 'transparent',
          borderRight: isActive ? `3px solid ${sidebarColors.accent}` : '3px solid transparent',
          '&:hover': {
            background: isActive
              ? 'linear-gradient(90deg, rgba(42,161,152,0.13) 0%, rgba(42,161,152,0.17) 100%)'
              : 'rgba(255,255,255,.04)',
          },
          borderRadius: 0,
          marginY: 0.15,
          marginX: 0,
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: itemLabelVisible ? 30 : 0,
            color: isActive ? sidebarColors.accent : 'rgba(144,164,174,0.72)',
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
              color: isActive ? sidebarColors.text : 'rgba(197,208,214,0.84)',
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
        background: `
          radial-gradient(circle at 35% 0%, rgba(42,161,152,0.07) 0%, rgba(42,161,152,0) 32%),
          linear-gradient(180deg, #121c23 0%, ${sidebarColors.bg} 44%, #0a1116 100%)
        `,
        borderRight: `1px solid ${sidebarColors.border}`,
        boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.035), 12px 0 32px rgba(0,0,0,.30)',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: itemLabelVisible ? 'row' : 'column',
          alignItems: 'center',
          justifyContent: itemLabelVisible ? 'space-between' : 'center',
          gap: itemLabelVisible ? 0 : 0.5,
          px: itemLabelVisible ? 1.75 : 0.75,
          py: itemLabelVisible ? 1.35 : 1,
          minHeight: itemLabelVisible ? 66 : 78,
          position: 'relative',
          background: 'linear-gradient(180deg, rgba(255,255,255,.055) 0%, rgba(255,255,255,0.012) 100%)',
          borderBottom: `1px solid ${sidebarColors.border}`,
        }}
      >
        {itemLabelVisible ? (
          <Box sx={{ minWidth: 0, width: '100%', display: 'grid', justifyItems: 'center' }}>
            <Box
              component="img"
              src={logo}
              alt="XpertCont"
              sx={{
                display: 'block',
                width: 104,
                maxWidth: '100%',
                height: 'auto',
                objectFit: 'contain',
              }}
            />
            <Typography sx={{ color: sidebarColors.muted, fontWeight: 500, fontSize: '.66rem', mt: 0.35, fontFamily: sidebarFont, textAlign: 'center' }}>
              {subtituloRubro}
            </Typography>
          </Box>
        ) : (
          <Box
            component="img"
            src={logo}
            alt="XpertCont"
            sx={{
              width: 36,
              height: 'auto',
              objectFit: 'contain',
            }}
          />
        )}
        <IconButton
          onClick={toggleDrawer}
          size="small"
          sx={{
            position: itemLabelVisible ? 'absolute' : 'static',
            right: itemLabelVisible ? 8 : 'auto',
            top: itemLabelVisible ? 12 : 'auto',
            color: sidebarColors.muted,
            '&:hover': { color: sidebarColors.text, backgroundColor: sidebarColors.surfaceSoft },
          }}
        >
          {isMobile ? <CloseIcon /> : itemLabelVisible ? <ArrowBackIosIcon sx={{ fontSize: 18 }} /> : <MenuIcon />}
        </IconButton>
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

        {accesoAdmin && esRubroComercial && (
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
                <SubMenuItem
                  icon={<BadgeIcon />}
                  label="Habituales"
                  isActive={selectedButton === 'icono02-4'}
                  onClick={() => {
                    navigate(`/ad_correntistahabitual/${props.idAnfitrion}/${props.idInvitado}/${periodo_trabajo}/${contabilidad_trabajo}`);
                    handleClick('icono02-4');
                  }}
                />
              </List>
            </Collapse>
          </>
        )}

        {accesoAdmin && esRubroTransporte && (
          <>
            <MenuItem
              icon={<LocalShippingIcon />}
              label="Transportes"
              onClick={handleTransportesClick}
              hasSubmenu={true}
              isSubmenuOpen={openTransportes}
            />
            <Collapse in={openTransportes} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <SubMenuItem
                  icon={<Inventory2Icon />}
                  label="Encomiendas"
                  isActive={selectedButton === 'icono11-1'}
                  onClick={() => {
                    navigate(`/ad_transportesencomienda/${props.idAnfitrion}/${props.idInvitado}/${periodo_trabajo}/${contabilidad_trabajo}`);
                    handleClick('icono11-1');
                  }}
                />
                <SubMenuItem
                  icon={<AssignmentTurnedInIcon />}
                  label="Encomiendas por Entregar"
                  isActive={selectedButton === 'icono11-8'}
                  onClick={() => {
                    navigate(`/ad_transporteentregas/${props.idAnfitrion}/${props.idInvitado}/${periodo_trabajo}/${contabilidad_trabajo}`);
                    handleClick('icono11-8');
                  }}
                />
                <SubMenuItem
                  icon={<ConfirmationNumberIcon />}
                  label="Boletos"
                  isActive={selectedButton === 'icono11-2'}
                  onClick={() => {
                    navigate(`/ad_transportesboletos/${props.idAnfitrion}/${props.idInvitado}/${periodo_trabajo}/${contabilidad_trabajo}`);
                    handleClick('icono11-2');
                  }}
                />
                <SubMenuItem
                  icon={<CompareArrowsIcon />}
                  label="Rutas"
                  isActive={selectedButton === 'icono11-4'}
                  onClick={() => {
                    navigate(`/ad_transporterutas/${props.idAnfitrion}/${props.idInvitado}/${periodo_trabajo}/${contabilidad_trabajo}`);
                    handleClick('icono11-4');
                  }}
                />
                <SubMenuItem
                  icon={<DirectionsBusIcon />}
                  label="Placas"
                  isActive={selectedButton === 'icono11-5'}
                  onClick={() => {
                    navigate(`/ad_transporteplacas/${props.idAnfitrion}/${props.idInvitado}/${periodo_trabajo}/${contabilidad_trabajo}`);
                    handleClick('icono11-5');
                  }}
                />
                <SubMenuItem
                  icon={<BadgeIcon />}
                  label="Licencias"
                  isActive={selectedButton === 'icono11-6'}
                  onClick={() => {
                    navigate(`/ad_transportelicencias/${props.idAnfitrion}/${props.idInvitado}/${periodo_trabajo}/${contabilidad_trabajo}`);
                    handleClick('icono11-6');
                  }}
                />
                <SubMenuItem
                  icon={<HolidayVillageIcon />}
                  label="Zonas"
                  isActive={selectedButton === 'icono11-7'}
                  onClick={() => {
                    navigate(`/ad_transportezonas/${props.idAnfitrion}/${props.idInvitado}/${periodo_trabajo}/${contabilidad_trabajo}`);
                    handleClick('icono11-7');
                  }}
                />
              </List>
            </Collapse>
          </>
        )}

        {accesoAdmin && esRubroProyectos && (
          <MenuItem
            icon={<CropFreeIcon />}
            label="Proyectos y Servicios"
            isActive={selectedButton === 'icono02-4'}
            onClick={() => {
              navigate(`/ad_ventapresupuesto/${props.idAnfitrion}/${props.idInvitado}/${periodo_trabajo}/${contabilidad_trabajo}`);
              handleClick('icono02-4');
            }}
          />
        )}

        {accesoAdmin && (
          <MenuItem
            icon={<HolidayVillageIcon />}
            label={etiquetaPuntosVenta}
            isActive={selectedButton === 'icono11-3'}
            onClick={() => {
              navigate(`/ad_puntoventa/${props.idAnfitrion}/${props.idInvitado}/${periodo_trabajo}/${contabilidad_trabajo}`);
              handleClick('icono11-3');
            }}
          />
        )}

        {accesoAdmin && (
          <MenuItem
            icon={<SystemSecurityUpdateGoodIcon />}
            label="Usuarios turnos"
            isActive={selectedButton === 'icono11'}
            onClick={() => {
              navigate(`/ad_puntoventausuario/${props.idAnfitrion}/${props.idInvitado}`);
              handleClick('icono11');
            }}
          />
        )}

        {accesoAdmin && (esRubroComercial || esRubroProyectos) && (
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

        {accesoAdmin && esRubroComercial && (
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

        {esRubroContable && tieneOpcionesContables && (
          <>
            <Divider sx={{ marginY: 1.5, borderColor: sidebarColors.border }} />
            <MenuItem
              icon={<GradingIcon />}
              label="Contable"
              onClick={handleContableClick}
              hasSubmenu={true}
              isSubmenuOpen={openContable}
            />
            <Collapse in={openContable} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {(permisoVentas || permisoCompras || permisoCaja || permisoDiario) && (
                  <SubMenuItem
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
                  <SubMenuItem
                    icon={<InsertChartIcon />}
                    label="Reportes"
                    isActive={selectedButton === 'icono05'}
                    onClick={() => {
                      navigate(`/reporte/${props.idAnfitrion}/${props.idInvitado}`);
                      handleClick('icono05');
                    }}
                  />
                )}

                {permisoContabilidades && (
                  <SubMenuItem
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
                  <SubMenuItem
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
                  <SubMenuItem
                    icon={<CenterFocusStrongIcon />}
                    label="Centro Costos"
                    isActive={selectedButton === 'icono08'}
                    onClick={() => {
                      navigate(`/ad_equipo/${props.idAnfitrion}/${props.idInvitado}/${contabilidad_trabajo}`);
                      handleClick('icono08');
                    }}
                  />
                )}

              </List>
            </Collapse>
          </>
        )}

        {permisoSeguridad && (
          <>
            <Divider sx={{ marginY: 1.5, borderColor: sidebarColors.border }} />
            <MenuItem
              icon={<SystemSecurityUpdateGoodIcon />}
              label="Seguridad"
              isActive={selectedButton === 'icono09'}
              onClick={() => {
                navigate(`/seguridad/${props.idAnfitrion}`);
                handleClick('icono09');
              }}
            />
          </>
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
