import React from 'react';
import { useEffect, useState, useMemo, useCallback } from "react"
import { Grid, Button,useMediaQuery } from "@mui/material";
import { useNavigate,useParams } from "react-router-dom";
import DeleteIcon from '@mui/icons-material/Delete';
import FindIcon from '@mui/icons-material/FindInPage';
import UpdateIcon from '@mui/icons-material/UpdateSharp';
import Add from '@mui/icons-material/Add';

import IconButton from '@mui/material/IconButton';
import swal from 'sweetalert';
import Datatable, {createTheme} from 'react-data-table-component';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import '../App.css';
import 'styled-components';

import { utils, writeFile } from 'xlsx';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';

import { useAuth0 } from '@auth0/auth0-react'; //new para cargar permisos luego de verificar registro en bd
import BotonExcelVentas from './BotonExcelVentas';

export default function VentaList() {
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
  function exportToExcel(data) {
    const worksheet = utils.json_to_sheet(data);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Datos');
    writeFile(workbook, 'datos.xlsx');
  }

  //const back_host = process.env.BACK_HOST || "http://localhost:4000";
  const back_host = process.env.BACK_HOST || "https://alsa-backend-js-production.up.railway.app";  
  //experimento
  const [updateTrigger, setUpdateTrigger] = useState({});

  const [selectedRows, setSelectedRows] = useState([]);
  const [toggleCleared, setToggleCleared] = useState(false);
	//const [data, setData] = useState(tableDataItems);
  const [registrosdet,setRegistrosdet] = useState([]);
  const [tabladet,setTabladet] = useState([]);  //Copia de los registros: Para tratamiento de filtrado
  const [navegadorMovil, setNavegadorMovil] = useState(false);
  const [valorBusqueda, setValorBusqueda] = useState(""); //txt: rico filtrado
  const [valorVista, setValorVista] = useState("resumen");
  const [permisosComando, setPermisosComando] = useState([]); //MenuComandos
  const {user, isAuthenticated } = useAuth0();
  
  //Permisos Venta Nivel 01 - Lista Ventas
  const [pVenta0101, setPVenta0101] = useState(false); //Nuevo (Casi libre)
  const [pVenta0102, setPVenta0102] = useState(false); //Modificar (Restringido)
  const [pVenta0103, setPVenta0103] = useState(false); //Anular (Restringido)
  const [pVenta0104, setPVenta0104] = useState(false); //Eliminar (Casi Nunca solo el administrador)

  const handleRowSelected = useCallback(state => {
		setSelectedRows(state.selectedRows);
	}, []);

  const handleRecarga = () => {
    setUpdateTrigger(Math.random());//experimento
  };

  const contextActions = useMemo(() => {

		const handleDelete = () => {
			var strCod;
      var strSerie;
      var strNum;
      var strElem;
      var strItem;
      strCod = selectedRows.map(r => r.comprobante_original_codigo);
      strSerie = selectedRows.map(r => r.comprobante_original_serie);
      strNum = selectedRows.map(r => r.comprobante_original_numero);
      strElem = selectedRows.map(r => r.elemento);
      strItem = selectedRows.map(r => r.item);
      //console.log(strElem);
      console.log(valorVista);
      if (valorVista=="resumen"){
			  confirmaEliminacion(strCod,strSerie,strNum,strElem,strItem);
      }else{
          swal({
            text:"NO SE PUEDE ELIMINAR DETALLE DE VENTA, PROCEDA DESDE VISTA RESUMEN",
            icon:"warning",
            timer:"2000"
          });
      }
		};

    const verificaNavegadorMovil = () =>{
      if (navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/BlackBerry/i) || navigator.userAgent.match(/Windows Phone/i)) {
          console.log("Estás usando un dispositivo móvil!!");
          setNavegadorMovil(true);
      } else {
          console.log("No estás usando un móvil");
          setNavegadorMovil(false);
      }    
    };
  
    const handleUpdate = () => {
			var strCod;
      var strSerie;
      var strNum;
      var strElem;
      strCod = selectedRows.map(r => r.comprobante_original_codigo);
      strSerie = selectedRows.map(r => r.comprobante_original_serie);
      strNum = selectedRows.map(r => r.comprobante_original_numero);
      strElem = selectedRows.map(r => r.elemento);
      
      if (navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/BlackBerry/i) || navigator.userAgent.match(/Windows Phone/i)) {
        console.log("Estás usando un dispositivo móvil!!");
        navigate(`/ventamovil/${strCod}/${strSerie}/${strNum}/${strElem}/edit`);
      } else {
        console.log("No estás usando un móvil");
        //navigate(`/venta/${strCod}/${strSerie}/${strNum}/${strElem}/edit`);
        navigate(`/ventamovil/${strCod}/${strSerie}/${strNum}/${strElem}/edit`);
      }    
  	};

		return (
      <>
      { pVenta0104 ? 
        (      
			<Button key="delete" onClick={handleDelete} >
        ELIMINAR
        <DeleteIcon></DeleteIcon>
			</Button>
        ):
        (
          <span></span>
        )
      }

      { pVenta0102 ? 
        (      
			<Button key="modificar" onClick={handleUpdate} >
        VISUALIZAR
      <UpdateIcon/>
			</Button>
        ):
        (
          <span></span>
        )
      }

      </>
		);
	}, [registrosdet, selectedRows, toggleCleared]);
  
  ///////////////////////////////////////////////////////////////////////
  let actions;
  if (pVenta0101) {
    actions = (
      <IconButton color="primary" onClick={() => {
        if (navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/BlackBerry/i) || navigator.userAgent.match(/Windows Phone/i)) {
          navigate(`/ventamovil/new`);
        } else {
          //navigate(`/venta/new`);
          navigate(`/ventamovil/new`);
        }
      }}>
        <Add />
      </IconButton>
    );
  } else {
    actions = null; // Opcionalmente, puedes asignar null u otro valor cuando la condición no se cumple
  }
  ///////////////////////////////////////////////////////////////////////


  const cargaRegistro = async () => {
    var response;
    let strFechaIni="";
    let strFecha="";
    //La data, corresponde al mes de login
    //le cargaremos fecha actual si parametro no existe
    strFechaIni=params.fecha_ini;

    strFecha=params.fecha_proceso;
    //console.log(strFecha);
    if (params.fecha_proceso===null){
      let nPos=0;
      const fecha = new Date(); //ok fecha y hora actual
      strFecha = fecha.toISOString(); //formato texto
      nPos = strFecha.indexOf('T');
      strFecha = strFecha.substr(0,nPos);
    }
    
    //response = await fetch(`${back_host}/ventaplan/${strFecha}`);
    //response = await fetch(`${back_host}/venta/${strFecha}`);

    if (valorVista=="analisis"){
      response = await fetch(`${back_host}/ventaplan/${strFechaIni}/${strFecha}`);
    }else{
      if (valorVista=="diario"){
        response = await fetch(`${back_host}/ventaplan/${strFecha}/${strFecha}`);
      }else{
        response = await fetch(`${back_host}/venta/${strFechaIni}/${strFecha}`);
      }
    }

    const data = await response.json();
    setRegistrosdet(data);
    setTabladet(data); //Copia para tratamiento de filtrado
  }
  //////////////////////////////////////
  const columnas = [
    { name:'FECHA', 
      selector:row => row.comprobante_original_fecemi,
      width: '100px',
      sortable: true
    },
    { name:'PEDIDO', 
      selector:row => row.pedido,
      width: '110px',
      sortable: true
    },
    { name:'VENDEDOR', 
      selector:row => row.vendedor,
      sortable: true,
      width: '80px',
      key:true
    },
    { name:'CLIENTE', 
      selector:row => row.razon_social,
      sortable: true
    },
    { name:'ENTREGA', 
      selector:row => row.zona_entrega,
      width: '100px',
      sortable: true
    },
    { name:'PRODUCTO', 
      selector:row => row.descripcion,
      cell: (row) => (
        <Tooltip title={row.descripcion ? row.descripcion : ''}>
          <span>
          {row.descripcion ? row.descripcion.substring(0, 50) + '...' : ''}
          </span>
        </Tooltip>
              ),      
      sortable: true
    },
    { name:'PROYECTADO', 
      selector:row => row.fecha_entrega,
      width: '100px',
      sortable: true
    },
    { name:'ESTADO', 
      selector:row => row.estado,
      width: '100px',
      sortable: true
    },
    { name:'RUC', 
      selector:row => row.ref_documento_id,
      width: '110px',
      sortable: true
    },
    { name:'RAZON SOCIAL', 
      selector:row => row.ref_razon_social,
      width: '100px',
      sortable: true
    },
    { name:'PRECIO', 
      selector:row => row.precio_unitario,
      width: '70px',
      sortable: true
    },
    { name:'MONEDA', 
      selector:row => row.moneda,
      width: '70px',
      sortable: true
    },
    { name:'%IGV', 
      selector:row => row.porc_igv,
      width: '80px',
      sortable: true
    },
    { name:'CANT.', 
      selector:row => row.cantidad,
      width: '100px',
      sortable: true
    },
    { name:'UND', 
      selector:row => row.unidad_medida,
      width: '80px',
      sortable: true
    },

    { name:'RUC TRANSP.', 
      selector:row => row.tr_ruc,
      width: '110px',
      sortable: true
    },
    { name:'TRANSP.', 
    selector:row => row.tr_razon_social,
      sortable: true
    },
    { name:'CHOFER', 
    selector:row => row.tr_chofer,
      sortable: true
    },
    { name:'CELULAR', 
    selector:row => row.tr_celular,
      sortable: true
    },
    { name:'PLACA', 
    selector:row => row.tr_placa,
      sortable: true
    },
    { name:'F.CARGA', 
    selector:row => row.tr_fecha_carga,
      sortable: true
    }

  ];
  
  const confirmaEliminacion = async(cod,serie,num,elem,item)=>{
    await swal({
      title:"Eliminar Registro",
      text:"Seguro ?",
      icon:"warning",
      buttons:["No","Si"]
    }).then(respuesta=>{
        if (respuesta){
          console.log(cod,serie,num,elem,item);
          eliminarRegistroSeleccionado(cod,serie,num,elem,item);
          setToggleCleared(!toggleCleared);
          setRegistrosdet(registrosdet.filter(
                          registrosdet => registrosdet.comprobante_original_codigo !== cod &&
                                          registrosdet.comprobante_original_serie !== serie &&
                                          registrosdet.comprobante_original_numero !== num  && 
                                          registrosdet.elemento !== elem
                          ));
          setTimeout(() => { // Agrega una función para que se ejecute después del tiempo de espera
              setUpdateTrigger(Math.random());//experimento
          }, 200);
                        
          //setUpdateTrigger(Math.random());//experimento
  
          swal({
            text:"Venta se ha eliminado con exito",
            icon:"success",
            timer:"2000"
          });
      }
    })
  }
 
  const navigate = useNavigate();
  //Para recibir parametros desde afuera
  const params = useParams();

  const eliminarRegistroSeleccionado = async (cod,serie,num,elem,item) => {
    //En ventas solo se eliminan, detalle-cabecera
    if (valorVista=="resumen"){
      //borrar maestro-detalle
      //console.log(`${back_host}/venta/${cod}/${serie}/${num}/${elem}`);
      await fetch(`${back_host}/venta/${cod}/${serie}/${num}/${elem}`, {
        method:"DELETE"
      });
    }
  }
  const actualizaValorFiltro = e => {
    setValorBusqueda(e.target.value);
    filtrar(e.target.value);
  }
  const actualizaValorVista = (e) => {
    setValorVista(e.target.value);
    //Lo dejaremos terminar el evento de cambio o change
    setUpdateTrigger(Math.random());//experimento para actualizar el dom
  }
  const filtrar=(strBusca)=>{
      var resultadosBusqueda = [];
      resultadosBusqueda = tabladet.filter((elemento) => {
        if (elemento.razon_social.toString().toLowerCase().includes(strBusca.toLowerCase())
         || elemento.vendedor.toString().toLowerCase().includes(strBusca.toLowerCase())
         || elemento.descripcion.toString().toLowerCase().includes(strBusca.toLowerCase())
         || elemento.pedido.toString().toLowerCase().includes(strBusca.toLowerCase())
          ){
              return elemento;
          }
      });
      setRegistrosdet(resultadosBusqueda);
  }

  const cargaPermisosMenuComando = async(idMenu)=>{
    //Realiza la consulta a la API de permisos
    fetch(`https://alsa-backend-js-production.up.railway.app/seguridad/${user.email}/${idMenu}`, {
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
      }
      tienePermiso = permisosData.some(permiso => permiso.id_comando === '01-03'); //Anular
      if (tienePermiso) {
        setPVenta0103(true);
      }
      tienePermiso = permisosData.some(permiso => permiso.id_comando === '01-04'); //Eliminar
      if (tienePermiso) {
        setPVenta0104(true);
      }
      //setUpdateTrigger(Math.random());//experimento
    })
    .catch(error => {
      console.log('Error al obtener los permisos:', error);
    });
  }

  //////////////////////////////////////////////////////////
  useEffect( ()=> {
      cargaRegistro();

      //NEW codigo para autenticacion y permisos de BD
      if (isAuthenticated && user && user.email) {
        // cargar permisos de sistema
        cargaPermisosMenuComando('01'); //Alimentamos el useState permisosComando
        //console.log(permisosComando);
      }
      
  },[updateTrigger, isAuthenticated, user]) //Aumentamos IsAuthenticated y user
  //////////////////////////////////////////////////////////

 return (
  <>
  <Grid container
        direction={isSmallScreen ? 'column' : 'row'}
        //alignItems={isSmallScreen ? 'center' : 'center'}
        justifyContent={isSmallScreen ? 'center' : 'center'}
  >
    <Grid item xs={10} >
      <TextField fullWidth variant="outlined" color="success" size="small"
                                   label="FILTRAR"
                                   sx={{display:'block',
                                        margin:'.0rem 0'}}
                                   name="busqueda"
                                   placeholder='Cliente   Vendedor   Producto   Pedido'
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
    </Grid>
    <Grid item xs={0.9} >
      <BotonExcelVentas registrosdet={registrosdet} 
      />          
      
    </Grid>
    <Grid item xs={1.1} >    
      <Button variant='contained' 
              fullWidth
              color='warning'
              sx={{display:'block',margin:'.0rem 0'}}
              >
      PDF-R
      </Button>
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
      <ToggleButton value="resumen">Resumen</ToggleButton>
      <ToggleButton value="analisis">Analisis</ToggleButton>
      <ToggleButton value="diario">Diario</ToggleButton>
    </ToggleButtonGroup>      
    </div>

    <Datatable
      title="Registro - Pedidos"
      theme="solarized"
      columns={columnas}
      data={registrosdet}
      selectableRows
      contextActions={contextActions}

      actions={actions}

			onSelectedRowsChange={handleRowSelected}
			clearSelectedRows={toggleCleared}
      pagination
      paginationPerPage={30}
      paginationRowsPerPageOptions={[30, 50, 100]}

      selectableRowsComponent={Checkbox} // Pass the function only
      sortIcon={<ArrowDownward />}  
      dense={true}

    >
    </Datatable>

  </>
  );
}
