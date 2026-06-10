import React, { useEffect, useMemo, useState } from 'react';

import {Grid,TextField,Button,Typography,Checkbox,useMediaQuery,InputAdornment,Paper} from '@mui/material';

import Datatable from 'react-data-table-component';

import FindIcon from '@mui/icons-material/FindInPage';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import FactCheckIcon from '@mui/icons-material/FactCheck';

import { createTheme } from '@mui/material/styles';

import axios from 'axios';
import swal from 'sweetalert';
import RestoreIcon from '@mui/icons-material/Restore';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton'

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
| Retorna estructura compatible con:
|
| fve_ventaref_inserta_grupoproducto(JSONB)
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

const AdminVentaFormFactPedido = ({id_anfitrion, documento_id, periodo_trabajo, r_cod, r_serie, r_numero, r_fecemi, onClose}) => {

  const isSmallScreen = useMediaQuery('(max-width:600px)');
  const back_host = process.env.BACK_HOST || 'https://xpertcont-backend-js-production-50e6.up.railway.app';

  const [datos, setDatos] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [searchText, setSearchText] = useState('');

  /*
  |--------------------------------------------------------------------------
  | CLIENTE SELECCIONADO
  |--------------------------------------------------------------------------
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
  | CARGAR PEDIDOS
  |--------------------------------------------------------------------------
  */
  const cargarPedidosPendientes = async () => {
    try {

      const response = await axios.get(`${back_host}/ad_ventaspendientes/${periodo_trabajo}/${id_anfitrion}`);
      console.log(`${back_host}/ad_ventaspendientes/${periodo_trabajo}/${id_anfitrion}`);
      /*
      |--------------------------------------------------------------------------
      | RESPUESTA API
      |--------------------------------------------------------------------------
      */
      const apiData = response.data.data || [];

      /*
      |--------------------------------------------------------------------------
      | ID INTERNO TABLA
      |--------------------------------------------------------------------------
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

        item.r_razon_social
          ?.toLowerCase()
          .includes(value.toLowerCase())

        ||

        item.r_documento_id
          ?.toLowerCase()
          .includes(value.toLowerCase())

        ||

        comprobante
          .toLowerCase()
          .includes(value.toLowerCase())

      );
    });

    setFilteredData(filtered);
  };

  /*
  |--------------------------------------------------------------------------
  | VALIDACION SELECCION
  |--------------------------------------------------------------------------
  |
  | SOLO CLIENTES DEL MISMO DOCUMENTO
  |
  |--------------------------------------------------------------------------
  */
  const handleSelectedRowsChange = ({selectedRows}) => {
    /*
    |--------------------------------------------------------------------------
    | LIMPIAR
    |--------------------------------------------------------------------------
    */
    if (selectedRows.length === 0) {
      setSelectedRows([]);
      setClienteSeleccionado(null);
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | CLIENTE BASE
    |--------------------------------------------------------------------------
    */
    const clienteActual = selectedRows[0].documento_id;

    /*
    |--------------------------------------------------------------------------
    | VALIDAR MISMO CLIENTE
    |--------------------------------------------------------------------------
    */
    const clienteValido =
      selectedRows.every(
        row =>
          row.documento_id === clienteActual
      );

    /*
    |--------------------------------------------------------------------------
    | INVALIDO
    |--------------------------------------------------------------------------
    */

    if (!clienteValido) {

      swal({
        text:
          'Solo puede seleccionar pedidos del mismo cliente',
        icon: 'warning',
        timer: 2000
      });

      const filasValidas =
        selectedRows.filter(
          row =>
            row.r_documento_id === clienteSeleccionado
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
  | Retorna estructura JSON compatible con:
  |
  | fve_ventaref_inserta_grupoproducto(JSONB)
  |
  |--------------------------------------------------------------------------
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
      | PAYLOAD FINAL
      |--------------------------------------------------------------------------
      */
      const payload = {
        // CABECERA
        periodo: periodo_trabajo,
        id_usuario: id_anfitrion,
        documento_id: documento_id,
        //estos r_cod,r_serie,r_numero (NP en proceso, no es factura todavia)
        r_cod: r_cod,
        r_serie: r_serie,
        r_numero: r_numero,
        r_fecemi: r_fecemi,

        // REFERENCIAS
        referencias:
          selectedRows.map(item => ({
            nv_cod: item.r_cod,
            nv_serie: item.r_serie,
            nv_num: item.r_numero
          }))
      };

      /*
      |--------------------------------------------------------------------------
      | RETORNAR AL FORM PADRE
      |--------------------------------------------------------------------------
      */

      onClose(payload);

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
        color="primary"
        onClick={procesarFacturacion}
      >
        AGRUPAR
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
      selector: row => `${row.r_cod}-${row.r_serie}-${row.r_numero}`,
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
      selector: row => row.r_documento_id,
      sortable: true,
      width: '140px'
    },
    {
      name: 'Cliente',
      selector: row => row.r_razon_social,
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

  const generarPendientesPeriodoAnterior = async () => {
    try {
      //setCargando(true);
      const response = await axios.post(
        `${back_host}/ad_ventainsrefgrupo/generapendientes`,
        {
          id_usuario: id_anfitrion,
          documento_id: documento_id,
          periodo: periodo_trabajo
        }
      );
  
      if (response.data.success) {
  
        alert(
          response.data.message,
          { variant: 'success' }
        );
  
        // refrescar grid
        cargarPedidosPendientes();
      }
  
    } catch (error) {
      alert(
        error?.response?.data?.message ||
        'Error al generar pendientes',
        { variant: 'error' }
      );
    } finally {
      //setCargando(false);
    }
  };

  const retrocederPendientesPeriodoAnterior = async () => {
    try {
      //setCargando(true);
      const response = await axios.post(
        `${back_host}/ad_ventainsrefgrupo/retrocedependientes`,
        {
          id_usuario: id_anfitrion,
          documento_id: documento_id,
          periodo: periodo_trabajo
        }
      );
  
      if (response.data.success) {
  
        alert(
          response.data.message,
          { variant: 'success' }
        );
  
        // refrescar grid
        cargarPedidosPendientes();
      }
  
    } catch (error) {
      alert(
        error?.response?.data?.message ||
        'Error al retroceder pendientes',
        { variant: 'error' }
      );
    } finally {
      //setCargando(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (

    <div>

      {/* ========================================================== */}
      {/* CABECERA */}
      {/* ========================================================== */}

      <Grid
        container
        spacing={1}
        alignItems="center"
      >
        <Grid item xs={12} md={0.5}>
          <Tooltip title="Recuperar pendientes - Período Anterior" arrow>
            <IconButton
              color="warning"
              sx={{ width: 40, height: 40 }}
              onClick={generarPendientesPeriodoAnterior}
            >
              <RestoreIcon sx={{ fontSize: 40 }} />
            </IconButton>
          </Tooltip>
        </Grid>

        <Grid item xs={12} md={0.5}>
          <Tooltip title="Retroceder pendientes - Período Anterior" arrow>
            <IconButton
              color="error"
              sx={{ width: 40, height: 40 }}
              onClick={retrocederPendientesPeriodoAnterior}
            >
              <RestoreIcon sx={{ fontSize: 40 }} />
            </IconButton>
          </Tooltip>
        </Grid>

        {/* ====================================================== */}
        {/* BUSCADOR */}
        {/* ====================================================== */}
        <Grid item xs={12} md={10}>
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

        {/* ====================================================== */}
        {/* BOTON CERRAR */}
        {/* ====================================================== */}
        <Grid item xs={12} md={1}>
          <Button
            fullWidth
            variant="contained"
            color="inherit"
            onClick={() => onClose(null)}
          >
            CERRAR
          </Button>
        </Grid>

      </Grid>

      {/* ========================================================== */}
      {/* CLIENTE SELECCIONADO */}
      {/* ========================================================== */}

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

      {/* ========================================================== */}
      {/* TABLA */}
      {/* ========================================================== */}

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
          responsive
        />

      </div>

      {/* ========================================================== */}
      {/* RESUMEN */}
      {/* ========================================================== */}

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