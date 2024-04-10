import React from 'react';
import { useEffect, useState } from "react"
import { Modal,Button,Grid,Card,CardContent, useMediaQuery, Typography, Select, MenuItem} from "@mui/material";
import { useParams } from "react-router-dom";
//import DeleteIcon from '@mui/icons-material/Delete';
//import UpdateIcon from '@mui/icons-material/UpdateSharp';
import InputAdornment from '@mui/material/InputAdornment';
import FindIcon from '@mui/icons-material/FindInPage';
import Tooltip from '@mui/material/Tooltip';
import axios from 'axios';

import swal from 'sweetalert';
import Datatable, {createTheme} from 'react-data-table-component';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import '../App.css';
import 'styled-components';

import { useAuth0 } from '@auth0/auth0-react'; //new para cargar permisos luego de verificar registro en bd
import Switch from '@mui/material/Switch';

export default function SeguridadContabilidad() {
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //verificamos si es pantalla pequeña y arreglamos el grid de fechas
  const isSmallScreen = useMediaQuery('(max-width: 600px)');

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
  const [updateTrigger, setUpdateTrigger] = useState({});

	//const [data, setData] = useState(tableDataItems);
  const [registrosdet,setRegistrosdet] = useState([]);
  const [switchValues, setSwitchValues] = useState([]);//Copia para clickeo

  const {user} = useAuth0();
  const [regdet,setRegdet] = useState({ //Para envio minimo en Post
    id_usuario:'',
    id_invitado:'',
    documento_id:''
  })
  //////////////////////////////////////////////////////////
  const cargaRegistro = async () => {
    let response;
    console.log(`regdet.id_usuario ${back_host}/seguridad/${params.id_anfitrion}/${params.id_invitado}/vista`);
    response = await fetch(`${back_host}/seguridad/contabilidades/${params.id_anfitrion}/${params.id_invitado}/vista`);
    const data = await response.json();
    setRegistrosdet(data);
    console.log(data);
  }
  //////////////////////////////////////
  const columnas = [
    {
      name: "",
      cell: (row, rowIndex) => (
        <Switch
          checked={switchValues[rowIndex] || false} // Utilizamos el valor correspondiente al índice en el array
          onChange={() => handleModEjecucion(params.id_invitado, row.documento_id, rowIndex, row.id_permiso)}
          color="primary"
          inputProps={{ 'aria-label': 'toggle switch' }}
        />
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
    { name:'NOMBRE', 
      selector:row => row.nombre,
      //width: '350px',
      sortable: true
    },
    { name:'PERMISO', 
      selector:row => row.id_permiso,
      //width: '350px',
      sortable: true
    },
  ];

  const handleModEjecucion = async(id_invitado,documento_id,index,id_permiso) => {
    console.log("Modificando: ", id_invitado,documento_id,index);
    
    //Codigo para actualizar array local
    const updatedValues = [...switchValues];
    updatedValues[index] = !updatedValues[index];
    setSwitchValues(updatedValues);
    //Codigo para actualizar base datos api(POST)

    ejecutaRegistroSeleccionado(id_invitado,documento_id,id_permiso);

    /*setTimeout(() => { // Agrega una función para que se ejecute después del tiempo de espera
        setUpdateTrigger(Math.random());//actualiza la vista actual
    }, 200);*/

  };

  const ejecutaRegistroSeleccionado = async (id_invitado,documento_id,id_permiso) => {
    //Insertar ocargadet identico, pero con tipo = 'E'
    console.log(`Modificando permiso contabilidad: ${id_invitado} ${documento_id}`);
    //armar un useState para el body
    regdet.id_usuario =  params.id_anfitrion; //yeah ;)
    regdet.id_invitado =  id_invitado;
    regdet.documento_id = documento_id;
    console.log(regdet);
    
    console.log("permiso para: ",documento_id);
    if (id_permiso ===null) {
      console.log(`${back_host}/seguridad/contabilidad`);
      await fetch(`${back_host}/seguridad/contabilidad`, {
        method: "POST",
        body: JSON.stringify(regdet),
        headers: {"Content-Type":"application/json"}
      });
    }else{
      console.log("API DELETE: ",`${back_host}/seguridad/${params.id_anfitrion}/${id_invitado}/${documento_id}`);
      await fetch(`${back_host}/seguridad/contabilidad/${params.id_anfitrion}/${id_invitado}/${documento_id}`, {
        method: "DELETE",
        headers: {"Content-Type":"application/json"}
      });
    }
  }

  
  //const navigate = useNavigate();
  //Para recibir parametros desde afuera
  const params = useParams();

  //////////////////////////////////////////////////////////
  useEffect( ()=> {
      
      cargaRegistro();
      
      //const initialValues = registrosdet.map((registro) => registro.id_permiso);
      //setSwitchValues(initialValues);

      console.log("useEffect updateTrigger");
      console.log(regdet.id_usuario);
  },[updateTrigger])

  useEffect(() => {
    console.log("useEffect registrosdet");
    if (registrosdet && registrosdet.length > 0) {
      const initialValues = registrosdet.map((registro) => registro.id_permiso);
      setSwitchValues(initialValues);
    }
  }, [registrosdet]);  

  //////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////

 return (
  <>

  <Grid container
        direction={isSmallScreen ? 'column' : 'row'}
        //alignItems={isSmallScreen ? 'center' : 'center'}
        justifyContent={isSmallScreen ? 'center' : 'center'}
  >

  </Grid>

    <Datatable
      title={params.id_invitado}
      theme="solarized"
      columns={columnas}
      data={registrosdet}
      //contextActions={contextActions}
      //actions={actions}
      //onSelectedRowsChange={handleRowSelected}
      //clearSelectedRows={toggleCleared}
      dense={true}

      selectableRowsComponent={Checkbox} // Pass the function only
      sortIcon={<ArrowDownward />}  
    >
    </Datatable>

  </>
  );
}
