export const themeOptions = [
  {
    id: "default",
    label: "Celeste",
    values: {
      bg: "#151a1f",
      surface: "#1d2329",
      surfaceAlt: "#252c33",
      chip: "#2a323a",
      border: "#3a4650",
      borderSoft: "#2d373f",
      text: "#f4f8fb",
      muted: "#9aa8b3",
      accent: "#8fd8ff",
      accentSoft: "rgba(143,216,255,0.14)",
      onAccent: "#101820",
      overlaySoft: "rgba(255,255,255,0.025)",
      shadowSoft: "0 8px 18px rgba(0,0,0,0.18)",
      danger: "#ff8a70",
      dangerSoft: "rgba(255,138,112,0.14)",
      warning: "#e8c66d",
      warningSoft: "rgba(232,198,109,0.14)",
      success: "#92d6ad",
      successSoft: "rgba(146,214,173,0.14)",
    },
  },
  {
    id: "aqua",
    label: "Azul acero",
    values: {
      accent: "#6ea8ff",
      accentSoft: "rgba(110,168,255,0.15)",
      onAccent: "#091527",
      success: "#8ee6c5",
      successSoft: "rgba(142,230,197,0.14)",
      warning: "#f1d978",
      warningSoft: "rgba(241,217,120,0.14)",
      danger: "#ff9a87",
      dangerSoft: "rgba(255,154,135,0.14)",
    },
  },
  {
    id: "violet",
    label: "Lila",
    values: {
      accent: "#c9b6ff",
      accentSoft: "rgba(201,182,255,0.15)",
      onAccent: "#181229",
      success: "#9ee6c1",
      successSoft: "rgba(158,230,193,0.14)",
      warning: "#f0d681",
      warningSoft: "rgba(240,214,129,0.14)",
      danger: "#ff91ad",
      dangerSoft: "rgba(255,145,173,0.14)",
    },
  },
  {
    id: "rose",
    label: "Fucsia",
    values: {
      accent: "#ff7ab6",
      accentSoft: "rgba(255,122,182,0.15)",
      onAccent: "#26091a",
      success: "#9ee8c0",
      successSoft: "rgba(158,232,192,0.14)",
      warning: "#ffd36e",
      warningSoft: "rgba(255,211,110,0.14)",
      danger: "#ff897d",
      dangerSoft: "rgba(255,137,125,0.14)",
    },
  },
  {
    id: "coral",
    label: "Mandarina",
    values: {
      accent: "#ffb347",
      accentSoft: "rgba(255,179,71,0.15)",
      onAccent: "#241404",
      success: "#9fe7ad",
      successSoft: "rgba(159,231,173,0.14)",
      warning: "#ffe071",
      warningSoft: "rgba(255,224,113,0.14)",
      danger: "#ff7f6e",
      dangerSoft: "rgba(255,127,110,0.14)",
    },
  },
];

const defaultThemeValues = themeOptions[0].values;
const CUSTOM_THEME_ID = "custom";

const hexToRgb = (hex) => {
  const normalized = String(hex || "").replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null;
  }

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
};

const accentSoftFromHex = (hex) => {
  const rgb = hexToRgb(hex);
  return rgb ? `rgba(${rgb.r},${rgb.g},${rgb.b},0.15)` : defaultThemeValues.accentSoft;
};

const onAccentFromHex = (hex) => {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return defaultThemeValues.onAccent;
  }

  const brightness = ((rgb.r * 299) + (rgb.g * 587) + (rgb.b * 114)) / 1000;
  return brightness > 150 ? "#101820" : "#f4f8fb";
};

export const getStoredCustomAccent = () => {
  if (typeof window === "undefined") {
    return defaultThemeValues.accent;
  }

  return sessionStorage.getItem("xpertcont_custom_accent") || defaultThemeValues.accent;
};

export const getThemeValues = (themeId = "default") => ({
  ...defaultThemeValues,
  ...(themeId === CUSTOM_THEME_ID
    ? {
      accent: getStoredCustomAccent(),
      accentSoft: accentSoftFromHex(getStoredCustomAccent()),
      onAccent: onAccentFromHex(getStoredCustomAccent()),
    }
    : themeOptions.find((theme) => theme.id === themeId)?.values || {}),
});

export const getStoredThemeId = () => {
  if (typeof window === "undefined") {
    return "default";
  }

  return sessionStorage.getItem("xpertcont_theme_id") || "default";
};

export const applyTheme = (themeId = "default") => {
  if (typeof document === "undefined") {
    return;
  }

  const values = getThemeValues(themeId);

  Object.entries({
    "--app-bg": values.bg,
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
    "--app-shadow-soft": values.shadowSoft,
    "--app-danger": values.danger,
    "--app-danger-soft": values.dangerSoft,
    "--app-warning": values.warning,
    "--app-warning-soft": values.warningSoft,
    "--app-success": values.success,
    "--app-success-soft": values.successSoft,
  }).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });

  if (typeof window !== "undefined") {
    sessionStorage.setItem("xpertcont_theme_id", themeId);
  }
};

export const applyCustomAccent = (accent) => {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("xpertcont_custom_accent", accent);
  }

  applyTheme(CUSTOM_THEME_ID);
};

export const applyStoredTheme = () => {
  applyTheme(getStoredThemeId());
};

const palette = {
  bg: "var(--app-bg, #151a1f)",
  surface: "var(--app-surface, #1d2329)",
  surfaceAlt: "var(--app-surface-alt, #252c33)",
  chip: "var(--app-chip, #2a323a)",
  border: "var(--app-border, #3a4650)",
  borderSoft: "var(--app-border-soft, #2d373f)",
  text: "var(--app-text, #f4f8fb)",
  muted: "var(--app-muted, #9aa8b3)",
  accent: "var(--app-accent, #8fd8ff)",
  accentSoft: "var(--app-accent-soft, rgba(143,216,255,0.14))",
  onAccent: "var(--app-on-accent, #101820)",
  overlaySoft: "var(--app-overlay-soft, rgba(255,255,255,0.025))",
  shadowSoft: "var(--app-shadow-soft, 0 8px 18px rgba(0,0,0,0.18))",
  danger: "var(--app-danger, #ff8a70)",
  dangerSoft: "var(--app-danger-soft, rgba(255,138,112,0.14))",
  warning: "var(--app-warning, #e8c66d)",
  warningSoft: "var(--app-warning-soft, rgba(232,198,109,0.14))",
  success: "var(--app-success, #92d6ad)",
  successSoft: "var(--app-success-soft, rgba(146,214,173,0.14))",
};

export default palette;
