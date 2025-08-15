import React from 'react';
import { useEffect, useState, useMemo, useCallback } from "react"
import { Modal,Grid, Button,useMediaQuery,Select, MenuItem} from "@mui/material";
import { useNavigate,useParams } from "react-router-dom";
import DeleteIcon from '@mui/icons-material/Delete';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import FindIcon from '@mui/icons-material/FindInPage';
import UpdateIcon from '@mui/icons-material/UpdateSharp';
import Add from '@mui/icons-material/Add';
import FindInPageIcon from '@mui/icons-material/FindInPage';
import AddBoxIcon from '@mui/icons-material/AddBox';
import BoltIcon from '@mui/icons-material/Bolt';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import DownloadIcon from '@mui/icons-material/Download';
import { blueGrey } from '@mui/material/colors';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import FolderDeleteIcon from '@mui/icons-material/FolderDelete';          
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';


import IconButton from '@mui/material/IconButton';
import swal from 'sweetalert';
import swal2 from 'sweetalert2'
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
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import axios from 'axios';

import { useAuth0 } from '@auth0/auth0-react'; //new para cargar permisos luego de verificar registro en bd
import BotonExcelVentas from '../BotonExcelVentas';
import AdminFileProducto from './AdminFileProducto';
import { saveAs } from 'file-saver';

export default function AdminProductoList() {
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

  const [registrosdet,setRegistrosdet] = useState([]);
  const [tabladet,setTabladet] = useState([]);  //Copia de los registros: Para tratamiento de filtrado
  const [valorBusqueda, setValorBusqueda] = useState(""); //txt: rico filtrado
  const [permisosComando, setPermisosComando] = useState([]); //MenuComandos
  const {user, isAuthenticated } = useAuth0();
  const [valorVista, setValorVista] = useState("productos");

  // Agrega íconos al inicio de cada columna
  const columnas = [
    {
      name: '',
      width: '40px',
      cell: (row) => (
        pVenta0101 ? (
          <DriveFileRenameOutlineIcon
            onClick={() => handleUpdate(row.id_producto, row.descripcion)} //descripcion contiene campo unidades
            style={{
              cursor: 'pointer',
              color: 'skyblue',
              transition: 'color 0.3s ease',
            }}
          />
        ) : null
      ),
      allowOverflow: true,
      button: true,
    },
    {
      name: '',
      width: '40px',
      cell: (row) => (
          <DeleteIcon
            onClick={() => handleDelete(row.id_producto)}
            style={{
              cursor: 'pointer',
              color: 'orange',
              transition: 'color 0.3s ease',
            }}
          />
      ),
      allowOverflow: true,
      button: true,
    },
    { name:'ID', 
      selector:row => row.id_producto,
      sortable: true,
      width: '110px'
      //key:true
    },
    { name:'NOMBRE', 
      selector:row => row.nombre,
      width: '250px',
      sortable: true
    },
    { name:'DESCRIPCION', 
      selector:row => row.descripcion,
      width: '100px',
      sortable: true
    },
    { name:'PRECIO', 
      selector:row => row.precio_venta,
      width: '100px',
      sortable: true
    },
    { name:'% IGV', 
      selector:row => row.porc_igv,
      width: '100px',
      sortable: true
    },
    { name:'UNIDAD', 
      selector:row => row.cont_und,
      width: '100px',
      sortable: true
    },
    { name:'ORIGEN', 
      selector:row => row.origen,
      width: '100px',
      sortable: true
    },

  ];

  //Permisos Nivel 02 - Comandos (Buttons)
  const [pVenta0101, setPVenta0101] = useState(false); //Nuevo (Casi libre)
  const [pVenta0102, setPVenta0102] = useState(false); //Modificar (Restringido)
  const [pVenta0103, setPVenta0103] = useState(false); //ELiminar (Restringido)
  const [pVenta0104, setPVenta0104] = useState(false); //Eliminar Masivo (Casi Nunca solo el administrador)

  // valores adicionales para Carga Archivo
  const [datosCarga, setDatosCarga] = useState({
    id_anfitrion: '',
    documento_id: ''
  });  

  const handleRowSelected = useCallback(state => {
		setSelectedRows(state.selectedRows);
	}, []);

  const handleUpdate = (id_producto,unidades) => {
    //Mostrar formulario para edicion
    if (valorVista === 'productos') {
        navigate(`/ad_producto/${params.id_anfitrion}/${params.id_invitado}/${params.documento_id}/${id_producto}/edit`);
    }else{
        navigate(`/ad_productoprecio/${params.id_anfitrion}/${params.id_invitado}/${params.documento_id}/${id_producto}/${unidades}/edit`);
    }
  };
  const handleDelete = (id_producto) => {
    //console.log(num_asiento);
    confirmaEliminacion(params.id_anfitrion,params.documento_id,id_producto);
  };
  const confirmaEliminacion = async(sAnfitrion,sDocumentoId,sIdProducto)=>{
    await swal({
      title:"Eliminar Registro",
      text:"Seguro ?",
      icon:"warning",
      buttons:["No","Si"]
    }).then(respuesta=>{
        if (respuesta){
          //console.log(cod,serie,num,elem,item);
          eliminarRegistroSeleccionado(sAnfitrion,sDocumentoId,sIdProducto);
          setToggleCleared(!toggleCleared);
          setRegistrosdet(registrosdet.filter(
                          registrosdet => registrosdet.id_producto !== sIdProducto
                          ));
          setTimeout(() => { // Agrega una función para que se ejecute después del tiempo de espera
              setUpdateTrigger(Math.random());//experimento
          }, 200);
                        
          swal({
            text:"Producto se ha eliminado con exito",
            icon:"success",
            timer:"2000"
          });
      }
    })
  };
  const eliminarRegistroSeleccionado = async (sAnfitrion,sDocumentoId,sIdProducto) => {
    //En ventas solo se eliminan, detalle-cabecera
    await fetch(`${back_host}/ad_producto/${sAnfitrion}/${sDocumentoId}/${sIdProducto}`, {
        method:"DELETE"
    });
  };

  ///////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////
  const cargaRegistro = async () => {
    var response;
    //Cargamos productos
    response = await fetch(`${back_host}/ad_producto/${params.id_anfitrion}/${params.documento_id}`);
    
    const data = await response.json();
    setRegistrosdet(data);
    setTabladet(data); //Copia para tratamiento de filtrado
    //console.log("data", data);
  }
  const cargaRegistroPrecios = async () => {
    var response;
    //Cargamos productos
    response = await fetch(`${back_host}/ad_productoprecio/${params.id_anfitrion}/${params.documento_id}`);
    
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
      const razonSocial = elemento.nombre?.toString().toLowerCase() || '';
  
      if (razonSocial.includes(strBusca.toLowerCase()) ) {
        return elemento;
      }
      return null; // Agrega esta línea para manejar el caso en que no haya coincidencia
    });
  
    resultadosBusqueda = resultadosBusqueda.filter(Boolean); // Filtra los elementos nulos
  
    setRegistrosdet(resultadosBusqueda);
  };
  
  const cargaPermisosMenuComando = async(idMenu)=>{
    if (params.id_anfitrion === params.id_invitado){
      setPVenta0101(true); //nuevo
      setPVenta0102(true); //modificar
      setPVenta0103(true); //eliminar
      setPVenta0104(true); //eliminar masivo
    }
    else{
        //Realiza la consulta a la API de permisos
        fetch(`${back_host}/seguridad/${params.id_anfitrion}/${params.id_invitado}/${idMenu}`, {
          method: 'GET'
        })
        .then(response => response.json())
        .then(permisosData => {
          // Guarda los permisos en el estado
          setPermisosComando(permisosData);
          console.log(permisosComando);
          let tienePermiso;
          // Verifica si existe el permiso de acceso 'ventas'
          tienePermiso = permisosData.some(permiso => permiso.id_comando === '01-01'); //Nuevo
          if (tienePermiso) {
            setPVenta0101(true);
          }

          tienePermiso = permisosData.some(permiso => permiso.id_comando === '01-02'); //Modificar
          if (tienePermiso) {
            setPVenta0102(true);
          }else {setPVenta0102(false);}

          tienePermiso = permisosData.some(permiso => permiso.id_comando === '01-03'); //Eliminar
          if (tienePermiso) {
            setPVenta0103(true);
          }else {setPVenta0103(false);}
          ////////////////////////////////////////////////

          //setUpdateTrigger(Math.random());//experimento
        })
        .catch(error => {
          console.log('Error al obtener los permisos:', error);
        });
    }
  }

  // Función que se pasa como prop al componente.js
  const handleActualizaImportaOK = () => {
    //console.log('valorVista,periodo_trabajo,contabilidad_trabajo:', valorVista,periodo_trabajo,contabilidad_trabajo);
    //cargaRegistro(valorVista,periodo_trabajo,contabilidad_trabajo);
    setUpdateTrigger(Math.random());//experimento para actualizar el dom
    // Puedes realizar otras operaciones con la cantidad de filas si es necesario
  };
  
  //////////////////////////////////////////////////////////
  useEffect( ()=> {
        //cargar registro
      valorVista === 'productos' ? cargaRegistro() : cargaRegistroPrecios();

      //setValorVista('productos'); //Por default, la 1era vez
      /////////////////////////////
      //NEW codigo para autenticacion y permisos de BD
      if (isAuthenticated && user && user.email) {
        cargaPermisosMenuComando('01');
      }
      setDatosCarga(prevState => ({ ...prevState, id_anfitrion: params.id_anfitrion }));
      setDatosCarga(prevState => ({ ...prevState, documento_id: params.documento_id }));
  
  },[isAuthenticated, user, updateTrigger]) //Aumentamos IsAuthenticated y user

  const handleDescargarExcelVacio = async () => {
    // Question view id_libro
    let filePath;
    let fileName;

    filePath = '/productos_prueba.xlsx';
    // Nombre del archivo para la descarga
    fileName = 'productos_prueba.xlsx';

    // URL completa del archivo
    const fileUrl = process.env.PUBLIC_URL + filePath;

    try {
      // Realizar la solicitud para obtener el archivo usando axios
      const response = await axios.get(fileUrl, { responseType: 'blob' });

      // Utilizar file-saver para descargar el archivo
      saveAs(response.data, fileName);
    } catch (error) {
      console.error('Error al descargar el archivo:', error);
    }
  };

  const handleDeleteOrigen = async (sAnfitrion,sDocumentoId) => {
    const { value: selectedOrigen } = await swal2.fire({
      title: 'Eliminar registros',
      //text: 'Selecciona el origen para la eliminación masiva:',
      input: 'select',
      icon: 'warning',
      //color: 'orange',
      inputOptions: {
        EXCEL: 'EXCEL',
        MANUAL: 'MANUAL',
        // Agrega las opciones según los valores de "origen" de tu tabla
      },
      inputPlaceholder: 'Selecciona el origen',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        return new Promise((resolve) => {
          if (value === '') {
            resolve('Debes seleccionar un origen');
          } else {
            resolve();
          }
        });
      },
    });

    // Si el usuario hace clic en "Eliminar" y selecciona un origen
    if (selectedOrigen) {
      // Aquí puedes realizar la lógica para eliminar registros masivamente con el origen seleccionado
      //console.log('Eliminar registros con origen:', selectedOrigen);
      await fetch(`${back_host}/ad_productomasivo/${sAnfitrion}/${sDocumentoId}/${selectedOrigen}`, {
        method:"DELETE"
      });

      setTimeout(() => { // Agrega una función para que se ejecute después del tiempo de espera
        setUpdateTrigger(Math.random());//experimento
      }, 200);
    }
  };
  
  const actualizaValorVista = (e) => {
    setValorVista(e.target.value);
    //grabar datos sesionStorage valorVista
    sessionStorage.setItem('valorVistaProducto', e.target.value);

    //Lo dejaremos terminar el evento de cambio o change
    setUpdateTrigger(Math.random());//experimento para actualizar el dom
  }

 return (
  <>

  <div>
  </div>
  <div>
  <ToggleButtonGroup
    color="success"
    //value={valorVista}
    exclusive
    onChange={actualizaValorVista}
    aria-label="Platform"
  >

      <ToggleButton value="productos"
                    style={{
                      backgroundColor: valorVista === 'productos' ? 'lightblue' : 'transparent',
                      color: valorVista === 'productos' ? "orange" : "gray"
                    }}

      >Productos</ToggleButton>


    <ToggleButton value="precios"
                  style={{
                    backgroundColor: valorVista === 'precios' ? 'lightblue' : 'transparent',
                    color: valorVista === 'precios' ? 'orange' : 'gray',
                  }}
    >Precios</ToggleButton>


  </ToggleButtonGroup>      
  </div>
    
  <Grid container spacing={0}
      direction={isSmallScreen ? 'row' : 'row'}
      alignItems={isSmallScreen ? 'center' : 'left'}
      justifyContent={isSmallScreen ? 'left' : 'left'}
  >
      <Grid item xs={isSmallScreen ? 1.2 : 0.5} >
        <Tooltip title='AGREGAR NUEVO' >
          <IconButton color="primary" 
                          //style={{ padding: '0px'}}
                          style={{ padding: '0px', color: blueGrey[700] }}
                          onClick={() => {
                            if (navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/BlackBerry/i) || navigator.userAgent.match(/Windows Phone/i)) {
                              //movil
                                navigate(`/ad_producto/${params.id_anfitrion}/${params.id_invitado}/${params.documento_id}/new`);
                            } else {
                                navigate(`/ad_producto/${params.id_anfitrion}/${params.id_invitado}/${params.documento_id}/new`);
                            }
                          }}
          >
                <AddBoxIcon style={{ fontSize: '40px' }}/>
          </IconButton>
        </Tooltip>
      </Grid>

      <Grid item xs={isSmallScreen ? 1.2 : 0.5}  >    
        <Tooltip title='EXPORTAR XLS' >
            <BotonExcelVentas registrosdet={registrosdet} 
            />
        </Tooltip>
      </Grid>
      
      <Grid item xs={isSmallScreen ? 1.2 : 0.5}  >    
        <Tooltip title='DESCARGA XLS VACIO' >
            <IconButton color="primary" 
                            //style={{ padding: '0px'}}
                            style={{ padding: '0px', color: blueGrey[700] }}
                            onClick={() => {
                                  handleDescargarExcelVacio();
                            }}
            >
                  <KeyboardDoubleArrowDownIcon style={{ fontSize: '40px' }}/>
            </IconButton>
        </Tooltip>
      </Grid>
      
      <Grid item xs={isSmallScreen ? 1.2 : 0.5}  >    
        <Tooltip title='ELIMINAR MASIVO' >
            <IconButton color="warning" 
                            //style={{ padding: '0px'}}
                            style={{ padding: '0px', color: blueGrey[700] }}
                            onClick={() => {
                              handleDeleteOrigen(params.id_anfitrion,params.documento_id)
                            }}
            >
                  <FolderDeleteIcon style={{ fontSize: '40px' }}/>
            </IconButton>
        </Tooltip>
      </Grid>

      <Grid item xs={isSmallScreen ? 12 : 10}>
        <AdminFileProducto datosCarga={datosCarga} 
                           onActualizaImportaOK={handleActualizaImportaOK} 
                           //urlApiDestino='/ad_productoexcel'
                           urlApiDestino={valorVista === 'productos' ? '/ad_productoexcel' : '/ad_productoprecioexcel'}
                           >
        </AdminFileProducto>
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

  </>
  );
}
