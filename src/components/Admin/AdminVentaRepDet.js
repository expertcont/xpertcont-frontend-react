import React from 'react';
import { useEffect, useState, useMemo, useCallback } from "react"
import { Card,CardContent,Box,Modal,Grid, Button,useMediaQuery,Select, MenuItem,Dialog,DialogContent,DialogTitle,Typography} from "@mui/material";
import { useNavigate,useParams } from "react-router-dom";
import FindIcon from '@mui/icons-material/FindInPage';
//import createPdfTicket from './AdminVentaPdf';
import DaySelector from "./AdminDias";

import Datatable, {createTheme} from 'react-data-table-component';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import '../../App.css';
import 'styled-components';
//import axios from 'axios';

//import { utils, writeFile } from 'xlsx';
import Tooltip from '@mui/material/Tooltip';
import axios from 'axios';

import { useAuth0 } from '@auth0/auth0-react'; //new para cargar permisos luego de verificar registro en bd
import BotonExcelVentas from '../BotonExcelVentas';

import { AdminVentasDetColumnas } from './AdminColumnas';


export default function AdminVentaRepDet() {
  //Control de useffect en retroceso de formularios
  //verificamos si es pantalla pequeña y arreglamos el grid de fechas
  const isSmallScreen = useMediaQuery('(max-width: 600px)');

  //Seccion Dialog
  const [isDialogOpen, setDialogOpen] = useState(false);

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

  const [periodo_trabajo, setPeriodoTrabajo] = useState("");
  const [periodo_select,setPeriodosSelect] = useState([]);
  
  const [contabilidad_trabajo, setContabilidadTrabajo] = useState("");
  const [contabilidad_nombre, setContabilidadNombre] = useState("");
  const [contabilidad_select,setContabilidadesSelect] = useState([]);

  let [diaSel, setDiaSel] = useState("*");

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

  
  /*const procesaPDF = async (comprobante, nElem, tamaño) => {
    try {
        const [COD, SERIE, NUM] = comprobante.split('-');

        // Realizar ambas llamadas de API en paralelo
        const [resVenta, resVentaDet] = await Promise.all([
            fetch(`${back_host}/ad_venta/${periodo_trabajo}/${params.id_anfitrion}/${params.documento_id}/${COD}/${SERIE}/${NUM}/${nElem}`).then((res) => res.json()),
            fetch(`${back_host}/ad_ventadet/${periodo_trabajo}/${params.id_anfitrion}/${params.documento_id}/${COD}/${SERIE}/${NUM}/${nElem}`).then((res) => res.json())
        ]);

        // Configuración del ticket
        const options = {
            comprobante,
            documento_id: params.documento_id,
            id_invitado: params.id_invitado,
            venta: resVenta,
            ventadet: resVentaDet,
            logo,
            size: tamaño
        };

        // Generar el PDF
        let pdfUrl = "#";
        try {
            pdfUrl = await createPdfTicket(options); // Asegúrate de manejar correctamente esta función
            // Abre la URL en una nueva pestaña del navegador
            window.open(pdfUrl, '_blank');
        } catch (error) {
            console.error("Error al generar el PDF:", error);
        }

    } catch (error) {
        console.error("Error al procesar PDF", error);
        throw new Error("No se pudo generar el PDF.");
    }
  };*/

  
  
 ///////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////
  const cargaRegistro = async (strHistorialValorVista,strHistorialPeriodo,strHistorialContabilidad, sDia) => {
    let response;
    console.log("cargaRegistro sDia: ", sDia);
    //Cargamos asientos correspondientes al id_usuario,contabilidad y periodo
    if (strHistorialValorVista==='' || strHistorialValorVista===undefined || strHistorialValorVista===null){
        console.log(`${back_host}/ad_ventadettodos/${periodo_trabajo}/${params.id_anfitrion}/${contabilidad_trabajo}/${sDia}`);
        response = await fetch(`${back_host}/ad_ventadettodos/${periodo_trabajo}/${params.id_anfitrion}/${contabilidad_trabajo}/${sDia}`);
    }
    else{
        //usamos los historiales
        console.log(`${back_host}/ad_ventadettodos/${strHistorialPeriodo}/${params.id_anfitrion}/${strHistorialContabilidad}/${sDia}`);
        response = await fetch(`${back_host}/ad_ventadettodos/${strHistorialPeriodo}/${params.id_anfitrion}/${strHistorialContabilidad}/${sDia}`);
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

  /*useEffect( ()=> {
    
      //Carga por cada cambio de seleccion en toggleButton
      console.log('2do useeffect periodo_trabajo: ',periodo_trabajo);

      //Verifica historial id_libro
      const st_id_libro = sessionStorage.getItem('id_libro');
      const st_valorVista = (sessionStorage.getItem('valorVista') || 'ventas'); //new para el toggleButton

      if (st_id_libro) {
        //Establecer valor historial al toggleButton
        setValorVista(st_valorVista);
      }

      if (st_valorVista===null || st_valorVista===undefined || st_valorVista===''){

      setValorVista('ventas'); //Por default, la 1era vez
      //st_valorVista = 'ventas'; //new 
      }else{
      setValorVista(st_valorVista);
      }

      //fcuando carga x primera vez, sale vacio ... arreglar esto
      cargaRegistro(st_valorVista,periodo_trabajo,contabilidad_trabajo, diaSel);
    
      fetchTotalVentas();
  },[updateTrigger, diaSel]) //Aumentamos*/


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
    columnasEspecificas = AdminVentasDetColumnas;

    // Finalmente seteamos
    setColumnas(columnasEspecificas);    

    //cuando carga x primera vez, sale vacio ... arreglar esto
    cargaRegistro(st_valorVista,periodo_trabajo,contabilidad_trabajo, diaSel); //new cambio

    //Datos listos en caso de volver por aqui, para envio
    setDatosCarga(prevState => ({ ...prevState, id_anfitrion: params.id_anfitrion }));
    setDatosCarga(prevState => ({ ...prevState, periodo: st_periodo_trabajo }));
    setDatosCarga(prevState => ({ ...prevState, documento_id: st_contabilidad_trabajo }));
    setDatosCarga(prevState => ({ ...prevState, id_libro: st_id_libro }));
    setDatosCarga(prevState => ({ ...prevState, id_invitado: params.id_invitado }));
    
    fetchTotalVentas();
  },[valorVista, diaSel]) //Solo cuando este completo estado


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
  
const [totalVentas, setTotalVentas] = useState(0);
const [isSuper, setIsSuper] = useState(false);
const fetchTotalVentas = async () => {
    try {
      const res = await axios.get(`${back_host}/ad_ventatotal/${periodo_trabajo}/${params.id_anfitrion}/${params.id_invitado}/${diaSel}`);
      console.log('Tottales ventas: ', res.data);
      setTotalVentas(res.data.total);
      setIsSuper(res.data.super);
    } catch (error) {
      console.error('Error al obtener total de ventas', error);
    }
}; 
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

 return (
  <>
   <div style={{ backgroundColor: '#1e272e', 
                 //minHeight: '100vh', 
                 //padding: '20px', 
                 //marginTop: 30,  
                 //marginLeft: -65, 
                 margin: 0,
                 width: "100%" }}
    > 

             { (showModalMostrarRecaudacion) ?
                (   <>
                            {/* Seccion para mostrar Dialog tipo Modal, para busqueda incremental cuentas */}
                            <Dialog
                              open={showModalMostrarRecaudacion}
                              onClose={() => setShowModalMostrarRecaudacion(false)}
                              maxWidth="md" // Valor predeterminado de 960px
                              //fullWidth
                              disableScrollLock // Evita que se modifique el overflow del body
                              PaperProps={{
                                style: {
                                  top: isSmallScreen ? "-30vh" : "0vh", // Ajusta la distancia desde arriba
                                  left: isSmallScreen ? "0%" : "0%", // Centrado horizontal
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  marginTop: '10vh', // Ajusta este valor según tus necesidades
                                  background: 'rgba(30, 39, 46, 0.95)', // Plomo transparencia                              
                                  //background: 'rgba(16, 27, 61, 0.95)', // Azul transparencia                              
                                  color:'white',
                                  width: isSmallScreen ? ('50%') : ('30%'), // Ajusta este valor según tus necesidades
                                  //width: isSmallScreen ? ('100%') : ('40%'), // Ajusta este valor según tus necesidades
                                  //maxWidth: 'none' // Esto es importante para permitir que el valor de width funcione
                                },
                              }}
                            >
                            <DialogTitle>Total - Unidades</DialogTitle>

                                {/* Listado de recaudaciones */}
                                <Card sx={{ width: '90%', background: 'rgba(255,255,255,0.05)', color: 'white', mb: 2 }}>
                                  <CardContent>
                                    {recaudaciones.length > 0 ? (
                                      recaudaciones.map((item, index) => (
                                        <Box
                                          key={index}
                                          sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            mb: 1,
                                            borderBottom: '1px solid rgba(255,255,255,0.2)',
                                            pb: 0.5
                                          }}
                                        >
                                          <Typography variant="body1">{item.cont_und}</Typography>
                                          
                                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                            {Number(item.total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </Typography>
                                        </Box>
                                      ))
                                    ) : (
                                      <Typography variant="body2" sx={{ opacity: 0.7 }}>No hay unidades</Typography>
                                    )}
                                  </CardContent>
                                </Card>


                                <Button variant='contained' 
                                            //color='warning' 
                                            //size='small'
                                            onClick={()=>{
                                                  setShowModalMostrarRecaudacion(false);
                                              }
                                            }
                                            sx={{display:'block',
                                                  margin:'.5rem 0',
                                                  width: 270, 
                                                  backgroundColor: 'rgba(30, 39, 46)', // Plomo 
                                                '&:hover': {
                                                      backgroundColor: 'rgba(30, 39, 46, 0.1)', // Color de fondo en hover: Plomo transparente
                                                    },                                                             
                                                  mt:-0.5}}
                                            >
                                            ESC - CERRAR
                                </Button>

                            </Dialog>
                    </>
                )
                :
                (   
                  <>
                  </>
                )
              }  
  <div>
  </div>

  <Grid container spacing={0}
      direction={isSmallScreen ? 'column' : 'row'}
      //alignItems={isSmallScreen ? 'center' : 'center'}
      justifyContent={isSmallScreen ? 'center' : 'center'}
  >
      <Grid item xs={1.5} sm={1.5}>
          <Select
                labelId="periodo"
                //id={periodo_select.periodo}
                size='small'
                value={periodo_trabajo}
                name="periodo"
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
      <Grid item xs={4} sm={4}>
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

      <Grid item xs={2} sm={2}>
      {(String(params.id_anfitrion) === String(params.id_invitado) || isSuper) && (
        <Button variant="contained" 
                color="primary" 
                onClick={() => handleClickTotal(periodo_trabajo, params.id_anfitrion, contabilidad_trabajo, diaSel)}
                fullWidth
        >TOTAL UNIDADES
        </Button>
      )}

      </Grid>

  </Grid>

  
  <DaySelector period={periodo_trabajo} onDaySelect={handleDayFilter} />
  
  <div>
  </div>
    
  <Grid container spacing={0}
      direction={isSmallScreen ? 'row' : 'row'}
      alignItems={isSmallScreen ? 'center' : 'left'}
      justifyContent={isSmallScreen ? 'left' : 'left'}
  >

        <Grid item xs={isSmallScreen ? 1.2 : 0.5} >
          <Tooltip title='EXPORTAR XLS' >
              <BotonExcelVentas registrosdet={registrosdet} 
              />
          </Tooltip>
        </Grid>

        <Grid item xs={isSmallScreen ? 1.2 : 0.5}  >    
            <div></div>
        </Grid>

        <Grid item xs={isSmallScreen ? 1.2 : 0.5} >

        </Grid>

        <Grid item xs={isSmallScreen ? 1.2 : 0.5} >

        </Grid>

        <Grid item xs={isSmallScreen ? 1.2 : 0.5} >

        </Grid>

        <Grid item xs={isSmallScreen ? 1.2 : 0.5} >    

        </Grid>

        <Grid item xs={isSmallScreen ? 2 : 0.7}>    

        </Grid>
        
        {/* El componente del cuadro de diálogo */}
        {isDialogOpen && (
        
        <Grid item xs={isSmallScreen ? 12 : 8.8}>

        </Grid>

        )}

    <Grid item xs={isSmallScreen ? 12 : 8.3}>

    </Grid>


    <Grid item xs={isSmallScreen ? 12 : 12} >
        <TextField fullWidth variant="outlined" color="success" size="small"
                                    //label="FILTRAR"
                                    sx={{display:'block',
                                          margin:'.0rem 0'}}
                                    name="busqueda"
                                    placeholder='FILTRAR:  RUC   RAZON SOCIAL   COMPROBANTE'
                                    onChange={actualizaValorFiltro}
                                    inputProps={{ style:{color:'white'} }}
                                    InputProps={{
                                        startAdornment: (
                                          <InputAdornment position="start">
                                            <FindIcon />
                                          </InputAdornment>
                                        ),
                                        style:{color:'white'},
                                        // Estilo para el placeholder
                                        inputProps: { style: { fontSize: '14px', color: 'gray' } }                                         
                                    }}
        />
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
</div>
  </>
  );
}
