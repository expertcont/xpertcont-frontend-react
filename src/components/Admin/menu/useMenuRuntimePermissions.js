import { useCallback, useEffect, useMemo, useState } from "react";

const OPEN_PERMISSIONS = {
  seguridadActiva: false,
  accesoTotal: true,
  items: [],
  acciones: [],
};

const DENY_PERMISSIONS = {
  seguridadActiva: true,
  accesoTotal: false,
  items: [],
  acciones: [],
};

export default function useMenuRuntimePermissions({
  backHost,
  idAnfitrion,
  idInvitado,
  rubro = "TRANSPORTE",
  enabled = true,
  aplicarPermisosSuper = false,
}) {
  const [permisos, setPermisos] = useState(enabled ? DENY_PERMISSIONS : OPEN_PERMISSIONS);

  useEffect(() => {
    let cancelado = false;

    const cargarPermisos = async () => {
      if (!enabled || !backHost || !idAnfitrion || !idInvitado) {
        setPermisos(enabled ? DENY_PERMISSIONS : OPEN_PERMISSIONS);
        return;
      }

      try {
        setPermisos(DENY_PERMISSIONS);
        const query = new URLSearchParams({
          rubro,
          aplicar_permisos_super: aplicarPermisosSuper ? "1" : "0",
        }).toString();
        const response = await fetch(`${backHost}/mad_menu_permiso/runtime/${idAnfitrion}/${idInvitado}?${query}`);
        const json = await response.json();

        if (!response.ok || !json.success) {
          throw new Error(json.message || "No se pudo cargar permisos de menu.");
        }

        const data = json.data || {};
        const debeForzarMatrizSuper = aplicarPermisosSuper
          && data.seguridad_activa === true
          && data.acceso_total !== false
          && idAnfitrion !== idInvitado;

        if (debeForzarMatrizSuper) {
          const permisosResponse = await fetch(`${backHost}/mad_menu_permiso/${idAnfitrion}/${idInvitado}/${encodeURIComponent(idInvitado)}`);
          const permisosJson = await permisosResponse.json();

          if (!permisosResponse.ok || !permisosJson.success) {
            throw new Error(permisosJson.message || "No se pudo cargar matriz de permisos de menu.");
          }

          if (!cancelado) {
            setPermisos({
              seguridadActiva: true,
              accesoTotal: false,
              items: (permisosJson.data?.items || [])
                .filter((item) => item.permitido === "S")
                .map((item) => item.id_item),
              acciones: (permisosJson.data?.acciones || [])
                .filter((accion) => accion.permitido === "S")
                .map((accion) => accion.id_accion),
            });
          }
          return;
        }

        if (!cancelado) {
          setPermisos({
            seguridadActiva: data.seguridad_activa === true,
            accesoTotal: data.acceso_total !== false,
            items: Array.isArray(data.items) ? data.items : [],
            acciones: Array.isArray(data.acciones) ? data.acciones : [],
          });
        }
      } catch (error) {
        console.log("Error cargando permisos runtime de menu:", error);
        if (!cancelado) {
          setPermisos(DENY_PERMISSIONS);
        }
      }
    };

    cargarPermisos();

    return () => {
      cancelado = true;
    };
  }, [aplicarPermisosSuper, backHost, enabled, idAnfitrion, idInvitado, rubro]);

  const itemSet = useMemo(() => new Set(permisos.items), [permisos.items]);
  const accionSet = useMemo(() => new Set(permisos.acciones), [permisos.acciones]);

  // La sesion ya sabe que figura es: anfitrion, super usuario o supervisor.
// Esas tres entran sin seguridad, igual que antes de que existiera la matriz
// de permisos; el backend no conoce al supervisor, asi que la excepcion se
  // resuelve aqui. Solo el invitado corriente pasa por la matriz.
  const accesoTotalSesion = useMemo(() => {
    if (typeof window === "undefined") return false;
    if (idAnfitrion && idInvitado && idAnfitrion === idInvitado) return true;
    return window.sessionStorage.getItem("super") === "1"
      || window.sessionStorage.getItem("supervisor") === "1";
  }, [idAnfitrion, idInvitado]);

  const puedeItem = useCallback(
    (idItem) => !idItem || accesoTotalSesion || !permisos.seguridadActiva || permisos.accesoTotal || itemSet.has(idItem),
    [itemSet, permisos.accesoTotal, permisos.seguridadActiva, accesoTotalSesion]
  );

  const puedeAccion = useCallback(
    (idAccion) => !idAccion || accesoTotalSesion || !permisos.seguridadActiva || permisos.accesoTotal || accionSet.has(idAccion),
    [accionSet, permisos.accesoTotal, permisos.seguridadActiva, accesoTotalSesion]
  );

  const puedeAlguno = useCallback(
    (ids = []) => accesoTotalSesion || !permisos.seguridadActiva || permisos.accesoTotal || ids.some((id) => itemSet.has(id)),
    [itemSet, permisos.accesoTotal, permisos.seguridadActiva, accesoTotalSesion]
  );

  return {
    seguridadActiva: permisos.seguridadActiva,
    accesoTotal: permisos.accesoTotal,
    puedeItem,
    puedeAccion,
    puedeAlguno,
  };
}
