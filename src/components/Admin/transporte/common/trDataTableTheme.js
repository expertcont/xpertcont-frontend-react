import { createTheme } from "react-data-table-component";

import palette from "../../../../theme/palette";

// React Data Table fusiona este objeto sobre su tema "dark", NO lo reemplaza.
// El tema dark de RDT trae hardcodeado:
//   highlightOnHover: { default: "rgba(0, 0, 0, 0.7)", text: "#FFFFFF" }
//   selected:         { default: "rgba(0, 0, 0, 0.7)" }
//   striped:          { default: "rgba(0, 0, 0, 0.87)" }
//   button:           { default: "#FFFFFF", hover: "rgba(255,255,255,0.12)" }
//
// Como antes solo se definian text/background/divider (y una clave "action" que RDT
// no lee, la correcta es "button"), al hacer hover sobre una fila se pintaba 70% de
// negro encima de la superficie oscura y se veia oscuro/"hardcodeado". Estos son los
// mismos nombres de tema que ya usaban los listados del modulo, entonces este import
// basta: registrarlo aqui los deja correctos a todos.
const tableTheme = {
  text: { primary: palette.text, secondary: palette.muted, disabled: palette.border },
  background: { default: "transparent" },
  context: { background: palette.accent, text: palette.onAccent },
  divider: { default: palette.borderSoft },
  button: { default: palette.muted, focus: palette.accentSoft, hover: palette.accentSoft, disabled: palette.border },
  selected: { default: palette.accentSoft, text: palette.text },
  highlightOnHover: { default: palette.rowHover, text: palette.text },
  striped: { default: "transparent", text: palette.text },
};

export const TR_TABLE_THEME = "transportesDark";
export const TR_ENTREGA_TABLE_THEME = "transportesEntregaDark";

createTheme(TR_TABLE_THEME, tableTheme, "dark");
createTheme(TR_ENTREGA_TABLE_THEME, tableTheme, "dark");
