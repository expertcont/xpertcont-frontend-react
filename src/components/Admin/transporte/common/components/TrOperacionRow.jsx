import React from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import {
  BadgeCheck,
  Bus,
  Calendar,
  MapPin,
  Package,
  Pencil,
  ReceiptText,
  Trash2,
  UserPen,
} from "lucide-react";

import AppChip from "../../../../ui/AppChip";
import palette from "../../../../../theme/palette";
import { formatMoney } from "../utils/trUtils";

export const customStyles = {
  table: { style: { backgroundColor: "transparent" } },
  headRow: { style: { display: "none" } },
  rows: {
    style: {
      backgroundColor: palette.surface,
      color: palette.text,
      minHeight: "112px",
      marginBottom: "10px",
      borderRadius: "12px",
      border: `1px solid ${palette.borderSoft}`,
      paddingLeft: "16px",
      paddingRight: "16px",
      transition: "border-color .18s ease, background-color .18s ease",
      "&:hover": {
        backgroundColor: palette.surfaceAlt,
        borderColor: palette.border,
      },
    },
  },
  pagination: {
    style: {
      backgroundColor: "transparent",
      color: palette.muted,
      borderTop: `1px solid ${palette.borderSoft}`,
      marginTop: "8px",
    },
    pageButtonsStyle: {
      color: palette.muted,
      fill: palette.muted,
      "&:hover:not(:disabled)": { backgroundColor: palette.accentSoft },
      "&:disabled": { color: palette.border, fill: palette.border },
    },
  },
};

const actionButtonSx = (danger = false) => ({
  width: { xs: 42, sm: 30 },
  height: { xs: 42, sm: 30 },
  borderRadius: { xs: 2, sm: 1.5 },
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: palette.chip,
  border: `1px solid ${palette.border}`,
  color: palette.muted,
  cursor: "pointer",
  transition: "all .18s ease",
  boxShadow: { xs: "0 8px 18px rgba(0,0,0,.16)", sm: "none" },
  "& svg": {
    width: { xs: 20, sm: 14 },
    height: { xs: 20, sm: 14 },
  },
  "&:hover": {
    backgroundColor: danger ? "#c2410c" : palette.accent,
    borderColor: danger ? "#c2410c" : palette.accent,
    color: "#ffffff",
  },
});

function TrOperacionRow({ row, onEdit, onDelete, onEntrega }) {
  return (
    <Box sx={{ width: "100%", py: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: { xs: "wrap", sm: "nowrap" },
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, flexWrap: "wrap" }}>
          <Box
            sx={{
              width: { xs: 40, sm: 30 },
              height: { xs: 40, sm: 30 },
              borderRadius: { xs: 2, sm: 1.5 },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: palette.accentSoft,
              color: palette.accent,
              flexShrink: 0,
            }}
          >
            {row.tipo_operacion === "E" ? <Package size={16} /> : <Bus size={16} />}
          </Box>

          <Typography sx={{ color: palette.text, fontWeight: 700, fontSize: "15px" }}>
            {row.numero}
          </Typography>

          <AppChip>{row.tipoLabel}</AppChip>

          {row.tipo_operacion === "E" && (
            <AppChip>{row.entregada ? "Entregada" : "Pendiente entrega"}</AppChip>
          )}
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: { xs: 0.85, sm: 1 },
            width: { xs: "100%", sm: "auto" },
            mt: { xs: 0.75, sm: 0 },
          }}
        >
          {row.tipo_operacion === "E" && (
            <Tooltip title="Registrar entrega" arrow>
              <Box onClick={() => onEntrega(row)} sx={actionButtonSx(false)}>
                <BadgeCheck size={14} />
              </Box>
            </Tooltip>
          )}

          <Tooltip title="Editar operacion" arrow>
            <Box onClick={() => onEdit(row)} sx={actionButtonSx(false)}>
              <Pencil size={14} />
            </Box>
          </Tooltip>

          <Tooltip title="Eliminar operacion" arrow>
            <Box onClick={() => onDelete(row)} sx={actionButtonSx(true)}>
              <Trash2 size={14} />
            </Box>
          </Tooltip>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              color: palette.accent,
              fontWeight: 600,
              fontSize: "12.5px",
              height: { xs: 42, sm: "auto" },
            }}
          >
            <Calendar size={13} />
            {row.fecha}
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          mt: 1,
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: 0.75,
          color: palette.muted,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0, width: { xs: "100%", sm: "auto" } }}>
          <ReceiptText size={13} style={{ flexShrink: 0 }} />
          <Typography sx={{ fontSize: "13px", color: palette.muted }} noWrap>
            {row.clienteLabel}
            {row.cliente_documento ? ` - ${row.cliente_documento}` : ""}
          </Typography>
        </Box>
        <Typography sx={{ color: palette.text, fontSize: "14px", fontWeight: 800, whiteSpace: "nowrap", ml: { xs: 2.5, sm: 1 } }}>
          {formatMoney(row.total)}
        </Typography>
      </Box>

      <Box
        sx={{
          mt: 1.75,
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 0.75,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.75, minWidth: 0, flex: "1 1 260px" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: palette.muted, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", mr: 0.5 }}>
            <MapPin size={13} />
            {row.rutaLabel}
          </Box>
          <AppChip>{row.servicioLabel}</AppChip>
          {row.placa && <AppChip>{row.placa}</AppChip>}
          {row.tipo_operacion === "B" && row.asiento && <AppChip>Asiento {row.asiento}</AppChip>}
          {row.tipo_operacion === "E" && row.destinatario && <AppChip>Destino: {row.destinatario}</AppChip>}
        </Box>

        <Box
          sx={{
            ml: { xs: 0, sm: "auto" },
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            minWidth: 0,
            width: { xs: "100%", sm: "auto" },
            maxWidth: { xs: "100%", sm: "36%" },
            color: palette.muted,
          }}
        >
          <UserPen size={14} style={{ flexShrink: 0 }} />
          <Typography sx={{ color: palette.muted, fontSize: "12.5px", minWidth: 0 }} noWrap>
            {row.autor}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

// react-data-table-component pide columnas. Usamos una sola columna que renderiza una tarjeta.
export const createColumns = ({ onEdit, onDelete, onEntrega }) => [
  {
    name: "",
    grow: 1,
    cell: (row) => (
      <TrOperacionRow
        row={row}
        onEdit={onEdit}
        onDelete={onDelete}
        onEntrega={onEntrega}
      />
    ),
  },
];
