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
  const [tokenSunat, setTokenSunat] = useState(null);
  const [xmlEnCurso, setXmlEnCurso] = useState(null);
  const [recarga, setRecarga] = useState(0);
  const [revision, setRevision] = useState(0);
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
      .then(({ data }) => { if (vigente) { setDatos(data); setRevision(v=>v+1); } })
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
      } else if (tipo === "token") {
        const response = await sireComprasApi.generarToken(payload);
        if (contextoActual.current !== origen) return;
        console.log("[SireCompras] generarToken ok", response?.data);
        setTokenSunat(response.data || null);
        setMensaje(`Token SUNAT generado (${response.data?.longitud || 0} caracteres).`);
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
          setRevision(v=>v+1);
        }
        setMensaje(response.data.message || "Ticket de compras guardado. Consulta su estado para recuperar la propuesta.");
      }
    } catch (err) {
      console.log("[SireCompras] ejecutar error", tipo, err?.response?.status, err?.response?.data?.message);
      if (contextoActual.current === origen) setError(err.response?.data?.message || "No se pudo completar la operacion de SIRE Compras.");
    } finally {
      accionActiva.current = false;
      setAccion("");
    }
  };
  // Descarga el XML de un comprobante SUNAT individual. El token vive solo en el
  // backend: aqui solo se envian tipo/serie/numero y se recibe el archivo.
  const descargarXml = async (registro) => {
    if (accionActiva.current || !valido || !registro) return;
    const clave = `${registro.tipo_comprobante || ""}-${registro.serie || ""}-${registro.numero || ""}`;
    const origen = contexto;
    accionActiva.current = true;
    setAccion(`xml:${clave}`);
    setXmlEnCurso(clave);
    setError("");
    setMensaje("");
    try {
      const response = await sireComprasApi.descargarXml({
        ...payload,
        ruc_emisor: String(registro.documento_proveedor || registro.ruc_proveedor || "").replace(/\D/g, ""),
        tipo_comprobante: registro.tipo_comprobante,
        serie: registro.serie,
        numero: registro.numero,
      });
      if (contextoActual.current !== origen) return;
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `CPE_${clave.replace(/^-+|-+$/g, "") || "comprobante"}.xml`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMensaje(`XML del comprobante ${clave} descargado.`);
    } catch (err) {
      let texto = err.response?.data?.message;
      if (!texto && err.response?.data instanceof Blob) {
        try { texto = JSON.parse(await err.response.data.text()).message; } catch { texto = ""; }
      }
      console.log("[SireCompras] descargarXml error", clave, err?.response?.status, texto, err?.message);
      if (contextoActual.current === origen) setError(texto || "No se pudo descargar el XML del comprobante.");
    } finally {
      accionActiva.current = false;
      setAccion("");
      setXmlEnCurso(null);
    }
  };
  return {
    datos, cargando, accion, ocupado, error, mensaje, valido, contexto, revision, tokenSunat,
    idAnfitrion: params.id_anfitrion, periodo, documentoId, periodos, empresas, ejecutar, descargarXml, xmlEnCurso,
    actualizar: () => setRecarga(v => v + 1),
    cambiarPeriodo: v => navigate(ruta(normalizarPeriodo(v), documentoId)),
    cambiarEmpresa: v => navigate(ruta(periodo, /^\d{11}$/.test(v) ? v : "")),
  };
}
