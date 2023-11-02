import React from 'react';
import { useEffect, useState, useMemo, useCallback } from "react"
import { Button} from "@mui/material";
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

import { useAuth0 } from '@auth0/auth0-react'; //new para cargar permisos luego de verificar registro en bd

export default function CorrentistaList() {
  //const back_host = process.env.BACK_HOST || "http://localhost:4000";
  const back_host = process.env.BACK_HOST || "https://alsa-backend-js-production.up.railway.app";  
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
  const [updateTrigger, setUpdateTrigger] = useState({});

  const [selectedRows, setSelectedRows] = useState([]);
  const [toggleCleared, setToggleCleared] = useState(false);
	//const [data, setData] = useState(tableDataItems);
  const [registrosdet,setRegistrosdet] = useState([]);
  const [tabladet,setTabladet] = useState([]);  //Copia de los registros: Para tratamiento de filtrado

  //Permisos Venta Nivel 01 - Lista Correntistas
  const [permisosComando, setPermisosComando] = useState([]); //MenuComandos
  const {user, isAuthenticated } = useAuth0();
  const [pCorrentista0501, setPCorrentista0501] = useState(false); //Nuevo (Casi libre)
  const [pCorrentista0502, setPCorrentista0502] = useState(false); //Modificar (Restringido)
  const [pCorrentista0503, setPCorrentista0503] = useState(false); //Eliminar (Casi Nunca solo el administrador)

  const handleRowSelected = useCallback(state => {
		setSelectedRows(state.selectedRows);
	}, []);
  
  const contextActions = useMemo(() => {
    //console.log("asaaa");
		const handleDelete = () => {
			var strSeleccionado;
      strSeleccionado = selectedRows.map(r => r.documento_id);
			confirmaEliminacion(strSeleccionado);
		};

    const handleUpdate = () => {
			var strSeleccionado;
      strSeleccionado = selectedRows.map(r => r.documento_id);
			navigate(`/correntista/${strSeleccionado}/edit`);
		};

		return (
      <>

      { pCorrentista0503 ? 
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

      { pCorrentista0502 ? 
        (      
			<Button key="modificar" onClick={handleUpdate} >
        MODIFICAR
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

  let actions;
  if (pCorrentista0501) {
    actions = (
    	<IconButton color="primary" 
        onClick = {()=> {
                      navigate(`/correntista/new`);
                  }
                }
      >
    		<Add />
    	</IconButton>
      );
  } else {
    actions = null; // Opcionalmente, puedes asignar null u otro valor cuando la condición no se cumple
  }

  //////////////////////////////////////////////////////////
  //const [registrosdet,setRegistrosdet] = useState([]);
  //////////////////////////////////////////////////////////
  const cargaRegistro = async () => {
    const response = await fetch(`${back_host}/correntista`);
    const data = await response.json();
    setRegistrosdet(data);
    setTabladet(data); //Copia para tratamiento de filtrado
  }
  //////////////////////////////////////
  const columnas = [
    { name:'RUC/DNI', 
      selector:row => row.documento_id,
      sortable: true,
      width: '110px'
      //key:true
    },
    { name:'Razon Social', 
      selector:row => row.razon_social,
      //width: '350px',
      sortable: true
    },
    { name:'Codigo Interno', 
      selector:row => row.codigo,
      width: '150px',
      sortable: true
    },
    { name:'Email', 
      selector:row => row.email,
      sortable: true
    },
    { name:'Telefono', 
      selector:row => row.telefono,
      width: '100px',
      sortable: true
    },
    { name:'Contacto', 
      selector:row => row.contacto,
      width: '100px',
      sortable: true
    }
  ];
  
  const confirmaEliminacion = (id_registro)=>{
    swal({
      title:"Eliminar Correntista",
      text:"Seguro ?",
      icon:"warning",
      buttons:["No","Si"]
    }).then(respuesta=>{
        if (respuesta){
          eliminarRegistroDet(id_registro);
          setToggleCleared(!toggleCleared);
          setRegistrosdet(registrosdet.filter(registrosdet => registrosdet.documento_id !== id_registro));
          setUpdateTrigger(Math.random());//experimento
  
          swal({
            text:"Correnstita se ha eliminado con exito",
            icon:"success",
            timer:"2000"
          });
      }
    })
  }
 
  const navigate = useNavigate();
  //Para recibir parametros desde afuera
  const params = useParams();

  const eliminarRegistroDet = async (id_registro) => {
    await fetch(`${back_host}/correntista/${id_registro}`, {
      method:"DELETE"
    });
    //setRegistrosdet(registrosdet.filter(registrosdet => registrosdet.documento_id !== id_registro));
    //console.log(data);
  }
  const actualizaValorFiltro = e => {
    //setValorBusqueda(e.target.value);
    filtrar(e.target.value);
  }
  const filtrar=(strBusca)=>{
    var resultadosBusqueda = [];
    resultadosBusqueda = tabladet.filter((elemento) => {
      if (elemento.razon_social.toString().toLowerCase().includes(strBusca.toLowerCase())
       || elemento.documento_id.toString().toLowerCase().includes(strBusca.toLowerCase())
       || elemento.codigo.toString().toLowerCase().includes(strBusca.toLowerCase())
       || elemento.email.toString().toLowerCase().includes(strBusca.toLowerCase())
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
    // Verifica si existe el permiso de acceso 'Correntistas'
    tienePermiso = permisosData.some(permiso => permiso.id_comando === '05-01'); //Nuevo
    if (tienePermiso) {
      setPCorrentista0501(true);
    }
    tienePermiso = permisosData.some(permiso => permiso.id_comando === '05-02'); //Modificar
    if (tienePermiso) {
      setPCorrentista0502(true);
    }
    tienePermiso = permisosData.some(permiso => permiso.id_comando === '05-03'); //Eliminar
    if (tienePermiso) {
      setPCorrentista0503(true);
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
        cargaPermisosMenuComando('05'); //Alimentamos el useState permisosComando
        //console.log(permisosComando);
      }
      
  },[updateTrigger, isAuthenticated, user])
  //////////////////////////////////////////////////////////

 return (
  <>
    <div> 
      <TextField fullWidth variant="outlined" color="success" size="small"
                                   label="FILTRAR"
                                   sx={{display:'block',
                                        margin:'.5rem 0'}}
                                   name="busqueda"
                                   placeholder='Cliente   Dni   Ruc  Codigo  Email'
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
      title="Gestion de Correntistas"
      theme="solarized"
      columns={columnas}
      data={registrosdet}
      selectableRows
      contextActions={contextActions}
      actions={actions}
			onSelectedRowsChange={handleRowSelected}
			clearSelectedRows={toggleCleared}
      //pagination

      selectableRowsComponent={Checkbox} // Pass the function only
      sortIcon={<ArrowDownward />}  
      dense true
    >
    </Datatable>

  </>
  );
}
