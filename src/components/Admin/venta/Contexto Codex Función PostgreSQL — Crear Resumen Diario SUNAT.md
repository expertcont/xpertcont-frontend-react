## Función: `fve_crear_resumen_diario`

### Objetivo

Crear de forma transaccional un nuevo Resumen Diario SUNAT:

```text
RC-YYYYMMDD-NNN
```

y asignar al resumen todas las boletas pendientes correspondientes al origen indicado.

La función debe:

1. Bloquear la generación concurrente para la misma empresa y fecha.
2. Obtener la siguiente `secuencia`.
3. Crear `numero_rdi`.
4. Insertar la cabecera en `mve_rdi_sunat`.
5. Asignar las boletas pendientes al nuevo `numero_rdi`.
6. Retornar el número de resumen y cantidad de documentos incluidos.
7. Si no existen documentos pendientes, no crear ningún resumen.

---

## Implementación

```sql
CREATE OR REPLACE FUNCTION public.fve_crear_resumen_diario(
    p_id_usuario       varchar,
    p_documento_id     varchar,
    p_fecha            date,
    p_origen           varchar,
    p_id_punto_venta   varchar DEFAULT NULL
)
RETURNS TABLE (
    creado             boolean,
    numero_rdi         varchar,
    secuencia          integer,
    cantidad           integer,
    mensaje            varchar
)
LANGUAGE plpgsql
VOLATILE
CALLED ON NULL INPUT
SECURITY INVOKER
PARALLEL UNSAFE
AS
$BODY$

DECLARE

    v_periodo           varchar(7);
    v_secuencia         integer;
    v_numero_rdi        varchar(50);
    v_cantidad          integer := 0;

BEGIN

    ------------------------------------------------------------------
    -- Validaciones básicas
    ------------------------------------------------------------------

    IF p_id_usuario IS NULL OR trim(p_id_usuario) = '' THEN
        RAISE EXCEPTION 'id_usuario es obligatorio';
    END IF;

    IF p_documento_id IS NULL OR trim(p_documento_id) = '' THEN
        RAISE EXCEPTION 'documento_id es obligatorio';
    END IF;

    IF p_fecha IS NULL THEN
        RAISE EXCEPTION 'fecha es obligatoria';
    END IF;

    IF p_origen IS NULL OR trim(p_origen) = '' THEN
        RAISE EXCEPTION 'origen es obligatorio';
    END IF;


    ------------------------------------------------------------------
    -- Periodo de la tabla particionada
    --
    -- Ejemplo:
    -- 2026-09-07 -> 2026-09
    ------------------------------------------------------------------

    v_periodo := to_char(p_fecha, 'YYYY-MM');


    ------------------------------------------------------------------
    -- Validar origen conocido
    ------------------------------------------------------------------

    IF p_origen NOT IN (
        'VENTA_COMERCIAL',
        'TRANS_ENCOMIENDA',
        'TRANS_BOLETO'
    ) THEN

        RETURN QUERY
        SELECT
            false,
            NULL::varchar,
            NULL::integer,
            0,
            ('Origen no reconocido: ' || p_origen)::varchar;

        RETURN;

    END IF;


    ------------------------------------------------------------------
    -- BLOQUEO DE CONCURRENCIA
    --
    -- Evita que dos procesos de la misma empresa y fecha obtengan
    -- simultáneamente la misma secuencia.
    --
    -- El bloqueo dura solamente hasta finalizar la transacción.
    ------------------------------------------------------------------

    PERFORM pg_advisory_xact_lock(
        hashtextextended(
            p_id_usuario
            || '|'
            || p_documento_id
            || '|RDI|'
            || to_char(p_fecha, 'YYYYMMDD'),
            0
        )
    );


    ------------------------------------------------------------------
    -- Primero verificar si realmente existen boletas pendientes.
    --
    -- No debemos crear un RC vacío.
    ------------------------------------------------------------------

    IF p_origen = 'VENTA_COMERCIAL' THEN

        SELECT COUNT(*)
        INTO v_cantidad
        FROM public.mve_venta
        WHERE id_usuario = p_id_usuario
          AND documento_id = p_documento_id
          AND periodo = v_periodo
          AND r_cod = '03'
          AND r_fecemi = p_fecha
          AND r_vfirmado IS NULL
          AND numero_rdi IS NULL;

    ELSIF p_origen = 'TRANS_ENCOMIENDA' THEN

        SELECT COUNT(*)
        INTO v_cantidad
        FROM public.mve_transventa
        WHERE id_usuario = p_id_usuario
          AND documento_id = p_documento_id
          AND periodo = v_periodo
          AND r_cod = '03'
          AND r_fecemi = p_fecha
          AND tipo_operacion = 'E'
          AND r_vfirmado IS NULL
          AND numero_rdi IS NULL;

    ELSIF p_origen = 'TRANS_BOLETO' THEN

        SELECT COUNT(*)
        INTO v_cantidad
        FROM public.mve_transventa
        WHERE id_usuario = p_id_usuario
          AND documento_id = p_documento_id
          AND periodo = v_periodo
          AND r_cod = '03'
          AND r_fecemi = p_fecha
          AND tipo_operacion = 'B'
          AND r_vfirmado IS NULL
          AND numero_rdi IS NULL;

    END IF;


    ------------------------------------------------------------------
    -- No existen documentos para incluir.
    ------------------------------------------------------------------

    IF COALESCE(v_cantidad, 0) = 0 THEN

        RETURN QUERY
        SELECT
            false,
            NULL::varchar,
            NULL::integer,
            0,
            'No existen boletas pendientes para generar el Resumen Diario'::varchar;

        RETURN;

    END IF;


    ------------------------------------------------------------------
    -- Obtener siguiente secuencia.
    --
    -- Como existe advisory lock, este MAX + 1 queda protegido contra
    -- generación concurrente para la misma empresa y fecha.
    ------------------------------------------------------------------

    SELECT COALESCE(MAX(r.secuencia), 0) + 1
    INTO v_secuencia
    FROM public.mve_rdi_sunat r
    WHERE r.id_usuario = p_id_usuario
      AND r.documento_id = p_documento_id
      AND r.fecha = p_fecha;


    ------------------------------------------------------------------
    -- Construcción del número oficial del Resumen Diario.
    --
    -- Ejemplo:
    --
    -- fecha      : 2026-09-07
    -- secuencia  : 3
    --
    -- resultado:
    -- RC-20260907-003
    ------------------------------------------------------------------

    v_numero_rdi :=
        'RC-'
        || to_char(p_fecha, 'YYYYMMDD')
        || '-'
        || lpad(v_secuencia::varchar, 3, '0');


    ------------------------------------------------------------------
    -- Crear cabecera del Resumen Diario
    ------------------------------------------------------------------

    INSERT INTO public.mve_rdi_sunat (
        id_usuario,
        documento_id,
        fecha,
        secuencia,
        origen,
        numero_rdi,
        estado,
        ticket,
        respuesta_codigo,
        respuesta_desc,
        id_punto_venta,
        ctrl_insercion,
        ctrl_actualiza
    )
    VALUES (
        p_id_usuario,
        p_documento_id,
        p_fecha,
        v_secuencia,
        p_origen,
        v_numero_rdi,
        'PENDIENTE',
        NULL,
        NULL,
        NULL,
        p_id_punto_venta,
        now(),
        NULL
    );


    ------------------------------------------------------------------
    -- Asignar documentos al Resumen Diario
    ------------------------------------------------------------------

    IF p_origen = 'VENTA_COMERCIAL' THEN

        UPDATE public.mve_venta
        SET numero_rdi = v_numero_rdi
        WHERE id_usuario = p_id_usuario
          AND documento_id = p_documento_id
          AND periodo = v_periodo
          AND r_cod = '03'
          AND r_fecemi = p_fecha
          AND r_vfirmado IS NULL
          AND numero_rdi IS NULL;

        GET DIAGNOSTICS v_cantidad = ROW_COUNT;


    ELSIF p_origen = 'TRANS_ENCOMIENDA' THEN

        UPDATE public.mve_transventa
        SET numero_rdi = v_numero_rdi
        WHERE id_usuario = p_id_usuario
          AND documento_id = p_documento_id
          AND periodo = v_periodo
          AND r_cod = '03'
          AND r_fecemi = p_fecha
          AND tipo_operacion = 'E'
          AND r_vfirmado IS NULL
          AND numero_rdi IS NULL;

        GET DIAGNOSTICS v_cantidad = ROW_COUNT;


    ELSIF p_origen = 'TRANS_BOLETO' THEN

        UPDATE public.mve_transventa
        SET numero_rdi = v_numero_rdi
        WHERE id_usuario = p_id_usuario
          AND documento_id = p_documento_id
          AND periodo = v_periodo
          AND r_cod = '03'
          AND r_fecemi = p_fecha
          AND tipo_operacion = 'B'
          AND r_vfirmado IS NULL
          AND numero_rdi IS NULL;

        GET DIAGNOSTICS v_cantidad = ROW_COUNT;

    END IF;


    ------------------------------------------------------------------
    -- Seguridad adicional.
    --
    -- Teóricamente no debería ocurrir porque previamente contamos
    -- documentos y tenemos bloqueo transaccional.
    --
    -- Si por alguna razón no se asignó ninguno, eliminar la cabecera.
    ------------------------------------------------------------------

    IF COALESCE(v_cantidad, 0) = 0 THEN

        DELETE FROM public.mve_rdi_sunat
        WHERE id_usuario = p_id_usuario
          AND documento_id = p_documento_id
          AND fecha = p_fecha
          AND secuencia = v_secuencia;

        RETURN QUERY
        SELECT
            false,
            NULL::varchar,
            NULL::integer,
            0,
            'No fue posible asignar comprobantes al Resumen Diario'::varchar;

        RETURN;

    END IF;


    ------------------------------------------------------------------
    -- Resultado
    ------------------------------------------------------------------

    RETURN QUERY
    SELECT
        true,
        v_numero_rdi,
        v_secuencia,
        v_cantidad,
        ('Resumen Diario creado correctamente con '
            || v_cantidad
            || ' comprobantes')::varchar;

END;

$BODY$;
```

# EJEMPLOS DE USO

## 1. Tienda / abarrotes

```sql
SELECT *
FROM public.fve_crear_resumen_diario(
    'usuario@gmail.com',
    '20601234567',
    '2026-09-07',
    'VENTA_COMERCIAL',
    NULL
);
```

Resultado esperado:

```text
creado     true
numero_rdi RC-20260907-001
secuencia  1
cantidad   187
mensaje    Resumen Diario creado correctamente con 187 comprobantes
```

Y las 187 boletas quedan:

```text
B001-0001201    RC-20260907-001
B001-0001202    RC-20260907-001
B001-0001203    RC-20260907-001
...
```

---

## 2. Encomiendas

```sql
SELECT *
FROM public.fve_crear_resumen_diario(
    'usuario@gmail.com',
    '20601234567',
    '2026-09-07',
    'TRANS_ENCOMIENDA',
    NULL
);
```

Si el resumen comercial ya consumió `001`:

```text
numero_rdi = RC-20260907-002
```

En `mve_transventa` solamente se seleccionan:

```text
r_cod = 03
tipo_operacion = E
```

---

## 3. Boletos de viaje

```sql
SELECT *
FROM public.fve_crear_resumen_diario(
    'usuario@gmail.com',
    '20601234567',
    '2026-09-07',
    'TRANS_BOLETO',
    NULL
);
```

Resultado:

```text
RC-20260907-003
```

Solo ingresarán registros:

```text
r_cod = 03
tipo_operacion = B
```

---

# IMPORTANTE: id_punto_venta

Por ahora el parámetro se guarda en la cabecera:

```sql
p_id_punto_venta
```

pero deliberadamente **no se utiliza como filtro de los comprobantes**.

Esto permite que:

```text
id_punto_venta = NULL
```

signifique:

> Crear un resumen consolidado de todos los puntos de venta.

Si posteriormente se decide trabajar por oficina, se puede agregar el filtro:

```sql
AND id_punto_venta = p_id_punto_venta
```

cuando el parámetro no sea NULL.

No agregar esa restricción hasta definir la política definitiva.

---

# CONCURRENCIA

La parte importante es:

```sql
PERFORM pg_advisory_xact_lock(
    hashtextextended(
        p_id_usuario
        || '|'
        || p_documento_id
        || '|RDI|'
        || to_char(p_fecha, 'YYYYMMDD'),
        0
    )
);
```

Esto hace que si dos usuarios intentan simultáneamente crear un resumen para:

```text
20601234567
07/09/2026
```

uno espere al otro.

El primero obtiene:

```text
RC-20260907-001
```

y cuando termina la transacción, el segundo encontrará:

```text
MAX(secuencia) = 1
```

por lo que generará:

```text
RC-20260907-002
```

No depende de Node para controlar el correlativo.

---

# FLUJO BACKEND POSTERIOR

La función solamente llega hasta:

```text
mve_rdi_sunat.estado = PENDIENTE
```

y deja los comprobantes vinculados:

```text
numero_rdi = RC-20260907-001
```

Después Node continuará:

```text
fve_crear_resumen_diario()
            ↓
RC-20260907-001
            ↓
consultar comprobantes del RC
            ↓
generar XML
            ↓
firmar XML
            ↓
crear ZIP
            ↓
estado = GENERADO
            ↓
enviar a SUNAT
            ↓
guardar ticket
            ↓
estado = ENVIADO
            ↓
consultar ticket
            ↓
CDR
      ┌─────┴─────┐
      ↓           ↓
 ACEPTADO     RECHAZADO
```

Para obtener los documentos del resumen comercial:

```sql
SELECT *
FROM public.mve_venta
WHERE id_usuario = $1
  AND documento_id = $2
  AND numero_rdi = $3
ORDER BY r_serie, r_numero;
```

Para transporte:

```sql
SELECT *
FROM public.mve_transventa
WHERE id_usuario = $1
  AND documento_id = $2
  AND numero_rdi = $3
ORDER BY r_serie, r_numero;
```

# PRINCIPIO IMPORTANTE

Node **no debe enviar una lista de boletas para luego crear el resumen**.

Debe solicitar:

```text
empresa + fecha + origen
```

y PostgreSQL decide transaccionalmente qué documentos estaban realmente disponibles:

```sql
r_vfirmado IS NULL
AND numero_rdi IS NULL
```

Eso evita que dos operadores incluyan accidentalmente la misma boleta en dos resúmenes diferentes.