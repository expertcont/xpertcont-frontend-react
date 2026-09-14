# 03 — CRUD de motivos

## Objetivo

Administrar el catálogo:

```text
mve_transmotivo
```

Cada empresa puede definir sus propios motivos de ingreso/salida.

## Listar

Consultar por:

```text
id_usuario
documento_id
tipo_movimiento
activo
```

Para registrar salidas:

```text
tipo_movimiento = 'S'
activo = 1
```

Orden sugerido:

```sql
ORDER BY nombre
```

## Crear

Datos:

```text
id_motivo
tipo_movimiento
nombre
```

Guardar inicialmente:

```text
activo = 1
```

Validar:

```text
id_motivo requerido
nombre requerido
tipo_movimiento IN ('I','S')
```

No permitir PK duplicada.

## Modificar

Permitir modificar:

```text
nombre
activo
```

No modificar normalmente:

```text
id_motivo
```

Si el motivo ya tiene movimientos asociados, evitar cambiar:

```text
tipo_movimiento
```

## Desactivar

No eliminar físicamente.

Usar:

```sql
activo = 0
```

Un motivo inactivo:

- no aparece en nuevos movimientos;
- continúa existiendo para históricos.

## Backend

Seguir el patrón existente del proyecto.

Se necesitan operaciones equivalentes a:

```text
listar
crear
actualizar
activar/desactivar
```

No imponer una convención nueva de endpoints si el backend ya utiliza otra.

## Frontend

Crear mantenimiento simple de motivos.

Campos:

```text
Código
Nombre
Tipo
Activo
```

Tipos:

```text
Ingreso
Salida
```

No sobrecargar esta pantalla con funcionalidad adicional.