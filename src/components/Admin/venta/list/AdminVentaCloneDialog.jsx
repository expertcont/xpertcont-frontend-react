import React from "react";
import { Box, Button, Dialog, DialogTitle, TextField, Typography } from "@mui/material";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import palette from "../../../../theme/palette";

const modalPaperSx = {
  m: { xs: 1.5, sm: 2 },
  mt: { xs: 1.5, sm: 5 },
  width: { xs: "calc(100vw - 24px)", sm: 380 },
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

const fieldSx = {
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
  "& .MuiInputBase-input": {
    color: palette.text,
    textAlign: "center",
    fontSize: "13px",
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

export default function AdminVentaCloneDialog({
  open,
  fechaClon,
  onFechaChange,
  onClone,
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
          Clonar comprobante
        </Typography>
        <Typography sx={{ color: palette.muted, fontSize: "12px", mt: 0.25 }}>
          Selecciona la fecha del nuevo registro
        </Typography>
      </DialogTitle>

      <Box sx={{ py: 1.5, display: "grid", gap: 1, justifyItems: "center" }}>
        <TextField
          variant="outlined"
          fullWidth
          size="small"
          sx={fieldSx}
          name="fecha_clon"
          type="date"
          value={fechaClon}
          onChange={onFechaChange}
          inputProps={{ style: { color: palette.text } }}
          InputLabelProps={{ style: { color: palette.muted } }}
        />

        <Button
          variant="contained"
          color="primary"
          onClick={onClone}
          sx={primaryButtonSx}
          startIcon={<TaskAltIcon sx={{ fontSize: 18 }} />}
        >
          CLONAR
        </Button>

        <Button
          variant="contained"
          onClick={onClose}
          sx={secondaryButtonSx}
        >
          ESC - CERRAR
        </Button>
      </Box>
    </Dialog>
  );
}
