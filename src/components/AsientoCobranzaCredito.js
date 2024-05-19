import {Grid,Card,TextField,Select, InputLabel, FormControl, MenuItem} from '@mui/material'
import React, { useState,useEffect} from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import axios from 'axios';
import Tooltip from '@mui/material/Tooltip';
import { CuentasCorrientesColumnas } from './ColumnasAsiento';

const AsientoCobranzaCredito = ({ formData, onFormDataChange }) => {
    const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //Seccion Modal
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

    const [abierto,setAbierto] = useState(false);
    const modalStyles={
        position:'absolute',
        top:'0%',
        left:'0%',
        background:'gray',
        border:'2px solid #000',
        padding:'16px 32px 24px',
        width:'100',
        minHeight: '50px'
        //transform:'translate(0%,0%)'
    }
    const tablaStyles = {
        rows: {
            style: {
                minHeight: '20px', // override the row height
            },
        },
        headCells: {
            style: {
                paddingLeft: '8px', // override the cell padding for head cells
                paddingRight: '8px',
            },
        },
        cells: {
            style: {
                paddingLeft: '8px', // override the cell padding for data cells
                paddingRight: '8px',
            },
        },
    };  
    const abrirCerrarModal = ()=>{
        setAbierto(!abierto);
    }
    const actualizaValorFiltro = e => {
        //setValorBusqueda(e.target.value);
        filtrar(e.target.value);
    }
    const filtrar=(strBusca)=>{
        var resultadosBusqueda = [];
        
        resultadosBusqueda = tabladet.filter((elemento) => {
            if (elemento.ref_razon_social.toString().toLowerCase().includes(strBusca.toLowerCase())
            || elemento.pedido.toString().toLowerCase().includes(strBusca.toLowerCase())
            || elemento.nombre.toString().toLowerCase().includes(strBusca.toLowerCase())
            ){
                return elemento;
            }
        });
        setRegistrosdet(resultadosBusqueda);
    }
    const [selectedRows, setSelectedRows] = useState([]);
    const [toggleCleared, setToggleCleared] = useState(false);
    const [registrosdet,setRegistrosdet] = useState([]); //Para vista principal
    const [tabladet,setTabladet] = useState([]);  //Copia de los registros: Para tratamiento de filtrado
    const columnas = CuentasCorrientesColumnas;

    const handleRowSelected = useCallback(state => {
            setSelectedRows(state.selectedRows);
        }, []);
    
    const contextActions = useMemo(() => {
        //console.log("asaaa");
            const handleSeleccionado = () => {
                var strPedido;
        var strIdProducto;
        var strProducto;
        var strIdZonaEntrega;
        var strZonaEntrega;
        var strDocumentoId;
        var strRazonSocial;
        var strCantidad;
        var strPlacaVacio;
        var strUnidadMedida;
        var strTrFechaCarga;

        strPedido = selectedRows.map(r => r.pedido);
        strIdProducto = selectedRows.map(r => r.id_producto);
        strProducto = selectedRows.map(r => r.nombre);
        strIdZonaEntrega = selectedRows.map(r => r.id_zona_entrega);
        strZonaEntrega = selectedRows.map(r => r.zona_entrega);
        strDocumentoId = selectedRows.map(r => r.ref_documento_id);
        strRazonSocial = selectedRows.map(r => r.ref_razon_social);
        strCantidad = selectedRows.map(r => r.saldo);
        strPlacaVacio = selectedRows.map(r => r.tr_placa);
        strUnidadMedida = selectedRows.map(r => r.unidad_medida); //new
        strTrFechaCarga = selectedRows.map(r => r.carga); //new

        //console.log(strPedido[0]);
        //ojo: cuando llega la variable ,desde un filtro en automatico, llega como array unitario, pero array
        //y si lo enviamos al backend en ese formato, las funciones de tratamiento de texto no funcionaran, danger
        ocargaDet.pedido = strPedido[0];
        ocargaDet.id_producto = strIdProducto[0];
        ocargaDet.descripcion = strProducto[0];
        ocargaDet.id_zona_entrega = strIdZonaEntrega[0];
        ocargaDet.zona_entrega = strZonaEntrega[0];
        ocargaDet.ref_documento_id = strDocumentoId[0];
        ocargaDet.ref_razon_social= strRazonSocial[0];
        ocargaDet.saldo = strCantidad[0]; //referencial para avisar y no sobrepasar monto
        ocargaDet.cantidad = strCantidad[0];
        ocargaDet.tr_placa = strPlacaVacio[0];

        ocargaDet.unidad_medida = strUnidadMedida[0]; //new
        ocargaDet.carga = strTrFechaCarga[0]; //new

        setToggleCleared(!toggleCleared);
        //Cerrar Modal
        setAbierto(false);
            };


            return (
        <>
                <Button key="seleccionado" onClick={handleSeleccionado} >
        ACEPTAR <EditRoundedIcon/>
                </Button>
                
        </>
            );
        }, [registrosdet, selectedRows, toggleCleared]);

    const cargaArregloPopUp = async () => {
        let strFecha="";
        //La data, corresponde al mes de login
        //le cargaremos fecha actual si parametro no existe
        strFecha=params.fecha_proceso;
        console.log(strFecha);
        if (params.fecha_proceso===null){
        let nPos=0;
        const fecha = new Date(); //ok fecha y hora actual
        strFecha = fecha.toISOString(); //formato texto
        nPos = strFecha.indexOf('T');
        strFecha = strFecha.substr(0,nPos);
        }
        
        //PENDIENTES 
        //const response = await fetch(`${back_host}/ventadetpendientes/${strFecha}`);
        var response;
        if (params.tipo==="P"){
        response = await fetch(`${back_host}/ventadetpendientes/${strFecha}`);  
        }else{
        //Areglar solo deben ir parametros ano,numero ... debe mostrar lo pendiente por cliente y producto en caso quede saldo por ejecutar
        console.log(`${back_host}/ocargadetpendientesejec/${params.ano}/${params.numero}`);
        response = await fetch(`${back_host}/ocargadetpendientesejec/${params.ano}/${params.numero}`);
        }
        const data = await response.json();
        setRegistrosdet(data);
        setTabladet(data); //Copia para tratamiento de filtrado
        console.log(ocargaDet);
    }

    //Fin Seccion Modal
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
      
    const handleChange = (name, value) => {
        onFormDataChange({ ...formData, [name]: value });
    };
    
    useEffect( ()=> {
        //cargar datos generales
        //cargaComprobanteSelect();
    },[]);

  return (
    <div>
        <div> 
          <TextField fullWidth variant="outlined" color="warning"
                    autofocus
                    label="FILTRAR"
                    sx={{display:'block',
                          margin:'.5rem 0'}}
                    name="busqueda"
                    placeholder='Cliente   Producto  Pedido'
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
        </div>
        
        <Datatable
          title="Cuentas Corrientes"
          theme="solarized"
          columns={columnas}
          data={registrosdet}
          pagination={true}
          paginationPerPage={8} // Número de filas por página

          selectableRows
          contextActions={contextActions}
          //actions={actions}
          onSelectedRowsChange={handleRowSelected}
          clearSelectedRows={toggleCleared}

          selectableRowsComponent={Checkbox} // Pass the function only
          sortIcon={<ArrowDownward />}  
          customStyles={tablaStyles}
          >
        </Datatable>
        <br />

        <div>
            <Button color="warning"
              onClick = { () => {
                setAbierto(false);
                }
              }
            >Cerrar
            </Button>
        </div>
    </div>
  );
};

export default AsientoCobranzaCredito;
