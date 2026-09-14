# 05 --- Backend / API

## Objetivo

Agregar al backend las operaciones necesarias para motivos y movimientos
de caja, respetando la arquitectura actual del proyecto.

Antes de crear archivos:

1.  revisar las rutas existentes del módulo transporte;
2.  revisar controllers/services actuales;
3.  revisar cómo se ejecutan consultas PostgreSQL;
4.  revisar validaciones y respuestas;
5.  reutilizar el mismo patrón.

No crear una arquitectura paralela.

## API de motivos

Se requieren operaciones equivalentes a:

``` text
LISTAR
CREAR
MODIFICAR
ACTIVAR / DESACTIVAR
```

Rutas conceptuales:

``` text
GET    /transporte/motivos
POST   /transporte/motivos
PUT    /transporte/motivos/:id_motivo
PATCH  /transporte/motivos/:id_motivo/estado
```

Estas rutas son referenciales.

Si el proyecto utiliza otra convención, seguir la existente.

## Listar motivos

Filtros:

``` text
id_usuario
documento_id
tipo_movimiento
activo
```

Para el formulario de salidas:

``` text
tipo_movimiento = 'S'
activo = 1
```

## API de caja

Operaciones equivalentes:

``` text
LISTAR
OBTENER
CREAR
MODIFICAR
ANULAR
```

Rutas conceptuales:

``` text
GET    /transporte/caja
GET    /transporte/caja/:id_movimiento
POST   /transporte/caja
PUT    /transporte/caja/:id_movimiento
PATCH  /transporte/caja/:id_movimiento/anular
```

Adaptar al patrón real del backend.

## Seguridad SaaS

Todas las operaciones deben aislar correctamente por:

``` text
id_usuario
documento_id
periodo
```

y, cuando corresponda:

``` text
id_punto_venta
```

No confiar únicamente en `id_movimiento`.

No permitir que un invitado modifique movimientos pertenecientes a otra
empresa o punto no autorizado.

Reutilizar la lógica actual de permisos.

## Crear

El backend debe resolver/validar:

``` text
id_usuario
documento_id
id_invitado
periodo
id_punto_venta
```

según la arquitectura existente.

Generar `id_movimiento` de forma segura.

Insertar inicialmente:

``` text
registrado = 1
```

## Modificar

Actualizar usando PK completa:

``` text
id_usuario
documento_id
periodo
id_movimiento
```

Agregar condición:

``` text
registrado = 1
```

para impedir modificación normal de anulados.

## Anular

No DELETE.

Ejecutar actualización:

``` text
registrado = 0
```

La respuesta debe seguir el formato estándar del backend.

## Errores

Manejar como mínimo:

-   movimiento inexistente;
-   movimiento ya anulado;
-   motivo inexistente;
-   motivo inactivo;
-   motivo incompatible con tipo;
-   forma de pago inválida;
-   importe \<= 0;
-   punto de venta no válido;
-   acceso no autorizado.

No exponer errores internos de PostgreSQL directamente al usuario.

## Transacciones

Si una operación requiere varias consultas dependientes, utilizar
transacción PostgreSQL.

No dejar registros parcialmente procesados.

## SQL

Utilizar consultas parametrizadas.

No concatenar valores provenientes del frontend directamente dentro del
SQL.

## Reutilización

Si ya existen helpers para:

-   conexión PostgreSQL;
-   transacciones;
-   respuestas HTTP;
-   validación de sesión;
-   resolución de `documento_id`;
-   resolución de punto de venta;

reutilizarlos.
