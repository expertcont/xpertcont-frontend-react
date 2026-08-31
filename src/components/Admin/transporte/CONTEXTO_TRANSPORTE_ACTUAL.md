# Contexto actual modulo transporte

Fecha de corte: 2026-08-22

## Resumen actual

El modulo transporte esta repartido entre:

```text
xpertcont-backend-js
xpertcont-frontend-react
```

El frontend no se esta desplegando desde Codex. El usuario despliega manualmente. Evitar `npm run build` salvo que el usuario lo pida.

Backend publicado a `origin/master`:

```text
e25d854 Add point-of-sale user shift endpoints
b9ec15a Align point-of-sale endpoint schema
```

## Cambios recientes 2026-08-21

- Menu:
  - `Puntos venta` ahora aparece como opcion global para todos los rubros cuando hay `accesoAdmin`.
  - `Usuarios turnos` ahora aparece como opcion global para todos los rubros cuando hay `accesoAdmin`.
  - `Puntos venta` se retiro del submenu exclusivo `Transportes` para evitar duplicado.
  - `Usuarios turnos` apunta a:

```text
/ad_puntoventausuario/:id_anfitrion/:id_invitado
```

- Backend:
  - `/usuario/estudios/:id_usuario` ahora devuelve el campo:

```text
super
```

  para que el flujo de bienvenida propague si el usuario logueado es supervisor/moderador del SaaS.

  - El acceso operativo a agencias/puntos para encomiendas sigue esta prioridad:

```text
1. super = 1 en mad_usuario para id_invitado -> acceso a todos los puntos activos de la empresa seleccionada.
2. id_anfitrion = id_invitado -> acceso a todos los puntos activos de la empresa seleccionada.
3. invitado convencional -> acceso segun mad_punto_venta_usuario y turnos vigentes.
```

  - Se agrego CRUD real para `mad_punto_venta_usuario`, alineado a la PK completa:

```text
id_usuario + documento_id + id_punto_venta + id_invitado
```

  - El endpoint operativo de puntos asignados por turno:

```text
GET /mad_punto_venta_usuario/:id_anfitrion/:documento_id/:id_invitado
```

  devuelve:
  - todos los puntos activos de `mad_punto_venta` si el usuario tiene una asignacion activa con `sin_restriccion = true`;
  - solo el punto asignado si esta dentro de algun turno activo;
  - nada si no hay acceso vigente.

  - `mad_punto_venta` se alineo a la estructura real:

```text
id_usuario
documento_id
id_punto_venta
nombre
direccion
id_ubigeo
id_pais
telefono
activo
ctrl_crea
ctrl_crea_us
ctrl_mod
ctrl_mod_us
serie
```

  - El backend mantiene alias de salida `ubigeo` y `pais` para compatibilidad con frontend:

```sql
id_ubigeo AS ubigeo
id_pais AS pais
```

  - `mad_punto_venta_usuario` ahora espera/retorna `nombres`, pero la BD necesita esta migracion antes de desplegar ese cambio:

```sql
ALTER TABLE public.mad_punto_venta_usuario
ADD COLUMN nombres VARCHAR(150);
```

  - `GET /mve_transventa` y `GET /mve_transventa` individual ahora enriquecen la respuesta con:

```text
nombre_ruta
```

  mediante join a `mve_transruta`, para que los listados puedan mostrar el nombre de la ruta y no solo `id_ruta`.

- Frontend:
  - `BienvenidaXpert` propaga `super` junto con:

```text
id_anfitrion
id_invitado
rubro
```

  - `index.js` guarda `super` en estado y `sessionStorage`.
  - `App.js` recibe `super` y lo pasa a `NavSideBar`.
  - Los mantenimientos administrativos globales fueron renombrados:

```text
AdminUsuariosGrupoList.js -> AdminPuntoVentaUsuarioList.js
AdminUsuariosGrupoForm.js -> AdminPuntoVentaUsuarioForm.js
transporte/puntosVenta/TrPuntoVentaList.js -> AdminPuntoVentaList.js
```

  - `AdminPuntoVentaList` ya no vive en la carpeta `transporte`, porque `mad_punto_venta` es un mantenimiento administrativo compartido.
  - Las rutas nuevas son:

```text
/ad_puntoventa/:id_anfitrion/:id_invitado/:periodo/:documento_id
/ad_puntoventausuario/:id_anfitrion/:id_invitado
/ad_puntoventausuario/:id_anfitrion/:id_invitado/new
/ad_puntoventausuario/:id_anfitrion/:id_invitado/:documento_id/:id_punto_venta/:id_invitado_grupo/edit
```

  - Se dejaron aliases antiguos en `App.js` para no romper enlaces guardados:

```text
/ad_transportepuntos/...
/ad_usuariogrupo/...
```

  - En transporte la interfaz muestra `Agencias`; en comercial/proyectos conserva `Puntos de Venta`.
  - `AdminPuntoVentaUsuarioList` ya no usa JSON de ejemplo.
  - `AdminPuntoVentaUsuarioList` consume:

```text
GET /mad_punto_venta_usuario/:id_anfitrion/:documento_id
```

  - Lista usuarios por punto de venta con:
    - nombre del usuario (`nombres`)
    - correo (`id_invitado`)
    - punto de venta con nombre (`punto_venta_nombre`)
    - activo
    - libre/turno
    - turno 1/2/3
    - fecha alta
  - Los chips `Activo/Libre` se suavizaron para que no sean chillones.
  - `AdminPuntoVentaUsuarioForm` fue redisenado con estilo oscuro similar al modulo transporte, pero menos comprimido que encomiendas.
  - El formulario carga puntos directos desde:

```text
GET /mad_punto_venta/:id_anfitrion/:documento_id
```

  - En edicion, el select de punto de venta usa el `documento_id` de la URL y agrega fallback si la opcion tarda en cargar.
  - El endpoint individual hace join a `mad_punto_venta` para devolver `punto_venta_nombre`.
  - El formulario conserva `punto_venta_nombre` como fallback visual.
  - El campo `Nombres`:
    - es editable manualmente;
    - se autocompleta con `user.name` de Auth0/Google solo cuando `id_invitado` coincide con `user.email` logueado.
  - Los campos de hora usan `TimeStepper`:
    - input `type=time`;
    - botones `+` y `-` pegados a la derecha;
    - incremento/decremento de 15 minutos;
    - si esta vacio, inicia desde `08:00`.
  - En encomiendas, el DNI/RUC del remitente ahora tiene busqueda con lupa usando el mismo API de `AdminVentaForm.js`:

```text
POST /correntistagenera
body: { ruc }
```

  - La respuesta completa `cliente`, `id_documento` y `remitente_direccion` desde `nombre_o_razon_social`, `r_id_doc` y `direccion_completa`.
  - El DNI del destinatario tambien tiene busqueda con lupa y atajo `+`; completa `destinatario` desde `nombre_o_razon_social`.
  - En el campo `Ruta`, la tecla `+` abre el buscador de rutas. Dentro del modal, Enter selecciona la primera ruta filtrada.
  - En el campo `Placa`, la tecla `+` o el icono de camion abre el buscador de `mve_transplaca`. Dentro del modal, Enter selecciona la primera placa filtrada.
  - En el campo `Chofer / licencia`, la tecla `+` o el icono de usuario abre el buscador de `mve_translicencia`. Dentro del modal, Enter selecciona la primera licencia filtrada.
  - El orden visual del formulario de encomiendas ahora es:

```text
1. Origen y remitente
2. Destino y destinatario
3. Encomienda, pago y unidad
```

  - El origen se toma automaticamente del punto de venta operativo seleccionado antes de crear la encomienda.
  - El destino se escoge desde el catalogo de rutas; visualmente reemplaza al campo Ruta, pero internamente mantiene `id_ruta`, `id_punto_venta` e `id_punto_venta_dest` para el backend.
  - La zona del remitente se filtra por `id_punto_venta`; la zona del destinatario se filtra por `id_punto_venta_dest`.

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

Reglas:

- Todas las rutas sirven para encomiendas.
- Para boletos se puede filtrar `precio_pasaje > 0`.
- El precio de la encomienda no sale de la ruta.

### Placas

Tabla catalogo:

```text
mve_transplaca
```

Estructura compartida por el usuario:

```sql
CREATE TABLE public.mve_transplaca (
  id_usuario VARCHAR(50) NOT NULL,
  documento_id VARCHAR(20) NOT NULL,
  placa VARCHAR(50) NOT NULL,
  marca VARCHAR(50),
  certificado VARCHAR(50),
  CONSTRAINT mve_transplaca_pkey PRIMARY KEY(id_usuario, documento_id, placa)
);
```

### Licencias

Tabla catalogo:

```text
mve_translicencia
```

Estructura compartida por el usuario:

```sql
CREATE TABLE public.mve_translicencia (
  id_usuario VARCHAR(50) NOT NULL,
  documento_id VARCHAR(20) NOT NULL,
  licencia VARCHAR(50) NOT NULL,
  nombre VARCHAR(50),
  dni VARCHAR(50),
  descripcion VARCHAR(100),
  CONSTRAINT mve_translicencia_pkey PRIMARY KEY(id_usuario, documento_id, licencia)
);
```

### Zonas

Tabla catalogo:

```text
mve_transzona
```

Estructura compartida por el usuario:

```sql
CREATE TABLE public.mve_transzona (
  id_usuario VARCHAR(50) NOT NULL,
  documento_id VARCHAR(20) NOT NULL,
  id_punto_venta VARCHAR(20) NOT NULL,
  id_zona VARCHAR(15) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion VARCHAR(100) NOT NULL,
  CONSTRAINT mve_transzona_pkey PRIMARY KEY(id_usuario, documento_id, id_punto_venta, id_zona)
);
```

Reglas:

- El formulario de zonas usa select de punto de venta.
- El select debe cargar todos los puntos de venta sin excluir inactivos, porque es gestion general de zonas.

### Puntos de venta

Tabla catalogo:

```text
mad_punto_venta
```

Estructura real compartida por el usuario:

```sql
CREATE TABLE public.mad_punto_venta (
  id_usuario VARCHAR(50) NOT NULL,
  documento_id VARCHAR(20) NOT NULL,
  id_punto_venta VARCHAR(10) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  direccion VARCHAR(150),
  id_ubigeo VARCHAR(6),
  id_pais VARCHAR(6),
  telefono VARCHAR(20),
  activo BOOLEAN DEFAULT true NOT NULL,
  ctrl_crea TIMESTAMP(5) WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ctrl_crea_us VARCHAR(50),
  ctrl_mod TIMESTAMP(5) WITHOUT TIME ZONE,
  ctrl_mod_us VARCHAR(50),
  serie VARCHAR(5),
  CONSTRAINT mad_punto_venta_pkey PRIMARY KEY(id_usuario, documento_id, id_punto_venta)
);
```

### Usuarios por punto de venta y turno

Tabla:

```text
mad_punto_venta_usuario
```

Estructura real compartida por el usuario:

```sql
CREATE TABLE public.mad_punto_venta_usuario (
  id_usuario VARCHAR(50) NOT NULL,
  documento_id VARCHAR(20) NOT NULL,
  id_punto_venta VARCHAR(10) NOT NULL,
  id_invitado VARCHAR(50) NOT NULL,
  fecha_ingreso TIMESTAMP(5) WITHOUT TIME ZONE,
  activo BOOLEAN DEFAULT true,
  sin_restriccion BOOLEAN DEFAULT false,
  turno1_inicio TIME WITHOUT TIME ZONE,
  turno1_fin TIME WITHOUT TIME ZONE,
  turno2_inicio TIME WITHOUT TIME ZONE,
  turno2_fin TIME WITHOUT TIME ZONE,
  turno3_inicio TIME WITHOUT TIME ZONE,
  turno3_fin TIME WITHOUT TIME ZONE,
  ultimo_login TIMESTAMP WITHOUT TIME ZONE,
  CONSTRAINT mad_usuariogrupo_pkey PRIMARY KEY(id_usuario, documento_id, id_punto_venta, id_invitado)
);
```

Pendiente de aplicar para nombres:

```sql
ALTER TABLE public.mad_punto_venta_usuario
ADD COLUMN nombres VARCHAR(150);
```

## Backend implementado

Archivos:

```text
xpertcont-backend-js/src/controllers/ventatrans.controllers.js
xpertcont-backend-js/src/routes/ventatrans.routes.js
xpertcont-backend-js/src/controllers/puntoventa.controllers.js
xpertcont-backend-js/src/controllers/transruta.controllers.js
xpertcont-backend-js/src/controllers/transplaca.controllers.js
xpertcont-backend-js/src/controllers/translicencia.controllers.js
xpertcont-backend-js/src/controllers/transzona.controllers.js
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

Endpoints usuarios por punto de venta:

```text
GET    /mad_punto_venta_usuario/:id_anfitrion/:documento_id
GET    /mad_punto_venta_usuario/:id_anfitrion/:documento_id/:id_punto_venta/:id_invitado
GET    /mad_punto_venta_usuario/:id_anfitrion/:documento_id/:id_invitado
POST   /mad_punto_venta_usuario
PUT    /mad_punto_venta_usuario
DELETE /mad_punto_venta_usuario/:id_anfitrion/:documento_id/:id_punto_venta/:id_invitado
```

Endpoints rutas:

```text
GET    /mve_transruta/encomiendas/:id_anfitrion/:documento_id
GET    /mve_transruta/:id_anfitrion/:documento_id
POST   /mve_transruta
PUT    /mve_transruta
DELETE /mve_transruta/:id_anfitrion/:documento_id/:id_ruta
```

Endpoints placas:

```text
GET    /mve_transplaca/:id_anfitrion/:documento_id
POST   /mve_transplaca
PUT    /mve_transplaca
DELETE /mve_transplaca/:id_anfitrion/:documento_id/:placa
```

Endpoints licencias:

```text
GET    /mve_translicencia/:id_anfitrion/:documento_id
POST   /mve_translicencia
PUT    /mve_translicencia
DELETE /mve_translicencia/:id_anfitrion/:documento_id/:licencia
```

Endpoints zonas:

```text
GET    /mve_transzona/:id_anfitrion/:documento_id
POST   /mve_transzona
PUT    /mve_transzona
DELETE /mve_transzona/:id_anfitrion/:documento_id/:id_punto_venta/:id_zona
```

## Frontend implementado

Archivos principales:

```text
src/components/Admin/transporte/encomienda/TrEncomiendaList.js
src/components/Admin/transporte/encomienda/modal/TrEncomiendaModal.js
src/components/Admin/transporte/encomienda/modal/TrEncomiendaTicketPdf.js
src/components/Admin/transporte/common/TrModuloBase.jsx
src/components/Admin/transporte/common/components/TrHeader.jsx
src/components/Admin/transporte/common/components/TrFiltros.jsx
src/components/Admin/transporte/common/components/TrOperacionRow.jsx
src/components/Admin/transporte/common/hooks/useTrCatalogos.js
src/components/Admin/transporte/common/hooks/useTrOperaciones.js
src/components/Admin/transporte/common/utils/trUtils.js
src/components/Admin/transporte/TrBoletosList.js
src/components/Admin/transporte/TrBoletoModal.js
src/components/Admin/AdminPuntoVentaList.js
src/components/Admin/transporte/TrRutaList.js
src/components/Admin/transporte/TrPlacaList.js
src/components/Admin/transporte/TrLicenciaList.js
src/components/Admin/transporte/TrZonaList.js
src/components/Admin/AdminPuntoVentaUsuarioList.js
src/components/Admin/AdminPuntoVentaUsuarioForm.js
src/components/NavSideBar.js
src/App.js
```

Rutas React transporte:

```text
/ad_transportesencomienda/:id_anfitrion/:id_invitado/:periodo/:documento_id
/ad_transportesboletos/:id_anfitrion/:id_invitado/:periodo/:documento_id
/ad_puntoventa/:id_anfitrion/:id_invitado/:periodo/:documento_id
/ad_transporterutas/:id_anfitrion/:id_invitado/:periodo/:documento_id
/ad_transporteplacas/:id_anfitrion/:id_invitado/:periodo/:documento_id
/ad_transportelicencias/:id_anfitrion/:id_invitado/:periodo/:documento_id
/ad_transportezonas/:id_anfitrion/:id_invitado/:periodo/:documento_id
```

Rutas React usuarios turnos:

```text
/ad_puntoventausuario/:id_anfitrion/:id_invitado
/ad_puntoventausuario/:id_anfitrion/:id_invitado/new
/ad_puntoventausuario/:id_anfitrion/:id_invitado/:documento_id/:id_punto_venta/:id_invitado_grupo/edit
```

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

Backend:

```text
node --check src/controllers/ventatrans.controllers.js
node --check src/controllers/puntoventa.controllers.js
node --check src/controllers/transruta.controllers.js
node --check src/routes/transporte.routes.js
```

Frontend:

```text
BABEL_ENV=development babel transform con preset react-app
```

Archivos validados recientemente:

```text
src/components/Admin/AdminPuntoVentaUsuarioForm.js
src/components/Admin/AdminPuntoVentaUsuarioList.js
src/components/Admin/AdminPuntoVentaList.js
src/App.js
src/components/NavSideBar.js
```

No se ejecuto build frontend por indicacion del usuario.

## Pendientes recomendados

1. Aplicar migracion `nombres` en `mad_punto_venta_usuario` antes de desplegar backend que lea/escriba ese campo.
2. Probar CRUD real de `mad_punto_venta_usuario`.
3. Probar que `sin_restriccion = true` devuelve todos los puntos activos desde el selector de encomiendas.
4. Probar que el acceso por turnos devuelve solo el punto asignado dentro del horario.
5. Probar CRUD real de puntos de venta con campos reales `id_ubigeo`, `id_pais`, `telefono`, `serie`.
6. Probar CRUD real de rutas.
7. Crear una ruta y verificar que aparece en el selector de encomiendas.
8. Registrar una encomienda con `id_ruta`.
