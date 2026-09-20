import DataTable from "react-data-table-component";
import { Box, Button, Tooltip, Typography } from "@mui/material";
import { Calendar, Eye, FileCheck2, MapPin, PackageCheck, Pencil, Plus, Send } from "lucide-react";

import AppButton from "../../../../ui/AppButton";
import palette from "../../../../../theme/palette";
import { actionButtonSx, gremTableStyles } from "./gremStyles";

const estadoColor = (row = {}) => (row.vfirmado ? "#8fd19e" : "#f6c177");

const agenciaLabel = (id, nombre, fallback) => (
  [id, nombre].filter(Boolean).join(" - ") || fallback || "-"
);

function GremCard({ row, onEditar, onEnviar }) {
  const comprobante = [row.cod || "31", row.serie, row.numero].filter(Boolean).join("-");
  const estado = row.vfirmado ? "Enviada SUNAT" : "Grabada";
  const partida = agenciaLabel(row.id_punto_venta, row.partida_agencia_nombre, row.partida_ubigeo);
  const llegada = agenciaLabel(row.id_punto_venta_dest, row.llegada_agencia_nombre, row.llegada_ubigeo);

  return (
    <Box sx={{ width: "100%", py: 1.45 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "flex-start", flexWrap: "wrap" }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: palette.text, fontSize: 16, fontWeight: 900, display: "flex", alignItems: "center", gap: 0.6 }}>
            <FileCheck2 size={17} /> {comprobante}
          </Typography>
          <Typography sx={{ mt: 0.35, color: estadoColor(row), fontSize: 12, fontWeight: 800 }}>
            {estado}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 0.65 }}>
          <Tooltip title={row.vfirmado ? "Ver GREM enviada" : "Editar GREM"} arrow>
            <span>
              <Button
                onClick={() => onEditar(row)}
                sx={actionButtonSx}
              >
                {row.vfirmado ? <Eye size={15} /> : <Pencil size={15} />}
              </Button>
            </span>
          </Tooltip>
          <Tooltip title={row.vfirmado ? "GREM enviada a SUNAT" : "Enviar a SUNAT"} arrow>
            <span>
              <Button
                disabled={Boolean(row.vfirmado)}
                onClick={() => onEnviar(row)}
                sx={actionButtonSx}
              >
                <Send size={15} />
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ mt: 1.2, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr auto" }, gap: 1 }}>
        <Typography sx={{ color: palette.muted, fontSize: 12, display: "flex", alignItems: "center", gap: 0.5 }}>
          <Calendar size={14} /> Traslado: {row.fecha_traslado || "-"}
        </Typography>
        <Typography sx={{ color: palette.muted, fontSize: 12, display: "flex", alignItems: "center", gap: 0.5 }} noWrap>
          <MapPin size={14} /> {partida} -> {llegada}
        </Typography>
        <Typography sx={{ color: palette.text, fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", gap: 0.5 }}>
          <PackageCheck size={14} /> {row.cantidad_encomiendas || 0} encomienda(s)
        </Typography>
      </Box>

      {row.glosa && (
        <Typography sx={{ mt: 0.9, color: palette.muted, fontSize: 11.5 }} noWrap>
          {row.glosa}
        </Typography>
      )}
    </Box>
  );
}

export default function GremList({ gremList, loading, onAgregar, onEditar, onEnviar }) {
  const columns = [
    {
      name: "",
      grow: 1,
      cell: (row) => <GremCard row={row} onEditar={onEditar} onEnviar={onEnviar} />,
    },
  ];

  return (
    <Box sx={{ display: "grid", gap: 1.2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 1, flexWrap: { xs: "wrap", sm: "nowrap" } }}>
        <Box>
          <Typography sx={{ color: palette.text, fontSize: 13, fontWeight: 700 }}>
            GREM registradas: {gremList.length}
          </Typography>
          <Typography sx={{ color: palette.muted, fontSize: 11.5 }}>
            Primero graba la GREM, luego enviala a SUNAT.
          </Typography>
        </Box>
        <AppButton
          icon={<Plus size={18} />}
          onClick={onAgregar}
          sx={{
            backgroundColor: palette.accent,
            borderColor: palette.accent,
            color: palette.onAccent,
            fontWeight: 800,
            ml: { xs: "auto", sm: 0 },
            "&:hover": {
              backgroundColor: palette.accent,
              borderColor: palette.accent,
              color: palette.onAccent,
            },
          }}
        >
          Agregar
        </AppButton>
      </Box>

      <DataTable
        theme="transportesDark"
        columns={columns}
        data={gremList}
        progressPending={loading}
        pagination
        paginationPerPage={10}
        highlightOnHover
        responsive
        customStyles={gremTableStyles}
        noDataComponent={
          <Box sx={{ minHeight: 180, py: 4, color: palette.muted, display: "grid", placeItems: "center", textAlign: "center", gap: 0.5 }}>
            <Typography sx={{ color: palette.text, fontSize: 15, fontWeight: 900 }}>
              Sin GREM registradas
            </Typography>
            <Typography sx={{ color: palette.muted, fontSize: 12.5 }}>
              Usa Agregar para crear una nueva guia desde encomiendas pendientes.
            </Typography>
          </Box>
        }
      />
    </Box>
  );
}
