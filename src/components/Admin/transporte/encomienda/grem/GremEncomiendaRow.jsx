import { Box, Checkbox, Typography } from "@mui/material";
import { Calendar, MapPin, Package, ReceiptText, UserRound } from "lucide-react";

import AppChip from "../../../../ui/AppChip";
import palette from "../../../../../theme/palette";
import { formatMoney } from "../../common/utils/trUtils";
import { destinoDesdeRuta, encomiendaDocumento, tieneGrem } from "./gremUtils";

export default function GremEncomiendaRow({ row, checked, onToggle, disponible: disponibleProp }) {
  const disponible = typeof disponibleProp === "boolean" ? disponibleProp : !tieneGrem(row);
  const comprobante = encomiendaDocumento(row);
  const destino = destinoDesdeRuta(row);

  return (
    <Box
      onClick={() => {
        if (disponible) onToggle(row);
      }}
      sx={{
        width: "100%",
        py: 2,
        cursor: disponible ? "pointer" : "default",
        opacity: disponible ? 1 : 0.72,
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap", minWidth: 0 }}>
          <Box
            sx={{
              width: { xs: 40, sm: 30 },
              height: { xs: 40, sm: 30 },
              borderRadius: palette.radius.control,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: palette.accentSoft,
              color: palette.accent,
              flexShrink: 0,
            }}
          >
            <Package size={16} />
          </Box>
          <Checkbox
            checked={checked}
            disabled={!disponible}
            onClick={(event) => event.stopPropagation()}
            onChange={() => onToggle(row)}
            size="small"
            sx={{
              color: palette.muted,
              p: 0,
              "&.Mui-checked": { color: "#8fc7ff" },
              "&.Mui-disabled": { color: palette.border },
            }}
          />
          <Typography sx={{ color: palette.text, fontWeight: 700, fontSize: 15 }}>
            {comprobante || "Sin comprobante"}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mt: 1, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr auto" }, gap: 1.1, alignItems: "center" }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: palette.muted, fontSize: 11, display: "flex", alignItems: "center", gap: 0.5, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            <ReceiptText size={13} /> Rem
          </Typography>
          <Typography sx={{ color: palette.text, fontSize: 13 }} noWrap>
            {row.cliente || "-"} {row.cliente_documento ? `- ${row.cliente_documento}` : ""}
          </Typography>
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: palette.muted, fontSize: 11, display: "flex", alignItems: "center", gap: 0.5, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            <UserRound size={13} /> Dest
          </Typography>
          <Typography sx={{ color: palette.accent, fontSize: 13 }} noWrap>
            {row.destinatario || "-"} {row.destinatario_documento ? `- ${row.destinatario_documento}` : ""}
          </Typography>
        </Box>

        <Box sx={{ display: "grid", gap: 0.35, justifyItems: { xs: "flex-start", md: "flex-end" }, alignSelf: "stretch" }}>
          <Typography sx={{ color: palette.text, fontSize: 14, fontWeight: 800, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 0.45 }}>
            <Package size={15} /> {formatMoney(row.r_monto_total || row.precio_neto)}
          </Typography>
          <Typography sx={{ color: palette.muted, fontSize: 12, display: "flex", alignItems: "center", gap: 0.45, whiteSpace: "nowrap" }}>
            <Calendar size={13} /> {row.fecha}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 0.8, flexWrap: "wrap", color: palette.muted }}>
        <Typography sx={{ fontSize: 12, display: "flex", alignItems: "center", gap: 0.45 }}>
          <MapPin size={13} /> {destino}
        </Typography>
        {row.descripcion && <AppChip>{row.descripcion}</AppChip>}
      </Box>
    </Box>
  );
}
