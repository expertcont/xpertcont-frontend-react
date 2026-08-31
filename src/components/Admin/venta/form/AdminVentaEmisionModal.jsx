import React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  IconButton,
  InputAdornment,
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
}) {
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
        style: {
          top: isSmallScreen ? "-10vh" : "0vh",
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
      <DialogTitle>Datos - Emision</DialogTitle>

      <ToggleButtonGroup
        color="success"
        value={valorEmite}
        exclusive
        size="small"
        onChange={onValorEmiteChange}
        aria-label="Platform"
        sx={{
          width: 270,
          margin: "0.5rem 0",
        }}
      >
        {isAllowed("01") && (
          <ToggleButton
            value="01"
            sx={{ flex: 1 }}
            style={{
              backgroundColor: valorEmite === "01" ? "lightblue" : "transparent",
              color: valorEmite === "01" ? "orange" : "gray",
              borderRadius: "4px",
            }}
          >
            FACT
          </ToggleButton>
        )}

        {isAllowed("03") && (
          <ToggleButton
            value="03"
            sx={{ flex: 1 }}
            style={{
              backgroundColor: valorEmite === "03" ? "lightblue" : "transparent",
              color: valorEmite === "03" ? "orange" : "gray",
              borderRadius: "4px",
            }}
          >
            BOL
          </ToggleButton>
        )}

        {isAllowed("NV") && (
          <ToggleButton
            value="NV"
            sx={{ flex: 1 }}
            style={{
              backgroundColor: valorEmite === "NV" ? "lightblue" : "transparent",
              color: valorEmite === "NV" ? "orange" : "gray",
              borderRadius: "4px",
            }}
          >
            NV
          </ToggleButton>
        )}

        {isAllowed("07") && (
          <ToggleButton
            value="07"
            sx={{ flex: 1 }}
            style={{
              backgroundColor: valorEmite === "07" ? "lightblue" : "transparent",
              color: valorEmite === "07" ? "orange" : "gray",
              borderRadius: "4px",
            }}
          >
            NCred
          </ToggleButton>
        )}
      </ToggleButtonGroup>

      <Box sx={{ position: "relative", width: 270, mt: -1 }}>
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
                    color: "#9ca3af",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    letterSpacing: 0.5,
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
                    color: "white",
                    fontSize: "0.90rem",
                    fontWeight: 600,
                    width: 90,
                    textAlign: "center",
                    "& .MuiSelect-select": {
                      textAlign: "center",
                    },
                    "& .MuiSelect-icon": {
                      color: "gray",
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
            width: 270,
            "& input": {
              color: "transparent",
              caretColor: "transparent",
              cursor: "default",
            },
            "& fieldset": {
              borderColor: "#555",
            },
            "& .MuiOutlinedInput-root": {
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
        InputLabelProps={{ style: { color: "white" } }}
        InputProps={{
          style: { color: "white", width: 270 },
          endAdornment: (
            <IconButton
              color="default"
              aria-label="upload picture"
              component="label"
              size="small"
              sx={{
                position: "absolute",
                top: "50%",
                right: 0,
                transform: "translateY(-50%)",
                color: "orange",
              }}
              onClick={() => onBuscarRazonSocial(datosEmitir.r_documento_id)}
            >
              <FindIcon />
            </IconButton>
          ),
          inputProps: {
            style: {
              paddingLeft: "32px",
              fontSize: "18px",
            },
          },
        }}
        sx={{
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
        sx={{
          display: "block",
          mt: 0,
          width: "270px",
          textAlign: "center",
          ".MuiSelect-select": {
            textAlign: "center",
          },
          color: "white",
        }}
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
          sx={{ mt: 0 }}
          name="r_razon_social"
          value={datosEmitir.r_razon_social}
          onChange={(event) => onChangeEmite("r_razon_social", event.target.value)}
          inputProps={{ style: { color: "white", width: 240, textAlign: "center", readOnly: true } }}
          InputLabelProps={{ style: { color: "white" } }}
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
        inputProps={{ style: { color: "white", width: 240, textAlign: "center", readOnly: true } }}
        InputLabelProps={{ style: { color: "white" } }}
      />

      {valorEmite === "07" && (
        <Select
          labelId="motivo_select"
          label="motivo"
          value={datosEmitir.r_idmotivo_ref}
          size="small"
          name="r_idmotivo_ref"
          sx={{
            display: "block",
            mt: 0,
            width: "270px",
            textAlign: "center",
            ".MuiSelect-select": {
              textAlign: "center",
            },
            color: "white",
          }}
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
        sx={{
          display: "block",
          mt: 0,
          width: "270px",
          textAlign: "center",
          ".MuiSelect-select": {
            textAlign: "center",
          },
          color: "white",
        }}
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
            width: 130,
            mr: 0,
            color: "white",
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
            width: 140,
            "& input": {
              textAlign: "center",
              color: "white",
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
                <Box sx={{ color: "gray", fontSize: "0.85rem" }}>EFECTIVO</Box>
              </InputAdornment>
            ),
            endAdornment: datosEmitir.efectivo > 0 && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => onSwitchPago("efectivo")}>
                  <CompareArrowsIcon sx={{ color: "white" }} />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            width: 270,
            "& input": {
              textAlign: "center",
              color: "white",
            },
            "& .MuiOutlinedInput-root": {
              paddingRight: "4px",
            },
          }}
          InputLabelProps={{ style: { color: "white" } }}
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
                    color: "gray",
                    fontSize: "0.85rem",
                    width: 90,
                    "& .MuiSelect-icon": { color: "gray" },
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
                  <CompareArrowsIcon sx={{ color: "white" }} />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            width: 270,
            "& input": {
              textAlign: "center",
              color: "white",
            },
            "& .MuiOutlinedInput-root": {
              paddingRight: "4px",
            },
          }}
          InputLabelProps={{ style: { color: "white" } }}
        />
      </Box>

      <Button
        variant="contained"
        color="primary"
        onClick={onSaveComprobante}
        sx={{ display: "block", margin: ".5rem 0", width: 270 }}
      >
        GRABAR
      </Button>
      <Button
        variant="contained"
        onClick={onClose}
        sx={{
          display: "block",
          margin: ".5rem 0",
          width: 270,
          backgroundColor: "rgba(30, 39, 46)",
          "&:hover": {
            backgroundColor: "rgba(30, 39, 46, 0.1)",
          },
          mt: -0.5,
        }}
      >
        ESC - CERRAR
      </Button>
    </Dialog>
  );
}
