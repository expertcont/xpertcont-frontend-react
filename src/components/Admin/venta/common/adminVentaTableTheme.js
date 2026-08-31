import { createTheme } from "react-data-table-component";

export const ensureAdminVentaTableTheme = () => {
  createTheme("solarized", {
    text: {
      // primary: "#268bd2",
      primary: "#ffffff",
      secondary: "#2aa198",
    },
    background: {
      // default: "#002b36",
      default: "#1e272e",
    },
    context: {
      background: "#cb4b16",
      // background: "#1e272e",
      text: "#FFFFFF",
    },
    divider: {
      default: "#073642",
    },
    action: {
      button: "rgba(0,0,0,.54)",
      hover: "rgba(0,0,0,.08)",
      disabled: "rgba(0,0,0,.12)",
    },
  }, "dark");
};
