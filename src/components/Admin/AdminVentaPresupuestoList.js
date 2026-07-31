"use client";

import React from "react";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate,useParams,useLocation } from "react-router-dom";
import DataTable, { createTheme } from "react-data-table-component";
import DaySelector from "./AdminDias";

import { Box, Typography, InputBase, MenuItem,Select, useMediaQuery } from "@mui/material";
import { Search, FileText, Calendar, Building2, ClipboardList, Pencil } from "lucide-react";
import { Plus } from 'lucide-react';

import Tooltip from '@mui/material/Tooltip';
import AppSearch from "../ui/AppSearch";
import AppButton from "../ui/AppButton";
import AppIconBox from "../ui/AppIconBox";
import AppChip from "../ui/AppChip";
import palette from "../../theme/palette";
import { presupuestosDemo, totalPresupuesto } from "./AdminVentaPresupuestoDemoData";

/* =======================================================
   PALETA (manteniendo tu dark + teal)
======================================================= */
import axios from 'axios';
import swal from 'sweetalert';
import swal2 from 'sweetalert2'
import AdminSunatIcon from './AdminSunatIcon';
import AdminSunatGreIcon from './AdminSunatGreIcon';
import DeleteIcon from '@mui/icons-material/Delete';
import FindIcon from '@mui/icons-material/FindInPage';
import AddBoxIcon from '@mui/icons-material/AddBox';
import { blueGrey } from '@mui/material/colors';
import { useAuth0 } from '@auth0/auth0-react'; //new para cargar permisos luego de verificar registro en bd
import { useDialog } from "./AdminConfirmDialogProvider";
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import FindInPageIcon from '@mui/icons-material/FindInPage';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
/*const palette = {
  bg: "#1a2127",
  surface: "#1e272e",
  surfaceAlt: "#222d35",
  chip: "#273238",
  border: "#2d3942",
  borderSoft: "#26323a",
  text: "#ffffff",
  muted: "#8b9aa5",
  accent: "#2aa198",
  accentSoft: "rgba(42,161,152,0.12)",
};*/

/* =======================================================
   TEMA DATATABLE
======================================================= */

createTheme(
  "solarized",
  {
    text: { primary: palette.text, secondary: palette.accent },
    background: { default: "transparent" },
    context: { background: palette.accent, text: "#FFFFFF" },
    divider: { default: palette.borderSoft },
    action: {
      button: "rgba(255,255,255,.54)",
      hover: "rgba(42,161,152,0.06)",
      disabled: "rgba(255,255,255,.12)",
    },
  },
  "dark",
);

/* =======================================================
   DATOS DEMO
======================================================= */

const formatMoney = (moneda, value) => `${moneda || "PEN"} ${Number(value || 0).toLocaleString("es-PE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

/* =======================================================
   COLUMNAS
======================================================= */

const createColumns = (onEdit) => [
  {
    name: "",
    grow: 1,
    cell: (row) => (
      <Box sx={{ width: "100%", py: 2 }}>
        {/* FILA SUPERIOR */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>

            <AppIconBox>
              <FileText size={16} />
            </AppIconBox>

            <Typography
              sx={{
                color: palette.text,
                fontWeight: 700,
                fontSize: "15px",
                letterSpacing: "0.3px",
              }}
            >
              {row.numero}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Box
              onClick={() => onEdit(row)}
              sx={{
                width: 30,
                height: 30,
                borderRadius: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: palette.chip,
                border: `1px solid ${palette.border}`,
                color: palette.muted,
                cursor: "pointer",
                transition: "all .18s ease",
                "&:hover": {
                  backgroundColor: palette.accent,
                  borderColor: palette.accent,
                  color: palette.surface,
                },
              }}
            >
              <Pencil size={14} />
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              color: palette.accent,
              fontWeight: 600,
              fontSize: "12.5px",
              }}
            >
              <Calendar size={13} />
              {row.fecha}
            </Box>
          </Box>
        </Box>

        {/* CLIENTE */}
        <Box
          sx={{
            mt: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 0.75,
            color: palette.muted,
            fontSize: "13px",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
            <Building2 size={13} style={{ flexShrink: 0 }} />
            <Typography sx={{ fontSize: "13px", color: palette.muted }} noWrap>
              {row.cliente}
            </Typography>
          </Box>
          <Typography sx={{ color: palette.text, fontSize: "14px", fontWeight: 800, whiteSpace: "nowrap", ml: 1 }}>
            {formatMoney(row.moneda, row.total)}
          </Typography>
        </Box>

        {/* TRABAJOS */}
        <Box
          sx={{
            mt: 1.75,
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 0.75,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              color: palette.muted,
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              mr: 0.5,
            }}
          >
            <ClipboardList size={13} />
            {row.trabajos.length} trabajos
          </Box>

          {row.trabajos.map((trabajo) => (
            <AppChip
              key={trabajo.id}
              onClick={() => alert(`Trabajo: ${trabajo.numero}`)}
            >
              {trabajo.numero}
            </AppChip>            
          ))}
        </Box>
      </Box>
    ),
  },
];

/* =======================================================
   ESTILOS DATATABLE
======================================================= */

const customStyles = {
  table: { style: { backgroundColor: "transparent" } },
  headRow: { style: { display: "none" } },
  rows: {
    style: {
      backgroundColor: palette.surface,
      color: palette.text,
      minHeight: "104px",
      marginBottom: "10px",
      borderRadius: "12px",
      border: `1px solid ${palette.borderSoft}`,
      paddingLeft: "16px",
      paddingRight: "16px",
      transition: "border-color .18s ease, background-color .18s ease",
      "&:hover": {
        backgroundColor: palette.surfaceAlt,
        borderColor: palette.border,
      },
    },
  },
  pagination: {
    style: {
      backgroundColor: "transparent",
      color: palette.muted,
      borderTop: `1px solid ${palette.borderSoft}`,
      marginTop: "8px",
    },
    pageButtonsStyle: {
      color: palette.muted,
      fill: palette.muted,
      "&:hover:not(:disabled)": { backgroundColor: palette.accentSoft },
      "&:disabled": { color: palette.border, fill: palette.border },
    },
  },
};


/* =======================================================
   COMPONENTE
======================================================= */

export default function AdminVentaPresupuestoList() {
  const data = useMemo(() => presupuestosDemo.map((presupuesto) => ({
    ...presupuesto,
    fecha: presupuesto.fecha.split("-").reverse().join("/"),
    cliente: presupuesto.cliente_nombre,
    total: totalPresupuesto(presupuesto),
    trabajos: presupuesto.trabajos.map((trabajo) => ({
      ...trabajo,
      numero: trabajo.numero || trabajo.codigo,
    })),
  })), []);
  const totalTrabajos = data.reduce((acc, p) => acc + p.trabajos.length, 0);
  const [buscar, setBuscar] = React.useState("");

  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
  //experimento
  const [updateTrigger, setUpdateTrigger] = useState({});

  const [selectedRows, setSelectedRows] = useState([]);
  const [toggleCleared, setToggleCleared] = useState(false);
	//const [data, setData] = useState(tableDataItems);
  const [registrosdet,setRegistrosdet] = useState([]);
  const [tabladet,setTabladet] = useState([]);  //Copia de los registros: Para tratamiento de filtrado
  const [navegadorMovil, setNavegadorMovil] = useState(false);
  const [valorBusqueda, setValorBusqueda] = useState(""); //txt: rico filtrado
  const [valorVista, setValorVista] = useState("ventas");
  const [id_libro, setValorLibro] = useState("014");
  const [permisosComando, setPermisosComando] = useState([]); //MenuComandos
  const {user, isAuthenticated } = useAuth0();
  
  const [columnas, setColumnas] = useState([]);

  const [periodo_trabajo, setPeriodoTrabajo] = useState("");
  const [periodo_select,setPeriodosSelect] = useState([]);
  
  const [contabilidad_trabajo, setContabilidadTrabajo] = useState("");
  const [contabilidad_nombre, setContabilidadNombre] = useState("");
  const [contabilidad_select,setContabilidadesSelect] = useState([]);
  const [valorComprobante, setValorComprobante] = useState("");

  const [datosPopUp,setDatosPopUp] = useState([]);
  let [diaSel, setDiaSel] = useState("*");

  const isSmallScreen = useMediaQuery('(max-width: 600px)');
  const { confirmDialog } = useDialog(); //unico dialogo
  const [fecha_clon, setFechaClon] = useState("");

  //Seccion Dialog
  const [isDialogOpen, setDialogOpen] = useState(false);
  const location = useLocation();


    // Agrega íconos al inicio de cada columna
    let columnasComunes;
    //Permisos Nivel 01 - Menus (toggleButton)
    const [permisos, setPermisos] = useState([]); //Menu
    const [permisoVentas, setPermisoVentas] = useState(false);
    
    //Permisos Nivel 02 - Comandos (Buttons)
    const [pVenta0101, setPVenta0101] = useState(false); //Nuevo (Casi libre)
    const [pVenta0102, setPVenta0102] = useState(false); //Modificar (Restringido)
    const [pVenta0103, setPVenta0103] = useState(false); //ELiminar (Restringido)
    const [pVenta0104, setPVenta0104] = useState(false); //Eliminar Masivo (Casi Nunca solo el administrador)
  
    // valores adicionales para Carga Archivo
    const [datosCarga, setDatosCarga] = useState({
      id_anfitrion: '',
      documento_id: '',
      periodo: '',
      id_libro: '',
      id_invitado: '',
    });  
  
    const handleRowSelected = useCallback(state => {
      setSelectedRows(state.selectedRows);
    }, []);
  
    const handleUpdate = (sComprobante,bModoVista) => {
      console.log('sComprobante: ',sComprobante);
      //var num_asiento;
      if (bModoVista) {
        //Validamos
        navigate(`/ad_venta/${params.id_anfitrion}/${params.id_invitado}/${periodo_trabajo}/${contabilidad_trabajo}/${sComprobante}/view`);
      } else {
        navigate(`/ad_venta/${params.id_anfitrion}/${params.id_invitado}/${periodo_trabajo}/${contabilidad_trabajo}/${sComprobante}/-`);
      }    
    };
    const handleDelete = (comprobante,elemento) => {
      //Recuerda que el comprobante enviado es el comprobante_key --> contiene el key del registro ;)
      confirmaEliminacion(params.id_anfitrion,contabilidad_trabajo,periodo_trabajo,comprobante,elemento);
    };
    const confirmaEliminacion = async(sAnfitrion,sDocumentoId,sPeriodo,sComprobante,sElemento)=>{
      const result = await confirmDialog({
          title: "Eliminar Comprobante?",
          message: `${sComprobante}`,
          icon: "warning", // success | error | info | warning
          confirmText: "ELIMINAR",
          cancelText: "CANCELAR",
      });
      if (result.isConfirmed) {
            console.log("✅ Eliminado:", sComprobante);
            eliminarRegistroSeleccionado(sAnfitrion,sDocumentoId,sPeriodo,sComprobante,sElemento);
            setToggleCleared(!toggleCleared);
            setRegistrosdet(registrosdet.filter(
                            registrosdet => registrosdet.comprobante !== sComprobante
                            ));
            setTimeout(() => { // Agrega una función para que se ejecute después del tiempo de espera
                setUpdateTrigger(Math.random());//experimento
            }, 200);
      } else {
        console.log("❌ Cancelado");
        return; // Salimos si el usuario cancela
      }
    }
    const eliminarRegistroSeleccionado = async (sAnfitrion, sDocumentoId, sPeriodo, sComprobante, sElemento) => {
      const [COD, SERIE, NUMERO] = sComprobante.split('-');
      const datosEnvio = {
        periodo: sPeriodo,
        id_anfitrion: sAnfitrion,
        documento_id: sDocumentoId,
        r_cod: COD,
        r_serie: SERIE,
        r_numero: NUMERO,
        elemento: sElemento
      }
      //console.log('datosEnvio',datosEnvio);
  
      try {
          const response = await axios.delete(`${back_host}/ad_ventadel`, {
              data: datosEnvio
          });
  
          // Verifica la respuesta del backend
          if (response.data.success) {
            /*swal({
              text:"Venta se ha eliminado con exito",
              icon:"success",
              timer:"2000"
            });*/
            confirmDialog({
                    title: "Venta se ha eliminado con exito",
                    //message: `${sComprobante}`,
                    icon: "success", // success | error | info | warning
                    confirmText: "ACEPTAR"
                    //cancelText: "CERRAR",
            });
          } else {
            confirmDialog({
              title: "Eliminacion Denegada, solo ultimo del Periodo",
              icon: "error",
              confirmText: "ACEPTAR"
            });
            //console.log("No se pudo eliminar la venta, no es la ultima: " + response.data.message);
          }
      } catch (error) {
          //console.error("Error eliminando venta:", error);
            swal({
              text:"No se puede Eliminar Venta",
              icon:"error",
              timer:"2000"
            });
          
      }
  };
  
    const handleDeleteOrigen = async (sAnfitrion,sDocumentoId,sPeriodo,sLibro) => {
      const { value: selectedOrigen } = await swal2.fire({
        title: 'Eliminar registros',
        //text: 'Selecciona el origen para la eliminación masiva:',
        input: 'select',
        icon: 'warning',
        //color: 'orange',
        inputOptions: {
          EXCEL: 'EXCEL',
          SIRE: 'SIRE',
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
        await fetch(`${back_host}/asientomasivo/${sAnfitrion}/${sDocumentoId}/${sPeriodo}/${sLibro}/${selectedOrigen}`, {
          method:"DELETE"
        });
  
        setTimeout(() => { // Agrega una función para que se ejecute después del tiempo de espera
          setUpdateTrigger(Math.random());//experimento
        }, 200);
        console.log('eliminadooooo todo, ahora debemos recargar en 2do useeffect');
        cargaRegistro(valorVista,periodo_trabajo,contabilidad_trabajo,diaSel);
      }
    };
    
    const calcularSumatoriaMoneda = (columna, filtro) => {
      return registrosdet.reduce((acumulador, fila) => {
        // Verificar si el valor del campo de filtro coincide
        if (fila['r_moneda'] === filtro) {
          const valorColumna = fila[columna];
          // Verificar si el valor no es nulo y es numérico antes de sumarlo
          if (valorColumna !== null && !isNaN(valorColumna)) {
            return acumulador + parseFloat(valorColumna);
          }
        }
        return acumulador;
      }, 0).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    };  
    const calcularSumatoriaFilasMoneda = (filtro) => {
      return registrosdet.reduce((acumulador, fila) => {
        // Verificar si el valor del campo de filtro coincide
        if (fila['r_moneda'] === filtro) {
            return acumulador + 1;
        }
        return acumulador;
      }, 0);
    };  
  
  
    ///////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////
    const cargaRegistro = async (strHistorialValorVista,strHistorialPeriodo,strHistorialContabilidad, sDia) => {
      let response;
      console.log("cargaRegistro sDia: ", sDia);
      //Cargamos asientos correspondientes al id_usuario,contabilidad y periodo
      if (strHistorialValorVista==='' || strHistorialValorVista===undefined || strHistorialValorVista===null){
          response = await fetch(`${back_host}/ad_venta/${periodo_trabajo}/${params.id_anfitrion}/${contabilidad_trabajo}/${sDia}`);
      }
      else{
          //usamos los historiales
          response = await fetch(`${back_host}/ad_venta/${strHistorialPeriodo}/${params.id_anfitrion}/${strHistorialContabilidad}/${sDia}`);
      }
      
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
      //console.log(tabladet);
      var resultadosBusqueda = tabladet.filter((elemento) => {
        //verifica nulls para evitar error de busqueda
        const razonSocial = elemento.r_razon_social?.toString().toLowerCase() || '';
        const documentoId = elemento.r_documento_id?.toString().toLowerCase() || '';
        const comprobante = elemento.comprobante?.toString().toLowerCase() || '';
    
        if (razonSocial.includes(strBusca.toLowerCase()) || documentoId.includes(strBusca.toLowerCase()) || comprobante.includes(strBusca.toLowerCase())) {
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
            tienePermiso = permisosData.some(permiso => permiso.id_comando === '20-01'); //Nuevo
            if (tienePermiso) {
              setPVenta0101(true);
            }
  
            tienePermiso = permisosData.some(permiso => permiso.id_comando === '20-02'); //Modificar
            if (tienePermiso) {
              setPVenta0102(true);
            }else {setPVenta0102(false);}
  
            tienePermiso = permisosData.some(permiso => permiso.id_comando === '20-03'); //Eliminar
            if (tienePermiso) {
              setPVenta0103(true);
            }else {setPVenta0103(false);}
  
            tienePermiso = permisosData.some(permiso => permiso.id_comando === '20-04'); //Eliminar Masivo
            if (tienePermiso) {
              setPVenta0104(true);
            }else {setPVenta0104(false);}
            ////////////////////////////////////////////////
            
            ////////////////////////////////////////////////
  
            //setUpdateTrigger(Math.random());//experimento
          })
          .catch(error => {
            console.log('Error al obtener los permisos:', error);
          });
      }
    }
  
    //////////////////////////////////////////////////////////
    useEffect( ()=> {
        
        // Realiza acciones cuando isAuthenticated cambia
        //Verificar historial periodo 
        const st_periodo_trabajo = sessionStorage.getItem('periodo_trabajo');
        
        //New Cargar Lista, con sugerencia de foco inicial
        if (st_periodo_trabajo===null || st_periodo_trabajo===''){
            //en caso no haya periodos ni ruc registrados, no tiene porque cargar
          cargaPeriodosAnfitrion(params.periodo);
          setPeriodoTrabajo(params.periodo);
        }else{
          //en caso haya periodos y rucs, debe respetar el ambiente de trabajo anterior
          //cuidado con eliminar un ruc, el ambiente de trabajo podria desaparecer y generar bug ... ****
          cargaPeriodosAnfitrion(st_periodo_trabajo);
          setPeriodoTrabajo(st_periodo_trabajo);
        }
  
        //Verifica historial contabilidad
        const st_contabilidad_trabajo = sessionStorage.getItem('contabilidad_trabajo');
        const st_contabilidad_nombre = sessionStorage.getItem('contabilidad_nombre');
        //New Cargar Lista, con sugerencia de foco inicial
        if (st_contabilidad_trabajo===null || st_contabilidad_nombre===''){
          //en caso no haya periodos ni ruc registrados, no tiene porque cargar
          cargaContabilidadesAnfitrion(params.documento_id,st_contabilidad_nombre);
          setContabilidadTrabajo(params.documento_id);
        }else{
          //en caso haya periodos y rucs, debe respetar el ambiente de trabajo anterior
          //cuidado con eliminar un ruc, el ambiente de trabajo podria desaparecer y generar bug ... ****
          cargaContabilidadesAnfitrion(st_contabilidad_trabajo,st_contabilidad_nombre);
          setContabilidadTrabajo(st_contabilidad_trabajo);
          setContabilidadNombre(st_contabilidad_nombre);
        }
        
        /////////////////////////////
        //NEW codigo para autenticacion y permisos de BD
        if (isAuthenticated && user && user.email) {
          cargaPermisosMenu(); //carga permisos menus
        }
  
    },[isAuthenticated, user]) //Aumentamos IsAuthenticated y user
  
    /*useEffect(() => {
      console.log('useEffect location.pathname: ',location.pathname);
      fetchTotalVentas();
    }, [location.pathname]);*/
  
    /*useEffect( ()=> {
      
        //Carga por cada cambio de seleccion en toggleButton
        console.log('2do useeffect periodo_trabajo: ',periodo_trabajo);
  
        //Verifica historial id_libro
        const st_id_libro = sessionStorage.getItem('id_libro');
        const st_valorVista = (sessionStorage.getItem('valorVista') || 'ventas'); //new para el toggleButton
  
        if (st_id_libro) {
          //Establecer valor historial al toggleButton
          setValorLibro(st_id_libro);
          setValorVista(st_valorVista);
        }
  
        if (st_valorVista===null || st_valorVista===undefined || st_valorVista===''){
        cargaPermisosMenuComando('20'); //Por default, la 1era vez
        setValorVista('ventas'); //Por default, la 1era vez
        //st_valorVista = 'ventas'; //new 
        }else{
        setValorVista(st_valorVista);
        }
        if (st_valorVista === 'ventas') {cargaPermisosMenuComando('20');}
  
        //fcuando carga x primera vez, sale vacio ... arreglar esto
        cargaRegistro(st_valorVista,periodo_trabajo,contabilidad_trabajo, diaSel);
      
        fetchTotalVentas();
    },[updateTrigger, diaSel]) //Aumentamos
  
    useEffect( ()=> {
      //Carga de Registros con permisos
      console.log('3ero useeffect periodo_trabajo: ',periodo_trabajo);
  
      const st_id_libro = sessionStorage.getItem('id_libro');
      const st_valorVista = sessionStorage.getItem('valorVista'); //para el toggleButton
      console.log('3ero useeffect st_id_libro: ',st_id_libro);
      if (st_id_libro) {
        //Establecer valor historial al toggleButton
        setValorLibro(st_id_libro);
        setValorVista(st_valorVista);
      }
  
      const st_periodo_trabajo = sessionStorage.getItem('periodo_trabajo'); //parametro necesario
      const st_contabilidad_trabajo = sessionStorage.getItem('contabilidad_trabajo'); //parametro necesario
  
      //Secundario despues de seleccion en toggleButton
      let columnasEspecificas;
      if (st_valorVista===null || st_valorVista===undefined || st_valorVista===''){
        columnasEspecificas = AdminVentasColumnas;
      }else{
        columnasEspecificas = 
            st_valorVista === 'ventas' ? AdminVentasColumnas
          : AdminCajaColumnas;
      }
  
      cargaColumnasComunes();        
      const combinado = [...columnasComunes, ...columnasEspecificas];
  
      //setColumnas([...columnasComunes, ...columnasEspecificas]);
      // Reordenamos (columna 4 → posición 7) Estetica para GRE
      //const ordenado = moveColumn(combinado, 3, 5); 
  
      // Finalmente seteamos
      setColumnas(combinado);    
  
      //cuando carga x primera vez, sale vacio ... arreglar esto
      cargaRegistro(st_valorVista,periodo_trabajo,contabilidad_trabajo, diaSel); //new cambio
  
      //Datos listos en caso de volver por aqui, para envio
      setDatosCarga(prevState => ({ ...prevState, id_anfitrion: params.id_anfitrion }));
      setDatosCarga(prevState => ({ ...prevState, periodo: st_periodo_trabajo }));
      setDatosCarga(prevState => ({ ...prevState, documento_id: st_contabilidad_trabajo }));
      setDatosCarga(prevState => ({ ...prevState, id_libro: st_id_libro }));
      setDatosCarga(prevState => ({ ...prevState, id_invitado: params.id_invitado }));
  
    },[permisosComando, pVenta0101, diaSel]) //Solo cuando este completo estado
    */

    //////////////////////////////////////////////////////////
    const cargaColumnasComunes = () =>{
      //Verificar que el resto de permisos de otros libros siempre esten FALSE
      //Solo el libro en cuestion, validara TRUE OR FALSE
  
      columnasComunes = [
        {
          name: '',
          width: isSmallScreen ?  '40px' : '30px',
          cell: (row) => (
            (pVenta0103) && (row.r_cod !== 'NV') ? 
            (
              <AdminSunatIcon
                comprobante_key={row.comprobante_key}
                comprobante={row.comprobante}
                cdr_pendiente={row.cdr_pendiente} //new
                elemento={row.elemento}
                firma={row.r_vfirmado}
                documentoId={params.documento_id}
                periodoTrabajo={periodo_trabajo}
                idAnfitrion={params.id_anfitrion}
                contabilidadTrabajo={contabilidad_trabajo}
                backHost={back_host}
                onRefresh={() => setUpdateTrigger(Math.random())} // ✅ refresca al cerrar el modal
                size={26}
              />
            ) : null
          ),
          allowOverflow: true,
          button: true,
        },
        {
          name: '',
          width: isSmallScreen ?  '40px' : '30px',
          cell: (row) => (
            (pVenta0102) && (row.r_vfirmado == null) ?
            (
              <DriveFileRenameOutlineIcon
                onClick={() => handleUpdate(row.comprobante_key,false)}
                style={{
                  cursor: 'pointer',
                  color: 'skyblue',
                  transition: 'color 0.3s ease',
                }}
              />
            )  
            : 
            (
              <FindInPageIcon
                onClick={() => handleUpdate(row.comprobante_key,true)}
                style={{
                  cursor: 'pointer',
                  color: 'gray',
                  transition: 'color 0.3s ease',
                }}
              />
  
            )
          ),
          allowOverflow: true,
          button: true,
        },
        {
          name: '',
          width: isSmallScreen ?  '40px' : '30px',
          cell: (row) => (
            (pVenta0103) && (row.r_vfirmado == null) ?
            (
              <DeleteIcon
                onClick={() => handleDelete(row.comprobante_key, row.elemento)}
                style={{
                  cursor: 'pointer',
                  color: 'orange',
                  transition: 'color 0.3s ease',
                }}
              />
            ) 
            : 
            (
              <ContentCopyIcon
                onClick={() => {
                    setShowModalMostrarClonar(true);
                    setValorComprobante(row.comprobante_key);
                    //clonarVenta(row.comprobante_key);
                    }
                  }
                style={{
                  cursor: 'pointer',
                  //color: 'primary',
                  transition: 'color 0.3s ease',
                }}
              />
  
            )
  
          ),
          allowOverflow: true,
          button: true,
        },
        {
          name: '',
          width: isSmallScreen ?  '40px' : '30px',
          cell: (row) => (
            (pVenta0103) && (row.r_cod !== 'NV') ? 
            (
              <AdminSunatGreIcon
                comprobante_gre={row.gre_ref}
                comprobante_venta={row.comprobante}
                destinatario_venta={{'destinatario_ruc_dni':row.r_documento_id, 'destinatario_razon_social':row.r_razon_social}}
                firma={row.gre_vfirmado}
                documentoId={params.documento_id}
                periodoTrabajo={periodo_trabajo}
                idAnfitrion={params.id_anfitrion}
                idInvitado={params.id_invitado} //new para GRE, identifica serie autorizada 
                contabilidadTrabajo={contabilidad_trabajo}
                backHost={back_host}
                onRefresh={() => setUpdateTrigger(Math.random())} // ✅ refresca al cerrar el modal
                size={26}
              />
            ) 
            : 
            ( //Auxiliamos con clonar para pedidos, en caso modo simple
            (pVenta0103) && (row.r_cod === 'NV') ? 
            (
              <ContentCopyIcon
                onClick={() => {
                    setShowModalMostrarClonar(true);
                    setValorComprobante(row.comprobante_key);
                    //clonarVenta(row.comprobante_key);
                    }
                  }
                style={{
                  cursor: 'pointer',
                  //color: 'primary',
                  transition: 'color 0.3s ease',
                }}
              />
            )
            : null
            )
          ),
          allowOverflow: true,
          button: true,
        },
  
      ];
    }
    const cargaPeriodosAnfitrion = (strHistorialPeriodo) =>{
      axios
      .get(`${back_host}/usuario/periodos/${params.id_anfitrion}`)
      .then((response) => {
        setPeriodosSelect(response.data);
        //console.log(response.data);
  
        if (strHistorialPeriodo === '' || strHistorialPeriodo === null){
          //Establecer 1er elemento en select
          if (response.data.length > 0) {
            setPeriodoTrabajo(response.data[0].periodo); 
            sessionStorage.setItem('periodo_trabajo',response.data[0].periodo);
          }
        }
        else{//Establecer elemento historial
          setPeriodoTrabajo(strHistorialPeriodo); 
          console.log('periodo_trabajo: ', periodo_trabajo);
          console.log('strHistorialPeriodo: ', strHistorialPeriodo);
        }
      })
      .catch((error) => {
          console.log(error);
      });
    }
    const cargaContabilidadesAnfitrion = (strHistorialContabilidad,strHistorialContabilidadNombre) =>{
      axios
      //Aqui debemos agregar restriccion de contabilidad por(usuario auxiliar)
      .get(`${back_host}/usuario/contabilidades/${params.id_anfitrion}/${params.id_invitado}`)
      .then((response) => {
        setContabilidadesSelect(response.data);
        if (strHistorialContabilidad === '' || strHistorialContabilidad === null){
          //Establecer 1er elemento en select
          if (response.data.length > 0) {
            setContabilidadTrabajo(response.data[0].documento_id); 
            setContabilidadNombre(response.data[0].razon_social); 
            sessionStorage.setItem('contabilidad_trabajo',response.data[0].documento_id);
          }
        }
        else{//Establecer elemento historial
          setContabilidadTrabajo(strHistorialContabilidad); 
          setContabilidadNombre(strHistorialContabilidadNombre); 
        }
      })
      .catch((error) => {
          console.log(error);
      });
    }
  
    const cargaPermisosMenu = async()=>{
      //console.log(`${back_host}/seguridadmenu/${params.id_anfitrion}/${params.id_invitado}`);
      //En caso de anfitrion debemos establecer permisos en true, sin consumir api de consulta 
      if (params.id_anfitrion===params.id_invitado){
        setPermisoVentas(true);
      }
      else{
          //Realiza la consulta a la API de permisos, puro Menu (obtenerTodosMenu)
          fetch(`${back_host}/seguridadmenu/${params.id_anfitrion}/${params.id_invitado}`, {
            method: 'GET',
            //headers: {
            //  'Authorization': 'TOKEN_DE_AUTORIZACION' // Si es necesario
            // }
          })
          .then(response => response.json())
          .then(permisosData => {
            // Guarda los permisos en el estado
            setPermisos(permisosData);
        
            let tienePermiso;
            // Verifica si existe el permiso de acceso 'ventas'
            tienePermiso = permisosData.some(permiso => permiso.id_menu === '01');
            if (tienePermiso) {
              setPermisoVentas(true);
            }
          })
          .catch(error => {
            console.log('Error al obtener los permisos:', error);
          });
      }
    };
  
    //////////////////////////////////////////////////////////
    const abrirCerrarModal = ()=>{
      setAbierto(!abierto);
    };
    const [abierto,setAbierto] = useState(false);
    const modalStyles={
      position:'absolute',
      top:'0%',
      left:'0%',
      background:'gray',
      border:'2px solid #000',
      padding:'16px 32px 24px',
      width:'100',
      minHeight: '50px'
      //transform:'translate(0%,0%)'
    };
    const handleCerrar = (updatedData) => {
      setDatosPopUp(updatedData); // Actualiza los datos con los datos modificados
      setAbierto(false); // Cierra el modal
    };
    //////////////////////////////////////////////////////
    const generaVenta = async () => {
      try {
        //dia
        const response = await axios.post(`${back_host}/ad_venta`, {
          id_anfitrion: params.id_anfitrion,
          documento_id: params.documento_id,
          periodo: periodo_trabajo,
          id_invitado: params.id_invitado,
          fecha: obtenerFecha(periodo_trabajo,true,diaSel),
        });
        
  
        if (response.data.success) {
          const sComprobanteAbierto = 'NP-0001-' + response.data.r_numero+'-1'; //aumentamos elemento
          const sComprobanteAbiertoRef = '-'; //modo directo sin ref
          //enviamos la edicion del registro abierto
          navigate(`/ad_venta/${params.id_anfitrion}/${params.id_invitado}/${periodo_trabajo}/${contabilidad_trabajo}/${sComprobanteAbierto}/${sComprobanteAbiertoRef}`);
        } else {
          //setError(response.data.message);
          console.log(response.data.message);
        }
      } catch (err) {
        //setError('Error al crear el pedido.');
        console.log('Error al crear el pedido.');
      }    
    };
    const clonarVenta = async (sComprobante) => {
      try {
        //console.log('dia sel para clonado: ... ', diaSel);
        const [COD, SERIE, NUMERO] = sComprobante.split('-');
  
         // Generar nuevo periodo desde fecha_clon
        const periodo_nuevo = fecha_clon.substring(0, 7);
        console.log('periodo_nuevo: ', periodo_nuevo);
  
        //dia
        const response = await axios.post(`${back_host}/ad_ventaclon`, {
          id_anfitrion: params.id_anfitrion,
          documento_id: params.documento_id,
          periodo: periodo_trabajo,
          id_invitado: params.id_invitado,
          fecha: fecha_clon,
          r_cod: COD,
          r_serie: SERIE,
          r_numero: NUMERO
        });
        
  
        if (response.data.success) {
          const sComprobanteAbierto = 'NP-0001-' + response.data.r_numero+'-1';//aumentamos elemento
          const sComprobanteAbiertoRef = sComprobante; //modo clonar con ref
          //enviamos la edicion del registro abierto
          navigate(`/ad_venta/${params.id_anfitrion}/${params.id_invitado}/${periodo_nuevo}/${contabilidad_trabajo}/${sComprobanteAbierto}/${sComprobanteAbiertoRef}`);
        } else {
          //setError(response.data.message);
          console.log(response.data.message);
        }
      } catch (err) {
        //setError('Error al crear el pedido.');
        console.log('Error al crear el pedido.');
      }    
    };
  
    const obtenerFecha = (periodo,bformatoBD,sDia) => {
      // Obtener el mes y año del parámetro "periodo" en formato "AAAA-MM"
      const [year, month] = periodo.split('-').map(Number);
    
      // Obtener la fecha actual
      const fechaActual = new Date();
      
      /*if (sDia!==''){
          //restamos 1 al mes, pinche manejo de fecha js
        const fechaSeleccionada = new Date(year, month-1, sDia); // Al pasar 0 en el día, se obtiene el último día del mes
        return formatearFecha(fechaSeleccionada,bformatoBD,sDia); // Retorna la fecha actual formateada
      }else{
        return formatearFecha(fechaActual,bformatoBD,sDia); // Retorna la fecha actual formateada
      }*/
  
      if (sDia==='' || sDia==='*'){
        return formatearFecha(fechaActual,bformatoBD,sDia); // Retorna la fecha actual formateada
      }else{
        //restamos 1 al mes, pinche manejo de fecha js
        const fechaSeleccionada = new Date(year, month-1, sDia); // Al pasar 0 en el día, se obtiene el último día del mes
        return formatearFecha(fechaSeleccionada,bformatoBD,sDia); // Retorna la fecha actual formateada
      }
    };
  
    // Función para formatear la fecha en DD/MM/YYYY
    const formatearFecha = (fecha,bformatoBD,sDia) => {
      let dia;
      if (sDia==='' || sDia==='*'){
        dia = String(fecha.getDate()).padStart(2, '0');
      }
      else {
        dia = sDia;      
      }
      
      const mes = String(fecha.getMonth() + 1).padStart(2, '0'); // Los meses en JavaScript son base 0
      const anio = fecha.getFullYear();
      if (bformatoBD) {
        return `${anio}-${mes}-${dia}`;
      }else{
        return `${dia}/${mes}/${anio}`;
      }
    };
  
  const handleDayFilter = (selectedDay) => {
    const dia = selectedDay === '*' ? '*' : selectedDay.toString().padStart(2, '0');
    setDiaSel(dia);
  };
    
  const [totalVentas, setTotalVentas] = useState(0);
  const [isSuper, setIsSuper] = useState(false);
  const fetchTotalVentas = async () => {
      try {
        const res = await axios.get(`${back_host}/ad_ventatotal/${periodo_trabajo}/${params.id_anfitrion}/${params.id_invitado}/${params.documento_id}/${diaSel}`);
        console.log('Tottales ventas: ', res.data);
        setTotalVentas(res.data.total);
        setIsSuper(res.data.super);
      } catch (error) {
        console.error('Error al obtener total de ventas', error);
      }
  }; 
  const [recaudaciones, setRecaudaciones] = useState([]);
  const [showModalMostrarRecaudacion, setShowModalMostrarRecaudacion] = useState(false);
  const [showModalMostrarClonar, setShowModalMostrarClonar] = useState(false);
  const handleClickTotal = (periodo,id_anfitrion,documento_id,dia) => {
    setShowModalMostrarRecaudacion(true);
    axios.get(`${back_host}/ad_ventarecaudacion/${periodo}/${id_anfitrion}/${documento_id}/${dia}`)
            .then(res => {
              if (res.data.success) {
                setRecaudaciones(res.data.data);
                console.log('Recaudaciones: ', res.data.data);
              }
            })
            .catch(err => console.error(err));
  };
  const handleOpenLink = (url) => {
      if (url) {
        window.open(url, "_blank"); 
        // "_blank" abre en nueva pestaña
        // "_self" reemplaza la pestaña actual
      } else {
        alert("⚠️ No hay documento disponible");
      }
    };

    const handleEditPresupuesto = (presupuesto) => {
      navigate(`/ad_ventapresupuesto/${params.id_anfitrion}/${params.id_invitado}/${periodo_trabajo || params.periodo}/${contabilidad_trabajo || params.documento_id}/${presupuesto.numero}/edit`);
    };
  
    const handleChange = e => {
      //Para todos los demas casos ;)
      if (e.target.name==="periodo"){
        console.log('cambiando en periodo');
        setPeriodoTrabajo(e.target.value);
        //En cada cambio, actualizar ultimo periodo seleccionado 
        sessionStorage.setItem('periodo_trabajo', e.target.value);
        //console.log('handleChange periodo_trabajo', e.target.value);
  
        setDiaSel("*"); //todo cambio de mes, evita dias incorrectos en meses 30,31,28,29
      }
      if (e.target.name==="contabilidad"){
        console.log('cambiando en contabilidad');
        setContabilidadTrabajo(e.target.value);
        //En cada cambio, actualizar ultima contabilidad seleccionada
        sessionStorage.setItem('contabilidad_trabajo', e.target.value);
        
        //filtramos su nombre para historial
        const opcionSeleccionada = contabilidad_select.find(opcion => opcion.documento_id === e.target.value).razon_social;
        sessionStorage.setItem('contabilidad_nombre', opcionSeleccionada);
        
        //debemos cambiar navigate, pra actualizar el dom
        fetchTotalVentas();
        setUpdateTrigger(Math.random());//experimento para actualizar el dom
        navigate(`/ad_ventapresupuesto/${params.id_anfitrion}/${params.id_invitado}/${periodo_trabajo}/${e.target.value}`);
      }
      if (e.target.name==="fecha_clon"){
        setFechaClon(e.target.value);
      }
      
      setUpdateTrigger(Math.random());//experimento para actualizar el dom
    }
        
  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: palette.bg,
        p: { xs: 2, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: 980, mx: "auto" }}>


        {/* HEADER */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography
              sx={{
                color: palette.text,
                fontWeight: 700,
                fontSize: "22px",
                lineHeight: 1.2,
              }}
            >
              Control de Presupuestos
            </Typography>
            <Typography sx={{ color: palette.muted, fontSize: "13px", mt: 0.5 }}>
              {data.length} presupuestos · {totalTrabajos} trabajos asociados
            </Typography>
          </Box>

          <AppButton
            icon={<Plus size={18} />}
            
            onClick={() => {
              navigate(`/ad_ventapresupuesto/${params.id_anfitrion}/${params.id_invitado}/${periodo_trabajo || params.periodo}/${contabilidad_trabajo || params.documento_id}/new`);
            }}
          >
            Nuevo presupuesto
          </AppButton>
          {/* BUSCADOR */}

          <AppSearch
            placeholder="Buscar presupuesto..."
            value={valorBusqueda}
            //onChange={(e) => setBuscar(e.target.value)}
            onChange={actualizaValorFiltro}
          />          
        </Box>

        {/* HEADER00 */}
        <Box
          sx={{
            display: "flex",
            flexDirection: {
              xs: "column",
              md: "row",
            },
            gap: 2,
            alignItems: {
              xs: "stretch",
              md: "end",
            },
            mb: 2,
            p: 2,
            borderRadius: 3,
            backgroundColor: palette.surface,
            border: `1px solid ${palette.border}`,
          }}
        >
          {/* PERIODO */}
          <Box sx={{ minWidth: { xs: "100%", md: 140 } }}>

            <Select
              fullWidth
              size="small"
              value={periodo_trabajo}
              name="periodo"
              sx={{
                display: 'block',
                margin: '.1rem 0', 
                color: palette.accent, 
                //¿backgroundColor: palette.surface, //new
                fontSize: '13px' 
              }}
              onChange={handleChange}
              // 👇 AQUÍ agregas los estilos para el menú desplegable
              MenuProps={{
                PaperProps: {
                  sx: {
                    //backgroundColor: '#f0f0f0', // <-- Cambia este color por el que quieras
                    bgcolor: palette.surface,
                    // 💡 EXTRA: También puedes cambiar el color cuando pasas el mouse (hover)
                    '& .MuiMenuItem-root': {
                      '&:hover': {
                        //backgroundColor: '#e0e0e0', // Color de hover
                        backgroundColor: palette.accent, // Color de hover
                      },
                      // Si quieres cambiar el color del texto de las opciones también:
                      //color: '#333', 
                      color: palette.text, 
                    }
                  }
                }
              }}
            >
              <MenuItem value="default">
                SELECCIONA
              </MenuItem>

              {periodo_select.map((elemento) => (
                <MenuItem
                  key={elemento.periodo}
                  value={elemento.periodo}
                >
                  {elemento.periodo}
                </MenuItem>
              ))}
            </Select>
          </Box>

          {/* EMPRESA */}
          <Box sx={{ flex: 1 }}>
            <Select
              fullWidth
              size="small"
              value={contabilidad_trabajo}
              name="contabilidad"
              sx={{display:'block',
                margin:'.1rem 0', color:palette.accent, fontSize: '13px' }}
              onChange={handleChange}
              // 👇 AQUÍ agregas los estilos para el menú desplegable
              MenuProps={{
                PaperProps: {
                  sx: {
                    //backgroundColor: '#f0f0f0', // <-- Cambia este color por el que quieras
                    bgcolor: palette.surface,
                    // 💡 EXTRA: También puedes cambiar el color cuando pasas el mouse (hover)
                    '& .MuiMenuItem-root': {
                      '&:hover': {
                        //backgroundColor: '#e0e0e0', // Color de hover
                        backgroundColor: palette.accent, // Color de hover
                      },
                      // Si quieres cambiar el color del texto de las opciones también:
                      //color: '#333', 
                      color: palette.text, 
                    }
                  }
                }
              }}

            >
              <MenuItem value="default">
                SELECCIONA
              </MenuItem>

              {contabilidad_select.map((elemento) => (
                <MenuItem
                  key={elemento.documento_id}
                  value={elemento.documento_id}
                >
                  {elemento.razon_social}
                </MenuItem>
              ))}
            </Select>
          </Box>

          {/* TOTAL */}
        </Box>


        <DaySelector period={'2026-06'} onDaySelect={handleDayFilter} />
        
        {/* TABLA */}
        <DataTable
          theme="solarized"
          columns={createColumns(handleEditPresupuesto)}
          data={data}
          pagination
          paginationPerPage={10}
          highlightOnHover
          responsive
          customStyles={customStyles}
        />

      </Box>

    </Box>
  );
}
