import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Box, IconButton, Snackbar, Typography } from '@mui/material';
import { useNavigate,useParams } from "react-router-dom";
import '../../../../App.css';
import 'styled-components';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react'; //new para cargar permisos luego de verificar registro en bd
import BotonExcelGeneral from '../../../BotonExcelGeneral';
import { AdminInventarioColumnas } from '../../AdminColumnas';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import palette from '../../../../theme/palette';
import { Layers } from 'lucide-react';
import AppButton from '../../../ui/AppButton';
import AdminStockReportLayout from '../common/AdminStockReportLayout';
import Tooltip from '@mui/material/Tooltip';
import AdminVentaRecaudacionDialog from '../../venta/list/AdminVentaRecaudacionDialog';

const reportIconButtonSx = {
  width: 38,
  height: 38,
  borderRadius: palette.radius.control,
  border: `1px solid ${palette.borderSoft}`,
  backgroundColor: palette.surfaceAlt,
  color: palette.accent,
  '&:hover': { backgroundColor: palette.accentSoft, borderColor: palette.accent },
};

export default function AdminStockRepInventario() {
  //Control de useffect en retroceso de formularios
  //verificamos si es pantalla pequeña y arreglamos el grid de fechas

  //Seccion Dialog
  const [isDialogOpen, setDialogOpen] = useState(false);


  //Seccion carga de archivos
  ////////////////////////////////////////////////////////////////////////////

  //const back_host = process.env.BACK_HOST || "http://localhost:4000";
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
  //experimento
  const [updateTrigger, setUpdateTrigger] = useState({});

    //const [data, setData] = useState(tableDataItems);
  const [registrosdet,setRegistrosdet] = useState([]);
  const [valorBusqueda, setValorBusqueda] = useState(""); //txt: rico filtrado
  const [valorVista, setValorVista] = useState("ventas");
  const {user, isAuthenticated } = useAuth0();
  
  const [columnas, setColumnas] = useState([]);
  const columnasCabecera = [
    {
      name: '',
      width: '62px',
      cell: (row) => (
        <Tooltip title="Ver Kardex" arrow>
          <IconButton
            aria-label="Ver Kardex"
            sx={reportIconButtonSx}
            onClick={() => navigate(`/ad_stockrepkardex/${params.id_anfitrion}/${periodo_trabajo}/${row.documento_id || contabilidad_trabajo}/${diaSel}/${encodeURIComponent(row.id_producto)}/${encodeURIComponent(row.id_almacen)}`)}
          >
            <PlaylistAddCheckIcon sx={{ fontSize: 22 }} />
          </IconButton>
        </Tooltip>
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
      setContabilidadNombre(opcionSeleccionada);
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
  }
  //////////////////////////////////////
  
 
  const navigate = useNavigate();
  //Para recibir parametros desde afuera
  const params = useParams();

  const registrosVisibles = useMemo(() => {
    const termino = valorBusqueda.trim().toLowerCase();
    if (!termino) return registrosdet;
    return registrosdet.filter((row) => [row.id_producto, row.nombre_producto, row.descripcion, row.id_almacen]
      .some((value) => String(value ?? '').toLowerCase().includes(termino)));
  }, [registrosdet, valorBusqueda]);
  
  
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
  },[valorVista, diaSel, periodo_trabajo, contabilidad_trabajo, updateTrigger]) //Solo cuando este completo estado


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
const [showModalMostrarRecaudacion, setShowModalMostrarRecaudacion] = useState(false);

const saldosPorUnidad = useMemo(() => {
  const totales = new Map();
  for (const row of registrosVisibles) {
    const saldo = Number(row.saldo);
    if (row.saldo == null || !Number.isFinite(saldo)) continue;
    const unidad = row.cont_und || 'Sin unidad';
    totales.set(unidad, (totales.get(unidad) ?? 0) + saldo);
  }
  return Array.from(totales);
}, [registrosVisibles]);

const generarSaldos = async () => {
    const confirmar = window.confirm(
      `¿Desea generar los saldos iniciales para el período siguiente a ${periodo_trabajo}?`
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
    <AdminStockReportLayout
      titulo="Inventario de stock"
      compacta
      contadorTexto={`productos visibles · ${contabilidad_nombre || contabilidad_trabajo}`}
      buscarTexto="Código o nombre del producto"
      busqueda={valorBusqueda}
      onBuscar={(event) => setValorBusqueda(event.target.value)}
      columnas={columnas}
      registros={registrosVisibles}
      filtros={{
        periodo: periodo_trabajo,
        periodos: periodo_select,
        empresa: contabilidad_trabajo,
        empresas: contabilidad_select,
        onChange: handleChange,
        onDia: handleDayFilter,
      }}
      acciones={(
        <>
          {(String(params.id_anfitrion) === String(params.id_invitado) || isSuper) && (
            <AppButton icon={<Layers size={16} />} sx={{ height: 38 }}
              onClick={() => setShowModalMostrarRecaudacion(true)}>
              Total unidades
            </AppButton>
          )}
          <BotonExcelGeneral
            datos={registrosVisibles}
            nombreArchivo="Inventario"
            tituloReporte={`Inventario · ${contabilidad_trabajo} ${periodo_trabajo}`}
            columnasNumericas={['ingresos', 'egresos', 'saldo']}
          />
          <Tooltip title="Generar saldos del próximo período" arrow>
            <IconButton aria-label="Generar saldos del próximo período" onClick={generarSaldos} sx={reportIconButtonSx}>
              <SaveAsIcon sx={{ color: palette.warning }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Inventario global" arrow>
            <IconButton aria-label="Inventario global" sx={reportIconButtonSx}
              onClick={() => cargaRegistro('global', periodo_trabajo, '*', diaSel)}>
              <AccountTreeIcon />
            </IconButton>
          </Tooltip>
        </>
      )}
    >
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={tipo} onClose={() => setOpen(false)} sx={{ width: '100%' }}>{mensaje}</Alert>
      </Snackbar>
      <AdminVentaRecaudacionDialog
        open={showModalMostrarRecaudacion}
        onClose={() => setShowModalMostrarRecaudacion(false)}
        contenidoPersonalizado={{ titulo: 'Total de unidades', subtitulo: 'Saldo de los productos visibles por unidad de medida' }}
      >
        {saldosPorUnidad.length ? saldosPorUnidad.map(([unidad, saldo]) => (
          <Box key={unidad} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, px: 1.25, py: 0.85,
            border: `1px solid ${palette.borderSoft}`, borderRadius: 1.5, backgroundColor: palette.bg }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{unidad}</Typography>
            <Typography sx={{ color: palette.accent, fontSize: 13, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
              {saldo.toLocaleString('es-PE', { maximumFractionDigits: 3 })}
            </Typography>
          </Box>
        )) : <Typography sx={{ color: palette.muted, textAlign: 'center', py: 2 }}>No hay unidades</Typography>}
      </AdminVentaRecaudacionDialog>
    </AdminStockReportLayout>
  );
}
