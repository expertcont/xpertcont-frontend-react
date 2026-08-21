# Contexto frontend - Presupuestos de venta

> Guia backend principal: `D:\Developer\ovivasar\XpertcontProyecto\xpertcont-backend-js\docs\presupuestos-contexto-backend.md`.
>
> Guia fullstack: `D:\Developer\ovivasar\XpertcontProyecto\xpertcont-backend-js\docs\presupuestos-fullstack-flujo.md`.

## Objetivo

Modulo React para gestionar presupuestos de venta orientados a servicios, fabricacion, instalacion y paneles publicitarios.

El presupuesto no es una factura. Es un documento interno `NV` que puede generar despues una factura o boleta comercial real.

```text
Presupuesto:
mve_venta NV
  -> mve_ventaserv
      -> mve_ventaservdet

Factura/boleta generada:
mve_venta 01/03
  -> mve_ventadet
```

## Rutas React

```text
/ad_ventapresupuesto/:id_anfitrion/:id_invitado/:periodo/:documento_id
/ad_ventapresupuesto/:id_anfitrion/:id_invitado/:periodo/:documento_id/new
/ad_ventapresupuesto/:id_anfitrion/:id_invitado/:periodo/:documento_id/:comprobante/edit
/ad_ventapresupuesto/:id_anfitrion/:id_invitado/:periodo/:documento_id/:comprobante/view
```

## Archivos principales

```text
AdminVentaPresupuestoList.js
AdminVentaPresupuestoNuevoForm.js
AdminVentaPresupuestoPdf.js
AdminVentaPresupuestoDemoData.js
modals/TrabajoFormModal.js
modals/TrabajoInfoModal.js
modals/ProductoSelectorModal.js
modals/ClonarTrabajoModal.js
```

## Estado documental

- `r_cod = 'NV'`.
- `r_serie = '0001'`.
- `elemento = 1`.
- `estado = 'P'`: pendiente.
- `estado = 'C'`: cerrado.
- Si el presupuesto ya genero comprobante, backend marca `fact_cod`, `fact_serie`, `fact_num` en `mve_venta`.

## Estado backend vigente

- Endpoint disponible: `POST /ad_presupuesto/comprobante`.
- Controller: `generarComprobantePresupuesto()` en `xpertcont-backend-js/src/controllers/presupuesto.controllers.js`.
- Ruta: `xpertcont-backend-js/src/routes/presupuesto.routes.js`.
- Funcion PSQL: `fve_presupuesto_generar_comprobante(...)`.
- SQL fuente: `xpertcont-backend-js/docs/sql/fve_presupuesto_generar_comprobante.sql`.
- La funcion PSQL no usa `fve_crear_comprobante`, porque esa funcion cambia la PK del documento origen.
- La funcion crea una cabecera nueva `01/03` en `mve_venta`, inserta detalles en `mve_ventadet` desde `mve_ventaserv`, y deja intacto el `NV`.

## Estructura de datos BD

Presupuesto:

```text
mve_venta NV
PK: id_usuario, documento_id, periodo, r_cod, r_serie, r_numero, elemento
Campos frontend clave: r_fecemi, r_fecvcto, r_id_doc, r_documento_id,
r_razon_social, r_direccion, glosa, contacto_nombre, contacto_celular,
r_moneda, r_tc, r_forma_pago_id, estado, fact_cod, fact_serie, fact_num,
r_base002, r_igv002, r_monto_total.
```

Trabajos:

```text
mve_ventaserv
PK: id_usuario, documento_id, periodo, r_cod, r_serie, r_numero, elemento, servicio
Campos frontend clave: servicio, id_producto, descripcion, especificacion,
cont_und, cantidad, precio_unitario, precio_neto, porc_igv,
r_base002, r_igv002, r_monto_total, r_moneda, registrado, utilidad.
```

Recursos:

```text
mve_ventaservdet
PK: id_usuario, documento_id, periodo, r_cod, r_serie, r_numero, elemento, servicio, item
Campos frontend clave: item, id_producto, descripcion, cont_und,
cantidad, precio_unitario, precio_neto, porc_igv, tipo_igv_codigo,
largo, ancho, utilidad, horas, dias, registrado.
```

Comprobante generado:

```text
mve_venta 01/03
  -> mve_ventadet
```

`mve_ventadet` recibe una linea por cada trabajo de `mve_ventaserv`.

## Pantalla listado

Archivo:

```text
AdminVentaPresupuestoList.js
```

Backend:

```text
GET /ad_presupuesto/:periodo/:id_anfitrion/:documento_id/:dia
POST /ad_presupuesto
DELETE /ad_presupuesto/:periodo/:id_anfitrion/:documento_id/:cod/:serie/:num/:elem
GET /ad_presupuesto/full/:periodo/:id_anfitrion/:documento_id/:cod/:serie/:num/:elem
POST /ad_presupuestoserv/clonar
```

La lista debe mostrar:

- Numero `NV-0001-r_numero`.
- Fecha.
- Cliente.
- Estado.
- Moneda.
- Total.
- Cantidad de trabajos.
- Acciones: ver, editar, PDF, eliminar si esta pendiente, clonar trabajos, generar comprobante cuando aplique.

## Pantalla formulario

Archivo:

```text
AdminVentaPresupuestoNuevoForm.js
```

Carga:

```text
GET /ad_presupuesto/full/:periodo/:id_anfitrion/:documento_id/NV/0001/:r_numero/1
```

Guarda cabecera:

```text
PUT /ad_presupuesto
```

Cabecera editable:

- Fecha.
- Moneda.
- Forma de pago.
- Documento cliente.
- Razon social.
- Direccion.
- Contacto.
- Celular.
- Campania/glosa.

Busqueda de cliente:

```text
POST /correntistagenera
```

## Trabajos

Cada trabajo del formulario se alinea con `mve_ventaserv`.

Campos importantes:

- `servicio`: correlativo backend.
- `descripcion`: nombre corto visible.
- `especificacion`: descripcion larga.
- `cont_und`: unidad.
- `cantidad`.
- `r_monto_total`: total comercial del trabajo con IGV.
- `r_moneda`.
- `utilidad`: margen/porcentaje del trabajo.

Endpoints:

```text
POST /ad_presupuestoserv
PUT  /ad_presupuestoserv
DELETE /ad_presupuestoserv/:periodo/:id_anfitrion/:documento_id/:cod/:serie/:num/:elem/:servicio
```

Regla: los trabajos son las lineas visibles que luego se convierten a `mve_ventadet`.

## Recursos internos

Cada recurso se alinea con `mve_ventaservdet`.

Tipos usados en UI:

- `MATERIAL`.
- `OPERARIO`.
- `SERVICIO`.
- `VIATICO`.
- `TERCERIZACION`.

Campos de costeo:

- Material: cantidad x costo unitario.
- Operario: horas/dias x costo hora.
- Servicio: largo x ancho x cantidad x costo m2.

Endpoints:

```text
GET    /ad_presupuestoservdet/:periodo/:id_anfitrion/:documento_id/:cod/:serie/:num/:elem/:servicio
POST   /ad_presupuestoservdet
PUT    /ad_presupuestoservdet/:periodo/:id_anfitrion/:documento_id/:cod/:serie/:num/:elem/:servicio/:item
DELETE /ad_presupuestoservdet/:periodo/:id_anfitrion/:documento_id/:cod/:serie/:num/:elem/:servicio/:item
```

Regla: estos recursos son internos. No se facturan como items cuando se genera CPE.

## Catalogo de recursos

Origen:

```text
GET /ad_productopopupalmacen/:id_anfitrion/:documento_id
```

El API devuelve `codigo`, `descripcion` y `auxiliar`.

`auxiliar` se interpreta como:

```text
precio_compra-cont_und-porc_igv-id_anfitrion-documento_id
```

Si el endpoint no trae tipo, el frontend infiere:

- Contiene `OPERARIO`: `OPERARIO`.
- Contiene `SERVICIO`, `IMPRESION`, `CORTE`, `ANDAMIO` o `GRUA`: `SERVICIO`.
- Resto: `MATERIAL`.

## Generar factura o boleta desde presupuesto

El boton frontend debe llamar:

```text
POST /ad_presupuesto/comprobante
```

Payload recomendado:

```json
{
  "id_anfitrion": "usuario propietario",
  "documento_id": "ruc empresa",
  "periodo": "2026-08",
  "id_invitado": "usuario operativo",
  "fecha": "2026-08-13",
  "origen": {
    "r_cod": "NV",
    "r_serie": "0001",
    "r_numero": "0000003",
    "elemento": 1
  },
  "destino": {
    "r_cod_emitir": "01",
    "r_serie_emitir": "F001"
  },
  "cliente": {
    "r_id_doc": "6",
    "r_documento_id": "20600000000",
    "r_razon_social": "CLIENTE SAC",
    "r_direccion": "Direccion"
  },
  "pago": {
    "r_moneda": "PEN",
    "r_forma_pago_id": "Contado",
    "dias_credito": 0,
    "efectivo": 118,
    "vuelto": 0,
    "forma_pago2": null,
    "efectivo2": 0
  }
}
```

Respuesta:

```json
{
  "success": true,
  "r_cod": "01",
  "r_serie": "F001",
  "r_numero": "0000001",
  "elemento": 1,
  "r_fecemi": "2026-08-13",
  "r_monto_total": "118.00"
}
```

Despues de generar, navegar al comprobante comercial:

```text
/ad_venta/:id_anfitrion/:id_invitado/:periodo/:documento_id/:r_cod-:r_serie-:r_numero-:elemento/view
```

Luego el envio SUNAT usa `AdminSunatIcon` desde el documento comercial, no desde el presupuesto.

Secuencia esperada en frontend:

1. Abrir modal de emision desde presupuesto.
2. Elegir tipo `01` factura o `03` boleta.
3. Elegir serie autorizada, por ejemplo `F001` o `B001`.
4. Confirmar fecha, forma de pago, efectivo y datos cliente.
5. Llamar `POST /ad_presupuesto/comprobante`.
6. Si responde `success`, navegar a `/ad_venta/.../:r_cod-:r_serie-:r_numero-:elemento/view`.
7. Desde ese documento comercial, usar `AdminSunatIcon` para envio SUNAT.

## Regla tributaria confirmada

En una factura comercial real:

```text
mve_ventadet.precio_neto = total de linea con IGV
mve_ventadet.monto_base  = base unitaria sin IGV
mve_ventadet.igv         = IGV unitario
```

Ejemplo real:

```text
cantidad        = 30
precio_unitario = 4.33
precio_neto     = 129.80
monto_base      = 3.666667
igv             = 0.66
```

Por eso, cuando `mve_ventaserv` se convierte en `mve_ventadet`, el total del trabajo debe entrar como `precio_neto`.

## PDFs

`AdminVentaPresupuestoPdf.js` genera:

- PDF interno: puede mostrar recursos y costeo.
- PDF cliente: no debe mostrar recursos internos ni costos.

## Pendientes frontend

- Crear modal de emision para elegir factura/boleta, serie, fecha y forma de pago.
- Conectar boton `Generar CPE` a `POST /ad_presupuesto/comprobante`.
- Navegar al comprobante generado.
- Mostrar si un presupuesto ya tiene `fact_cod/fact_serie/fact_num`.
- Restringir eliminar/editar segun `estado` y comprobante generado.

## Handoff inmediato para UI

Antes de implementar UI, confirmar que backend responde bien con:

```text
POST /ad_presupuesto/comprobante
```

Cuando este OK, implementar en este orden:

```text
1. Agregar modal de emision en AdminVentaPresupuestoNuevoForm.js o componente modal separado.
2. Permitir elegir tipo de comprobante: 01 Factura, 03 Boleta.
3. Cargar/elegir serie autorizada. Referencia ventas: /ad_ventaseries/:id_anfitrion/:documento_id/:id_invitado/:r_cod
4. Confirmar fecha, pago y cliente.
5. Llamar POST /ad_presupuesto/comprobante.
6. Navegar a /ad_venta/:id_anfitrion/:id_invitado/:periodo/:documento_id/:r_cod-:r_serie-:r_numero-:elemento/view
7. Desde la venta generada, usar AdminSunatIcon.
```

Payload minimo esperado desde UI:

```json
{
  "id_anfitrion": "usuario propietario",
  "documento_id": "ruc empresa",
  "periodo": "2026-08",
  "id_invitado": "usuario operativo",
  "fecha": "2026-08-13",
  "origen": {
    "r_cod": "NV",
    "r_serie": "0001",
    "r_numero": "NUMERO_NV",
    "elemento": 1
  },
  "destino": {
    "r_cod_emitir": "01",
    "r_serie_emitir": "F001"
  },
  "pago": {
    "r_moneda": "PEN",
    "r_forma_pago_id": "Contado",
    "dias_credito": 0,
    "efectivo": null,
    "vuelto": 0,
    "forma_pago2": null,
    "efectivo2": 0
  },
  "id_producto": "0000",
  "cont_und_default": "ZZ"
}
```

Regla UI:

- No llamar `AdminSunatIcon` directamente desde el presupuesto `NV`.
- Primero generar el comprobante comercial y navegar a ventas.
