import React, { useEffect, useState } from 'react';
import { Alert, Box, CircularProgress, Drawer, FormControlLabel, Grid, IconButton, Switch, Tab, Tabs, Typography } from '@mui/material';
import { Hash, Package, Save, X } from 'lucide-react';
import AppButton from '../../ui/AppButton';
import palette from '../../../theme/palette';
import { ProductoField, ProductoSection, primarySx } from './ProductoFields';
import ProductoRangosEditor from './ProductoRangosEditor';
import { requestProducto, revisarRangos } from './productoMantenimiento';

const nuevo = () => ({ id_producto: '', nombre: '', descripcion: '', precio_venta: '0', porc_igv: '18', cont_und: '', comercial: true,
  almacenable: false, activado: true, id_clase: '', id_subclase: '', id_producto2: '', cantidad_und2: 0, cont_und2: '' });

export default function ProductoEditor({ open = true, idProducto, params, initialTab = 'datos', onClose, onSaved, embedded = false, readOnly = false, cloneUnits }) {
  const [producto, setProducto] = useState(nuevo);
  const [rangos, setRangos] = useState([]);
  const [porCantidad, setPorCantidad] = useState(false);
  const [unidades, setUnidades] = useState([]);
  const [tab, setTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState(false);
  const { id_anfitrion, documento_id } = params;
  const base = `/${encodeURIComponent(id_anfitrion)}/${encodeURIComponent(documento_id)}`;

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    setLoading(true); setError(''); setLoadError(false); setDirty(false); setTab(initialTab);
    const suffix = `/${encodeURIComponent(id_anfitrion)}/${encodeURIComponent(documento_id)}`;
    (async () => {
      try {
        const [config, unidadData, data] = await Promise.all([
          requestProducto(`/ad_productoparametros${suffix}`), requestProducto('/unidadmedida'),
          idProducto ? requestProducto(`/ad_producto${suffix}/${encodeURIComponent(idProducto)}`) : Promise.resolve(nuevo()),
        ]);
        const factor = config?.precio_factor === '1';
        const precios = factor && idProducto ? await requestProducto(`/ad_productopreciorango${suffix}/${encodeURIComponent(idProducto)}`) : [];
        if (!active) return;
        const rows = Array.isArray(precios) ? [...precios].sort((a, b) => Number(a.cant_min) - Number(b.cant_min)) : [];
        // Compatibilidad con la ruta antigua de clonado de un rango.
        if (cloneUnits) {
          const origen = rows.find(r => Number(r.unidades) === Number(cloneUnits));
          if (origen) { rows.push({ ...origen, unidades: '', cant_min: '', cant_max: '' }); setDirty(true); }
        }
        setProducto({ ...nuevo(), ...data, precio_venta: data.precio_venta ?? '0', porc_igv: data.porc_igv ?? '18' });
        setPorCantidad(factor); setUnidades(Array.isArray(unidadData) ? unidadData : []); setRangos(rows);
      } catch (e) { if (active) { setError(e.message); setLoadError(true); } }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [open, idProducto, id_anfitrion, documento_id, initialTab, cloneUnits]);

  const update = (field, value) => { setProducto(prev => ({ ...prev, [field]: value })); setDirty(true); };
  const close = () => {
    if (saving) return;
    if (!dirty || window.confirm('Tienes cambios sin guardar. ¿Deseas descartarlos?')) onClose();
  };
  const guardar = async () => {
    if (readOnly || loading || saving || loadError) return;
    if (!String(producto.id_producto).trim() || !String(producto.nombre).trim()) { setTab('datos'); setError('Completa el código y el nombre del producto.'); return; }
    if (porCantidad) {
      const issue = revisarRangos(rangos);
      if (issue) { setTab('precios'); setError(issue); return; }
    }
    setSaving(true); setError('');
    try {
      await requestProducto(`/ad_productomantenimiento${base}${idProducto ? `/${encodeURIComponent(idProducto)}` : ''}`, {
        method: idProducto ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ producto, ...(porCantidad ? { rangos } : {}) }),
      });
      setDirty(false); onSaved();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };
  const unitOptions = [{ value: '', label: 'Selecciona unidad' }, ...unidades.map(u => ({ value: u.codigo, label: `${u.codigo} · ${u.descripcion}` }))];
  if (producto.cont_und && !unitOptions.some(u => u.value === producto.cont_und)) unitOptions.push({ value: producto.cont_und, label: producto.cont_und });
  const input = (field, label, options = {}) => <ProductoField label={label} value={producto[field]} onChange={value => update(field, value)} readOnly={readOnly || saving} {...options} />;
  const content = <Box sx={{ display: 'flex', flexDirection: 'column', height: embedded ? 'auto' : '100%', minHeight: 0, color: palette.text, bgcolor: palette.bg }}>
    <Box sx={{ px: { xs: 1.5, sm: 2.5 }, py: 2, bgcolor: palette.surface, borderBottom: `1px solid ${palette.borderSoft}` }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
        <Box sx={{ width: 38, height: 38, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: palette.accentSoft, color: palette.accent }}><Package size={20} /></Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 18 }}>{idProducto ? (readOnly ? 'Consultar producto' : 'Editar producto') : 'Nuevo producto'}</Typography>
          <Typography noWrap sx={{ color: palette.muted, fontSize: 12, mt: 0.3 }}>{idProducto ? `${idProducto} · ${producto.nombre || 'Cargando…'}` : 'Datos del producto y configuración de precios'}</Typography>
        </Box>
        <IconButton aria-label="Cerrar producto" disabled={saving} onClick={close} sx={{ color: palette.muted }}><X size={19} /></IconButton>
      </Box>
      <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" allowScrollButtonsMobile sx={{ mt: 1, minHeight: 38, '& .MuiTab-root': { textTransform: 'none', fontSize: 12, fontWeight: 700, minHeight: 38, color: palette.muted }, '& .Mui-selected': { color: `${palette.accent} !important` }, '& .MuiTabs-indicator': { bgcolor: palette.accent } }}>
        <Tab value="datos" label="Datos generales" /><Tab value="precios" label="Precios" /><Tab value="inventario" label="Inventario y clasificación" />
      </Tabs>
    </Box>
    <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 1.5, sm: 2.5 } }}>
      {error && <Alert severity="error" sx={{ mb: 1.5 }} role="alert">{error}</Alert>}
      {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box> : !loadError && <>
        {tab === 'datos' && <ProductoSection title="Identificación del producto" description="Los datos principales que se muestran al buscar y vender el producto.">
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={4}>{input('id_producto', 'Código *', { maxLength: 15, readOnly: Boolean(idProducto) || readOnly || saving, icon: <Hash size={15} /> })}</Grid>
            <Grid item xs={12} sm={8}>{input('nombre', 'Nombre *', { maxLength: 100 })}</Grid>
            <Grid item xs={12}>{input('descripcion', 'Descripción', { maxLength: 300, multiline: true })}</Grid>
            <Grid item xs={12} sm={8}>{input('cont_und', 'Unidad de medida', { options: unitOptions })}</Grid>
            <Grid item xs={12} sm={4}>{input('porc_igv', 'IGV (%)', { type: 'number', min: 0, max: 100, step: '0.01' })}</Grid>
          </Grid>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 1.5 }}>
            {[['activado', 'Activo'], ['comercial', 'Disponible para venta'], ['almacenable', 'Control de almacén']].map(([field, label]) => <FormControlLabel key={field} sx={{ '& .MuiFormControlLabel-label': { fontSize: 12 } }} label={label}
              control={<Switch size="small" disabled={readOnly || saving} checked={Boolean(producto[field])} onChange={event => update(field, event.target.checked)} sx={{ '& .Mui-checked': { color: `${palette.accent} !important` }, '& .Mui-checked + .MuiSwitch-track': { bgcolor: `${palette.accent} !important` } }} />} />)}
          </Box>
        </ProductoSection>}
        {tab === 'precios' && (porCantidad ? <ProductoRangosEditor rangos={rangos} onChange={rows => { setRangos(rows); setDirty(true); }} readOnly={readOnly || saving} /> : <ProductoSection title="Precio de venta" description="Este cliente utiliza un precio único por producto.">
          <Box sx={{ maxWidth: 300 }}>{input('precio_venta', 'Precio por unidad (S/)', { type: 'number', min: 0, step: '0.01' })}</Box>
        </ProductoSection>)}
        {tab === 'inventario' && <>
          <ProductoSection title="Clasificación" description="Códigos de clase y subclase del catálogo.">
            <Grid container spacing={1.5}><Grid item xs={12} sm={6}>{input('id_clase', 'Clase', { maxLength: 10 })}</Grid><Grid item xs={12} sm={6}>{input('id_subclase', 'Subclase', { maxLength: 10 })}</Grid></Grid>
          </ProductoSection>
          <ProductoSection title="Transformación de unidades" description="Configura estos campos cuando el producto se transforma en otro producto o unidad.">
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={4}>{input('id_producto2', 'Producto de transformación', { maxLength: 15 })}</Grid>
              <Grid item xs={12} sm={4}>{input('cantidad_und2', 'Cantidad de transformación', { type: 'number', min: 0, step: 1 })}</Grid>
              <Grid item xs={12} sm={4}>{input('cont_und2', 'Unidad de transformación', { maxLength: 5 })}</Grid>
            </Grid>
          </ProductoSection>
        </>}
      </>}
    </Box>
    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 1, px: { xs: 1.5, sm: 2.5 }, py: 1.5, bgcolor: palette.surface, borderTop: `1px solid ${palette.borderSoft}`, position: embedded ? 'sticky' : 'static', bottom: 0 }}>
      <Typography sx={{ color: palette.muted, fontSize: 11.5 }}>{dirty ? 'Cambios sin guardar' : 'Cantidades enteras · precios decimales'}</Typography>
      <Box sx={{ display: 'flex', gap: 1 }}><AppButton onClick={close} disabled={saving}>Cerrar</AppButton>
        {!readOnly && <AppButton icon={saving ? <CircularProgress size={15} color="inherit" /> : <Save size={16} />} disabled={loading || saving || loadError} onClick={guardar} sx={primarySx}>{saving ? 'Guardando…' : 'Guardar cambios'}</AppButton>}
      </Box>
    </Box>
  </Box>;
  return embedded ? content : <Drawer anchor="right" open={open} onClose={close} PaperProps={{ sx: { width: { xs: '100%', md: 920 }, maxWidth: '100%', bgcolor: palette.bg, borderLeft: `1px solid ${palette.border}` } }}>{content}</Drawer>;
}
