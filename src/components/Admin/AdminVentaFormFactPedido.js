import React, { useEffect, useMemo, useState } from 'react';

import {
  Grid,
  TextField,
  Button,
  Typography,
  Checkbox,
  useMediaQuery,
  InputAdornment,
  Paper
} from '@mui/material';

import Datatable from 'react-data-table-component';

import FindIcon from '@mui/icons-material/FindInPage';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import FactCheckIcon from '@mui/icons-material/FactCheck';

import { createTheme } from '@mui/material/styles';

import axios from 'axios';
import swal from 'sweetalert';

/*
|--------------------------------------------------------------------------
| COMPONENTE:
| AdminVentaFormFactPedido
|--------------------------------------------------------------------------
|
| OBJETIVO:
| Mostrar pedidos pendientes y permitir seleccionar múltiples pedidos
| SOLO del mismo cliente (documento_id).
|
| Luego:
| - Obtener productos agrupados
| - Obtener referencias de pedidos
| - Retornar resultado al formulario padre
|
|--------------------------------------------------------------------------
|
| PROPS
|
| id_anfitrion
| periodo_trabajo
| onClose(resultado)
|
|--------------------------------------------------------------------------
*/

const AdminVentaFormFactPedido = ({
  id_anfitrion,
  periodo_trabajo,
  onClose
}) => {

  /*
  |--------------------------------------------------------------------------
  | RESPONSIVE
  |--------------------------------------------------------------------------
  */

  const isSmallScreen = useMediaQuery('(max-width:600px)');

  /*
  |--------------------------------------------------------------------------
  | BACKEND
  |--------------------------------------------------------------------------
  */

  const back_host =
    process.env.BACK_HOST ||
    'https://xpertcont-backend-js-production-50e6.up.railway.app';

  /*
  |--------------------------------------------------------------------------
  | ESTADOS PRINCIPALES
  |--------------------------------------------------------------------------
  */

  //Listado original API
  const [datos, setDatos] = useState([]);

  //Listado filtrado buscador
  const [filteredData, setFilteredData] = useState([]);

  //Filas seleccionadas
  const [selectedRows, setSelectedRows] = useState([]);

  //Texto buscador
  const [searchText, setSearchText] = useState('');

  /*
  |--------------------------------------------------------------------------
  | CLIENTE SELECCIONADO
  |--------------------------------------------------------------------------
  |
  | Restricción:
  | Solo se pueden seleccionar pedidos del mismo cliente
  |
  */

  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | CARGA INICIAL
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    cargarPedidosPendientes();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CARGAR PEDIDOS DESDE API
  |--------------------------------------------------------------------------
  */

  const cargarPedidosPendientes = async () => {

    try {

      const response = await axios.get(
        `${back_host}/ad_ventaspendientes/${periodo_trabajo}/${id_anfitrion}`
      );

      /*
      |--------------------------------------------------------------------------
      | ESTRUCTURA API
      |--------------------------------------------------------------------------
      |
      | {
      |   success:true,
      |   data:[...]
      | }
      |
      */

      const apiData = response.data.data || [];

      /*
      |--------------------------------------------------------------------------
      | AGREGAMOS ID INTERNO
      |--------------------------------------------------------------------------
      |
      | react-data-table-component trabaja mejor con un id unico
      |
      */

      const dataConId = apiData.map((item, index) => ({
        ...item,
        id: index + 1
      }));

      setDatos(dataConId);
      setFilteredData(dataConId);

    } catch (error) {

      console.log(error);

      swal({
        text: 'Error cargando pedidos pendientes',
        icon: 'error'
      });
    }
  };

  /*
  |--------------------------------------------------------------------------
  | BUSCADOR
  |--------------------------------------------------------------------------
  */

  const handleFilterSearch = (value) => {

    setSearchText(value);

    const filtered = datos.filter(item => {

      const comprobante =
        `${item.r_cod}-${item.r_serie}-${item.r_numero}`;

      return (
        item.razon_social?.toLowerCase().includes(value.toLowerCase()) ||
        item.documento_id?.toLowerCase().includes(value.toLowerCase()) ||
        comprobante.toLowerCase().includes(value.toLowerCase())
      );
    });

    setFilteredData(filtered);
  };

  /*
  |--------------------------------------------------------------------------
  | VALIDACION SELECCION
  |--------------------------------------------------------------------------
  |
  | REGLA:
  | Solo seleccionar pedidos del mismo cliente
  |
  */

  const handleSelectedRowsChange = ({ selectedRows }) => {

    /*
    |--------------------------------------------------------------------------
    | SI NO HAY SELECCION
    |--------------------------------------------------------------------------
    */

    if (selectedRows.length === 0) {

      setSelectedRows([]);
      setClienteSeleccionado(null);

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | OBTENER CLIENTE BASE
    |--------------------------------------------------------------------------
    */

    const clienteActual = selectedRows[0].documento_id;

    /*
    |--------------------------------------------------------------------------
    | VALIDAR QUE TODOS PERTENEZCAN AL MISMO CLIENTE
    |--------------------------------------------------------------------------
    */

    const clienteValido = selectedRows.every(
      row => row.documento_id === clienteActual
    );

    /*
    |--------------------------------------------------------------------------
    | SI NO SON DEL MISMO CLIENTE
    |--------------------------------------------------------------------------
    */

    if (!clienteValido) {

      swal({
        text: 'Solo puede seleccionar pedidos del mismo cliente',
        icon: 'warning',
        timer: 2000
      });

      /*
      |--------------------------------------------------------------------------
      | QUEDARNOS SOLO CON LOS VALIDOS
      |--------------------------------------------------------------------------
      */

      const filasValidas = selectedRows.filter(
        row => row.documento_id === clienteSeleccionado
      );

      setSelectedRows(filasValidas);

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | TODO OK
    |--------------------------------------------------------------------------
    */

    setClienteSeleccionado(clienteActual);

    setSelectedRows(selectedRows);
  };

  /*
  |--------------------------------------------------------------------------
  | PROCESAR FACTURACION
  |--------------------------------------------------------------------------
  |
  | Obtiene:
  |
  | - productosAgrupados
  | - refPedidos
  |
  */

  const procesarFacturacion = async () => {

    /*
    |--------------------------------------------------------------------------
    | VALIDACION
    |--------------------------------------------------------------------------
    */

    if (selectedRows.length === 0) {

      swal({
        text: 'Seleccione pedidos',
        icon: 'warning'
      });

      return;
    }

    try {

      /*
      |--------------------------------------------------------------------------
      | SOLO REFERENCIAS
      |--------------------------------------------------------------------------
      */

      const pedidos = selectedRows.map(item => ({
        r_cod: item.r_cod,
        r_serie: item.r_serie,
        r_numero: item.r_numero
      }));

      /*
      |--------------------------------------------------------------------------
      | CONSUMIR API BACKEND
      |--------------------------------------------------------------------------
      */

      const response = await axios.post(
        `${back_host}/agruparpedidos`,
        {
          pedidos,
          periodo: periodo_trabajo,
          id_anfitrion
        }
      );

      /*
      |--------------------------------------------------------------------------
      | RESPUESTA ESPERADA
      |--------------------------------------------------------------------------
      |
      | {
      |   success:true,
      |   productosAgrupados:[...],
      |   refPedidos:[...]
      | }
      |
      */

      const resultado = {

        cliente: {
          documento_id: selectedRows[0].documento_id,
          razon_social: selectedRows[0].razon_social
        },

        productosAgrupados:
          response.data.productosAgrupados || [],

        refPedidos:
          response.data.refPedidos || []
      };

      /*
      |--------------------------------------------------------------------------
      | RETORNAR AL FORMULARIO PADRE
      |--------------------------------------------------------------------------
      */

      onClose(resultado);

    } catch (error) {

      console.log(error);

      swal({
        text: 'Error procesando pedidos',
        icon: 'error'
      });
    }
  };

  /*
  |--------------------------------------------------------------------------
  | BOTON CONTEXTUAL TABLA
  |--------------------------------------------------------------------------
  */

  const contextActions = useMemo(() => {

    return (

      <Button
        variant="contained"
        color="warning"
        onClick={procesarFacturacion}
        startIcon={<FactCheckIcon />}
      >
        FACTURAR
      </Button>

    );

  }, [selectedRows]);

  /*
  |--------------------------------------------------------------------------
  | COLUMNAS TABLA
  |--------------------------------------------------------------------------
  */

  const columnas = useMemo(() => [

    {
      name: 'Comprobante',
      selector: row =>
        `${row.r_cod}-${row.r_serie}-${row.r_numero}`,
      sortable: true,
      width: '180px'
    },

    {
      name: 'Fecha',
      selector: row => row.r_fecemi,
      sortable: true,
      width: '120px'
    },

    {
      name: 'Documento',
      selector: row => row.documento_id,
      sortable: true,
      width: '140px'
    },

    {
      name: 'Cliente',
      selector: row => row.razon_social,
      sortable: true,
      width: '300px'
    },

    {
      name: 'Moneda',
      selector: row => row.r_moneda,
      width: '100px'
    },

    {
      name: 'Monto Total',
      selector: row => row.r_monto_total,
      sortable: true,
      right: true,
      width: '140px'
    }

  ], []);

  /*
  |--------------------------------------------------------------------------
  | THEME TABLA
  |--------------------------------------------------------------------------
  */

  createTheme(
    'solarized',
    {
      text: {
        primary: '#ffffff',
        secondary: '#2aa198'
      },

      background: {
        default: '#1e272e'
      },

      context: {
        background: '#cb4b16',
        text: '#FFFFFF'
      },

      divider: {
        default: '#073642'
      },

      action: {
        button: 'rgba(0,0,0,.54)',
        hover: 'rgba(0,0,0,.08)',
        disabled: 'rgba(0,0,0,.12)'
      }
    },
    'dark'
  );

  /*
  |--------------------------------------------------------------------------
  | ESTILOS TABLA
  |--------------------------------------------------------------------------
  */

  const tablaStyles = {

    rows: {
      style: {
        minHeight: '32px'
      }
    },

    headCells: {
      style: {
        paddingLeft: '8px',
        paddingRight: '8px'
      }
    },

    cells: {
      style: {
        paddingLeft: '8px',
        paddingRight: '8px'
      }
    }
  };

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (

    <div>

      {/* ============================================================= */}
      {/* CABECERA */}
      {/* ============================================================= */}

      <Grid
        container
        spacing={1}
        alignItems="center"
      >

        {/* ========================================================= */}
        {/* BUSCADOR */}
        {/* ========================================================= */}

        <Grid item xs={12} md={8}>

          <TextField
            fullWidth
            size="small"
            placeholder="Buscar cliente, documento o comprobante"
            value={searchText}
            onChange={(e) =>
              handleFilterSearch(e.target.value)
            }
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FindIcon />
                </InputAdornment>
              ),
              style: {
                color: 'white'
              }
            }}
          />

        </Grid>

        {/* ========================================================= */}
        {/* BOTON CERRAR */}
        {/* ========================================================= */}

        <Grid item xs={12} md={2}>

          <Button
            fullWidth
            variant="contained"
            color="error"
            onClick={() => onClose(null)}
          >
            CERRAR
          </Button>

        </Grid>

      </Grid>

      {/* ============================================================= */}
      {/* CLIENTE SELECCIONADO */}
      {/* ============================================================= */}

      {
        clienteSeleccionado && (

          <Paper
            elevation={2}
            sx={{
              mt: 2,
              p: 1,
              background: '#263238'
            }}
          >

            <Typography
              variant="body2"
              style={{ color: 'lightgreen' }}
            >
              CLIENTE SELECCIONADO:
            </Typography>

            <Typography
              variant="body1"
              style={{ color: 'white' }}
            >
              {
                selectedRows[0]?.documento_id
              }
              {' - '}
              {
                selectedRows[0]?.razon_social
              }
            </Typography>

          </Paper>

        )
      }

      {/* ============================================================= */}
      {/* TABLA */}
      {/* ============================================================= */}

      <div style={{ marginTop: '15px' }}>

        <Datatable

          title={`Pedidos Pendientes - ${periodo_trabajo}`}

          theme="solarized"

          columns={columnas}

          data={filteredData}

          pagination

          paginationPerPage={10}

          selectableRows

          selectableRowsComponent={Checkbox}

          onSelectedRowsChange={handleSelectedRowsChange}

          contextActions={contextActions}

          sortIcon={<ArrowDownward />}

          customStyles={tablaStyles}

          highlightOnHover

          pointerOnHover

          dense

        />

      </div>

      {/* ============================================================= */}
      {/* RESUMEN */}
      {/* ============================================================= */}

      <div
        style={{
          marginTop: '10px',
          color: 'white'
        }}
      >

        <Typography variant="body2">

          Pedidos seleccionados:
          {' '}
          <strong>
            {selectedRows.length}
          </strong>

        </Typography>

      </div>

    </div>
  );
};

export default AdminVentaFormFactPedido;