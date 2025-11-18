import React from 'react';
import { useEffect, useState, useMemo, useCallback } from "react"
import { Card,CardContent,Box,Modal,Grid, Button,useMediaQuery,Select, MenuItem,Dialog,DialogContent,DialogTitle,Typography} from "@mui/material";
import { useNavigate,useParams } from "react-router-dom";
import FindIcon from '@mui/icons-material/FindInPage';
import IconButton from '@mui/material/IconButton';
import ReplyIcon from '@mui/icons-material/Reply';

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

import BotonExcelGeneral from '../BotonExcelGeneral';

//import { AdminVentasDetColumnas } from './AdminColumnas';
import { AdminKardexColumnas } from './AdminColumnas';


export default function AdminStockRepKardex() {
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

  const [selectedRows, setSelectedRows] = useState([]);
  const [toggleCleared, setToggleCleared] = useState(false);
    //const [data, setData] = useState(tableDataItems);
  const [registrosdet,setRegistrosdet] = useState([]);
  const [tabladet,setTabladet] = useState([]);  //Copia de los registros: Para tratamiento de filtrado
  const [valorBusqueda, setValorBusqueda] = useState(""); //txt: rico filtrado
    
  const [columnas, setColumnas] = useState([]);

  // Agrega íconos al inicio de cada columna
  
  const handleRowSelected = useCallback(state => {
        setSelectedRows(state.selectedRows);
    }, []);

 ///////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////
  const cargaRegistro = async (sPeriodo, sIdAnfitrion, sDocumentoId,sDia, sIdProducto, sIdAlmacen) => {
    let response;
    //Cargamos asientos correspondientes al id_usuario,contabilidad y periodo
    console.log('kardex obtenido: ',`${back_host}/ad_stockkardex/${sPeriodo}/${sIdAnfitrion}/${sDocumentoId}/${sDia}/${sIdProducto}/${sIdAlmacen}`);
    response = await fetch(`${back_host}/ad_stockkardex/${sPeriodo}/${sIdAnfitrion}/${sDocumentoId}/${sDia}/${sIdProducto}/${sIdAlmacen}`);
    
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
    //Carga de Registros con permisos
    //Secundario despues de seleccion en toggleButton
    let columnasEspecificas;
    columnasEspecificas = AdminKardexColumnas;

    // Finalmente seteamos
    setColumnas(columnasEspecificas);    

    //cuando carga x primera vez, sale vacio ... arreglar esto
    cargaRegistro(params.periodo, params.id_anfitrion, params.documento_id, params.dia, params.id_producto, params.id_almacen); //new cambio

    //Datos listos en caso de volver por aqui, para envio
    
    //fetchTotalVentas();
  },[]) //Solo cuando este completo estado


  //////////////////////////////////////////////////////////
 
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

  <div>
  </div>

  <Grid container spacing={0}
      direction={isSmallScreen ? 'column' : 'row'}
      //alignItems={isSmallScreen ? 'center' : 'center'}
      justifyContent={isSmallScreen ? 'center' : 'center'}
  >
      <Grid item xs={1.5} sm={1.5}>
      </Grid>
      <Grid item xs={4} sm={4}>
      </Grid>

      <Grid item xs={2} sm={2}>
      </Grid>

  </Grid>

  <div>
  </div>
    
  <Grid container spacing={0}
      direction={isSmallScreen ? 'row' : 'row'}
      alignItems={isSmallScreen ? 'center' : 'left'}
      justifyContent={isSmallScreen ? 'left' : 'left'}
  >

        <Grid item xs={isSmallScreen ? 1.2 : 0.5} >
          <Tooltip title='EXPORTAR XLS' >
              <BotonExcelGeneral datos={registrosdet} 
                                  nombreArchivo="Kardex Fisico"
                                  tituloReporte={`Kardex Fisico:  ${params.periodo}  ${params.documento_id}`}
                                  columnasNumericas={['ingreso','egreso','precio_neto','porc_igv']}
                                  columnasExcluidas={['cod','serie','numero']}
              />
          </Tooltip>
        </Grid>

        <Grid item xs={isSmallScreen ? 1.2 : 0.5}  >    
            <IconButton color="warning" 
              onClick = {()=> {
                          //Icono retroceder pagina
                          navigate(-1, { replace: true });
                        }
                      }
            >
              <ReplyIcon />
            </IconButton>
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
                                    placeholder='FILTRAR:  RUC   RAZON SOCIAL   COMPROBANTE  DESCRIPCION'
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
      onSelectedRowsChange={handleRowSelected}
      clearSelectedRows={toggleCleared}
      //pagination
      //paginationPerPage={15}
      //paginationRowsPerPageOptions={[15, 50, 100]}

      selectableRowsComponent={Checkbox} // Pass the function only
      sortIcon={<ArrowDownward />}  
      dense={true}
      highlightOnHover //resalta la fila
  >
  </Datatable>
</div>
  </>
  );
}
