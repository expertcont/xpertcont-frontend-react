# 04 --- CRUD de movimientos de caja

## Objetivo

Implementar el CRUD operativo de `mve_transcaja`.

La tabla soporta:

-   `I` = Ingreso
-   `S` = Salida

En la primera versión del frontend se trabajará principalmente con
`S = Salida`.

## Operaciones

Implementar:

-   listar movimientos;
-   obtener un movimiento;
-   crear movimiento;
-   modificar movimiento;
-   anular movimiento.

No realizar DELETE físico como operación normal.

## Identificación del registro

La PK completa es:

``` text
id_usuario
documento_id
periodo
id_movimiento
```

Nunca consultar, modificar o anular utilizando solamente
`id_movimiento`.

## Crear movimiento

Datos funcionales:

``` text
periodo
fecha
id_punto_venta
tipo_movimiento
id_motivo
descripcion
importe
id_forma_pago
nro_operacion
beneficiario
documento_beneficiario
```

Obtener del contexto actual, cuando corresponda:

``` text
id_usuario
documento_id
id_invitado
```

No solicitar `id_movimiento` al usuario.

Debe generarse automáticamente en backend/BD siguiendo el patrón seguro
existente del proyecto.

## Validaciones de creación

Obligatorios:

``` text
periodo
fecha
id_punto_venta
tipo_movimiento
id_motivo
importe
id_forma_pago
```

Reglas:

``` text
tipo_movimiento IN ('I','S')
importe > 0
registrado = 1 al crear
```

El motivo debe:

-   existir para `id_usuario` + `documento_id`;
-   estar activo;
-   corresponder al mismo `tipo_movimiento`.

Ejemplo inválido:

``` text
tipo_movimiento = I
id_motivo = COMB
```

si `COMB` corresponde a una salida.

## Forma de pago

Validar contra `mve_forma_pago`.

No hardcodear nombres de formas de pago.

`nro_operacion` es opcional.

## Punto de venta

Validar/reutilizar `mad_punto_venta`.

Respetar las reglas actuales del módulo para anfitrión, invitado y punto
autorizado.

## Modificar movimiento

Permitir modificar un movimiento únicamente cuando:

``` text
registrado = 1
```

Campos editables:

``` text
fecha
id_punto_venta
id_motivo
descripcion
importe
id_forma_pago
nro_operacion
beneficiario
documento_beneficiario
```

En la primera versión mantener fijo `tipo_movimiento` después de crear.

No permitir editar:

``` text
id_usuario
documento_id
periodo
id_movimiento
id_invitado
registrado
```

salvo procesos específicos del backend.

## Anular movimiento

Anular mediante:

``` sql
UPDATE mve_transcaja
SET registrado = 0
WHERE id_usuario = ...
  AND documento_id = ...
  AND periodo = ...
  AND id_movimiento = ...;
```

No borrar físicamente.

`registrado` sigue la regla:

``` text
1 = válido
0 = anulado
```

El sistema utiliza este valor como multiplicador en cálculos.

Ejemplo:

``` sql
importe * registrado
```

Un movimiento anulado debe aportar cero al total.

## Listado

Permitir filtros por:

``` text
periodo
id_punto_venta
tipo_movimiento
fecha_desde
fecha_hasta
id_motivo
id_forma_pago
registrado
```

Para la pantalla inicial:

``` text
tipo_movimiento = 'S'
```

Mostrar como mínimo:

``` text
Fecha
Punto de venta
Motivo
Descripción
Beneficiario
Forma de pago
Nro. operación
Importe
Usuario
Estado
```

## Estado visual

``` text
registrado = 1 → ACTIVO
registrado = 0 → ANULADO
```

Los anulados pueden mostrarse en históricos, pero deben quedar
visualmente diferenciados y sin edición normal.
