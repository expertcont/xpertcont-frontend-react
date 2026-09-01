import React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { CheckCircle, Info, Error as ErrorIcon } from "@mui/icons-material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import palette from "../../theme/palette";

const icons = {
  success: <CheckCircle sx={{ fontSize: 34, color: "#7ddbd3" }} />,
  warning: <ErrorOutlineIcon sx={{ fontSize: 34, color: "#f4c46f" }} />,
  info: <Info sx={{ fontSize: 34, color: "#a8c7ff" }} />,
  error: <ErrorIcon sx={{ fontSize: 34, color: "#ff9f7a" }} />,
};

const paperSx = {
  m: { xs: 1.5, sm: 2 },
  width: { xs: "calc(100vw - 24px)", sm: 380 },
  maxWidth: "calc(100vw - 24px)",
  backgroundColor: palette.surface,
  color: palette.text,
  border: `1px solid ${palette.border}`,
  borderRadius: 2,
  boxShadow: "0 18px 48px rgba(0,0,0,0.34)",
  overflow: "hidden",
};

const confirmButtonSx = {
  minWidth: 118,
  height: 38,
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

const cancelButtonSx = {
  minWidth: 118,
  height: 38,
  borderRadius: 2,
  backgroundColor: "rgba(139,154,165,0.10)",
  border: "1px solid rgba(139,154,165,0.16)",
  color: palette.text,
  fontSize: "12px",
  fontWeight: 800,
  "&:hover": {
    backgroundColor: "rgba(139,154,165,0.16)",
  },
};

const AdminConfirmDialog = ({ open, options, onClose }) => {
  if (!options) return null;

  return (
    <Dialog
      open={open}
      onClose={() => onClose(false)}
      PaperProps={{ sx: paperSx }}
    >
      <DialogTitle
        sx={{
          px: 2,
          py: 1.6,
          display: "grid",
          justifyItems: "center",
          gap: 0.8,
          textAlign: "center",
          borderBottom: `1px solid ${palette.borderSoft}`,
        }}
      >
        {options.icon && (
          <Box
            sx={{
              width: 42,
              height: 42,
              display: "grid",
              placeItems: "center",
              borderRadius: 2,
              backgroundColor: "rgba(139,154,165,0.08)",
            }}
          >
            {icons[options.icon]}
          </Box>
        )}
        <Typography sx={{ color: palette.text, fontSize: "17px", fontWeight: 700, lineHeight: 1.2 }}>
          {options.title}
        </Typography>
      </DialogTitle>

      {options.message && (
        <DialogContent
          sx={{
            px: 2,
            py: 1.5,
            color: palette.muted,
            fontSize: "13px",
            textAlign: "center",
            whiteSpace: "pre-line",
          }}
        >
          {options.message}
        </DialogContent>
      )}

      <DialogActions sx={{ px: 2, py: 1.5, justifyContent: "center", gap: 1 }}>
        {options.cancelText && (
          <Button onClick={() => onClose(false)} sx={cancelButtonSx}>
            {options.cancelText}
          </Button>
        )}
        {options.confirmText && (
          <Button onClick={() => onClose(true)} variant="contained" sx={confirmButtonSx}>
            {options.confirmText}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AdminConfirmDialog;
