import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { sireComprasApi } from "../services/sireComprasApi";
import { normalizarPeriodo, vacio } from "../utils/comprasView";

export default function useSireCompras() {
  const params = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth0();
  const [periodos, setPeriodos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [datos, setDatos] = useState(vacio);
  const [cargando, setCargando] = useState(false);
  const [accion, setAccion] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [recarga, setRecarga] = useState(0);
  const periodo = normalizarPeriodo(params.periodo);
  const documentoId = /^\d{11}$/.test(params.documento_id || "") ? params.documento_id : "";
  const contexto = JSON.stringify([params.id_anfitrion, params.id_invitado, periodo, documentoId]);
  const contextoActual = useRef(contexto);
  contextoActual.current = contexto;
  const accionActiva = useRef(false);
  const valido = Boolean(params.id_anfitrion && periodo && documentoId);
  const ocupado = cargando || Boolean(accion);
  const urlContexto = [periodo, params.id_anfitrion, documentoId].map(v => encodeURIComponent(v || "")).join("/");
  const payload = { id_anfitrion: params.id_anfitrion, documento_id: documentoId, periodo };
  const ruta = (p, d) => `/sire/compras/${[params.id_anfitrion, params.id_invitado, p || "-", d || "-"].map(encodeURIComponent).join("/")}`;

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let vigente = true;
    sireComprasApi.catalogos({ id_anfitrion: params.id_anfitrion, id_invitado: params.id_invitado }).then(([p, e]) => {
      if (!vigente) return;
      setPeriodos(Array.isArray(p.data) ? p.data : []);
      setEmpresas(Array.isArray(e.data) ? e.data : []);
    }).catch(() => { if (vigente) setError("No se pudieron cargar las empresas y periodos disponibles."); });
    return () => { vigente = false; };
  }, [isAuthenticated, params.id_anfitrion, params.id_invitado]);

  useEffect(() => {
    if (valido || !periodos.length || !empresas.length) return;
    const p = periodo || normalizarPeriodo(periodos[0]?.periodo);
    const d = documentoId || empresas.find(e => /^\d{11}$/.test(e.documento_id))?.documento_id;
    if (p && d) navigate(`/sire/compras/${[params.id_anfitrion, params.id_invitado, p, d].map(encodeURIComponent).join("/")}`, { replace: true });
  }, [valido, periodos, empresas, periodo, documentoId, params.id_anfitrion, params.id_invitado, navigate]);

  useEffect(() => {
    let vigente = true;
    setDatos(vacio);
    setError("");
    setMensaje("");
    if (!valido || !isAuthenticated) { setCargando(false); return undefined; }
    setCargando(true);
    sireComprasApi.recuperar(urlContexto)
      .then(({ data }) => { if (vigente) setDatos(data); })
      .catch(err => { if (vigente) setError(err.response?.data?.message || "No se pudo recuperar SIRE Compras."); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [valido, isAuthenticated, urlContexto, recarga]);

  const ejecutar = async (tipo) => {
    if (accionActiva.current || !valido || ocupado) return;
    const origen = contexto;
    accionActiva.current = true;
    setAccion(tipo);
    setError("");
    setMensaje("");
    try {
      if (tipo === "archivo") {
        const response = await sireComprasApi.descargar(urlContexto);
        if (contextoActual.current !== origen) return;
        const url = URL.createObjectURL(response.data);
        const link = document.createElement("a");
        link.href = url;
        link.download = (datos.propuesta?.nombre_archivo || `compras_${documentoId}_${periodo}.zip`).split(/[\\/]/).pop();
        document.body.appendChild(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        const response = await sireComprasApi.ejecutar(tipo, {
          ...payload, ticket: datos.ticket, reutilizar_existente: !datos.ticket,
        });
        if (contextoActual.current !== origen) return;
        if (tipo === "ticket" && response.data.ticket) {
          // El ticket ya fue persistido: conservarlo aunque falle la recarga de registros.
          setDatos({ ...vacio, ticket: response.data.ticket,
            fecha_generacion: response.data.fecha_generacion || null });
        }
        if (tipo === "ticket" || response.data.listo) {
          const current = await sireComprasApi.recuperar(urlContexto);
          if (contextoActual.current !== origen) return;
          setDatos(current.data);
        }
        setMensaje(response.data.message || "Ticket de compras guardado. Consulta su estado para recuperar la propuesta.");
      }
    } catch (err) {
      if (contextoActual.current === origen) setError(err.response?.data?.message || "No se pudo completar la operacion de SIRE Compras.");
    } finally {
      accionActiva.current = false;
      setAccion("");
    }
  };
  return {
    datos, cargando, accion, ocupado, error, mensaje, valido, contexto,
    idAnfitrion: params.id_anfitrion, periodo, documentoId, periodos, empresas, ejecutar,
    actualizar: () => setRecarga(v => v + 1),
    cambiarPeriodo: v => navigate(ruta(normalizarPeriodo(v), documentoId)),
    cambiarEmpresa: v => navigate(ruta(periodo, /^\d{11}$/.test(v) ? v : "")),
  };
}
