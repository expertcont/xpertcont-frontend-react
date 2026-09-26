export const themeOptions = [
  {
    // Primer tema de la lista = tema por defecto de la app.
    id: "carbon",
    label: "Carbón",
    values: {
      bg: "#17171a",
      navBg: "#1d1d21",
      surface: "#242428",
      surfaceAlt: "#2b2b30",
      chip: "#333338",
      border: "#3e3e45",
      borderSoft: "#35353b",
      text: "#d7d7dc",
      muted: "#8f8f99",
      accent: "#a5a5b0",
      accentSoft: "rgba(165,165,176,0.14)",
      onAccent: "#151518",
      overlaySoft: "rgba(255,255,255,0.02)",
      rowHover: "#292930",
      shadowSoft: "0 4px 12px rgba(0,0,0,0.14)",
      danger: "#c2857a",
      dangerSoft: "rgba(194,133,122,0.12)",
      warning: "#bda87f",
      warningSoft: "rgba(189,168,127,0.12)",
      success: "#8aa78e",
      successSoft: "rgba(138,167,142,0.12)",
      porCobrar: "#d67f75",
      porCobrarSoft: "rgba(214,127,117,0.14)",
      radiusContent: "8px",
      radiusControl: "8px",
      radiusListCard: "12px",
      radiusModal: "12px",
    },
  },
  {
    id: "light-smoke",
    label: "Blanco humo",
    values: {
      bg: "#f5f5f5",
      navBg: "#ffffff",
      surface: "#ffffff",
      surfaceAlt: "#f0f2f4",
      chip: "#eef0f2",
      border: "#d6d9dd",
      borderSoft: "#e6e8eb",
      text: "#1f252b",
      muted: "#69727c",
      accent: "#4b5563",
      accentSoft: "rgba(75,85,99,0.10)",
      onAccent: "#ffffff",
      overlaySoft: "rgba(31,37,43,0.035)",
      rowHover: "#f8fafc",
      shadowSoft: "0 8px 18px rgba(31,37,43,0.10)",
      danger: "#b94732",
      dangerSoft: "rgba(185,71,50,0.10)",
      warning: "#9a6a10",
      warningSoft: "rgba(154,106,16,0.12)",
      success: "#28734d",
      successSoft: "rgba(40,115,77,0.11)",
      porCobrar: "#b3261e",
      porCobrarSoft: "rgba(179,38,30,0.10)",
      radiusContent: "8px",
      radiusControl: "8px",
      radiusListCard: "12px",
      radiusModal: "12px",
    },
  },
];

// Primer tema de la lista = tema por defecto de la app (Carbón).
const DEFAULT_THEME_ID = "carbon";
const defaultThemeValues = themeOptions[0].values;

// Sin tema de color libre: el acento es parte del tema, no un ajuste aparte. Con el
// color suelto se movia solo 'accent' y quedaban combinaciones que rompian el
// contraste (por ejemplo onAccent claro sobre un fondo oscuro elegido a mano).
export const getThemeValues = (themeId = DEFAULT_THEME_ID) => ({
  ...defaultThemeValues,
  ...themeOptions.find((theme) => theme.id === themeId)?.values || {},
});

export const getStoredThemeId = () => {
  if (typeof window === "undefined") {
    return DEFAULT_THEME_ID;
  }

  return sessionStorage.getItem("xpertcont_theme_id") || DEFAULT_THEME_ID;
};

export const applyTheme = (themeId = DEFAULT_THEME_ID) => {
  if (typeof document === "undefined") {
    return;
  }

  // Si el id guardado ya no corresponde a ningun tema (sesiones viejas con el
  // color libre, o con el tema que se elimino), se aplica el de por defecto.
  const esValido = themeOptions.some((opcion) => opcion.id === themeId);
  const temaAplicado = esValido ? themeId : DEFAULT_THEME_ID;
  const values = getThemeValues(temaAplicado);

  Object.entries({
    "--app-bg": values.bg,
    "--app-nav-bg": values.navBg,
    "--app-surface": values.surface,
    "--app-surface-alt": values.surfaceAlt,
    "--app-chip": values.chip,
    "--app-border": values.border,
    "--app-border-soft": values.borderSoft,
    "--app-text": values.text,
    "--app-muted": values.muted,
    "--app-accent": values.accent,
    "--app-accent-soft": values.accentSoft,
    "--app-on-accent": values.onAccent,
    "--app-overlay-soft": values.overlaySoft,
    "--app-row-hover": values.rowHover || values.surfaceAlt,
    "--app-shadow-soft": values.shadowSoft,
    "--app-danger": values.danger,
    "--app-danger-soft": values.dangerSoft,
    "--app-warning": values.warning,
    "--app-warning-soft": values.warningSoft,
    "--app-success": values.success,
    "--app-success-soft": values.successSoft,
    "--app-por-cobrar": values.porCobrar || values.danger,
    "--app-por-cobrar-soft": values.porCobrarSoft || values.dangerSoft,
    "--app-radius-content": values.radiusContent,
    "--app-radius-control": values.radiusControl,
    "--app-radius-list-card": values.radiusListCard,
    "--app-radius-modal": values.radiusModal,
  }).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });

  if (typeof window !== "undefined") {
    sessionStorage.setItem("xpertcont_theme_id", temaAplicado);
  }
};

export const applyStoredTheme = () => {
  if (typeof window !== "undefined") {
    // Limpia el acento guardado del color libre: ya no se usa.
    sessionStorage.removeItem("xpertcont_custom_accent");
  }

  applyTheme(getStoredThemeId());
};

const palette = {
  bg: "var(--app-bg, #17171a)",
  navBg: "var(--app-nav-bg, #1d1d21)",
  surface: "var(--app-surface, #242428)",
  surfaceAlt: "var(--app-surface-alt, #2b2b30)",
  // Tinte neutro para el hover de fila, definido por tema (sin cast de color).
  rowHover: "var(--app-row-hover, #292930)",
  chip: "var(--app-chip, #333338)",
  border: "var(--app-border, #3e3e45)",
  borderSoft: "var(--app-border-soft, #35353b)",
  text: "var(--app-text, #d7d7dc)",
  muted: "var(--app-muted, #8f8f99)",
  accent: "var(--app-accent, #a5a5b0)",
  accentSoft: "var(--app-accent-soft, rgba(165,165,176,0.14))",
  onAccent: "var(--app-on-accent, #151518)",
  overlaySoft: "var(--app-overlay-soft, rgba(255,255,255,0.02))",
  shadowSoft: "var(--app-shadow-soft, 0 4px 12px rgba(0,0,0,0.14))",
  danger: "var(--app-danger, #c2857a)",
  dangerSoft: "var(--app-danger-soft, rgba(194,133,122,0.12))",
  warning: "var(--app-warning, #bda87f)",
  warningSoft: "var(--app-warning-soft, rgba(189,168,127,0.12))",
  success: "var(--app-success, #8aa78e)",
  successSoft: "var(--app-success-soft, rgba(138,167,142,0.12))",
  porCobrar: "var(--app-por-cobrar, #d67f75)",
  porCobrarSoft: "var(--app-por-cobrar-soft, rgba(214,127,117,0.14))",
  radius: {
    content: "var(--app-radius-content, 8px)",
    control: "var(--app-radius-control, 8px)",
    listCard: "var(--app-radius-list-card, 12px)",
    modal: "var(--app-radius-modal, 12px)",
  },
};

export default palette;
