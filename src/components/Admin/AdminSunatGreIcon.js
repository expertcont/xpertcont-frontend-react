import { useState,useEffect } from "react";
import axios from "axios";
import { useDialog } from "./AdminConfirmDialogProvider";
import {Dialog,DialogTitle,Button,useMediaQuery,TextField,MenuItem,Select,InputLabel,FormControl,Box} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Sunat01Icon from "../../assets/images/sunatgre2.png";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import CodeIcon from "@mui/icons-material/Code";
import DescriptionIcon from "@mui/icons-material/Description";

// 🔹 Ejemplo motivos SUNAT (puedes ampliar con los oficiales)
const motivosSunat = [
  { codigo: "01", descripcion: "Venta" },
  { codigo: "02", descripcion: "Compra" },
  { codigo: "04", descripcion: "Traslado entre establecimientos" },
  { codigo: "08", descripcion: "Exportación" },
  { codigo: "13", descripcion: "Otros" },
];

const AdminSunatGreIcon = ({
  comprobante_gre, // ej. "09-T001-321321"
  comprobante_venta, // ej. "01-F001-12345"
  elemento,
  firma,
  documentoId,
  periodoTrabajo,
  idAnfitrion,
  idInvitado, //New
  contabilidadTrabajo,
  backHost,
  size = 24,
  onRefresh,
  descargasHost = "http://74.208.184.113:8080",
}) => {
  const [showModal, setShowModal] = useState(false);
  const [rutaXml, setRutaXml] = useState("");
  const [rutaCdr, setRutaCdr] = useState("");
  const [rutaPdf, setRutaPdf] = useState("");

  // 🔹 nuevos estados
  const [motivo, setMotivo] = useState("");
  const [modalidad, setModalidad] = useState("");
  const [formData, setFormData] = useState({}); // datos dinámicos

  const { confirmDialog } = useDialog();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";

  // 🔹 useEffect para precargar datos si ya existen en BD
  useEffect(() => {
    if (!comprobante_gre) {
      console.log("modo nuevo, sin comprobante GRE");
      return;
    }
    console.log("Cargando datos GRE para:", comprobante_gre);
    

    //Si existe ref_gre (comprobante), entendemos modo edicion
    cargaRegistro(periodoTrabajo,idAnfitrion,documentoId, comprobante_gre);
    setMotivo(formData.guia_motivo_id); // valor de BD
    setModalidad(formData.guia_modalidad_id); // valor de BD
  }, [comprobante_gre]);

  const cargaRegistro = async (periodo_trabajo,id_anfitrion,contabilidad_trabajo,comprobanteGre) => {
    const [COD, SERIE, NUMERO] = comprobanteGre.split('-');
    //Cargamos asientos correspondientes al id_usuario,contabilidad y periodo
    const response = await fetch(`${back_host}/ad_ventagre/${periodo_trabajo}/${id_anfitrion}/${contabilidad_trabajo}/${COD}/${SERIE}/${NUMERO}`);
    
    const data = await response.json();
    setFormData(data);
    console.log("Datos GRE encontrados vamos:", data);
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

const handleGrabarBD = async () => {
    const [R_COD, R_SERIE, R_NUMERO] = (comprobante_venta || "").split("-");

    // Confirmación
    const result = await confirmDialog({
      title: "Grabar GRE?",
      message: `para Venta: ${comprobante_venta}`,
      icon: "success",
      confirmText: "GRABAR",
      cancelText: "CANCELAR",
    });
    if (!result.isConfirmed) return;

    try {
      // 🚀 Construcción de payload
      const payload = {
        periodo: periodoTrabajo,
        id_anfitrion: idAnfitrion,
        documento_id: contabilidadTrabajo,
        id_invitado: idInvitado,
        cod_emitir: '09', //fijo para GRE, en caso sea transportista, agregar Version
        // 🔹 nuevos parámetros
        fecha_emision: formData.fecha_emision,
        fecha_traslado: formData.fecha_traslado,
        guia_motivo_id: motivo,
        guia_modalidad_id: modalidad,
        transp_ruc: formData.transp_ruc,
        transp_razon_social: formData.transp_razon_social,
        conductor_dni: formData.conductor_dni,
        conductor_nombres: formData.conductor_nombres,
        conductor_apellidos: formData.conductor_apellidos,
        conductor_licencia: formData.conductor_licencia,
        vehiculo_placa: formData.vehiculo_placa,
        partida_ubigeo: formData.partida_ubigeo,
        partida_direccion: formData.partida_direccion,
        llegada_ubigeo: formData.llegada_ubigeo,
        llegada_direccion: formData.llegada_direccion,
        peso_total: formData.peso_total,
        ref_cod: R_COD,
        ref_serie: R_SERIE,
        ref_numero: R_NUMERO,
        // items (el proc almacenado los inserta automatico desde venta real)
      };
      const cod_emitir = '09'; //fijo para GRE, en caso sea transportista, agregar Version
      const response = await axios.post(`${backHost}/ad_ventagreref/${periodoTrabajo}/${idAnfitrion}/${contabilidadTrabajo}/${idInvitado}/${cod_emitir}`, payload);
      //Respuesta en axios envuelve resultado en (data) contiene cod,serie,numero de BD
      if (response.data?.cod) {
        //mostrar en controles
        alert(`GRE Generada: ${response.data.cod}-${response.data.serie}-${response.data.numero}`);
        //refrescar datos
        cargaRegistro(periodoTrabajo,idAnfitrion,documentoId, `${response.data.cod}-${response.data.serie}-${response.data.numero}`);
        //actualizar comprobante_gre
        //comprobante_gre = `${response.data.cod}-${response.data.serie}-${response.data.numero}`;
        //cerrar modal
        //setShowModal(false);
        //disparar refresco en padre
        if (onRefresh) onRefresh();
      }

    } catch (error) {
      await confirmDialog({
        title: "Error de insercion en BD",
        message: `para Venta: ${comprobante_venta}`,
        icon: "error",
        confirmText: "ACEPTAR",
      });
    }
   /*const cod_emitir = '09';
   alert(`${backHost}/ad_ventagreref/${periodoTrabajo}/${idAnfitrion}/${contabilidadTrabajo}/${idInvitado}/${cod_emitir}`);*/
  };

  const handleSunat = async () => {
    const [COD, SERIE, NUMERO] = (comprobante_gre || "").split("-");

    // Si ya está firmado → mostrar links
    if (firma !== "" && firma !== null) {
      const baseUrl = `${descargasHost}/descargas/${documentoId}`;
      setRutaXml(`${baseUrl}/${documentoId}-${COD}-${SERIE}-${NUMERO}.xml`);
      setRutaCdr(`${baseUrl}/R-${documentoId}-${COD}-${SERIE}-${NUMERO}.xml`);
      setRutaPdf(`${baseUrl}/${documentoId}-${COD}-${SERIE}-${NUMERO}.pdf`);
      setShowModal(true);
      return;
    }

    // Confirmación
    const result = await confirmDialog({
      title: "Enviar a SUNAT?",
      message: `${comprobante_gre}`,
      icon: "success",
      confirmText: "ENVIAR",
      cancelText: "CANCELAR",
    });
    if (!result.isConfirmed) return;

    try {
      // 🚀 Construcción de payload
      const payload = {
        p_periodo: periodoTrabajo,
        p_id_usuario: idAnfitrion,
        p_documento_id: contabilidadTrabajo,
        p_r_cod: COD,
        p_r_serie: SERIE,
        p_r_numero: NUMERO,
        p_elemento: elemento,

        // 🔹 nuevos parámetros
        guia: comprobante_gre, // renombrado
        fecha_emision: "2025-07-17", // puedes poner Date.now()
        hora_emision: "10:10:15",
        fecha_traslado: "2025-07-17",
        motivo_select: motivo,
        modalidad_select: modalidad,

        // Datos dinámicos según modalidad
        ...formData,

        // Ejemplo items (puedes traerlos de la venta real)
        items: [
          {
            cantidad: "7",
            producto: "POLLO A LA BRASA CON CHAUFA",
            codigo: "C00-1",
            codigo_unidad: "NIU",
          },
        ],
      };

      const response = await axios.post(`${backHost}/ad_ventacpe`, payload);

      if (response.data?.codigo_hash) {
        setRutaXml(response.data.ruta_xml);
        setRutaCdr(response.data.ruta_cdr);
        setRutaPdf(response.data.ruta_pdf);
        setShowModal(true);
      }
    } catch (error) {
      await confirmDialog({
        title: "Error de envío SUNAT",
        message: `${comprobante_gre}`,
        icon: "error",
        confirmText: "ACEPTAR",
      });
    }
  };

  const handleOpenLink = (url) => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCloseModal = () => {
    if (onRefresh) onRefresh();
    setShowModal(false);
  };

  return (
    <>
      {/* Ícono */}
      <img
        src={Sunat01Icon}
        onClick={() => setShowModal(true)}
        alt="Icono Sunat01"
        style={{
          cursor: "pointer",
          filter:
            firma == null || firma === "" ? "grayscale(0.8)" : "grayscale(0)",
          transition: "color 0.3s ease",
          width: size,
          height: size,
        }}
      />

      {/* Modal */}
      <Dialog
        open={showModal}
        onClose={handleCloseModal}
        maxWidth="md"
        disableScrollLock
        PaperProps={{
          style: {
            top: isSmallScreen ? "-40vh" : "0vh",
            left: isSmallScreen ? "-25%" : "0%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: "5vh",
            background: "rgba(30, 39, 46, 0.95)",
            color: "white",
            width: isSmallScreen ? "40%" : "30%",
            padding: "1rem",
          },
        }}
      >
        <DialogTitle>Emisión-GRE</DialogTitle>

        {/* Motivo */}
        <FormControl fullWidth sx={{ my: 1 }}>
          <InputLabel>Motivo</InputLabel>
          <Select
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            label="Motivo"
            name="motivo_select"
            size='small'
            sx={{display:'block',
                  //margin:'.4rem 0', 
                  mt:-1,
                  width: '320px',  // Establece el ancho fijo aquí
                  textAlign: 'center',  // Centrar el texto seleccionado
                  '.MuiSelect-select': { 
                    textAlign: 'center',  // Centrar el valor dentro del Select
                  },                                                         
                  color:"white"}}
          >
            {motivosSunat.map((m) => (
              <MenuItem key={m.codigo} value={m.codigo}>
                {m.descripcion}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Modalidad */}
        <FormControl fullWidth sx={{ my: 0 }}>
          <InputLabel>Modalidad</InputLabel>
          <Select
            value={modalidad}
            onChange={(e) => setModalidad(e.target.value)}
            label="Modalidad"
            name="modalidad_select"
            size='small'
            sx={{display:'block',
                  //margin:'.4rem 0', 
                  mt:-1,
                  width: '320px',  // Establece el ancho fijo aquí
                  textAlign: 'center',  // Centrar el texto seleccionado
                  '.MuiSelect-select': { 
                    textAlign: 'center',  // Centrar el valor dentro del Select
                  },                                                         
                  color:"white"}}
          >
            <MenuItem value="01">Público</MenuItem>
            <MenuItem value="02">Privado</MenuItem>
          </Select>
        </FormControl>

          <Box sx={{ width: "100%" }}>
            <TextField
              size="small"
              autoComplete="off"
              label="Ubigeo Partida"
              name="partida_ubigeo"
              value={formData.partida_ubigeo || ''}
              onChange={handleChange}
              sx={{ mt:0, }}
              inputProps={{ style:{color:'white',width: 290, textAlign: 'center'} }}
              InputLabelProps={{ style:{color:'white'} }}
            />
            <TextField
              autoComplete="off"
              size="small"
              label="Dirección Partida"
              name="partida_direccion"
              value={formData.partida_direccion || ''}
              onChange={handleChange}
              sx={{ mt:0, }}
              inputProps={{ style:{color:'white',width: 290, textAlign: 'center'} }}
              InputLabelProps={{ style:{color:'white'} }}
            />
            <TextField
              autoComplete="off"
              size="small"
              label="Ubigeo Llegada"
              name="llegada_ubigeo"
              value={formData.llegada_ubigeo || ''}
              onChange={handleChange}
              sx={{ mt:0, }}
              inputProps={{ style:{color:'white',width: 290, textAlign: 'center'} }}
              InputLabelProps={{ style:{color:'white'} }}
            />
            <TextField
              autoComplete="off"
              size="small"
              label="Dirección Llegada"
              name="llegada_direccion"
              value={formData.llegada_direccion || ''}
              onChange={handleChange}
              sx={{ mt:0, }}
              inputProps={{ style:{color:'white',width: 290, textAlign: 'center'} }}
              InputLabelProps={{ style:{color:'white'} }}
            />
            <TextField
              autoComplete="off"
              size="small"
              label="Peso Total"
              name="peso_total"
              value={formData.peso_total || ''}
              onChange={handleChange}
              sx={{ mt:0, }}
              inputProps={{ style:{color:'white',width: 290, textAlign: 'center'} }}
              InputLabelProps={{ style:{color:'white'} }}
            />
          </Box>

        {/* Campos dinámicos */}
        {modalidad === "01" && (
          <Box sx={{ width: "100%" }}>
            <TextField
              size="small"
              autoComplete="off"
              label="RUC Transportista"
              name="transp_ruc"
              value={formData.transp_ruc || ''}
              onChange={handleChange}
              sx={{ mt:0, }}
              inputProps={{ style:{color:'white',width: 290, textAlign: 'center'} }}
              InputLabelProps={{ style:{color:'white'} }}
            />
            <TextField
              size="small"
              autoComplete="off"
              label="Razón Social Transportista"
              name="transp_razon_social"
              value={formData.transp_razon_social || ''}
              onChange={handleChange}
              sx={{ mt:0, }}
              inputProps={{ style:{color:'white',width: 290, textAlign: 'center'} }}
              InputLabelProps={{ style:{color:'white'} }}
            />
          </Box>
        )}

        {modalidad === "02" && (
          <Box sx={{ width: "100%" }}>
            <TextField
              //fullWidth
              size="small"
              autoComplete="off"
              label="DNI Conductor"
              name="conductor_dni"
              value={formData.conductor_dni || ''}
              onChange={handleChange}
              sx={{ my: 0 }}
              inputProps={{ style:{color:'white',width: 290, textAlign: 'center'} }}
              InputLabelProps={{ style:{color:'white'} }}
            />
            <TextField
              autoComplete="off"
              size="small"
              label="Nombres Conductor"
              name="conductor_nombres"
              value={formData.conductor_nombres || ''}
              onChange={handleChange}
              sx={{ my: 0 }}
              inputProps={{ style:{color:'white',width: 290, textAlign: 'center'} }}
              InputLabelProps={{ style:{color:'white'} }}
            />
            <TextField
              autoComplete="off"
              size="small"
              label="Apellidos Conductor"
              name="conductor_apellidos"
              value={formData.conductor_apellidos || ''}
              onChange={handleChange}
              sx={{ my: 0 }}
              inputProps={{ style:{color:'white',width: 290, textAlign: 'center'} }}
              InputLabelProps={{ style:{color:'white'} }}
            />
            <TextField
              autoComplete="off"
              size="small"
              label="Licencia Conducir"
              name="conductor_licencia"
              value={formData.conductor_licencia || ''}
              onChange={handleChange}
              sx={{ my: 0 }}
              inputProps={{ style:{color:'white',width: 290, textAlign: 'center'} }}
              InputLabelProps={{ style:{color:'white'} }}
            />
            <TextField
              autoComplete="off"
              size="small"
              label="Placa Vehículo"
              name="vehiculo_placa"
              value={formData.vehiculo_placa || ''}
              onChange={handleChange}
              sx={{ mt:0, }}
              inputProps={{ style:{color:'white',width: 290, textAlign: 'center'} }}
              InputLabelProps={{ style:{color:'white'} }}
            />
          </Box>
        )}

        {!comprobante_gre && (
          <Box sx={{ width: "100%" }}>
          <Button
            variant="contained"
            color="success"
            onClick={handleGrabarBD}
            sx={{ //display: "block", 
                  display: "flex",          // 🔹 asegura layout en fila
                  alignItems: "center",     // centra verticalmente
                  margin: ".0rem 0", 
                  width: 320, 
                  mt: 0, 
                  //color: "black", 
                  //fontWeight: "bold",
              }}
            disabled={
                      !formData.partida_ubigeo 
                      || !formData.partida_direccion
                      || !formData.llegada_ubigeo 
                      || !formData.llegada_direccion
                      || !formData.peso_total
                      || !motivo 
                      || !modalidad
                      || (modalidad === "01" && ( !formData.transp_ruc || !formData.transp_razon_social ))
                      || (modalidad === "02" && ( !formData.conductor_dni || !formData.conductor_nombres || !formData.conductor_apellidos || !formData.conductor_licencia || !formData.vehiculo_placa ))
                      }
          >
            Grabar GRE
          </Button>
          </Box>
        )}

        
        <Box sx={{ width: "100%" }}>

          {comprobante_gre && (  
          <Button
            variant="contained"
            color="primary"
            onClick={handleSunat}
            sx={{ //display: "block", 
                  display: "flex",          // 🔹 asegura layout en fila
                  alignItems: "center",     // centra verticalmente
                  margin: ".0rem 0", 
                  width: 320, 
                  mt: 0, 
                  //color: "black", 
                  //fontWeight: "bold",
              }}
          >
            Enviar a SUNAT
          </Button>
          )}

        {rutaXml && (
          <Button
            variant="contained"
            color="inherit"
            onClick={() => handleOpenLink(rutaXml)}
            sx={{
              display: "block",
              margin: ".5rem 0",
              width: 320,
              backgroundColor: "rgba(30, 39, 46)",
              "&:hover": { backgroundColor: "rgba(30, 39, 46, 0.1)" },
              mt: -0.5,
            }}
            startIcon={<CodeIcon />}
          >
            XML
          </Button>
        )}
        {rutaCdr && (
          <Button
            variant="contained"
            color="success"
            onClick={() => handleOpenLink(rutaCdr)}
            sx={{
              display: "block",
              margin: ".5rem 0",
              width: 320,
              backgroundColor: "rgba(30, 39, 46)",
              "&:hover": { backgroundColor: "rgba(30, 39, 46, 0.1)" },
              mt: -0.5,
            }}
            startIcon={<TaskAltIcon />}
          >
            CDR
          </Button>
        )}
        {rutaPdf && (
          <Button
            variant="contained"
            color="warning"
            onClick={() => handleOpenLink(rutaPdf)}
            sx={{
              display: "block",
              margin: ".5rem 0",
              width: 320,
              backgroundColor: "rgba(30, 39, 46)",
              "&:hover": { backgroundColor: "rgba(30, 39, 46, 0.1)" },
              mt: -0.5,
            }}
            startIcon={<DescriptionIcon />}
          >
            PDF
          </Button>
        )}

        <Button
          variant="contained"
          onClick={handleCloseModal}
          sx={{
            display: "block",
            margin: ".0rem 0",
            width: 320,
            backgroundColor: "rgba(30, 39, 46)",
            "&:hover": { backgroundColor: "rgba(30, 39, 46, 0.1)" },
            mt: 0,
          }}
        >
          ESC - CERRAR
        </Button>
        </Box>

      </Dialog>
    </>
  );
};

export default AdminSunatGreIcon;


/*
import { useState } from "react";
import axios from "axios";
import { useDialog } from "./AdminConfirmDialogProvider";
import { Dialog, DialogTitle, Button, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Sunat01Icon from '../../assets/images/sunatgre2.png';
import TaskAltIcon from "@mui/icons-material/TaskAlt";   
import CodeIcon from '@mui/icons-material/Code';
import DescriptionIcon from '@mui/icons-material/Description';

const AdminSunatGreIcon = ({
  comprobante,            // ej. "01-F001-12345"
  elemento,               // tu valor de elemento
  firma,                  // string o null
  documentoId,            // params.documento_id
  periodoTrabajo,         // periodo_trabajo
  idAnfitrion,            // params.id_anfitrion
  contabilidadTrabajo,    // contabilidad_trabajo
  backHost,               // ej. "https://tu-backend.com"
  size = 24,              // tamaño del ícono
  onRefresh,              // ✅ función opcional para refrescar al cerrar el modal
  descargasHost = "http://74.208.184.113:8080", // opcional, por si cambia el host
}) => {
  const [showModal, setShowModal] = useState(false);
  const [rutaXml, setRutaXml] = useState("");
  const [rutaCdr, setRutaCdr] = useState("");
  const [rutaPdf, setRutaPdf] = useState("");
  const { confirmDialog } = useDialog(); //unico dialogo

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const handleSunat = async () => {
    const [COD, SERIE, NUMERO] = (comprobante || "").split("-");

    // Si ya está firmado, solo mostrar links
    if (firma !== "" && firma !== null) {
      const baseUrl = `${descargasHost}/descargas/${documentoId}`;
      setRutaXml(`${baseUrl}/${documentoId}-${COD}-${SERIE}-${NUMERO}.xml`);
      setRutaCdr(`${baseUrl}/R-${documentoId}-${COD}-${SERIE}-${NUMERO}.xml`);
      setRutaPdf(`${baseUrl}/${documentoId}-${COD}-${SERIE}-${NUMERO}.pdf`);
      setShowModal(true);
      return;
    }

    // Confirmación antes de enviar
    const result = await confirmDialog({
      title: "Enviar a SUNAT?",
      message: `${comprobante}`,
      icon: "success",
      confirmText: "ENVIAR",
      cancelText: "CANCELAR",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await axios.post(`${backHost}/ad_ventacpe`, {
        p_periodo: periodoTrabajo,
        p_id_usuario: idAnfitrion,
        p_documento_id: contabilidadTrabajo,
        p_r_cod: COD,
        p_r_serie: SERIE,
        p_r_numero: NUMERO,
        p_elemento: elemento,
      });

      if (response.data?.codigo_hash) {
        setRutaXml(response.data.ruta_xml);
        setRutaCdr(response.data.ruta_cdr);
        setRutaPdf(response.data.ruta_pdf);
        setShowModal(true);
      }
    } catch (error) {
      await confirmDialog({
        title: "Error de envío SUNAT",
        message: `${comprobante}`,
        icon: "error",
        confirmText: "ACEPTAR",
      });
    }
  };

  const handleOpenLink = (url) => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCloseModal = () => {
    // ✅ dispara el refresco si te pasaron la función
    if (onRefresh) onRefresh();
    setShowModal(false);
  };

  return (
    <>
      <img
        src={Sunat01Icon}
        onClick={handleSunat}
        alt="Icono Sunat01"
        style={{
          cursor: "pointer",
          filter: (firma == null || firma === "") ? "grayscale(0.8)" : "grayscale(0)",
          transition: "color 0.3s ease",
          width: size,
          height: size,
        }}
      />

      <Dialog
        open={showModal}
        onClose={handleCloseModal}
        maxWidth="md"
        disableScrollLock
        PaperProps={{
          style: {
            top: isSmallScreen ? "-40vh" : "0vh",
            left: isSmallScreen ? "-25%" : "0%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: "10vh",
            background: "rgba(30, 39, 46, 0.95)",
            color: "white",
            width: isSmallScreen ? "40%" : "30%",
          },
        }}
      >
        <DialogTitle>Datos - Emisión</DialogTitle>

        <Button
          variant="contained"
          //color="primary"
          color="inherit"
          onClick={() => handleOpenLink(rutaXml)}
          sx={{ //display: "block", 
                display: "flex",          // 🔹 asegura layout en fila
                alignItems: "center",     // centra verticalmente
                margin: ".5rem 0", 
                width: 270,
                color: "black", 
                fontWeight: "bold",
                }}
          startIcon={<CodeIcon />} 
        >
          XML
        </Button>

        <Button
          variant="contained"
          //color="inherit"
          color="primary"
          onClick={() => handleOpenLink(rutaCdr)}
          sx={{ //display: "block", 
                display: "flex",          // 🔹 asegura layout en fila
                alignItems: "center",     // centra verticalmente
                margin: ".5rem 0", 
                width: 270, 
                mt: -0.5, 
                //color: "black", 
                fontWeight: "bold",
             }}
          startIcon={<TaskAltIcon />} 
        >
          CDR
        </Button>

        <Button
          variant="contained"
          color="warning"
          onClick={() => handleOpenLink(rutaPdf)}
          sx={{ //display: "block", 
                display: "flex",          // 🔹 asegura layout en fila
                alignItems: "center",     // centra verticalmente
                //justifyContent: "flex-start", // texto alineado con el ícono            
                margin: ".5rem 0", 
                width: 270, 
                mt: -0.5, 
                fontWeight: "bold" }}
          startIcon={<DescriptionIcon />}
        >
          PDF
        </Button>

        <Button
          variant="contained"
          onClick={handleCloseModal}
          sx={{
            display: "block",
            margin: ".5rem 0",
            width: 270,
            backgroundColor: "rgba(30, 39, 46)",
            "&:hover": { backgroundColor: "rgba(30, 39, 46, 0.1)" },
            mt: -0.5,
          }}
        >
          ESC - CERRAR
        </Button>
      </Dialog>
    </>
  );
};

export default AdminSunatGreIcon;*/