# Expertcont — Contexto de Implementación: Envío y Gestión de Resumen Diario SUNAT

## 1. Objetivo

Implementar el flujo completo de envío de **Resumen Diario SUNAT (RDI)** en Expertcont, partiendo de que la creación del lote en PostgreSQL ya existe mediante:

```sql
public.fve_crear_resumen_diario(...)
```

Esta función:

- crea el registro en `mve_rdi_sunat`;
- genera `numero_rdi` con formato `RC-YYYYMMDD-NNN`;
- asigna las boletas pendientes al nuevo `numero_rdi`;
- deja el lote inicialmente en estado `PENDIENTE`;
- no mezcla fechas;
- no agrega comprobantes nuevos a un RDI ya creado;
- cada ejecución crea un lote cerrado respecto de sus comprobantes.

El objetivo de este contexto es implementar:

1. lectura del RDI creado;
2. obtención de las boletas asociadas;
3. generación del XML del Resumen Diario;
4. firma del XML;
5. generación del ZIP;
6. envío a SUNAT/OSE mediante `sendSummary`;
7. almacenamiento del ticket;
8. consulta posterior mediante ticket;
9. descarga/procesamiento del CDR;
10. actualización de estados;
11. reintentos seguros;
12. tratamiento de timeouts y estados inciertos;
13. interfaz para que el usuario pueda identificar claramente cuándo debe reintentar.

---

# 2. Regla principal de negocio

Un RDI es un **lote cerrado e inmutable respecto de sus comprobantes**.

Ejemplo:

```text
RC-20260911-001
```

Si fue creado con 150 boletas, esas 150 boletas permanecen asociadas a ese resumen.

Si luego se generan otras boletas del mismo día, NO se agregan a `RC-20260911-001`.

Se debe crear un nuevo resumen:

```text
RC-20260911-002
```

Por tanto:

```text
crear RDI
≠
mantener RDI abierto
```

La función PostgreSQL crea el lote definitivo que se intentará transmitir a SUNAT.

---

# 3. Un RDI pertenece a una sola fecha

Nunca mezclar comprobantes de fechas distintas en un mismo Resumen Diario.

Ejemplo válido:

```text
RC-20260911-001
  B001-1001  fecha 11/09/2026
  B001-1002  fecha 11/09/2026
  B001-1003  fecha 11/09/2026
```

Ejemplo inválido:

```text
RC-20260911-001
  B001-1001  fecha 10/09/2026
  B001-1002  fecha 11/09/2026
```

La fecha del RDI debe corresponder con:

```text
mve_rdi_sunat.fecha
```

y todos sus comprobantes asociados deben tener:

```text
r_fecemi = mve_rdi_sunat.fecha
```

---

# 4. Tablas involucradas

## 4.1. Cabecera

```text
mve_rdi_sunat
```

Campos relevantes:

```text
id_usuario
documento_id
fecha
secuencia
origen
numero_rdi
estado
ticket
respuesta_codigo
respuesta_desc
id_punto_venta
ctrl_insercion
ctrl_actualiza
```

Agregar si aún no existen:

```sql
ALTER TABLE public.mve_rdi_sunat
ADD COLUMN IF NOT EXISTS ultimo_intento timestamp without time zone;

ALTER TABLE public.mve_rdi_sunat
ADD COLUMN IF NOT EXISTS intentos integer NOT NULL DEFAULT 0;
```

---

## 4.2. Fuente comercial

```text
mve_venta
```

Relacionada mediante:

```text
mve_venta.numero_rdi
```

Cuando:

```text
origen = VENTA_COMERCIAL
```

---

## 4.3. Fuente transporte

```text
mve_transventa
```

Relacionada mediante:

```text
mve_transventa.numero_rdi
```

Cuando:

```text
origen = TRANS_ENCOMIENDA
```

se utilizan:

```text
tipo_operacion = 'E'
```

Cuando:

```text
origen = TRANS_BOLETO
```

se utilizan:

```text
tipo_operacion = 'B'
```

---

# 5. Estados del RDI

Utilizar los siguientes estados:

```text
PENDIENTE
GENERADO
ENVIADO
INCIERTO
ACEPTADO
RECHAZADO
ERROR
```

Actualizar el CHECK:

```sql
ALTER TABLE public.mve_rdi_sunat
DROP CONSTRAINT IF EXISTS mve_rdi_sunat_estado_chk;

ALTER TABLE public.mve_rdi_sunat
ADD CONSTRAINT mve_rdi_sunat_estado_chk
CHECK (
    estado IN (
        'PENDIENTE',
        'GENERADO',
        'ENVIADO',
        'INCIERTO',
        'ACEPTADO',
        'RECHAZADO',
        'ERROR'
    )
);
```

---

# 6. Significado de estados

## PENDIENTE

El RDI ya existe en BD.

Sus comprobantes ya están congelados mediante:

```text
numero_rdi
```

pero todavía no se ha completado la generación/transmisión.

---

## GENERADO

El XML fue:

- construido;
- firmado;
- comprimido en ZIP.

Todavía no se confirmó envío.

---

## ENVIADO

SUNAT/OSE devolvió ticket.

Debe existir:

```text
ticket IS NOT NULL
```

Desde este momento NO se debe ejecutar nuevamente `sendSummary`.

El siguiente paso es consultar el ticket.

---

## INCIERTO

Se intentó enviar el RDI pero no existe certeza de si SUNAT/OSE lo recibió.

Casos típicos:

- timeout;
- socket cerrado después de transmitir;
- conexión interrumpida mientras llegaba la respuesta;
- error de red sin certeza de recepción;
- gateway/proxy sin respuesta concluyente.

Ejemplo:

```text
Expertcont
    ↓ sendSummary
SUNAT recibe
    ↓ genera ticket
respuesta se pierde
    X
Expertcont no conoce ticket
```

No asumir automáticamente que el RDI no llegó.

---

## ACEPTADO

El ticket fue consultado y se obtuvo resultado definitivo aceptado.

El RDI se considera cerrado correctamente.

No permitir reenvío.

---

## RECHAZADO

SUNAT/OSE procesó el resumen y devolvió rechazo definitivo.

Guardar:

```text
respuesta_codigo
respuesta_desc
```

No borrar automáticamente el RDI.

No liberar automáticamente los comprobantes.

El tratamiento de corrección/reenvío debe ser explícito.

---

## ERROR

Existe certeza razonable de que el envío no pudo completarse.

Ejemplos:

- XML inválido antes de transmitir;
- firma fallida;
- ZIP no generado;
- certificado inexistente;
- credenciales inválidas;
- OSE responde explícitamente que la cuenta está suspendida;
- error funcional previo a la aceptación del archivo.

Puede permitirse reintento del mismo `numero_rdi`.

---

# 7. Regla fundamental para reintentos

## Caso 1: no existe ticket

```text
ticket IS NULL
```

Puede ser necesario volver a intentar la transmisión del mismo RDI.

NO crear otro RDI.

NO ejecutar otra vez:

```sql
fve_crear_resumen_diario(...)
```

Se trabaja siempre con el mismo:

```text
numero_rdi
```

Ejemplo:

```text
RC-20260911-003
estado = ERROR
ticket = NULL
```

Reintentar:

```text
RC-20260911-003
```

---

## Caso 2: existe ticket

```text
ticket IS NOT NULL
```

NO volver a ejecutar:

```text
sendSummary
```

Se debe ejecutar únicamente:

```text
getStatus(ticket)
```

o la operación equivalente del proveedor SUNAT/OSE.

---

# 8. Flujo completo

```text
Usuario pulsa "Enviar Resumen"
        ↓
fve_crear_resumen_diario()
        ↓
RDI creado
estado = PENDIENTE
        ↓
leer comprobantes del numero_rdi
        ↓
generar XML
        ↓
firmar XML
        ↓
crear ZIP
        ↓
estado = GENERADO
        ↓
sendSummary()
        ↓
¿respuesta concluyente?
   │
   ├── ticket recibido
   │       ↓
   │ estado = ENVIADO
   │ ticket = ...
   │       ↓
   │ getStatus(ticket)
   │       ↓
   │   ├── todavía procesando
   │   │      → mantener ENVIADO
   │   │
   │   ├── CDR aceptado
   │   │      → ACEPTADO
   │   │
   │   └── CDR rechazado
   │          → RECHAZADO
   │
   ├── error seguro antes de entrega
   │       ↓
   │ estado = ERROR
   │
   └── timeout / respuesta desconocida
           ↓
       estado = INCIERTO
```

---

# 9. Endpoint recomendado: creación + envío

El usuario debe percibir una sola operación.

Ejemplo:

```text
POST /sunat/resumen-diario/enviar
```

Payload:

```json
{
  "id_usuario": "...",
  "documento_id": "20601234567",
  "fecha": "2026-09-11",
  "origen": "TRANS_ENCOMIENDA",
  "id_punto_venta": null
}
```

Flujo del backend:

```text
1. ejecutar fve_crear_resumen_diario
2. recibir numero_rdi
3. obtener comprobantes relacionados
4. generar XML
5. firmar
6. ZIP
7. enviar
8. guardar ticket/estado
9. devolver respuesta al frontend
```

El usuario NO debe tener que hacer:

```text
Crear RDI
Cerrar RDI
Enviar RDI
```

Debe ver solamente:

```text
[ Enviar a SUNAT ]
```

---

# 10. Endpoint recomendado: reintentar

```text
POST /sunat/resumen-diario/:numero_rdi/reintentar
```

Este endpoint NO llama a:

```text
fve_crear_resumen_diario
```

Debe:

1. buscar `mve_rdi_sunat`;
2. validar estado;
3. validar ticket;
4. si `ticket IS NULL`, volver a preparar/transmitir el mismo RDI;
5. incrementar `intentos`;
6. actualizar `ultimo_intento`.

---

# 11. Endpoint recomendado: consultar ticket

```text
POST /sunat/resumen-diario/:numero_rdi/consultar
```

Debe:

1. leer RDI;
2. verificar que exista `ticket`;
3. consultar SUNAT/OSE;
4. interpretar respuesta;
5. guardar CDR;
6. actualizar estado.

Si todavía está procesando:

```text
estado = ENVIADO
```

No debe considerarse error.

---

# 12. Obtención de comprobantes del RDI

## Venta comercial

```sql
SELECT *
FROM public.mve_venta AS mv
WHERE mv.id_usuario = $1
  AND mv.documento_id = $2
  AND mv.periodo = $3
  AND mv.numero_rdi = $4
ORDER BY
    mv.r_serie,
    mv.r_numero,
    mv.elemento;
```

---

## Transporte

```sql
SELECT *
FROM public.mve_transventa AS mt
WHERE mt.id_usuario = $1
  AND mt.documento_id = $2
  AND mt.periodo = $3
  AND mt.numero_rdi = $4
ORDER BY
    mt.r_serie,
    mt.r_numero,
    mt.elemento;
```

No volver a buscar las boletas mediante:

```text
numero_rdi IS NULL
```

una vez creado el lote.

La fuente definitiva del lote es:

```text
numero_rdi = RC-...
```

---

# 13. XML

El XML debe generarse utilizando exclusivamente los comprobantes que tengan:

```text
numero_rdi = RDI actual
```

No incorporar comprobantes nuevos aunque tengan:

```text
r_fecemi = fecha del RDI
```

El lote ya está cerrado.

---

# 14. Nombre lógico del archivo

Seguir el formato definido por la implementación SUNAT actual del proyecto.

Conceptualmente:

```text
RUC-RC-YYYYMMDD-NNN
```

Ejemplo:

```text
20601234567-RC-20260911-001
```

El XML y ZIP deben mantener exactamente el mismo RDI.

Nunca regenerar otro número durante un reintento.

---

# 15. Firma

Reutilizar la infraestructura actual de firma electrónica que Expertcont utiliza para CPE.

No crear un segundo mecanismo de certificados si no es necesario.

Si la firma falla:

```text
estado = ERROR
ticket = NULL
```

Guardar descripción técnica.

Permitir reintento.

---

# 16. Envío sendSummary

Una vez generado y firmado el ZIP:

```text
sendSummary(RDI)
```

Antes de enviar:

```sql
UPDATE public.mve_rdi_sunat
SET
    intentos = intentos + 1,
    ultimo_intento = now(),
    ctrl_actualiza = now()
WHERE ...
```

Si retorna ticket:

```sql
UPDATE public.mve_rdi_sunat
SET
    estado = 'ENVIADO',
    ticket = $ticket,
    respuesta_codigo = NULL,
    respuesta_desc = NULL,
    ctrl_actualiza = now()
WHERE ...;
```

---

# 17. Timeout durante sendSummary

No clasificar automáticamente como:

```text
ERROR
```

si no existe certeza de si el servidor recibió el archivo.

Utilizar:

```text
INCIERTO
```

Ejemplo:

```sql
UPDATE public.mve_rdi_sunat
SET
    estado = 'INCIERTO',
    respuesta_desc = 'Timeout durante sendSummary; recepción no confirmada',
    ctrl_actualiza = now()
WHERE ...;
```

El frontend debe mostrar este estado como atención requerida.

---

# 18. OSE suspendida / pendiente de pago

Si el proveedor responde explícitamente:

```text
cuenta suspendida
servicio no disponible
plan vencido
credenciales inválidas
```

y existe certeza de que no generó ticket:

```text
estado = ERROR
ticket = NULL
```

Mantener:

```text
numero_rdi
```

y todos sus comprobantes.

Cuando se resuelva el problema:

```text
Reintentar mismo RDI
```

No crear otro.

---

# 19. Consulta de ticket

Cuando:

```text
ticket IS NOT NULL
```

el backend debe consultar el estado.

No ejecutar nuevamente el envío.

Posibles resultados:

```text
procesando
aceptado
rechazado
error técnico temporal
```

### Procesando

Mantener:

```text
estado = ENVIADO
```

### Aceptado

Guardar CDR y:

```text
estado = ACEPTADO
```

### Rechazado

Guardar CDR y:

```text
estado = RECHAZADO
```

más:

```text
respuesta_codigo
respuesta_desc
```

---

# 20. CDR

El CDR pertenece al Resumen Diario completo.

Debe almacenarse asociado a:

```text
numero_rdi
```

No asumir que existe un CDR individual por cada boleta cuando fue informada mediante RDI.

Si el proyecto ya posee infraestructura de almacenamiento de CDR:

- reutilizarla;
- guardar por RDI;
- mantener trazabilidad.

---

# 21. r_vfirmado

No utilizar:

```text
r_vfirmado
```

para almacenar:

```text
numero_rdi
ticket
estado RDI
```

Cuando la boleta fue informada mediante resumen:

```text
numero_rdi <> NULL
```

El resultado se obtiene desde:

```text
mve_rdi_sunat.estado
```

La existencia de:

```text
numero_rdi
```

indica el canal RDI.

---

# 22. No modificar comprobantes al consultar ticket

Los comprobantes asociados permanecen vinculados mediante:

```text
numero_rdi
```

No modificar ni limpiar automáticamente:

```text
numero_rdi
```

al recibir:

```text
ACEPTADO
RECHAZADO
ERROR
INCIERTO
```

La relación debe mantenerse para auditoría.

---

# 23. Manejo de rechazo

Un `RECHAZADO` es diferente a un error técnico.

No hacer automáticamente:

```sql
UPDATE mve_venta
SET numero_rdi = NULL
```

ni equivalente sobre transporte.

Primero se debe evaluar:

```text
respuesta_codigo
respuesta_desc
```

La corrección de un RDI rechazado debe ser una operación explícita.

---

# 24. UI

Mostrar estado SUNAT de manera simple.

Ejemplo:

```text
11/09/2026

RC-20260911-001    ACEPTADO
RC-20260911-002    ENVIADO
RC-20260911-003    INCIERTO
RC-20260911-004    ERROR
RC-20260911-005    RECHAZADO
```

---

# 25. Icono SUNAT

Sugerencia visual:

```text
ACEPTADO
→ icono normal / resaltado positivo

ENVIADO
→ icono amarillo o estado pendiente

INCIERTO
→ icono SUNAT pálido

ERROR
→ icono pálido/alerta

RECHAZADO
→ icono rojo
```

No depender únicamente del color.

Agregar tooltip/texto.

---

# 26. Acciones según estado

## PENDIENTE

```text
[ Enviar ]
```

## GENERADO

```text
[ Enviar ]
```

## ENVIADO + ticket

```text
[ Consultar SUNAT ]
```

## INCIERTO

```text
[ Verificar / Reintentar ]
```

Debe existir una decisión controlada porque no sabemos si el servidor recibió el envío.

## ERROR + ticket NULL

```text
[ Reintentar ]
```

## ACEPTADO

Sin acción de envío.

## RECHAZADO

```text
[ Ver detalle ]
```

No mostrar reenvío automático sin proceso de corrección.

---

# 27. Protección contra doble clic

El backend debe impedir envíos simultáneos del mismo RDI.

No depender solamente de deshabilitar el botón React.

Antes de transmitir, controlar que el mismo `numero_rdi` no esté siendo procesado simultáneamente.

Puede utilizarse:

- advisory lock PostgreSQL;
- actualización condicional de estado;
- mecanismo equivalente.

La protección debe existir en backend/BD.

---

# 28. Idempotencia

El proceso debe ser lo más idempotente posible.

Regla:

```text
si ticket existe
→ consultar
→ nunca reenviar
```

Regla:

```text
si estado = ACEPTADO
→ no hacer nada
```

Regla:

```text
si estado = RECHAZADO
→ no reenviar automáticamente
```

Regla:

```text
si ticket = NULL y ERROR
→ puede reintentarse el mismo RDI
```

---

# 29. Auditoría

Actualizar:

```text
intentos
ultimo_intento
ctrl_actualiza
```

en cada transmisión.

Mantener la descripción del último error en:

```text
respuesta_desc
```

No borrar errores anteriores si existe un mecanismo de logs del backend.

---

# 30. Logs backend

Registrar al menos:

```text
numero_rdi
id_usuario
documento_id
fecha
origen
estado previo
estado nuevo
intento
ticket
tipo de operación
error técnico
```

No registrar:

- claves privadas;
- contraseñas SUNAT;
- contenido sensible del certificado.

---

# 31. Respuesta del endpoint al frontend

Ejemplo exitoso:

```json
{
  "ok": true,
  "numero_rdi": "RC-20260911-001",
  "estado": "ENVIADO",
  "ticket": "123456789012345",
  "mensaje": "Resumen Diario enviado correctamente."
}
```

Ejemplo timeout:

```json
{
  "ok": false,
  "numero_rdi": "RC-20260911-001",
  "estado": "INCIERTO",
  "mensaje": "No se pudo confirmar la recepción por SUNAT."
}
```

Ejemplo error OSE:

```json
{
  "ok": false,
  "numero_rdi": "RC-20260911-001",
  "estado": "ERROR",
  "mensaje": "El servicio OSE no se encuentra disponible."
}
```

---

# 32. Experiencia del usuario

El usuario no debe conocer todos los pasos internos.

Debe percibir:

```text
Boletas pendientes: 185

[ Enviar a SUNAT ]
```

El backend hace:

```text
crear lote
generar XML
firmar
ZIP
sendSummary
guardar ticket
```

Si el ticket todavía está procesando:

```text
Enviado a SUNAT. Procesamiento pendiente.
```

Si ocurre timeout:

```text
No se pudo confirmar la recepción.
Puede verificar o intentar nuevamente.
```

---

# 33. Pendientes agrupados por fecha

Como un RDI pertenece a una sola fecha, el dashboard debe mostrar:

```text
10/09/2026    14 pendientes   [ Enviar ]
11/09/2026   185 pendientes   [ Enviar ]
```

Nunca crear automáticamente un lote mezclando ambas fechas.

---

# 34. Pendientes agrupados por origen

Para transporte:

```text
11/09/2026

Encomiendas
48 pendientes
[ Enviar ]

Boletos
326 pendientes
[ Enviar ]
```

Cada botón crea su propio RDI.

Ejemplo:

```text
RC-20260911-001 → TRANS_ENCOMIENDA
RC-20260911-002 → TRANS_BOLETO
```

---

# 35. Regla final de creación vs reintento

## Crear nuevo RDI

Ejecutar:

```text
fve_crear_resumen_diario
```

solamente cuando se desean capturar boletas nuevas:

```text
numero_rdi IS NULL
```

## Reintentar RDI

NO ejecutar la función.

Utilizar:

```text
numero_rdi existente
```

y sus comprobantes ya relacionados.

---

# 36. Resumen técnico

```text
BOLETAS NUEVAS
numero_rdi = NULL
        ↓
fve_crear_resumen_diario
        ↓
RC creado
        ↓
boletas congeladas
        ↓
generación XML
        ↓
firma
        ↓
ZIP
        ↓
sendSummary
        ↓
┌─────────────────────────────┐
│                             │
ticket                     timeout
│                             │
ENVIADO                    INCIERTO
│
getStatus
│
├── procesando → ENVIADO
├── aceptado   → ACEPTADO
└── rechazado  → RECHAZADO
```

---

# 37. Principios que Codex no debe romper

1. Un RDI contiene comprobantes de una sola fecha.
2. Un RDI creado no recibe comprobantes adicionales.
3. Los comprobantes nuevos generan otro RDI.
4. `numero_rdi` identifica el lote.
5. `ticket` pertenece al lote.
6. `ticket IS NOT NULL` implica consultar, no reenviar.
7. Un timeout no implica automáticamente que SUNAT no recibió.
8. Usar `INCIERTO` cuando la recepción no puede confirmarse.
9. Un error técnico no debe crear un nuevo RDI.
10. Un reintento utiliza el mismo `numero_rdi`.
11. No sobrescribir `r_vfirmado` con información del RDI.
12. No liberar automáticamente comprobantes de un RDI rechazado.
13. El usuario debe percibir una operación simple: `Enviar a SUNAT`.
14. La complejidad técnica queda en backend.
