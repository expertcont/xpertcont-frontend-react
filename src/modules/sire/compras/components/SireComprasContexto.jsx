import React from "react";
import { Box } from "@mui/material";
import SireComprasPicker from "./SireComprasPicker";

export default function SireComprasContexto({ periodo, documentoId, periodos, empresas, ocupado, cambiarPeriodo, cambiarEmpresa }) {
  const periodosDisponibles = [...new Set([periodo, ...periodos.map(p => p.periodo)].filter(Boolean))];
  const empresasDisponibles = empresas.some(e => e.documento_id === documentoId) || !documentoId ? empresas : [{ documento_id: documentoId, razon_social: documentoId }, ...empresas];
  return (
    <Box component="section" aria-label="Empresa y período de SIRE Compras" sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "150px minmax(220px, 390px)" }, gap: { xs: 0.25, md: 0.75 }, alignItems: "end", justifyContent: "flex-start", mb: { xs: 0.5, md: 0.75 }, p: { xs: 0.25, md: 0.5 }, minWidth: 0 }}>
      <SireComprasPicker label="Periodo" ariaLabel="Período" value={periodo} options={periodosDisponibles.map(p => ({ value: p, label: p }))} onSelect={cambiarPeriodo} disabled={ocupado} />
      <SireComprasPicker label="Empresa" ariaLabel="Empresa / RUC" value={documentoId} displayValue={empresasDisponibles.find(e => e.documento_id === documentoId)?.razon_social} options={empresasDisponibles.filter(e => /^\d{11}$/.test(e.documento_id)).map(e => ({ value: e.documento_id, label: `${e.razon_social} · ${e.documento_id}` }))} onSelect={cambiarEmpresa} disabled={ocupado} />
    </Box>
  );
}
