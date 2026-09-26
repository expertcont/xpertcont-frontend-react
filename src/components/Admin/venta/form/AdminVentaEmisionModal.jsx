import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import FindIcon from "@mui/icons-material/FindInPage";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import palette from "../../../../theme/palette";

const modalWidthSx = {
  width: { xs: "calc(100vw - 24px)", sm: 420 },
  maxWidth: "calc(100vw - 24px)",
};

const modalPaperSx = {
  m: { xs: 1.5, sm: 2 },
  mt: { xs: 1.5, sm: 5 },
  ...modalWidthSx,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  backgroundColor: palette.surface,
  color: palette.text,
  border: `1px solid ${palette.border}`,
  borderRadius: 2,
  boxShadow: palette.shadowSoft,
  overflow: "hidden",
};

const modalFieldSx = {
  width: 270,
  "& .MuiOutlinedInput-root": {
    minHeight: 40,
    color: palette.text,
    backgroundColor: palette.surfaceAlt,
    borderRadius: 2,
    "& fieldset": { borderColor: palette.border },
    "&:hover fieldset": { borderColor: palette.accent },
    "&.Mui-focused fieldset": { borderColor: palette.accent },
  },
  "& input": {
    color: palette.text,
    fontSize: "13px",
  },
  "& input::placeholder": {
    color: palette.muted,
    opacity: 1,
  },
};

const modalSelectSx = {
  width: 270,
  height: 40,
  color: palette.text,
  backgroundColor: palette.surfaceAlt,
  borderRadius: 2,
  fontSize: "13px",
  ".MuiSelect-select": {
    display: "flex",
    justifyContent: "center",
    textAlign: "center",
  },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: palette.border },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: palette.accent },
  "& .MuiSelect-icon": { color: palette.muted },
};

const toggleButtonSx = {
  flex: 1,
  borderColor: palette.border,
  color: palette.muted,
  fontSize: "12px",
  fontWeight: 700,
  "&.Mui-selected": {
    backgroundColor: palette.accentSoft,
    color: palette.text,
  },
  "&.Mui-selected:hover": {
    backgroundColor: palette.chip,
  },
  "&:hover": {
    backgroundColor: palette.surfaceAlt,
    color: palette.text,
  },
};

const primaryButtonSx = {
  width: 270,
  height: 40,
  borderRadius: 2,
  backgroundColor: palette.accentSoft,
  border: `1px solid ${palette.border}`,
  color: palette.text,
  boxShadow: "none",
  fontSize: "12px",
  fontWeight: 800,
  "&:hover": {
    backgroundColor: palette.accentSoft,
    borderColor: palette.accent,
    boxShadow: "none",
  },
};

const secondaryButtonSx = {
  width: 270,
  height: 40,
  borderRadius: 2,
  backgroundColor: palette.surfaceAlt,
  border: `1px solid ${palette.border}`,
  color: palette.text,
  boxShadow: "none",
  fontSize: "12px",
  fontWeight: 800,
  "&:hover": {
    backgroundColor: palette.chip,
    borderColor: palette.accent,
    boxShadow: "none",
  },
};

export default function AdminVentaEmisionModal({
  open,
  isSmallScreen,
  valorEmite,
  serieEmite,
  datosEmitir,
  docSelect,
  serieSelect,
  motivoSelect,
  formasPago,
  idDocBusca,
  isAllowed,
  onValorEmiteChange,
  onChangeEmite,
  onBuscarRazonSocial,
  onFormaPago,
  onDiasCredito,
  onSwitchPago,
  onSaveComprobante,
  onClose,
  backHost,
  idAnfitrion,
  documentoId,
}) {
  const [showHabituales, setShowHabituales] = useState(false);
  const [clientesHabituales, setClientesHabituales] = useState([]);
  const [filtroHabitual, setFiltroHabitual] = useState("");
  const [cargandoHabituales, setCargandoHabituales] = useState(false);

  const clientesFiltrados = useMemo(() => {
    const filtro = filtroHabitual.trim().toLowerCase();
    if (!filtro) return clientesHabituales;

    return clientesHabituales.filter((cliente) => {
      const documento = cliente.documento_id?.toString().toLowerCase() || "";
      const razonSocial = cliente.razon_social?.toString().toLowerCase() || "";
      const direccion = cliente.direccion?.toString().toLowerCase() || "";

      return documento.includes(filtro) || razonSocial.includes(filtro) || direccion.includes(filtro);
    });
  }, [clientesHabituales, filtroHabitual]);

  const cargarHabituales = async () => {
    setShowHabituales(true);
    setCargandoHabituales(true);

    try {
      const response = await fetch(`${backHost}/correntistahabitual/${idAnfitrion}/${documentoId}`);
      const data = await response.json();
      const clientes = Array.isArray(data)
        ? data.map((cliente) => ({
            documento_id: cliente.hab_documento_id || cliente.documento_id || "",
            razon_social: cliente.hab_razon_social || cliente.razon_social || "",
            id_doc: cliente.hab_id_doc || cliente.id_doc || "",
            direccion: cliente.hab_direccion || cliente.direccion || "-",
          }))
        : [];
      setClientesHabituales(clientes);
    } catch (error) {
      console.log("Error cargando clientes habituales:", error);
      setClientesHabituales([]);
    } finally {
      setCargandoHabituales(false);
    }
  };

  const seleccionarHabitual = (cliente) => {
    onChangeEmite("r_documento_id", cliente.documento_id || "");
    onChangeEmite("r_id_doc", cliente.id_doc || "");
    onChangeEmite("r_razon_social", cliente.razon_social || "");
    onChangeEmite("r_direccion", cliente.direccion || "-");
    setFiltroHabitual("");
    setShowHabituales(false);
  };

  if (!open) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      disableScrollLock
      PaperProps={{
        sx: modalPaperSx,
      }}
    >
      <DialogTitle
        sx={{
          width: "100%",
          px: 2,
          py: 1.35,
          textAlign: "center",
          borderBottom: `1px solid ${palette.borderSoft}`,
        }}
      >
        <Typography sx={{ color: palette.text, fontSize: "17px", fontWeight: 700, lineHeight: 1.2 }}>
          Datos de emision
        </Typography>
        <Typography sx={{ color: palette.muted, fontSize: "12px", mt: 0.25 }}>
          Cliente, comprobante y condicion de pago
        </Typography>
      </DialogTitle>

      <ToggleButtonGroup
        // Sin prop color: ToggleButton (MUI v5) hace theme.palette[color].main
        // sin validar, asi que 'inherit' lo revienta con
        // "Cannot read properties of undefined (reading 'main')".
        // El color real lo pone toggleButtonSx.
        value={valorEmite}
        exclusive
        size="small"
        onChange={onValorEmiteChange}
        aria-label="Platform"
        sx={{
          width: 270,
          mt: 1.35,
          mb: 0.75,
          backgroundColor: palette.surfaceAlt,
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        {isAllowed("01") && (
          <ToggleButton
            value="01"
            sx={toggleButtonSx}
          >
            FACT
          </ToggleButton>
        )}

        {isAllowed("03") && (
          <ToggleButton
            value="03"
            sx={toggleButtonSx}
          >
            BOL
          </ToggleButton>
        )}

        {isAllowed("NV") && (
          <ToggleButton
            value="NV"
            sx={toggleButtonSx}
          >
            NV
          </ToggleButton>
        )}

        {isAllowed("07") && (
          <ToggleButton
            value="07"
            sx={toggleButtonSx}
          >
            NCred
          </ToggleButton>
        )}
      </ToggleButtonGroup>

      <Box sx={{ position: "relative", width: 270, mt: 0 }}>
        <TextField
          variant="outlined"
          size="small"
          value=""
          InputProps={{
            readOnly: true,
            startAdornment: (
              <InputAdornment position="start">
                <Typography
                  sx={{
                    color: palette.muted,
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    width: 55,
                  }}
                >
                  SERIE
                </Typography>
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Select
                  value={serieEmite}
                  onChange={(event) => onChangeEmite("r_serie", event.target.value)}
                  variant="standard"
                  disableUnderline
                  sx={{
                    color: palette.text,
                    fontSize: "0.90rem",
                    fontWeight: 600,
                    width: 90,
                    textAlign: "center",
                    "& .MuiSelect-select": {
                      textAlign: "center",
                    },
                    "& .MuiSelect-icon": {
                      color: palette.muted,
                    },
                  }}
                >
                  {serieSelect.map((item) => (
                    <MenuItem
                      key={item.r_serie}
                      value={item.r_serie}
                      sx={{ justifyContent: "center" }}
                    >
                      {item.r_serie}
                    </MenuItem>
                  ))}
                </Select>
              </InputAdornment>
            ),
          }}
          sx={{
            ...modalFieldSx,
            "& input": {
              color: "transparent",
              caretColor: "transparent",
              cursor: "default",
            },
            "& .MuiOutlinedInput-root": {
              ...modalFieldSx["& .MuiOutlinedInput-root"],
              paddingRight: "6px",
            },
          }}
        />
      </Box>

      <TextField
        variant="outlined"
        placeholder="RUC/DNI"
        autoFocus
        size="small"
        autoComplete="off"
        name="r_documento_id"
        value={datosEmitir.r_documento_id}
        onChange={(event) => onChangeEmite("r_documento_id", event.target.value)}
        InputLabelProps={{ style: { color: palette.muted } }}
        InputProps={{
          style: { color: palette.text, width: 270 },
          endAdornment: (
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                right: 0,
                transform: "translateY(-50%)",
                display: "flex",
              }}
            >
              <Tooltip title="Buscar RUC/DNI">
                <IconButton
                  color="inherit"
                  aria-label="buscar ruc dni"
                  size="small"
                  sx={{ color: palette.warning, "&:hover": { backgroundColor: palette.warningSoft } }}
                  onClick={() => onBuscarRazonSocial(datosEmitir.r_documento_id)}
                >
                  <FindIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Clientes habituales">
                <IconButton
                  color="inherit"
                  aria-label="clientes habituales"
                  size="small"
                  sx={{ color: palette.accent, "&:hover": { backgroundColor: palette.accentSoft } }}
                  onClick={cargarHabituales}
                >
                  <ManageSearchIcon />
                </IconButton>
              </Tooltip>
            </Box>
          ),
          inputProps: {
            style: {
              paddingLeft: "32px",
              paddingRight: "72px",
              fontSize: "18px",
            },
          },
        }}
        sx={{
          ...modalFieldSx,
          mt: 0,
          "& .MuiInputBase-input": {
            textAlign: "center",
          },
        }}
      />

      <Select
        labelId="documento_select"
        value={idDocBusca || datosEmitir.r_id_doc}
        size="small"
        name="r_id_doc"
        sx={modalSelectSx}
        label="doc"
        onChange={(event) => onChangeEmite("r_id_doc", event.target.value)}
      >
        {docSelect.map((elemento) => (
          <MenuItem key={elemento.codigo} value={elemento.codigo} sx={{ justifyContent: "center" }}>
            {elemento.descripcion}
          </MenuItem>
        ))}
      </Select>

      <Tooltip title={datosEmitir.r_razon_social}>
        <TextField
          variant="outlined"
          placeholder="RAZON SOCIAL"
          autoFocus
          size="small"
          autoComplete="off"
          sx={{ ...modalFieldSx, mt: 0 }}
          name="r_razon_social"
          value={datosEmitir.r_razon_social}
          onChange={(event) => onChangeEmite("r_razon_social", event.target.value)}
          inputProps={{ style: { color: palette.text, width: 240, textAlign: "center", readOnly: true } }}
          InputLabelProps={{ style: { color: palette.muted } }}
        />
      </Tooltip>

      <TextField
        variant="outlined"
        placeholder="DIRECCION"
        autoFocus
        size="small"
        autoComplete="off"
        name="r_direccion"
        value={datosEmitir.r_direccion}
        onChange={(event) => onChangeEmite("r_direccion", event.target.value)}
        sx={modalFieldSx}
        inputProps={{ style: { color: palette.text, width: 240, textAlign: "center", readOnly: true } }}
        InputLabelProps={{ style: { color: palette.muted } }}
      />

      {valorEmite === "01" && (
        <FormControlLabel
          sx={{
            width: 270,
            m: 0,
            color: palette.text,
            "& .MuiFormControlLabel-label": {
              fontSize: "13px",
              fontWeight: 700,
            },
          }}
          control={
            <Checkbox
              size="small"
              checked={Boolean(datosEmitir.registrar_habitual)}
              disabled={!datosEmitir.r_documento_id || !datosEmitir.r_razon_social}
              onChange={(event) => onChangeEmite("registrar_habitual", event.target.checked)}
              sx={{
                color: palette.muted,
                "&.Mui-checked": {
                  color: palette.accent,
                },
              }}
            />
          }
          label="Guardar como cliente habitual"
        />
      )}

      {valorEmite === "07" && (
        <Select
          labelId="motivo_select"
          label="motivo"
          value={datosEmitir.r_idmotivo_ref}
          size="small"
          name="r_idmotivo_ref"
          sx={modalSelectSx}
          onChange={(event) => onChangeEmite("r_idmotivo_ref", event.target.value)}
        >
          {motivoSelect.map((elemento) => (
            <MenuItem key={elemento.codigo} value={elemento.codigo} sx={{ justifyContent: "center" }}>
              {elemento.descripcion}
            </MenuItem>
          ))}
        </Select>
      )}

      <Select
        labelId="moneda_select"
        value={datosEmitir.r_moneda}
        size="small"
        name="r_moneda"
        sx={modalSelectSx}
        label="doc"
        onChange={(event) => onChangeEmite("r_moneda", event.target.value)}
      >
        <MenuItem key="PEN" value="PEN" sx={{ justifyContent: "center" }}>
          SOLES
        </MenuItem>
        <MenuItem key="USD" value="USD" sx={{ justifyContent: "center" }}>
          DOLARES
        </MenuItem>
      </Select>

      <Box sx={{ display: "flex", width: 270 }}>
        <Select
          value={datosEmitir.r_forma_pago_id || "Contado"}
          onChange={(event) => onFormaPago(event.target.value)}
          size="small"
          sx={{
            ...modalSelectSx,
            width: 130,
            mr: 0,
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
          }}
        >
          <MenuItem value="Contado">Contado</MenuItem>
          <MenuItem value="Credito">Credito</MenuItem>
        </Select>

        <TextField
          size="small"
          type="number"
          value={datosEmitir.dias_credito || 0}
          onChange={(event) => onDiasCredito(event.target.value)}
          disabled={datosEmitir.r_forma_pago_id !== "Credito"}
          sx={{
            ...modalFieldSx,
            width: 140,
            "& .MuiOutlinedInput-root": {
              ...modalFieldSx["& .MuiOutlinedInput-root"],
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
            },
            "& input": {
              textAlign: "center",
              color: palette.text,
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                dias
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Box sx={{ display: "inline-block" }}>
        <TextField
          variant="outlined"
          autoFocus
          size="small"
          autoComplete="off"
          name="efectivo"
          value={datosEmitir.efectivo}
          onChange={(event) => onChangeEmite("efectivo", event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Box sx={{ color: palette.muted, fontSize: "0.85rem" }}>EFECTIVO</Box>
              </InputAdornment>
            ),
            endAdornment: datosEmitir.efectivo > 0 && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => onSwitchPago("efectivo")}>
                  <CompareArrowsIcon sx={{ color: palette.accent }} />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            ...modalFieldSx,
            width: 270,
            "& input": {
              textAlign: "center",
              color: palette.text,
            },
            "& .MuiOutlinedInput-root": {
              paddingRight: "4px",
            },
          }}
          InputLabelProps={{ style: { color: palette.muted } }}
        />
      </Box>

      <Box sx={{ position: "relative", width: 270 }}>
        <TextField
          variant="outlined"
          size="small"
          autoComplete="off"
          name="efectivo2"
          value={datosEmitir.efectivo2}
          onChange={(event) => onChangeEmite("efectivo2", event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Select
                  value={datosEmitir.forma_pago2 || "YAPE"}
                  onChange={(event) => onChangeEmite("forma_pago2", event.target.value)}
                  variant="standard"
                  disableUnderline
                  sx={{
                    color: palette.muted,
                    fontSize: "0.85rem",
                    width: 90,
                    "& .MuiSelect-icon": { color: palette.muted },
                  }}
                >
                  {formasPago.map((forma) => (
                    <MenuItem key={forma} value={forma}>
                      {forma}
                    </MenuItem>
                  ))}
                </Select>
              </InputAdornment>
            ),
            endAdornment: datosEmitir.efectivo2 > 0 && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => onSwitchPago("efectivo2")}>
                  <CompareArrowsIcon sx={{ color: palette.accent }} />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            ...modalFieldSx,
            width: 270,
            "& input": {
              textAlign: "center",
              color: palette.text,
            },
            "& .MuiOutlinedInput-root": {
              paddingRight: "4px",
            },
          }}
          InputLabelProps={{ style: { color: palette.muted } }}
        />
      </Box>

      <Button
        variant="contained"
        color="inherit"
        onClick={onSaveComprobante}
        sx={{ ...primaryButtonSx, mt: 1.2 }}
      >
        GRABAR
      </Button>
      <Button
        variant="contained"
        onClick={onClose}
        sx={{ ...secondaryButtonSx, mt: 0.75, mb: 1.35 }}
      >
        ESC - CERRAR
      </Button>

      <Dialog
        open={showHabituales}
        onClose={() => setShowHabituales(false)}
        maxWidth="sm"
        fullWidth
        disableScrollLock
        PaperProps={{
          sx: {
            backgroundColor: palette.surface,
            color: palette.text,
            border: `1px solid ${palette.border}`,
            borderRadius: 2,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: `1px solid ${palette.borderSoft}`, py: 1.25 }}>
          Clientes habituales
        </DialogTitle>
        <DialogContent>
          <TextField
            variant="outlined"
            placeholder="Filtrar cliente"
            size="small"
            autoComplete="off"
            value={filtroHabitual}
            onChange={(event) => setFiltroHabitual(event.target.value)}
            autoFocus
            sx={{
              ...modalFieldSx,
              width: "100%",
              mb: 1,
            }}
          />

          <List
            dense
            sx={{
              maxHeight: isSmallScreen ? "50vh" : "55vh",
              overflowY: "auto",
              py: 0,
            }}
          >
            {cargandoHabituales && (
              <ListItemText
                primary="Cargando clientes..."
                primaryTypographyProps={{ sx: { color: palette.muted, textAlign: "center", py: 2 } }}
              />
            )}

            {!cargandoHabituales && clientesFiltrados.map((cliente) => (
              <ListItemButton
                key={cliente.documento_id}
                onClick={() => seleccionarHabitual(cliente)}
                sx={{
                  borderBottom: `1px solid ${palette.borderSoft}`,
                  "&:hover": {
                    backgroundColor: palette.accentSoft,
                  },
                }}
              >
                <ListItemText
                  primary={`${cliente.documento_id} - ${cliente.razon_social || ""}`}
                  secondary={cliente.direccion || "-"}
                  primaryTypographyProps={{
                    sx: { color: palette.text, fontSize: "0.88rem" },
                  }}
                  secondaryTypographyProps={{
                    sx: { color: palette.muted, fontSize: "0.78rem" },
                  }}
                />
              </ListItemButton>
            ))}

            {!cargandoHabituales && clientesFiltrados.length === 0 && (
              <ListItemText
                primary="Sin clientes habituales"
                primaryTypographyProps={{ sx: { color: palette.muted, textAlign: "center", py: 2 } }}
              />
            )}
          </List>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
