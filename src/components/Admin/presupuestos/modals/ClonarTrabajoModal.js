import React, { useEffect, useState } from "react";
import { Box, Dialog, IconButton, InputBase, MenuItem, Select, Typography } from "@mui/material";
import { CopyPlus, X } from "lucide-react";
import AppButton from "../../../ui/AppButton";
import palette from "../../../../theme/palette";

const numeroPresupuesto = (presupuesto) => [
  presupuesto?.r_cod || "NV",
  presupuesto?.r_serie || "0001",
  presupuesto?.r_numero,
].filter(Boolean).join("-");

const fieldSx = {
  height: 42,
  px: 1.25,
  display: "flex",
  alignItems: "center",
  width: "100%",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  backgroundColor: palette.bg,
  border: `1px solid ${palette.border}`,
  borderRadius: 2,
  color: palette.text,
};

const selectTextSx = {
  p: 0,
  pr: "26px",
  display: "block",
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const menuItemSx = {
  display: "block",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  maxWidth: "100%",
};

function FieldLabel({ children }) {
  return (
    <Typography sx={{ color: palette.muted, fontSize: "11px", fontWeight: 800, textTransform: "uppercase", mb: 0.65 }}>
      {children}
    </Typography>
  );
}

export default function ClonarTrabajoModal({
  open,
  trabajoInfo,
  periodoOptions,
  contabilidadOptions,
  defaultPeriodo,
  defaultDocumentoId,
  onClose,
  onConfirm,
  loading = false,
}) {
  const presupuesto = trabajoInfo?.presupuesto;
  const trabajo = trabajoInfo?.trabajo;
  const [destino, setDestino] = useState({
    documento_id: "",
    periodo: "",
    r_cod: "NV",
    r_serie: "0001",
    r_numero: "",
    elemento: 1,
  });

  useEffect(() => {
    if (!open || !presupuesto) {
      return;
    }

    setDestino({
      documento_id: defaultDocumentoId || presupuesto.documento_id || "",
      periodo: defaultPeriodo || presupuesto.periodo || "",
      r_cod: presupuesto.r_cod || "NV",
      r_serie: presupuesto.r_serie || "0001",
      r_numero: presupuesto.r_numero || "",
      elemento: presupuesto.elemento || 1,
    });
  }, [defaultDocumentoId, defaultPeriodo, open, presupuesto]);

  const handleChange = (name, value) => {
    setDestino(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleConfirm = () => {
    if (loading) {
      return;
    }

    onConfirm(destino);
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: palette.surface,
          color: palette.text,
          border: `1px solid ${palette.border}`,
          borderRadius: 3,
          overflow: "hidden",
          maxWidth: { xs: "calc(100% - 24px)", sm: 420 },
        },
      }}
    >
      <Box sx={{ p: 2.25 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, mb: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: palette.accent, fontSize: "12px", fontWeight: 800, textTransform: "uppercase" }}>
              Clonar trabajo
            </Typography>
            <Typography sx={{ color: palette.text, fontSize: "19px", fontWeight: 800, mt: 0.35, lineHeight: 1.15 }} noWrap>
              {trabajo?.descripcion || `Servicio ${trabajo?.servicio || ""}`}
            </Typography>
            <Typography sx={{ color: palette.muted, fontSize: "12.5px", mt: 0.65 }} noWrap>
              Origen: {numeroPresupuesto(presupuesto)}
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            disabled={loading}
            sx={{
              color: palette.muted,
              width: 38,
              height: 38,
              border: `1px solid ${palette.border}`,
              backgroundColor: palette.bg,
              "&:hover": { color: palette.text, backgroundColor: palette.accentSoft },
            }}
          >
            <X size={18} />
          </IconButton>
        </Box>

        <Box sx={{ display: "grid", gap: 1.35 }}>
          <Box sx={{ minWidth: 0, width: "100%" }}>
            <FieldLabel>Empresa destino</FieldLabel>
            <Select
              fullWidth
              size="small"
              value={destino.documento_id}
              onChange={(e) => handleChange("documento_id", e.target.value)}
              renderValue={(selected) => {
                const selectedItem = contabilidadOptions.find((item) => item.documento_id === selected);
                return (
                  <Typography component="span" noWrap sx={{ display: "block", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {selectedItem?.razon_social || selectedItem?.documento_id || selected}
                  </Typography>
                );
              }}
              sx={{ ...fieldSx, ".MuiSelect-select": selectTextSx, ".MuiSelect-icon": { color: palette.muted } }}
              MenuProps={{ PaperProps: { sx: { bgcolor: palette.surface, color: palette.text, maxWidth: 380 } } }}
            >
              {contabilidadOptions.map((item) => (
                <MenuItem key={item.documento_id} value={item.documento_id} sx={menuItemSx}>
                  {item.razon_social || item.documento_id}
                </MenuItem>
              ))}
            </Select>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "0.72fr 1.28fr" }, gap: 1 }}>
            <Box sx={{ minWidth: 0 }}>
              <FieldLabel>Periodo</FieldLabel>
              <Select
                fullWidth
                size="small"
                value={destino.periodo}
                onChange={(e) => handleChange("periodo", e.target.value)}
                sx={{ ...fieldSx, ".MuiSelect-select": selectTextSx, ".MuiSelect-icon": { color: palette.muted } }}
                MenuProps={{ PaperProps: { sx: { bgcolor: palette.surface, color: palette.text } } }}
              >
                {periodoOptions.map((item) => (
                  <MenuItem key={item.periodo} value={item.periodo} sx={menuItemSx}>
                    {item.periodo}
                  </MenuItem>
                ))}
              </Select>
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <FieldLabel>Presupuesto destino</FieldLabel>
              <Box sx={{ ...fieldSx, flexWrap: "nowrap" }}>
                <Typography sx={{ color: palette.muted, fontSize: "12px", fontWeight: 800, mr: 0.75, whiteSpace: "nowrap", flexShrink: 0 }}>
                  NV-0001-
                </Typography>
                <InputBase
                  value={destino.r_numero}
                  onChange={(e) => handleChange("r_numero", e.target.value)}
                  placeholder="0000001"
                  sx={{ color: palette.text, fontSize: "13px", flex: 1, minWidth: 0 }}
                />
              </Box>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            mt: 2,
            p: 1.25,
            borderRadius: 2,
            backgroundColor: palette.bg,
            border: `1px solid ${palette.borderSoft}`,
          }}
        >
          <Typography sx={{ color: palette.muted, fontSize: "12px", lineHeight: 1.45 }}>
            Se copiara el trabajo completo con sus materiales, operarios, servicios y costos hacia el presupuesto destino.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1, mt: 2, flexDirection: { xs: "column", sm: "row" } }}>
          <AppButton
            fullWidth
            icon={<X size={16} />}
            onClick={loading ? undefined : onClose}
            sx={{
              minHeight: 42,
              opacity: loading ? 0.55 : 1,
              pointerEvents: loading ? "none" : "auto",
            }}
          >
            Cancelar
          </AppButton>
          <AppButton
            fullWidth
            icon={<CopyPlus size={16} />}
            onClick={handleConfirm}
            sx={{
              minHeight: 42,
              opacity: loading ? 0.75 : 1,
              pointerEvents: loading ? "none" : "auto",
            }}
          >
            {loading ? "Clonando..." : "Clonar"}
          </AppButton>
        </Box>
      </Box>
    </Dialog>
  );
}
