# Contexto simple envio SUNAT

Fecha de corte: 2026-08-31

## Objetivo

Este documento resume el flujo actual de envio de comprobantes electronicos a SUNAT para futuras modificaciones, especialmente el manejo de errores hasta el frontend.

## Flujo principal

1. El usuario hace click en el icono SUNAT.

   Frontend:

   ```text
   xpertcont-frontend-react/src/components/Admin/AdminSunatIcon.js
   ```

2. `AdminSunatIcon` llama al backend administrativo:

   ```http
   POST /ad_ventacpe
   ```

   Ruta:

   ```text
   xpertcont-backend-js/src/routes/venta.routes.js
   ```

   Controller:

   ```text
   xpertcont-backend-js/src/controllers/venta.controllers.js
   generarCPEexpertcont()
   ```

3. `xpertcont-backend-js` arma el JSON comercial desde BD:

   ```text
   generaJsonPrevioCPEexpertcont()
   ```

   Lee:

   - `mad_usuariocontabilidad`
   - `mve_venta`
   - `mve_ventadet`

   Luego envia ese JSON al backend especializado:

   ```http
   POST https://expertcont-api-sunat.up.railway.app/cpesunat
   ```

4. `xpertcont-backend-api` recibe `/cpesunat`.

   Ruta:

   ```text
   xpertcont-backend-api/src/routes/cpesunat.routes.js
   ```

   Controller:

   ```text
   xpertcont-backend-api/src/controllers/cpesunat.controllers.js
   registrarCPESunat()
   ```

5. `xpertcont-backend-api`:

   - verifica si existe CDR pendiente
   - obtiene certificado/credenciales desde `api_usuariocertificado`
   - genera XML
   - firma XML con QPSE externo o firma interna
   - guarda XML firmado en servidor de descargas
   - arma SOAP
   - envia a SUNAT/OSE
   - procesa respuesta
   - genera PDF en segundo plano
   - responde al backend administrativo

6. `xpertcont-backend-js` actualiza `mve_venta` con:

   - `r_vfirmado`
   - `cdr_codigo`
   - `cdr_descripcion`
   - `cdr_nivel`
   - `cdr_pendiente`
   - `registrado = 0` si fue rechazado definitivo y consumio correlativo

7. El frontend recibe respuesta.

   Si llega `codigo_hash`, abre modal con links XML/CDR/PDF.

   Si no llega `codigo_hash`, muestra dialogo de error usando:

   ```js
   response.data?.respuesta_sunat_descripcion || "SIN DETALLE"
   ```

## Estados actuales del backend SUNAT

El backend especializado intenta normalizar respuestas asi:

```text
nivel: ACEPTADO | RECHAZADO | PENDIENTE
estado: true | false
codigo: codigo SUNAT/SOAP/local
respuesta_sunat_descripcion: mensaje corto
cdr_pendiente: "0" | "1"
consumioCorrelativo: true | false
permiteReintento: true | false
codigo_hash: digest del XML firmado cuando existe
ruta_xml, ruta_cdr, ruta_pdf
```

### ACEPTADO

Origen: SUNAT devuelve CDR con `ResponseCode = 0`.

Respuesta esperada:

```json
{
  "estado": true,
  "nivel": "ACEPTADO",
  "cdr_pendiente": "0",
  "codigo_hash": "...",
  "respuesta_sunat_descripcion": "..."
}
```

### RECHAZADO

Origen: SUNAT devuelve CDR con `ResponseCode <> 0`.

Es definitivo. El comprobante consumio correlativo. En backend administrativo se marca cabecera y detalle como no registrados cuando corresponde.

Respuesta esperada:

```json
{
  "estado": false,
  "nivel": "RECHAZADO",
  "consumioCorrelativo": true,
  "permiteReintento": false,
  "cdr_pendiente": "0",
  "respuesta_sunat_descripcion": "Documento rechazado por SUNAT"
}
```

### PENDIENTE

Origen: SUNAT no devuelve CDR todavia o devuelve SOAP Fault considerado temporal.

Codigos tratados como CDR pendiente:

```text
soap-env:Client.0132
soap-env:Client.0133
soap-env:Client.0028
soap-env:Client.0100
soap-env:Client.0098
```

Respuesta esperada:

```json
{
  "estado": true,
  "nivel": "PENDIENTE",
  "cdr_pendiente": "1",
  "permiteReintento": true,
  "respuesta_sunat_descripcion": "SUNAT aun no devuelve el CDR"
}
```

### ERROR local/comunicacion

Origen:

- error generando XML
- error firmando XML
- error conectando con SUNAT/OSE
- respuesta SOAP no interpretable
- error interno del backend SUNAT

Respuesta esperada:

```json
{
  "estado": false,
  "nivel": "PENDIENTE",
  "codigo": "ERROR_LOCAL",
  "permiteReintento": true,
  "respuesta_sunat_descripcion": "mensaje tecnico resumido"
}
```

## Punto debil actual

El backend SUNAT tiene una estructura razonable, pero el backend administrativo no siempre la deja pasar limpia cuando el backend SUNAT responde HTTP 400/500.

Actualmente en `generarCPEexpertcont()`:

```js
if (!apiResponse.ok) {
  return res.status(apiResponse.status).json({
    error: responseData || "Error en la API SUNAT"
  });
}
```

Esto hace que el frontend reciba a veces:

```json
{
  "error": {
    "estado": false,
    "codigo": "...",
    "respuesta_sunat_descripcion": "..."
  }
}
```

Pero `AdminSunatIcon.js` busca:

```js
response.data?.respuesta_sunat_descripcion
```

Entonces el mensaje real queda escondido dentro de `response.data.error`.

Ademas, con Axios, si el backend responde HTTP 400/500, se va al `catch`, no al `else` actual. Por eso muchos errores pueden terminar como:

```text
Error en procesamiento Interno
Request failed with status code 400
```

## Contrato recomendado para errores amigables

Para futuras modificaciones conviene que `xpertcont-backend-js` siempre responda al frontend con la misma forma, incluso si `xpertcont-backend-api` respondio HTTP 400.

Formato recomendado:

```json
{
  "success": false,
  "estado": false,
  "nivel": "RECHAZADO | PENDIENTE | ERROR",
  "codigo": "codigo SUNAT o interno",
  "titulo_usuario": "No se pudo enviar a SUNAT",
  "mensaje_usuario": "Mensaje corto y entendible",
  "detalle_tecnico": "Mensaje SUNAT completo o error interno",
  "permite_reintento": true,
  "cdr_pendiente": "0",
  "consumio_correlativo": false,
  "ruta_xml": "error",
  "ruta_cdr": "error",
  "ruta_pdf": "error"
}
```

Para exito:

```json
{
  "success": true,
  "estado": true,
  "nivel": "ACEPTADO",
  "codigo": "0",
  "mensaje_usuario": "Comprobante aceptado por SUNAT",
  "respuesta_sunat_descripcion": "...",
  "ruta_xml": "...",
  "ruta_cdr": "...",
  "ruta_pdf": "...",
  "codigo_hash": "..."
}
```

## Mensajes sugeridos para usuario

Usar `nivel` y `permiteReintento` para simplificar:

```text
ACEPTADO:
Comprobante aceptado por SUNAT.

RECHAZADO:
SUNAT rechazo el comprobante. Revise el motivo antes de emitir otro.

PENDIENTE:
SUNAT recibio el comprobante, pero aun no entrega el CDR. Puede intentar consultar el CDR mas tarde.

ERROR con permiteReintento=true:
No pudimos comunicarnos correctamente con SUNAT. Intente nuevamente en unos minutos.

ERROR con permiteReintento=false:
No se pudo preparar el comprobante. Revise los datos de empresa, cliente o detalle.
```

## Recomendacion de siguiente cambio

1. Crear en `xpertcont-backend-js` un helper para normalizar respuestas del backend SUNAT.
2. En `generarCPEexpertcont()`, cuando `apiResponse.ok` sea false, no envolver en `{ error: ... }`; devolver campos planos.
3. En `AdminSunatIcon.js`, manejar `catch(error)` leyendo:

   ```js
   error.response?.data?.mensaje_usuario
   error.response?.data?.respuesta_sunat_descripcion
   error.response?.data?.error?.respuesta_sunat_descripcion
   error.message
   ```

4. Mostrar un titulo segun `nivel`:

   - `RECHAZADO`: "Comprobante rechazado"
   - `PENDIENTE`: "CDR pendiente"
   - `ERROR`: "No se pudo enviar a SUNAT"

5. Guardar `detalle_tecnico` solo para soporte o un boton "ver detalle", no como primer mensaje al usuario.
