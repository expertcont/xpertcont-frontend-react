# Contexto actual modulo ventas

Fecha de corte: 2026-08-28

## Resumen

El modulo de ventas se empezo a reorganizar desde archivos grandes ubicados directamente en:

```text
src/components/Admin/
```

hacia una carpeta de dominio:

```text
src/components/Admin/venta/
```

La intencion es seguir el mismo criterio usado en transporte/encomiendas: primero ordenar estructura y separar piezas evidentes sin cambiar comportamiento; despues mejorar UI con controles reutilizables y estilo mas moderno.

## Archivos principales actuales

Pantalla de listado:

```text
src/components/Admin/venta/list/AdminVentaList.js
```

Formulario de venta:

```text
src/components/Admin/venta/form/AdminVentaForm.js
```

Componentes extraidos del formulario:

```text
src/components/Admin/venta/form/AdminVentaProductoModal.jsx
src/components/Admin/venta/form/AdminVentaEmisionModal.jsx
src/components/Admin/venta/form/AdminVentaFormTables.jsx
```

Utilidad compartida de tema para `react-data-table-component`:

```text
src/components/Admin/venta/common/adminVentaTableTheme.js
```

Dialogos extraidos del listado:

```text
src/components/Admin/venta/list/AdminVentaCloneDialog.jsx
src/components/Admin/venta/list/AdminVentaRecaudacionDialog.jsx
```

## Imports actualizados

`App.js` ahora importa las pantallas desde:

```js
import AdminVentaList from "./components/Admin/venta/list/AdminVentaList";
import AdminVentaForm from "./components/Admin/venta/form/AdminVentaForm";
```

Las rutas React no cambiaron:

```text
/ad_venta/:id_anfitrion/:id_invitado/:periodo/:documento_id
/ad_venta/:id_anfitrion/:id_invitado/:periodo/:documento_id/new
/ad_venta/:id_anfitrion/:id_invitado/:periodo/:documento_id/:comprobante/:comprobante_ref
/ad_venta/:id_anfitrion/:id_invitado/:periodo/:documento_id/:comprobante/view
```

## Decisiones vigentes

- No se cambio comportamiento funcional.
- No se ejecuto `npm run build`.
- La validacion usada fue Babel con `BABEL_ENV=development`.
- Se mantuvieron nombres de componentes principales para no tocar rutas ni semantica de la pantalla.
- El tema `solarized` de DataTable se centralizo en `ensureAdminVentaTableTheme()`.
- `AdminVentaList.js` conserva la logica de carga, permisos, navegacion, eliminacion, clonacion y filtros.
- `AdminVentaForm.js` fue movido, conectado al tema compartido y se le extrajeron los modales visuales mas grandes.
- La logica de estado/API del formulario permanece en `AdminVentaForm.js` para reducir riesgo.

## Validacion realizada

Se validaron con Babel:

```text
src/App.js
src/components/Admin/venta/list/AdminVentaList.js
src/components/Admin/venta/list/AdminVentaCloneDialog.jsx
src/components/Admin/venta/list/AdminVentaRecaudacionDialog.jsx
src/components/Admin/venta/form/AdminVentaForm.js
src/components/Admin/venta/form/AdminVentaProductoModal.jsx
src/components/Admin/venta/form/AdminVentaEmisionModal.jsx
src/components/Admin/venta/common/adminVentaTableTheme.js
```

Resultado:

```text
OK
```

Aviso observado, no bloqueante:

```text
Browserslist: caniuse-lite is outdated
```

## Estado de refactor

### AdminVentaList

Estado: primera separacion aplicada.

Ya se extrajo:

- Dialogo de clonacion: `AdminVentaCloneDialog.jsx`.
- Dialogo de recaudacion: `AdminVentaRecaudacionDialog.jsx`.
- Tema compartido de DataTable.

Pendientes posibles:

- Extraer toolbar/filtros superiores.
- Extraer selector de periodo/contabilidad/dia.
- Extraer acciones de tabla si se decide limpiar columnas.
- Extraer utilidades puras de filtrado, sumatorias y formato cuando tengan usos claros.

### AdminVentaForm

Estado: primera separacion interna aplicada.

Responsabilidades detectadas:

- Cabecera de comprobante/venta.
- Detalle de productos.
- Modal/lista de productos.
- Modal de emision.
- Facturacion de pedidos/referencias.
- Tablas de detalle y referencias.
- Permisos de comandos.
- Generacion PDF/QR.
- Consultas de correntista, productos, series, motivos y comprobantes.

Ya se extrajo:

- `AdminVentaProductoModal.jsx`: contiene el `ListaPopUp` de productos y el dialogo `Producto - Item`.
- `AdminVentaEmisionModal.jsx`: contiene el dialogo `Datos - Emision`, selector de comprobante, serie, cliente, moneda, credito y pagos.
- `AdminVentaFormTables.jsx`: contiene las tablas de detalle y referencias con `react-data-table-component`.

## Modificacion de detalle venta

Se agrego un flujo de edicion parcial para detalles:

- En `AdminVentaForm.js`, las columnas `CANTIDAD` y `P.UNIT` muestran un icono `EditNoteIcon`.
- El icono carga el item en `AdminVentaProductoModal.jsx`, reutilizando el modal original de agregar producto.
- En modo modificacion se bloquea la busqueda/cambio de producto y solo se permite modificar cantidad, precio unitario o importe.
- El modal muestra el total actual y el total previo antes de guardar.
- Si cambia cantidad o precio unitario, se recalcula `precio_neto`.
- Si cambia importe, se recalcula `precio_unitario` segun cantidad.
- Al guardar, se llama al endpoint existente `PUT /ad_ventadet/:periodo/:id_anfitrion/:documento_id/:cod/:serie/:num/:elem/:item`.
- El backend actualiza directamente `mve_ventadet`, recalcula `monto_base`, `igv`, `tipo_igv_codigo` y luego llama a `public.fve_ventadet_rtotales(...)` para refrescar cabecera.

Pendientes recomendados:

1. Extraer cabecera/acciones superiores a componentes visuales.
2. Extraer helpers puros a `adminVentaFormUtils.js`.
3. Extraer generacion PDF/QR a `adminVentaFormPdf.js`.
4. Evaluar hooks solo despues de bajar mas el JSX principal.

No conviene separar hooks de logica todavia hasta que el JSX principal sea mas corto. Primero sacar bloques visuales, igual que se hizo con encomiendas.

## Siguiente paso recomendado

Continuar con `AdminVentaForm.js`, idealmente extrayendo la cabecera visual y acciones superiores. Despues de eso se puede empezar la mejora UI con controles usados en encomiendas.
