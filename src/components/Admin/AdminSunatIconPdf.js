// src/components/SunatIcon.jsx
import { useState } from "react";
import axios from "axios";
import { useDialog } from "./AdminConfirmDialogProvider";
import {
  Dialog,
  DialogTitle,
  Button,
  useMediaQuery,
  DialogActions,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Sunat01Icon from "../../assets/images/pdf01.png";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import CodeIcon from "@mui/icons-material/Code";
import DescriptionIcon from "@mui/icons-material/Description";

const AdminSunatIconPdf = ({
  comprobante, // ej. "01-F001-12345"
  elemento,
  firma,
  documentoId,
  periodoTrabajo,
  idAnfitrion,
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
  const [showFormatoDialog, setShowFormatoDialog] = useState(false);
  const { confirmDialog } = useDialog();

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const handlePdf = async () => {
    const [COD, SERIE, NUMERO] = (comprobante || "").split("-");

    // Si ya está firmado, solo mostrar links
    /*if (firma !== "" && firma !== null) {
      const baseUrl = `${descargasHost}/descargas/${documentoId}`;
      setRutaXml(`${baseUrl}/${documentoId}-${COD}-${SERIE}-${NUMERO}.xml`);
      setRutaCdr(`${baseUrl}/R-${documentoId}-${COD}-${SERIE}-${NUMERO}.xml`);
      setRutaPdf(`${baseUrl}/${documentoId}-${COD}-${SERIE}-${NUMERO}.pdf`);
      setShowModal(true);
      return;
    }*/
    const baseUrl = `${descargasHost}/descargas/${documentoId}`;
    setRutaXml(`${baseUrl}/${documentoId}-${COD}-${SERIE}-${NUMERO}.xml`);
    setRutaCdr(`${baseUrl}/R-${documentoId}-${COD}-${SERIE}-${NUMERO}.xml`);
    setRutaPdf(`${baseUrl}/${documentoId}-${COD}-${SERIE}-${NUMERO}.pdf`);

    // Confirmación antes de enviar
    const result = await confirmDialog({
      title: "Procesar PDF?",
      message: `${comprobante}`,
      icon: "success",
      confirmText: "ENVIAR",
      cancelText: "CANCELAR",
    });

    if (!result.isConfirmed) return;

    // Mostrar el diálogo para seleccionar el formato
    setShowFormatoDialog(true);
  };

  const generarPdf = async (formato) => {
    const [COD, SERIE, NUMERO] = (comprobante || "").split("-");
    setShowFormatoDialog(false);
    console.log('Generando PDF formato:', formato);
    try {
      const response = await axios.post(`${backHost}/ad_ventacpepdf`, {
        p_periodo: periodoTrabajo,
        p_id_usuario: idAnfitrion,
        p_documento_id: contabilidadTrabajo,
        p_r_cod: COD,
        p_r_serie: SERIE,
        p_r_numero: NUMERO,
        p_elemento: elemento,
        p_formato: formato,
      });
      console.log(response);
      
      if (response.data?.codigo_hash) {
        setRutaXml(response.data.ruta_xml);
        setRutaCdr(response.data.ruta_cdr);
        setRutaPdf(response.data.ruta_pdf);
        setShowModal(true);
      }
    } catch (error) {
      await confirmDialog({
        title: "Error al generar PDF",
        message: `${comprobante}`,
        icon: "error",
        confirmText: "ACEPTAR",
      });
    }
  };

  /*const handleOpenLink = (url) => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };*/
  const handleOpenLink = (url) => {
    if (!url) return;

    // 👇 Agregamos un parámetro temporal para evitar que el navegador use la versión en caché
    const urlConBypassCache = `${url}?t=${Date.now()}`;

    window.open(urlConBypassCache, "_blank", "noopener,noreferrer");
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
        onClick={handlePdf}
        alt="Icono PDF"
        style={{
          cursor: "pointer",
          //filter: (firma == null || firma === "") ? "grayscale(0.8)" : "grayscale(0)",

          transition: "color 0.3s ease",
          width: size,
          height: size,
        }}
      />

      {/* Modal principal (enlaces XML/CDR/PDF) */}
      <Dialog
        open={showModal}
        onClose={handleCloseModal}
        maxWidth="md"
        disableScrollLock
        PaperProps={{
          style: {
            top: isSmallScreen ? "-20vh" : "0vh",
            marginTop: "10vh",
            background: "rgba(30, 39, 46, 0.95)",
            color: "white",
            width: isSmallScreen ? "70%" : "30%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          },
        }}
      >
        <DialogTitle>Datos - Emisión</DialogTitle>

        <Button
          variant="contained"
          color="inherit"
          onClick={() => handleOpenLink(rutaXml)}
          sx={{
            display: "flex",
            alignItems: "center",
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
          color="primary"
          onClick={() => handleOpenLink(rutaCdr)}
          sx={{
            display: "flex",
            alignItems: "center",
            margin: ".5rem 0",
            width: 270,
            mt: -0.5,
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
          sx={{
            display: "flex",
            alignItems: "center",
            margin: ".5rem 0",
            width: 270,
            mt: -0.5,
            fontWeight: "bold",
          }}
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

      {/* Diálogo para elegir formato */}
      <Dialog
        open={showFormatoDialog}
        onClose={() => setShowFormatoDialog(false)}
        maxWidth="xs"
        PaperProps={{
          style: {
            textAlign: "center",
            padding: "20px",
          },
        }}
      >
        <DialogTitle>Seleccionar formato de PDF</DialogTitle>
        <DialogActions
          sx={{ justifyContent: "center", flexDirection: "column", gap: 1 }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={() => generarPdf("A4")}
            sx={{ width: "150px", fontWeight: "bold" }}
          >
            A4
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => generarPdf("80mm")}
            sx={{ width: "150px", fontWeight: "bold" }}
          >
            80 mm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminSunatIconPdf;