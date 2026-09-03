import React from 'react';
import { useEffect, useState, useMemo, useCallback } from "react"
import { Card,CardContent,Box,Snackbar, Button,Select, MenuItem,Dialog,IconButton,DialogTitle,Typography,Alert,InputBase} from "@mui/material";
import { useNavigate,useParams } from "react-router-dom";
import { Search } from 'lucide-react';
//import createPdfTicket from './AdminVentaPdf';
import DaySelector from "../../AdminDias";

import Datatable from 'react-data-table-component';
import Checkbox from '@mui/material/Checkbox';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import '../../../../App.css';
import 'styled-components';
//import axios from 'axios';

//import { utils, writeFile } from 'xlsx';
import Tooltip from '@mui/material/Tooltip';
import axios from 'axios';

import { useAuth0 } from '@auth0/auth0-react'; //new para cargar permisos luego de verificar registro en bd
import BotonExcelGeneral from '../../../BotonExcelGeneral';

import { AdminInventarioColumnas } from '../../AdminColumnas';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { ensureAdminStockTableTheme } from '../common/adminStockTableTheme';
import palette from '../../../../theme/palette';

const contentRadius = 1;

const panelSx = {
  backgroundColor: 'transparent',
  border: '0',
  borderRadius: contentRadius,
  p: 0,
};

const listContentSx = {
  width: '100%',
  maxWidth: '100%',
  boxSizing: 'border-box',
  minWidth: 0,
  ml: 0,
  mr: 0,
  p: 0,
  display: 'grid',
  gap: 1.15,
};

const toolbarSurfaceSx = {
  backgroundColor: '#1c252c',
  borderRadius: contentRadius,
  px: { xs: 1, md: 1.5 },
  py: { xs: 0.9, md: 1.25 },
};

const selectSx = {
  width: '100%',
  height: 42,
  color: palette.text,
  backgroundColor: palette.chip,
  border: `1px solid ${palette.border}`,
  borderRadius: contentRadius,
  fontSize: '13px',
  '.MuiSelect-select': {
    py: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  '& .MuiOutlinedInput-notchedOutline': { border: 0 },
  '& .MuiSelect-icon': { color: palette.muted },
};

const selectMenuProps = {
  PaperProps: {
    sx: {
      backgroundColor: palette.surface,
      color: palette.text,
      border: `1px solid ${palette.border}`,
      '& .MuiMenuItem-root': { fontSize: '13px' },
    },
  },
};

const searchSx = {
  flex: '1 1 280px',
  minWidth: { xs: '100%', sm: 280 },
  height: 42,
  px: 1.15,
  display: 'flex',
  alignItems: 'center',
  gap: 0.85,
  color: palette.text,
  backgroundColor: palette.bg,
  border: '1px solid rgba(139,154,165,0.14)',
  borderRadius: contentRadius,
  '&:focus-within': {
    borderColor: 'rgba(139,154,165,0.32)',
  },
};

const inputSx = {
  color: palette.text,
  fontSize: '13px',
  width: '100%',
  '& input': {
    color: palette.text,
    fontSize: '13px',
  },
  '& input::placeholder': {
    color: palette.muted,
    opacity: 1,
  },
};

const actionButtonSx = {
  height: 42,
  borderRadius: contentRadius,
  boxShadow: 'none',
  fontSize: '12px',
  fontWeight: 800,
  textTransform: 'none',
  backgroundColor: 'rgba(42,161,152,0.14)',
  border: '1px solid rgba(42,161,152,0.34)',
  color: palette.text,
  px: 1.5,
  whiteSpace: 'nowrap',
  '&:hover': {
    backgroundColor: palette.accent,
    color: palette.surface,
    boxShadow: 'none',
  },
};

const iconRailSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.65,
};

const iconButtonSx = {
  width: 40,
  height: 40,
  borderRadius: contentRadius,
  backgroundColor: 'rgba(139,154,165,0.10)',
  color: palette.muted,
  transition: 'all 0.18s ease',
  '&:hover': {
    backgroundColor: 'rgba(42,161,152,0.18)',
    color: palette.text,
  },
};

const warningIconButtonSx = {
  ...iconButtonSx,
  color: '#f4c46f',
  '&:hover': {
    backgroundColor: 'rgba(245,158,11,0.18)',
    color: '#ffd98a',
  },
};

const listCardBg = '#1c252c';

const dataTableStyles = {
  table: { style: { backgroundColor: listCardBg } },
  tableWrapper: { style: { backgroundColor: listCardBg } },
  responsiveWrapper: { style: { backgroundColor: listCardBg } },
  headRow: {
    style: {
      backgroundColor: listCardBg,
      color: palette.muted,
      borderBottom: `1px solid ${palette.borderSoft}`,
      minHeight: '38px',
    },
  },
  headCells: {
    style: {
      color: palette.muted,
      fontSize: '11px',
      fontWeight: 800,
      textTransform: 'uppercase',
    },
  },
  rows: {
    style: {
      backgroundColor: listCardBg,
      color: palette.text,
      borderBottom: `1px solid ${palette.borderSoft}`,
      minHeight: '42px',
    },
    highlightOnHoverStyle: {
      backgroundColor: palette.surfaceAlt,
      color: palette.text,
      borderBottomColor: palette.border,
    },
  },
  cells: {
    style: {
      color: palette.text,
      fontSize: '12.5px',
      minWidth: 0,
    },
  },
  pagination: {
    style: {
      backgroundColor: listCardBg,
      color: palette.muted,
      borderTop: `1px solid ${palette.borderSoft}`,
    },
  },
};

const dialogPaperSx = {
  background: 'rgba(30, 39, 46, 0.96)',
  color: palette.text,
  borderRadius: contentRadius,
  border: `1px solid ${palette.border}`,
};

export default function AdminStockRepInventario() {
  //Control de useffect en retroceso de formularios
  //verificamos si es pantalla pequeña y arreglamos el grid de fechas

  //Seccion Dialog
  const [isDialogOpen, setDialogOpen] = useState(false);

  ensureAdminStockTableTheme();

  //Seccion carga de archivos
  ////////////////////////////////////////////////////////////////////////////

  //const back_host = process.env.BACK_HOST || "http://localhost:4000";
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
  //experimento
  const [updateTrigger, setUpdateTrigger] = useState({});

  const [selectedRows, setSelectedRows] = useState([]);
  const [toggleCleared, setToggleCleared] = useState(false);
    //const [data, setData] = useState(tableDataItems);
  const [registrosdet,setRegistrosdet] = useState([]);
  const [tabladet,setTabladet] = useState([]);  //Copia de los registros: Para tratamiento de filtrado
  const [valorBusqueda, setValorBusqueda] = useState(""); //txt: rico filtrado
  const [valorVista, setValorVista] = useState("ventas");
  const {user, isAuthenticated } = useAuth0();
  
  const [columnas, setColumnas] = useState([]);
  const columnasCabecera = [
    {
      name: '',
      width: '50px',
      cell: (row) => (
          <PlaylistAddCheckIcon
            onClick={() => {
                    //Navegar a Kardex Fisico 
                    //console.log('Kardex para: ',`/ad_stockrepkardex/${params.id_anfitrion}/${periodo_trabajo}/${contabilidad_trabajo}/${diaSel}/${row.id_producto}/${row.id_almacen}`);
                    navigate(`/ad_stockrepkardex/${params.id_anfitrion}/${periodo_trabajo}/${contabilidad_trabajo}/${diaSel}/${row.id_producto}/${row.id_almacen}`);
                    }
            }
            //color='success'
            style={{
              cursor: 'pointer',
              color: 'skyblue',
              transition: 'color 0.3s ease',
              fontSize: '32px'
            }}
          />
      ),
      allowOverflow: true,
      //agranadar el tamaño del icono
      button: true,
    },
  ];

  const [periodo_trabajo, setPeriodoTrabajo] = useState("");
  const [periodo_select,setPeriodosSelect] = useState([]);
  
  const [contabilidad_trabajo, setContabilidadTrabajo] = useState("");
  const [contabilidad_nombre, setContabilidadNombre] = useState("");
  const [contabilidad_select,setContabilidadesSelect] = useState([]);

  let [diaSel, setDiaSel] = useState("*");

  //Valores para Snackbar
  const [open, setOpen] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [tipo, setTipo] = useState('success');

  const handleChange = e => {
    //Para todos los demas casos ;)
    if (e.target.name==="periodo"){
      console.log('cambiando en periodo');
      setPeriodoTrabajo(e.target.value);
      //En cada cambio, actualizar ultimo periodo seleccionado 
      sessionStorage.setItem('periodo_trabajo', e.target.value);
      //console.log('handleChange periodo_trabajo', e.target.value);
    }
    if (e.target.name==="contabilidad"){
      console.log('cambiando en contabilidad');
      setContabilidadTrabajo(e.target.value);
      //En cada cambio, actualizar ultima contabilidad seleccionada
      sessionStorage.setItem('contabilidad_trabajo', e.target.value);
      
      //filtramos su nombre para historial
      const opcionSeleccionada = contabilidad_select.find(opcion => opcion.documento_id === e.target.value).razon_social;
      sessionStorage.setItem('contabilidad_nombre', opcionSeleccionada);
    }
    
    setUpdateTrigger(Math.random());//experimento para actualizar el dom
  }
  
  // Agrega íconos al inicio de cada columna
  
  // valores adicionales para Carga Archivo
  const [datosCarga, setDatosCarga] = useState({
    id_anfitrion: '',
    documento_id: '',
    periodo: '',
    id_libro: '',
    id_invitado: '',
  });  

  const handleRowSelected = useCallback(state => {
        setSelectedRows(state.selectedRows);
    }, []);

  
///////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////
  const cargaRegistro = async (strHistorialValorVista,strHistorialPeriodo,strHistorialContabilidad, sDia) => {
    let response;
    console.log("cargaRegistro sDia: ", sDia);
    //Cargamos asientos correspondientes al id_usuario,contabilidad y periodo
    if (strHistorialValorVista==='' || strHistorialValorVista===undefined || strHistorialValorVista===null){
        console.log(`${back_host}/ad_stockinventario/${periodo_trabajo}/${params.id_anfitrion}/${contabilidad_trabajo}/${sDia}`);
        response = await fetch(`${back_host}/ad_stockinventario/${periodo_trabajo}/${params.id_anfitrion}/${contabilidad_trabajo}/${sDia}`);
    }
    else{
        //usamos los historiales
        console.log(`${back_host}/ad_stockinventario/${strHistorialPeriodo}/${params.id_anfitrion}/${strHistorialContabilidad}/${sDia}`);
        response = await fetch(`${back_host}/ad_stockinventario/${strHistorialPeriodo}/${params.id_anfitrion}/${strHistorialContabilidad}/${sDia}`);
    }
    
    const data = await response.json();
    setRegistrosdet(data);
    setTabladet(data); //Copia para tratamiento de filtrado
  }
  //////////////////////////////////////
  
 
  const navigate = useNavigate();
  //Para recibir parametros desde afuera
  const params = useParams();

  const actualizaValorFiltro = e => {
    setValorBusqueda(e.target.value);
    filtrar(e.target.value);
  }
  const filtrar = (strBusca) => {
    var resultadosBusqueda = tabladet.filter((elemento) => {
      //verifica nulls para evitar error de busqueda
      const razonSocial = elemento.r_razon_social?.toString().toLowerCase() || '';
      const documentoId = elemento.r_documento_id?.toString().toLowerCase() || '';
      const comprobante = elemento.comprobante?.toString().toLowerCase() || '';
      const descripcion = elemento.descripcion?.toString().toLowerCase() || '';

      if (razonSocial.includes(strBusca.toLowerCase()) || documentoId.includes(strBusca.toLowerCase()) || comprobante.includes(strBusca.toLowerCase()) || descripcion.includes(strBusca.toLowerCase())) {
        return elemento;
      }
      return null; // Agrega esta línea para manejar el caso en que no haya coincidencia
    });
  
    resultadosBusqueda = resultadosBusqueda.filter(Boolean); // Filtra los elementos nulos
  
    setRegistrosdet(resultadosBusqueda);
  };
  
  
  //////////////////////////////////////////////////////////
  useEffect( ()=> {
      
      // Realiza acciones cuando isAuthenticated cambia
      //Verificar historial periodo 
      const st_periodo_trabajo = sessionStorage.getItem('periodo_trabajo');
      
      //New Cargar Lista, con sugerencia de foco inicial
      if (st_periodo_trabajo===null || st_periodo_trabajo===''){
          //en caso no haya periodos ni ruc registrados, no tiene porque cargar
        cargaPeriodosAnfitrion(params.periodo);
        setPeriodoTrabajo(params.periodo);
      }else{
        //en caso haya periodos y rucs, debe respetar el ambiente de trabajo anterior
        //cuidado con eliminar un ruc, el ambiente de trabajo podria desaparecer y generar bug ... ****
        cargaPeriodosAnfitrion(st_periodo_trabajo);
        setPeriodoTrabajo(st_periodo_trabajo);
      }

      //Verifica historial contabilidad
      const st_contabilidad_trabajo = sessionStorage.getItem('contabilidad_trabajo');
      const st_contabilidad_nombre = sessionStorage.getItem('contabilidad_nombre');
      //New Cargar Lista, con sugerencia de foco inicial
      if (st_contabilidad_trabajo===null || st_contabilidad_nombre===''){
        //en caso no haya periodos ni ruc registrados, no tiene porque cargar
        cargaContabilidadesAnfitrion(params.documento_id,st_contabilidad_nombre);
        setContabilidadTrabajo(params.documento_id);
      }else{
        //en caso haya periodos y rucs, debe respetar el ambiente de trabajo anterior
        //cuidado con eliminar un ruc, el ambiente de trabajo podria desaparecer y generar bug ... ****
        cargaContabilidadesAnfitrion(st_contabilidad_trabajo,st_contabilidad_nombre);
        setContabilidadTrabajo(st_contabilidad_trabajo);
      }
      

  },[isAuthenticated, user]) //Aumentamos IsAuthenticated y user

  useEffect( ()=> {
    //Carga de Registros con permisos
    console.log('3ero useeffect periodo_trabajo: ',periodo_trabajo);

    const st_id_libro = sessionStorage.getItem('id_libro');
    const st_valorVista = sessionStorage.getItem('valorVista'); //para el toggleButton
    console.log('3ero useeffect st_id_libro: ',st_id_libro);
    if (st_id_libro) {
      //Establecer valor historial al toggleButton
      setValorVista(st_valorVista);
    }

    const st_periodo_trabajo = sessionStorage.getItem('periodo_trabajo'); //parametro necesario
    const st_contabilidad_trabajo = sessionStorage.getItem('contabilidad_trabajo'); //parametro necesario

    //Secundario despues de seleccion en toggleButton
    let columnasEspecificas;
    columnasEspecificas = AdminInventarioColumnas;
    //Unir columnasCabecera + columnasEspecificas
    const columnasCompletas = [...columnasCabecera, ...columnasEspecificas];

    // Finalmente seteamos
    setColumnas(columnasCompletas);    

    //cuando carga x primera vez, sale vacio ... arreglar esto
    cargaRegistro(st_valorVista,periodo_trabajo,contabilidad_trabajo, diaSel); //new cambio

    //Datos listos en caso de volver por aqui, para envio
    setDatosCarga(prevState => ({ ...prevState, id_anfitrion: params.id_anfitrion }));
    setDatosCarga(prevState => ({ ...prevState, periodo: st_periodo_trabajo }));
    setDatosCarga(prevState => ({ ...prevState, documento_id: st_contabilidad_trabajo }));
    setDatosCarga(prevState => ({ ...prevState, id_libro: st_id_libro }));
    setDatosCarga(prevState => ({ ...prevState, id_invitado: params.id_invitado }));
    
    //fetchTotalVentas();
  },[valorVista, diaSel, updateTrigger]) //Solo cuando este completo estado


  //////////////////////////////////////////////////////////
  const cargaPeriodosAnfitrion = (strHistorialPeriodo) =>{
    axios
    .get(`${back_host}/usuario/periodos/${params.id_anfitrion}`)
    .then((response) => {
      setPeriodosSelect(response.data);
      //console.log(response.data);

      if (strHistorialPeriodo === '' || strHistorialPeriodo === null){
        //Establecer 1er elemento en select
        if (response.data.length > 0) {
          setPeriodoTrabajo(response.data[0].periodo); 
          sessionStorage.setItem('periodo_trabajo',response.data[0].periodo);
        }
      }
      else{//Establecer elemento historial
        setPeriodoTrabajo(strHistorialPeriodo); 
        console.log('periodo_trabajo: ', periodo_trabajo);
        console.log('strHistorialPeriodo: ', strHistorialPeriodo);
      }
    })
    .catch((error) => {
        console.log(error);
    });
  }
  const cargaContabilidadesAnfitrion = (strHistorialContabilidad,strHistorialContabilidadNombre) =>{
    axios
    //Aqui debemos agregar restriccion de contabilidad por(usuario auxiliar)
    .get(`${back_host}/usuario/contabilidades/${params.id_anfitrion}/${params.id_invitado}`)
    .then((response) => {
      setContabilidadesSelect(response.data);
      if (strHistorialContabilidad === '' || strHistorialContabilidad === null){
        //Establecer 1er elemento en select
        if (response.data.length > 0) {
          setContabilidadTrabajo(response.data[0].documento_id); 
          setContabilidadNombre(response.data[0].razon_social); 
          sessionStorage.setItem('contabilidad_trabajo',response.data[0].documento_id);
        }
      }
      else{//Establecer elemento historial
        setContabilidadTrabajo(strHistorialContabilidad); 
        setContabilidadNombre(strHistorialContabilidadNombre); 
      }
    })
    .catch((error) => {
        console.log(error);
    });
  }

  

const handleDayFilter = (selectedDay) => {
  const dia = selectedDay === '*' ? '*' : selectedDay.toString().padStart(2, '0');
  setDiaSel(dia);
};
  
const [isSuper, setIsSuper] = useState(false);
const [recaudaciones, setRecaudaciones] = useState([]);
const [showModalMostrarRecaudacion, setShowModalMostrarRecaudacion] = useState(false);

const handleClickTotal = (periodo,id_anfitrion,documento_id,dia) => {
  setShowModalMostrarRecaudacion(true);
  axios.get(`${back_host}/ad_ventaunidades/${periodo}/${id_anfitrion}/${documento_id}/${dia}`)
          .then(res => {
            if (res.data.success) {
              setRecaudaciones(res.data.data);
              console.log('Recaudaciones: ', res.data.data);
            }
          })
          .catch(err => console.error(err));
};

const generarSaldos = async () => {
    const confirmar = window.confirm(
      `¿Desea generar los saldos iniciales para el periodo siguiente a ${params.periodo}?`
    );
    if (!confirmar) return;

    try {
      const url = `${back_host}/ad_stockinventario`;
      const body = { periodo: periodo_trabajo , id_anfitrion: params.id_anfitrion, documento_id: contabilidad_trabajo };
      console.log('datos envio: ',url, body);
      
      const response = await axios.post(url, body);

      if (response.data?.ok) {
        setMensaje('✅ Saldos iniciales generados correctamente.');
        setTipo('success');
      } else {
        setMensaje(response.data?.mensaje || '⚠️ No se pudieron generar los saldos.');
        setTipo('warning');
      }
    } catch (error) {
      console.error('Error al generar saldos:', error);
      setMensaje('❌ Error inesperado al generar los saldos.');
      setTipo('error');
    } finally {
      setOpen(true);
    }
  };
 return (
  <Box sx={listContentSx}>
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={tipo} onClose={() => setOpen(false)} sx={{ width: '100%' }}>
          {mensaje}
        </Alert>
      </Snackbar>

      <Dialog
        open={showModalMostrarRecaudacion}
        onClose={() => setShowModalMostrarRecaudacion(false)}
        maxWidth="xs"
        fullWidth
        disableScrollLock
        PaperProps={{ sx: dialogPaperSx }}
      >
        <DialogTitle sx={{ fontSize: '16px', fontWeight: 800 }}>Total - Unidades</DialogTitle>
        <Card sx={{ mx: 2, mb: 2, background: 'rgba(255,255,255,0.05)', color: 'white', boxShadow: 'none', borderRadius: 1 }}>
          <CardContent sx={{ py: 1.25, '&:last-child': { pb: 1.25 } }}>
            {recaudaciones.length > 0 ? (
              recaudaciones.map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 2,
                    mb: 1,
                    borderBottom: '1px solid rgba(255,255,255,0.12)',
                    pb: 0.5,
                  }}
                >
                  <Typography sx={{ fontSize: '13px' }}>{item.cont_und}</Typography>
                  <Typography sx={{ fontSize: '13px', fontWeight: 800 }}>
                    {Number(item.total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography sx={{ opacity: 0.7, fontSize: '13px' }}>No hay unidades</Typography>
            )}
          </CardContent>
        </Card>
        <Box sx={{ px: 2, pb: 2 }}>
          <Button
            variant='contained'
            onClick={() => setShowModalMostrarRecaudacion(false)}
            sx={actionButtonSx}
            fullWidth
          >
            Cerrar
          </Button>
        </Box>
      </Dialog>

    <Box
      sx={{
        ...panelSx,
        ...toolbarSurfaceSx,
        display: 'flex',
        alignItems: { xs: 'stretch', md: 'center' },
        justifyContent: 'space-between',
        gap: 1,
        flexDirection: { xs: 'column', md: 'row' },
      }}
    >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.92)', fontSize: '22px', fontWeight: 500, lineHeight: 1.2 }}>
              Inventario de stock
            </Typography>
            <Typography sx={{ color: palette.muted, fontSize: '12px', mt: 0.35 }}>
              {`${registrosdet.length} productos visibles`}
              {contabilidad_nombre ? ` - ${contabilidad_nombre}` : ''}
              {` - Dia ${diaSel === '*' ? 'Todos' : diaSel}`}
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'minmax(150px, 180px) minmax(240px, 1fr)', md: '150px minmax(280px, 360px)' },
              gap: 1,
              alignItems: 'center',
              width: { xs: '100%', md: 'auto' },
            }}
          >
              <Box sx={{ width: '100%' }}>
                <Select
                  labelId="periodo"
                  size='small'
                  value={periodo_trabajo}
                  name="periodo"
                  sx={{ ...selectSx, color: palette.accent }}
                  label="Periodo Cont"
                  onChange={handleChange}
                  MenuProps={selectMenuProps}
                >
                  <MenuItem value="default">SELECCIONA </MenuItem>
                  {periodo_select.map(elemento => (
                    <MenuItem key={elemento.periodo} value={elemento.periodo}>
                      {elemento.periodo}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
              <Box>
                <Select
                  labelId="contabilidad_select"
                  size='small'
                  value={contabilidad_trabajo}
                  name="contabilidad"
                  sx={selectSx}
                  label="Contabilidad"
                  onChange={handleChange}
                  MenuProps={selectMenuProps}
                >
                  <MenuItem value="default">SELECCIONA </MenuItem>
                  {contabilidad_select.map(elemento => (
                    <MenuItem key={elemento.documento_id} value={elemento.documento_id}>
                      {elemento.razon_social}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
          </Box>
    </Box>

        <Box sx={{ ...panelSx, overflowX: 'auto' }}>
          <DaySelector period={periodo_trabajo} onDaySelect={handleDayFilter} />
        </Box>

        <Box
          sx={{
            ...panelSx,
            ...toolbarSurfaceSx,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Box sx={searchSx}>
            <Search size={16} color={palette.muted} />
            <InputBase
            name="busqueda"
            placeholder="Filtrar: RUC, razon social, comprobante o descripcion"
            onChange={actualizaValorFiltro}
            sx={inputSx}
          />
          </Box>

          {(String(params.id_anfitrion) === String(params.id_invitado) || isSuper) && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleClickTotal(periodo_trabajo, params.id_anfitrion, contabilidad_trabajo, diaSel)}
              sx={actionButtonSx}
            >
              Total unidades
            </Button>
          )}

          <Box sx={iconRailSx}>
            <Tooltip title='EXPORTAR XLS'>
                <BotonExcelGeneral
                  datos={registrosdet}
                  nombreArchivo="Inventario"
                  tituloReporte={`Inventario:  ${contabilidad_trabajo} ${contabilidad_nombre} ${periodo_trabajo}`}
                  columnasNumericas={['ingresos','egresos','saldo']}
                />
            </Tooltip>

            <Tooltip title='GENERAR SALDOS PROX PERIODO'>
              <IconButton
                sx={warningIconButtonSx}
                onClick={() => generarSaldos()}
              >
                <SaveAsIcon sx={{ fontSize: 22 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title='GLOBAL'>
              <IconButton
                sx={iconButtonSx}
                onClick={() => {
                  cargaRegistro('global',periodo_trabajo,"*", diaSel);
                }}
              >
                <AccountTreeIcon sx={{ fontSize: 22 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

    <Box
      sx={{
        overflow: 'hidden',
        borderRadius: contentRadius,
        border: 0,
        backgroundColor: listCardBg,
        boxShadow: 'none',
        px: { xs: 0.25, md: 0.75 },
        py: { xs: 0.25, md: 0.75 },
        minWidth: 0,
        maxWidth: '100%',
        '& .rdt_TableWrapper': {
          maxWidth: '100%',
          overflowX: 'auto',
        },
        '& .rdt_Table': {
          minWidth: { xs: 960, md: '100%' },
        },
      }}
    >
      <Datatable
        theme="solarized"
        columns={columnas}
        data={registrosdet}
        customStyles={dataTableStyles}
        onSelectedRowsChange={handleRowSelected}
        clearSelectedRows={toggleCleared}
        pagination
        paginationPerPage={15}
        paginationRowsPerPageOptions={[15, 50, 100]}
        selectableRowsComponent={Checkbox}
        sortIcon={<ArrowDownward />}
        dense={true}
        highlightOnHover
      />
    </Box>
  </Box>
  );
}
