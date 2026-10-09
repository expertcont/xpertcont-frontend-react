import React, { useState } from "react";
import { Box, Popover, Tooltip, Typography } from "@mui/material";
import {
  Armchair,
  Bus,
  Calendar,
  CheckCircle2,
  Clock3,
  Eye,
  Ban,
  MapPin,
  MapPinCheck,
  Package,
  Pencil,
  Ticket,
  Trash2,
  ArrowRight,
  UserPen,
  UserRound,
  User,
  X,
} from "lucide-react";

import AppChip from "../../../../ui/AppChip";
import AdminSunatIcon from "../../../AdminSunatIcon";
import palette from "../../../../../theme/palette";
import { formatFecha, formatHora, formatMoney } from "../utils/trUtils";
import SunatIcon from "../../../../../assets/images/sunat0.png";

export const customStyles = {
  table: { style: { backgroundColor: "transparent" } },
  headRow: { style: { display: "none" } },
  rows: {
    style: {
      backgroundColor: palette.surface,
      color: palette.text,
      minHeight: "92px",
      marginBottom: "8px",
      borderRadius: palette.radius.listCard,
      border: `1px solid ${palette.borderSoft}`,
      paddingLeft: "14px",
      paddingRight: "14px",
      transition: "border-color .18s ease, background-color .18s ease",
      "&:hover": {
        backgroundColor: "var(--app-row-hover, #f8fafc)",
        borderColor: palette.border,
      },
    },
    highlightOnHoverStyle: {
      backgroundColor: "var(--app-row-hover, #f8fafc)",
      borderColor: palette.border,
      color: palette.text,
      outline: "none",
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

export const customStylesEncomienda = {
  ...customStyles,
  rows: {
    ...customStyles.rows,
    style: {
      ...customStyles.rows.style,
      minHeight: "70px",
      marginBottom: "3px",
      paddingLeft: "8px",
      paddingRight: "8px",
    },
  },
  pagination: {
    ...customStyles.pagination,
    style: {
      ...customStyles.pagination.style,
      marginTop: "5px",
    },
  },
};

export const customStylesEncomiendaPanoramica = {
  ...customStylesEncomienda,
  rows: {
    ...customStylesEncomienda.rows,
    style: {
      ...customStylesEncomienda.rows.style,
      minHeight: "58px",
      marginBottom: "2px",
      paddingLeft: "6px",
      paddingRight: "6px",
    },
  },
  pagination: {
    ...customStylesEncomienda.pagination,
    style: {
      ...customStylesEncomienda.pagination.style,
      marginTop: "3px",
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
  borderColor: "rgba(121,171,143,0.30)",
  backgroundColor: "rgba(121,171,143,0.08)",
  "&:hover": {
    backgroundColor: "rgba(121,171,143,0.14)",
    borderColor: "rgba(121,171,143,0.42)",
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
      border: "rgba(121,171,143,0.36)",
      background: "rgba(121,171,143,0.10)",
      filter: "saturate(1.05)",
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
        border: "rgba(189,162,105,0.38)",
        background: "rgba(189,162,105,0.10)",
        filter: "saturate(0.9) sepia(0.18)",
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
        data-action-id="transporte.encomiendas.enviar_sunat"
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
          boxSizing: "border-box",
          p: 0,
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

function PlacaStatusChip({ placa, llegadaReal }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const llegadaRegistrada = Boolean(llegadaReal);
  const fechaHoraReal = [formatFecha(llegadaReal), formatHora(llegadaReal)].filter(Boolean).join(" ") || "No registrada";

  const handleClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  return (
    <>
      <Box
        role="button"
        tabIndex={0}
        aria-label={llegadaRegistrada ? "Ver hora de llegada del carro" : "Ver estado de llegada del carro"}
        onClick={handleClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setAnchorEl(event.currentTarget);
          }
        }}
        sx={{
          height: 30,
          px: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.45,
          borderRadius: palette.radius.control,
          backgroundColor: llegadaRegistrada ? palette.successSoft : palette.chip,
          border: `1px solid ${llegadaRegistrada ? palette.success : palette.border}`,
          color: llegadaRegistrada ? palette.success : palette.muted,
          boxShadow: llegadaRegistrada ? `0 0 0 1px ${palette.success}, 0 0 10px ${palette.successSoft}` : "none",
          fontSize: "12px",
          fontWeight: llegadaRegistrada ? 800 : 360,
          fontVariationSettings: llegadaRegistrada ? '"wght" 800' : '"wght" 360',
          cursor: "pointer",
          whiteSpace: "nowrap",
          transition: "all .18s ease",
          "&:hover": {
            backgroundColor: llegadaRegistrada ? palette.success : palette.accent,
            borderColor: llegadaRegistrada ? palette.success : palette.accent,
            color: palette.onAccent,
            transform: "translateY(-1px)",
          },
          "&:focus-visible": {
            outline: `2px solid ${palette.accent}`,
            outlineOffset: 2,
          },
        }}
      >
        {llegadaRegistrada ? <MapPinCheck size={13} /> : <Clock3 size={13} />}
        {placa}
      </Box>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{
          sx: {
            mt: 0.75,
            width: { xs: "min(290px, calc(100vw - 32px))" },
            border: `1px solid ${palette.border}`,
            borderRadius: palette.radius.modal,
            backgroundColor: palette.surface,
            color: palette.text,
            boxShadow: palette.shadowSoft,
          },
        }}
      >
        <Box sx={{ p: 1.35 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                borderRadius: "50%",
                backgroundColor: llegadaRegistrada ? palette.successSoft : palette.warningSoft,
                color: llegadaRegistrada ? palette.success : palette.warning,
                "@keyframes placa-llegada-pop": {
                  "0%": { transform: "scale(0.6) rotate(-10deg)", opacity: 0 },
                  "70%": { transform: "scale(1.12) rotate(3deg)", opacity: 1 },
                  "100%": { transform: "scale(1) rotate(0deg)", opacity: 1 },
                },
                animation: llegadaRegistrada ? "placa-llegada-pop 600ms ease-out both" : "none",
              }}
            >
              {llegadaRegistrada ? <CheckCircle2 size={23} strokeWidth={2.3} /> : <Clock3 size={22} strokeWidth={2.2} />}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ color: palette.text, fontSize: "13.5px", fontWeight: 900 }}>
                {llegadaRegistrada ? "Llegada registrada" : "Pendiente de llegada"}
              </Typography>
              <Typography sx={{ color: palette.muted, fontSize: "11px", mt: 0.15 }}>
                {llegadaRegistrada ? "El carro ya registró su llegada." : "Aún no se ha marcado la hora de llegada."}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 1.2, pt: 1.05, borderTop: `1px solid ${palette.borderSoft}` }}>
            <Typography sx={{ color: palette.muted, fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Hora de llegada
            </Typography>
            <Typography sx={{ color: llegadaRegistrada ? palette.success : palette.warning, fontSize: "13px", fontWeight: 900, mt: 0.18 }}>
              {fechaHoraReal}
            </Typography>
          </Box>
        </Box>
      </Popover>
    </>
  );
}

function DeliveryStatusBadge({ entregada, fechaEntrega, usuarioEntrega }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const Icon = entregada ? CheckCircle2 : Clock3;
  const label = entregada ? "Entregada" : "Pendiente";
  const fechaEntregaTexto = [formatFecha(fechaEntrega), formatHora(fechaEntrega)].filter(Boolean).join(" ") || "-";

  const handleClick = (event) => {
    event.stopPropagation();
    if (!entregada) return;
    setAnchorEl(event.currentTarget);
  };

  return (
    <>
      <Box
        role={entregada ? "button" : undefined}
        tabIndex={entregada ? 0 : undefined}
        aria-label={entregada ? "Ver detalle de entrega" : "Encomienda pendiente"}
        onClick={handleClick}
        onKeyDown={(event) => {
          if (entregada && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            setAnchorEl(event.currentTarget);
          }
        }}
        sx={{
          height: 30,
          px: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.55,
          borderRadius: 1.5,
          backgroundColor: entregada ? palette.successSoft : palette.chip,
          border: `1px solid ${entregada ? palette.success : palette.border}`,
          color: entregada ? palette.success : palette.text,
          boxShadow: entregada ? `0 0 0 1px ${palette.success}, 0 0 12px ${palette.successSoft}` : "none",
          fontSize: "12px",
          fontWeight: entregada ? 800 : 360,
          fontVariationSettings: entregada ? '"wght" 800' : '"wght" 360',
          cursor: entregada ? "pointer" : "default",
          whiteSpace: "nowrap",
          transition: "all .18s ease",
          "&:hover": entregada ? {
            backgroundColor: palette.success,
            borderColor: palette.success,
            color: palette.onAccent,
            transform: "translateY(-1px)",
          } : undefined,
          "&:focus-visible": entregada ? {
            outline: `2px solid ${palette.accent}`,
            outlineOffset: 2,
          } : undefined,
        }}
      >
        <Icon size={13} />
        {label}
      </Box>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{
          sx: {
            mt: 0.75,
            width: { xs: "min(300px, calc(100vw - 32px))" },
            border: `1px solid ${palette.border}`,
            borderRadius: palette.radius.modal,
            backgroundColor: palette.surface,
            color: palette.text,
            boxShadow: palette.shadowSoft,
          },
        }}
      >
        <Box sx={{ p: 1.4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                borderRadius: "50%",
                backgroundColor: palette.successSoft,
                color: palette.success,
                "@keyframes delivery-success-pop": {
                  "0%": { transform: "scale(0.55) rotate(-12deg)", opacity: 0 },
                  "65%": { transform: "scale(1.12) rotate(3deg)", opacity: 1 },
                  "100%": { transform: "scale(1) rotate(0deg)", opacity: 1 },
                },
                animation: "delivery-success-pop 650ms ease-out both",
              }}
            >
              <CheckCircle2 size={25} strokeWidth={2.3} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ color: palette.text, fontSize: "14px", fontWeight: 900 }}>
                Encomienda entregada
              </Typography>
              <Typography sx={{ color: palette.muted, fontSize: "11px", mt: 0.15 }}>
                La entrega fue registrada correctamente.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 1.25, pt: 1.1, borderTop: `1px solid ${palette.borderSoft}`, display: "grid", gap: 0.85 }}>
            <Box>
              <Typography sx={{ color: palette.muted, fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Fecha de entrega
              </Typography>
              <Typography sx={{ color: palette.text, fontSize: "12.5px", fontWeight: 800, mt: 0.15 }}>
                {fechaEntregaTexto}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ color: palette.muted, fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Correo / usuario que entregó
              </Typography>
              <Typography sx={{ color: palette.text, fontSize: "12.5px", fontWeight: 800, mt: 0.15, wordBreak: "break-word" }}>
                {usuarioEntrega || "-"}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Popover>
    </>
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

function TicketFlatIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M5.25 5.2h13.5c0.9 0 1.65 0.75 1.65 1.65v2.35a2.35 2.35 0 0 0 0 4.6v2.35c0 0.9-0.75 1.65-1.65 1.65H5.25c-0.9 0-1.65-0.75-1.65-1.65V13.8a2.35 2.35 0 0 0 0-4.6V6.85c0-0.9 0.75-1.65 1.65-1.65Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.35"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M13.1 5.55v12.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.15"
        strokeLinecap="butt"
        strokeDasharray="3 2.25"
      />
    </svg>
  );
}

function TrOperacionRow({
  row,
  onEdit,
  onDelete,
  onCancel,
  onEnviarSunat,
  onImprimirTicket,
  sunatContext,
  canDelete = false,
  canEdit = true,
  canCancel = true,
  canSendSunat = true,
  compact = false,
  mostrarAnuladas = false,
  menuItemId = "transporte.encomiendas",
}) {
  const protegidaSunat = row.tipo_operacion === "E" && operacionProtegidaSunat(row);
  const esEncomienda = row.tipo_operacion === "E";
  const esBoleto = row.tipo_operacion === "B";
  const cancelActionTitle = row.tipo_operacion === "B" ? "Liberar asiento" : "Anular operacion";
  const anulada = Number(row.registrado) === 0;
  const mostrarSelloAnulado = mostrarAnuladas && anulada;
  const esFactura = String(row.r_cod || row.r_cod_ref || "").padStart(2, "0") === "01";
  const mostrarSunatFactura = esEncomienda && !anulada && esFactura;
  const puedeImprimirTicket = esEncomienda && !anulada && Boolean(row.r_cod && row.r_serie && row.r_numero);
  const [ticketAnchorEl, setTicketAnchorEl] = useState(null);
  const fechaHoraOperacion = [row.fecha, row.horaGrabacion].filter(Boolean).join(" ");
  const esPorCobrar = row.condicionPagoLabel === "POR_COBRAR";
  const montoColor = esPorCobrar ? palette.porCobrar : row.condicionPagoLabel ? palette.accent : palette.text;
  const TotalOperacion = (
    <Box sx={{ display: "grid", gap: 0.2, justifyItems: { xs: "flex-start", sm: "flex-end" } }}>
      <Typography sx={{ color: montoColor, fontSize: "16px", lineHeight: 1.05, fontWeight: "1000 !important", WebkitTextStroke: "0.32px currentColor", whiteSpace: "nowrap" }}>
        {formatMoney(row.total)}
      </Typography>
      {row.condicionPagoLabel && (
        <Typography sx={{ color: esPorCobrar ? palette.porCobrar : palette.accent, fontSize: "11.2px", fontWeight: 650, lineHeight: 1, opacity: 0.82, whiteSpace: "nowrap" }}>
          Por cobrar
        </Typography>
      )}
    </Box>
  );

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        width: "100%",
        py: esEncomienda ? (compact ? 0.2 : 0.45) : 1.2,
      }}
    >
      {mostrarSelloAnulado && (
        <Box
          aria-hidden="true"
          sx={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%) rotate(-12deg)",
            zIndex: 0,
            pointerEvents: "none",
            px: compact ? 1.6 : 2.1,
            py: compact ? 0.25 : 0.35,
            border: `2px solid ${palette.warning}`,
            borderRadius: "7px",
            color: palette.warning,
            opacity: 0.28,
            fontSize: compact ? "20px" : "26px",
            fontWeight: 1000,
            lineHeight: 1,
            letterSpacing: "0",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          ANULADO
        </Box>
      )}
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: { xs: "wrap", sm: "nowrap" },
          gap: esEncomienda ? (compact ? 0.3 : 0.45) : 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, flexWrap: "wrap" }}>
          {!esEncomienda && (
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
              <Bus size={16} />
            </Box>
          )}

          {esEncomienda && (
            <>
              <Tooltip title={puedeImprimirTicket ? "Imprimir ticket rapido" : "Ticket disponible al grabar comprobante"} arrow>
                <Box
                  onClick={(event) => {
                    event.stopPropagation();
                    if (puedeImprimirTicket) {
                      setTicketAnchorEl(event.currentTarget);
                    }
                  }}
                  sx={{
                    position: "relative",
                    width: { xs: 34, sm: 28 },
                    height: { xs: 42, sm: 32 },
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "none",
                    borderRadius: 0,
                    backgroundColor: "transparent",
                    color: puedeImprimirTicket ? palette.accent : palette.muted,
                    opacity: puedeImprimirTicket ? 1 : 0.48,
                    cursor: puedeImprimirTicket ? "pointer" : "default",
                    transition: "color .18s ease, opacity .18s ease, transform .18s ease",
                    "& svg": {
                      width: { xs: 25, sm: 20 },
                      height: { xs: 25, sm: 20 },
                      transform: "rotate(-42deg)",
                      filter: puedeImprimirTicket ? "drop-shadow(0 2px 5px rgba(47,111,237,0.16))" : "none",
                    },
                    "&:hover": puedeImprimirTicket ? {
                      color: palette.accent,
                      transform: "translateY(-1px)",
                    } : undefined,
                  }}
                >
                  <TicketFlatIcon />
                </Box>
              </Tooltip>
              <Popover
                open={Boolean(ticketAnchorEl)}
                anchorEl={ticketAnchorEl}
                onClose={() => setTicketAnchorEl(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
                PaperProps={{
                  sx: {
                    mt: 0.75,
                    width: { xs: "min(300px, calc(100vw - 32px))", sm: 286 },
                    border: `1px solid ${palette.border}`,
                    borderRadius: palette.radius.modal,
                    backgroundColor: palette.surface,
                    color: palette.text,
                    boxShadow: palette.shadowSoft,
                  },
                }}
              >
                <Box sx={{ p: 1.35 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ color: palette.text, fontSize: "14px", fontWeight: 900, lineHeight: 1.15 }}>
                          Imprimir ticket
                        </Typography>
                        <Typography sx={{ color: palette.muted, fontSize: "11px", mt: 0.25 }} noWrap>
                          {row.numero || [row.r_serie, row.r_numero].filter(Boolean).join("-")}
                        </Typography>
                      </Box>
                    </Box>
                    <Box
                      role="button"
                      tabIndex={0}
                      onClick={() => setTicketAnchorEl(null)}
                      sx={{ ...actionButtonSx(false), width: 28, height: 28, flexShrink: 0 }}
                    >
                      <X size={13} />
                    </Box>
                  </Box>

                  <Box sx={{ mt: 1.25, pt: 1.05, borderTop: `1px solid ${palette.borderSoft}`, display: "grid", gap: 0.65 }}>
                    {[
                      ["completo", "Ticket completo", "Cliente + paquete en un solo corte"],
                      ["admin", "Ticket Paquete", "Copia interna para adherir al paquete"],
                      ["cliente", "Ticket cliente", "Comprobante para entregar o reenviar"],
                    ].map(([modo, label, descripcion]) => (
                      <Box
                        key={modo}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setTicketAnchorEl(null);
                          onImprimirTicket?.(row, modo);
                        }}
                        sx={{
                          minHeight: 44,
                          px: 1,
                          py: 0.65,
                          display: "flex",
                          alignItems: "center",
                          gap: 0.85,
                          borderRadius: palette.radius.control,
                          border: `1px solid ${palette.borderSoft}`,
                          backgroundColor: palette.overlaySoft,
                          color: palette.text,
                          cursor: "pointer",
                          transition: "all .18s ease",
                          "&:hover": {
                            backgroundColor: palette.accentSoft,
                            borderColor: palette.accent,
                            color: palette.accent,
                            transform: "translateY(-1px)",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            backgroundColor: palette.surface,
                            border: `1px solid ${palette.borderSoft}`,
                            color: "inherit",
                          }}
                        >
                          <Ticket size={14} />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ color: "inherit", fontSize: "12.6px", fontWeight: 900, lineHeight: 1.15 }}>
                            {label}
                          </Typography>
                          <Typography sx={{ color: palette.muted, fontSize: "10.8px", mt: 0.25, lineHeight: 1.2 }}>
                            {descripcion}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Popover>
            </>
          )}

          <Typography sx={{ color: palette.text, fontWeight: "1000 !important", WebkitTextStroke: "0.25px currentColor", fontSize: "16px" }}>
            {row.numero}
          </Typography>

          {mostrarSunatFactura && canSendSunat && (
            <SunatActionButton row={row} onEnviarSunat={onEnviarSunat} sunatContext={sunatContext} />
          )}

          {row.placa && <PlacaStatusChip placa={row.placa} llegadaReal={row.llegada_real} />}

          {row.tipo_operacion !== "E" && <AppChip>{row.tipoLabel}</AppChip>}

          {esEncomienda && canEdit && (
            <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.85, minWidth: 0, flex: "1 1 360px" }}>
              <Box sx={{ minWidth: 0, flex: "1 1 180px" }}>
                <PersonaOperacionLine
                  icon={<User size={13} style={{ flexShrink: 0, color: palette.accent }} />}
                  label={row.clienteLabel}
                  documento={row.cliente_documento || row.cliente_documento_id}
                />
              </Box>
              {row.destinatario && (
                <>
                  <ArrowRight
                    size={15}
                    strokeWidth={2.2}
                    style={{ color: palette.accent, flexShrink: 0 }}
                  />
                  <Box sx={{ minWidth: 0, flex: "1 1 180px" }}>
                    <PersonaOperacionLine
                      icon={<UserRound size={13} style={{ flexShrink: 0, color: palette.muted }} />}
                      label={row.destinatario}
                      documento={row.destinatario_documento || row.destinatario_documento_id}
                    />
                  </Box>
                </>
              )}
            </Box>
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
          {esEncomienda && <DeliveryStatusBadge entregada={row.entregada} fechaEntrega={row.entrega_fecha} usuarioEntrega={row.entrega_ctrl_us} />}
          {esEncomienda && (
            <Tooltip title={protegidaSunat || anulada ? "Ver operacion" : "Editar operacion"} arrow>
              <Box data-action-id={`${menuItemId}.editar`} onClick={() => onEdit(row)} sx={protegidaSunat || anulada ? protectedActionButtonSx : actionButtonSx(false)}>
                {protegidaSunat || anulada ? <Eye size={14} /> : <Pencil size={14} />}
              </Box>
            </Tooltip>
          )}

          {esEncomienda && TotalOperacion}

          {!esEncomienda && canEdit && (
            <Tooltip title={protegidaSunat || anulada ? "Ver operacion" : "Editar operacion"} arrow>
              <Box data-action-id={`${menuItemId}.editar`} onClick={() => onEdit(row)} sx={protegidaSunat || anulada ? protectedActionButtonSx : actionButtonSx(false)}>
                {protegidaSunat || anulada ? <Eye size={14} /> : <Pencil size={14} />}
              </Box>
            </Tooltip>
          )}

          {!protegidaSunat && !anulada && canCancel && (
            <Tooltip title={cancelActionTitle} arrow>
              <Box
                data-action-id={`${menuItemId}.anular_local`}
                onClick={() => onCancel(row)}
                sx={actionButtonSx(!esBoleto)}
              >
                {esBoleto ? <Armchair size={14} /> : <Ban size={14} />}
              </Box>
            </Tooltip>
          )}

          {!protegidaSunat && !anulada && canDelete && (
            <Tooltip title="Eliminar operacion" arrow>
              <Box data-action-id={`${menuItemId}.eliminar`} onClick={() => onDelete(row)} sx={actionButtonSx(true)}>
                <Trash2 size={14} />
              </Box>
            </Tooltip>
          )}

          {!esEncomienda && (
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
          )}
        </Box>
      </Box>

      {!esEncomienda && (
      <Box
        sx={{
          mt: esEncomienda ? 0.35 : 0.65,
          display: esEncomienda ? "grid" : "flex",
          gridTemplateColumns: esEncomienda ? { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 1fr)" } : undefined,
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: esEncomienda ? 0.45 : 0.75,
          color: palette.muted,
        }}
      >
        {esEncomienda ? (
          <>
            <PersonaOperacionLine
              icon={<User size={13} style={{ flexShrink: 0, color: palette.accent }} />}
              label={row.clienteLabel}
              documento={row.cliente_documento || row.cliente_documento_id}
            />
            {row.destinatario ? (
              <Box sx={{ minWidth: 0, justifySelf: { xs: "start", md: "end" }, maxWidth: "100%" }}>
                <PersonaOperacionLine
                  icon={<UserRound size={13} style={{ flexShrink: 0, color: palette.muted }} />}
                  label={row.destinatario}
                  documento={row.destinatario_documento || row.destinatario_documento_id}
                />
              </Box>
            ) : (
              <Box />
            )}
          </>
        ) : (
          <Box sx={{ display: "grid", gap: 0.45, minWidth: 0, width: { xs: "100%", sm: "auto" } }}>
            <PersonaOperacionLine
              icon={<User size={13} style={{ flexShrink: 0, color: palette.accent }} />}
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
        )}
        {!esEncomienda && (
          <Box sx={{ ml: { xs: 2.5, sm: 1 } }}>
            {TotalOperacion}
          </Box>
        )}
      </Box>
      )}

      <Box
        sx={{
          mt: esEncomienda ? 0.35 : 1,
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: esEncomienda ? 0.35 : 0.75,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.75, minWidth: 0, flex: "1 1 260px" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: palette.text, fontSize: "11px", fontWeight: "1000 !important", fontVariationSettings: '"wght" 1000', WebkitTextStroke: "0.12px currentColor", textTransform: "uppercase", letterSpacing: "0.5px", mr: 0.5 }}>
            <MapPin size={13} />
            {
            //row.nombre_ruta
            nombreDestinoRuta(row)
            }
          </Box>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.45, minWidth: 0, color: palette.muted, fontSize: "12px" }}>
            {esEncomienda && <Package size={13} style={{ color: palette.accent, flexShrink: 0 }} />}
            <Typography component="span" sx={{ color: "inherit", fontSize: "inherit", minWidth: 0 }} noWrap>
              {row.servicioLabel}
            </Typography>
          </Box>
          {row.tipo_operacion === "B" && row.asiento && <AppChip>Asiento {row.asiento}</AppChip>}
        </Box>

        <Box
          sx={{
            ml: { xs: 0, sm: "auto" },
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            flexWrap: "wrap",
            gap: 0.65,
            minWidth: 0,
            width: { xs: "100%", sm: "auto" },
            maxWidth: { xs: "100%", sm: "46%" },
            color: palette.muted,
          }}
        >
          {esEncomienda && fechaHoraOperacion && (
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.45, color: palette.muted, fontSize: "12px", fontWeight: 650, whiteSpace: "nowrap" }}>
              <Calendar size={13} />
              {fechaHoraOperacion}
            </Box>
          )}
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
  onImprimirTicket,
  sunatContext,
  canDelete,
  canEdit,
  canCancel,
  canSendSunat,
  compact = false,
  mostrarAnuladas = false,
  menuItemId = "transporte.encomiendas",
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
        onImprimirTicket={onImprimirTicket}
        sunatContext={sunatContext}
        canDelete={canDelete}
        canEdit={canEdit}
        canCancel={canCancel}
        canSendSunat={canSendSunat}
        compact={compact}
        mostrarAnuladas={mostrarAnuladas}
        menuItemId={menuItemId}
      />
    ),
  },
];
