import React from 'react';
import { useEffect, useState, useMemo, useCallback } from "react"
import { Button } from "@mui/material";
import { useNavigate,useParams } from "react-router-dom";
import FindIcon from '@mui/icons-material/FindInPage';
import Add from '@mui/icons-material/Add';

import IconButton from '@mui/material/IconButton';
import Datatable, {createTheme} from 'react-data-table-component';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import '../App.css';
import 'styled-components';

import { useAuth0 } from '@auth0/auth0-react'; //new para cargar permisos luego de verificar registro en bd
import ThumbUpOffAlt from '@mui/icons-material/ThumbUpOffAlt';
import ClearIcon from '@mui/icons-material/Lock';
import UpdateIcon from '@mui/icons-material/Update';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import CloseIcon from '@mui/icons-material/Close';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';

export default function ContabilidadList() {
  const {user, isAuthenticated } = useAuth0();
  //const back_host = process.env.BACK_HOST || "http://localhost:4000";
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
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
      //background: '#cb4b16',
      background: '#1e272e',
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

  //experimento

  const [selectedRows, setSelectedRows] = useState([]);
  //const [toggleCleared, setToggleCleared] = useState(false);
	//const [data, setData] = useState(tableDataItems);
  const [registrosdet,setRegistrosdet] = useState([]);
  const [tabladet,setTabladet] = useState([]);  //Copia de los registros: Para tratamiento de filtrado

  const handleRowSelected = useCallback(state => {
		setSelectedRows(state.selectedRows);
	}, []);
  
  const contextActions = useMemo(() => {
    //console.log("asaaa");

    const handleUpdate = () => {
			var strSeleccionado;
      strSeleccionado = selectedRows.map(r => r.documento_id);
			navigate(`/contabilidad/${strSeleccionado}/edit`);
		};

		return (
      <>
			<Button key="modificar" onClick={handleUpdate} >
        MODIFICAR
      <UpdateIcon/>
			</Button>

      </>
		);
	}, [registrosdet, selectedRows]);

  const actions = (
    	<IconButton color="primary" 
        onClick = {()=> {
                      navigate(`/contabilidad/new`);
                  }
                }
      >
    		<Add />
    	</IconButton>
  );

  //////////////////////////////////////////////////////////
  //const [registrosdet,setRegistrosdet] = useState([]);
  //////////////////////////////////////////////////////////
  const cargaRegistro = async () => {
    var response;
    console.log(`${back_host}/contabilidad/${params.id_usuario}`);
    response = await fetch(`${back_host}/contabilidad/${params.id_usuario}`);
    const data = await response.json();
    setRegistrosdet(data);
    setTabladet(data); //Copia para tratamiento de filtrado
  }
  //////////////////////////////////////
  const [copiedRowId, setCopiedRowId] = useState(null);
  const columnas = [
    {
      name: '',
      width: '40px',
      cell: (row) => (
          <DriveFileRenameOutlineIcon
            onClick={() => handleCopyClick(row.documento_id)}
            style={{
              cursor: 'pointer',
              color: copiedRowId === row.documento_id ? 'green' : 'skyblue',
              transition: 'color 0.3s ease',
            }}
          />
      ),
      allowOverflow: true,
      button: true,
    },
    { name:'RUC', 
      selector:row => row.documento_id,
      sortable: true,
      width: '110px'
      //key:true
    },
    { name:'RAZON SOCIAL', 
      selector:row => row.razon_social,
      width: '250px',
      sortable: true
    },
    {
      name: 'ACTIVO',
      selector: 'activo',
      width: '70px',
      cell: (row) => {
        return row.activo ? <ThumbUpOffAlt style={{ color: 'skyblue' }} /> : <ClearIcon style={{ color: 'orange' }} />;
      },
    },    
    {
      name: 'PLAN',
      selector: 'cuentas',
      width: '70px',
      cell: (row) => {
        return row.cuentas!=='0'
         ? <PlaylistAddCheckIcon 
            onClick={() => handleEditarPlanClick(row.documento_id)}
            style={{ cursor: 'pointer', 
                     color: 'skyblue' }} /> : 
            <CloseIcon 
            onClick={() => handleEditarPlanClick(row.documento_id)}
            style={{ cursor: 'pointer',
                     color: 'orange' }} />;
      },
    },    

  ];
  const handleCopyClick = (documento_id) => {
    // Aquí puedes agregar la lógica para copiar el contenido
    // Por ejemplo, puedes usar el portapapeles o cualquier otra forma de copiar
    console.log(documento_id);
    if (copiedRowId === documento_id) {
      setCopiedRowId(null);
    } else {
      setCopiedRowId(documento_id);
    }
    navigate(`/contabilidad/${user.email}/${documento_id}/edit`);
  };
  const handleEditarPlanClick = (documento_id) => {
    // Aquí puedes agregar la lógica para copiar el contenido
    // Por ejemplo, puedes usar el portapapeles o cualquier otra forma de copiar
    //console.log(documento_id);
    if (copiedRowId === documento_id) {
      setCopiedRowId(null);
    } else {
      setCopiedRowId(documento_id);
    }
    navigate(`/cuentas/${user.email}/${documento_id}/edit`); //CuentaList.js
  };

  
  const navigate = useNavigate();
  //Para recibir parametros desde afuera
  const params = useParams();

  const actualizaValorFiltro = e => {
    //setValorBusqueda(e.target.value);
    filtrar(e.target.value);
  }
  const filtrar=(strBusca)=>{
    var resultadosBusqueda = [];
    resultadosBusqueda = tabladet.filter((elemento) => {
      if (elemento.nombre.toString().toLowerCase().includes(strBusca.toLowerCase())
        ){
            return elemento;
        }
    });
    setRegistrosdet(resultadosBusqueda);
}

const handleModificar = (row) => {
  // Aquí puedes agregar la lógica para modificar la fila seleccionada
  console.log(`Modificar fila ${row.numero}`);
};

//////////////////////////////////////////////////////////
  useEffect( ()=> {
      cargaRegistro();

      //NEW codigo para autenticacion y permisos de BD
      if (isAuthenticated && user && user.email) {
        // cargar permisos de sistema
        //cargaPermisosMenuComando('05'); //Alimentamos el useState permisosComando
        console.log('dale campeon');
      }
      
  },[isAuthenticated, user])
  //////////////////////////////////////////////////////////

 return (
  <>
    <div> 
      <TextField fullWidth variant="outlined" color="success" size="small"
                                   label="FILTRAR"
                                   sx={{display:'block',
                                        margin:'.5rem 0'}}
                                   name="busqueda"
                                   placeholder='Razon social'
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
      title="Panel 01: Contabilidades Michi aprende"
      theme="solarized"
      columns={columnas}
      data={registrosdet}
      //selectableRows="single"
      contextActions={contextActions}
      actions={actions}
			onSelectedRowsChange={handleRowSelected}
			//clearSelectedRows={toggleCleared}
      //pagination
      selectableRowsComponent={Checkbox} // Pass the function only
      sortIcon={<ArrowDownward />}
      dense={true}
      highlightOnHover //resalta la fila
      //pointerOnHover //coloca simbolo dedito como si fuera hacer click
    >
    </Datatable>

  </>
  );
}