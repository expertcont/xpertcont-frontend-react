import React from 'react';
import { useEffect, useState, useMemo, useCallback } from "react"
import { Grid, Button,useMediaQuery,Select, MenuItem} from "@mui/material";
import { useNavigate,useParams } from "react-router-dom";
import DeleteIcon from '@mui/icons-material/Delete';
import FindIcon from '@mui/icons-material/FindInPage';

import swal from 'sweetalert';
import swal2 from 'sweetalert2'
import Datatable, {createTheme} from 'react-data-table-component';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import '../App.css';
import 'styled-components';

import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import axios from 'axios';

import { useAuth0 } from '@auth0/auth0-react'; //new para cargar permisos luego de verificar registro en bd
import BotonExcelVentas from './BotonExcelVentas';
import { HojaTrabColumnas } from './ColumnasAsiento';
import { VentasColumnas } from './ColumnasAsiento';
import { CajaColumnas } from './ColumnasAsiento';
import { saveAs } from 'file-saver';

export default function AsientoList() {
  //Control de useffect en retroceso de formularios
  //verificamos si es pantalla pequeña y arreglamos el grid de fechas
  const isSmallScreen = useMediaQuery('(max-width: 600px)');

  createTheme('solarized', {
    text: {
      //primary: '#268bd2',
      primary: '#ffffff',
      secondary: '#2aa198',
    },
    background: {
      //default: '#002b36',
      default: '#1e272e'
    },
    context: {
      background: '#cb4b16',
      //background: '#1e272e',
      text: '#FFFFFF',
    },
    divider: {
      default: '#073642',
    },
    action: {
      button: 'rgba(0,0,0,.54)',
      hover: 'rgba(0,0,0,.08)',
      disabled: 'rgba(0,0,0,.12)',
    },
  }, 'dark');


  ///////////////////////////////////////////////////
  /*function exportToExcel(data) {
    const worksheet = utils.json_to_sheet(data);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Datos');
    writeFile(workbook, 'datos.xlsx');
  }*/

  //const back_host = process.env.BACK_HOST || "http://localhost:4000";
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
  //experimento
  const [updateTrigger, setUpdateTrigger] = useState({});

  const [selectedRows, setSelectedRows] = useState([]);
  const [toggleCleared, setToggleCleared] = useState(false);
	//const [data, setData] = useState(tableDataItems);
  const [registrosdet,setRegistrosdet] = useState([]);
  const [tabladet,setTabladet] = useState([]);  //Copia de los registros: Para tratamiento de filtrado
  const [navegadorMovil, setNavegadorMovil] = useState(false);
  const [valorBusqueda, setValorBusqueda] = useState(""); //txt: rico filtrado
  const [valorVista, setValorVista] = useState("analisis");
  const [id_libro, setValorLibro] = useState("014");
  const {user, isAuthenticated } = useAuth0();
  
  const [columnas, setColumnas] = useState([]);

  const [periodo_ini, setPeriodoIni] = useState("");
  const [periodo_fin, setPeriodoFin] = useState("");

  const [periodo_select,setPeriodosSelect] = useState([]);
  
  const [contabilidad_trabajo, setContabilidadTrabajo] = useState("");
  const [contabilidad_nombre, setContabilidadNombre] = useState("");
  const [contabilidad_select,setContabilidadesSelect] = useState([]);
  const [libro_select,setLibroSelect] = useState([]);

  const handleChange = e => {
    //Para todos los demas casos ;)
    if (e.target.name==="periodo_ini"){
      console.log('cambiando en periodo');
      setPeriodoIni(e.target.value);
      //En cada cambio, actualizar ultimo periodo seleccionado 
      sessionStorage.setItem('periodo_ini', e.target.value);
    }
    if (e.target.name==="periodo_fin"){
      console.log('cambiando en periodo');
      setPeriodoFin(e.target.value);
      //En cada cambio, actualizar ultimo periodo seleccionado 
      sessionStorage.setItem('periodo_fin', e.target.value);
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
    if (e.target.name==="libro"){
      console.log('cambiando en libro');
      setValorLibro(e.target.value);
      //En cada cambio, actualizar ultima contabilidad seleccionada
      sessionStorage.setItem('libro_trabajo', e.target.value);
    }

    setUpdateTrigger(Math.random());//experimento para actualizar el dom
  }
  
  const handleRowSelected = useCallback(state => {
		setSelectedRows(state.selectedRows);
	}, []);

  ///////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////
  const cargaRegistro = async (sValorVista,sPeriodoIni,sPeriodoFin,sContabilidad,sLibro) => {
    var response;
    //Cargamos asientos correspondientes al id_usuario,contabilidad y periodo
    //Pero asi es mas facil, porque todo esta en valorVista ... muaaaaaa
    if (sValorVista==='' || sValorVista===undefined || sValorVista===null){
        //Por defaulr cargamos datos para analisis
        //response = await fetch(`${back_host}/asiento/${valorVista}/${params.id_anfitrion}/${params.id_invitado}/${periodo_ini}/${contabilidad_trabajo}`);
        console.log('solo analisis');
    }
    else{
        //cargar Hoja Trabajo o EEFF
        //if (valorVista==='hojatrab') {}
        //if (valorVista==='eeff') {}
        //console.log(`${back_host}/reporte/hojatrabajo/${params.id_anfitrion}/${sContabilidad}/${sPeriodoIni}/${sPeriodoFin}/5/${sLibro}`);
        if (sLibro==='todos'){
          //enviamos sin parametro de libro, para que salga todos los libros en hoja de trabajo
          response = await fetch(`${back_host}/reporte/hojatrabajo/${params.id_anfitrion}/${sContabilidad}/${sPeriodoIni}/${sPeriodoFin}/5`);
        }else{
          response = await fetch(`${back_host}/reporte/hojatrabajo/${params.id_anfitrion}/${sContabilidad}/${sPeriodoIni}/${sPeriodoFin}/5/${sLibro}`);
        }
    }
    
    const data = await response.json();
    setRegistrosdet(data);
    setTabladet(data); //Copia para tratamiento de filtrado
    //console.log("data", data);
  }
  //////////////////////////////////////
  
 
  const navigate = useNavigate();
  //Para recibir parametros desde afuera
  const params = useParams();

  const actualizaValorFiltro = e => {
    setValorBusqueda(e.target.value);
    filtrar(e.target.value);
  }
  const actualizaValorVista = (e) => {
    setValorVista(e.target.value);
    let idLibro;    
    idLibro = 
            e.target.value === 'analisis' ? '014'
          : e.target.value === 'hojatrab' ? '008'
          : '005';
    //setValorLibro(idLibro);
    //grabar datos sesionStorage id_libro y valorVista
    
    sessionStorage.setItem('valorVista', e.target.value);
    //console.log("sessionStorage.setItem('valorVista', valorVista): ", e.target.value);

    //cargamos valores para envio
    //ya no ...

    //Lo dejaremos terminar el evento de cambio o change
    setUpdateTrigger(Math.random());//experimento para actualizar el dom
  }
  const filtrar = (strBusca) => {
    var resultadosBusqueda = tabladet.filter((elemento) => {
      //verifica nulls para evitar error de busqueda
      const razonSocial = elemento.r_razon_social?.toString().toLowerCase() || '';
      const documentoId = elemento.r_documento_id?.toString().toLowerCase() || '';
      const comprobante = elemento.comprobante?.toString().toLowerCase() || '';
  
      if (razonSocial.includes(strBusca.toLowerCase()) || documentoId.includes(strBusca.toLowerCase()) || comprobante.includes(strBusca.toLowerCase())) {
        return elemento;
      }
      return null; // Agrega esta línea para manejar el caso en que no haya coincidencia
    });
  
    resultadosBusqueda = resultadosBusqueda.filter(Boolean); // Filtra los elementos nulos
  
    setRegistrosdet(resultadosBusqueda);
  };
  
  //////////////////////////////////////////////////////////
  useEffect( ()=> {
      //Cargamos (Fechas,RazonSocial,Libro) del historial, como parametros iniciales de consulta

      //Verificar historial periodo 
      const st_periodo_ini = sessionStorage.getItem('periodo_trabajo');
      //New Cargar Lista, con sugerencia de foco inicial
      if (st_periodo_ini===null || st_periodo_ini===''){
          //Cargar normal. y establecer periodo del historial
        cargaPeriodosAnfitrion('');
        //console.log('st_periodo_ini: zzzzz ',st_periodo_ini);
      }else{
        //en caso haya periodos y rucs, debe respetar el ambiente de trabajo anterior
        cargaPeriodosAnfitrion(st_periodo_ini);
        setPeriodoIni(st_periodo_ini);
      }

      //Verifica historial contabilidad
      const st_contabilidad_trabajo = sessionStorage.getItem('contabilidad_trabajo');
      //console.log('contabilidad_trabajo session Storage:', st_contabilidad_trabajo);
      //New Cargar Lista, con sugerencia de foco inicial
      if (st_contabilidad_trabajo===null || st_contabilidad_trabajo===''){
        //en caso no haya nada en historial, por defecto el primero
        cargaContabilidadesAnfitrion('');
      }else{
        //en caso haya periodos y rucs, debe respetar el ambiente de trabajo anterior
        cargaContabilidadesAnfitrion(st_contabilidad_trabajo);
        setContabilidadTrabajo(st_contabilidad_trabajo);
      }
      
      //Select Libre libros
      cargaLibrosContables();
      
  },[isAuthenticated, user]) //Aumentamos IsAuthenticated y user

  useEffect( ()=> {
      //Carga por cada cambio de seleccion en toggleButton
      console.log('2do useeffect periodo_ini: ',periodo_ini);

      //Verifica historial id_libro
      const st_id_libro = sessionStorage.getItem('id_libro');
      const st_valorVista = (sessionStorage.getItem('valorVista') || 'analisis'); //new para el toggleButton

      //fcuando carga x primera vez, sale vacio ... arreglar esto
      cargaRegistro(st_valorVista,periodo_ini,periodo_fin,contabilidad_trabajo,id_libro);

  },[updateTrigger]) //Aumentamos

  useEffect( ()=> {
    //Carga de Registros con permisos
    console.log('3ero useeffect periodo_ini: ',periodo_ini);

    const st_id_libro = sessionStorage.getItem('id_libro');
    const st_valorVista = sessionStorage.getItem('valorVista'); //para el toggleButton
    console.log('3ero useeffect st_id_libro: ',st_id_libro);
    if (st_id_libro) {
      //Establecer valor historial al toggleButton
      //setValorLibro(st_id_libro);
      setValorVista(st_valorVista);
    }

    const st_periodo_ini = sessionStorage.getItem('periodo_trabajo'); //parametro necesario
    const st_contabilidad_trabajo = sessionStorage.getItem('contabilidad_trabajo'); //parametro necesario

    //Secundario despues de seleccion en toggleButton
    let columnasEspecificas;
    if (st_valorVista===null || st_valorVista===undefined || st_valorVista===''){
      columnasEspecificas = VentasColumnas;
    }else{
      columnasEspecificas = 
          st_valorVista === 'analisis' ? VentasColumnas
        : st_valorVista === 'hojatrab' ? HojaTrabColumnas
        : CajaColumnas;
    }

    setColumnas([...columnasEspecificas]);
    
    //cuando carga x primera vez, sale vacio ... arreglar esto
    cargaRegistro(st_valorVista,periodo_ini,periodo_fin,contabilidad_trabajo,id_libro); //new cambio

    //Datos listos en caso de volver por aqui, para envio

  },[valorVista]) //Solo cuando este completo estado


  //////////////////////////////////////////////////////////
  const cargaPeriodosAnfitrion = (strHistorialPeriodo) =>{
    axios
    .get(`${back_host}/usuario/periodos/${params.id_anfitrion}`)
    .then((response) => {
      setPeriodosSelect(response.data);
      if (strHistorialPeriodo === '' || strHistorialPeriodo === null){
        //Establecer 1er elemento en select
        if (response.data.length > 0) {
          setPeriodoIni(response.data[0].periodo); 
          setPeriodoFin(response.data[0].periodo); 
          sessionStorage.setItem('periodo_ini',response.data[0].periodo);
        }
      }
      else{//Establecer elemento historial
        setPeriodoIni(strHistorialPeriodo); 
        setPeriodoFin(strHistorialPeriodo); 
        //console.log('periodo_ini: ', periodo_ini);
        //console.log('strHistorialPeriodo: ', strHistorialPeriodo);
      }
    })
    .catch((error) => {
        console.log(error);
    });
  }
  const cargaContabilidadesAnfitrion = (strHistorialContabilidad) =>{
    axios
    //Aqui debemos agregar restriccion de contabilidad por(usuario auxiliar)
    .get(`${back_host}/usuario/contabilidades/${params.id_anfitrion}/${params.id_invitado}`)
    .then((response) => {
      setContabilidadesSelect(response.data);
      if (strHistorialContabilidad === '' || strHistorialContabilidad === null){
        //Establecer 1er elemento en select
        if (response.data.length > 0) {
          setContabilidadTrabajo(response.data[0].documento_id); 
          sessionStorage.setItem('contabilidad_trabajo',response.data[0].documento_id);
        }
      }
      else{//Establecer elemento historial
        setContabilidadTrabajo(strHistorialContabilidad); 
      }
    })
    .catch((error) => {
        console.log(error);
    });
  }
  const cargaLibrosContables = () =>{
    axios
    .get(`${back_host}/libros`)
    .then((response) => {
      setLibroSelect(response.data);
      //Establecer 1er elemento en select
      if (response.data.length > 0) {
        //setValorLibro(response.data[0].codigo); 
        setValorLibro('todos'); 
      }
    })
    .catch((error) => {
        console.log(error);
    });
  }


  //////////////////////////////////////////////////////////


 return (
  <>
  <Grid container
        direction={isSmallScreen ? 'column' : 'row'}
        //alignItems={isSmallScreen ? 'center' : 'center'}
        justifyContent={isSmallScreen ? 'center' : 'center'}
  >

      <Grid container spacing={0}
          direction={isSmallScreen ? 'column' : 'row'}
          alignItems={isSmallScreen ? 'center' : 'center'}
          justifyContent={isSmallScreen ? 'center' : 'center'}
      >
          <Grid item xs={1.5} sm={1.5}>

          </Grid>
          <Grid item xs={4} sm={4}>

          </Grid>
      </Grid>

  </Grid>

  <div>
  <ToggleButtonGroup
    color="success"
    value={valorVista}
    exclusive
    onChange={actualizaValorVista}
    aria-label="Platform"
  >

    <ToggleButton value="analisis">ANALISIS</ToggleButton>

    <ToggleButton value="hojatrab">HOJA TRABAJO</ToggleButton>

    <ToggleButton value="eeff">EE.FF</ToggleButton>

  </ToggleButtonGroup>      
  </div>
    
  <Grid container spacing={0}
      direction={isSmallScreen ? 'column' : 'row'}
      alignItems={isSmallScreen ? 'center' : 'left'}
      justifyContent={isSmallScreen ? 'left' : 'left'}
  >

        <Grid item xs={isSmallScreen ? 1.2 : 1} >
              <Select
                    labelId="periodo"
                    //id={periodo_select.periodo}
                    size='small'
                    value={periodo_ini}
                    name="periodo_ini"
                    sx={{display:'block',
                    margin:'.1rem 0', color:"skyblue", fontSize: '13px' }}
                    label="Periodo Cont"
                    onChange={handleChange}
                    >
                      <MenuItem value="default">SELECCIONA </MenuItem>
                    {   
                        periodo_select.map(elemento => (
                        <MenuItem key={elemento.periodo} value={elemento.periodo}>
                          {elemento.periodo}
                        </MenuItem>)) 
                    }
              </Select>
        </Grid>

        <Grid item xs={isSmallScreen ? 1.2 : 1}  >    
              <Select
                    labelId="periodo"
                    //id={periodo_select.periodo}
                    size='small'
                    value={periodo_fin}
                    name="periodo_fin"
                    sx={{display:'block',
                    margin:'.1rem 0', color:"skyblue", fontSize: '13px' }}
                    label="Periodo Cont"
                    onChange={handleChange}
                    >
                      <MenuItem value="default">SELECCIONA </MenuItem>
                    {   
                        periodo_select.map(elemento => (
                        <MenuItem key={elemento.periodo} value={elemento.periodo}>
                          {elemento.periodo}
                        </MenuItem>)) 
                    }
              </Select>
        </Grid>

        <Grid item xs={isSmallScreen ? 1.2 : 3.5} >
              <Select
                    labelId="contabilidad_select"
                    //id={contabilidad_select.documento_id}
                    size='small'
                    value={contabilidad_trabajo}
                    name="contabilidad"
                    sx={{display:'block',
                    margin:'.1rem 0', color:"white", fontSize: '13px' }}
                    label="Contabilidad"
                    onChange={handleChange}
                    >
                      <MenuItem value="default">SELECCIONA </MenuItem>
                    {   
                        contabilidad_select.map(elemento => (
                        <MenuItem key={elemento.documento_id} value={elemento.documento_id}>
                          {elemento.razon_social}
                        </MenuItem>)) 
                    }
              </Select>
        </Grid>

        <Grid item xs={isSmallScreen ? 1.2 : 1.5} >
              <Select
                    labelId="libro"
                    size='small'
                    value={id_libro}
                    name="libro"
                    sx={{display:'block',
                    margin:'.1rem 0', color:"skyblue", fontSize: '13px' }}
                    label="Periodo Cont"
                    onChange={handleChange}
                    >
                      <MenuItem value="default">SELECCIONA </MenuItem>
                    {   
                        libro_select.map(elemento => (
                        <MenuItem key={elemento.codigo} value={elemento.codigo}>
                          {elemento.descripcion}
                        </MenuItem>)) 
                    }
              </Select>
        </Grid>

        <Grid item xs={isSmallScreen ? 1.2 : 0.5} >

        </Grid>

        <Grid item xs={isSmallScreen ? 1.2 : 0.5} >    

        </Grid>

        <Grid item xs={isSmallScreen ? 2 : 0.7}>    

        </Grid>
        
        <Grid item xs={isSmallScreen ? 12 : 8.3}>

        </Grid>

    <Grid item xs={isSmallScreen ? 12 : 12} >
      {(valorVista==='analisis') ? 
        (
          <TextField fullWidth variant="outlined" color="success" size="small"
                                      //label="FILTRAR"
                                      sx={{display:'block',
                                            margin:'.0rem 0'}}
                                      name="busqueda"
                                      placeholder='Filtro:  Ruc   Razon Social   Comprobante'
                                      onChange={actualizaValorFiltro}
                                      inputProps={{ style:{color:'white'} }}
                                      InputProps={{
                                          startAdornment: (
                                            <InputAdornment position="start">
                                              <FindIcon />
                                            </InputAdornment>
                                          ),
                                          style:{color:'white'} 
                                      }}
          />
        )
        :
        (
          <div></div>
        )
      }


    </Grid>


  </Grid>

  <Datatable
      //title="Registro - Pedidos"
      theme="solarized"
      columns={columnas}
      data={registrosdet}
      //selectableRows
      //selectableRowsSingle 
      //contextActions={contextActions}
      //actions={actions}
      onSelectedRowsChange={handleRowSelected}
      clearSelectedRows={toggleCleared}
      pagination
      paginationPerPage={15}
      paginationRowsPerPageOptions={[15, 50, 100]}

      selectableRowsComponent={Checkbox} // Pass the function only
      sortIcon={<ArrowDownward />}  
      dense={true}
  >
  </Datatable>

  </>
  );
}
