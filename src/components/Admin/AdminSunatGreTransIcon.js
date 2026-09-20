import { useMemo, useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import CodeIcon from "@mui/icons-material/Code";
import DescriptionIcon from "@mui/icons-material/Description";
import SunatGreIcon from "../../assets/images/sunatgre2.png";
import { useDialog } from "./AdminConfirmDialogProvider";

const panelSx = {
  background: "linear-gradient(180deg, rgba(20,29,38,0.98), rgba(13,20,28,0.98))",
  border: "1px solid rgba(148,163,184,0.2)",
  boxShadow: "0 24px 70px rgba(0,0,0,0.45)",
  color: "rgba(255,255,255,0.92)",
};

const inputSx = {
  "& .MuiInputBase-root": {
    color: "rgba(255,255,255,0.92)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  "& .MuiInputLabel-root": { color: "rgba(226,232,240,0.72)" },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(148,163,184,0.22)" },
};

const buttonSx = {
  borderRadius: 1,
  textTransform: "none",
  fontWeight: 800,
};

const docKey = (item = {}) => (
  [
    item.r_cod,
    item.r_serie,
    item.r_numero,
    item.elemento || 1,
  ].filter(Boolean).join("-")
);

const compact = (value) => (value || "").toString().trim();

const normalizarSerieGrem = (value) => {
  const serie = compact(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
  const serieRemitente = serie.match(/^T(\d{3})$/);
  if (serieRemitente) return `V${serieRemitente[1]}`;
  return /^V\d{3}$/.test(serie) ? serie : "V001";
};

const defaultForm = (row = {}, cantidad = 1) => ({
  serie: normalizarSerieGrem(row.grem_serie),
  numero: row.grem_numero || "",
  fecha_traslado: (row.r_fecemi || "").slice(0, 10),
  motivo_traslado_id: "01",
  modalidad_traslado_id: "01",
  partida_ubigeo: row.punto_venta_ubigeo || row.partida_ubigeo || "",
  partida_direccion: row.punto_venta_direccion || row.partida_direccion || row.remitente_direccion || row.cliente_direccion || "",
  llegada_ubigeo: row.punto_venta_dest_ubigeo || row.llegada_ubigeo || "",
  llegada_direccion: row.punto_venta_dest_direccion || row.llegada_direccion || row.destinatario_direccion || "",
  placa: row.placa || "",
  licencia: row.licencia || "",
  conductor_documento_id: "",
  conductor_nombres: "",
  conductor_apellidos: "",
  peso_total: String(Math.max(cantidad, 1)),
  numero_bultos: String(Math.max(cantidad, 1)),
  observacion: "",
});

const fieldGroupTitleSx = {
  fontSize: 11,
  fontWeight: 900,
  color: "#8fc7ff",
  textTransform: "uppercase",
  letterSpacing: 0,
};

const fieldGridSx = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
  gap: 1,
};

const AdminSunatGreTransIcon = ({
  encomienda,
  encomiendas,
  periodoTrabajo,
  idAnfitrion,
  documentoId,
  contabilidadTrabajo,
  idInvitado,
  backHost,
  onRefresh,
  size = 18,
  disabled = false,
  variant = "icon",
  label = "Emitir GRE",
}) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const { confirmDialog } = useDialog();
  const seleccion = useMemo(
    () => (Array.isArray(encomiendas) && encomiendas.length > 0 ? encomiendas : [encomienda]).filter(Boolean),
    [encomienda, encomiendas]
  );
  const baseRow = seleccion[0] || {};
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaultForm(baseRow, seleccion.length));
  const [loading, setLoading] = useState(false);
  const [payloadPreview, setPayloadPreview] = useState("");
  const [rutas, setRutas] = useState({ xml: "", cdr: "", pdf: "" });

  const gremFirmada = compact(baseRow.grem_vfirmado);
  const gremComprobante = [baseRow.grem_cod || "31", baseRow.grem_serie, baseRow.grem_numero].filter(Boolean).join("-");
  const resumenRuta = [baseRow.nombre_ruta || baseRow.rutaLabel, baseRow.id_ruta].filter(Boolean).join(" - ");
  const destinoPrincipal = baseRow.destinatario || baseRow.punto_venta_dest_nombre || baseRow.id_punto_venta_dest || "";
  const formIncompleto = !form.serie ||
    !form.fecha_traslado ||
    !form.motivo_traslado_id ||
    !form.modalidad_traslado_id ||
    !form.partida_ubigeo ||
    !form.partida_direccion ||
    !form.llegada_ubigeo ||
    !form.llegada_direccion ||
    !form.peso_total ||
    Number(form.peso_total) <= 0 ||
    !form.numero_bultos ||
    Number(form.numero_bultos) <= 0 ||
    !form.placa ||
    !form.licencia ||
    !form.conductor_documento_id ||
    !form.conductor_nombres ||
    !form.conductor_apellidos;

  const documentos = seleccion.map((item) => ({
    r_cod: item.r_cod,
    r_serie: item.r_serie,
    r_numero: item.r_numero,
    elemento: item.elemento || 1,
  }));

  const requestBody = (soloPayload = false) => ({
    periodo: periodoTrabajo,
    id_usuario: idAnfitrion,
    documento_id: documentoId || contabilidadTrabajo,
    id_invitado: idInvitado,
    ctrl_mod_us: idInvitado,
    solo_payload: soloPayload,
    guia: {
      ...form,
      serie: normalizarSerieGrem(form.serie),
      codigo: "31",
    },
    encomiendas: documentos,
  });

  const resetAndOpen = () => {
    if (disabled) return;
    setForm(defaultForm(baseRow, seleccion.length));
    setPayloadPreview("");
    setRutas({ xml: "", cdr: "", pdf: "" });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    if (onRefresh) onRefresh();
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const mostrarError = async (error, title = "Error GRE Transportista") => {
    const data = error?.response?.data || error?.data || error || {};
    await confirmDialog({
      title,
      message: data.mensaje_usuario || data.respuesta_sunat_descripcion || data.message || "No se pudo procesar la GRE Transportista.",
      icon: "error",
      confirmText: "ACEPTAR",
    });
  };

  const handlePayload = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${backHost}/mve_transventa/grem/payload`, requestBody(true));
      setPayloadPreview(JSON.stringify(response.data?.payload || response.data, null, 2));
    } catch (error) {
      await mostrarError(error, "No se pudo armar payload");
    } finally {
      setLoading(false);
    }
  };

  const handleEnviar = async () => {
    const result = await confirmDialog({
      title: "Enviar GRE Transportista?",
      message: `${seleccion.length} encomienda(s) seleccionada(s).`,
      icon: "success",
      confirmText: "ENVIAR",
      cancelText: "CANCELAR",
    });
    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      const response = await axios.post(`${backHost}/mve_transventa/grem/sunat`, requestBody(false));
      setRutas({
        xml: response.data?.ruta_xml || "",
        cdr: response.data?.ruta_cdr || "",
        pdf: response.data?.ruta_pdf || "",
      });
      await confirmDialog({
        title: response.data?.persistencia_advertencia ? "GRE enviada con advertencia" : "GRE Transportista enviada",
        message: response.data?.persistencia_advertencia || response.data?.respuesta_sunat_descripcion || response.data?.mensaje_usuario || "SUNAT proceso la GRE Transportista.",
        icon: response.data?.persistencia_advertencia ? "warning" : "success",
        confirmText: "ACEPTAR",
      });
      if (onRefresh) onRefresh();
    } catch (error) {
      await mostrarError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLink = (url) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      {variant === "button" ? (
        <Button
          sx={buttonSx}
          onClick={resetAndOpen}
          disabled={disabled}
          variant="contained"
          startIcon={(
            <Box
              component="img"
              src={SunatGreIcon}
              alt=""
              sx={{
                width: size,
                height: size,
                objectFit: "contain",
                filter: gremFirmada ? "grayscale(0)" : "grayscale(0.65)",
              }}
            />
          )}
        >
          {label}
        </Button>
      ) : (
        <img
          src={SunatGreIcon}
          onClick={resetAndOpen}
          alt="GRE Transportista"
          style={{
            width: size,
            height: size,
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.45 : 1,
            filter: gremFirmada ? "grayscale(0)" : "grayscale(0.65)",
            display: "block",
          }}
        />
      )}

      <Dialog
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            ...panelSx,
            width: isSmallScreen ? "min(94vw, 440px)" : 680,
            maxWidth: "94vw",
            p: 0,
          },
        }}
      >
        <DialogTitle sx={{ py: 1.3, display: "flex", gap: 1, alignItems: "center" }}>
          <LocalShippingIcon sx={{ color: "#8fc7ff" }} />
          <Box>
            <Typography sx={{ fontSize: 15, fontWeight: 900 }}>GRE Transportista</Typography>
            <Typography sx={{ fontSize: 11.5, color: "rgba(226,232,240,0.68)" }}>
              {gremFirmada ? gremComprobante : `${seleccion.length} encomienda(s)`}
            </Typography>
          </Box>
        </DialogTitle>

        <Box sx={{ px: 2, pb: 2, display: "grid", gap: 1.2 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 0.8 }}>
            <Box>
              <Typography sx={fieldGroupTitleSx}>Destino</Typography>
              <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.9)" }} noWrap>{destinoPrincipal || "-"}</Typography>
            </Box>
            <Box>
              <Typography sx={fieldGroupTitleSx}>Ruta</Typography>
              <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.9)" }} noWrap>{resumenRuta || "-"}</Typography>
            </Box>
          </Box>

          <Box sx={{ display: "grid", gap: 0.55, maxHeight: 102, overflow: "auto", borderTop: "1px solid rgba(148,163,184,0.16)", pt: 1 }}>
            {seleccion.map((item) => (
              <Typography key={docKey(item)} sx={{ fontSize: 11.5, color: "rgba(255,255,255,0.9)" }}>
                {docKey(item)} - {item.descripcion || "Encomienda"} - {item.destinatario || "Destinatario"}
              </Typography>
            ))}
          </Box>

          <Typography sx={fieldGroupTitleSx}>Identificacion</Typography>
          <Box sx={fieldGridSx}>
            <TextField label="Serie" name="serie" value={form.serie} onChange={handleChange} size="small" sx={inputSx} />
            <TextField label="Numero" name="numero" value={form.numero} onChange={handleChange} size="small" sx={inputSx} />
          </Box>

          <Typography sx={fieldGroupTitleSx}>Traslado</Typography>
          <Box sx={fieldGridSx}>
            <TextField label="Fecha traslado" name="fecha_traslado" type="date" value={form.fecha_traslado} onChange={handleChange} size="small" sx={inputSx} InputLabelProps={{ shrink: true }} />
            <TextField select label="Motivo" name="motivo_traslado_id" value={form.motivo_traslado_id} onChange={handleChange} size="small" sx={inputSx}>
              <MenuItem value="01">Venta</MenuItem>
              <MenuItem value="04">Traslado entre establecimientos</MenuItem>
              <MenuItem value="13">Otros</MenuItem>
            </TextField>
            <TextField select label="Modalidad" name="modalidad_traslado_id" value={form.modalidad_traslado_id} onChange={handleChange} size="small" sx={inputSx}>
              <MenuItem value="01">Publico</MenuItem>
              <MenuItem value="02">Privado</MenuItem>
            </TextField>
          </Box>

          <Typography sx={fieldGroupTitleSx}>Partida</Typography>
          <Box sx={fieldGridSx}>
            <TextField label="Ubigeo partida" name="partida_ubigeo" value={form.partida_ubigeo} onChange={handleChange} size="small" sx={inputSx} />
            <TextField label="Direccion partida" name="partida_direccion" value={form.partida_direccion} onChange={handleChange} size="small" sx={inputSx} />
          </Box>

          <Typography sx={fieldGroupTitleSx}>Llegada</Typography>
          <Box sx={fieldGridSx}>
            <TextField label="Ubigeo llegada" name="llegada_ubigeo" value={form.llegada_ubigeo} onChange={handleChange} size="small" sx={inputSx} />
            <TextField label="Direccion llegada" name="llegada_direccion" value={form.llegada_direccion} onChange={handleChange} size="small" sx={inputSx} />
          </Box>

          <Typography sx={fieldGroupTitleSx}>Vehiculo y conductor</Typography>
          <Box sx={fieldGridSx}>
            <TextField label="Placa" name="placa" value={form.placa} onChange={handleChange} size="small" sx={inputSx} />
            <TextField label="Licencia" name="licencia" value={form.licencia} onChange={handleChange} size="small" sx={inputSx} />
            <TextField label="DNI conductor" name="conductor_documento_id" value={form.conductor_documento_id} onChange={handleChange} size="small" sx={inputSx} />
            <TextField label="Nombres conductor" name="conductor_nombres" value={form.conductor_nombres} onChange={handleChange} size="small" sx={inputSx} />
            <TextField label="Apellidos conductor" name="conductor_apellidos" value={form.conductor_apellidos} onChange={handleChange} size="small" sx={inputSx} />
          </Box>

          <Typography sx={fieldGroupTitleSx}>Carga</Typography>
          <Box sx={fieldGridSx}>
            <TextField label="Peso total KGM" name="peso_total" value={form.peso_total} onChange={handleChange} size="small" sx={inputSx} />
            <TextField label="Bultos" name="numero_bultos" value={form.numero_bultos} onChange={handleChange} size="small" sx={inputSx} />
          </Box>

          <TextField
            label="Observacion"
            name="observacion"
            value={form.observacion}
            onChange={handleChange}
            size="small"
            sx={inputSx}
          />

          {payloadPreview && (
            <TextField
              value={payloadPreview}
              multiline
              minRows={5}
              maxRows={10}
              size="small"
              sx={inputSx}
              InputProps={{ readOnly: true }}
            />
          )}

          {(rutas.xml || rutas.cdr || rutas.pdf) && (
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
              <Button sx={buttonSx} variant="outlined" onClick={() => handleOpenLink(rutas.xml)} startIcon={<CodeIcon />}>XML</Button>
              <Button sx={buttonSx} variant="outlined" onClick={() => handleOpenLink(rutas.cdr)} startIcon={<TaskAltIcon />}>CDR</Button>
              <Button sx={buttonSx} variant="outlined" onClick={() => handleOpenLink(rutas.pdf)} startIcon={<DescriptionIcon />}>PDF</Button>
            </Box>
          )}

          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <Button sx={buttonSx} onClick={handleClose} color="inherit">Cerrar</Button>
            <Button sx={buttonSx} onClick={handlePayload} disabled={loading} variant="outlined">Ver payload</Button>
            <Button sx={buttonSx} onClick={handleEnviar} disabled={loading || formIncompleto} variant="contained">
              Enviar GRE
            </Button>
          </Box>
        </Box>
      </Dialog>
    </>
  );
};

export default AdminSunatGreTransIcon;
