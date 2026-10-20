# Modulo Producto

Esta carpeta agrupa las pantallas y piezas reutilizables del mantenimiento de productos.

## Gestión integrada de productos

`AdminProductoList.js` abre `AdminProductoCatalogo.jsx`: catálogo con búsqueda por código/nombre, filtros de estado/clase/subclase y editor lateral. Conserva las rutas públicas de los formularios, importación, exportación y clonado.

El estilo sigue los mantenimientos de transporte (por ejemplo `TrZonaList`): paleta compartida, etiquetas superiores, campos compactos, iconos Lucide y acciones `AppButton`.

- `ProductoEditor.jsx`: editor compartido para el panel y las rutas de mantenimiento, con datos, precios y clasificación/transformación.
- `ProductoFields.jsx`: campos y superficies del mantenimiento.
- `ProductoRangosEditor.jsx`: tabla editable y simulador de cantidades enteras.
- `productoMantenimiento.js`: peticiones, presentación monetaria y validación de rangos.

Con `precio_factor = '1'` se muestran rangos; en otro caso se edita el precio único del producto. Los rangos deben comenzar en 1, ser consecutivos, tener referencias únicas y conservar una referencia de una unidad (requerida por el selector de ventas actual). El precio por unidad conserva su precisión de cálculo y el simulador presenta el importe con dos decimales.

El backend incorpora `POST /ad_productomantenimiento/:id_anfitrion/:documento_id` y `PUT /ad_productomantenimiento/:id_anfitrion/:documento_id/:id_producto`. Valida y guarda el producto y sus rangos en una sola transacción. Requiere desplegar ambos proyectos para utilizar este guardado; no requiere modificar las tablas.

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
