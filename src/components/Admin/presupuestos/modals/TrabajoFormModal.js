import React from "react";
import { Box, Dialog, Grid, IconButton, InputBase, Typography } from "@mui/material";
import { Pencil, Plus, Save, X } from "lucide-react";
import AppButton from "../../../ui/AppButton";
import AppIconBox from "../../../ui/AppIconBox";
import palette from "../../../../theme/palette";

const fieldSx = {
  height: 42,
  px: 1.5,
  display: "flex",
  alignItems: "center",
  backgroundColor: palette.bg,
  border: `1px solid ${palette.border}`,
  borderRadius: 2,
  color: palette.text,
  fontSize: "13px",
};

const multilineFieldSx = {
  ...fieldSx,
  height: "auto",
  minHeight: 150,
  alignItems: "flex-start",
  py: 1,
};

function DemoField({ label, children }) {
  return (
    <Box>
      <Typography sx={{ color: palette.muted, fontSize: "11px", mb: 0.75, textTransform: "uppercase" }}>
        {label}
      </Typography>
      {children}
    </Box>
  );
}

function Money({ value }) {
  return Number(value || 0).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function TrabajoFormModal({
  open,
  editId,
  draft,
  moneda,
  summary,
  NumberStepper,
  onClose,
  onDraftChange,
  onSave,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: palette.surface,
          color: palette.text,
          border: `1px solid ${palette.border}`,
          borderRadius: 3,
        },
      }}
    >
      <Box sx={{ p: 2.25 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <AppIconBox>
              {editId ? <Pencil size={16} /> : <Plus size={16} />}
            </AppIconBox>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "17px" }}>
                {editId ? "Modificar trabajo" : "Agregar trabajo"}
              </Typography>
              <Typography sx={{ color: palette.muted, fontSize: "13px" }}>
                Cabecera del servicio presupuestado
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: palette.muted }}>
            <X size={18} />
          </IconButton>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <DemoField label="Producto">
              <Box sx={fieldSx}>
                <InputBase
                  autoFocus
                  placeholder="Producto o servicio en una linea"
                  value={draft.descripcion}
                  onChange={(e) => onDraftChange("descripcion", e.target.value)}
                  sx={{ color: palette.text, fontSize: "13px", width: "100%" }}
                />
              </Box>
            </DemoField>
          </Grid>
          <Grid item xs={12}>
            <DemoField label="Especificacion">
              <Box sx={multilineFieldSx}>
                <InputBase
                  multiline
                  minRows={6}
                  placeholder="Detalle del trabajo, medidas y condiciones"
                  value={draft.especificacion}
                  onChange={(e) => onDraftChange("especificacion", e.target.value)}
                  sx={{
                    color: palette.text,
                    fontSize: "13px",
                    lineHeight: 1.5,
                    width: "100%",
                    alignItems: "flex-start",
                  }}
                />
              </Box>
            </DemoField>
          </Grid>
          <Grid item xs={12} md={3}>
            <DemoField label="Cantidad">
              <Box sx={fieldSx}>
                <InputBase
                  type="number"
                  value={draft.cantidad}
                  onChange={(e) => onDraftChange("cantidad", e.target.value)}
                  sx={{ color: palette.text, fontSize: "13px", width: "100%", "& input": { textAlign: "right" } }}
                />
              </Box>
            </DemoField>
          </Grid>
          <Grid item xs={12} md={3}>
            <DemoField label="Utilidad %">
              {NumberStepper ? (
                <NumberStepper
                  value={draft.utilidad}
                  onChange={(value) => onDraftChange("utilidad", value)}
                  min={0}
                  step={1}
                  placeholder="0"
                  minWidth={96}
                  suffix="%"
                />
              ) : (
                <Box sx={fieldSx}>
                  <InputBase
                    type="number"
                    value={draft.utilidad}
                    onChange={(e) => onDraftChange("utilidad", e.target.value)}
                    sx={{ color: palette.text, fontSize: "13px", width: "100%", "& input": { textAlign: "right" } }}
                  />
                  <Typography sx={{ color: palette.muted, fontSize: "12px", ml: 0.5 }}>
                    %
                  </Typography>
                </Box>
              )}
            </DemoField>
          </Grid>
          <Grid item xs={12} md={3}>
            <DemoField label="Total referencial">
              <Box sx={fieldSx}>
                <InputBase
                  type="number"
                  value={draft.r_monto_total}
                  onChange={(e) => onDraftChange("r_monto_total", e.target.value)}
                  sx={{ color: palette.text, fontSize: "13px", width: "100%", "& input": { textAlign: "right" } }}
                />
              </Box>
            </DemoField>
          </Grid>
          <Grid item xs={12} md={3}>
            <DemoField label="Base e IGV">
              <Box sx={{ ...fieldSx, height: "auto", minHeight: 42, flexDirection: "column", alignItems: "stretch", justifyContent: "center", color: palette.accent, fontWeight: 800 }}>
                <Box sx={{ textAlign: "right" }}>
                  {moneda} {Money({ value: summary.precio_neto })}
                </Box>
                <Typography sx={{ color: palette.muted, fontSize: "11px", textAlign: "right", mt: 0.25 }}>
                  Base {Money({ value: summary.monto_base })} · IGV {Money({ value: summary.igv })}
                </Typography>
              </Box>
            </DemoField>
          </Grid>
        </Grid>

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2.5 }}>
          <AppButton onClick={onClose}>
            Cancelar
          </AppButton>
          <AppButton icon={<Save size={16} />} onClick={onSave}>
            Guardar trabajo
          </AppButton>
        </Box>
      </Box>
    </Dialog>
  );
}
