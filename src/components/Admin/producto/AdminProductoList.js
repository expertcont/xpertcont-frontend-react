import React from 'react';
import { useEffect, useState, useCallback } from "react"
import { Box,useMediaQuery} from "@mui/material";
import { useNavigate,useParams } from "react-router-dom";
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import swal from 'sweetalert';
import swal2 from 'sweetalert2'
import '../../../App.css';
import 'styled-components';
//import axios from 'axios';

//import { utils, writeFile } from 'xlsx';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import axios from 'axios';

import { useAuth0 } from '@auth0/auth0-react'; //new para cargar permisos luego de verificar registro en bd
import { saveAs } from 'file-saver';
import palette from '../../../theme/palette';
import AdminProductoCloneDialog from './AdminProductoCloneDialog';
import AdminProductoListHeader from './AdminProductoListHeader';
import AdminProductoTable from './AdminProductoTable';
import AdminProductoToolbar from './AdminProductoToolbar';

// Pantalla principal del modulo Productos: lista productos o rangos de precios segun valorVista.
// Layout base del listado: deja el contenido compacto y alineado con los modulos redisenados.
const pageSx = {
  width: '100%',
  maxWidth: '100%',
  boxSizing: 'border-box',
  minWidth: 0,
  display: 'grid',
  gap: 1.15,
  p: { xs: 1, md: 1.25 },
  pt: 1,
  color: palette.text,
};

// Icono de editar en cada fila; el hover teal ayuda a distinguir acciones positivas.
const rowActionIconSx = {
  color: palette.accent,
  cursor: 'pointer',
  fontSize: 20,
  display: 'block',
  transition: 'color 0.18s ease, transform 0.18s ease',
  '&:hover': {
    color: '#7ddbd3',
    transform: 'translateY(-1px)',
  },
};

// Icono de clonar: se mantiene neutro para no competir con editar/eliminar.
const cloneActionIconSx = {
  color: 'rgba(139,154,165,0.86)',
  cursor: 'pointer',
  fontSize: 22,
  display: 'block',
  transition: 'color 0.18s ease, transform 0.18s ease',
  '&:hover': {
    color: 'rgba(255,255,255,0.92)',
    transform: 'translateY(-1px)',
  },
};

// Icono de eliminar con hover calido para senalar accion destructiva sin saturar la tabla.
const deleteActionIconSx = {
  ...rowActionIconSx,
  color: '#ff9f7a',
  '&:hover': {
    color: '#ffc6b1',
    transform: 'translateY(-1px)',
  },
};

export default function AdminProductoList() {
  //Control de useffect en retroceso de formularios
  //verificamos si es pantalla pequeña y arreglamos el grid de fechas
  const isSmallScreen = useMediaQuery('(max-width: 600px)');

  ///////////////////////////////////////////////////
  /*function exportToExcel(data) {
    const worksheet = utils.json_to_sheet(data);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Datos');
    writeFile(workbook, 'datos.xlsx');
  }*/

  //const back_host = process.env.BACK_HOST || "http://localhost:4000";
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
  //experimento
  const [updateTrigger, setUpdateTrigger] = useState({});

  const [selectedRows, setSelectedRows] = useState([]);
  const [toggleCleared, setToggleCleared] = useState(false);

  const [registrosdet,setRegistrosdet] = useState([]);
  const [tabladet,setTabladet] = useState([]);  //Copia de los registros: Para tratamiento de filtrado
  const [valorBusqueda, setValorBusqueda] = useState(""); //txt: rico filtrado
  const [permisosComando, setPermisosComando] = useState([]); //MenuComandos
  const {user, isAuthenticated } = useAuth0();
  const [valorVista, setValorVista] = useState("productos");
  
  const [showModalMostrarClonar, setShowModalMostrarClonar] = useState(false);
  const [id_producto, setIdProducto] = useState("");
  const [id_producto_nuevo, setIdProductoNuevo] = useState("");
  const [nombre_nuevo, setNombreNuevo] = useState("");

  // Agrega íconos al inicio de cada columna
  const columnas = [
    {
      name: '',
      width: isSmallScreen ? '36px' : '32px',
      cell: (row) => (
        pVenta0101 ? (
          <DriveFileRenameOutlineIcon
            onClick={() => handleUpdate(row.id_producto, row.descripcion)} //descripcion contiene campo unidades
            sx={rowActionIconSx}
          />
        ) : null
      ),
      allowOverflow: true,
      button: true,
    },
    {
      name: '',
      width: isSmallScreen ? '36px' : '30px',
      cell: (row) => (
            <ContentCopyIcon
              onClick={() => {
                    if (valorVista === 'precios') {	
                      //unidades = row.descripcion
                      navigate(`/ad_productoprecio/${params.id_anfitrion}/${params.id_invitado}/${params.documento_id}/${row.id_producto}/${row.descripcion}/clonar`);
                    } else {	
                      setShowModalMostrarClonar(true);
                      setIdProducto(row.id_producto);
                    }
                }
              }
              sx={cloneActionIconSx}
            />
      ),
      allowOverflow: true,
      button: true,
    },
    {
      name: '',
      width: isSmallScreen ? '36px' : '30px',
      cell: (row) => (
          <DeleteIcon
            onClick={() => handleDelete(row.id_producto)}
            sx={deleteActionIconSx}
          />
      ),
      allowOverflow: true,
      button: true,
    },
    { name:'ID', 
      selector:row => row.id_producto,
      sortable: true,
      compact: true,
      width: '80px'
      //key:true
    },
    { name:'NOMBRE', 
      selector:row => row.nombre,
      width: '350px',
      compact: true,
      sortable: true
    },
    { name:'DESCRIPCION', 
      selector:row => row.descripcion,
      width: '100px',
      compact: true,
      sortable: true
    },
    { name:'PRECIO', 
      selector:row => row.precio_venta,
      width: '100px',
      sortable: true
    },
    { name:'% IGV', 
      selector:row => row.porc_igv,
      width: '100px',
      sortable: true
    },
    { name:'UNIDAD', 
      selector:row => row.cont_und,
      width: '100px',
      sortable: true
    },
    { name:'ORIGEN', 
      selector:row => row.origen,
      width: '100px',
      sortable: true
    },

  ];

  //Permisos Nivel 02 - Comandos (Buttons)
  const [pVenta0101, setPVenta0101] = useState(false); //Nuevo (Casi libre)
  const [pVenta0102, setPVenta0102] = useState(false); //Modificar (Restringido)
  const [pVenta0103, setPVenta0103] = useState(false); //ELiminar (Restringido)
  const [pVenta0104, setPVenta0104] = useState(false); //Eliminar Masivo (Casi Nunca solo el administrador)

  // valores adicionales para Carga Archivo
  const [datosCarga, setDatosCarga] = useState({
    id_anfitrion: '',
    documento_id: ''
  });  

  const handleRowSelected = useCallback(state => {
		setSelectedRows(state.selectedRows);
	}, []);

  const handleUpdate = (id_producto,unidades) => {
    //Mostrar formulario para edicion
    if (valorVista === 'productos') {
        navigate(`/ad_producto/${params.id_anfitrion}/${params.id_invitado}/${params.documento_id}/${id_producto}/edit`);
    }else{
        navigate(`/ad_productoprecio/${params.id_anfitrion}/${params.id_invitado}/${params.documento_id}/${id_producto}/${unidades}/edit`);
    }
  };
  const handleDelete = (id_producto) => {
    //console.log(num_asiento);
    confirmaEliminacion(params.id_anfitrion,params.documento_id,id_producto);
  };
  const confirmaEliminacion = async(sAnfitrion,sDocumentoId,sIdProducto)=>{
    await swal({
      title:"Eliminar Registro",
      text:"Seguro ?",
      icon:"warning",
      buttons:["No","Si"]
    }).then(respuesta=>{
        if (respuesta){
          //console.log(cod,serie,num,elem,item);
          eliminarRegistroSeleccionado(sAnfitrion,sDocumentoId,sIdProducto);
          setToggleCleared(!toggleCleared);
          setRegistrosdet(registrosdet.filter(
                          registrosdet => registrosdet.id_producto !== sIdProducto
                          ));
          setTimeout(() => { // Agrega una función para que se ejecute después del tiempo de espera
              setUpdateTrigger(Math.random());//experimento
          }, 200);
                        
          swal({
            text:"Producto se ha eliminado con exito",
            icon:"success",
            timer:"2000"
          });
      }
    })
  };
  const eliminarRegistroSeleccionado = async (sAnfitrion,sDocumentoId,sIdProducto) => {
    //En ventas solo se eliminan, detalle-cabecera
    await fetch(`${back_host}/ad_producto/${sAnfitrion}/${sDocumentoId}/${sIdProducto}`, {
        method:"DELETE"
    });
  };

  ///////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////
  const cargaRegistro = async () => {
    var response;
    //Cargamos productos
    response = await fetch(`${back_host}/ad_producto/${params.id_anfitrion}/${params.documento_id}`);
    
    const data = await response.json();
    setRegistrosdet(data);
    setTabladet(data); //Copia para tratamiento de filtrado
    //console.log("data", data);
  }
  const cargaRegistroPrecios = async () => {
    var response;
    //Cargamos productos
    response = await fetch(`${back_host}/ad_productoprecio/${params.id_anfitrion}/${params.documento_id}`);
    
    const data = await response.json();
    setRegistrosdet(data);
    setTabladet(data); //Copia para tratamiento de filtrado
    //console.log("data", data);
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
      const razonSocial = elemento.nombre?.toString().toLowerCase() || '';
  
      if (razonSocial.includes(strBusca.toLowerCase()) ) {
        return elemento;
      }
      return null; // Agrega esta línea para manejar el caso en que no haya coincidencia
    });
  
    resultadosBusqueda = resultadosBusqueda.filter(Boolean); // Filtra los elementos nulos
  
    setRegistrosdet(resultadosBusqueda);
  };
  
  const cargaPermisosMenuComando = async(idMenu)=>{
    if (params.id_anfitrion === params.id_invitado){
      setPVenta0101(true); //nuevo
      setPVenta0102(true); //modificar
      setPVenta0103(true); //eliminar
      setPVenta0104(true); //eliminar masivo
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
          tienePermiso = permisosData.some(permiso => permiso.id_comando === '01-01'); //Nuevo
          if (tienePermiso) {
            setPVenta0101(true);
          }

          tienePermiso = permisosData.some(permiso => permiso.id_comando === '01-02'); //Modificar
          if (tienePermiso) {
            setPVenta0102(true);
          }else {setPVenta0102(false);}

          tienePermiso = permisosData.some(permiso => permiso.id_comando === '01-03'); //Eliminar
          if (tienePermiso) {
            setPVenta0103(true);
          }else {setPVenta0103(false);}
          ////////////////////////////////////////////////

          //setUpdateTrigger(Math.random());//experimento
        })
        .catch(error => {
          console.log('Error al obtener los permisos:', error);
        });
    }
  }

  // Función que se pasa como prop al componente.js
  const handleActualizaImportaOK = () => {
    //console.log('valorVista,periodo_trabajo,contabilidad_trabajo:', valorVista,periodo_trabajo,contabilidad_trabajo);
    //cargaRegistro(valorVista,periodo_trabajo,contabilidad_trabajo);
    setUpdateTrigger(Math.random());//experimento para actualizar el dom
    // Puedes realizar otras operaciones con la cantidad de filas si es necesario
  };
  
  //////////////////////////////////////////////////////////
  useEffect( ()=> {
        //cargar registro
      valorVista === 'productos' ? cargaRegistro() : cargaRegistroPrecios();

      //setValorVista('productos'); //Por default, la 1era vez
      /////////////////////////////
      //NEW codigo para autenticacion y permisos de BD
      if (isAuthenticated && user && user.email) {
        cargaPermisosMenuComando('01');
      }
      setDatosCarga(prevState => ({ ...prevState, id_anfitrion: params.id_anfitrion }));
      setDatosCarga(prevState => ({ ...prevState, documento_id: params.documento_id }));
  
  },[isAuthenticated, user, updateTrigger]) //Aumentamos IsAuthenticated y user

  const handleDescargarExcelVacio = async () => {
    // Question view id_libro
    let filePath;
    let fileName;

    filePath = '/productos_prueba.xlsx';
    // Nombre del archivo para la descarga
    fileName = 'productos_prueba.xlsx';

    // URL completa del archivo
    const fileUrl = process.env.PUBLIC_URL + filePath;

    try {
      // Realizar la solicitud para obtener el archivo usando axios
      const response = await axios.get(fileUrl, { responseType: 'blob' });

      // Utilizar file-saver para descargar el archivo
      saveAs(response.data, fileName);
    } catch (error) {
      console.error('Error al descargar el archivo:', error);
    }
  };

  const handleDeleteOrigen = async (sAnfitrion,sDocumentoId) => {
    const { value: selectedOrigen } = await swal2.fire({
      title: 'Eliminar registros',
      //text: 'Selecciona el origen para la eliminación masiva:',
      input: 'select',
      icon: 'warning',
      //color: 'orange',
      inputOptions: {
        EXCEL: 'EXCEL',
        MANUAL: 'MANUAL',
        // Agrega las opciones según los valores de "origen" de tu tabla
      },
      inputPlaceholder: 'Selecciona el origen',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        return new Promise((resolve) => {
          if (value === '') {
            resolve('Debes seleccionar un origen');
          } else {
            resolve();
          }
        });
      },
    });

    // Si el usuario hace clic en "Eliminar" y selecciona un origen
    if (selectedOrigen) {
      // Aquí puedes realizar la lógica para eliminar registros masivamente con el origen seleccionado
      //console.log('Eliminar registros con origen:', selectedOrigen);
      await fetch(`${back_host}/ad_productomasivo/${sAnfitrion}/${sDocumentoId}/${selectedOrigen}`, {
        method:"DELETE"
      });

      setTimeout(() => { // Agrega una función para que se ejecute después del tiempo de espera
        setUpdateTrigger(Math.random());//experimento
      }, 200);
    }
  };
  
  const actualizaValorVista = (e) => {
    setValorVista(e.target.value);
    //grabar datos sesionStorage valorVista
    sessionStorage.setItem('valorVistaProducto', e.target.value);

    //Lo dejaremos terminar el evento de cambio o change
    setUpdateTrigger(Math.random());//experimento para actualizar el dom
  };

  const clonarProducto = async (sIdProducto, sIdProductoNuevo, sNombreNuevo) => {
    try {
      const response = await axios.post(
        `${back_host}/ad_productoclon`,
        {
          id_anfitrion: params.id_anfitrion,        // o como lo tengas guardado
          documento_id: params.documento_id,      // desde tu contexto o estado
          id_producto: sIdProducto,
          id_producto_nuevo: sIdProductoNuevo,
          nombre_nuevo: sNombreNuevo
        }
      );

      const { exito, mensaje } = response.data;

      // Opcional: mostrar alertas o snackbars
      if (exito) {
        alert(mensaje);
      } else {
        alert(mensaje);
      }

      return { exito, mensaje };

    } catch (error) {
      console.error("Error al clonar producto:", error);

      alert("Error al clonar producto (conexión o servidor).");

      return { exito: false, mensaje: "Error de conexión o servidor" };
    }
  };

  const handleChange = e => {
    //Para todos los demas casos ;)
    if (e.target.name==="id_producto_nuevo"){
      setIdProductoNuevo(e.target.value);
    }
    if (e.target.name==="nombre_nuevo"){
      setNombreNuevo(e.target.value);
    }
    
    setUpdateTrigger(Math.random());//experimento para actualizar el dom
  };
  
 return (
  <>
    <AdminProductoCloneDialog
      open={showModalMostrarClonar}
      isSmallScreen={isSmallScreen}
      idProducto={id_producto}
      idProductoNuevo={id_producto_nuevo}
      nombreNuevo={nombre_nuevo}
      onChange={handleChange}
      onClose={() => setShowModalMostrarClonar(false)}
      onClonar={() => {
        clonarProducto(id_producto, id_producto_nuevo, nombre_nuevo);
        setShowModalMostrarClonar(false);
      }}
    />

    <Box sx={pageSx}>
      {/* Componente de presentacion: titulo del modulo y cambio Productos/Precios. */}
      <AdminProductoListHeader
        valorVista={valorVista}
        onVistaChange={actualizaValorVista}
      />

      {/* Componente operativo: acciones de archivo, altas, borrado masivo y filtro. */}
      <AdminProductoToolbar
        isSmallScreen={isSmallScreen}
        registrosdet={registrosdet}
        datosCarga={datosCarga}
        valorVista={valorVista}
        onNuevo={() => navigate(`/ad_producto/${params.id_anfitrion}/${params.id_invitado}/${params.documento_id}/new`)}
        onDescargarPlantilla={handleDescargarExcelVacio}
        onEliminarMasivo={() => handleDeleteOrigen(params.id_anfitrion, params.documento_id)}
        onImportOk={handleActualizaImportaOK}
        onFiltroChange={actualizaValorFiltro}
      />

      {/* Componente de datos: encapsula tema, paginacion y estilos del DataTable. */}
      <AdminProductoTable
        columns={columnas}
        data={registrosdet}
        onSelectedRowsChange={handleRowSelected}
        clearSelectedRows={toggleCleared}
      />
    </Box>
  </>
  );
}
