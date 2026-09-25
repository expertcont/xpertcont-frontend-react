export const themeOptions = [
  {
    id: "default",
    label: "Pizarra",
    values: {
      bg: "#15191c",
      navBg: "#1b2024",
      surface: "#22282d",
      surfaceAlt: "#293036",
      chip: "#313940",
      border: "#3d4750",
      borderSoft: "#2f383f",
      text: "#d7dde2",
      muted: "#8a949c",
      accent: "#9db2c7",
      accentSoft: "rgba(157,178,199,0.14)",
      onAccent: "#0f1418",
      overlaySoft: "rgba(255,255,255,0.02)",
      rowHover: "#252c32",
      shadowSoft: "0 4px 12px rgba(0,0,0,0.14)",
      danger: "#c07a6d",
      dangerSoft: "rgba(192,122,109,0.12)",
      warning: "#bda269",
      warningSoft: "rgba(189,162,105,0.12)",
      success: "#79ab8f",
      successSoft: "rgba(121,171,143,0.12)",
      radiusContent: "8px",
      radiusControl: "8px",
      radiusListCard: "12px",
      radiusModal: "12px",
    },
  },
  {
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
      radiusContent: "8px",
      radiusControl: "8px",
      radiusListCard: "12px",
      radiusModal: "12px",
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
    "--app-radius-content": values.radiusContent,
    "--app-radius-control": values.radiusControl,
    "--app-radius-list-card": values.radiusListCard,
    "--app-radius-modal": values.radiusModal,
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
  bg: "var(--app-bg, #15191c)",
  navBg: "var(--app-nav-bg, #1b2024)",
  surface: "var(--app-surface, #22282d)",
  surfaceAlt: "var(--app-surface-alt, #293036)",
  chip: "var(--app-chip, #313940)",
  border: "var(--app-border, #3d4750)",
  borderSoft: "var(--app-border-soft, #2f383f)",
  text: "var(--app-text, #d7dde2)",
  muted: "var(--app-muted, #8a949c)",
  accent: "var(--app-accent, #9db2c7)",
  accentSoft: "var(--app-accent-soft, rgba(157,178,199,0.14))",
  onAccent: "var(--app-on-accent, #0f1418)",
  overlaySoft: "var(--app-overlay-soft, rgba(255,255,255,0.02))",
  shadowSoft: "var(--app-shadow-soft, 0 4px 12px rgba(0,0,0,0.14))",
  danger: "var(--app-danger, #c07a6d)",
  dangerSoft: "var(--app-danger-soft, rgba(192,122,109,0.12))",
  warning: "var(--app-warning, #bda269)",
  warningSoft: "var(--app-warning-soft, rgba(189,162,105,0.12))",
  success: "var(--app-success, #79ab8f)",
  successSoft: "var(--app-success-soft, rgba(121,171,143,0.12))",
  radius: {
    content: "var(--app-radius-content, 8px)",
    control: "var(--app-radius-control, 8px)",
    listCard: "var(--app-radius-list-card, 12px)",
    modal: "var(--app-radius-modal, 12px)",
  },
};

export default palette;
