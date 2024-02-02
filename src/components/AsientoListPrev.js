import React from 'react';
import { useEffect, useState, useMemo, useCallback } from "react"
import { Grid, Button,useMediaQuery,Select, MenuItem, Typography} from "@mui/material";
import { useNavigate,useParams } from "react-router-dom";
import FindIcon from '@mui/icons-material/FindInPage';
import UpdateIcon from '@mui/icons-material/UpdateSharp';
import Add from '@mui/icons-material/Add';
import FindInPageIcon from '@mui/icons-material/FindInPage';
import ViewCompactIcon from '@mui/icons-material/ViewCompact';

import IconButton from '@mui/material/IconButton';
import swal from 'sweetalert';
import swal2 from 'sweetalert2'
import Datatable, {createTheme} from 'react-data-table-component';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import '../App.css';
import 'styled-components';
//import axios from 'axios';

//import { utils, writeFile } from 'xlsx';
import Tooltip from '@mui/material/Tooltip';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import LibraryAddIcon from '@mui/icons-material/LibraryAdd';
import LibraryAddRoundedIcon from '@mui/icons-material/LibraryAddRounded';
import LibraryAddCheckRoundedIcon from '@mui/icons-material/LibraryAddCheckRounded';
import axios from 'axios';

import { useAuth0 } from '@auth0/auth0-react'; //new para cargar permisos luego de verificar registro en bd
import BotonExcelVentas from './BotonExcelVentas';

export default function AsientoListPrev() {
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

  //Seccion carga de archivos
  ////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////

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
  const [valorVista, setValorVista] = useState("ventas");
  const [id_libro, setValorLibro] = useState("014");
  const [permisosComando, setPermisosComando] = useState([]); //MenuComandos
  const {user, isAuthenticated } = useAuth0();
  
  const [columnas, setColumnas] = useState([]);

  const [periodo_trabajo, setPeriodoTrabajo] = useState("");
  const [periodo_select,setPeriodosSelect] = useState([]);
  
  const [sirecompras,setSireCompras] = useState([]);
  const [sireventas,setSireVentas] = useState([]);

  const [contabilidad_trabajo, setContabilidadTrabajo] = useState("");
  const [contabilidad_nombre, setContabilidadNombre] = useState("");
  const [contabilidad_select,setContabilidadesSelect] = useState([]);

  const [bSeleccionados, setBSeleccionados] = useState(false);

  // Agrega íconos al inicio de cada columna
  let columnasComunes;
  //Permisos Nivel 01 - Menus (toggleButton)

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

  /*const handleRecarga = () => {
    setUpdateTrigger(Math.random());//experimento
  };*/

  const handleUpdate = (num_asiento) => {
    //var num_asiento;
    //num_asiento = selectedRows.map(r => r.num_asiento);
    //console.log("libro:", id_libro);
    //console.log("asiento:", num_asiento);

    
    /*
    if (navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/BlackBerry/i) || navigator.userAgent.match(/Windows Phone/i)) {
      console.log("Estás usando un dispositivo móvil!!");
      //Validamos libro a mostrar
      if (params.id_libro === "008") {
        navigate(`/asientoc/${params.id_anfitrion}/${params.id_invitado}/${params.periodo}/${params.documento_id}/${params.id_libro}/${num_asiento}/clonar`);
      }
      if (params.id_libro === "014") {
        navigate(`/asientov/${params.id_anfitrion}/${params.id_invitado}/${params.periodo}/${params.documento_id}/${params.id_libro}/${num_asiento}/clonar`);
      }
    } else {
      console.log("No estás usando un móvil");
      if (params.id_libro === "008") {
        navigate(`/asientoc/${params.id_anfitrion}/${params.id_invitado}/${params.periodo}/${params.documento_id}/${params.id_libro}/${num_asiento}/clonar`);
      }
      if (params.id_libro === "014") {
        navigate(`/asientov/${params.id_anfitrion}/${params.id_invitado}/${params.periodo}/${params.documento_id}/${params.id_libro}/${num_asiento}/clonar`);
      }
    } */   
  };

  // Función que se pasa como prop al componente.js
  
  ///////////////////////////////////////////////////////////////////////
  const cargaRegistro = async () => {
    var response;
    //Cargamos asientos correspondientes al id_usuario,contabilidad y periodo
    //console.log(`${back_host}/asientoprev/${params.id_anfitrion}/${params.periodo}/${params.documento_id}/${params.id_libro}`);
    response = await fetch(`${back_host}/asientoprev/${params.id_anfitrion}/${params.periodo}/${params.documento_id}/${params.id_libro}`);
    
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
     
      /////////////////////////////
      //NEW codigo para autenticacion y permisos de BD
      if (isAuthenticated && user && user.email) {
        
      }
  },[isAuthenticated, user]) //Aumentamos IsAuthenticated y user

  useEffect( ()=> {
      //Carga por cada cambio de seleccion en toggleButton
      console.log('2do useeffect');

      cargaColumnasComunes();
      //console.log('columnas comunes: ', columnasComunes);
      setColumnas([...columnasComunes]);
  
      //fcuando carga x primera vez, sale vacio ... arreglar esto
      cargaRegistro();

  },[updateTrigger]) //Aumentamos


  //////////////////////////////////////////////////////////
  const cargaColumnasComunes = () =>{
    //Verificar que el resto de permisos de otros libros siempre esten FALSE
    //Solo el libro en cuestion, validara TRUE OR FALSE

    columnasComunes = [
      {
        name: '',
        width: '40px',
        cell: (row) => (
          (row.resultado==='SIRE - XPERT' ) ? (
            <Tooltip title='Clonar Registro Sire'>
            <LibraryAddRoundedIcon
              onClick={() => handleUpdate(row.num_asiento)}
              style={{
                cursor: 'pointer',
                color: 'skyblue',
                transition: 'color 0.3s ease',
              }}
            />
          </Tooltip>
          ) : null
        ),
        allowOverflow: true,
        button: true,
      },
      {//origen
        name: 'Origen',
        selector: 'resultado',
        width: '110px',
        sortable: true,
      },
      {//05
        name: 'Emision',
        selector: 'r_fecemi',
        width: '100px',
        sortable: true,
      },
      {//07-08-10
        name: 'Comprobante',
        selector: 'comprobante', //campo unido
        width: '150px',
        sortable: true,
      },
      {//11
        name: 'Tp',
        selector: 'r_id_doc',
        width: '40px',
        sortable: true,
      },
      {//12
        name: 'Ruc',
        selector: 'r_documento_id',
        width: '110px',
        sortable: true,
      },
      {//13
        name: 'Razon Social',
        selector: 'r_razon_social',
        width: '210px',
        sortable: true,
      },
      {//26
        name: 'TOTAL',
        selector: 'r_monto_total',
        width: '100px',
        sortable: true,
      },
      {//27 PEN o USD
        name: 'MONEDA',
        selector: 'r_moneda',
        width: '90px',
        sortable: true,
      },
      {//28
        name: 'TC',
        selector: 'r_tc',
        width: '70px',
        sortable: true,
      },
      {//29
        name: 'REF.Emision',
        selector: 'r_fecemi_ref',
        width: '110px',
        sortable: true,
      },
      {//30
        name: 'REF.TP',
        selector: 'r_cod_ref',
        width: '110px',
        sortable: true,
      },
      {//31
        name: 'REF.SERIE',
        selector: 'r_serie_ref',
        width: '110px',
        sortable: true,
      },
      {//32
        name: 'REF.NUM',
        selector: 'r_numero_ref',
        width: '110px',
        sortable: true,
      },

    ];
  }

  //////////////////////////////////////////////////////////
  const originalColor = '#1e272e';
  const conditionalRowStyles = [
    {
      when: row => row.resultado==='SIRE - XPERT',
      style: {
        backgroundColor: aclararColor(originalColor,120),
      },
    },
  ];
  function aclararColor(hex, percent) {
    // Parsear el color hexadecimal a componentes RGB
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
  
    // Calcular el porcentaje de aclarado
    let factor = 1 + percent / 100;
  
    // Ajustar los componentes RGB
    r = Math.round(r * factor);
    g = Math.round(g * factor);
    b = Math.round(b * factor);
  
    // Asegurar que los valores estén en el rango [0, 255]
    r = Math.min(255, r);
    g = Math.min(255, g);
    b = Math.min(255, b);
  
    // Convertir los componentes RGB de nuevo a formato hexadecimal
    const nuevoHex = `#${(r).toString(16).padStart(2, '0')}${(g).toString(16).padStart(2, '0')}${(b).toString(16).padStart(2, '0')}`;
  
    return nuevoHex;
  }

  const contextActions = useMemo(() => {
    if (selectedRows.length > 0) {
      setBSeleccionados(true);
    }else{
      setBSeleccionados(false);
    }


    const handleUpdate = () => {
			var strSeleccionado;
      strSeleccionado = selectedRows.map(r => r.num_asiento);
			//navigate(`/correntista/${strSeleccionado}/edit`);
      console.log("registros seleccionados:", tabladet.length);
      console.log("registros seleccionados:", registrosdet.length);      
      console.log("num_asiento:", strSeleccionado);      

      const elementosSeleccionados = registrosdet.filter(registro => selectedRows.some(seleccionado => seleccionado.num_asiento === registro.num_asiento));
      console.log("Elementos seleccionados:", elementosSeleccionados);      
      // Hacer algo con los elementos seleccionados
		};

		return (
      <>

        { /*(params.id_libro === '0141') ?
        (
            <TextField  variant="outlined" color="success" size="small"
                  sx={{display:'block',
                        margin:'.0rem 0'}}
                  name="busqueda"
                  placeholder='Cuenta 70'
                  //onChange={actualizaValorFiltro}
                  inputProps={{ style:{color:'white'} }}
                  InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                        </InputAdornment>
                      ),
                      style:{color:'white'} 
                  }}
            />
        )
        :
        (   <>
            <TextField  variant="outlined" color="success" size="small"
                  sx={{display:'block',
                        margin:'.0rem 0'}}
                  name="busqueda"
                  placeholder='Cuenta 6X'
                  //onChange={actualizaValorFiltro}
                  inputProps={{ style:{color:'white'} }}
                  InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                        </InputAdornment>
                      ),
                      style:{color:'white'} 
                  }}
            />

            <TextField  variant="outlined" color="success" size="small"
                  sx={{display:'block',
                        margin:'.0rem 0'}}
                  name="busqueda"
                  placeholder='Cta CargoDest'
                  //onChange={actualizaValorFiltro}
                  inputProps={{ style:{color:'white'} }}
                  InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                        </InputAdornment>
                      ),
                      style:{color:'white'} 
                  }}
            />

            <TextField  variant="outlined" color="success" size="small"
                  sx={{display:'block',
                        margin:'.0rem 0'}}
                  name="busqueda"
                  placeholder='Cta AbonoDest'
                  //onChange={actualizaValorFiltro}
                  inputProps={{ style:{color:'white'} }}
                  InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                        </InputAdornment>
                      ),
                      style:{color:'white'} 
                  }}
            />

          </>
        )*/
        }
      <Grid container
            direction={isSmallScreen ? 'column' : 'column'}
            alignItems={isSmallScreen ? 'center' : 'center'}
            justifyContent={isSmallScreen ? 'center' : 'center'}
      >
          <Grid item xs={12} >
          { (params.id_libro === '0141') ?
            (   <>
                <p></p>
                <TextField  variant="outlined" color="success" size="small"
                      sx={{display:'block',
                            margin:'.0rem 0'}}
                      name="busqueda"
                      placeholder='Cuenta 70'
                      //onChange={actualizaValorFiltro}
                      inputProps={{ style:{color:'white'} }}
                      InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                            </InputAdornment>
                          ),
                          style:{color:'white'} 
                      }}
                />
                </>
            )
            :
            (   <>
                
                <TextField  variant="outlined" color="success" size="small"
                      sx={{display:'block',
                            margin:'.0rem 0'}}
                      name="busqueda"
                      placeholder='Cuenta 6X'
                      //onChange={actualizaValorFiltro}
                      inputProps={{ style:{color:'white'} }}
                      InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                            </InputAdornment>
                          ),
                          style:{color:'white'} 
                      }}
                />

                <TextField  variant="outlined" color="success" size="small"
                      sx={{display:'block',
                            margin:'.0rem 0'}}
                      name="busqueda"
                      placeholder='Cta CargoDest'
                      //onChange={actualizaValorFiltro}
                      inputProps={{ style:{color:'white'} }}
                      InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                            </InputAdornment>
                          ),
                          style:{color:'white'} 
                      }}
                />

                <TextField  variant="outlined" color="success" size="small"
                      sx={{display:'block',
                            margin:'.0rem 0'}}
                      name="busqueda"
                      placeholder='Cta AbonoDest'
                      //onChange={actualizaValorFiltro}
                      inputProps={{ style:{color:'white'} }}
                      InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                            </InputAdornment>
                          ),
                          style:{color:'white'} 
                      }}
                />

              </>
            )
          }

          </Grid>

          <Grid item xs={12} >
          <Button variant='text' key="modificar" onClick={handleUpdate} color='inherit' fullWidth>
            GENERAR
          <UpdateIcon/>
          </Button>
          </Grid>
      </Grid>

      </>
		);
	}, [registrosdet, selectedRows, toggleCleared]);


 return (
  <>

  <Grid container spacing={0}
      direction={isSmallScreen ? 'column' : 'row'}
      alignItems={isSmallScreen ? 'center' : 'end'}
      justifyContent={isSmallScreen ? 'center' : 'end'}
  >
      <Grid item xs={2} >

      { (bSeleccionados && params.id_libro === '0141') ?
        (
            <TextField  variant="outlined" color="success" size="small"
                  sx={{display:'block',
                        margin:'.0rem 0'}}
                  name="busqueda"
                  placeholder='Cuenta 70'
                  //onChange={actualizaValorFiltro}
                  inputProps={{ style:{color:'white'} }}
                  InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                        </InputAdornment>
                      ),
                      style:{color:'white'} 
                  }}
            />
        )
        :
        (   
          <>
          </>
        )
        }


      { (bSeleccionados && params.id_libro === '014') ?
        (
          <>
          <TextField  variant="outlined" color="success" size="small"
                sx={{display:'block',
                      margin:'.0rem 0'}}
                name="busqueda"
                placeholder='Cuenta 6X'
                //onChange={actualizaValorFiltro}
                inputProps={{ style:{color:'white'} }}
                InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                      </InputAdornment>
                    ),
                    style:{color:'white'} 
                }}
          />

          <TextField  variant="outlined" color="success" size="small"
                sx={{display:'block',
                      margin:'.0rem 0'}}
                name="busqueda"
                placeholder='Cta CargoDest'
                //onChange={actualizaValorFiltro}
                inputProps={{ style:{color:'white'} }}
                InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                      </InputAdornment>
                    ),
                    style:{color:'white'} 
                }}
          />

          <TextField  variant="outlined" color="success" size="small"
                sx={{display:'block',
                      margin:'.0rem 0'}}
                name="busqueda"
                placeholder='Cta AbonoDest'
                //onChange={actualizaValorFiltro}
                inputProps={{ style:{color:'white'} }}
                InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                      </InputAdornment>
                    ),
                    style:{color:'white'} 
                }}
          />

        </>
        )
        :
        (   
          <div></div>
        )
        }

      </Grid>

  </Grid>

  <Datatable
      //title="GENERADOR - Asientos"
      //title={<div style={{ visibility: 'hidden', height: 0, overflow: 'hidden' }}> </div>}
      title={<div>
              <Grid container
                    direction={isSmallScreen ? 'column' : 'column'}
                    alignItems={isSmallScreen ? 'center' : 'center'}
                    justifyContent={isSmallScreen ? 'center' : 'center'}
              >
                  <Grid item xs={12} >
                    <p></p>
                  </Grid>

                  <Grid item xs={12} >
                    <Typography>GENERADOR ASIENTOS</Typography>
                  </Grid>
                  <Grid item xs={12} >
                    <BotonExcelVentas registrosdet={registrosdet} 
                      />          
                  </Grid>
                  <Grid item xs={12} >
                    <p></p>
                  </Grid>
                  <Grid item xs={12} >
                    <p></p>
                  </Grid>
                  
                      <TextField fullWidth variant="outlined" color="success" size="small"
                                                  sx={{display:'block',
                                                        margin:'.0rem 0'}}
                                                  name="busqueda"
                                                  placeholder='RUC - RAZON SOCIAL - SERIE'
                                                  onChange={actualizaValorFiltro}
                                                  inputProps={{ style:{color:'white', textAlign: 'center', textTransform: 'uppercase'} }}
                                                  InputProps={{
                                                      startAdornment: (
                                                        <InputAdornment position="start">
                                                        </InputAdornment>
                                                      ),
                                                      style:{color:'white'} 
                                                  }}
                      />
                  
              </Grid>
         </div>}
      theme="solarized"
      columns={columnas}
      data={registrosdet}
      selectableRows
      //selectableRowsSingle 
      contextActions={contextActions}
      //actions={actions}
      onSelectedRowsChange={handleRowSelected}
      clearSelectedRows={toggleCleared}
      pagination
      paginationPerPage={15}
      paginationRowsPerPageOptions={[15, 50, 100]}

      selectableRowsComponent={Checkbox} // Pass the function only
      sortIcon={<ArrowDownward />}  
      dense={true}
      conditionalRowStyles={conditionalRowStyles} 
  >
  </Datatable>

  </>
  );
}
