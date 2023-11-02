import React from 'react';
import { useEffect, useState, useMemo, useCallback } from "react"
import { Modal,Button,Grid,Card,CardContent, useMediaQuery, Typography, Select, MenuItem} from "@mui/material";
import { useNavigate,useParams } from "react-router-dom";
import DeleteIcon from '@mui/icons-material/Delete';
import UpdateIcon from '@mui/icons-material/UpdateSharp';
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

export default function SeguridadList() {
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //Seccion Modal
  const [abierto,setAbierto] = useState(false);
  const [datosModal,setdatosModal] = useState({
    id_usuario2:'', //new 
    id_usuario:'' //email existente
  })
  
  const modalStyles={
    //position:'absolute',
    top:'50%',
    left:'15%',
    //background:'gray',
    border:'0px solid #000',
    padding:'0px 10px 24px',
    width:'100',
    minHeight: '50px'
    //transform:'translate(0%,0%)'
  }
  const abrirCerrarModal = ()=>{
    setAbierto(!abierto);
  }
  const actualizaDatosCorreoModal = e => {
    //actualizamos datos del modal, para pantallita
    setdatosModal({...datosModal, [e.target.name]: e.target.value});

    //actualizamos datos del formulario, para pantalla general
    //setocargaDet({...ocargaDet, [e.target.name+numGuia]: e.target.value});
  }
  const handleClone = async() => {
    
    console.log("clonado email");
    console.log(datosModal);
    await fetch(`${back_host}/seguridadclonar`, {
      method: "DELETE",
      body: JSON.stringify(datosModal),
      headers: {"Content-Type":"application/json"}
    });

    //setUpdateTrigger(Math.random());//experimento
  };

  const handleEliminaPermisos = async() => {
    await swal({
      title:"Eliminar Todos los Permisos de: " + regdet.id_usuario,
      text:"Seguro ?",
      icon:"warning",
      buttons:["No","Si"]
    }).then(respuesta=>{
        if (respuesta){

          EliminaPermisos();
      
          setTimeout(() => { // Agrega una función para que se ejecute después del tiempo de espera
              setUpdateTrigger(Math.random());//experimento
          }, 200);
                        
          //setUpdateTrigger(Math.random());//experimento
  
          swal({
            text:"Permisos Eliminados con exito",
            icon:"success",
            timer:"2000"
          });
      }
    })

  };

  const EliminaPermisos = async() => {
    console.log("eliminar todos los permisos email");
    console.log(regdet.id_usuario);
    await fetch(`${back_host}/seguridadeliminar/${regdet.id_usuario}`, {
      method: "DELETE"
    });
    //setUpdateTrigger(Math.random());//experimento
  };

  ///Body para Modal 
  const body=(
    <div>
      <Card sx={{mt:-8}}
            style={{background:'#1e272e',padding:'0rem'}}
      >
          <CardContent >
              <Typography color='white' fontSize={15} marginTop="0rem" >
                    CLONAR PERMISOS EMAIL
              </Typography>

            <div> 
              <TextField variant="outlined" color="warning"
                        autofocus
                        sx={{display:'block',
                              margin:'.5rem 0', color:'white'}}
                        name="id_usuario"
                        size='small'
                        label='ORIGEN'
                        value={datosModal.id_usuario}
                        onChange={actualizaDatosCorreoModal}
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
            <div> 
              <TextField variant="outlined" color="warning"
                        //autofocus
                        sx={{display:'block',
                              margin:'.5rem 0'}}
                        size='small'
                        name="id_usuario2"
                        value={datosModal.id_usuario2}
                        label='EMAIL DESTINO'
                        onChange={actualizaDatosCorreoModal}
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

            <div>
                <Button variant='contained'  color="primary"
                  onClick = { () => {
                    
                    handleClone();
                    setAbierto(false);
                    
                    //actualizar las variables, porque sino hay change, no pasaran
                    datosModal.id_usuario2 = ""; //resetear el nuevo email
                    }
                  }
                >Aceptar
                </Button>
                <Button variant='contained' color="warning"
                  onClick = { () => {
                    setAbierto(false);
                    }
                  }
                >Cancela
                </Button>
            </div>
          </CardContent>
      </Card>

    </div>
  )

  //Fin Seccion Modal
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////

  //verificamos si es pantalla pequeña y arreglamos el grid de fechas
  const isSmallScreen = useMediaQuery('(max-width: 600px)');

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
  const [switchValues, setSwitchValues] = useState([]);//Copia para clickeo

  const {user, isAuthenticated } = useAuth0();
  const [regdet,setRegdet] = useState({ //Para envio minimo en Post
    id_empresa:'1',
    id_usuario:'',
    id_menu:'',
    id_comando:''
  })
  //const [ocargaDet,setocargaDet] = useState({});
  const [usuario_select,setUsuarioSelect] = useState([]);

  const handleRowSelected = useCallback(state => {
		setSelectedRows(state.selectedRows);
	}, []);
  

  //////////////////////////////////////////////////////////
  //const [registrosdet,setRegistrosdet] = useState([]);
  //////////////////////////////////////////////////////////
  const cargaRegistro = async () => {
    let response;
    if (regdet.id_usuario ===null){
    response = await fetch(`${back_host}/seguridad/${user.email}/vista`);
    }else{
    response = await fetch(`${back_host}/seguridad/${regdet.id_usuario}/vista`);
    }
    const data = await response.json();
    setRegistrosdet(data);
  }
  //////////////////////////////////////
  const columnas = [
    { name:'CODIGO', 
      selector:row => row.id_comando,
      sortable: true,
      width: '110px'
      //key:true
    },
    {
      name: "",
      cell: (row, rowIndex) => (
        <Switch
          checked={switchValues[rowIndex] || false} // Utilizamos el valor correspondiente al índice en el array
          onChange={() => handleModEjecucion(regdet.id_usuario, row.id_comando, rowIndex, row.id_permiso)}
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
    { name:'DESCRIPCION', 
      selector:row => row.descripcion,
      width: '150px',
      sortable: true
    },
    { name:'PERMISO', 
      selector:row => row.id_permiso,
      //width: '350px',
      sortable: true
    },
  ];

  const handleModEjecucion = async(id_usuario,id_comando,index,id_permiso) => {
    console.log("Modificando: ", id_usuario,id_comando,index);
    
    //Codigo para actualizar array local
    const updatedValues = [...switchValues];
    updatedValues[index] = !updatedValues[index];
    setSwitchValues(updatedValues);
    //Codigo para actualizar base datos api(POST)

    ejecutaRegistroSeleccionado(id_usuario,id_comando,id_permiso);

    /*setTimeout(() => { // Agrega una función para que se ejecute después del tiempo de espera
        setUpdateTrigger(Math.random());//actualiza la vista actual
    }, 200);*/

  };

  const ejecutaRegistroSeleccionado = async (id_usuario,id_comando,id_permiso) => {
    //Insertar ocargadet identico, pero con tipo = 'E'
    console.log(`Modificando permiso orden: ${id_usuario} ${id_comando}`);
    //armar un useState para el body
    regdet.id_empresa =  "1";
    regdet.id_usuario =  id_usuario;
    regdet.id_menu = id_comando.substring(0,2);
    regdet.id_comando = id_comando;
    console.log(regdet);
    
    console.log("id_permiso: ",id_permiso);
    if (id_permiso ===null) {
      console.log(`${back_host}/seguridad`);
      await fetch(`${back_host}/seguridad`, {
        method: "POST",
        body: JSON.stringify(regdet),
        headers: {"Content-Type":"application/json"}
      });
    }else{
      console.log("API DELETE: ",`${back_host}/seguridad/${id_usuario}/${id_comando}`);
      await fetch(`${back_host}/seguridad/${id_usuario}/${id_comando}`, {
        method: "DELETE",
        headers: {"Content-Type":"application/json"}
      });
    }
  }

  const handleChange = e => {
    //setRegdet({...regdet, [e.target.name]: e.target.value});
    setRegdet(prevRegdet => ({ ...prevRegdet, [e.target.name]: e.target.value }));    
    setUpdateTrigger(Math.random());//experimento para actualizar el dom
  }

 
  const navigate = useNavigate();
  //Para recibir parametros desde afuera
  const params = useParams();

  const eliminarRegistroDet = async (id_registro) => {
    await fetch(`${back_host}/producto/${id_registro}`, {
      method:"DELETE"
    });
    //setRegistrosdet(registrosdet.filter(registrosdet => registrosdet.id_producto !== id_registro));
    //console.log(data);
  }

  //////////////////////////////////////////////////////////
  useEffect( ()=> {
      cargaRegistro();
      cargaUsuarioCombo();  
      //const initialValues = registrosdet.map((registro) => registro.id_permiso);
      //setSwitchValues(initialValues);

      console.log("hola fiera");
      console.log(regdet.id_usuario);
  },[updateTrigger])

  useEffect(() => {
    
    if (registrosdet && registrosdet.length > 0) {
      const initialValues = registrosdet.map((registro) => registro.id_permiso);
      setSwitchValues(initialValues);
    }
    //cargaRegistro();
    console.log("hola fiera 2do");
  }, [registrosdet]);  
  //////////////////////////////////////////////////////////
  const cargaUsuarioCombo = () =>{
    axios
    .get(`${back_host}/seguridademail`)
    .then((response) => {
        setUsuarioSelect(response.data);
    })
    .catch((error) => {
        console.log(error);
    });
  }

 return (
  <>
  <div>
    <Modal
      open={abierto}
      onClose={abrirCerrarModal}
      style={modalStyles}
      >
      {body}
    </Modal>
  </div>

  <Grid container
        direction={isSmallScreen ? 'column' : 'row'}
        //alignItems={isSmallScreen ? 'center' : 'center'}
        justifyContent={isSmallScreen ? 'center' : 'center'}
  >
    <Grid item xs={10} >
      <Select
        labelId="usuario"
        id={regdet.id_usuario}
        value={regdet.id_usuario}
        name="id_usuario"
        size='small'
        sx={{display:'block',
        margin:'.0rem 0', color: 'white', textAlign: 'center'}}
        //label="Usuario"
        onChange={handleChange}
        inputProps={{ style:{color:'white'} }}
        InputLabelProps={{ style:{color:'white'} }}
      >
        {   
            usuario_select.map(elemento => (
            <MenuItem   key={elemento.id_usuario} 
                        value={elemento.id_usuario}>
              {elemento.id_usuario}
            </MenuItem>)) 
        }
      </Select>
    </Grid>

    <Grid item xs={0.9} >
      <Tooltip title='Registra Nuevo Email'>
        <Button variant='contained' 
                fullWidth
                color='primary'
                sx={{display:'block',margin:'.0rem 0'}}
                onClick = { () => {
                  //ocargaDetModal.e_monto = ocargaDet.e_monto01;
                  datosModal.id_usuario = regdet.id_usuario;
                  setAbierto(true);
                  }
                }

                >
        CLONAR
        </Button>
      </Tooltip>
    </Grid>

    <Grid item xs={1.1} >    
      <Tooltip title='Eliminar todos los permisos Email'>
        <Button variant='contained' 
                fullWidth
                color='warning'
                sx={{display:'block',margin:'.0rem 0'}}
                onClick = { () => {
                  handleEliminaPermisos();
                  }
                }
                >
        ELIMINAR
        </Button>
      </Tooltip>
    </Grid>

  </Grid>

    <Datatable
      title="Gestion de Seguridad"
      theme="solarized"
      columns={columnas}
      data={registrosdet}
      //contextActions={contextActions}
      //actions={actions}
      onSelectedRowsChange={handleRowSelected}
      clearSelectedRows={toggleCleared}
      dense={true}

      selectableRowsComponent={Checkbox} // Pass the function only
      sortIcon={<ArrowDownward />}  

    >
    </Datatable>

  </>
  );
}
