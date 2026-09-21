import React from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import {
  Bus,
  Calendar,
  CheckCircle2,
  Clock3,
  Eye,
  Ban,
  MapPin,
  Package,
  Pencil,
  ReceiptText,
  Trash2,
  UserPen,
  UserRound,
} from "lucide-react";

import AppChip from "../../../../ui/AppChip";
import AdminSunatIcon from "../../../AdminSunatIcon";
import palette from "../../../../../theme/palette";
import { formatMoney } from "../utils/trUtils";
import SunatIcon from "../../../../../assets/images/sunat0.png";

export const customStyles = {
  table: { style: { backgroundColor: "transparent" } },
  headRow: { style: { display: "none" } },
  rows: {
    style: {
      backgroundColor: palette.surface,
      color: palette.text,
      minHeight: "112px",
      marginBottom: "10px",
      borderRadius: palette.radius.listCard,
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
  borderRadius: palette.radius.control,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: palette.chip,
  border: `1px solid ${palette.border}`,
  color: palette.muted,
  cursor: "pointer",
  transition: "all .18s ease",
  boxShadow: { xs: palette.shadowSoft, sm: "none" },
  "& svg": {
    width: { xs: 20, sm: 14 },
    height: { xs: 20, sm: 14 },
  },
  "&:hover": {
    backgroundColor: danger ? palette.danger : palette.accent,
    borderColor: danger ? palette.danger : palette.accent,
    color: palette.onAccent,
  },
});

const protectedActionButtonSx = {
  ...actionButtonSx(false),
  color: palette.success,
  borderColor: "rgba(146,214,173,0.38)",
  backgroundColor: "rgba(66,160,104,0.10)",
  "&:hover": {
    backgroundColor: "rgba(66,160,104,0.18)",
    borderColor: "rgba(146,214,173,0.52)",
    color: palette.success,
  },
};

export const operacionProtegidaSunat = (row) => {
  const operacion = row || {};
  return Boolean(operacion.r_vfirmado || operacion.numero_rdi);
};

const sunatEstadoDocumento = (row) => {
  if (row.r_vfirmado) {
    return {
      title: "Comprobante procesado por SUNAT",
      border: "rgba(146,214,173,0.46)",
      background: "rgba(66,160,104,0.12)",
      filter: "saturate(1.2)",
    };
  }

  return {
    title: "Enviar a SUNAT",
    border: palette.border,
    background: palette.chip,
    filter: "grayscale(0.25) opacity(0.88)",
  };
};

function SunatActionButton({ row, onEnviarSunat, sunatContext }) {
  const bloqueadoPorRdi = Boolean(row.numero_rdi);
  const estado = bloqueadoPorRdi
    ? {
        title: `Procesado por RDI ${row.numero_rdi}`,
        border: "rgba(232,198,109,0.48)",
        background: "rgba(232,198,109,0.12)",
        filter: "saturate(0.9) sepia(0.28)",
      }
    : sunatEstadoDocumento(row);

  const comprobante = row.comprobante || [row.r_cod_ref || row.r_cod, row.r_serie_ref || row.r_serie, row.r_numero_ref || row.r_numero].filter(Boolean).join("-");
  const comprobanteKey = row.comprobante_key || [row.r_cod, row.r_serie, row.r_numero, row.elemento || 1].filter(Boolean).join("-");
  const puedeUsarAdminSunatIcon = Boolean(
    sunatContext?.backHost &&
    sunatContext?.periodoTrabajo &&
    sunatContext?.idAnfitrion &&
    sunatContext?.contabilidadTrabajo
  );

  return (
    <Tooltip title={estado.title} arrow>
      <Box
        onClick={() => {
          if (!bloqueadoPorRdi && !puedeUsarAdminSunatIcon) {
            onEnviarSunat(row);
          }
        }}
        sx={{
          ...actionButtonSx(false),
          backgroundColor: estado.background,
          borderColor: estado.border,
          cursor: bloqueadoPorRdi ? "default" : "pointer",
          p: 0.45,
          "&:hover": {
            backgroundColor: bloqueadoPorRdi ? estado.background : palette.accentSoft,
            borderColor: bloqueadoPorRdi ? estado.border : palette.accent,
          },
          }}
      >
        {puedeUsarAdminSunatIcon ? (
          <Box sx={{ filter: estado.filter, lineHeight: 0 }}>
            <AdminSunatIcon
              comprobante_key={comprobanteKey}
              comprobante={comprobante}
              cdr_pendiente={row.cdr_pendiente}
              elemento={row.elemento || 1}
              firma={row.r_vfirmado}
              cdr_nivel={row.cdr_nivel}
              cdr_descripcion={row.cdr_descripcion}
              numeroRdi={row.numero_rdi}
              documentoId={sunatContext.documentoId || sunatContext.contabilidadTrabajo}
              periodoTrabajo={sunatContext.periodoTrabajo}
              idAnfitrion={sunatContext.idAnfitrion}
              contabilidadTrabajo={sunatContext.contabilidadTrabajo}
              backHost={sunatContext.backHost}
              cpeEndpoint="/mve_transventa/cpe"
              cpeRequestExtra={sunatContext.cpeRequestExtra}
              pdfEndpoint="/mve_transventa/ticket/encomienda"
              pdfRequestExtra={{
                endpoint_pdf: "/cpesunatticketencomienda/v2",
                rubro: "TRANS_ENCOMIENDA",
              }}
              onRefresh={sunatContext.onRefresh}
              size={sunatContext.size || 18}
            />
          </Box>
        ) : (
          <Box
            component="img"
            src={SunatIcon}
            alt="SUNAT"
            sx={{
              width: { xs: 24, sm: 18 },
              height: { xs: 24, sm: 18 },
              objectFit: "contain",
              display: "block",
              filter: estado.filter,
            }}
          />
        )}
      </Box>
    </Tooltip>
  );
}

function DeliveryStatusBadge({ entregada }) {
  const Icon = entregada ? CheckCircle2 : Clock3;
  const label = entregada ? "Entregada" : "Pendiente";

  return (
    <Box
      sx={{
        height: 30,
        px: 1.5,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.55,
        borderRadius: 1.5,
        backgroundColor: palette.chip,
        border: `1px solid ${palette.border}`,
        color: palette.text,
        fontSize: "12px",
        fontWeight: 360,
        fontVariationSettings: '"wght" 360',
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "all .18s ease",
        "&:hover": {
          backgroundColor: palette.accent,
          borderColor: palette.accent,
          color: palette.onAccent,
          transform: "translateY(-1px)",
        },
      }}
    >
      <Icon size={13} />
      {label}
    </Box>
  );
}

function PersonaOperacionLine({ icon, label, documento }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
      {icon}
      <Typography sx={{ fontSize: "13px", color: palette.muted }} noWrap>
        {label}
        {documento ? ` - ${documento}` : ""}
      </Typography>
    </Box>
  );
}

const nombreDestinoRuta = (item) => {
  const ruta = String(item.nombre_ruta || "").trim();
  if (!ruta) {
    return "-";
  }

  return ruta
    .split(/\s*(?:->|=>|—|–|-|\/)\s*/)[1]
    .trim() || "-";
};

function TrOperacionRow({
  row,
  onEdit,
  onDelete,
  onCancel,
  onEnviarSunat,
  sunatContext,
  canDelete = false,
}) {
  const protegidaSunat = row.tipo_operacion === "E" && operacionProtegidaSunat(row);
  const anulada = Number(row.registrado) === 0;

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
              borderRadius: palette.radius.control,
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

          {row.placa && <AppChip>{row.placa}</AppChip>}

          {row.tipo_operacion !== "E" && <AppChip>{row.tipoLabel}</AppChip>}

          {row.tipo_operacion === "E" && <DeliveryStatusBadge entregada={row.entregada} />}
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
          {row.tipo_operacion === "E" && !anulada && (
            <>
              <SunatActionButton row={row} onEnviarSunat={onEnviarSunat} sunatContext={sunatContext} />
            </>
          )}

          <Tooltip title={protegidaSunat || anulada ? "Ver operacion" : "Editar operacion"} arrow>
            <Box onClick={() => onEdit(row)} sx={protegidaSunat || anulada ? protectedActionButtonSx : actionButtonSx(false)}>
              {protegidaSunat || anulada ? <Eye size={14} /> : <Pencil size={14} />}
            </Box>
          </Tooltip>

          {!protegidaSunat && !anulada && (
            <Tooltip title="Anular operacion" arrow>
              <Box onClick={() => onCancel(row)} sx={actionButtonSx(true)}>
                <Ban size={14} />
              </Box>
            </Tooltip>
          )}

          {!protegidaSunat && !anulada && canDelete && (
            <Tooltip title="Eliminar operacion" arrow>
              <Box onClick={() => onDelete(row)} sx={actionButtonSx(true)}>
                <Trash2 size={14} />
              </Box>
            </Tooltip>
          )}

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.85,
              color: palette.accent,
              fontWeight: 600,
              fontSize: "12.5px",
              height: { xs: 42, sm: "auto" },
              flexWrap: "wrap",
            }}
          >
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.45, whiteSpace: "nowrap" }}>
              <Calendar size={13} />
              {row.fecha}
            </Box>
            {row.horaGrabacion && (
              <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.45, color: palette.muted, whiteSpace: "nowrap" }}>
                <Clock3 size={13} />
                {row.horaGrabacion}
              </Box>
            )}
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
        <Box sx={{ display: "grid", gap: 0.45, minWidth: 0, width: { xs: "100%", sm: "auto" } }}>
          <PersonaOperacionLine
            icon={<ReceiptText size={13} style={{ flexShrink: 0, color: palette.accent }} />}
            label={row.clienteLabel}
            documento={row.cliente_documento || row.cliente_documento_id}
          />
          {row.tipo_operacion === "E" && row.destinatario && (
            <PersonaOperacionLine
              icon={<UserRound size={13} style={{ flexShrink: 0, color: palette.muted }} />}
              label={row.destinatario}
              documento={row.destinatario_documento || row.destinatario_documento_id}
            />
          )}
        </Box>
        <Box sx={{ display: "grid", gap: 0.2, justifyItems: { xs: "flex-start", sm: "flex-end" }, ml: { xs: 2.5, sm: 1 } }}>
          <Typography sx={{ color: row.condicionPagoLabel ? palette.accent : palette.text, fontSize: "14px", fontWeight: 800, whiteSpace: "nowrap" }}>
            {formatMoney(row.total)}
          </Typography>
          {row.condicionPagoLabel && (
            <Typography sx={{ color: palette.accent, fontSize: "11.2px", fontWeight: 500, lineHeight: 1, opacity: 0.72, whiteSpace: "nowrap" }}>
              Por cobrar
            </Typography>
          )}
        </Box>
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
            {
            //row.nombre_ruta
            nombreDestinoRuta(row)
            }
          </Box>
          <AppChip>{row.servicioLabel}</AppChip>
          {row.tipo_operacion === "B" && row.asiento && <AppChip>Asiento {row.asiento}</AppChip>}
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
export const createColumns = ({
  onEdit,
  onDelete,
  onCancel,
  onEnviarSunat,
  sunatContext,
  canDelete,
}) => [
  {
    name: "",
    grow: 1,
    cell: (row) => (
      <TrOperacionRow
        row={row}
        onEdit={onEdit}
        onDelete={onDelete}
        onCancel={onCancel}
        onEnviarSunat={onEnviarSunat}
        sunatContext={sunatContext}
        canDelete={canDelete}
      />
    ),
  },
];
