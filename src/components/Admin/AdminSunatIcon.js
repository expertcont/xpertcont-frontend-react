// src/components/SunatIcon.jsx
import { useState } from "react";
import axios from "axios";
import { useDialog } from "./AdminConfirmDialogProvider";
import { Dialog, DialogTitle, Button, useMediaQuery, TextField, Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Sunat01Icon from '../../assets/images/sunat0.png'; //Azul
import Sunat03Icon from '../../assets/images/sunat9.png'; //Granate
import TaskAltIcon from "@mui/icons-material/TaskAlt";   
import CodeIcon from '@mui/icons-material/Code';
import DescriptionIcon from '@mui/icons-material/Description';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import palette from '../../theme/palette';

const modalPaperSx = {
  m: { xs: 1.5, sm: 2 },
  mt: { xs: 1.5, sm: 5 },
  width: { xs: "calc(100vw - 24px)", sm: 420 },
  maxWidth: "calc(100vw - 24px)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  backgroundColor: palette.surface,
  color: palette.text,
  border: `1px solid ${palette.border}`,
  borderRadius: 2,
  boxShadow: "0 18px 48px rgba(0,0,0,0.34)",
  overflow: "hidden",
};

const documentButtonSx = {
  width: 270,
  height: 40,
  justifyContent: "center",
  borderRadius: 2,
  backgroundColor: "rgba(139,154,165,0.10)",
  border: "1px solid rgba(139,154,165,0.16)",
  color: "rgba(255,255,255,0.90)",
  boxShadow: "none",
  fontSize: "12px",
  fontWeight: 500,
  textAlign: "center",
  position: "relative",
  "& .MuiButton-startIcon": {
    position: "absolute",
    left: 18,
    m: 0,
    color: "#7ddbd3",
  },
  "&:hover": {
    backgroundColor: "rgba(42,161,152,0.14)",
    borderColor: "rgba(42,161,152,0.28)",
    boxShadow: "none",
  },
};

const pdfButtonSx = {
  ...documentButtonSx,
  backgroundColor: "rgba(42,161,152,0.20)",
  border: "1px solid rgba(42,161,152,0.38)",
  color: "rgba(255,255,255,0.94)",
  fontWeight: 600,
  "& .MuiButton-startIcon": {
    ...documentButtonSx["& .MuiButton-startIcon"],
    color: "#8ee0d8",
  },
  "&:hover": {
    backgroundColor: "rgba(42,161,152,0.28)",
    borderColor: "rgba(42,161,152,0.48)",
    boxShadow: "0 8px 18px rgba(42,161,152,0.12)",
  },
};

const phoneFieldSx = {
  width: 270,
  "& .MuiOutlinedInput-root": {
    height: 40,
    color: palette.text,
    backgroundColor: "rgba(26,33,39,0.48)",
    borderRadius: 2,
    "& fieldset": { borderColor: "rgba(139,154,165,0.14)" },
    "&:hover fieldset": { borderColor: "rgba(42,161,152,0.28)" },
    "&.Mui-focused fieldset": { borderColor: "rgba(42,161,152,0.45)" },
  },
  "& input": {
    color: palette.text,
    fontSize: "13px",
    textAlign: "center",
  },
  "& input::placeholder": {
    color: palette.muted,
    opacity: 1,
  },
};

const closeButtonSx = {
  width: 270,
  height: 40,
  justifyContent: "center",
  borderRadius: 2,
  backgroundColor: "rgba(139,154,165,0.10)",
  border: "1px solid rgba(139,154,165,0.16)",
  color: palette.text,
  boxShadow: "none",
  fontSize: "12px",
  fontWeight: 500,
  "&:hover": {
    backgroundColor: "rgba(139,154,165,0.16)",
    boxShadow: "none",
  },
};

const downloadInfoSx = {
  width: 270,
  mt: 0.75,
  color: palette.muted,
  textAlign: "center",
  fontSize: "11px",
  fontWeight: 500,
  lineHeight: 1.45,
};

const comprobanteInfoSx = {
  width: 270,
  mt: 1.5,
  color: "rgba(255,255,255,0.96)",
  textAlign: "center",
  fontSize: "13px",
  fontWeight: 600,
  lineHeight: 1.25,
};

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
  cdr_nivel,                //ACEPTADO,RECHAZADO,PENDIENTE
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

  const obtenerErrorSunat = (errorOrData) => {
    const responseData = errorOrData?.response?.data || errorOrData?.data || errorOrData || {};
    const data = responseData?.error || responseData;
    const nivel = data?.nivel || "ERROR";

    const tituloPorNivel = {
      RECHAZADO: "Comprobante rechazado",
      PENDIENTE: "CDR pendiente",
      ERROR: "No se pudo enviar a SUNAT",
    };

    const mensaje =
      data?.mensaje_usuario ||
      data?.respuesta_sunat_descripcion ||
      data?.detalle_tecnico ||
      data?.message ||
      errorOrData?.message ||
      "SIN DETALLE";

    return {
      titulo: data?.titulo_usuario || tituloPorNivel[nivel] || tituloPorNivel.ERROR,
      mensaje,
      detalle: data?.detalle_tecnico,
    };
  };

  const mostrarErrorSunat = async (errorOrData, tituloFallback = "No se pudo enviar a SUNAT") => {
    const errorSunat = obtenerErrorSunat(errorOrData);
    const detalle = errorSunat.detalle && errorSunat.detalle !== errorSunat.mensaje
      ? `\n\nDetalle: ${errorSunat.detalle}`
      : "";

    await confirmDialog({
      title: errorSunat.titulo || tituloFallback,
      message: `${comprobante}\n${errorSunat.mensaje}${detalle}`,
      icon: "error",
      confirmText: "ACEPTAR",
    });
  };

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
      await mostrarErrorSunat(error, "Error en procesamiento Interno");
    }

  };

  const enviaSunat = async () => {
      //kEY PARA PROCESAMIENTO SUNAT
      const [COD, SERIE, NUMERO] = (comprobante_key || "").split("-");
      //comprobante(0) PARA MOSTRAR LINKS
      //const [COD0, SERIE0, NUMERO0] = (comprobante || "").split("-");

      // Confirmacion antes de enviar
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
          return;
        }

        await mostrarErrorSunat(response.data, "Error de envio SUNAT");
      }
      catch (error) {
        await mostrarErrorSunat(error, "Error de envio SUNAT");
      }
  };
  const enviaSunatReprocesoCDR = async () => {
      //kEY PARA PROCESAMIENTO SUNAT
      const [COD, SERIE, NUMERO] = (comprobante_key || "").split("-");
      //comprobante(0) PARA MOSTRAR LINKS
      //const [COD0, SERIE0, NUMERO0] = (comprobante || "").split("-");

      // Confirmacion antes de enviar
      const result = await confirmDialog({
        title: "Solicitar a Sunat Descarga CDR?",
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

        //console.log('response del reproceso: ', response);
        if (response.data?.estado) {
          setRutaXml(response.data.ruta_xml);
          setRutaCdr(response.data.ruta_cdr);
          setRutaPdf(response.data.ruta_pdf);
          return;
        }

        await mostrarErrorSunat(response.data, "Error de solicitud CDR SUNAT");
      }
      catch (error) {
        await mostrarErrorSunat(error, "Error de solicitud CDR SUNAT");
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
  // 📞 limpiar número
  let telefono = sNumero.replace(/\D/g, '');
  if (!telefono.startsWith('51')) {
    telefono = '51' + telefono;
  }
  const BACKEND_DESCARGAS = 'https://xpertcont-backend-js-production-50e6.up.railway.app';
  
  // 🔧 normalizar rutas
  const pathPdf = normalizarRutaDescarga(rutaPdf);
  const pathXml = normalizarRutaDescarga(rutaXml);
  const pathCdr = normalizarRutaDescarga(rutaCdr);

  // 🌍 nuevas rutas limpias
  const pdfFinal = `${BACKEND_DESCARGAS}${pathPdf}`;
  const xmlFinal = `${BACKEND_DESCARGAS}${pathXml}`;
  const cdrFinal = `${BACKEND_DESCARGAS}${pathCdr}`;

  // 💬 mensaje WhatsApp
  const mensaje =
    `expertcont.pe 👋\n` +
    `Te comparte tu comprobante electrónico:\n\n` +
    `📄 PDF:\n${pdfFinal}\n` +
    `📦 XML:\n${xmlFinal}\n` +
    `✅ CDR:\n${cdrFinal}\n\n` +
    `Copia y pega en tu navegador de preferencia.`;

  const waUrl = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;

  window.open(waUrl, '_blank');
};
  
  const normalizarRutaDescarga = (urlOriginal) => {
    if (!urlOriginal) return '';

    try {
      const url = new URL(urlOriginal);
      return url.pathname; // 👉 /descargas/20614126435/archivo.pdf
    } catch (error) {
      // fallback por si llega algo raro
      const index = urlOriginal.indexOf('/descargas/');
      return index !== -1 ? urlOriginal.substring(index) : '';
    }
  };

  const handleCloseModal = () => {
    // ✅ dispara el refresco si te pasaron la función
    if (onRefresh) onRefresh();
    setShowModal(false);
  };
  
  const getSunatIcon = () => {

    switch (cdr_nivel) {
        case "ACEPTADO":
            return Sunat01Icon;

        case "RECHAZADO":
            return Sunat03Icon;
        
        //Muy pronto :)
        //case "OBSERVADO":
        //    return SunatNaranja;

        default:
            return Sunat01Icon;
    }
};
  return (
    <>
      {/* Ícono */}
      <img
        src={getSunatIcon()}
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
          sx: {
            ...modalPaperSx,
            top: isSmallScreen ? "-20vh" : "0vh",
            left: isSmallScreen ? "0%" : "0%",
            mt: "10vh",
            width: isSmallScreen ? "min(360px, 70vw)" : 420,
          },
        }}
      >
        <DialogTitle
          sx={{
            width: "100%",
            py: 1.5,
            color: "rgba(255,255,255,0.92)",
            fontSize: "14px",
            fontWeight: 600,
            textAlign: "center",
            backgroundColor: palette.surfaceAlt,
            borderBottom: `1px solid ${palette.border}`,
          }}
        >
          Links de descarga
        </DialogTitle>

        <Typography sx={comprobanteInfoSx}>
          {comprobante}
        </Typography>

        <Typography sx={downloadInfoSx}>
          Puede descargar o enviar estos links por WhatsApp.
        </Typography>

        <Button
          variant="contained"
          onClick={() => handleOpenLink(rutaXml)}
          sx={{ ...documentButtonSx, mt: 1.5 }}
          startIcon={<CodeIcon />} 
        >
          Descargar XML
        </Button>

        <Button
          variant="contained"
          onClick={() => handleOpenLink(rutaCdr)}
          sx={{ ...documentButtonSx, mt: 1 }}
          startIcon={<TaskAltIcon />} 
        >
          Descargar CDR
        </Button>

        <Button
          variant="contained"
          onClick={() => handleOpenLink(rutaPdf)}
          sx={{ ...pdfButtonSx, mt: 1 }}
          startIcon={<DescriptionIcon />}
        >
          Descargar PDF
        </Button>

    <Box sx={{ position: "relative", width: 270, mt: 1 }}>
      {/* Centro: Icono + WSP */}
      <Box
        onClick={() => handleOpenLinkWhatsApp(phone)}
        sx={{
          position: "absolute",
          left: 16,
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          color: phone.length >= 9 ? "#7ddbd3" : palette.muted,
          px: 1.2,
          py: 0.4,
          borderRadius: 1,
          zIndex: 10,
          cursor: phone.length >= 9 ? "pointer" : "default",
          opacity: phone.length >= 9 ? 1 : 0.6,
          "&:hover": {
            backgroundColor:
              phone.length >= 9 ? "rgba(42,161,152,0.14)" : "transparent"
          }
        }}
      >
        <WhatsAppIcon fontSize="medium" />
      </Box>

      {/* Input */}
      <TextField
        size="small"
        placeholder="Teléfono"
        autoComplete="off"
        value={phone}
        onChange={(e) =>
          setPhone(e.target.value.replace(/\D/g, ""))
        }
        sx={{
          ...phoneFieldSx,
          "& input": {
            ...phoneFieldSx["& input"],
            paddingLeft: "48px",
            paddingRight: "16px",
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
          sx={{ ...closeButtonSx, my: 2 }}
        >
          ESC - CERRAR
        </Button>
      </Dialog>
    </>
  );
};

export default AdminSunatIcon;
