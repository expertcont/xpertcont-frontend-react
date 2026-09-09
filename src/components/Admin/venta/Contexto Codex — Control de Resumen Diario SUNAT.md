# OBJETIVO

Implementar en Expertcont el control de envío de boletas mediante **Resumen Diario SUNAT**, reutilizable tanto para:

- ventas comerciales / abarrotes;
- encomiendas;
- boletos de viaje;
- futuros módulos que también generen boletas.

Las facturas continuarán enviándose normalmente de forma **individual**.

Las boletas podrán ser enviadas:

- individualmente, como actualmente;
- mediante Resumen Diario.

El sistema debe poder distinguir ambos casos sin modificar la semántica actual del campo `r_vfirmado`.

---

# 1. CONCEPTO PRINCIPAL

Actualmente los comprobantes contienen el campo:

```sql
r_vfirmado
```

Este campo pertenece al proceso de envío individual y no debe reutilizarse artificialmente para almacenar:

- número de Resumen Diario;
- ticket SUNAT;
- identificadores del lote.

Para Resumen Diario se agregará una referencia independiente:

```sql
numero_rdi varchar(50)
```

Ejemplo:

```text
RC-20260906-001
```

La interpretación será:

```text
r_vfirmado = NULL
numero_rdi = NULL

→ comprobante pendiente de envío SUNAT
```

```text
r_vfirmado <> NULL
numero_rdi = NULL

→ comprobante procesado individualmente
```

```text
r_vfirmado = NULL
numero_rdi = RC-20260906-001

→ comprobante asignado/procesado mediante Resumen Diario
```

El estado definitivo del Resumen Diario se consulta en:

```text
mve_rdi_sunat.estado
```

No se debe copiar el ticket SUNAT dentro de `r_vfirmado`.

---

# 2. AGREGAR CAMPO numero_rdi A VENTAS COMERCIALES

Agregar a:

```sql
public.mve_venta
```

el campo:

```sql
ALTER TABLE public.mve_venta
ADD COLUMN numero_rdi varchar(50);
```

Este campo será `NULL` para:

- comprobantes todavía no enviados;
- facturas enviadas individualmente;
- boletas enviadas individualmente.

Tendrá valor solamente cuando el comprobante haya sido incorporado a un Resumen Diario.

Ejemplo:

```text
r_cod      = 03
r_serie    = B001
r_numero   = 00001245
numero_rdi = RC-20260906-001
```

---

# 3. AGREGAR CAMPO numero_rdi A TRANSPORTE

Agregar el mismo concepto a:

```sql
public.mve_transventa
```

Ejemplo:

```sql
ALTER TABLE public.mve_transventa
ADD COLUMN numero_rdi varchar(50);
```

Esto permitirá relacionar tanto:

```text
tipo_operacion = E
→ encomienda
```

como:

```text
tipo_operacion = B
→ boleto
```

con el Resumen Diario correspondiente.

Ejemplo:

```text
B003-0001588
tipo_operacion = E
numero_rdi     = RC-20260906-002
```

---

# 4. TABLA CABECERA DEL RESUMEN DIARIO

Crear/migrar la tabla:

```sql
public.mve_rdi_sunat
```

La tabla antigua provenía del sistema SFS.

Nueva propuesta:

```sql
CREATE TABLE public.mve_rdi_sunat (
    id_usuario         varchar(50) NOT NULL,
    documento_id       varchar(20) NOT NULL,

    -- Fecha de emisión de las boletas incluidas.
    fecha              date NOT NULL,

    -- Secuencia del Resumen Diario dentro de la misma fecha.
    secuencia          integer NOT NULL,

    -- Módulo/origen interno de Expertcont.
    --
    -- Ejemplos:
    -- VENTA_COMERCIAL
    -- TRANS_ENCOMIENDA
    -- TRANS_BOLETO
    origen             varchar(30) NOT NULL,

    -- Identificador del Resumen Diario.
    -- Ejemplo: RC-20260906-001
    numero_rdi         varchar(50) NOT NULL,

    -- Estado del proceso.
    estado             varchar(15)
                       NOT NULL
                       DEFAULT 'PENDIENTE',

    -- Ticket retornado por SUNAT al enviar el RC.
    ticket             varchar(200),

    -- Resultado de procesamiento SUNAT.
    respuesta_codigo   varchar(20),
    respuesta_desc     varchar(500),

    -- Opcional.
    -- Puede identificar una oficina específica.
    -- NULL permite resumir comprobantes de varios puntos.
    id_punto_venta     varchar(20),

    ctrl_insercion     timestamp without time zone
                       NOT NULL
                       DEFAULT now(),

    ctrl_actualiza     timestamp without time zone,

    CONSTRAINT mve_rdi_sunat_pkey
        PRIMARY KEY (
            id_usuario,
            documento_id,
            fecha,
            secuencia
        ),

    CONSTRAINT mve_rdi_sunat_numero_rdi_uk
        UNIQUE (
            id_usuario,
            documento_id,
            numero_rdi
        ),

    CONSTRAINT mve_rdi_sunat_estado_chk
        CHECK (
            estado IN (
                'PENDIENTE',
                'GENERADO',
                'ENVIADO',
                'ACEPTADO',
                'RECHAZADO',
                'ERROR'
            )
        )
);
```

No utilizar:

```text
correlativo SERIAL
```

La identidad lógica será:

```text
id_usuario
documento_id
fecha
secuencia
```

---

# 5. ORIGEN DEL RESUMEN

No utilizar un `tipo_operacion CHAR(1)` limitado solamente a transporte.

El Resumen Diario será común para distintos módulos de Expertcont.

Utilizar:

```sql
origen varchar(30)
```

Ejemplos iniciales:

```text
VENTA_COMERCIAL
TRANS_ENCOMIENDA
TRANS_BOLETO
```

No crear por ahora un `CHECK` cerrado para `origen`, porque posteriormente podrían aparecer:

```text
RESTAURANTE
SERVICIOS
FARMACIA
OTRO_MODULO
```

Este valor es interno de Expertcont, no un código SUNAT.

---

# 6. SECUENCIA DEL RESUMEN

Para una misma empresa y fecha, cada Resumen Diario debe tener una secuencia independiente.

Ejemplo:

```text
fecha: 2026-09-06

RC-20260906-001
RC-20260906-002
RC-20260906-003
```

La secuencia no reinicia por `origen`.

Ejemplo:

```text
RC-20260906-001 → VENTA_COMERCIAL
RC-20260906-002 → TRANS_ENCOMIENDA
RC-20260906-003 → TRANS_BOLETO
RC-20260906-004 → VENTA_COMERCIAL
```

Al día siguiente:

```text
RC-20260907-001
```

---

# 7. GENERACIÓN DEL numero_rdi

Formato:

```text
RC-YYYYMMDD-NNN
```

Ejemplo:

```text
RC-20260906-001
```

Construcción PostgreSQL:

```sql
'RC-' ||
to_char(p_fecha, 'YYYYMMDD') ||
'-' ||
lpad(v_secuencia::text, 3, '0')
```

La asignación de `secuencia` debe realizarse de manera segura dentro de PostgreSQL.

Evitar un:

```sql
MAX(secuencia) + 1
```

ejecutado sin control de concurrencia desde Node.

La función PostgreSQL debe impedir que dos usuarios/procesos generen simultáneamente:

```text
RC-20260906-001
```

para la misma empresa.

Puede utilizarse bloqueo/advisory lock o la estrategia transaccional que ya se emplea en Expertcont para correlativos.

---

# 8. FLUJO DE CREACIÓN DEL RESUMEN

Ejemplo para ventas comerciales.

Boletas disponibles:

```sql
SELECT *
FROM mve_venta
WHERE id_usuario = p_id_usuario
  AND documento_id = p_documento_id
  AND r_cod = '03'
  AND r_fecemi = p_fecha
  AND r_vfirmado IS NULL
  AND numero_rdi IS NULL;
```

Los dos últimos filtros son fundamentales:

```sql
r_vfirmado IS NULL
AND numero_rdi IS NULL
```

Esto significa:

```text
no fue procesada individualmente
y
no pertenece todavía a otro resumen
```

Una vez creado:

```text
RC-20260906-001
```

las boletas seleccionadas deben quedar relacionadas:

```sql
numero_rdi = 'RC-20260906-001'
```

Ejemplo:

```text
B001-001201 → RC-20260906-001
B001-001202 → RC-20260906-001
B001-001203 → RC-20260906-001
```

---

# 9. FLUJO DE ESTADOS DEL RESUMEN

Estado inicial:

```text
PENDIENTE
```

Después de generar correctamente XML/ZIP:

```text
GENERADO
```

Después de enviar a SUNAT y recibir ticket:

```text
ENVIADO
```

Ejemplo:

```text
numero_rdi = RC-20260906-001
estado     = ENVIADO
ticket     = 20260906123456789012
```

Después de consultar el ticket:

```text
ACEPTADO
```

o:

```text
RECHAZADO
```

En fallos técnicos:

```text
ERROR
```

Flujo normal:

```text
PENDIENTE
    ↓
GENERADO
    ↓
ENVIADO
    ↓
ACEPTADO
```

Alternativamente:

```text
ENVIADO
    ↓
RECHAZADO
```

---

# 10. TICKET SUNAT

El ticket pertenece al Resumen Diario completo.

Debe guardarse únicamente en:

```text
mve_rdi_sunat.ticket
```

Ejemplo:

```text
numero_rdi = RC-20260906-001
ticket     = 20260906123456789012
```

No copiar el ticket en:

```text
mve_venta.r_vfirmado
```

ni en:

```text
mve_transventa.r_vfirmado
```

El ticket tampoco forma parte del QR de cada boleta.

Cuando se imprime la boleta, el ticket incluso puede no existir todavía.

---

# 11. r_vfirmado

Mantener el significado actual de:

```text
r_vfirmado
```

No cambiarlo por la introducción del Resumen Diario.

Para envío individual:

```text
r_vfirmado <> NULL
numero_rdi = NULL
```

Para Resumen Diario:

```text
numero_rdi <> NULL
```

y el resultado se obtiene consultando:

```text
mve_rdi_sunat.estado
```

Ejemplo:

```text
mve_venta

r_cod      = 03
r_serie    = B001
r_numero   = 00001245
r_vfirmado = NULL
numero_rdi = RC-20260906-001
```

y:

```text
mve_rdi_sunat

numero_rdi = RC-20260906-001
estado     = ACEPTADO
ticket     = 20260906123456789012
```

Significa:

```text
La boleta fue informada mediante Resumen Diario
y el Resumen fue aceptado por SUNAT.
```

---

# 12. EJEMPLO: ENVÍO INDIVIDUAL

Factura:

```text
01-F001-00000851

r_vfirmado = <valor actual del proceso SUNAT>
numero_rdi = NULL
```

Interpretación:

```text
Enviado individualmente.
```

También podría existir excepcionalmente una boleta enviada individual:

```text
03-B001-00001200

r_vfirmado <> NULL
numero_rdi = NULL
```

Interpretación:

```text
Boleta enviada individualmente.
```

---

# 13. EJEMPLO: RESUMEN COMERCIAL

Cabecera:

```text
numero_rdi = RC-20260906-001
origen     = VENTA_COMERCIAL
estado     = ACEPTADO
```

Comprobantes:

```text
B001-001201   RC-20260906-001
B001-001202   RC-20260906-001
B001-001203   RC-20260906-001
B002-000455   RC-20260906-001
```

El resumen puede agrupar varias series si la lógica SUNAT implementada lo permite.

---

# 14. EJEMPLO: ENCOMIENDAS

```text
numero_rdi = RC-20260906-002
origen     = TRANS_ENCOMIENDA
estado     = ACEPTADO
```

En `mve_transventa`:

```text
03-B003-0004512
tipo_operacion = E
numero_rdi     = RC-20260906-002
```

---

# 15. EJEMPLO: BOLETOS DE VIAJE

```text
numero_rdi = RC-20260906-003
origen     = TRANS_BOLETO
estado     = ACEPTADO
```

En `mve_transventa`:

```text
03-B013-0000821
tipo_operacion = B
numero_rdi     = RC-20260906-003
```

Los boletos pueden tener tratamiento tributario diferente a las encomiendas, por lo que inicialmente deben generarse como lotes separados.

---

# 16. NO CREAR TABLA DETALLE POR AHORA

No crear inicialmente:

```text
mve_rdi_sunat_det
```

La relación entre comprobante y Resumen Diario ya se almacenará directamente mediante:

```text
mve_venta.numero_rdi
```

o:

```text
mve_transventa.numero_rdi
```

Por tanto:

```text
mve_rdi_sunat
       1
       │
       │
       N
mve_venta / mve_transventa
```

Ejemplo de consulta:

```sql
SELECT *
FROM mve_venta
WHERE id_usuario = $1
  AND documento_id = $2
  AND numero_rdi = $3;
```

---

# 17. RECHAZOS

Si un Resumen Diario resulta rechazado, no borrar automáticamente información antes de evaluar el tipo de rechazo.

La cabecera debe conservar:

```text
estado = RECHAZADO
respuesta_codigo
respuesta_desc
ticket
numero_rdi
```

Posteriormente un proceso controlado podrá decidir si corresponde liberar los documentos para un nuevo resumen.

En ese caso:

```sql
numero_rdi = NULL
```

permitiría que el comprobante vuelva a quedar disponible.

No realizar esta liberación automáticamente hasta definir completamente las reglas de reenvío/rechazo.

---

# 18. DASHBOARD FUTURO

La estructura debe permitir consultas como:

```text
SUNAT

Facturas pendientes individuales        4

VENTA COMERCIAL
Boletas pendientes resumen            182

ENCOMIENDAS
Boletas pendientes resumen             48

BOLETOS
Boletas pendientes resumen            325

Resúmenes enviados pendientes ticket    2

Resúmenes rechazados                     1
```

Ejemplo para contar boletas comerciales pendientes:

```sql
SELECT COUNT(*)
FROM mve_venta
WHERE id_usuario = $1
  AND documento_id = $2
  AND r_cod = '03'
  AND r_vfirmado IS NULL
  AND numero_rdi IS NULL;
```

---

# 19. RESUMEN DE RESPONSABILIDADES

## mve_venta / mve_transventa

Guardan:

```text
numero_rdi
```

para saber a qué Resumen Diario pertenece el comprobante.

Mantienen:

```text
r_vfirmado
```

sin modificar su significado actual.

---

## mve_rdi_sunat

Controla:

```text
fecha
secuencia
origen
numero_rdi
estado
ticket
respuesta_codigo
respuesta_desc
id_punto_venta
auditoría
```

Es la cabecera de cada envío de Resumen Diario SUNAT.

---

# 20. REGLA GENERAL

La lógica principal debe quedar:

```text
FACTURA
→ envío individual
→ numero_rdi = NULL
```

```text
BOLETA COMERCIAL
→ Resumen Diario por defecto
→ origen = VENTA_COMERCIAL
```

```text
BOLETA ENCOMIENDA
→ Resumen Diario por defecto
→ origen = TRANS_ENCOMIENDA
```

```text
BOLETA BOLETO
→ Resumen Diario por defecto
→ origen = TRANS_BOLETO
```

Excepcionalmente una boleta puede enviarse individualmente.

La existencia de:

```text
numero_rdi IS NOT NULL
```

indica que fue incorporada a un Resumen Diario.

El resultado de dicho resumen debe obtenerse desde:

```text
mve_rdi_sunat.estado
```

y el ticket exclusivamente desde:

```text
mve_rdi_sunat.ticket
```