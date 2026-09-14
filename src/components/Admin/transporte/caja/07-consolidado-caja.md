# 07 --- Consolidado de caja

## Objetivo

Obtener ingresos, salidas y neto del módulo sin duplicar los ingresos de
encomiendas.

Fuentes:

``` text
mve_transventa → ingresos de encomiendas
mve_transcaja  → movimientos manuales
```

Combinar mediante:

``` text
UNION ALL
```

No crear una tabla adicional de movimientos consolidados.

## Regla principal

Las encomiendas permanecen solamente en:

``` text
mve_transventa
```

Los movimientos manuales permanecen solamente en:

``` text
mve_transcaja
```

No insertar automáticamente una copia del cobro de una encomienda en
`mve_transcaja`.

## Consulta conceptual

Antes de implementar, revisar los nombres reales de los campos de
`mve_transventa`, sus estados y la regla actual que determina una
encomienda válida/cobrada.

Ejemplo conceptual:

``` sql
SELECT
    r_fecemi AS fecha,
    id_punto_venta,
    'I'::char(1) AS tipo_movimiento,
    r_total AS importe,
    1 AS registrado,
    'ENCOMIENDA' AS origen
FROM mve_transventa
WHERE id_usuario = p_id_usuario
  AND documento_id = p_documento_id
  AND periodo = p_periodo
  AND tipo_operacion = 'E'

UNION ALL

SELECT
    fecha,
    id_punto_venta,
    tipo_movimiento,
    importe,
    registrado,
    'CAJA' AS origen
FROM mve_transcaja
WHERE id_usuario = p_id_usuario
  AND documento_id = p_documento_id
  AND periodo = p_periodo;
```

Este SQL es referencial.

No copiarlo sin verificar `mve_transventa`.

## registrado como multiplicador

Regla del proyecto:

``` text
registrado = 1 → válido
registrado = 0 → anulado
```

Los movimientos manuales pueden calcularse mediante:

``` sql
importe * registrado
```

No convertir `registrado` a BOOLEAN.

## Normalización del signo

El importe se almacena positivo.

Para calcular el valor firmado:

``` sql
CASE
    WHEN tipo_movimiento = 'I'
        THEN importe * registrado
    WHEN tipo_movimiento = 'S'
        THEN (importe * registrado) * -1
    ELSE 0
END
```

## Totales

Obtener:

``` text
total_ingresos
total_salidas
neto
```

Ejemplo conceptual:

``` sql
SELECT
    SUM(
        CASE
            WHEN tipo_movimiento = 'I'
            THEN importe * registrado
            ELSE 0
        END
    ) AS total_ingresos,

    SUM(
        CASE
            WHEN tipo_movimiento = 'S'
            THEN importe * registrado
            ELSE 0
        END
    ) AS total_salidas,

    SUM(
        CASE
            WHEN tipo_movimiento = 'I'
            THEN importe * registrado
            WHEN tipo_movimiento = 'S'
            THEN (importe * registrado) * -1
            ELSE 0
        END
    ) AS neto
FROM movimientos;
```

## Ejemplo

``` text
Encomiendas       + 2,850.00
Otro ingreso      +   100.00
Combustible       -   180.00
Estiba            -    50.00
Pago chofer       -   100.00
                  -----------
NETO                2,620.00
```

Si combustible fue anulado:

``` text
importe = 180
registrado = 0
```

entonces:

``` text
180 * 0 = 0
```

y deja de afectar el neto.

## Filtros

La consulta consolidada debe permitir:

``` text
id_usuario
documento_id
periodo
id_punto_venta
fecha_desde
fecha_hasta
```

Opcionalmente:

``` text
id_forma_pago
```

si se necesita analizar caja por medio de pago.

## Punto de venta

El neto debe poder calcularse por punto.

Ejemplo:

``` text
Punto A
Ingresos  2,850.00
Salidas     430.00
Neto      2,420.00
```

También debe ser posible consolidar varios puntos cuando los permisos
del usuario lo permitan.

## UNION ALL

Usar:

``` sql
UNION ALL
```

No usar:

``` sql
UNION
```

Dos movimientos legítimos pueden tener exactamente los mismos datos y no
deben eliminarse como duplicados.

## Rendimiento

Siempre filtrar por `periodo` cuando corresponda para aprovechar el
diseño particionado del sistema.

Evitar consultas generales sobre todos los periodos cuando el reporte
trabaja sobre un periodo concreto.

## Resumen frontend

Mostrar opcionalmente tarjetas/resumen:

``` text
INGRESOS
S/ X

SALIDAS
S/ Y

NETO
S/ Z
```

El resumen debe responder a los mismos filtros del listado.

Esto NO representa todavía un cierre formal de caja.
