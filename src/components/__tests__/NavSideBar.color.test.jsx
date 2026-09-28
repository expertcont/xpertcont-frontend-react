import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import NavSideBar from "../NavSideBar";

jest.mock("@auth0/auth0-react", () => ({
  useAuth0: () => ({ user: null, isAuthenticated: false }),
}));

jest.mock("axios", () => ({
  get: () => Promise.resolve({ data: [] }),
}));

const reglas = () => {
  // eslint-disable-next-line testing-library/no-node-access
  const css = Array.from(document.querySelectorAll("style"))
    .map((s) => s.textContent || "")
    .join("\n}");
  return css.split("}").filter((r) => /color-mix/.test(r));
};

test("el menu lateral deriva sus colores del acento del tema", () => {
  render(
    <MemoryRouter>
      <NavSideBar idAnfitrion="1" idInvitado="1" rubro="TRANSPORTE" />
    </MemoryRouter>
  );

  const todas = reglas();
  expect(todas.length).toBeGreaterThan(0);

  // Ningun color del menu puede quedar sin resolver. Pasó con navText, que se
  // borro del tema y dejo sidebarColors.accent en undefined.
  expect(todas.join("")).not.toMatch(/var\(--app-nav-text/);
  expect(todas.join("")).not.toMatch(/:\s*undefined/);

  // El fondo es el acento oscurecido un 50%: no hay un hex por tema.
  const fondos = todas.filter((r) => /var\(--app-accent[^)]*\)\s*50%,\s*#000000/.test(r));
  expect(fondos.length).toBeGreaterThan(0);

  // El papel del Drawer lo pinta, para que el #fff por defecto de MUI no gane.
  const papel = todas.find((r) => /MuiDrawer-paper/.test(r) && /color-mix/.test(r));
  expect(papel).toBeTruthy();
  expect(papel).toMatch(/background-color:color-mix\(in srgb, var\(--app-accent[^)]*\) 50%, #000000\)/);
});
