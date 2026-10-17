import React from "react";
import { Alert, Box, Button, Typography } from "@mui/material";
import DataTable from "react-data-table-component";
import palette from "../../../../theme/palette";
import { columnasCompras, etiquetas, filtrarCompras, money } from "../utils/comprasView";
import { exportarCompras } from "../services/exportarCompras";

const estilos = {
  table: { style: { backgroundColor: palette.surface } },
  tableWrapper: { style: { backgroundColor: palette.surface } },
  responsiveWrapper: { style: { backgroundColor: palette.surface, overflowX: "auto" } },
  headRow: { style: { backgroundColor: palette.surfaceAlt, borderBottomColor: "transparent" } },
  headCells: { style: { color: palette.muted, fontSize: 11 } },
  cells: { style: { color: palette.text, fontSize: 12 } },
  rows: { style: { backgroundColor: palette.surface, borderBottomColor: "transparent" }, highlightOnHoverStyle: { backgroundColor: palette.rowHover } },
  pagination: { style: { backgroundColor: palette.surface, color: palette.text } },
};
export default function SireComprasResultados({ datos, rows, tab, filtros, cambiarResultado, cargando, ocupado, documentoId, periodo }) {
  const esComparacion = tab === 2 || tab === 3;
  const conteos = filtrarCompras(datos.comparacion, { ...filtros, resultado: "" }).reduce((acc, r) => ({ ...acc, [r.resultado]: (acc[r.resultado] || 0) + 1 }), {});
  const monedas = [...new Set(rows.map(r => r.moneda || "PEN"))];
  const importe = campos => monedas.length > 1 ? "Varias monedas" : `${money(rows.reduce((s, r) => s + campos.reduce((t, c) => t + Number(r[c] || 0), 0), 0))} ${monedas[0] || "PEN"}`;
  const resumen = [["Comprobantes", rows.length], ["Base gravada", importe(["base001", "base002", "base003"])], ["IGV", importe(["igv001", "igv002", "igv003"])], ["No gravadas", importe(["base004"])], ["Total", importe(["total"])]];
  if (tab === 4) {
    const vistas = [["Registro de compras", datos.sistema, 0], ["Propuesta SUNAT", datos.propuesta?.detalle || [], 1], ["Comparación", datos.comparacion, 2], ["Observaciones", datos.comparacion.filter(r => r.resultado !== "COINCIDE"), 3]];
    return <Box sx={{ p: 1, display: "grid", gap: 1 }}><Typography sx={{ fontWeight: 800, fontSize: 15 }}>Exportar Reporte SIRE Compras</Typography><Typography sx={{ color: palette.muted, fontSize: 12 }}>Los archivos respetan el día y la búsqueda seleccionados.</Typography><Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 0.75 }}>{vistas.map(([label, base, tipo]) => {
      const registros = filtrarCompras(base, { ...filtros, resultado: "" });
      return <Box key={tipo} sx={{ border: `1px solid ${palette.borderSoft}`, borderRadius: 1, p: 1, bgcolor: palette.surfaceAlt }}><Typography sx={{ fontWeight: 800, fontSize: 13 }}>{label}</Typography><Typography sx={{ color: palette.muted, fontSize: 12, my: 0.5 }}>{registros.length} comprobantes</Typography><Button variant="outlined" disabled={ocupado || !registros.length} onClick={() => exportarCompras(registros, tipo, documentoId, periodo)} sx={{ textTransform: "none", borderRadius: 1 }}>Exportar Excel</Button></Box>;
    })}</Box></Box>;
  }
  return (
    <Box component="section" aria-label="Revisión de compras" sx={{ minWidth: 0, display: "grid", gap: 0.9, p: { xs: 0.85, md: 1 } }}>
      {esComparacion && !datos.propuesta && <Alert severity="info">Importa la propuesta SUNAT para comparar los comprobantes.</Alert>}
      {tab === 0 && <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(5, minmax(0, 1fr))" }, gap: 0.75 }}>{resumen.map(([label, value]) => <Box key={label} sx={{ border: `1px solid ${palette.borderSoft}`, borderRadius: 1, p: 1, bgcolor: palette.surfaceAlt, minWidth: 0 }}><Typography sx={{ color: palette.muted, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>{label}</Typography><Typography sx={{ color: palette.text, fontSize: 17, fontWeight: 900, mt: 0.35, overflowWrap: "anywhere" }}>{value}</Typography></Box>)}</Box>}
      {tab === 2 && datos.propuesta && <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(5, minmax(0, 1fr))" }, gap: 0.75 }}>{Object.entries(etiquetas).map(([key, label]) => <Box component="button" key={key} aria-label={`${label}: ${conteos[key] || 0}`} aria-pressed={filtros.resultado === key} onClick={() => cambiarResultado(filtros.resultado === key ? "" : key)} sx={{ border: `1px solid ${filtros.resultado === key ? palette.accent : palette.borderSoft}`, bgcolor: filtros.resultado === key ? palette.accentSoft : palette.surfaceAlt, color: palette.text, borderRadius: 1, p: 1, textAlign: "left", cursor: "pointer" }}><Typography sx={{ color: palette.muted, fontSize: 11, fontWeight: 900 }}>{label}</Typography><Typography sx={{ fontSize: 18, fontWeight: 900, mt: 0.35 }}>{conteos[key] || 0}</Typography></Box>)}</Box>}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}><Typography sx={{ color: palette.muted, fontSize: 12 }}>{rows.length} comprobantes</Typography><Button onClick={() => exportarCompras(rows, tab, documentoId, periodo)} disabled={!rows.length || ocupado} sx={{ textTransform: "none", fontSize: 12, fontWeight: 800 }}>Exportar Excel</Button></Box>
      <DataTable columns={columnasCompras(esComparacion ? 2 : tab)} data={rows} keyField={tab === 0 ? "num_asiento" : tab === 1 ? "linea" : "clave_comparacion"} customStyles={estilos} pagination paginationPerPage={25} paginationRowsPerPageOptions={[25, 50, 100]} highlightOnHover progressPending={cargando} noDataComponent={<Box sx={{ p: 3, color: palette.muted, fontSize: 12 }}>No hay comprobantes para esta vista y los filtros seleccionados.</Box>} />
    </Box>
  );
}
