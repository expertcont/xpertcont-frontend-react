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

export default function SeguridadList() {
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //Seccion Modal
  const [abierto,setAbierto] = useState(false);
  const [datosModal,setdatosModal] = useState({
    id_anfitrion:'', //new 
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
    //console.log(e.target.name,e.target.value);
    //actualizamos datos del formulario, para pantalla general
    //setocargaDet({...ocargaDet, [e.target.name+numGuia]: e.target.value});
  }
  const handleClone = async() => {
    //setRegdet(datosModal => ({ ...datosModal, id_anfitrion: params.id_anfitrion }));    
    datosModal.id_anfitrion = params.id_anfitrion;
    //datosModal.id_usuario2 = id_;
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
    await fetch(`${back_host}/seguridadeliminar/${params.id_anfitrion}/${regdet.id_invitado}`, {
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
                    //datosModal.id_usuario2 = ""; //resetear el nuevo email
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
    id_menu:'',
    id_comando:''
  })
  //const [ocargaDet,setocargaDet] = useState({});
  const [usuario_select,setUsuarioSelect] = useState([]);

  //////////////////////////////////////////////////////////
  //const [registrosdet,setRegistrosdet] = useState([]);
  //////////////////////////////////////////////////////////
  const cargaRegistro = async () => {
    let response;
    if (regdet.id_invitado ===null || regdet.id_invitado ===''){
    console.log(`null ${back_host}/seguridad/${params.id_anfitrion}/${user.email}/vista`);
    response = await fetch(`${back_host}/seguridad/${params.id_anfitrion}/${user.email}/vista`);
    }else{
    console.log(`regdet.id_usuario ${back_host}/seguridad/${params.id_anfitrion}/${regdet.id_invitado}/vista`);
    response = await fetch(`${back_host}/seguridad/${params.id_anfitrion}/${regdet.id_invitado}/vista`);
    }
    const data = await response.json();
    setRegistrosdet(data);
  }
  //////////////////////////////////////
  const columnas = [
    { name:'GRUPO', 
      selector:row => row.id_comando.substring(0,2),
      sortable: true,
      width: '50px'
      //key:true
    },
    {
      name: "",
      cell: (row, rowIndex) => (
        <Switch
          checked={switchValues[rowIndex] || false} // Utilizamos el valor correspondiente al índice en el array
          onChange={() => handleModEjecucion(regdet.id_invitado, row.id_comando, rowIndex, row.id_permiso)}
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

  const handleModEjecucion = async(id_invitado,id_comando,index,id_permiso) => {
    console.log("Modificando: ", id_invitado,id_comando,index);
    
    //Codigo para actualizar array local
    const updatedValues = [...switchValues];
    updatedValues[index] = !updatedValues[index];
    setSwitchValues(updatedValues);
    //Codigo para actualizar base datos api(POST)

    ejecutaRegistroSeleccionado(id_invitado,id_comando,id_permiso);

    /*setTimeout(() => { // Agrega una función para que se ejecute después del tiempo de espera
        setUpdateTrigger(Math.random());//actualiza la vista actual
    }, 200);*/

  };

  const ejecutaRegistroSeleccionado = async (id_invitado,id_comando,id_permiso) => {
    //Insertar ocargadet identico, pero con tipo = 'E'
    console.log(`Modificando permiso orden: ${id_invitado} ${id_comando}`);
    //armar un useState para el body
    regdet.id_usuario =  params.id_anfitrion; //yeah ;)
    regdet.id_invitado =  id_invitado;
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
      console.log("API DELETE: ",`${back_host}/seguridad/${params.id_anfitrion}/${id_invitado}/${id_comando}`);
      await fetch(`${back_host}/seguridad/${params.id_anfitrion}/${id_invitado}/${id_comando}`, {
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
 
  //const navigate = useNavigate();
  //Para recibir parametros desde afuera
  const params = useParams();

  /*const eliminarRegistroDet = async (id_registro) => {
    await fetch(`${back_host}/producto/${id_registro}`, {
      method:"DELETE"
    });
    //setRegistrosdet(registrosdet.filter(registrosdet => registrosdet.id_producto !== id_registro));
    //console.log(data);
  }*/

  //////////////////////////////////////////////////////////
  useEffect( ()=> {
      console.log("user.email : ", user.email);
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
    //console.log("hola fiera 2do");
  }, [registrosdet]);  
  //////////////////////////////////////////////////////////
  const cargaUsuarioCombo = () =>{
    console.log(`${back_host}/seguridademail/${params.id_anfitrion}`);
    axios
    .get(`${back_host}/seguridademail/${params.id_anfitrion}`)
    .then((response) => {
        setUsuarioSelect(response.data);
        console.log(response.data);
    })
    .catch((error) => {
        console.log(error);
    });
  }
  ////////////////////////////////////////////////////////////////////////
  const originalColor = '#1e272e';
  const conditionalRowStyles = [
    {
      when: row => row.id_comando.substring(0,2)==='01',
      style: {
        backgroundColor: aclararColor(originalColor,20),
      },
    },
  ];
  function aclararColor(hex, percent) {
    // Parsear el color hexadecimal a componentes RGB
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
  
    // Calcular el porcentaje de aclarado
    let factor = 1 + percent / 100;
  
    // Ajustar los componentes RGB
    r = Math.round(r * factor);
    g = Math.round(g * factor);
    b = Math.round(b * factor);
  
    // Asegurar que los valores estén en el rango [0, 255]
    r = Math.min(255, r);
    g = Math.min(255, g);
    b = Math.min(255, b);
  
    // Convertir los componentes RGB de nuevo a formato hexadecimal
    const nuevoHex = `#${(r).toString(16).padStart(2, '0')}${(g).toString(16).padStart(2, '0')}${(b).toString(16).padStart(2, '0')}`;
  
    return nuevoHex;
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
        id={regdet.id_invitado}
        value={regdet.id_invitado}
        name="id_invitado"
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
            <MenuItem   key={elemento.id_invitado} 
                        value={elemento.id_invitado}>
              {elemento.id_invitado}
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
      //onSelectedRowsChange={handleRowSelected}
      //clearSelectedRows={toggleCleared}
      dense={true}

      selectableRowsComponent={Checkbox} // Pass the function only
      sortIcon={<ArrowDownward />}  
      conditionalRowStyles={conditionalRowStyles} 

    >
    </Datatable>

  </>
  );
}
