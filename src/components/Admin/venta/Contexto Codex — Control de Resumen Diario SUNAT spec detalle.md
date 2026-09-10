# 8. FLUJO DE CREACIÓN DEL RESUMEN

El Resumen Diario es una cabecera común en:

```text
mve_rdi_sunat
```

pero los comprobantes que alimentan el resumen pueden provenir de distintas tablas dependiendo de `origen`.

Inicialmente existen dos fuentes:

```text
VENTA_COMERCIAL
    → public.mve_venta

TRANS_ENCOMIENDA
    → public.mve_transventa

TRANS_BOLETO
    → public.mve_transventa
```

Por lo tanto, NO asumir que todos los Resúmenes Diarios se construyen desde `mve_venta`.

---

## 8.1. Estructura de ventas comerciales

La tabla:

```sql
public.mve_venta
```

utiliza como clave primaria:

```text
id_usuario
documento_id
periodo
r_cod
r_serie
r_numero
elemento
```

y está particionada por:

```sql
PARTITION BY RANGE (periodo)
```

El campo:

```text
elemento
```

forma parte de la identidad real del comprobante dentro del modelo de ventas de Expertcont y debe respetarse en cualquier consulta o actualización individual.

Se agregará:

```sql
ALTER TABLE public.mve_venta
ADD COLUMN numero_rdi varchar(50);
```

No modificar el significado actual de:

```text
r_vfirmado
```

---

# 8.2. Estructura de transporte

El módulo de transporte utiliza:

```text
public.mve_transventa
```

y contiene tanto:

```text
tipo_operacion = 'E'
→ ENCOMIENDA
```

como:

```text
tipo_operacion = 'B'
→ BOLETO DE VIAJE
```

También debe agregarse:

```sql
ALTER TABLE public.mve_transventa
ADD COLUMN numero_rdi varchar(50);
```

Por tanto, `mve_transventa.numero_rdi` será la referencia entre cada boleta de transporte y:

```text
mve_rdi_sunat.numero_rdi
```

---

# 8.3. Regla para determinar documentos disponibles

Un documento puede incorporarse a un nuevo Resumen Diario solamente cuando:

```sql
r_cod = '03'
AND r_vfirmado IS NULL
AND numero_rdi IS NULL
```

Interpretación:

```text
r_cod = '03'
→ es una boleta

r_vfirmado IS NULL
→ no ha terminado un procesamiento individual SUNAT

numero_rdi IS NULL
→ no está comprometida con otro Resumen Diario
```

Esta condición es fundamental.

NO seleccionar únicamente por:

```sql
r_vfirmado IS NULL
```

porque una boleta podría encontrarse actualmente dentro de un Resumen Diario pendiente de procesamiento.

Ejemplo:

```text
B003-0004521

r_vfirmado = NULL
numero_rdi = RC-20260910-002
```

Esta boleta NO está disponible para otro resumen.

Ya pertenece a:

```text
RC-20260910-002
```

aunque SUNAT todavía no haya terminado de procesarlo.

---

# 8.4. Resumen de ENCOMIENDAS

Cuando:

```text
origen = TRANS_ENCOMIENDA
```

la fuente es:

```text
mve_transventa
```

y solamente deben seleccionarse:

```text
r_cod = '03'
tipo_operacion = 'E'
r_vfirmado IS NULL
numero_rdi IS NULL
```

Ejemplo conceptual:

```sql
SELECT *
FROM public.mve_transventa
WHERE id_usuario = p_id_usuario
  AND documento_id = p_documento_id
  AND periodo = v_periodo
  AND r_cod = '03'
  AND r_fecemi = p_fecha
  AND tipo_operacion = 'E'
  AND r_vfirmado IS NULL
  AND numero_rdi IS NULL
ORDER BY r_serie, r_numero, elemento;
```

Ejemplo de documentos encontrados:

```text
03-B003-0004521-1
03-B003-0004522-1
03-B003-0004523-1
03-B007-0001981-1
```

Supongamos que corresponde crear:

```text
RC-20260910-001
```

La función debe insertar primero la cabecera:

```text
mve_rdi_sunat

fecha        = 2026-09-10
secuencia    = 1
origen       = TRANS_ENCOMIENDA
numero_rdi   = RC-20260910-001
estado       = PENDIENTE
```

y posteriormente asignar:

```text
numero_rdi = RC-20260910-001
```

a las boletas encontradas.

Resultado:

```text
mve_transventa

B003-0004521 → RC-20260910-001
B003-0004522 → RC-20260910-001
B003-0004523 → RC-20260910-001
B007-0001981 → RC-20260910-001
```

La actualización debe realizarse dentro de la misma transacción que crea `mve_rdi_sunat`.

---

# 8.5. Resumen de BOLETOS DE VIAJE

Cuando:

```text
origen = TRANS_BOLETO
```

la fuente también es:

```text
mve_transventa
```

pero cambia el filtro:

```text
tipo_operacion = 'B'
```

Consulta conceptual:

```sql
SELECT *
FROM public.mve_transventa
WHERE id_usuario = p_id_usuario
  AND documento_id = p_documento_id
  AND periodo = v_periodo
  AND r_cod = '03'
  AND r_fecemi = p_fecha
  AND tipo_operacion = 'B'
  AND r_vfirmado IS NULL
  AND numero_rdi IS NULL
ORDER BY r_serie, r_numero, elemento;
```

Ejemplo:

```text
03-B013-0000821-1
03-B013-0000822-1
03-B013-0000823-1
```

Si previamente se creó:

```text
RC-20260910-001
→ TRANS_ENCOMIENDA
```

la siguiente secuencia general del día será:

```text
RC-20260910-002
→ TRANS_BOLETO
```

Resultado:

```text
mve_transventa

B013-0000821 → RC-20260910-002
B013-0000822 → RC-20260910-002
B013-0000823 → RC-20260910-002
```

---

# 8.6. Resumen de VENTAS COMERCIALES

Cuando:

```text
origen = VENTA_COMERCIAL
```

la fuente cambia a:

```text
public.mve_venta
```

Esta tabla está particionada por `periodo`.

Por tanto, obtener:

```sql
v_periodo := to_char(p_fecha, 'YYYY-MM');
```

y utilizarlo obligatoriamente en la consulta:

```sql
SELECT *
FROM public.mve_venta
WHERE id_usuario = p_id_usuario
  AND documento_id = p_documento_id
  AND periodo = v_periodo
  AND r_cod = '03'
  AND r_fecemi = p_fecha
  AND r_vfirmado IS NULL
  AND numero_rdi IS NULL
ORDER BY r_serie, r_numero, elemento;
```

Ejemplo para una tienda de abarrotes:

```text
03-B001-00018521-1
03-B001-00018522-1
03-B001-00018523-1
03-B002-00009211-1
...
```

Supongamos que anteriormente se generaron:

```text
RC-20260910-001 → TRANS_ENCOMIENDA
RC-20260910-002 → TRANS_BOLETO
```

Entonces el resumen comercial obtiene:

```text
RC-20260910-003
```

y las ventas quedan:

```text
mve_venta

B001-00018521 → RC-20260910-003
B001-00018522 → RC-20260910-003
B001-00018523 → RC-20260910-003
B002-00009211 → RC-20260910-003
```

---

# 8.7. Importancia de `elemento`

En `mve_venta`, `elemento` forma parte de la PK:

```text
(id_usuario,
 documento_id,
 periodo,
 r_cod,
 r_serie,
 r_numero,
 elemento)
```

Por tanto, NO asumir que:

```text
r_cod + r_serie + r_numero
```

es por sí solo la PK completa de `mve_venta`.

Cualquier operación dirigida a un comprobante individual debe conservar `elemento`.

Sin embargo, cuando se realiza una actualización masiva para asignar un RDI:

```sql
UPDATE public.mve_venta
SET numero_rdi = v_numero_rdi
WHERE id_usuario = p_id_usuario
  AND documento_id = p_documento_id
  AND periodo = v_periodo
  AND r_cod = '03'
  AND r_fecemi = p_fecha
  AND r_vfirmado IS NULL
  AND numero_rdi IS NULL;
```

no es necesario proporcionar explícitamente `elemento`, porque se pretende actualizar todos los registros que satisfagan la condición.

NO modificar `elemento`.

---

# 8.8. Proceso transaccional completo

Para cualquier origen, el proceso debe ser atómico:

```text
BEGIN
  │
  ├── bloquear empresa + fecha para creación RDI
  │
  ├── determinar documentos disponibles
  │
  ├── si cantidad = 0
  │       └── terminar sin crear RDI
  │
  ├── obtener siguiente secuencia
  │
  ├── construir RC-YYYYMMDD-NNN
  │
  ├── insertar mve_rdi_sunat
  │
  ├── asignar numero_rdi a documentos origen
  │
  └── retornar resultado
COMMIT
```

Ejemplo:

```text
Empresa: 20601234567
Fecha:   2026-09-10
Origen:  TRANS_ENCOMIENDA
```

PostgreSQL encuentra:

```text
48 boletas disponibles
```

genera:

```text
RC-20260910-001
```

crea:

```text
mve_rdi_sunat
────────────────────────────────
RC-20260910-001
TRANS_ENCOMIENDA
PENDIENTE
48 documentos
```

y asigna las 48 boletas:

```text
numero_rdi = RC-20260910-001
```

Todo debe ocurrir dentro de la misma transacción.

Si ocurre una excepción antes de finalizar:

```text
ROLLBACK
```

y debe quedar:

```text
sin cabecera RDI
+
sin boletas asignadas parcialmente
```

---

# 8.9. Node NO debe decidir qué boletas pertenecen al resumen

El frontend/backend puede solicitar:

```json
{
  "id_usuario": "...",
  "documento_id": "20601234567",
  "fecha": "2026-09-10",
  "origen": "TRANS_ENCOMIENDA"
}
```

pero NO debe enviar:

```json
{
  "boletas": [
    "B003-4521",
    "B003-4522",
    "B003-4523"
  ]
}
```

como fuente de verdad para crear automáticamente el lote completo.

PostgreSQL debe determinar los documentos disponibles utilizando:

```sql
r_vfirmado IS NULL
AND numero_rdi IS NULL
```

dentro de la misma operación que crea el RDI.

De esta manera PostgreSQL controla la concurrencia y evita que una misma boleta termine asociada a dos resúmenes.

---

# 8.10. Ejemplo del día completo

Una misma empresa podría terminar el día con:

```text
10/09/2026

RC-20260910-001
origen = TRANS_ENCOMIENDA
48 boletas

RC-20260910-002
origen = TRANS_BOLETO
326 boletas

RC-20260910-003
origen = VENTA_COMERCIAL
187 boletas
```

Todos comparten la secuencia diaria de la empresa.

No existe una secuencia independiente por origen.

Por tanto:

```text
TRANS_ENCOMIENDA → 001
TRANS_BOLETO     → 002
VENTA_COMERCIAL  → 003
```

es válido.

Si posteriormente aparecen otras boletas comerciales pendientes del mismo día:

```text
RC-20260910-004
origen = VENTA_COMERCIAL
```

---

# 8.11. Consulta posterior de documentos del RDI

Para un resumen comercial:

```sql
SELECT *
FROM public.mve_venta
WHERE id_usuario = p_id_usuario
  AND documento_id = p_documento_id
  AND periodo = to_char(p_fecha, 'YYYY-MM')
  AND numero_rdi = p_numero_rdi
ORDER BY r_serie, r_numero, elemento;
```

Para encomiendas:

```sql
SELECT *
FROM public.mve_transventa
WHERE id_usuario = p_id_usuario
  AND documento_id = p_documento_id
  AND periodo = to_char(p_fecha, 'YYYY-MM')
  AND numero_rdi = p_numero_rdi
  AND tipo_operacion = 'E'
ORDER BY r_serie, r_numero, elemento;
```

Para boletos:

```sql
SELECT *
FROM public.mve_transventa
WHERE id_usuario = p_id_usuario
  AND documento_id = p_documento_id
  AND periodo = to_char(p_fecha, 'YYYY-MM')
  AND numero_rdi = p_numero_rdi
  AND tipo_operacion = 'B'
ORDER BY r_serie, r_numero, elemento;
```

Estas consultas serán las que posteriormente permitan al backend construir el XML del Resumen Diario.