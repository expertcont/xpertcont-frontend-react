import React from "react";
import { Box } from "@mui/material";
import { Ban, CheckCircle2 } from "lucide-react";

import palette from "../../../../../theme/palette";
import TrHeaderMenuPicker from "./TrHeaderMenuPicker";

// Filtros operativos del listado: periodo, empresa y punto de venta autorizado.
export default function TrFiltros({
  periodoTrabajo,
  periodoSelect,
  contabilidadTrabajo,
  contabilidadSelect,
  puntosVentaAsignados,
  puntoVentaTrabajo,
  onPeriodoSelect,
  onContabilidadSelect,
  onPuntoVentaSelect,
  mostrarAnuladas = false,
  onToggleAnuladas,
  filtroDerechaPuntoVenta = null,
  compact = false,
}) {
  const mostrarPuntoVenta = puntosVentaAsignados.length > 0;
  const mostrarControlAnuladas = mostrarPuntoVenta && Boolean(onToggleAnuladas);
  const mostrarFiltroDerecha = Boolean(filtroDerechaPuntoVenta);
  const columnasConPuntoVenta = [
    compact ? "150px" : "180px",
    compact ? "minmax(220px, 360px)" : "minmax(280px, 420px)",
    compact ? "220px" : "260px",
    mostrarControlAnuladas ? (compact ? "170px" : "180px") : null,
    mostrarFiltroDerecha ? (compact ? "220px" : "260px") : null,
  ].filter(Boolean).join(" ");

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "minmax(0, 1fr)",
          md: mostrarPuntoVenta
            ? columnasConPuntoVenta
            : `${compact ? "150px minmax(220px, 390px)" : "180px minmax(280px, 460px)"}`,
        },
        gap: compact ? { xs: 0.25, md: 0.75 } : { xs: 0.5, md: 2 },
        alignItems: "end",
        justifyContent: "flex-start",
        mb: compact ? { xs: 0.5, md: 0.75 } : { xs: 1, md: 2 },
        p: compact ? { xs: 0.25, md: 0.5 } : { xs: 0.75, md: 2 },
        borderRadius: compact ? 0 : palette.radius.listCard,
        backgroundColor: compact ? "transparent" : palette.surface,
        border: compact ? "none" : `1px solid ${palette.border}`,
      }}
    >
      <Box sx={{ width: "100%", minWidth: 0, maxWidth: "100%" }}>
        <TrHeaderMenuPicker
          label="Periodo"
          value={periodoTrabajo}
          displayValue={periodoTrabajo}
          minWidth="100%"
          compact={compact}
          options={[
            { value: "default", label: "SELECCIONA" },
            ...periodoSelect.map((item) => ({
              value: item.periodo,
              label: item.periodo,
            })),
          ]}
          onSelect={onPeriodoSelect}
        />
      </Box>

      <Box sx={{ width: "100%", minWidth: 0, maxWidth: "100%" }}>
        <TrHeaderMenuPicker
          label="Empresa"
          value={contabilidadTrabajo}
          displayValue={contabilidadSelect.find((item) => item.documento_id === contabilidadTrabajo)?.razon_social || contabilidadTrabajo}
          minWidth="100%"
          compact={compact}
          options={[
            { value: "default", label: "SELECCIONA" },
            ...contabilidadSelect.map((item) => ({
              value: item.documento_id,
              label: item.razon_social,
            })),
          ]}
          onSelect={onContabilidadSelect}
        />
      </Box>

      {mostrarPuntoVenta && (
        <Box sx={{ width: "100%", minWidth: 0, maxWidth: "100%" }}>
          <TrHeaderMenuPicker
            label="Punto venta"
            value={puntoVentaTrabajo}
            displayValue={puntosVentaAsignados.find((item) => item.id_punto_venta === puntoVentaTrabajo)?.nombre || puntoVentaTrabajo}
            minWidth="100%"
            compact={compact}
            options={puntosVentaAsignados.map((item) => ({
              value: item.id_punto_venta,
              label: `${item.id_punto_venta} - ${item.nombre}`,
            }))}
            onSelect={onPuntoVentaSelect}
          />
        </Box>
      )}

      {mostrarControlAnuladas && (
        <Box
          role="switch"
          tabIndex={0}
          aria-checked={mostrarAnuladas}
          aria-label={mostrarAnuladas ? "Mostrando anulados" : "Mostrando activos"}
          onClick={onToggleAnuladas}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onToggleAnuladas();
            }
          }}
          sx={{
            position: "relative",
            isolation: "isolate",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            alignItems: "center",
            width: "100%",
            minWidth: 0,
            boxSizing: "border-box",
            height: { xs: compact ? 31 : 33, md: compact ? 34 : 42 },
            mt: compact ? 0 : "18px",
            p: "3px",
            border: `1px solid ${mostrarAnuladas ? "rgba(245,158,11,0.45)" : palette.border}`,
            borderRadius: "7px",
            backgroundColor: mostrarAnuladas ? "rgba(245,158,11,0.12)" : palette.surface,
            color: palette.text,
            cursor: "pointer",
            userSelect: "none",
            transition: "border-color .18s ease, background-color .18s ease, box-shadow .18s ease",
            boxShadow: mostrarAnuladas ? "0 8px 18px rgba(245,158,11,0.10)" : "none",
            "&:hover": {
              borderColor: mostrarAnuladas ? "rgba(245,158,11,0.58)" : palette.accent,
              backgroundColor: mostrarAnuladas ? "rgba(245,158,11,0.16)" : palette.chip,
            },
            "&:focus-visible": {
              outline: "none",
              boxShadow: `0 0 0 3px ${palette.accentSoft}`,
            },
            "&::before": {
              content: '""',
              position: "absolute",
              zIndex: -1,
              top: 3,
              bottom: 3,
              left: mostrarAnuladas ? "calc(50% + 1px)" : 3,
              width: "calc(50% - 4px)",
              borderRadius: "5px",
              backgroundColor: mostrarAnuladas ? "rgba(245,158,11,0.26)" : palette.accentSoft,
              border: `1px solid ${mostrarAnuladas ? "rgba(245,158,11,0.38)" : "rgba(47,111,237,0.22)"}`,
              transition: "left .2s ease, background-color .18s ease, border-color .18s ease",
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.4,
              minWidth: 0,
              fontSize: compact ? "11px" : "12px",
              fontWeight: 800,
              lineHeight: 1,
              color: mostrarAnuladas ? palette.muted : palette.accent,
              transition: "color .18s ease",
            }}
          >
            <CheckCircle2 size={compact ? 14 : 15} />
            Activos
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.4,
              minWidth: 0,
              fontSize: compact ? "11px" : "12px",
              fontWeight: 800,
              lineHeight: 1,
              color: mostrarAnuladas ? "#fbbf24" : palette.muted,
              transition: "color .18s ease",
            }}
          >
            <Ban size={compact ? 14 : 15} />
            Anulados
          </Box>
        </Box>
      )}

      {mostrarPuntoVenta && filtroDerechaPuntoVenta}
    </Box>
  );
}
