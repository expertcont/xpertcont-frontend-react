import React, { useMemo } from "react";
import { Box, Dialog, IconButton, InputBase, Typography, useMediaQuery } from "@mui/material";
import DataTable from "react-data-table-component";
import { X } from "lucide-react";
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

const productosTableStyles = {
  table: { style: { backgroundColor: "transparent" } },
  headRow: {
    style: {
      minHeight: 34,
      backgroundColor: palette.bg,
      borderBottom: `1px solid ${palette.borderSoft}`,
    },
  },
  headCells: {
    style: {
      color: palette.muted,
      fontSize: "11px",
      fontWeight: 800,
      textTransform: "uppercase",
      paddingLeft: "10px",
      paddingRight: "10px",
    },
  },
  rows: {
    style: {
      minHeight: 46,
      backgroundColor: palette.surface,
      color: palette.text,
      borderBottom: `1px solid ${palette.borderSoft}`,
      cursor: "pointer",
      "&:hover": {
        backgroundColor: palette.surfaceAlt,
        boxShadow: `inset 3px 0 0 ${palette.accent}`,
      },
    },
    highlightOnHoverStyle: {
      backgroundColor: palette.surfaceAlt,
      color: palette.text,
      boxShadow: `inset 3px 0 0 ${palette.accent}`,
      outline: "none",
    },
  },
  cells: {
    style: {
      paddingLeft: "10px",
      paddingRight: "10px",
      fontSize: "13px",
    },
  },
  pagination: {
    style: {
      backgroundColor: "transparent",
      color: palette.muted,
      borderTop: `1px solid ${palette.borderSoft}`,
    },
    pageButtonsStyle: {
      color: palette.muted,
      fill: palette.muted,
      "&:hover:not(:disabled)": { backgroundColor: palette.accentSoft },
      "&:disabled": { color: palette.border, fill: palette.border },
    },
  },
  progress: {
    style: {
      backgroundColor: "transparent",
      color: palette.muted,
    },
  },
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

export default function ProductoSelectorModal({
  open,
  tipo,
  busqueda,
  busquedaRef,
  resumen,
  listado,
  cargando,
  error,
  resetPagina,
  onClose,
  onBusquedaChange,
  onSelect,
}) {
  const small = useMediaQuery("(max-width:600px)");

  const columnas = useMemo(() => [
    {
      name: "Descripcion",
      selector: row => row.descripcion,
      sortable: true,
      width: small ? "280px" : "380px",
      compact: true,
    },
    {
      name: "UND",
      selector: row => row.tipo === "SERVICIO" ? "M2" : row.cont_und || "-",
      sortable: true,
      width: "40px",
      compact: true,
      cell: row => (
        <Typography sx={{ color: palette.muted, fontSize: "13px", fontWeight: 400 }}>
          {row.tipo === "SERVICIO" ? "M2" : row.cont_und || "-"}
        </Typography>
      ),
    },
    {
      name: "Costo",
      selector: row => row.precio_compra,
      sortable: true,
      right: true,
      width: "60px",
      compact: true,
      cell: row => (
        <Typography sx={{ color: palette.text, fontSize: "13px", fontWeight: 400 }}>
          {Money({ value: row.precio_compra })}
        </Typography>
      ),
    },
    {
      name: "Tipo",
      selector: row => row.tipo,
      sortable: true,
      right: true,
      width: "80px",
      compact: true,
      cell: row => (
        <Typography sx={{ color: palette.text, fontSize: "12px", fontWeight: 400 }}>
          {row.tipo}
        </Typography>
      ),
    },
  ], [small]);

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
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "17px" }}>
              Seleccionar {tipo === "OPERARIO" ? "operario" : String(tipo || "").toLowerCase()}
            </Typography>
            <Typography sx={{ color: palette.muted, fontSize: "12px", mt: 0.25 }}>
              {cargando
                ? "Cargando productos..."
                : `${resumen.mostrados} mostrados · total ${resumen.total} · operario ${resumen.operario} · servicio ${resumen.servicio}`}
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: palette.muted }}>
            <X size={18} />
          </IconButton>
        </Box>

        <DemoField label="Buscar">
          <Box sx={{ ...fieldSx, mb: 1.5 }}>
            <InputBase
              autoFocus
              inputRef={busquedaRef}
              placeholder="Filtrar por codigo, descripcion o tipo"
              value={busqueda}
              onChange={(e) => onBusquedaChange(e.target.value)}
              sx={{ color: palette.text, fontSize: "13px", width: "100%" }}
            />
          </Box>
        </DemoField>

        {error && (
          <Typography sx={{ color: "#ffab91", fontSize: "13px", py: 1.5, textAlign: "center" }}>
            {error}
          </Typography>
        )}

        <DataTable
          columns={columnas}
          data={listado}
          customStyles={productosTableStyles}
          progressPending={cargando}
          noDataComponent="Sin resultados para la busqueda."
          pagination
          paginationPerPage={8}
          paginationResetDefaultPage={resetPagina}
          paginationRowsPerPageOptions={[8, 15, 30, 50]}
          dense
          highlightOnHover
          pointerOnHover
          onRowClicked={onSelect}
        />
      </Box>
    </Dialog>
  );
}
