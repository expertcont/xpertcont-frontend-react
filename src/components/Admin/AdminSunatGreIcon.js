// src/components/SunatIcon.jsx
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

export default AdminSunatGreIcon;