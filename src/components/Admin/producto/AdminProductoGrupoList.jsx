/**
 * Pantalla de mantenimiento de Grupos Color.
 *
 * Estructura del componente:
 * 1. Contexto de navegación y estado local.
 * 2. Carga de disponibilidad, registros y permisos existentes de productos.
 * 3. Filtrado local y acciones del formulario (crear, editar, eliminar).
 * 4. Definición de columnas y presentación: cabecera, tabla, diálogo y avisos.
 *
 * Reutiliza requestProducto, los campos y la tabla del catálogo. El backend
 * conserva la responsabilidad de validar comercial/SKU y la clave compuesta.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Snackbar, Tooltip, Typography } from '@mui/material';
import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import swal from 'sweetalert2';
import AppButton from '../../ui/AppButton';
import AppSearch from '../../ui/AppSearch';
import palette from '../../../theme/palette';
import AdminProductoTable from './AdminProductoTable';
import { ProductoField, actionSx, primarySx } from './ProductoFields';
import { requestProducto } from './productoMantenimiento';

// Solo los campos editables; origen y fechas de auditoría los asigna el servidor.
const vacio = { id_grupo: '', nombre: '', descripcion: '' };

export default function AdminProductoGrupoList() {
  // 1. CONTEXTO Y ESTADO: los parámetros identifican propietario, operador y
  // empresa. Cada segmento de URL se codifica antes de consultar el backend.
  const { id_anfitrion, id_invitado, documento_id } = useParams();
  const base = `/${encodeURIComponent(id_anfitrion)}/${encodeURIComponent(documento_id)}`;
  const [datos, setDatos] = useState(null);
  const [recarga, setRecarga] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const [editor, setEditor] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState('');
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [permisos, setPermisos] = useState({ key: '', comandos: [] });
  // La clave impide reutilizar filas o permisos de una navegación anterior.
  const key = `${id_anfitrion}/${id_invitado}/${documento_id}`;
  const actual = datos?.key === key ? datos : null;
  // Se conservan los comandos de productos: 01-01 crear, 01-02 editar y
  // 01-03 eliminar. El anfitrión mantiene la regla de acceso del catálogo.
  const puede = comando => id_anfitrion === id_invitado || (permisos.key === key && permisos.comandos.some(p => p.id_comando === comando));

  // 2. CARGA: la disponibilidad se consulta antes de pedir los registros.
  // El indicador `activo` descarta respuestas de efectos ya desmontados.
  useEffect(() => {
    let activo = true;
    setDatos(null); setEditor(null); setError(''); setAviso('');
    async function cargar() {
      try {
        const config = await requestProducto(`/ad_productogrupoconfig${base}`);
        const filas = config?.habilitado === true ? await requestProducto(`/ad_productogrupo${base}`) : [];
        if (activo) setDatos({ key, habilitado: config?.habilitado === true, filas: Array.isArray(filas) ? filas : [] });
      } catch (e) { if (activo) { setError(e.message); setDatos({ key, habilitado: false, filas: [], fallo: true }); } }
    }
    cargar();
    return () => { activo = false; };
  }, [base, key, recarga]);

  // Los permisos de botones se cargan por separado de los datos comerciales.
  useEffect(() => {
    let activo = true;
    setPermisos({ key, comandos: [] });
    if (id_anfitrion !== id_invitado) {
      requestProducto(`/seguridad/${encodeURIComponent(id_anfitrion)}/${encodeURIComponent(id_invitado)}/01`)
        .then(data => { if (activo) setPermisos({ key, comandos: Array.isArray(data) ? data : [] }); })
        .catch(() => { if (activo) setError('No se pudieron consultar los permisos.'); });
    }
    return () => { activo = false; };
  }, [id_anfitrion, id_invitado, key]);

  // 3. CONSULTA LOCAL Y ACCIONES: buscar no modifica ni vuelve a pedir los datos.
  const filas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return (datos?.key === key ? datos.filas : []).filter(row => [row.id_grupo, row.nombre, row.descripcion]
      .some(value => String(value || '').toLowerCase().includes(texto)));
  }, [datos, key, busqueda]);

  // `original` distingue creación de edición y conserva la identidad del grupo.
  const abrir = row => { setErrorFormulario(''); setEditor({ ...vacio, ...row, original: row?.id_grupo }); };
  const guardar = async event => {
    event.preventDefault();
    if (guardando || !actual?.habilitado || !puede(editor.original ? '01-02' : '01-01')) return;
    const grupo = { id_grupo: editor.id_grupo.trim(), nombre: editor.nombre.trim(), descripcion: editor.descripcion.trim() };
    if (!grupo.id_grupo || !grupo.nombre) { setErrorFormulario('Completa el código y el nombre.'); return; }
    setGuardando(true); setErrorFormulario('');
    try {
      const path = `/ad_productogrupo${base}${editor.original ? `/${encodeURIComponent(editor.original)}` : ''}`;
      const guardado = await requestProducto(path, { method: editor.original ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...grupo, ctrl_crea_us: id_invitado, ctrl_mod_us: id_invitado }) });
      // Actualizar la tabla solo tras la confirmación del servidor y únicamente
      // si seguimos en el contexto que inició la operación.
      setDatos(previous => previous?.key === key ? { ...previous, filas: [...previous.filas.filter(row => row.id_grupo !== guardado.id_grupo), guardado].sort((a, b) => a.id_grupo.localeCompare(b.id_grupo)) } : previous);
      setEditor(null); setAviso(editor.original ? 'Grupo actualizado.' : 'Grupo creado.');
    } catch (e) { setErrorFormulario(e.message); } finally { setGuardando(false); }
  };
  // La confirmación precede a la petición; cancelar conserva el registro.
  const eliminar = async row => {
    if (eliminando || !puede('01-03')) return;
    setEliminando(true);
    try {
      const result = await swal.fire({ title: '¿Eliminar grupo?', text: `${row.id_grupo} · ${row.nombre}`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar' });
      if (!result.isConfirmed) return;
      await requestProducto(`/ad_productogrupo${base}/${encodeURIComponent(row.id_grupo)}`, { method: 'DELETE' });
      setDatos(previous => previous?.key === key ? { ...previous, filas: previous.filas.filter(item => item.id_grupo !== row.id_grupo) } : previous);
      setAviso('Grupo eliminado.');
    } catch (e) { setError(e.message); } finally { setEliminando(false); }
  };
  // 4. PRESENTACIÓN: columnas del listado y acciones permitidas por registro.
  const columnas = [
    { name: 'Código', selector: row => row.id_grupo, sortable: true, width: '160px' },
    { name: 'Nombre', selector: row => row.nombre || '', sortable: true, grow: 1.5, wrap: true },
    { name: 'Descripción', selector: row => row.descripcion || '', grow: 2, wrap: true },
    { name: 'Origen', selector: row => row.origen || '', width: '110px' },
    { name: 'Acciones', width: '110px', cell: row => <Box sx={{ display: 'flex', gap: 0.75 }}>
      {puede('01-02') && <Tooltip title="Editar"><IconButton aria-label={`Editar ${row.id_grupo}`} sx={actionSx} onClick={() => abrir(row)}><Pencil size={15} /></IconButton></Tooltip>}
      {puede('01-03') && <Tooltip title="Eliminar"><span><IconButton disabled={eliminando} aria-label={`Eliminar ${row.id_grupo}`} sx={actionSx} onClick={() => eliminar(row)}><Trash2 size={15} /></IconButton></span></Tooltip>}
    </Box> },
  ];

  // La vista distingue carga, error y módulo deshabilitado. El diálogo bloquea
  // el cierre mientras guarda y muestra los errores sin perder lo ingresado.
  return <Box sx={{ p: { xs: 1.5, md: 3 }, color: palette.text }}>
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 2 }}>
      <Box sx={{ flex: 1 }}><Typography variant="h5" sx={{ fontWeight: 800 }}>Grupos Color</Typography>
        <Typography sx={{ color: palette.muted, fontSize: 13 }}>Agrupación de productos para la opción SKU.</Typography></Box>
      <AppButton icon={<RefreshCw size={16} />} disabled={guardando || eliminando} onClick={() => setRecarga(value => value + 1)}>Actualizar</AppButton>
      {actual?.habilitado && puede('01-01') && <AppButton icon={<Plus size={16} />} sx={primarySx} onClick={() => abrir(null)}>Nuevo grupo</AppButton>}
    </Box>
    {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
    {!actual ? <Typography role="status">Cargando grupos…</Typography> : actual.habilitado ? <>
      <Box sx={{ mb: 2 }}><AppSearch placeholder="Buscar código, nombre o descripción…" value={busqueda} onChange={event => setBusqueda(event.target.value)} width={{ xs: '100%', sm: 380 }} /></Box>
      <AdminProductoTable columns={columnas} data={filas} keyField="id_grupo" />
    </> : !actual.fallo && <Alert severity="info">Disponible únicamente para el rubro comercial con la opción SKU activada.</Alert>}
    <Dialog open={Boolean(editor) && Boolean(actual?.habilitado)} onClose={() => { if (!guardando) setEditor(null); }} fullWidth maxWidth="sm"
      PaperProps={{ sx: { bgcolor: palette.surface, color: palette.text } }}>
      <Box component="form" onSubmit={guardar}>
        <DialogTitle>{editor?.original ? 'Editar grupo' : 'Nuevo grupo'}</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2 }}>
          {errorFormulario && <Alert severity="error">{errorFormulario}</Alert>}
          <ProductoField label="Código *" value={editor?.id_grupo} maxLength={15} readOnly={Boolean(editor?.original) || guardando} onChange={value => setEditor(previous => ({ ...previous, id_grupo: value }))} />
          <ProductoField label="Nombre *" value={editor?.nombre} maxLength={100} readOnly={guardando} onChange={value => setEditor(previous => ({ ...previous, nombre: value }))} />
          <ProductoField label="Descripción" value={editor?.descripcion} maxLength={300} readOnly={guardando} multiline onChange={value => setEditor(previous => ({ ...previous, descripcion: value }))} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}><Button disabled={guardando} onClick={() => setEditor(null)}>Cancelar</Button>
          <Button type="submit" disabled={guardando} sx={primarySx}>{guardando ? 'Guardando…' : 'Guardar'}</Button></DialogActions>
      </Box>
    </Dialog>
    <Snackbar open={Boolean(aviso)} autoHideDuration={4000} onClose={() => setAviso('')} message={aviso} />
  </Box>;
}
