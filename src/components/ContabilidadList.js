import React from 'react';
import { useEffect, useState, useMemo, useCallback } from "react"
import { Button } from "@mui/material";
import { useNavigate,useParams } from "react-router-dom";
import FindIcon from '@mui/icons-material/FindInPage';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
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
import DeleteIcon from '@mui/icons-material/Delete';
import swal from 'sweetalert';

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
  const [toggleCleared, setToggleCleared] = useState(false);
  const [updateTrigger, setUpdateTrigger] = useState({});

	//const [data, setData] = useState(tableDataItems);
  const [registrosdet,setRegistrosdet] = useState([]);
  const [tabladet,setTabladet] = useState([]);  //Copia de los registros: Para tratamiento de filtrado
  const [permisosComando, setPermisosComando] = useState([]); //MenuComandos  
  const [pConta0601, setPConta0601] = useState(false); //Nuevo (Casi libre)
  const [pConta0602, setPConta0602] = useState(false); //Modificar (Restringido)
  const [pConta0603, setPConta0603] = useState(false); //ELiminar (Restringido)

  const cargaPermisosMenuComando = async(idMenu)=>{
    if (params.id_anfitrion === params.id_invitado){
      setPConta0601(true); //nuevo
      setPConta0602(true); //modificar
      setPConta0603(true); //eliminar
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
          tienePermiso = permisosData.some(permiso => permiso.id_comando === '06-01'); //Nuevo
          if (tienePermiso) {
            setPConta0601(true);
          }

          tienePermiso = permisosData.some(permiso => permiso.id_comando === '06-02'); //Modificar
          if (tienePermiso) {
            setPConta0602(true);
          }else {setPConta0602(false);}

          tienePermiso = permisosData.some(permiso => permiso.id_comando === '06-03'); //Eliminar
          if (tienePermiso) {
            setPConta0603(true);
          }else {setPConta0603(false);}

          ////////////////////////////////////////////////
          //setUpdateTrigger(Math.random());//experimento
        })
        .catch(error => {
          console.log('Error al obtener los permisos:', error);
        });
    }
  }
  
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
                      navigate(`/contabilidad/${params.id_anfitrion}/new`);
                      //console.log(params.id_anfitrion);
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
    console.log(`${back_host}/contabilidad/${params.id_anfitrion}`);
    response = await fetch(`${back_host}/contabilidad/${params.id_anfitrion}`);
    const data = await response.json();
    setRegistrosdet(data);
    setTabladet(data); //Copia para tratamiento de filtrado
  }
  //////////////////////////////////////
  const handleDelete = (documento_id) => {
    console.log(documento_id);
    
    confirmaEliminacion(params.id_anfitrion,documento_id);
  };
  const confirmaEliminacion = async(sAnfitrion,sDocumentoId)=>{
    await swal({
      title:"Eliminar Contabilidad",
      text:"Seguro ?",
      icon:"warning",
      buttons:["No","Si"]
    }).then(respuesta=>{
        if (respuesta){
          //console.log(cod,serie,num,elem,item);
          eliminarRegistroSeleccionado(sAnfitrion,sDocumentoId);
          setToggleCleared(!toggleCleared);
          setRegistrosdet(registrosdet.filter(
                          registrosdet => registrosdet.documento_id !== sDocumentoId
                          ));
          setTimeout(() => { // Agrega una función para que se ejecute después del tiempo de espera
              setUpdateTrigger(Math.random());//experimento
          }, 200);
                        
          swal({
            text:"Contabilidad se ha eliminado con exito",
            icon:"success",
            timer:"2000"
          });
      }
    })
  }
  const eliminarRegistroSeleccionado = async (sAnfitrion,sDocumentoId) => {
      console.log(`${back_host}/contabilidad/${sAnfitrion}/${sDocumentoId}`);
      await fetch(`${back_host}/contabilidad/${sAnfitrion}/${sDocumentoId}`, {
        method:"DELETE"
      });
  }

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
    {
      name: '',
      width: '40px',
      cell: (row) => (
        (pConta0603) ? (
          <DeleteIcon
            onClick={() => handleDelete(row.documento_id)}
            style={{
              cursor: 'pointer',
              color: 'orange',
              transition: 'color 0.3s ease',
            }}
          />
        ) : null
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
    navigate(`/contabilidad/${params.id_anfitrion}/${documento_id}/edit`);
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
        // cargar permisos de sistema Contabilidad
        cargaPermisosMenuComando('06'); //Alimentamos el useState permisosComando
        console.log('falta verificar permisos');
      }
      
  },[isAuthenticated, user, updateTrigger])
  //////////////////////////////////////////////////////////

 return (
  <>
    <div> 
      <TextField  variant="outlined" color="success" size="small"
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
      title="Panel 01: Contabilidades"
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