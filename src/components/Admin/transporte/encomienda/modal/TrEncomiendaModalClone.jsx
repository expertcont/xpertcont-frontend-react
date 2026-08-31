import React, { useEffect, useRef, useState } from "react";
import { Box, Dialog, IconButton, InputBase, Typography } from "@mui/material";
import { Search, X } from "lucide-react";

import palette from "../../../../../theme/palette";
import { fieldSx, inputSx } from "./TrEncomiendaModalInputs";
import {
  fechaClone,
  montoClone,
  numeroOperacionClone,
} from "./trEncomiendaModalUtils";

export default function TrEncomiendaModalClone({ open, loading, rows, initialSearch, onClose, onSelect }) {
  const [busqueda, setBusqueda] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const busquedaRef = useRef(null);
  const selectedOptionRef = useRef(null);

  const search = String(busqueda || "").toLowerCase();
  const filtradas = rows.filter((item) => item._cloneText?.includes(search));

  useEffect(() => {
    if (open) {
      setBusqueda(initialSearch || "");
      setSelectedIndex(0);
      window.setTimeout(() => {
        busquedaRef.current?.focus();
        busquedaRef.current?.select?.();
      }, 80);
    }
  }, [initialSearch, open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [busqueda]);

  useEffect(() => {
    if (selectedIndex >= filtradas.length) {
      setSelectedIndex(Math.max(0, filtradas.length - 1));
    }
  }, [filtradas.length, selectedIndex]);

  useEffect(() => {
    selectedOptionRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [selectedIndex]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { backgroundColor: palette.surface, color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 3 } }}>
      <Box sx={{ p: 1.1 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800, fontSize: "15px" }}>Clonar encomienda</Typography>
            <Typography sx={{ color: palette.muted, fontSize: "11px" }}>Ultimas encomiendas de los 3 ultimos periodos</Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: palette.muted }}>
            <X size={18} />
          </IconButton>
        </Box>

        <Box sx={{ ...fieldSx, mb: 0.9 }}>
          <Box sx={{ color: palette.muted, display: "flex", mr: 0.6 }}>
            <Search size={15} />
          </Box>
          <InputBase
            inputRef={busquedaRef}
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" && filtradas.length > 0) {
                event.preventDefault();
                setSelectedIndex((prev) => Math.min(prev + 1, filtradas.length - 1));
                return;
              }
              if (event.key === "ArrowUp" && filtradas.length > 0) {
                event.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
                return;
              }
              if (event.key === "Enter" && filtradas[selectedIndex]) {
                event.preventDefault();
                onSelect(filtradas[selectedIndex]);
              }
            }}
            placeholder="Buscar por DNI, remitente, destinatario, descripcion, placa..."
            sx={inputSx}
            autoFocus
          />
        </Box>

        <Box sx={{ maxHeight: 420, overflowY: "auto", display: "grid", gap: 0.65 }}>
          {loading && (
            <Typography sx={{ color: palette.muted, fontSize: "12px", py: 2 }}>
              Cargando historial...
            </Typography>
          )}

          {!loading && filtradas.length === 0 && (
            <Typography sx={{ color: palette.muted, fontSize: "12px", py: 2 }}>
              No hay encomiendas recientes para clonar.
            </Typography>
          )}

          {!loading && filtradas.map((item, index) => (
            <Box
              key={`${item.r_fecemi}-${item.r_cod}-${item.r_serie}-${item.r_numero}-${item.elemento || 1}`}
              ref={index === selectedIndex ? selectedOptionRef : null}
              onClick={() => onSelect(item)}
              sx={{
                p: 0.85,
                borderRadius: 2,
                border: `1px solid ${index === selectedIndex ? palette.accent : palette.borderSoft}`,
                backgroundColor: index === selectedIndex ? palette.accentSoft : palette.bg,
                cursor: "pointer",
                transition: "all .16s ease",
                "&:hover": {
                  borderColor: palette.accent,
                  backgroundColor: palette.surfaceAlt,
                },
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                <Typography sx={{ color: palette.text, fontWeight: 800, fontSize: "13px" }}>
                  {fechaClone(item.r_fecemi)} - {numeroOperacionClone(item)}
                </Typography>
                <Typography sx={{ color: palette.accent, fontWeight: 800, fontSize: "12px" }}>
                  {montoClone(item.r_monto_total || item.precio_neto)}
                </Typography>
              </Box>
              <Typography sx={{ color: palette.text, fontSize: "12.5px", mt: 0.35 }} noWrap>
                {item.cliente || "Sin remitente"} {item.cliente_documento || item.cliente_documento_id ? `- ${item.cliente_documento || item.cliente_documento_id}` : ""}
              </Typography>
              <Typography sx={{ color: palette.muted, fontSize: "11.5px", mt: 0.2 }} noWrap>
                Para: {item.destinatario || "Sin destinatario"} | {item.descripcion || "Sin descripcion"}
              </Typography>
              <Typography sx={{ color: palette.muted, fontSize: "11px", mt: 0.2 }} noWrap>
                Ruta: {item.id_ruta || "-"} | Placa: {item.placa || "-"} | Licencia: {item.licencia || "-"}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Dialog>
  );
}
