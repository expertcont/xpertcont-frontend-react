# Modulo Producto

Esta carpeta agrupa las pantallas y piezas reutilizables del mantenimiento de productos.

## Archivos

- `AdminProductoList.js`: listado principal del catalogo. Permite alternar entre productos y rangos de precios, filtrar, importar Excel, descargar plantilla, clonar y eliminar.
- `AdminProductoListHeader.jsx`: cabecera visual del listado y selector `Productos / Rango de Precios`.
- `AdminProductoToolbar.jsx`: acciones superiores del listado, importacion Excel y filtro rapido.
- `AdminProductoTable.jsx`: tabla del catalogo con tema oscuro, paginacion y hover de lectura.
- `AdminProductoCloneDialog.jsx`: dialogo para clonar productos base.
- `AdminProductoForm.js`: formulario de alta y edicion de productos base.
- `AdminProductoFormPrecio.js`: formulario para editar o clonar rangos de precios por producto y unidad.
- `AdminFileProducto.js`: componente reutilizable para seleccionar e importar archivos Excel hacia los endpoints de productos o precios.

## Rutas principales

- `/ad_producto/:id_anfitrion/:id_invitado/:documento_id`
- `/ad_producto/:id_anfitrion/:id_invitado/:documento_id/new`
- `/ad_producto/:id_anfitrion/:id_invitado/:documento_id/:id_producto/edit`
- `/ad_productoprecio/:id_anfitrion/:id_invitado/:documento_id/:id_producto/:unidades/:accion`

## Notas de mantenimiento

- `AdminProductoList.js` usa `theme/palette.js` para mantener la apariencia alineada con el redisenio general.
- La pantalla principal mantiene datos, permisos, navegacion y llamadas API; los componentes `.jsx` concentran presentacion.
- `AdminFileProducto.js` tambien se reutiliza desde `AdminCertificadoList.js`; si cambia su interfaz de props, revisar ambas pantallas.
- Las rutas publicas no cambiaron. Solo se reorganizo la ubicacion fisica de los componentes.
