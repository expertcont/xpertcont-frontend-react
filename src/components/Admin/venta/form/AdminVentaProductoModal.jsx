import React from "react";
import { Box, Button, Dialog, DialogTitle, IconButton, InputAdornment, TextField, Tooltip, Typography } from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddBox";
import FindIcon from "@mui/icons-material/FindInPage";
import IndeterminateCheckBox from "@mui/icons-material/IndeterminateCheckBox";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import Timer10SelectIcon from "@mui/icons-material/Timer10Select";

import ListaPopUp from "../../../ListaPopUp";

export default function AdminVentaProductoModal({
  isSmallScreen,
  producto,
  setProducto,
  productoSelect,
  grupoSelect,
  showModalProductoLista,
  setShowModalProductoLista,
  inputProductoRef,
  onFocus,
  onMostrarTecladoCelular,
  onChangeProductoDatos,
  onResetCantidad,
  onDecreaseByOne,
  onIncreaseByOne,
  onIncreaseByTen,
  onSaveDetail,
  modoEdicionValores = false,
  totalActual,
  totalPrevio,
  onCloseProducto,
}) {
  const formatMoney = (value) => {
    const parsed = parseFloat(value);
    const safeValue = Number.isFinite(parsed) ? parsed : 0;
    return safeValue.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const cerrarProducto = () => {
    if (modoEdicionValores && onCloseProducto) {
      onCloseProducto();
      return;
    }

    setProducto((prevState) => ({ ...prevState, cantidad: "", auxiliar: "" }));
    setProducto({ ...producto, cantidad: "", auxiliar: "" });
  };

  return (
    <>
      {showModalProductoLista && (
        <ListaPopUp
          registroPopUp={productoSelect}
          gruposPopUp={grupoSelect}
          showModal={showModalProductoLista}
          setShowModal={setShowModalProductoLista}
          registro={producto}
          setRegistro={setProducto}
          idCodigoKey="id_producto"
          descripcionKey="descripcion"
          auxiliarKey="auxiliar"
        />
      )}

      {producto.auxiliar && (
        <Dialog
          open
          onClose={cerrarProducto}
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
              background: "rgba(30, 39, 46, 0.9)",
              color: "white",
              width: isSmallScreen ? "70%" : "30%",
            },
          }}
        >
          <DialogTitle>{modoEdicionValores ? "Modificar Item" : "Producto - Item"}</DialogTitle>
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
              InputLabelProps={{ style: { color: "white" } }}
              InputProps={{
                style: { color: "white", width: 270 },
                startAdornment: (
                  <InputAdornment position="start">
                    <IconButton
                      color="primary"
                      aria-label="upload picture"
                      component="label"
                      size="small"
                      sx={{
                        position: "absolute",
                        top: "50%",
                        left: 0,
                        transform: "translateY(-50%)",
                      }}
                      onClick={() => {
                        if (!modoEdicionValores) {
                          setShowModalProductoLista(true);
                        }
                      }}
                      disabled={modoEdicionValores}
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
                          padding: "0px",
                          marginLeft: "20px",
                          marginRight: "-30px",
                          backgroundColor: "primary",
                          borderRadius: "4px",
                          "&:hover": {
                            backgroundColor: "skyblue",
                          },
                        }}
                      >
                        <KeyboardIcon />
                      </IconButton>
                    ) : null}
                  </InputAdornment>
                ),
                inputProps: {
                  style: {
                    paddingLeft: "32px",
                    fontSize: "12px",
                  },
                  readOnly: modoEdicionValores,
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
            sx={{ mt: 2 }}
            name="cantidad"
            value={producto.cantidad}
            onChange={onChangeProductoDatos}
            inputProps={{
              style: {
                color: "white",
                width: 110,
                textAlign: "right",
                readOnly: true,
              },
            }}
            InputLabelProps={{ style: { color: "white" } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconButton
                    color="default"
                    aria-label="reiniciar a 1"
                    size="small"
                    onClick={onResetCantidad}
                    sx={{
                      padding: "0px",
                      height: "30",
                      marginLeft: "-10px",
                      marginRight: "0px",
                      backgroundColor: "primary",
                      borderRadius: "4px",
                      "&:hover": {
                        backgroundColor: "skyblue",
                      },
                    }}
                  >
                    <RestartAltIcon />
                  </IconButton>
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    color="default"
                    aria-label="disminuir en 1"
                    size="small"
                    onClick={onDecreaseByOne}
                    sx={{
                      padding: "0px",
                      height: "48px",
                      marginRight: "0px",
                      backgroundColor: "primary",
                      borderRadius: "4px",
                      "&:hover": {
                        backgroundColor: "skyblue",
                      },
                    }}
                  >
                    <IndeterminateCheckBox color="inherit" style={{ width: 35, height: 35 }} />
                  </IconButton>

                  <IconButton
                    color="default"
                    aria-label="aumentar de 1 en 1"
                    size="small"
                    onClick={onIncreaseByOne}
                    sx={{
                      padding: "0px",
                      marginRight: "5px",
                      backgroundColor: "primary",
                      borderRadius: "4px",
                      "&:hover": {
                        backgroundColor: "skyblue",
                      },
                    }}
                  >
                    <AddCircleIcon color="success" style={{ width: 35, height: 35 }} />
                  </IconButton>

                  <IconButton
                    color="default"
                    aria-label="aumentar de 10 en 10"
                    size="large"
                    onClick={onIncreaseByTen}
                    sx={{
                      padding: "0px",
                      marginRight: "-10px",
                      backgroundColor: "primary",
                      borderRadius: "4px",
                      "&:hover": {
                        backgroundColor: "skyblue",
                      },
                    }}
                  >
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
            inputProps={{ style: { color: "white", width: 240, textAlign: "center" }, readOnly: !modoEdicionValores }}
            InputLabelProps={{ style: { color: "white" } }}
          />
          <TextField
            variant="outlined"
            placeholder="IMPORTE"
            label="IMPORTE"
            autoFocus
            size="small"
            name="precio_neto"
            value={producto.precio_neto}
            onChange={onChangeProductoDatos}
            inputProps={{ style: { color: "white", width: 240, textAlign: "center" }, readOnly: !modoEdicionValores }}
            InputLabelProps={{ style: { color: "white" } }}
          />
          {modoEdicionValores && (
            <Box sx={{ width: 270, mt: 1, mb: 0.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="caption" color="gray">
                  Total actual
                </Typography>
                <Typography variant="body2" color="white">
                  S/ {formatMoney(totalActual)}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.25 }}>
                <Typography variant="caption" color="gray">
                  Total previo
                </Typography>
                <Typography variant="body2" color="skyblue" fontWeight={700}>
                  S/ {formatMoney(totalPrevio)}
                </Typography>
              </Box>
            </Box>
          )}
          <Button
            variant="contained"
            color="success"
            onClick={onSaveDetail}
            sx={{ display: "block", margin: ".5rem 0", width: 270 }}
          >
            {modoEdicionValores ? "GUARDAR" : "AGREGAR"}
          </Button>
          <Button
            variant="contained"
            onClick={cerrarProducto}
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
            {modoEdicionValores ? "CERRAR" : "ESC - CERRAR"}
          </Button>
        </Dialog>
      )}
    </>
  );
}
