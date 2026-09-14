# 02 — Base de datos

## Tabla `mve_transcaja`

Crear:

```sql
CREATE TABLE public.mve_transcaja (
    id_usuario VARCHAR(50) NOT NULL,
    documento_id VARCHAR(20) NOT NULL,
    periodo VARCHAR(7) NOT NULL,

    id_movimiento BIGINT NOT NULL,

    fecha TIMESTAMP WITHOUT TIME ZONE
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    id_punto_venta VARCHAR(20) NOT NULL,

    tipo_movimiento CHAR(1) NOT NULL,

    id_motivo VARCHAR(10) NOT NULL,
    descripcion VARCHAR(200),

    importe NUMERIC(14,2) NOT NULL,

    id_forma_pago VARCHAR(5) NOT NULL,
    nro_operacion VARCHAR(50),

    beneficiario VARCHAR(100),
    documento_beneficiario VARCHAR(20),

    id_invitado VARCHAR(50),

    registrado INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT mve_transcaja_pkey
        PRIMARY KEY (
            id_usuario,
            documento_id,
            periodo,
            id_movimiento
        ),

    CONSTRAINT mve_transcaja_importe_check
        CHECK (importe > 0),

    CONSTRAINT mve_transcaja_tipo_check
        CHECK (tipo_movimiento IN ('I', 'S')),

    CONSTRAINT mve_transcaja_registrado_check
        CHECK (registrado IN (0, 1))
);
```

## PK

La PK es:

```text
id_usuario
documento_id
periodo
id_movimiento
```

Nunca identificar un movimiento solamente mediante `id_movimiento`.

## id_movimiento

Representa el correlativo interno del movimiento.

NO representa una caja física.

Debe generarse en backend/BD de manera segura.

No generar desde React.

No utilizar un `MAX() + 1` inseguro ante concurrencia.

Reutilizar el patrón existente del proyecto para correlativos.

## tipo_movimiento

```text
I = Ingreso
S = Salida
```

El importe siempre se almacena positivo.

Ejemplo:

```text
S | COMB | 150.00
```

No almacenar:

```text
S | COMB | -150.00
```

## registrado

Regla importante del proyecto:

```text
1 = registrado / válido
0 = anulado
```

NO utilizar BOOLEAN.

La anulación se realiza:

```sql
registrado = 0
```

El campo puede utilizarse directamente como multiplicador en cálculos.

Ejemplo:

```sql
importe * registrado
```

Un movimiento activo:

```text
150.00 * 1 = 150.00
```

Un movimiento anulado:

```text
150.00 * 0 = 0.00
```

NO eliminar físicamente movimientos históricos.

---

## Tabla `mve_transmotivo`

Crear:

```sql
CREATE TABLE public.mve_transmotivo (
    id_usuario VARCHAR(50) NOT NULL,
    documento_id VARCHAR(20) NOT NULL,

    id_motivo VARCHAR(10) NOT NULL,
    tipo_movimiento CHAR(1) NOT NULL,

    nombre VARCHAR(100) NOT NULL,

    activo INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT mve_transmotivo_pkey
        PRIMARY KEY (
            id_usuario,
            documento_id,
            id_motivo
        ),

    CONSTRAINT mve_transmotivo_tipo_check
        CHECK (tipo_movimiento IN ('I', 'S')),

    CONSTRAINT mve_transmotivo_activo_check
        CHECK (activo IN (0, 1))
);
```

## Motivos iniciales sugeridos

```text
COMB | S | Combustible
CHO  | S | Pago a chofer
EST  | S | Estiba / carga
MOV  | S | Movilidad
MANT | S | Mantenimiento
ALI  | S | Alimentación
DEV  | S | Devolución
OFI  | S | Gastos de oficina
OTRS | S | Otros
```

Preparar también soporte futuro:

```text
AJUI | I | Ajuste de ingreso
OTRI | I | Otros ingresos
```

No hardcodear estos valores en React.

---

## Forma de pago existente

Reutilizar:

```sql
mve_forma_pago
```

Actualmente utiliza códigos como:

```text
01 | Contado
02 | Yape
03 | Plin
...
```

No crear otro catálogo.

`mve_transcaja.id_forma_pago` almacena:

```text
mve_forma_pago.id_forma_pago
```

`nro_operacion` es opcional.

Ejemplo:

```text
01 Contado
nro_operacion = NULL

02 Yape
nro_operacion = '458921'
```

---

## Punto de venta

Reutilizar:

```text
mad_punto_venta
```

Todo movimiento debe pertenecer a un:

```text
id_punto_venta
```

Respetar la lógica existente de punto autorizado por usuario.