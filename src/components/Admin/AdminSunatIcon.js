// src/components/SunatIcon.jsx
import { useState } from "react";
import axios from "axios";
import { useDialog } from "./AdminConfirmDialogProvider";
import { Dialog, DialogTitle, Button, useMediaQuery, InputAdornment, IconButton, TextField, Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Sunat01Icon from '../../assets/images/sunat0.png';
import TaskAltIcon from "@mui/icons-material/TaskAlt";   
import CodeIcon from '@mui/icons-material/Code';
import DescriptionIcon from '@mui/icons-material/Description';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

const AdminSunatIcon = ({
  comprobante_key,            // ej. "01-F001-12345" pero es KEY del registro
  comprobante,            // ej. "01-F001-12345" pero es para mostrar links
  cdr_pendiente,          // '1' o '0' o null  NEWW
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
  const [phone, setPhone] = useState("");

  const handleSunat = async () => {
    try {
      //kEY PARA PROCESAMIENTO SUNAT
      //const [COD, SERIE, NUMERO] = (comprobante_key || "").split("-");
      //comprobante(0) PARA MOSTRAR LINKS
      const [COD0, SERIE0, NUMERO0] = (comprobante || "").split("-");

      // Si ya está firmado, solo mostrar links
      //Pero si tiene cdr_pendiente, enviar de nuevo, api lo maneja

      if (firma !== "" && firma !== null) {
        const baseUrl = `${descargasHost}/descargas/${documentoId}`;
        setRutaXml(`${baseUrl}/${documentoId}-${COD0}-${SERIE0}-${NUMERO0}.xml`);
        setRutaCdr(`${baseUrl}/R-${documentoId}-${COD0}-${SERIE0}-${NUMERO0}.xml`);
        setRutaPdf(`${baseUrl}/${documentoId}-${COD0}-${SERIE0}-${NUMERO0}.pdf`);
        setShowModal(true);
        return;
      }

      // Confirmación antes de enviar
      await enviaSunat();

    } catch (error) {
      await confirmDialog({
        title: "Error en procesamiento Interno",
        message: `${error.message}`, //new
        icon: "error",
        confirmText: "ACEPTAR",
      });
    }

  };

  const enviaSunat = async () => {
      //kEY PARA PROCESAMIENTO SUNAT
      const [COD, SERIE, NUMERO] = (comprobante_key || "").split("-");
      //comprobante(0) PARA MOSTRAR LINKS
      //const [COD0, SERIE0, NUMERO0] = (comprobante || "").split("-");

      // Confirmación antes de enviar
      const result = await confirmDialog({
        title: "Enviar a SUNAT?",
        message: `${comprobante}`,
        icon: "success",
        confirmText: "ENVIAR",
        cancelText: "CANCELAR",
      });

      if (!result.isConfirmed) return;

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
      }else{
        await confirmDialog({
          title: "Error de envío SUNAT",
           message: `${comprobante} \n${response.data?.respuesta_sunat_descripcion || "SIN DETALLE"}`, //new
          icon: "error",
          confirmText: "ACEPTAR",
        });
      }
  };

  const enviaSunatReprocesoCDR = async () => {
      //kEY PARA PROCESAMIENTO SUNAT
      const [COD, SERIE, NUMERO] = (comprobante_key || "").split("-");
      //comprobante(0) PARA MOSTRAR LINKS
      //const [COD0, SERIE0, NUMERO0] = (comprobante || "").split("-");

      // Confirmación antes de enviar
      const result = await confirmDialog({
        title: "Solicitar a Sunat Descarga CDR?",
        message: `${comprobante}`,
        icon: "success",
        confirmText: "ENVIAR",
        cancelText: "CANCELAR",
      });

      if (!result.isConfirmed) return;

      const response = await axios.post(`${backHost}/ad_ventacpe`, {
        p_periodo: periodoTrabajo,
        p_id_usuario: idAnfitrion,
        p_documento_id: contabilidadTrabajo,
        p_r_cod: COD,
        p_r_serie: SERIE,
        p_r_numero: NUMERO,
        p_elemento: elemento,
      });
      
      //console.log('response del reproceso: ', response);
      if (response.data?.estado) {
        setRutaXml(response.data.ruta_xml);
        setRutaCdr(response.data.ruta_cdr);
        setRutaPdf(response.data.ruta_pdf);
      }else{
        await confirmDialog({
          title: "Error de solicitud CDR SUNAT",
           message: `${comprobante} \n${response.data?.respuesta_sunat_descripcion || "SIN DETALLE"}`, //new
          icon: "error",
          confirmText: "ACEPTAR",
        });
      }
  };

  const handleOpenLink = async (url) => {
    if (cdr_pendiente === '1') {
      // Si el CDR está pendiente, intentar reprocesar
      if (url.includes('R-')) {
        //console.log('Sí contiene R-');
        await enviaSunatReprocesoCDR();
      }
    }
    if (!url) return;

    // 👇 Agregamos un parámetro temporal para evitar que el navegador use la versión en caché
    const urlConBypassCache = `${url}?t=${Date.now()}`;

    window.open(urlConBypassCache, "_blank", "noopener,noreferrer");
  };

  const handleOpenLinkWhatsApp = async (sNumero) => {
    // Elimina cualquier caracter que no sea dígito
    let telefono = sNumero.replace(/\D/g, '');
    //agregar código de país si es necesario
    if (!telefono.startsWith('51')) {
      telefono = '51' + telefono; // Agrega código de país Perú
    }
    const mensaje =
      `expertcont.pe 👋\n` +
      `Te comparte tu comprobante electrónico:\n\n` +
      `📄 PDF:\n${rutaPdf}\n` +
      `📦 XML:\n${rutaXml}\n` +
      `✅ CDR:\n${rutaCdr}\n` + 
      `Copia y Pega en tu navegador`;

    const waUrl =
      `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;

    // 🔥 LÍNEA CLAVE
    window.open(waUrl, '_blank');

    //window.open(urlConBypassCache, "_blank", "noopener,noreferrer");
  };

  const handleCloseModal = () => {
    // ✅ dispara el refresco si te pasaron la función
    if (onRefresh) onRefresh();
    setShowModal(false);
  };

  return (
    <>
      {/* Ícono */}
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

      {/* Modal interno */}
      <Dialog
        open={showModal}
        onClose={handleCloseModal}
        maxWidth="md"
        disableScrollLock
        PaperProps={{
          style: {
            top: isSmallScreen ? "-20vh" : "0vh",
            left: isSmallScreen ? "0%" : "0%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: "10vh",
            background: "rgba(30, 39, 46, 0.95)",
            color: "white",
            width: isSmallScreen ? "70%" : "30%",
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

    <Box sx={{ position: "relative", width: 270 }}>
      {/* Centro: Icono + WSP */}
      <Box
        onClick={() => handleOpenLinkWhatsApp(phone)}
        sx={{
          position: "absolute",
          left: "42%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          //backgroundColor: "#374151",
          color: "#fff",
          px: 1.2,
          py: 0.4,
          borderRadius: 1,
          zIndex: 10,
          cursor: phone.length >= 9 ? "pointer" : "default",
          opacity: phone.length >= 9 ? 1 : 0.6,
          "&:hover": {
            backgroundColor:
              phone.length >= 9 ? "#4B5563" : "#374151"
          }
        }}
      >
        <WhatsAppIcon fontSize="medium" />
      </Box>

      {/* Input */}
      <TextField
        size="small"
        placeholder="Teléfono"
        value={phone}
        onChange={(e) =>
          setPhone(e.target.value.replace(/\D/g, ""))
        }
        sx={{
          width: "100%",
          height: 45,
          color: "white",
          "& .MuiInputBase-root": {
            color: "white",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
          },
          "& input": {
            paddingLeft: "133px"
          }
        }}
      />
    </Box>

        {/*
        <Button
          variant="contained"
          //color="info"
          onClick={() => handleOpenLinkWhatsApp('973586639')} //número de prueba
          sx={{ //display: "block", 
                display: "flex",          // 🔹 asegura layout en fila
                alignItems: "center",     // centra verticalmente
                //justifyContent: "flex-start", // texto alineado con el ícono            
                margin: ".5rem 0", 
                width: 270, 
                backgroundColor: "#374151", // color gris oscuro
                "&:hover": { backgroundColor: "#4B5563" }, // color gris más claro al pasar el mouse
                mt: -0.5, 
                fontWeight: "bold" }}
          startIcon={<WhatsAppIcon />}
        >
          WSP
        </Button>
        */} 

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

export default AdminSunatIcon;