import React from "react";
import { Box, Button, Dialog, DialogTitle, IconButton, InputAdornment, TextField, Tooltip } from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddBox";
import FindIcon from "@mui/icons-material/FindInPage";
import IndeterminateCheckBox from "@mui/icons-material/IndeterminateCheckBox";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import Timer10SelectIcon from "@mui/icons-material/Timer10Select";

import ListaPopUp from "../../../ListaPopUp";
import palette from "../../../../theme/palette";

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
  p: 1.4,
};

const modalFieldSx = {
  width: 270,
  "& .MuiOutlinedInput-root": {
    minHeight: 40,
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
  },
  "& input::placeholder": {
    color: palette.muted,
    opacity: 1,
  },
};

const primaryButtonSx = {
  width: 270,
  height: 40,
  borderRadius: 2,
  backgroundColor: "rgba(42,161,152,0.18)",
  border: "1px solid rgba(42,161,152,0.30)",
  color: "#bff5ef",
  boxShadow: "none",
  fontSize: "12px",
  fontWeight: 800,
  "&:hover": {
    backgroundColor: "rgba(42,161,152,0.28)",
    borderColor: "rgba(42,161,152,0.42)",
    boxShadow: "none",
  },
};

const secondaryButtonSx = {
  width: 270,
  height: 40,
  borderRadius: 2,
  backgroundColor: "rgba(139,154,165,0.10)",
  border: "1px solid rgba(139,154,165,0.16)",
  color: palette.text,
  boxShadow: "none",
  fontSize: "12px",
  fontWeight: 800,
  "&:hover": {
    backgroundColor: "rgba(139,154,165,0.16)",
    boxShadow: "none",
  },
};

export default function AdminStockProductoModal({
  isSmallScreen,
  producto,
  setProducto,
  productoSelect,
  grupoSelect,
  showModalProducto,
  setShowModalProducto,
  inputProductoRef,
  onFocus,
  onMostrarTecladoCelular,
  onChangeProductoDatos,
  onResetCantidad,
  onDecreaseByOne,
  onIncreaseByOne,
  onIncreaseByTen,
  onSaveDetail,
}) {
  const cerrarProducto = () => {
    setShowModalProducto(false);
    setProducto((prevState) => ({ ...prevState, cantidad: "", auxiliar: "" }));
  };

  return (
    <>
      <ListaPopUp
        registroPopUp={productoSelect}
        gruposPopUp={grupoSelect}
        showModal={showModalProducto}
        setShowModal={setShowModalProducto}
        registro={producto}
        setRegistro={setProducto}
        idCodigoKey="id_producto"
        descripcionKey="descripcion"
        auxiliarKey="auxiliar"
      />

      {!showModalProducto && producto.auxiliar && (
        <Dialog open onClose={cerrarProducto} maxWidth="md" disableScrollLock PaperProps={{ sx: modalPaperSx }}>
          <DialogTitle sx={{ color: palette.text, fontSize: "17px", fontWeight: 800, py: 0.6 }}>
            Producto - Item
          </DialogTitle>

          <Tooltip title={producto.descripcion}>
            <TextField
              variant="outlined"
              placeholder="PRODUCTO"
              inputRef={inputProductoRef}
              onFocus={onFocus}
              autoFocus
              size="small"
              name="id_producto"
              value={producto.descripcion}
              sx={modalFieldSx}
              InputLabelProps={{ style: { color: palette.muted } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconButton
                      color="primary"
                      aria-label="buscar producto"
                      component="label"
                      size="small"
                      sx={{ position: "absolute", top: "50%", left: 0, transform: "translateY(-50%)" }}
                      onClick={() => setShowModalProducto(true)}
                    >
                      <FindIcon />
                    </IconButton>

                    {isSmallScreen ? (
                      <IconButton
                        color="default"
                        aria-label="Muestra teclado"
                        size="small"
                        onClick={onMostrarTecladoCelular}
                        sx={{
                          p: 0,
                          ml: "20px",
                          mr: "-30px",
                          borderRadius: 1,
                          "&:hover": { backgroundColor: "rgba(42,161,152,0.18)" },
                        }}
                      >
                        <KeyboardIcon />
                      </IconButton>
                    ) : null}
                  </InputAdornment>
                ),
                inputProps: {
                  style: { paddingLeft: "32px", fontSize: "12px" },
                },
              }}
            />
          </Tooltip>

          <TextField
            variant="outlined"
            placeholder="CANTIDAD"
            label="CANTIDAD"
            autoFocus
            size="small"
            sx={{ ...modalFieldSx, mt: 1.3 }}
            name="cantidad"
            value={producto.cantidad}
            onChange={onChangeProductoDatos}
            inputProps={{ style: { color: palette.text, width: 110, textAlign: "right", readOnly: true } }}
            InputLabelProps={{ style: { color: palette.muted } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconButton color="default" aria-label="reiniciar a 1" size="small" onClick={onResetCantidad} sx={{ p: 0, height: 30 }}>
                    <RestartAltIcon />
                  </IconButton>
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton color="default" aria-label="disminuir en 1" size="small" onClick={onDecreaseByOne} sx={{ p: 0, height: 40 }}>
                    <IndeterminateCheckBox color="inherit" style={{ width: 34, height: 34 }} />
                  </IconButton>
                  <IconButton color="default" aria-label="aumentar de 1 en 1" size="small" onClick={onIncreaseByOne} sx={{ p: 0, mr: 0.4 }}>
                    <AddCircleIcon color="success" style={{ width: 34, height: 34 }} />
                  </IconButton>
                  <IconButton color="default" aria-label="aumentar de 10 en 10" size="large" onClick={onIncreaseByTen} sx={{ p: 0, mr: -1 }}>
                    <Box sx={{ width: 25, height: 35, overflow: "hidden" }}>
                      <Timer10SelectIcon color="success" sx={{ fontSize: 35 }} />
                    </Box>
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            variant="outlined"
            placeholder="PRECIO U."
            label="PRECIO U."
            autoFocus
            size="small"
            name="precio_unitario"
            value={producto.precio_unitario}
            onChange={onChangeProductoDatos}
            sx={{ ...modalFieldSx, mt: 1 }}
            inputProps={{ style: { color: palette.text, width: 240, textAlign: "center", readOnly: true } }}
            InputLabelProps={{ style: { color: palette.muted } }}
          />
          <TextField
            variant="outlined"
            placeholder="IMPORTE"
            label="IMPORTE"
            autoFocus
            size="small"
            name="precio_neto"
            value={producto.precio_neto}
            sx={{ ...modalFieldSx, mt: 1 }}
            inputProps={{ style: { color: palette.text, width: 240, textAlign: "center", readOnly: true } }}
            InputLabelProps={{ style: { color: palette.muted } }}
          />

          <Button variant="contained" color="success" onClick={onSaveDetail} sx={{ ...primaryButtonSx, mt: 1.2 }}>
            AGREGAR
          </Button>
          <Button variant="contained" onClick={cerrarProducto} sx={{ ...secondaryButtonSx, mt: 0.7 }}>
            ESC - CERRAR
          </Button>
        </Dialog>
      )}
    </>
  );
}
