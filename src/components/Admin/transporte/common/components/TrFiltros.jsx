import React from "react";
import { Box } from "@mui/material";

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
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "minmax(0, 1fr)",
          md: puntosVentaAsignados.length > 0
            ? "180px minmax(280px, 420px) 260px"
            : "180px minmax(280px, 460px)",
        },
        gap: { xs: 0.5, md: 2 },
        alignItems: "end",
        justifyContent: "flex-start",
        mb: { xs: 1, md: 2 },
        p: { xs: 0.75, md: 2 },
        borderRadius: 3,
        backgroundColor: palette.surface,
        border: `1px solid ${palette.border}`,
      }}
    >
      <Box sx={{ width: "100%", minWidth: 0, maxWidth: "100%" }}>
        <TrHeaderMenuPicker
          label="Periodo"
          value={periodoTrabajo}
          displayValue={periodoTrabajo}
          minWidth="100%"
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

      {puntosVentaAsignados.length > 0 && (
        <Box sx={{ width: "100%", minWidth: 0, maxWidth: "100%" }}>
          <TrHeaderMenuPicker
            label="Punto venta"
            value={puntoVentaTrabajo}
            displayValue={puntosVentaAsignados.find((item) => item.id_punto_venta === puntoVentaTrabajo)?.nombre || puntoVentaTrabajo}
            minWidth="100%"
            options={puntosVentaAsignados.map((item) => ({
              value: item.id_punto_venta,
              label: `${item.id_punto_venta} - ${item.nombre}`,
            }))}
            onSelect={onPuntoVentaSelect}
          />
        </Box>
      )}
    </Box>
  );
}
