# Contexto actual modulo transporte

Fecha de corte: 2026-08-18

Actualizacion 2026-08-20:

- Se corrigio `xpertcont-backend-js/src/controllers/ventatrans.controllers.js`:
  - `obtenerVentaTrans` ya no referencia variables inexistentes (`id_ruta`, `id_punto_venta`, `id_punto_venta_dest`).
  - `actualizarVentaTrans` ahora valida `id_ruta` cuando se envia y vuelve a inferir `id_punto_venta` / `id_punto_venta_dest` desde `mve_transruta`.
- Se agrego `src/components/Admin/transporte/TransportesBoletoModal.js`.
- `TransportesBoletos` ya abre modal de captura de boleto mediante `TransportesModuloBase`.
- Para boletos, `TransportesModuloBase` carga rutas desde:

```text
GET /mve_transruta/:id_anfitrion/:documento_id?solo_pasaje=true
```

- Para encomiendas se mantiene:

```text
GET /mve_transruta/encomiendas/:id_anfitrion/:documento_id
```

- Validacion ejecutada:

```text
node --check src/controllers/ventatrans.controllers.js
node --check src/controllers/puntoventa.controllers.js
node --check src/controllers/transruta.controllers.js
```

- Se intento `npm run build` del frontend, pero el usuario indico detenerse porque el frontend ya esta desplegado. La compilacion quedo interrumpida por timeout, no por error reportado.

## Estado funcional

El modulo de transporte vive en:

```text
src/components/Admin/transporte
```

La carpeta anterior `tranportes` fue corregida a `transporte`.

## Tablas activas

### Venta / operacion

Tabla transaccional:

```text
mve_transventa
```

Reemplaza a `mve_ventatrans`.

La venta de transporte maneja:

- `tipo_operacion = E`: encomienda.
- `tipo_operacion = B`: boleto.

La tabla ya no usa:

```text
id_origen
id_destino
id_servicio
```

Ahora usa:

```text
id_ruta
```

`id_ruta` apunta al catalogo `mve_transruta`.

### Rutas

Tabla catalogo:

```text
mve_transruta
```

Campos base esperados:

```text
id_usuario
documento_id
id_ruta
id_punto_venta
id_punto_venta_dest
nombre
precio_pasaje
activo
ctrl_crea
ctrl_crea_us
ctrl_mod
ctrl_mod_us
```

Regla:

- Todas las rutas sirven para encomiendas.
- Para boletos se puede filtrar `precio_pasaje > 0`.
- El precio de la encomienda no sale de la ruta.

### Puntos de venta

Tabla catalogo:

```text
mad_punto_venta
```

Campos usados por el mantenimiento:

```text
id_usuario
documento_id
id_punto_venta
nombre
direccion
ubigeo
pais
activo
ctrl_crea
ctrl_crea_us
ctrl_mod
ctrl_mod_us
```

Si la tabla real tiene columnas distintas, ajustar primero el controller `puntoventa.controllers.js`.

## Backend implementado

Archivos:

```text
xpertcont-backend-js/src/controllers/ventatrans.controllers.js
xpertcont-backend-js/src/routes/ventatrans.routes.js
xpertcont-backend-js/src/controllers/puntoventa.controllers.js
xpertcont-backend-js/src/controllers/transruta.controllers.js
xpertcont-backend-js/src/routes/transporte.routes.js
xpertcont-backend-js/app.js
```

Endpoints venta transporte:

```text
GET    /mve_transventa/:periodo/:id_anfitrion/:documento_id/:dia
GET    /mve_transventa/:periodo/:id_anfitrion/:documento_id/:cod/:serie/:num/:elem
POST   /mve_transventa
PUT    /mve_transventa
DELETE /mve_transventa/:periodo/:id_anfitrion/:documento_id/:cod/:serie/:num/:elem
PUT    /mve_transventa/entrega
```

Endpoints puntos de venta:

```text
GET    /mad_punto_venta/:id_anfitrion/:documento_id
POST   /mad_punto_venta
PUT    /mad_punto_venta
DELETE /mad_punto_venta/:id_anfitrion/:documento_id/:id_punto_venta
```

Endpoints rutas:

```text
GET    /mve_transruta/encomiendas/:id_anfitrion/:documento_id
GET    /mve_transruta/:id_anfitrion/:documento_id
POST   /mve_transruta
PUT    /mve_transruta
DELETE /mve_transruta/:id_anfitrion/:documento_id/:id_ruta
```

## Frontend implementado

Archivos principales:

```text
src/components/Admin/transporte/TransportesEncomienda.js
src/components/Admin/transporte/TransportesEncomiendaModal.js
src/components/Admin/transporte/TransportesBoletos.js
src/components/Admin/transporte/puntosVenta/TransportesPuntosVentaList.js
src/components/Admin/transporte/rutas/TransportesRutasList.js
```

Rutas React:

```text
/ad_transportesencomienda/:id_anfitrion/:id_invitado/:periodo/:documento_id
/ad_transportesboletos/:id_anfitrion/:id_invitado/:periodo/:documento_id
/ad_transportepuntos/:id_anfitrion/:id_invitado/:periodo/:documento_id
/ad_transporterutas/:id_anfitrion/:id_invitado/:periodo/:documento_id
```

Sidebar:

- Se creo una pestaña propia `Transportes`.
- Accesos:
  - Encomiendas
  - Boletos
  - Puntos venta
  - Rutas

## Decisiones vigentes del formulario encomienda

- No se edita comprobante en el formulario.
- No se edita fecha en el formulario.
- La fecha viene del estado `diaSel` del modulo.
- `r_cod`, `r_serie`, `r_numero`, `elemento` son PK/control interno.
- En `POST /mve_transventa`, si no llega `r_numero`, el backend genera el siguiente correlativo.
- El modal captura `id_ruta` desde selector de rutas reales.
- La ruta se escoge con modal simple: muestra `id_ruta`, `nombre` y puntos internos.
- Al seleccionar una ruta, el draft guarda internamente:
  - `id_ruta`
  - `id_punto_venta`
  - `id_punto_venta_dest`
- El backend de `POST/PUT /mve_transventa` tambien infiere `id_punto_venta` y `id_punto_venta_dest` desde `mve_transruta` si solo llega `id_ruta`.
- `id_origen` e `id_destino` ya no existen en el contrato activo.
- `condicion_pago` usa valores:
  - `PAGADO`
  - `POR_COBRAR`
- `llegada_aprox` se guarda en su campo real, no en `estado_sunat`.

## Validaciones realizadas

Se validaron:

```text
node --check
Babel transform con preset react-app
React dev server: Compiled successfully
```

## Pendientes recomendados

1. Confirmar la estructura real de `mad_punto_venta` en la base de datos.
2. Probar CRUD real de puntos de venta.
3. Probar CRUD real de rutas.
4. Crear una ruta y verificar que aparece en el selector de encomiendas.
5. Registrar una encomienda con `id_ruta`.
6. Si se requiere mostrar nombre de ruta en listados de `mve_transventa`, enriquecer el `GET /mve_transventa` con join a `mve_transruta`.
