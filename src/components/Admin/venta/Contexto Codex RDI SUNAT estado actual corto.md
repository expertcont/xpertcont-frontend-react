# Contexto corto - RDI SUNAT estado actual

Fecha de corte: 2026-09-12

## Estado implementado

- El icono RDI de `AdminVentaList` llama a `POST /ad_ventacpe/resumen`.
- Backend administrativo modificado:
  - `xpertcont-backend-js/src/controllers/venta.controllers.js`
  - `xpertcont-backend-js/src/routes/venta.routes.js`
  - `xpertcont-backend-js/src/controllers/ventatrans.controllers.js`
- Backend API SUNAT no fue modificado.

## Flujo comercial actual

1. Click en icono RDI.
2. Si existe RDI comercial abierto para la fecha, procesa primero el mas antiguo por `secuencia ASC`.
3. Si no existe RDI abierto, ejecuta `public.fve_crear_resumen_diario(...)`.
4. La funcion BD crea `mve_rdi_sunat`, genera `numero_rdi` y asigna boletas `mve_venta.numero_rdi`.
5. Backend arma payload `SummaryDocuments` desde `mve_rdi_sunat + mve_venta`.
6. Llama al backend API SUNAT:
   - envio: `https://expertcont-api-sunat.up.railway.app/cpesunatresumen`
   - consulta: `https://expertcont-api-sunat.up.railway.app/cpesunatresumen/ticket`
7. Si SUNAT devuelve ticket, guarda en `mve_rdi_sunat`:
   - `estado = ENVIADO`
   - `ticket`
   - `respuesta_codigo`
   - `respuesta_desc`
8. Si el RDI ya tiene ticket, no reenvia; consulta ticket.
9. Si SUNAT devuelve CDR, backend API lo guarda como:
   - `http://{CPE_HOST}:8080/descargas/{RUC}/R-{nombre_archivo}.xml`

## Reglas implementadas

- Cola FIFO comercial: no procesa `RC-YYYYMMDD-002` mientras `RC-YYYYMMDD-001` siga abierto.
- Estados abiertos usados para cola:
  - `PENDIENTE`
  - `GENERADO`
  - `ENVIADO`
  - `INCIERTO`
  - `ERROR`
- Estados cerrados:
  - `ACEPTADO`
  - `RECHAZADO`
- Proteccion contra doble envio:
  - `pg_try_advisory_lock(hashtext('rdi:{id_usuario}:{documento_id}:{numero_rdi}'))`

## Anuladas

- Venta comercial:
  - `mve_venta.registrado = 0` => `status = "3"`
- Transporte:
  - `mve_transventa.registrado = 0` => `status = "3"`
- Se mantienen importes originales para SUNAT.
- Reportes internos siguen usando `monto * registrado` para monto cero interno.

## Cortesias / gratuitas

- Comercial usa:
  - `mve_venta.r_base_gratuita`
  - fallback `mve_venta.r_total_gratuito`
- Si alguno es mayor a cero:
  - `status = "1"`
  - `total_a_pagar = 0`
  - `total_gratuita = r_base_gratuita || r_total_gratuito`
- Backend API SUNAT genera `InstructionID 05`.
- Transporte no tiene campo gratuito. Por ahora, si una encomienda es cortesia:
  - `registrado = 1`
  - importes en cero
  - no se informa valor referencial gratuito.

## Pendiente recomendado

Crear pantalla/listado RDI SUNAT para historial y control:

- Ruta sugerida: `Ventas > Resumenes SUNAT`
- Fuente: `mve_rdi_sunat`
- Columnas:
  - fecha
  - numero_rdi
  - origen
  - estado
  - ticket
  - cantidad boletas
  - respuesta_codigo
  - respuesta_desc
  - ultimo_intento
  - acciones
- Acciones:
  - `PENDIENTE/GENERADO/ERROR sin ticket`: reintentar envio
  - `ENVIADO con ticket`: consultar CDR
  - `ACEPTADO`: ver/descargar CDR
  - `RECHAZADO`: ver detalle SUNAT
  - `INCIERTO`: verificar/revisar antes de reintentar

## Campos recomendados para completar historial

Agregar a `mve_rdi_sunat`:

```sql
ALTER TABLE public.mve_rdi_sunat
ADD COLUMN IF NOT EXISTS ruta_xml varchar(500),
ADD COLUMN IF NOT EXISTS ruta_cdr varchar(500),
ADD COLUMN IF NOT EXISTS nombre_archivo varchar(100),
ADD COLUMN IF NOT EXISTS ultimo_intento timestamp without time zone,
ADD COLUMN IF NOT EXISTS intentos integer NOT NULL DEFAULT 0;
```

Nota: `ultimo_intento` e `intentos` ya se usan en backend si existen. `ruta_xml`, `ruta_cdr` y `nombre_archivo` aun no se persisten en el controller comercial.
