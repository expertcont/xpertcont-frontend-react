import React from 'react';
import { useEffect, useState, useMemo, useCallback } from "react"
import { Box,Typography,InputBase} from "@mui/material";
import { useNavigate,useParams } from "react-router-dom";
import { Search } from 'lucide-react';
import IconButton from '@mui/material/IconButton';
import ReplyIcon from '@mui/icons-material/Reply';

import Datatable from 'react-data-table-component';
import Checkbox from '@mui/material/Checkbox';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import '../../../../App.css';
import 'styled-components';
//import axios from 'axios';

//import { utils, writeFile } from 'xlsx';
import Tooltip from '@mui/material/Tooltip';

import BotonExcelGeneral from '../../../BotonExcelGeneral';

//import { AdminVentasDetColumnas } from './AdminColumnas';
import { AdminKardexColumnas } from '../../AdminColumnas';
import { ensureAdminStockTableTheme } from '../common/adminStockTableTheme';
import palette from '../../../../theme/palette';

const contentRadius = 1;

const panelSx = {
  backgroundColor: 'transparent',
  border: '0',
  borderRadius: contentRadius,
  p: 0,
};

const listContentSx = {
  width: '100%',
  maxWidth: '100%',
  boxSizing: 'border-box',
  minWidth: 0,
  ml: 0,
  mr: 0,
  p: 0,
  display: 'grid',
  gap: 1.15,
};

const toolbarSurfaceSx = {
  backgroundColor: '#1c252c',
  borderRadius: contentRadius,
  px: { xs: 1, md: 1.5 },
  py: { xs: 0.9, md: 1.25 },
};

const searchSx = {
  flex: '1 1 280px',
  minWidth: { xs: '100%', sm: 280 },
  height: 42,
  px: 1.15,
  display: 'flex',
  alignItems: 'center',
  gap: 0.85,
  color: palette.text,
  backgroundColor: palette.bg,
  border: '1px solid rgba(139,154,165,0.14)',
  borderRadius: contentRadius,
  '&:focus-within': {
    borderColor: 'rgba(139,154,165,0.32)',
  },
};

const inputSx = {
  color: palette.text,
  fontSize: '13px',
  width: '100%',
  '& input': {
    color: palette.text,
    fontSize: '13px',
  },
  '& input::placeholder': {
    color: palette.muted,
    opacity: 1,
  },
};

const iconRailSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.65,
};

const iconButtonSx = {
  width: 40,
  height: 40,
  borderRadius: contentRadius,
  backgroundColor: 'rgba(139,154,165,0.10)',
  color: palette.muted,
  transition: 'all 0.18s ease',
  '&:hover': {
    backgroundColor: 'rgba(42,161,152,0.18)',
    color: palette.text,
  },
};

const backIconButtonSx = {
  ...iconButtonSx,
  color: '#a8c7ff',
  '&:hover': {
    backgroundColor: 'rgba(96,165,250,0.18)',
    color: '#d7e7ff',
  },
};

const listCardBg = '#1c252c';

const dataTableStyles = {
  table: { style: { backgroundColor: listCardBg } },
  tableWrapper: { style: { backgroundColor: listCardBg } },
  responsiveWrapper: { style: { backgroundColor: listCardBg } },
  headRow: {
    style: {
      backgroundColor: listCardBg,
      color: palette.muted,
      borderBottom: `1px solid ${palette.borderSoft}`,
      minHeight: '38px',
    },
  },
  headCells: {
    style: {
      color: palette.muted,
      fontSize: '11px',
      fontWeight: 800,
      textTransform: 'uppercase',
    },
  },
  rows: {
    style: {
      backgroundColor: listCardBg,
      color: palette.text,
      borderBottom: `1px solid ${palette.borderSoft}`,
      minHeight: '42px',
    },
    highlightOnHoverStyle: {
      backgroundColor: palette.surfaceAlt,
      color: palette.text,
      borderBottomColor: palette.border,
    },
  },
  cells: {
    style: {
      color: palette.text,
      fontSize: '12.5px',
      minWidth: 0,
    },
  },
  pagination: {
    style: {
      backgroundColor: listCardBg,
      color: palette.muted,
      borderTop: `1px solid ${palette.borderSoft}`,
    },
  },
};


export default function AdminStockRepKardex() {
  //Control de useffect en retroceso de formularios
  //verificamos si es pantalla pequeña y arreglamos el grid de fechas
  //Seccion Dialog
  const [isDialogOpen, setDialogOpen] = useState(false);

  ensureAdminStockTableTheme();

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
  <Box sx={listContentSx}>
    <Box
      sx={{
        ...panelSx,
        ...toolbarSurfaceSx,
        display: 'flex',
        alignItems: { xs: 'stretch', md: 'center' },
        justifyContent: 'space-between',
        gap: 1,
        flexDirection: { xs: 'column', md: 'row' },
      }}
    >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.92)', fontSize: '22px', fontWeight: 500, lineHeight: 1.2 }}>
              Kardex fisico
            </Typography>
            <Typography sx={{ color: palette.muted, fontSize: '12px', mt: 0.35 }}>
              {`${registrosdet.length} movimientos visibles - Dia ${params.dia === '*' ? 'Todos' : params.dia}`}
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(150px, 1fr))', md: 'repeat(4, minmax(110px, 150px))' },
              gap: 1,
              alignItems: 'center',
              width: { xs: '100%', md: 'auto' },
            }}
          >
            {[
              ['Periodo', params.periodo],
              ['RUC', params.documento_id],
              ['Producto', params.id_producto],
              ['Almacen', params.id_almacen],
            ].map(([label, value]) => (
              <Box
                key={label}
                sx={{
                  minWidth: 0,
                  px: 1,
                  py: 0.65,
                  height: 42,
                  display: 'grid',
                  alignContent: 'center',
                  backgroundColor: palette.chip,
                  border: `1px solid ${palette.border}`,
                  borderRadius: contentRadius,
                }}
              >
                <Typography sx={{ color: palette.muted, fontSize: '10px', fontWeight: 800, lineHeight: 1 }}>
                  {label}
                </Typography>
                <Typography sx={{ color: palette.text, fontSize: '12px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {value}
                </Typography>
              </Box>
            ))}
          </Box>
    </Box>

        <Box
          sx={{
            ...panelSx,
            ...toolbarSurfaceSx,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Box sx={searchSx}>
            <Search size={16} color={palette.muted} />
            <InputBase
            name="busqueda"
            placeholder="Filtrar: RUC, razon social, comprobante o descripcion"
            onChange={actualizaValorFiltro}
            sx={inputSx}
          />
          </Box>

          <Box sx={iconRailSx}>
            <Tooltip title='VOLVER'>
              <IconButton
                sx={backIconButtonSx}
                onClick={() => {
                  navigate(-1, { replace: true });
                }}
              >
                <ReplyIcon sx={{ fontSize: 22 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title='EXPORTAR XLS'>
                <BotonExcelGeneral
                  datos={registrosdet}
                  nombreArchivo="Kardex Fisico"
                  tituloReporte={`Kardex Fisico:  ${params.periodo}  ${params.documento_id}`}
                  columnasNumericas={['ingreso','egreso','precio_neto','porc_igv']}
                  columnasExcluidas={['cod','serie','numero']}
                />
            </Tooltip>
          </Box>
        </Box>

    <Box
      sx={{
        overflow: 'hidden',
        borderRadius: contentRadius,
        border: 0,
        backgroundColor: listCardBg,
        boxShadow: 'none',
        px: { xs: 0.25, md: 0.75 },
        py: { xs: 0.25, md: 0.75 },
        minWidth: 0,
        maxWidth: '100%',
        '& .rdt_TableWrapper': {
          maxWidth: '100%',
          overflowX: 'auto',
        },
        '& .rdt_Table': {
          minWidth: { xs: 960, md: '100%' },
        },
      }}
    >
      <Datatable
        theme="solarized"
        columns={columnas}
        data={registrosdet}
        customStyles={dataTableStyles}
        onSelectedRowsChange={handleRowSelected}
        clearSelectedRows={toggleCleared}
        selectableRowsComponent={Checkbox}
        sortIcon={<ArrowDownward />}
        dense={true}
        highlightOnHover
      />
    </Box>
  </Box>
  );
}
