import { act, renderHook } from "@testing-library/react";
import useTrVisualViewport from "../useTrVisualViewport";

const descriptor = Object.getOwnPropertyDescriptor(window, "visualViewport");
let visual;

beforeEach(() => {
  visual = new EventTarget();
  Object.assign(visual, { height: 740, offsetTop: 0, scale: 1 });
  Object.defineProperty(window, "visualViewport", { configurable: true, get: () => visual });
});

afterEach(() => {
  if (descriptor) Object.defineProperty(window, "visualViewport", descriptor);
  else delete window.visualViewport;
});

test("adapta el alto y desplazamiento cuando el teclado reduce el area visible", () => {
  const { result } = renderHook(() => useTrVisualViewport(true));
  expect(result.current).toEqual({ height: 740, top: 0 });
  act(() => {
    visual.height = 350;
    visual.offsetTop = 90;
    visual.dispatchEvent(new Event("resize"));
  });
  expect(result.current).toEqual({ height: 350, top: 90 });
  act(() => {
    visual.offsetTop = 110;
    visual.dispatchEvent(new Event("scroll"));
  });
  expect(result.current).toEqual({ height: 350, top: 110 });
});

test("no reacomoda el modal durante el zoom y deja de escuchar al cerrar", () => {
  const { result, rerender } = renderHook(({ open }) => useTrVisualViewport(open), { initialProps: { open: true } });
  act(() => {
    visual.scale = 2;
    visual.height = 200;
    visual.dispatchEvent(new Event("resize"));
  });
  expect(result.current).toEqual({ height: 740, top: 0 });
  rerender({ open: false });
  act(() => {
    visual.scale = 1;
    visual.height = 500;
    visual.dispatchEvent(new Event("resize"));
  });
  expect(result.current).toEqual({ height: 740, top: 0 });
  rerender({ open: true });
  expect(result.current).toEqual({ height: 500, top: 0 });
});

test("usa el alto de ventana cuando no existe VisualViewport", () => {
  visual = undefined;
  const { result } = renderHook(() => useTrVisualViewport(true));
  expect(result.current).toEqual({ height: window.innerHeight, top: 0 });
});
