import { createTheme } from "react-data-table-component";

import palette from "../../../../theme/palette";

// React Data Table fusiona este objeto sobre su tema "dark", NO lo reemplaza, asi
// que hay que declarar tambien button/selected/striped/highlightOnHover. El tema
// dark de RDT trae hardcodeado highlightOnHover rgba(0,0,0,0.7), selected
// rgba(0,0,0,0.7), striped rgba(0,0,0,0.87) y button #FFFFFF: con solo
// text/background/divider el hover de fila se veia negro hardcodeado y los
// botones de paginacion quedaban whites.
//
// Los valores salen de los tokens de la app, asi que el listado sigue al tema
// activo (Pizarra, Carbon o Blanco humo) sin volver a escribir colores.
// Mismo criterio que trDataTableTheme.js del modulo de transporte.
const ventaTableTheme = {
  text: { primary: palette.text, secondary: palette.muted, disabled: palette.border },
  background: { default: "transparent" },
  context: { background: palette.accent, text: palette.onAccent },
  divider: { default: palette.borderSoft },
  button: { default: palette.muted, focus: palette.accentSoft, hover: palette.accentSoft, disabled: palette.border },
  selected: { default: palette.accentSoft, text: palette.text },
  highlightOnHover: { default: palette.rowHover, text: palette.text },
  striped: { default: "transparent", text: palette.text },
};

export const ensureAdminVentaTableTheme = () => {
  // Se mantiene el nombre "solarized" porque es el que piden los <Datatable
  // theme="solarized"> de este modulo.
  createTheme("solarized", ventaTableTheme, "dark");
};
