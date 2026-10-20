import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { Alert, Box, Dialog, IconButton, Menu, MenuItem, Snackbar, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';
import { Copy, Download, FileSpreadsheet, MoreHorizontal, Package, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import swal from 'sweetalert2';
import AppButton from '../../ui/AppButton';
import AppSearch from '../../ui/AppSearch';
import BotonExcelGeneral from '../../BotonExcelGeneral';
import palette from '../../../theme/palette';
import AdminFileProducto from './AdminFileProducto';
import AdminProductoTable from './AdminProductoTable';
import ProductoEditor from './ProductoEditor';
import { ProductoField, actionSx, primarySx, surfaceSx } from './ProductoFields';
import { integer, money, requestProducto, revisarRangos, unitPrice } from './productoMantenimiento';

export default function AdminProductoCatalogo() {
  const params = useParams();
  const { user, isAuthenticated } = useAuth0();
  const { id_anfitrion, id_invitado, documento_id } = params;
  const base = `/${encodeURIComponent(id_anfitrion)}/${encodeURIComponent(documento_id)}`;
  const [productos, setProductos] = useState([]);
  const [precios, setPrecios] = useState([]);
  const [porCantidad, setPorCantidad] = useState(false);
  const [vista, setVista] = useState('productos');
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('todos');
  const [clase, setClase] = useState('');
  const [subclase, setSubclase] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editor, setEditor] = useState(null);
  const [menu, setMenu] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [clone, setClone] = useState(null);
  const [cloning, setCloning] = useState(false);
  const [cloneError, setCloneError] = useState('');
  const [permisos, setPermisos] = useState([]);
  const propio = id_anfitrion === id_invitado;
  const puede = comando => propio || permisos.some(p => p.id_comando === comando);

  const cargar = useCallback(async () => {
    setLoading(true); setError('');
    const suffix = `/${encodeURIComponent(id_anfitrion)}/${encodeURIComponent(documento_id)}`;
    try {
      const [data, config] = await Promise.all([requestProducto(`/ad_producto${suffix}`), requestProducto(`/ad_productoparametros${suffix}`)]);
      const factor = config?.precio_factor === '1';
      const priceData = factor ? await requestProducto(`/ad_productoprecio${suffix}`) : [];
      setProductos(Array.isArray(data) ? data : []); setPrecios(Array.isArray(priceData) ? priceData : []); setPorCantidad(factor);
      if (!factor) setVista('productos');
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [id_anfitrion, documento_id]);
  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => {
    setPermisos([]);
    if (propio || !isAuthenticated || !user?.email) return undefined;
    let active = true;
    requestProducto(`/seguridad/${encodeURIComponent(id_anfitrion)}/${encodeURIComponent(id_invitado)}/01`)
      .then(data => { if (active) setPermisos(Array.isArray(data) ? data : []); })
      .catch(() => { if (active) setError('No se pudieron consultar los permisos.'); });
    return () => { active = false; };
  }, [propio, isAuthenticated, user?.email, id_anfitrion, id_invitado]);

  const porProducto = useMemo(() => {
    const result = new Map();
    precios.forEach(row => {
      const list = result.get(row.id_producto) || [];
      list.push({ ...row, unidades: row.unidades ?? row.descripcion }); result.set(row.id_producto, list);
    });
    return result;
  }, [precios]);
  const productoMap = useMemo(() => new Map(productos.map(p => [p.id_producto, p])), [productos]);
  const configuracion = row => revisarRangos(porProducto.get(row.id_producto) || []);
  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return (vista === 'productos' ? productos : precios).filter(row => {
      const p = vista === 'productos' ? row : productoMap.get(row.id_producto) || {};
      return (!texto || [row.id_producto, row.nombre].some(value => String(value || '').toLowerCase().includes(texto)))
        && (estado === 'todos' || (estado === 'activos' ? p.activado !== false : estado === 'inactivos' ? p.activado === false : Boolean(revisarRangos(porProducto.get(row.id_producto) || []))))
        && (!clase || p.id_clase === clase) && (!subclase || p.id_subclase === subclase);
    });
  }, [vista, productos, precios, busqueda, estado, clase, subclase, productoMap, porProducto]);
  const abrir = (row, tab = 'datos') => setEditor({ id: row?.id_producto, tab });
  const confirm = async (title, text) => swal.fire({ title, text, icon: 'warning', showCancelButton: true, confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar' });
  const eliminar = async row => {
    if (!puede('01-03')) return;
    const result = await confirm('¿Eliminar producto?', `${row.id_producto} · ${row.nombre}. También se eliminarán sus rangos de precios.`);
    if (!result.isConfirmed) return;
    try { await requestProducto(`/ad_producto${base}/${encodeURIComponent(row.id_producto)}`, { method: 'DELETE' }); setNotice('Producto eliminado'); await cargar(); }
    catch (e) { setError(e.message); }
  };
  const clonar = async () => {
    if (!puede('01-01') || !clone.codigo.trim() || !clone.nombre.trim()) { setCloneError('Completa el código y el nombre del nuevo producto.'); return; }
    setCloning(true); setCloneError('');
    try {
      const result = await requestProducto('/ad_productoclon', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id_anfitrion, documento_id, id_producto: clone.origen, id_producto_nuevo: clone.codigo.trim(), nombre_nuevo: clone.nombre.trim() }) });
      if (!result?.exito) throw new Error(result?.mensaje || 'No se pudo clonar el producto.');
      setClone(null); setNotice('Producto clonado'); await cargar();
    } catch (e) { setCloneError(e.message); } finally { setCloning(false); }
  };
  const eliminarMasivo = async () => {
    setMenu(null);
    const result = await swal.fire({ title: 'Eliminar productos por origen', input: 'select', inputOptions: { EXCEL: 'EXCEL', MANUAL: 'MANUAL' }, inputPlaceholder: 'Selecciona origen', showCancelButton: true, confirmButtonText: 'Continuar', cancelButtonText: 'Cancelar', inputValidator: value => !value && 'Selecciona un origen.' });
    if (!result.isConfirmed) return;
    const confirmation = await confirm('¿Eliminar los productos seleccionados?', `Se eliminarán todos los productos de origen ${result.value} de esta empresa.`);
    if (!confirmation.isConfirmed) return;
    try { await requestProducto(`/ad_productomasivo${base}/${encodeURIComponent(result.value)}`, { method: 'DELETE' }); setNotice('Productos eliminados'); await cargar(); }
    catch (e) { setError(e.message); }
  };
  const columns = [
    { name: 'Código', selector: row => row.id_producto, sortable: true, width: '125px' },
    { name: 'Producto', selector: row => row.nombre, sortable: true, minWidth: '230px', grow: 2,
      cell: row => <Box sx={{ py: 1 }}><Typography sx={{ fontSize: 13, fontWeight: 700 }}>{row.nombre}</Typography>{vista === 'productos' && row.descripcion && <Typography sx={{ fontSize: 11, color: palette.muted }}>{row.descripcion}</Typography>}</Box> },
    ...(vista === 'precios' ? [
      { name: 'Desde', selector: row => Number(row.cant_min), format: row => integer(row.cant_min), sortable: true, width: '95px' },
      { name: 'Hasta', selector: row => Number(row.cant_max), format: row => integer(row.cant_max), sortable: true, width: '140px' },
      { name: 'Unidades ref.', selector: row => Number(row.unidades ?? row.descripcion), sortable: true, width: '125px' },
      { name: 'Precio ref.', selector: row => Number(row.precio_venta), format: row => money(row.precio_venta), sortable: true, width: '135px' },
      { name: 'S/ por unidad', selector: row => Number(row.precio_venta) / Number(row.unidades ?? row.descripcion), format: row => unitPrice(Number(row.precio_venta) / Number(row.unidades ?? row.descripcion)), width: '135px' },
    ] : [
      { name: 'Unidad', selector: row => row.cont_und || '—', width: '90px' },
      porCantidad ? { name: 'Precios por cantidad', minWidth: '190px', cell: row => <Typography sx={{ fontSize: 12, color: configuracion(row) ? palette.warning : palette.accent }}>{(porProducto.get(row.id_producto) || []).length} rangos · {configuracion(row) ? 'Revisar' : 'Configurado'}</Typography> }
        : { name: 'Precio de venta', selector: row => Number(row.precio_venta), format: row => money(row.precio_venta), sortable: true, width: '160px' },
      { name: 'Estado', width: '100px', cell: row => <Box sx={{ fontSize: 11, fontWeight: 700, px: 1, py: 0.4, borderRadius: 1.5, bgcolor: row.activado === false ? palette.chip : palette.successSoft, color: row.activado === false ? palette.muted : palette.success }}>{row.activado === false ? 'Inactivo' : 'Activo'}</Box> },
    ]),
    { name: '', width: vista === 'productos' ? '135px' : '60px', right: true, button: true, cell: row => <Box sx={{ display: 'flex', gap: 0.6 }}>
      <Tooltip title={puede('01-02') ? 'Editar producto' : 'Consultar producto'}><IconButton aria-label={`Abrir ${row.nombre}`} sx={actionSx} onClick={() => abrir(row, vista === 'precios' ? 'precios' : 'datos')}><Pencil size={14} /></IconButton></Tooltip>
      {vista === 'productos' && puede('01-01') && <Tooltip title="Clonar producto"><IconButton aria-label={`Clonar ${row.nombre}`} sx={actionSx} onClick={() => { setClone({ origen: row.id_producto, codigo: '', nombre: row.nombre || '' }); setCloneError(''); }}><Copy size={14} /></IconButton></Tooltip>}
      {vista === 'productos' && puede('01-03') && <Tooltip title="Eliminar producto"><IconButton aria-label={`Eliminar ${row.nombre}`} sx={{ ...actionSx, color: palette.danger }} onClick={() => eliminar(row)}><Trash2 size={14} /></IconButton></Tooltip>}
    </Box> },
  ];
  const clases = [...new Set(productos.map(p => p.id_clase).filter(Boolean))].sort();
  const subclases = [...new Set(productos.filter(p => !clase || p.id_clase === clase).map(p => p.id_subclase).filter(Boolean))].sort();
  return <Box sx={{ minHeight: '100%', p: { xs: 2, md: 4 }, color: palette.text }}>
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box sx={{ width: 40, height: 40, display: 'grid', placeItems: 'center', bgcolor: palette.accentSoft, borderRadius: 2, color: palette.accent }}><Package size={21} /></Box>
          <Box><Typography sx={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>Productos</Typography><Typography sx={{ fontSize: 12, color: palette.muted, mt: 0.5 }}>{productos.length} productos · {porCantidad ? 'Precios por cantidad' : 'Precio único por producto'}</Typography></Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <AppSearch placeholder="Buscar código o nombre…" value={busqueda} onChange={event => setBusqueda(event.target.value)} width={{ xs: '100%', sm: 280 }} />
          {puede('01-01') && <AppButton icon={<Plus size={17} />} onClick={() => abrir(null)} disabled={loading} sx={primarySx}>Nuevo producto</AppButton>}
          <IconButton aria-label="Actualizar productos" disabled={loading} onClick={cargar} sx={actionSx}><RefreshCw size={16} /></IconButton>
          <IconButton aria-label="Opciones de archivo" onClick={event => setMenu(event.currentTarget)} sx={actionSx}><MoreHorizontal size={18} /></IconButton>
        </Box>
      </Box>
      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
      <Box sx={{ ...surfaceSx, p: 1.5, display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', gap: 1.5, mb: 1.5 }}>
        {porCantidad && <ToggleButtonGroup exclusive value={vista} onChange={(_, value) => { if (value) setVista(value); }} size="small" sx={{ alignSelf: 'center', '& .MuiToggleButton-root': { textTransform: 'none', color: palette.muted, borderColor: palette.border, fontSize: 12 }, '& .Mui-selected': { color: `${palette.accent} !important`, bgcolor: `${palette.accentSoft} !important` } }}><ToggleButton value="productos">Catálogo</ToggleButton><ToggleButton value="precios">Todos los rangos</ToggleButton></ToggleButtonGroup>}
        <Box sx={{ width: { xs: '100%', sm: 170 } }}><ProductoField label="Estado" value={estado} onChange={setEstado} options={[{ value: 'todos', label: 'Todos' }, { value: 'activos', label: 'Activos' }, { value: 'inactivos', label: 'Inactivos' }, ...(porCantidad ? [{ value: 'revisar', label: 'Precios por revisar' }] : [])]} /></Box>
        <Box sx={{ width: { xs: '100%', sm: 160 } }}><ProductoField label="Clase" value={clase} onChange={value => { setClase(value); setSubclase(''); }} options={[{ value: '', label: 'Todas las clases' }, ...clases.map(value => ({ value, label: value }))]} /></Box>
        <Box sx={{ width: { xs: '100%', sm: 170 } }}><ProductoField label="Subclase" value={subclase} onChange={setSubclase} options={[{ value: '', label: 'Todas las subclases' }, ...subclases.map(value => ({ value, label: value }))]} /></Box>
        <Typography sx={{ ml: 'auto', alignSelf: 'center', fontSize: 12, color: palette.muted }}>{visibles.length} {vista === 'productos' ? 'productos' : 'rangos'}</Typography>
      </Box>
      <AdminProductoTable columns={columns} data={visibles} loading={loading} keyField={vista === 'precios' ? '_key' : 'id_producto'} onRowClicked={row => abrir(row, vista === 'precios' ? 'precios' : 'datos')} />
      <Typography sx={{ color: palette.muted, fontSize: 11.5, mt: 1.2 }}>Selecciona un producto para consultar sus datos{porCantidad ? ', editar sus rangos y probar una cantidad.' : ' y su precio de venta.'}</Typography>
    </Box>
    <Menu anchorEl={menu} open={Boolean(menu)} onClose={() => setMenu(null)} PaperProps={{ sx: { bgcolor: palette.surface, color: palette.text, border: `1px solid ${palette.border}`, '& .MuiMenuItem-root': { fontSize: 13, gap: 1 } } }}>
      <MenuItem><FileSpreadsheet size={16} /><BotonExcelGeneral datos={visibles} nombreArchivo={vista === 'productos' ? 'Productos' : 'Rangos_Precios'} tituloReporte="Catálogo de productos" columnasNumericas={['precio_venta', 'cant_min', 'cant_max', 'unidades']} columnasExcluidas={['auxiliar']} />Exportar vista</MenuItem>
      {puede('01-01') && <MenuItem onClick={() => { setImportOpen(true); setMenu(null); }}><Download size={16} />Importar {vista === 'productos' ? 'productos' : 'rangos'}</MenuItem>}
      {vista === 'productos' && <MenuItem component="a" href={`${process.env.PUBLIC_URL || ''}/productos_prueba.xlsx`} download="productos_prueba.xlsx"><Download size={16} />Plantilla de productos</MenuItem>}
      {vista === 'productos' && puede('01-04') && <MenuItem onClick={eliminarMasivo} sx={{ color: palette.danger }}><Trash2 size={16} />Eliminar por origen</MenuItem>}
    </Menu>
    {editor && <ProductoEditor params={params} idProducto={editor.id} initialTab={editor.tab} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); setNotice('Producto y precios guardados'); cargar(); }} readOnly={editor.id ? !puede('01-02') : !puede('01-01')} />}
    <Dialog open={importOpen} onClose={() => setImportOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { ...surfaceSx, color: palette.text, p: 2.5 } }}>
      <Typography sx={{ fontSize: 17, fontWeight: 800, mb: 1 }}>Importar {vista === 'productos' ? 'productos' : 'rangos de precios'}</Typography>
      <Typography sx={{ fontSize: 12, color: palette.muted, mb: 2 }}>{vista === 'productos' ? 'Selecciona el archivo Excel con los productos.' : 'Columnas: código, unidades de referencia, precio, cantidad mínima y cantidad máxima. Cantidades enteras.'}</Typography>
      <AdminFileProducto datosCarga={{ id_anfitrion, documento_id }} urlApiDestino={vista === 'productos' ? '/ad_productoexcel' : '/ad_productoprecioexcel'} onActualizaImportaOK={() => { setImportOpen(false); setNotice('Importación completada'); cargar(); }} />
      <AppButton onClick={() => setImportOpen(false)} sx={{ mt: 2, alignSelf: 'flex-end' }}>Cerrar</AppButton>
    </Dialog>
    <Dialog open={Boolean(clone)} onClose={() => { if (!cloning) setClone(null); }} fullWidth maxWidth="sm" PaperProps={{ sx: { ...surfaceSx, color: palette.text, p: 2.5 } }}>
      <Typography sx={{ fontSize: 17, fontWeight: 800, mb: 0.5 }}>Clonar producto</Typography><Typography sx={{ fontSize: 12, color: palette.muted, mb: 2 }}>Origen: {clone?.origen}</Typography>
      {cloneError && <Alert severity="error" sx={{ mb: 1.5 }}>{cloneError}</Alert>}
      <Box sx={{ display: 'grid', gap: 1.5 }}><ProductoField label="Nuevo código" value={clone?.codigo || ''} maxLength={15} readOnly={cloning} onChange={codigo => setClone(prev => ({ ...prev, codigo }))} /><ProductoField label="Nombre" value={clone?.nombre || ''} maxLength={100} readOnly={cloning} onChange={nombre => setClone(prev => ({ ...prev, nombre }))} /></Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}><AppButton onClick={() => setClone(null)} disabled={cloning}>Cancelar</AppButton><AppButton icon={<Copy size={16} />} disabled={cloning} onClick={clonar} sx={primarySx}>{cloning ? 'Clonando…' : 'Clonar producto'}</AppButton></Box>
    </Dialog>
    <Snackbar open={Boolean(notice)} autoHideDuration={3500} onClose={() => setNotice('')} message={notice} />
  </Box>;
}
