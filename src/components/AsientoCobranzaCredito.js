import React, {useState,useMemo,useEffect,useRef} from 'react';
import {Button,Typography,TextField,Checkbox,Grid,useMediaQuery,Dialog,DialogContent,DialogTitle,List,ListItem,ListItemText} from '@mui/material';
import Datatable from 'react-data-table-component';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import InputAdornment from '@mui/material/InputAdornment';
import FindIcon from '@mui/icons-material/FindInPage';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import {createTheme} from '@mui/material/styles';
import ListaPopUp from './ListaPopUp';
import axios from 'axios';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import swal from 'sweetalert'

const AsientoCobranzaCredito = ({ datos: initialDatos, onClose, id_anfitrion, documento_id, periodo_trabajo, contabilidad_nombre }) => {
  const isSmallScreen = useMediaQuery('(max-width: 600px)');
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
  const [datos, setDatos] = useState(initialDatos);

  const [filteredData, setFilteredData] = useState(initialDatos);
  const [originalData, setOriginalData] = useState(initialDatos);
  const [finalData, setFinalData] = useState([]); //para consumir API

  const [selectedRows, setSelectedRows] = useState([]);
  const [searchText, setSearchText] = useState('');

  const [totalMontoEfec, setTotalMontoEfec] = useState(0);
  const [cuentaBase, setCuentaBase] = useState(''); // Estado para el TextField de cuenta contable
  const [cuentaBaseDesc, setCuentaBaseDesc] = useState(''); // Estado para el TextField de cuenta contable

  const [showModal, setShowModal] = useState(false); //Modal General
  const [showModalCuenta, setShowModalCuenta] = useState(false); //Modal Secundario
  const [valorVista, setValorVista] = useState("deudores");
  const [valorMoneda, setValorMoneda] = useState("soles");
  const [fechaAsiento, setFechaAsiento] = useState('');
  const [tipoCambio, setTipoCambio] = useState('');

  const [cuenta_select,setCuentaSelect] = useState([]); //Cuenta 6X
  const [searchTextCuenta, setSearchTextCuenta] = useState('');
  const textFieldRef = useRef(null); //foco del buscador  

  // Plantilla de la estructura de una fila
  const rowTemplate = {
    id: "",
    tipo: "SALDO MENSUAL USD",
    id_cuenta: "",
    r_id_doc: "",
    r_documento_id: "",
    r_razon_social: "",
    r_fecemi: "",
    r_cod: "",
    r_serie: "",
    r_numero: "",
    saldo_soles: "",
    saldo_dolares: "",
    saldo_deudor_mn: null,
    saldo_acreedor_mn: null,
    saldo_deudor_me: null,
    saldo_acreedor_me: null,
    r_comprobante: "",
    monto_efec: null,
    debe_nac: null,
    haber_nac: null,
    debe_me: null,
    haber_me: null
  };

  const [registro,setRegistro] = useState({
    id_cuenta:'',
    cuenta_descripcion:'',
    r_id_doc:'',
    r_documento_id:'',
    r_razon_social:'',
    r_cod:'',
    r_serie:'',
    r_numero:'',
    r_fecemi:'',

    debe_nac:'0',
    haber_nac:'0',
    debe_me:'0',
    haber_me:'0',                    

    r_moneda:'',
    r_tc:'',

    r_ccosto:'',
    r_id_mediopago:'',
    mediopago:'', //solo lectura
    r_voucher_banco:'',
  });

  function obtenerUltimoDiaDelMes(periodo) {
    // Dividir el periodo en año y mes
    const [anio, mes] = periodo.split('-').map(Number);
    
    // Crear una fecha con el siguiente mes, día 0
    const ultimoDia = new Date(anio, mes, 0);
    
    // Obtener el día, mes y año de la fecha
    const dia = ultimoDia.getDate();
    const mesFormateado = ('0' + (ultimoDia.getMonth() + 1)).slice(-2); // Añadir cero si es necesario
    const anioFormateado = ultimoDia.getFullYear();
    
    // Formatear la fecha como 'YYYY-MM-DD'
    const fechaFormateada = `${anioFormateado}-${mesFormateado}-${('0' + dia).slice(-2)}`;
    
    return fechaFormateada;
  }

  useEffect(() => {
    setFilteredData(datos);
    console.log('contabilidad_nombre: ',contabilidad_nombre);

    //cargar fecha final segun periodo
    const fecha = obtenerUltimoDiaDelMes(periodo_trabajo);
    console.log(fecha); // Salida: '29/02/2024'
    setFechaAsiento(fecha);
    cargaTC(fecha,'2'); //tipo de cambio venta = 2
    
  }, [datos]);

  useEffect(() => {
    const updatedDataCopy = [...filteredData];
    //arreglar suma para deudor, esta fallando condicional
    let total = 0;
    selectedRows.forEach(row => {
      const selectedRow = updatedDataCopy.find(item => item.id === row.id);
      if (selectedRow && selectedRow.monto_efec) {
        total += (parseFloat(selectedRow.monto_efec ?? 0) || 0);
      }
      
    });
    // Redondear la suma a dos decimales
    total = Math.round(total * 100) / 100;
    setTotalMontoEfec(total);
    console.log('setTotalMontoEfec: ',total);

  }, [selectedRows, filteredData]);
  
  useEffect( ()=> {
    if (showModal) {
        cargaCuentaContable('10');
    }
    /////////////////////////////
    //foco
    if (showModal && textFieldRef.current) {
      textFieldRef.current.focus();
    }

  },[showModal,textFieldRef.current]) //Aumentamos IsAuthenticated y user

  useEffect( ()=> {
    /////////////////////////////
    console.log('cambio de valorVista useEffect');
    handleAsientoCuentasCorrientes(id_anfitrion,documento_id,periodo_trabajo);

  },[valorVista]) //Aumentamos IsAuthenticated y user
  
  const handleAsientoCuentasCorrientes = async (sAnfitrion,sDocumentoId,sPeriodo) => {
    //Por default deudores
    console.log('asdsdfsf: ',`${back_host}/reporte/cuentascorrientes/${sAnfitrion}/${sDocumentoId}/${sPeriodo}/${valorVista}`);
    const sApi = `${back_host}/reporte/cuentascorrientes/${sAnfitrion}/${sDocumentoId}/${sPeriodo}/${valorVista}`;
    const response = await fetch(sApi);
    const data = await response.json();
    setDatos(data);
    
    console.log(data);
    //Pausa, cargar useState ... mostrar resultados en pantalla
    /*setTimeout(() => { 
      setUpdateTrigger(Math.random());
    }, 200);*/
    
  };
  
  const handleFilterSearch = (sValue) => {
    //const { value } = event.target;
    setSearchText(sValue);
    const filtered = datos.filter(item =>
      item.r_razon_social.toLowerCase().includes(sValue.toLowerCase()) ||
      item.r_comprobante.toLowerCase().includes(sValue.toLowerCase())
    );
    setFilteredData(filtered);
  };
  const convierteSolesDolares = (nMontoSoles,nMontoDolares,nTipoCambio) =>{
      if (nMontoDolares !== 0 && nMontoDolares !== null) {
          return (nMontoDolares*nTipoCambio).toFixed(2);
      }
      else{
        return nMontoSoles;
      }
  }
  const handleSelectedRowsChange = (state) => {
    //Click en fila de seleccion
    console.log('click en check >> Filas seleccionadas: ', state.selectedRows);
    const selectedIds = state.selectedRows.map(row => row.id);

    // Actualizamos el estado original
    const updatedOriginalData = originalData.map(item => {
      if (selectedIds.includes(item.id)) {
        return { ...item, 
                  //pasamos 100% valor correspondiente con la vista
                  monto_efec: valorVista==='deudores' ? 
                              ( valorMoneda==='soles' ?
                                //todo pago soles, verifica ref dolares y convierte equivalente a tc de la fecha
                                convierteSolesDolares(item.saldo_deudor_mn,item.saldo_deudor_me,parseFloat(tipoCambio))
                                :
                                item.saldo_deudor_me
                              )
                              : 
                              (
                                //todo pago soles, verifica ref dolares y convierte equivalente a tc de la fecha
                                convierteSolesDolares(item.saldo_acreedor_mn,item.saldo_acreedor_me,parseFloat(tipoCambio))
                              ),
                  //aqui debemos convertir tc
                  debe_nac: (item.saldo_acreedor_me*parseFloat(tipoCambio)).toFixed(2),
                  haber_nac: (item.saldo_deudor_me*parseFloat(tipoCambio)).toFixed(2),

                  debe_me: item.saldo_acreedor_me,
                  haber_me: item.saldo_deudor_me
               };
      } else if (selectedRows.find(row => row.id === item.id)) {
        return { ...item, 
                  monto_efec: null,
                  debe_nac: null,
                  haber_nac: null,
                  debe_me: null,
                  haber_me: null
               };
      } else {
        return item;
      }
    });

    // Actualizamos el estado filtrado
    const updatedFilteredData = filteredData.map(item => {
      if (selectedIds.includes(item.id)) {
        return { ...item, 
                  //pasamos 100% valor correspondiente con la vista
                  monto_efec: valorVista==='deudores' ? 
                              ( valorMoneda==='soles' ?
                                //todo pago soles, verifica ref dolares y convierte equivalente a tc de la fecha
                                convierteSolesDolares(item.saldo_deudor_mn,item.saldo_deudor_me,parseFloat(tipoCambio))
                                :
                                item.saldo_deudor_me
                              )
                              : 
                              (
                                //todo pago soles, verifica ref dolares y convierte equivalente a tc de la fecha
                                convierteSolesDolares(item.saldo_acreedor_mn,item.saldo_acreedor_me,parseFloat(tipoCambio))
                              ),

                  //aqui debemos convertir tc
                  debe_nac: (item.saldo_acreedor_me*parseFloat(tipoCambio)).toFixed(2),
                  haber_nac: (item.saldo_deudor_me*parseFloat(tipoCambio)).toFixed(2),

                  debe_me: item.saldo_acreedor_me,
                  haber_me: item.saldo_deudor_me
               };
      } else if (selectedRows.find(row => row.id === item.id)) {
        return { ...item, 
                  monto_efec: null,
                  debe_nac: null,
                  haber_nac: null,
                  debe_me: null,
                  haber_me: null
               };
      } else {
        return item;
      }
    });

    setOriginalData(updatedOriginalData); // Actualizamos los datos originales
    setFilteredData(updatedFilteredData); // Actualizamos los datos filtrados
    setSelectedRows(state.selectedRows);

    console.log("setOriginalData: ", updatedOriginalData); // Log updated data to check the changes
    console.log("setFilteredData: ", updatedFilteredData); // Log updated data to check the changes
  };  

  const handleChangeMontoEfec = (id, value, valueSaldoMe) => {
    //value = monto modificado
    //valueSaldoMe = saldo referencial en moneda extranjera, se usa como validacion y limite

    let updatedData;
    let nMontoEfecMe=0; //nuevo efectivo en dolares, monto efectivo en SOLES
    let nMontoEfecMn=0; //nuevo efectivo en soles, monto efectivo en DOLARES

    //verificar si existe ref en dolares, para calcular equivalencia
    if (valorMoneda==='soles') {
      if (valueSaldoMe !== 0) {
        nMontoEfecMe = (value / parseFloat(tipoCambio)).toFixed(2);
      }
    }else{
      nMontoEfecMn = (value * parseFloat(tipoCambio)).toFixed(2);
    }

    //Actualizamos columnas debe,haber,soles,dolares, respectivamente
    if (valorVista==='deudores') {
      if (valorMoneda==='soles') {
        //actualizar haber_nac desde saldo_deudor_mn
        updatedData = originalData.map(item =>
          item.id === id ? { ...item, haber_nac: value, haber_me:nMontoEfecMe, monto_efec: value  } : item
        );
      }else{
        //actualizar haber_me desde saldo_deudor_me
        updatedData = originalData.map(item =>
          item.id === id ? { ...item, haber_me: value, haber_mn:nMontoEfecMn ,monto_efec: value  } : item
        );
      }
    }else{
      if (valorMoneda==='soles') {
        //actualizar debe_nac desde saldo_acreedor_mn
        updatedData = originalData.map(item =>
          item.id === id ? { ...item, debe_nac: value, debe_me:nMontoEfecMe, monto_efec: value  } : item
        );
      }else{
        //actualizar debe_me desde saldo_acreedor_me
        updatedData = originalData.map(item =>
          item.id === id ? { ...item, debe_me: value, haber_me:nMontoEfecMe, monto_efec: value  } : item
        );
      }
    }
    setOriginalData(updatedData);

    //Aumentamos en el filteredData tambien, porque despues de modificar la wa, mostraba todo ;)
    if (valorVista==='deudores') {
      if (valorMoneda==='soles') {
        //actualizar haber_nac desde saldo_deudor_mn
        updatedData = filteredData.map(item =>
          //item.id === id ? { ...item, haber_nac: value, monto_efec: value  } : item
          item.id === id ? { ...item, haber_nac: value, haber_me:nMontoEfecMe, monto_efec: value  } : item
        );
      }else{
        //actualizar haber_me desde saldo_deudor_me
        updatedData = filteredData.map(item =>
          //item.id === id ? { ...item, haber_me: value, monto_efec: value  } : item
          item.id === id ? { ...item, haber_me: value, haber_mn:nMontoEfecMn ,monto_efec: value  } : item
        );
      }
    }else{
      if (valorMoneda==='soles') {
        //actualizar debe_nac desde saldo_acreedor_mn
        updatedData = filteredData.map(item =>
          //item.id === id ? { ...item, debe_nac: value, monto_efec: value  } : item
          item.id === id ? { ...item, debe_nac: value, debe_me:nMontoEfecMe, monto_efec: value  } : item
        );
      }else{
        //actualizar debe_me desde saldo_acreedor_me
        updatedData = filteredData.map(item =>
          //item.id === id ? { ...item, debe_me: value, monto_efec: value  } : item
          item.id === id ? { ...item, debe_me: value, haber_me:nMontoEfecMe, monto_efec: value  } : item
        );
      }
    }
    setFilteredData(updatedData);

    console.log("setOriginalData y setFilteredData : ", updatedData); // Log updated data to check the changes

    //probando aplicar filtro, pero desparece el monto y no deja sumar, arreglar
    //handleFilterSearch(searchText);
    
  };

  const handleCobrar = () => {
    //mostramos modal de cuenta contable
    setShowModal(true);
    
  };

  const contextActions = useMemo(() => {
    return (
      <Button key="seleccionado" onClick={handleCobrar}>
        ACEPTAR <EditRoundedIcon />
      </Button>
    );
  }, [datos, selectedRows]);

  const columnas = useMemo(() => [
    {
      name: 'Comprobante',
      selector: 'r_comprobante',
      sortable: true,
      width: '140px',
    },
    {
      name: 'Monto Efectivo',
      selector: 'monto_efec',
      sortable: true,
      width: '120px',
      cell: row => (
        <TextField
          variant="outlined"
          size="small"
          value={row.monto_efec || ''}
          onChange={e => {
            const newValue = parseFloat(e.target.value);
            const saldo_me = (parseFloat(row.saldo_deudor_me) || 0) + (parseFloat(row.saldo_acreedor_me) || 0);
            
            //validar saldo con valorVista y valorMoneda chochera
            const saldo = valorVista==='deudores' ? 
                        ( valorMoneda==='soles' ?
                          row.saldo_deudor_mn
                          :
                          row.saldo_deudor_me
                        )
                        : 
                        (
                          row.saldo_acreedor_mn
                        );
            //const saldo = parseFloat(row.saldo_acreedor_mn);
            if (!isNaN(newValue) && newValue <= saldo) {
              handleChangeMontoEfec(row.id, newValue, saldo_me);
            }
          }}
          InputProps={{
            style: { color: 'white' },
            inputProps: { style: { fontSize: '14px', color: 'skyblue' } }
          }}
          disabled={!selectedRows.some(selectedRow => selectedRow.id === row.id)}
        />
      ),
    },
    /*{
      name: 'DEBE PEN',
      selector: 'debe_nac',
      sortable: true,
      width: '120px',
      cell: row => (
        <TextField
          variant="outlined"
          size="small"
          value={row.debe_nac || ''}
          onChange={e => {
            //control de cambios, no exceder columna original
            //const newValue = parseFloat(e.target.value);
            //const saldo = parseFloat(row.saldo_acreedor_mn);
            //if (!isNaN(newValue) && newValue <= saldo) {
            //  handleChangeDebeHaber(row.id, 'debe_nac', newValue);
            //}
          }}
          InputProps={{
            style: { color: 'white' },
            inputProps: { style: { fontSize: '14px', color: 'skyblue' } }
          }}
          disabled={!selectedRows.some(selectedRow => selectedRow.id === row.id)}
        />
      ),
    },
    {
      name: 'HABER PEN',
      selector: 'haber_nac',
      sortable: true,
      width: '120px',
      cell: row => (
        <TextField
          variant="outlined"
          size="small"
          value={row.haber_nac || ''}
          onChange={e => {
            //control de cambios, no exceder columna original
            //const newValue = parseFloat(e.target.value);
            //const saldo = parseFloat(row.saldo_deudor_mn);
            //if (!isNaN(newValue) && newValue <= saldo) {
            //  handleChangeDebeHaber(row.id, 'haber_nac', newValue);
            //}
          }}
          InputProps={{
            style: { color: 'white' },
            inputProps: { style: { fontSize: '14px', color: 'skyblue' } }
          }}
          disabled={!selectedRows.some(selectedRow => selectedRow.id === row.id)}
        />
      ),
    },
    {
      name: 'DEBE USD',
      selector: 'debe_me',
      sortable: true,
      width: '120px',
      cell: row => (
        <TextField
          variant="outlined"
          size="small"
          value={row.debe_me || ''}
          onChange={e => {
            //control de cambios, no exceder columna original
            //const newValue = parseFloat(e.target.value);
            //const saldo = parseFloat(row.saldo_acreedor_me);
            //if (!isNaN(newValue) && newValue <= saldo) {
            //  handleChangeDebeHaber(row.id, 'debe_me', newValue);
            //}
          }}
          InputProps={{
            style: { color: 'white' },
            inputProps: { style: { fontSize: '14px', color: 'skyblue' } }
          }}
          disabled={!selectedRows.some(selectedRow => selectedRow.id === row.id)}
        />
      ),
    },
    {
      name: 'HABER USD',
      selector: 'haber_me',
      sortable: true,
      width: '120px',
      cell: row => (
        <TextField
          variant="outlined"
          size="small"
          value={row.haber_me || ''}
          onChange={e => {
            //control de cambios, no exceder columna original
            //const newValue = parseFloat(e.target.value);
            //const saldo = parseFloat(row.saldo_deudor_me);
            //if (!isNaN(newValue) && newValue <= saldo) {
            //  handleChangeDebeHaber(row.id, 'haber_me', newValue);
            //}
          }}
          InputProps={{
            style: { color: 'white' },
            inputProps: { style: { fontSize: '14px', color: 'skyblue' } }
          }}
          disabled={!selectedRows.some(selectedRow => selectedRow.id === row.id)}
        />
      ),
    },*/
    {
      name: 'Cuenta',
      selector: 'id_cuenta',
      sortable: true,
      width: '100px',
    },
    {
      name: 'Fecha',
      selector: 'r_fecemi',
      sortable: true,
      width: '90px',
    },
    {
      name: 'Razon Social',
      selector: 'r_razon_social',
      sortable: true,
      width: '200px',
    },
    {
      name: 'Deudor PEN',
      selector: 'saldo_deudor_mn',
      sortable: true,
      width: '120px',
    },
    {
      name: 'Acreedor PEN',
      selector: 'saldo_acreedor_mn',
      sortable: true,
      width: '120px',
    },
    {
      name: 'Deudor USD',
      selector: 'saldo_deudor_me',
      sortable: true,
      width: '120px',
    },
    {
      name: 'Acreedor USD',
      selector: 'saldo_acreedor_me',
      sortable: true,
      width: '120px',
    },

  ], [datos, selectedRows]);

  createTheme('solarized', {
    text: {
      primary: '#ffffff',
      secondary: '#2aa198',
    },
    background: {
      default: '#1e272e'
    },
    context: {
      background: '#cb4b16',
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

  const tablaStyles = {
    rows: {
      style: {
        minHeight: '20px',
      },
    },
    headCells: {
      style: {
        paddingLeft: '8px',
        paddingRight: '8px',
      },
    },
    cells: {
      style: {
        paddingLeft: '8px',
        paddingRight: '8px',
      },
    },
  };
  
  const filteredCuentas = cuenta_select.filter((c) =>
    `${c.id_cuenta} ${c.descripcion}`.toLowerCase().includes(searchTextCuenta.toLowerCase())
  );
  const cargaCuentaContable = (sCuentaFiltro) =>{
    axios
    .get(`${back_host}/cuentassimple/${id_anfitrion}/${documento_id}/${sCuentaFiltro}`)
    .then((response) => {
        setCuentaSelect(response.data);
    })
    .catch((error) => {
        console.log(error);
    });
  }
  const handleCuentaSelect = (codigo, descripcion, sNombreCuenta) => {
    //console.log("codigo,descripcion: ",codigo,descripcion);
    //console.log("sNombreCuenta: ", sNombreCuenta);
      setSearchTextCuenta(codigo);

      setCuentaBase(codigo);
      setCuentaBaseDesc(descripcion);
      console.log(codigo,descripcion);
      
      confirmaRegistroAsiento(codigo,id_anfitrion,documento_id,periodo_trabajo);

      setShowModal(false);
      
  };
  const confirmaRegistroAsiento = async(sCuenta,sAnfitrion,sDocumentoId,sPeriodo)=>{
    await swal({
      title: (valorVista==='deudores') ? "Registrar Cobranza Deudor":"Registrar Pago Acreedor",
      text:"Seguro ?",
      icon:"info",
      buttons:["No","Si"]
    }).then(respuesta=>{
        if (respuesta){
          //Filtrar useState con monto_efec <> 0 y null = dataFinal
          const filtrado = filteredData.filter(row => row.monto_efec !== 0 && row.monto_efec !== null);
          const finalDataCopy = [...filtrado];
          
          let newRow = {
            ...rowTemplate,
            id: (filtrado.length + 1).toString(),
            id_cuenta: sCuenta,
            r_fecemi: fechaAsiento
          };
          if (valorVista==='deudores'){
            if (valorMoneda==='soles'){
              newRow = {...newRow,debe_nac:totalMontoEfec};
            }
            else{
              newRow = {...newRow,debe_me:totalMontoEfec};
            }
          }else{
            if (valorMoneda==='soles'){
              newRow = {...newRow,haber_nac:totalMontoEfec};
            }
            else{
              newRow = {...newRow,haber_me:totalMontoEfec};
            }
          }
          //Agregar fila con totales y cuenta 104 al useState dataFinal 
          finalDataCopy.push(newRow);
          console.log('finalDataCopy: ',finalDataCopy);

          //Consumir API y respuesta de confirmacion
          //Enviamos parametros y json
          //(Backend y Postgres)Funcion postgres se encarga de insertar asiento y confirmar respuesta
          //Version envio de json
          /*const soloNumAsientos = elementosSeleccionados.map(item => {
            return { num_asiento: item.num_asiento };
          });*/
          //console.log('Tamaño bytes solo num_asiento: ',calcularTamanoJSON(JSON.stringify(soloNumAsientos)));
          const sRuta = 
          `${back_host}/asientomasivocaja/${sAnfitrion}/${sDocumentoId}/${sPeriodo}`;
          console.log(sRuta);
          fetch(sRuta, {
            method: "POST",
            body: JSON.stringify(finalDataCopy), //cambiazo de elementosSeleccionados por soloNumAsientos, tamaño minimo json para evitar rechazo en backend railway
            headers: {"Content-Type":"application/json"}
          })
          .then(response => response.json())
          .then(data => {
              if (data.success) {
                  console.log('La operación fue exitosa');
                  swal({
                    text:"Asiento registrado con exito",
                    icon:"success",
                    timer:"2000"
                  });
                  // Aquí puedes agregar lógica adicional para manejar una respuesta exitosa
              } else {
                  console.log('La operación falló');
                  // Aquí puedes agregar lógica adicional para manejar una respuesta fallida
                  swal({
                    text:"La Operacion fallo, intentelo nuevamente",
                    icon:"warning",
                    timer:"2000"
                  });
              }
          })
          .catch(error => {
              console.error('Hubo un problema con la solicitud fetch:', error);
              // Aquí puedes agregar lógica adicional para manejar errores en la solicitud
          });

          /*setTimeout(() => { // Agrega una función para que se ejecute después del tiempo de espera
              //setUpdateTrigger(Math.random());//experimento
          }, 200);
            */            
      }
    })
  }

  const handleSearchTextCuentaChange = (event) => {
    console.log(event.target.value);
    setSearchTextCuenta(event.target.value.replace('+', '').replace('-',''));
  };
  const handleCodigoKeyDown = async (event) => {
    console.log(event.target.name);
    if (event.target.name==="cuentaBase"){
      if (event.key === '+') {
          setShowModal(true);
      }
      if (event.key === '-') {
        setShowModal(false);
      }
    }
    //console.log(event.key);
    if (event.key === 'Enter') {
      //Selecciona el 1er elemento de la lista, en caso no haya filtrado nada
      console.log(event.target.name);
      if (event.target.name==="cuentaBaseModal" || event.target.name==="cuentaBase"){
        handleCuentaSelect(filteredCuentas[0].id_cuenta, filteredCuentas[0].descripcion, event.target.name);

        setShowModal(false);
      }
    }
  };  

  const actualizaValorVista = (e) => {
    setValorVista(e.target.value);

    //Lo dejaremos terminar el evento de cambio o change
    //setUpdateTrigger(Math.random());//experimento para actualizar el dom
  }
  const actualizaValorMoneda = (e) => {
    setValorMoneda(e.target.value);

    //Lo dejaremos terminar el evento de cambio o change
    //setUpdateTrigger(Math.random());//experimento para actualizar el dom
  }

  const cargaTC = (sFecha,sTipo) =>{
    axios
    .get(`${back_host}/tipocambio/${sFecha}/${sTipo}`)
    .then((response) => {
        const tipoCambio = response.data.tc;
        setTipoCambio(tipoCambio);      
        //setTipoCambio(response.data);
    })
    .catch((error) => {
        console.log(error);
    });
  }

  const handleChangeFecha = (sFecha) => {
    setFechaAsiento(sFecha);
    cargaTC(sFecha,'2');
  }

  return (
    <div>
      <Grid container spacing={0}
          direction={isSmallScreen ? 'row' : 'row'}
          alignItems={isSmallScreen ? 'center' : 'start'}
          justifyContent={isSmallScreen ? 'center' : 'end'}
      >
          
          <Grid item xs={isSmallScreen ? 12:2} > 
              <ToggleButtonGroup
                color="warning"
                size="small"
                value={valorVista}
                exclusive
                onChange={actualizaValorVista}
                aria-label="Platform"
                //style={{ backgroundColor: 'lightblue', padding: '0px' }}  // Cambia el color de fondo aquí
                style={{ width: '100%' }}  // Asegura que el grupo ocupe todo el espacio disponible                
              >
                <ToggleButton value="deudores" 
                              style={{
                                        backgroundColor: valorVista === 'deudores' ? 'lightblue' : 'transparent',
                                        color: valorVista === 'deudores' ? 'orange' : 'white',
                                        flex: 1,  // Permite que el botón ocupe el espacio disponible
                                        width: '100%',                                        
                                    }}
                >
                  DEUDORES
                </ToggleButton>
                <ToggleButton value="acreedores" 
                              style={{
                                        backgroundColor: valorVista === 'acreedores' ? 'lightblue' : 'transparent',
                                        color: valorVista === 'acreedores' ? 'orange' : 'white',
                                        flex: 1,  // Permite que el botón ocupe el espacio disponible
                                        width: '100%',                                        
                                    }}
                >ACREEDORES
                </ToggleButton>

              </ToggleButtonGroup>      
          </Grid>

          <Grid item xs={isSmallScreen ? 12:1.5} > 
              <ToggleButtonGroup
                color="warning"
                size="small"
                value={valorMoneda}
                exclusive
                onChange={actualizaValorMoneda}
                aria-label="Platform"
                style={{ width: '100%' }}  // Asegura que el grupo ocupe todo el espacio disponible                                
              >
                <ToggleButton value="soles" 
                              style={{
                                        backgroundColor: valorMoneda === 'soles' ? 'lightblue' : 'transparent',
                                        color: valorMoneda === 'soles' ? 'orange' : 'white',
                                        flex: 1,  // Permite que el botón ocupe el espacio disponible
                                        width: '100%',                                        
                                    }}
                >
                  SOLES
                </ToggleButton>
                <ToggleButton value="dolares" 
                              style={{
                                        backgroundColor: valorMoneda === 'dolares' ? 'lightblue' : 'transparent',
                                        color: valorMoneda === 'dolares' ? 'orange' : 'white',
                                        flex: 1,  // Permite que el botón ocupe el espacio disponible
                                        width: '100%',                                        
                                    }}
                >
                  DOLARES
                </ToggleButton>

              </ToggleButtonGroup>      
          </Grid>

          <Grid item xs={isSmallScreen ? 12:1.2} > 
              <TextField variant="outlined" 
                                  fullWidth
                                  //label="FECMI"
                                  sx={{display:'block',
                                      margin:'.0rem 0'}}
                                  name="fechaAsiento"
                                  size='small'
                                  type="date"
                                  value={fechaAsiento} 
                                  onChange={(e) => handleChangeFecha(e.target.value)}
                                  InputProps={{
                                    style: { color: 'white' },
                                    inputProps: { style: { fontSize: '14px', color: 'white',textAlign: 'center' } }
                                  }}
  

              />
          </Grid>
          <Grid item xs={isSmallScreen ? 12:1} > 
              <TextField variant="outlined"
                                fullWidth
                                name="tipoCambio"
                                sx={{display:'block',
                                  margin:'.0rem 0'}}
                                size="small"
                                placeholder="T.C: VENTA"
                                value={tipoCambio}
                                //onChange={handleSearch}
                                InputProps={{
                                  style: { color: 'white' },
                                  inputProps: { style: { fontSize: '14px', color: 'skyblue',textAlign: 'center' } }
                                }}
              />
          </Grid>
          <Grid item xs={isSmallScreen ? 12:5.3} > 
              <TextField variant="outlined"
                                fullWidth
                                sx={{display:'block',
                                  margin:'.0rem 0'}}
                                size="small"
                                placeholder="RAZON SOCIAL  COMPROBANTE"
                                value={searchText}
                                onChange={ (e)=>{
                                  handleFilterSearch(e.target.value)
                                    }
                                }
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <FindIcon />
                                    </InputAdornment>
                                  ),
                                  style: { color: 'white' },
                                  inputProps: { style: { fontSize: '14px', color: 'gray' } }
                                }}
              />
          </Grid>
          <Grid item xs={isSmallScreen ? 12:1} > 
            <Button variant='contained' fullWidth  color="warning" onClick={ ()=>{onClose(datos)} }>
              Cerrar
            </Button>
          </Grid>

          <Grid item xs={isSmallScreen ? 12:6} > 
          { (showModal) ?
            (   <>
              <Grid container spacing={0}
                  direction={isSmallScreen ? 'row' : 'row'}
                  //alignItems={isSmallScreen ? 'center' : 'start'}
                  //justifyContent={isSmallScreen ? 'center' : 'start'}
              > 
                <Grid item xs={6} >
                    <TextField  variant="outlined" color="success" size="small"
                          sx={{display:'block',
                                margin:'.0rem 0'}}
                          name="cuentaBase"
                          value={cuentaBase}
                          placeholder='Cuenta 10'
                          onKeyDown={handleCodigoKeyDown} //new para busqueda
                          inputProps={{ style:{color:'white'} }}
                          InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                </InputAdornment>
                              ),
                              style:{color:'white'} 
                          }}
                    />
                        {/* Seccion para mostrar Dialog tipo Modal, para busqueda incremental cuentas */}
                        <Dialog
                          open={showModal}
                          onClose={() => setShowModal(false)}
                          maxWidth="md" // Valor predeterminado de 960px
                          fullWidth
                          PaperProps={{
                            style: {
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              marginTop: '10vh', // Ajusta este valor según tus necesidades
                              //background:'#1e272e',
                              background: 'rgba(33, 150, 243, 0.8)', // Cambiado a color RGBA para la transparencia                              
                              color:'white',
                              width: '40%', // Ajusta este valor según tus necesidades
                              maxWidth: 'none' // Esto es importante para permitir que el valor de width funcione
                            },
                          }}
                        >
                          <DialogTitle>Caja - Banco</DialogTitle>
                            <TextField variant="outlined" 
                                      //maxWidth="md"
                                      autoFocus
                                      size="small"
                                      //sx={{mt:-1}}
                                      name="totalMontoEfec"
                                      value={totalMontoEfec.toFixed(2)}
                                      //onChange={handleSearchTextCuentaChange} //new para busqueda
                                      //onKeyDown={handleCodigoKeyDown} //new para busqueda
                                      inputProps={{ style:{color:'white',width: 140, textAlign: 'center',  readOnly: true} }}
                                      InputLabelProps={{ style:{color:'white'} }}
                            />

                            <TextField variant="standard" 
                                        //maxWidth="md"
                                        autoFocus
                                        size="small"
                                        sx={{mt:2}}
                                        name="cuentaBaseModal"
                                        inputRef={textFieldRef} // Referencia para el TextField
                                        value={searchTextCuenta}
                                        onChange={handleSearchTextCuentaChange} //new para busqueda
                                        onKeyDown={handleCodigoKeyDown} //new para busqueda
                                        inputProps={{ style:{color:'white',width: 140, textAlign: 'center'} }}
                                        InputLabelProps={{ style:{color:'white'} }}
                              />
                          <DialogContent sx={{ padding: 0 }}>
                            <List sx={{ padding: 0 }}>
                              {filteredCuentas.map((c) => (
                                <ListItem key={c.id_cuenta} 
                                          onClick={() => handleCuentaSelect(c.id_cuenta, c.descripcion, "cuentaBaseModal")}
                                          sx={{ 
                                            borderBottom: '0px solid #ddd' // Línea de división
                                          }}                                          
                                >
                                  <ListItemText primary={`${c.id_cuenta} - ${c.descripcion}`} 
                                                primaryTypographyProps={{ fontSize: '0.8rem' }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </DialogContent>
                        </Dialog>
                        {/* FIN Seccion para mostrar Dialog tipo Modal */}
                    </Grid>    
                        
              </Grid>
                        
                </>
            )
            :
            (   
              <>
              </>
            )
            }
          </Grid>

      </Grid>

      <Datatable
        title={`Cuentas Corrientes - ${contabilidad_nombre}`}
        theme="solarized"
        columns={columnas}
        data={filteredData}
        pagination
        paginationPerPage={8}
        selectableRows
        contextActions={contextActions}
        onSelectedRowsChange={handleSelectedRowsChange}
        selectableRowsComponent={Checkbox}
        sortIcon={<ArrowDownward />}
        customStyles={tablaStyles}
        //clearSelectedRows={selectedRows.some(row => row.id === 'total')}
      />
      
      <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
      <div>Total Monto Efectivo: {totalMontoEfec.toFixed(2)}</div>
      </div>      

      <br />

    </div>
  );
};

export default AsientoCobranzaCredito;
