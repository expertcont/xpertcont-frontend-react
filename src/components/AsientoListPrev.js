import React from 'react';
import { useEffect, useState, useMemo, useCallback,useRef } from "react"
import { Grid,Button,useMediaQuery,Select, MenuItem, Typography,Dialog,DialogContent,DialogTitle,List,ListItem,ListItemText} from "@mui/material";
import { useNavigate,useParams } from "react-router-dom";
import FindIcon from '@mui/icons-material/FindInPage';
import UpdateIcon from '@mui/icons-material/UpdateSharp';
import KeyboardIcon from '@mui/icons-material/Keyboard';

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
import LibraryAddRoundedIcon from '@mui/icons-material/LibraryAddRounded';
import axios from 'axios';
import ListaPopUp from './ListaPopUp';

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

  const handleProcesaAsientos = async() => {
    console.log("asientoTipo.cuentaAbonoDest: ", asientoTipo.cuentaAbonoDest);
    //tratamiento del destino en caso este auxiliar, estara concatenado con el codigo de la cuenta
    const [sCuentaDestino,sResto] = asientoTipo.cuentaAbonoDest.split('-');

    const elementosSeleccionados = registrosdet.filter(registro => selectedRows.some(seleccionado => seleccionado.num_asiento === registro.num_asiento));
    
    let nombreApi = params.id_libro === '014' ? 'asientomasivoventas': 'asientomasivocompras';
    let sRuta = params.id_libro === '014' ? 
      `${back_host}/${nombreApi}/${params.id_anfitrion}/${params.documento_id}/${params.periodo}/${asientoTipo.cuentaBase}/${glosa}`
      : 
      `${back_host}/${nombreApi}/${params.id_anfitrion}/${params.documento_id}/${params.periodo}/${asientoTipo.cuentaBase}/${asientoTipo.cuentaCargoDest}/${sCuentaDestino.trim()}/${glosa}`;

    //console.log("cuentaBase,cuentaCargoDest,cuentaAbonoDest: ",cuentaBase,cuentaCargoDest,cuentaAbonoDest);
    console.log(sRuta);
    //console.log('Tamaño bytes completo: ',calcularTamanoJSON(JSON.stringify(elementosSeleccionados)));
    const soloNumAsientos = elementosSeleccionados.map(item => item.num_asiento);
    const soloNumAsientosString = soloNumAsientos.join(',');
    console.log('Tamaño bytes num_asientos: ',calcularTamanoJSON(JSON.stringify(soloNumAsientosString)));
    //console.log(soloNumAsientosString);
    await fetch(sRuta, {
      method: "POST",
      body: soloNumAsientosString, //tamaño minimo para evitar rechazo en backend railway
      headers: {"Content-Type":"text/plain"}
    });

    setUpdateTrigger(Math.random());//actualizar vista
  };

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
  const [valorBusqueda, setValorBusqueda] = useState(""); //txt: rico filtrado
   const {user, isAuthenticated } = useAuth0();
  
  const [columnas, setColumnas] = useState([]);
  const [bSeleccionados, setBSeleccionados] = useState(false);
  
  
  const [cuenta_select,setCuentaSelect] = useState([]); //Cuenta 6X
  const [searchText, setSearchText] = useState('');
  
  //Variables estado para manejo de cuentas amarre contable
  const [glosa, setGlosa] = useState('');

  const [asientoTipo,setAsientoTipo] = useState({
        cuentaBase:'',
        cuentaBaseDesc:'',

        cuentaCargoDest:'',
        cuentaCargoDestDesc:'',

        cuentaAbonoDest:'',
        cuentaAbonoDestDesc:'',

        glosa:''
  });
  
  const textFieldRef = useRef(null); //foco del buscador  
  const [showModalCuentaBase, setShowModalCuentaBase] = useState(false); //
  const [showModalCuentaDestino, setShowModalCuentaDestino] = useState(false); //
  const [showModalCuentaDestino02, setShowModalCuentaDestino02] = useState(false); //

  const [showModalAsTipoCompra, setShowModalAsTipoCompra] = useState(false); //Mostrar Ocultar Asiento Tipo
  const [showModalAsTipoVenta, setShowModalAsTipoVenta] = useState(false); //Mostrar Ocultar Asiento Tipo
  


  // Agrega íconos al inicio de cada columna
  let columnasComunes;
  //Permisos Nivel 01 - Menus (toggleButton)

  // valores adicionales para Carga Archivo

  const handleRowSelected = useCallback(state => {
		setSelectedRows(state.selectedRows);
	}, []);

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

  const handleChange = e => {
      //Creo que la manipulacion de cuentas, debe ser controlada. NO LIBRE
      //NO USAREMOS ESTA SECCION HASTA NUEVO REQUERIMIENTO
      console.log(e.target.value.toUpperCase());
    if (e.target.name === "glosa") {
      setGlosa(e.target.value.toUpperCase());
      return;
    }
  }

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

  const cargaCuentaContable = (sCuentaFiltro) =>{
    axios
    .get(`${back_host}/cuentassimplepopup/${params.id_anfitrion}/${params.documento_id}/${sCuentaFiltro}`)
    .then((response) => {
        setCuentaSelect(response.data);
    })
    .catch((error) => {
        console.log(error);
    });
  }
  const cargaAmarreContable = (sCuentaFiltro) =>{
    axios
    .get(`${back_host}/cuentasamarre6/${params.id_anfitrion}/${sCuentaFiltro}`)
    .then((response) => {
      setCuentaSelect(response.data);
    })
    .catch((error) => {
        console.log(error);
    });
  }

  //////////////////////////////////////////////////////////
  useEffect( ()=> {
      //Carga por cada cambio de seleccion en toggleButton
      console.log('1ER useeffect');

      cargaColumnasComunes();
      //console.log('columnas comunes: ', columnasComunes);
      setColumnas([...columnasComunes]);
  
      //fcuando carga x primera vez, sale vacio ... arreglar esto
      cargaRegistro();

      setGlosa(params.id_libro === '008' ? 'COMPRAS' : 'VENTAS');
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
              //onClick={() => handleUpdate(row.num_asiento)}
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
  function calcularTamanoJSON(objeto) {
    // Convertimos el objeto JSON a una cadena de texto
    var jsonString = JSON.stringify(objeto);
    // Devolvemos la longitud de la cadena en bytes
    return new Blob([jsonString]).size;
  }
  const contextActions = useMemo(() => {
    if (selectedRows.length > 0) {
      setBSeleccionados(true);
    }else{
      setBSeleccionados(false);
    }
    
    const handleAsientoTipo = async() => {
      if (params.id_libro === "008") {
        setShowModalAsTipoCompra(true);
      }else{
        setShowModalAsTipoVenta(true);
      }
		};

     /* //version envio de json, ocupa el doble de espacio
      const soloNumAsientos = elementosSeleccionados.map(item => {
        return { num_asiento: item.num_asiento };
      });
      console.log('Tamaño bytes solo num_asiento: ',calcularTamanoJSON(JSON.stringify(soloNumAsientos)));
      //console.log(JSON.stringify(soloNumAsientos));
      await fetch(sRuta, {
        method: "POST",
        body: JSON.stringify(soloNumAsientos), //cambiazo de elementosSeleccionados por soloNumAsientos, tamaño minimo json para evitar rechazo en backend railway
        headers: {"Content-Type":"application/json"}
      });*/

		return (
      <>
          <Button variant='text' key="modificar" 
                  onClick={handleAsientoTipo} 
                  color='inherit' fullWidth>
            ASIENTO TIPO
          <UpdateIcon/>
          </Button>
      </>
		);
	}, [registrosdet, selectedRows, toggleCleared]);


 return (
  <>

  <Grid container spacing={0}
      direction={isSmallScreen ? 'column' : 'row'}
      alignItems={isSmallScreen ? 'center' : 'start'}
      justifyContent={isSmallScreen ? 'center' : 'end'}
  >
      <Grid item xs={7} >
      </Grid>
  </Grid>

  { (showModalAsTipoVenta) ?
    (   <>
                {/* Seccion para mostrar Dialog tipo Modal, para busqueda incremental cuentas */}
                <Dialog
                  open={showModalAsTipoVenta}
                  onClose={() => setShowModalAsTipoVenta(false)}
                  maxWidth="md" // Valor predeterminado de 960px
                  //fullWidth
                  disableScrollLock // Evita que se modifique el overflow del body
                  PaperProps={{
                    style: {
                      top: isSmallScreen ? "-40vh" : "0vh", // Ajusta la distancia desde arriba
                      left: isSmallScreen ? "-25%" : "0%", // Centrado horizontal
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      //marginTop: '10vh', // Ajusta este valor según tus necesidades
                      background: 'rgba(30, 39, 46, 0.9)', // Plomo transparencia                                                                            
                      color:'white',
                      width: isSmallScreen ? ('40%') : ('30%'), // Ajusta este valor según tus necesidades
                      //width: isSmallScreen ? "90vw" : "500px",                                              
                      //maxWidth: 'none' // Esto es importante para permitir que el valor de width funcione
                    },
                  }}
                >
                <DialogTitle>Asiento Tipo</DialogTitle>
                    <Tooltip title={searchText}>
                    <TextField
                      variant="outlined"
                      placeholder="CUENTA 70X"
                      //inputRef={inputProductoRef} // Asocia la referencia al campo de texto
                      //onFocus={handleFocus} //Si esta en celular, quita el foco y desaparece automaticament el teclado
                      autoFocus
                      size="small"
                      name="cuentaBaseModal"
                      value={(asientoTipo.cuentaBase + " " + asientoTipo.cuentaBaseDesc).trim() || ""}
                      InputLabelProps={{ style: { color: 'white' } }}
                      InputProps={{
                        style: { color: 'white', width: 270 },
                        startAdornment: (
                          <InputAdornment position="start">
                            
                            <IconButton
                              color="primary"
                              //color = 'rgba(33, 150, 243, 0.8)'
                              aria-label="upload picture"
                              component="label"
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: '50%',
                                left: 0,
                                transform: 'translateY(-50%)',
                              }}
                              onClick={() => {
                                cargaCuentaContable('7');
                                setShowModalCuentaBase(true);
                              }}
                            >
                              <FindIcon />
                            </IconButton>
                            
                            { //En caso celular, mostrar icono teclado, (desactivado teclado al momento del foco)
                            isSmallScreen ? (
                            <IconButton
                              color="default"
                              aria-label="Muestra teclado"
                              size="small"
                              //onClick={handleMostrarTecladoCelular} // Mostrar teclado virtual en celular
                              sx={{
                                padding: '0px',
                                //height:'30',
                                marginLeft:'20px',
                                marginRight: '-30px',
                                backgroundColor: 'primary', // Color de fondo del ícono
                                borderRadius: '4px', // Bordes redondeados
                                '&:hover': {
                                  backgroundColor: 'skyblue', // Color de fondo al hacer hover
                                },
                              }}                                                        
                            >
                              <KeyboardIcon />
                            </IconButton>
                            )
                            :
                            null
                          }

                          </InputAdornment>
                        ),

                        // Aquí se ajusta el padding del texto sin afectar el icono
                        inputProps: {
                          style: {
                            paddingLeft: '32px', // Mueve solo el texto a la derecha
                              fontSize: '12px', // Ajusta el tamaño de letra aquí
                          },
                        },
                      }}
                    />
                    </Tooltip>
                          <ListaPopUp
                              registroPopUp={cuenta_select}
                              showModal={showModalCuentaBase}
                              setShowModal={setShowModalCuentaBase}
                              registro={asientoTipo}                    
                              setRegistro={setAsientoTipo}                    
                              idCodigoKey="cuentaBase"
                              descripcionKey="cuentaBaseDesc"
                              auxiliarKey="auxiliar"
                          />

                    <TextField
                      variant="outlined"
                      placeholder="GLOSA"
                      autoFocus
                      size="small"
                      name="glosa"
                      value={glosa}
                      onChange={handleChange}
                      multiline
                      rows={3} // Muestra 3 líneas de altura                                              
                      InputLabelProps={{ style: { color: 'white' } }}
                      //inputProps={{ style:{textAlign: 'right', color:'white'} }}
                      InputProps={{
                        style: { color: 'white', width: 270 },
                        // Aquí se ajusta el padding del texto sin afectar el icono
                        inputProps: {
                          style: {
                              paddingLeft: '32px', // Mueve solo el texto a la derecha
                              fontSize: '12px', // Ajusta el tamaño de letra aquí
                              textAlign: 'left'
                          },
                        },
                      }}
                    />

                    <Button variant='contained' 
                                color='success' 
                                onClick={()=>{
                                  handleProcesaAsientos();
                                  }
                                }
                                sx={{display:'block',margin:'.5rem 0', width: 270}}
                                >
                                PROCESAR
                    </Button>
                    <Button variant='contained' 
                                //color='warning' 
                                //size='small'
                                onClick={()=>{
                                      setShowModalAsTipoVenta(false);
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
                {/* FIN Seccion para mostrar Dialog tipo Modal */}
        </>
    )
    :
    (   
      <>
      </>
    )
  }

  { (showModalAsTipoCompra) ?
    (   <>
                {/* Seccion para mostrar Dialog tipo Modal, para busqueda incremental cuentas */}
                <Dialog
                  open={showModalAsTipoCompra}
                  onClose={() => setShowModalAsTipoCompra(false)}
                  maxWidth="md" // Valor predeterminado de 960px
                  //fullWidth
                  disableScrollLock // Evita que se modifique el overflow del body
                  PaperProps={{
                    style: {
                      top: isSmallScreen ? "-40vh" : "0vh", // Ajusta la distancia desde arriba
                      left: isSmallScreen ? "-25%" : "0%", // Centrado horizontal
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      //marginTop: '10vh', // Ajusta este valor según tus necesidades
                      background: 'rgba(30, 39, 46, 0.9)', // Plomo transparencia                                                                            
                      color:'white',
                      width: isSmallScreen ? ('40%') : ('30%'), // Ajusta este valor según tus necesidades
                      //width: isSmallScreen ? "90vw" : "500px",                                              
                      //maxWidth: 'none' // Esto es importante para permitir que el valor de width funcione
                    },
                  }}
                >
                <DialogTitle>Asiento Tipo</DialogTitle>
                    <Tooltip title={searchText}>
                    <TextField
                      variant="outlined"
                      placeholder="CUENTA 6XX"
                      //inputRef={inputProductoRef} // Asocia la referencia al campo de texto
                      //onFocus={handleFocus} //Si esta en celular, quita el foco y desaparece automaticament el teclado
                      autoFocus
                      size="small"
                      name="cuentaBaseModal"
                      value={(asientoTipo.cuentaBase + " " + asientoTipo.cuentaBaseDesc).trim() || ""}
                      InputLabelProps={{ style: { color: 'white' } }}
                      InputProps={{
                        style: { color: 'white', width: 270 },
                        startAdornment: (
                          <InputAdornment position="start">
                            
                            <IconButton
                              color="primary"
                              //color = 'rgba(33, 150, 243, 0.8)'
                              aria-label="upload picture"
                              component="label"
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: '50%',
                                left: 0,
                                transform: 'translateY(-50%)',
                              }}
                              onClick={() => {
                                cargaCuentaContable('6');
                                setShowModalCuentaBase(true);
                              }}
                            >
                              <FindIcon />
                            </IconButton>
                            
                            { //En caso celular, mostrar icono teclado, (desactivado teclado al momento del foco)
                            isSmallScreen ? (
                            <IconButton
                              color="default"
                              aria-label="Muestra teclado"
                              size="small"
                              //onClick={handleMostrarTecladoCelular} // Mostrar teclado virtual en celular
                              sx={{
                                padding: '0px',
                                //height:'30',
                                marginLeft:'20px',
                                marginRight: '-30px',
                                backgroundColor: 'primary', // Color de fondo del ícono
                                borderRadius: '4px', // Bordes redondeados
                                '&:hover': {
                                  backgroundColor: 'skyblue', // Color de fondo al hacer hover
                                },
                              }}                                                        
                            >
                              <KeyboardIcon />
                            </IconButton>
                            )
                            :
                            null
                          }

                          </InputAdornment>
                        ),

                        // Aquí se ajusta el padding del texto sin afectar el icono
                        inputProps: {
                          style: {
                            paddingLeft: '32px', // Mueve solo el texto a la derecha
                              fontSize: '12px', // Ajusta el tamaño de letra aquí
                          },
                        },
                      }}
                    />
                    </Tooltip>
                          <ListaPopUp
                              registroPopUp={cuenta_select}
                              showModal={showModalCuentaBase}
                              setShowModal={setShowModalCuentaBase}
                              registro={asientoTipo}                    
                              setRegistro={setAsientoTipo}                    
                              idCodigoKey="cuentaBase"
                              descripcionKey="cuentaBaseDesc"
                              auxiliarKey="auxiliar"
                          />

                    <TextField
                      variant="outlined"
                      placeholder="DESTINO CARGO"
                      //inputRef={inputProductoRef} // Asocia la referencia al campo de texto
                      //onFocus={handleFocus} //Si esta en celular, quita el foco y desaparece automaticament el teclado
                      autoFocus
                      size="small"
                      name="cuentaCargoDest"
                      value={(asientoTipo.cuentaCargoDest + " " + asientoTipo.cuentaCargoDestDesc).trim() || ""}                                              
                      InputLabelProps={{ style: { color: 'white' } }}
                      InputProps={{
                        style: { color: 'white', width: 270 },
                        startAdornment: (
                          <InputAdornment position="start">
                            
                            <IconButton
                              color="primary"
                              //color = 'rgba(33, 150, 243, 0.8)'
                              aria-label="upload picture"
                              component="label"
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: '50%',
                                left: 0,
                                transform: 'translateY(-50%)',
                              }}
                              onClick={() => {
                                cargaAmarreContable(asientoTipo.cuentaBase);
                                setShowModalCuentaDestino(true);
                              }}
                            >
                              <FindIcon />
                            </IconButton>
                            
                            { //En caso celular, mostrar icono teclado, (desactivado teclado al momento del foco)
                            isSmallScreen ? (
                            <IconButton
                              color="default"
                              aria-label="Muestra teclado"
                              size="small"
                              //onClick={handleMostrarTecladoCelular} // Mostrar teclado virtual en celular
                              sx={{
                                padding: '0px',
                                //height:'30',
                                marginLeft:'20px',
                                marginRight: '-30px',
                                backgroundColor: 'primary', // Color de fondo del ícono
                                borderRadius: '4px', // Bordes redondeados
                                '&:hover': {
                                  backgroundColor: 'skyblue', // Color de fondo al hacer hover
                                },
                              }}                                                        
                            >
                              <KeyboardIcon />
                            </IconButton>
                            )
                            :
                            null
                          }

                          </InputAdornment>
                        ),

                        // Aquí se ajusta el padding del texto sin afectar el icono
                        inputProps: {
                          style: {
                            paddingLeft: '32px', // Mueve solo el texto a la derecha
                              fontSize: '12px', // Ajusta el tamaño de letra aquí
                          },
                        },
                      }}
                    />
                          <ListaPopUp
                              registroPopUp={cuenta_select}
                              showModal={showModalCuentaDestino}
                              setShowModal={setShowModalCuentaDestino}
                              registro={asientoTipo}                    
                              setRegistro={setAsientoTipo}                    
                              idCodigoKey="cuentaCargoDest"
                              descripcionKey="cuentaCargoDestDesc"
                              auxiliarKey="cuentaAbonoDest"
                          />

                    <TextField
                      variant="outlined"
                      placeholder="DESTINO ABONO"
                      //inputRef={inputProductoRef} // Asocia la referencia al campo de texto
                      //onFocus={handleFocus} //Si esta en celular, quita el foco y desaparece automaticament el teclado
                      autoFocus
                      size="small"
                      name="cuentaAbonoDest"
                      //value={asientoTipo.cuentaAbonoDest}
                      value={(asientoTipo.cuentaAbonoDest + " " + asientoTipo.cuentaAbonoDestDesc).trim().substring(0,16) || ""}
                      InputLabelProps={{ style: { color: 'white' } }}
                      //inputProps={{ style:{textAlign: 'right', color:'white'} }}
                      InputProps={{
                        style: { color: 'white', width: 270 },
                        startAdornment: (
                          <InputAdornment position="start">
                            
                            <IconButton
                              color="primary"
                              //color = 'rgba(33, 150, 243, 0.8)'
                              aria-label="upload picture"
                              component="label"
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: '50%',
                                left: 0,
                                transform: 'translateY(-50%)',
                              }}
                              onClick={() => {
                                cargaCuentaContable('');
                                setShowModalCuentaDestino02(true);
                              }}
                            >
                              <FindIcon />
                            </IconButton>
                            
                            { //En caso celular, mostrar icono teclado, (desactivado teclado al momento del foco)
                            isSmallScreen ? (
                            <IconButton
                              color="default"
                              aria-label="Muestra teclado"
                              size="small"
                              //onClick={handleMostrarTecladoCelular} // Mostrar teclado virtual en celular
                              sx={{
                                padding: '0px',
                                //height:'30',
                                marginLeft:'20px',
                                marginRight: '-30px',
                                backgroundColor: 'primary', // Color de fondo del ícono
                                borderRadius: '4px', // Bordes redondeados
                                '&:hover': {
                                  backgroundColor: 'skyblue', // Color de fondo al hacer hover
                                },
                              }}                                                        
                            >
                              <KeyboardIcon />
                            </IconButton>
                            )
                            :
                            null
                          }

                          </InputAdornment>
                        ),

                        // Aquí se ajusta el padding del texto sin afectar el icono
                        inputProps: {
                          style: {
                              paddingLeft: '32px', // Mueve solo el texto a la derecha
                              fontSize: '12px', // Ajusta el tamaño de letra aquí
                              textAlign: 'right'
                          },
                        },
                      }}
                    />
                          <ListaPopUp
                              registroPopUp={cuenta_select}
                              showModal={showModalCuentaDestino02}
                              setShowModal={setShowModalCuentaDestino02}
                              registro={asientoTipo}                    
                              setRegistro={setAsientoTipo}                    
                              idCodigoKey="cuentaAbonoDest"
                              descripcionKey="cuentaAbonoDestDesc"
                              auxiliarKey=""
                          />

                    <TextField
                      variant="outlined"
                      placeholder="GLOSA"
                      autoFocus
                      size="small"
                      name="glosa"
                      multiline
                      rows={3} // Muestra 3 líneas de altura                                              
                      value={glosa}
                      onChange={handleChange}
                      InputLabelProps={{ style: { color: 'white' } }}
                      //inputProps={{ style:{textAlign: 'right', color:'white'} }}
                      InputProps={{
                        style: { color: 'white', width: 270 },
                        // Aquí se ajusta el padding del texto sin afectar el icono
                        inputProps: {
                          style: {
                              paddingLeft: '32px', // Mueve solo el texto a la derecha
                              fontSize: '12px', // Ajusta el tamaño de letra aquí
                              textAlign: 'left'
                          },
                        },
                      }}
                    />

                    <Button variant='contained' 
                                color='success' 
                                onClick={()=>{
                                  handleProcesaAsientos();
                                  }
                                }
                                sx={{display:'block',margin:'.5rem 0', width: 270}}
                                >
                                PROCESAR
                    </Button>
                    <Button variant='contained' 
                                //color='warning' 
                                //size='small'
                                onClick={()=>{
                                      setShowModalAsTipoCompra(false);
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
                {/* FIN Seccion para mostrar Dialog tipo Modal */}
        </>
    )
    :
    (   
      <>
      </>
    )
  }

  <Datatable
      //title="GENERADOR - Asientos"
      //title={<div style={{ visibility: 'hidden', height: 0, overflow: 'hidden' }}> </div>}
      title={<div>
              <Grid container
                    direction={isSmallScreen ? 'row' : 'row'}
                    alignItems={isSmallScreen ? 'center' : 'center'}
                    justifyContent={isSmallScreen ? 'center' : 'center'}
              >

                  <Grid item xs={0.5} >
                    <BotonExcelVentas registrosdet={registrosdet} 
                      />          
                  </Grid>
                  <Grid item xs={11.5} >
                      <TextField fullWidth variant="outlined" color="success" size="small"
                                                  sx={{display:'block',
                                                        margin:'.0rem 0'}}
                                                  name="busqueda"
                                                  placeholder='ASIENTOS TIPO:  Ruc - Razon Social - Serie'
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
