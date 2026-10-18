import { useLayoutEffect, useState } from "react";

// El teclado y las barras del navegador pueden reducir o desplazar el area visible.
export default function useTrVisualViewport(open) {
  const [viewport, setViewport] = useState(null);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const visual = window.visualViewport;
    const actualizar = () => {
      // Conservar el zoom del usuario, sin reacomodar el modal durante el gesto.
      if (visual && visual.scale !== 1) return;
      const height = visual?.height || window.innerHeight;
      const top = Math.max(0, visual?.offsetTop || 0);
      setViewport((prev) => prev?.height === height && prev?.top === top ? prev : { height, top });
    };
    actualizar();
    window.addEventListener("resize", actualizar);
    visual?.addEventListener("resize", actualizar);
    visual?.addEventListener("scroll", actualizar);
    return () => {
      window.removeEventListener("resize", actualizar);
      visual?.removeEventListener("resize", actualizar);
      visual?.removeEventListener("scroll", actualizar);
    };
  }, [open]);

  return viewport;
}
