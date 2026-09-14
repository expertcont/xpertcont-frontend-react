# 06 --- Frontend: Salidas de dinero

## Objetivo

Agregar al módulo `/transporte/encomienda` una interfaz simple para
registrar y consultar salidas de dinero.

Nombre visible inicial:

``` text
Salidas de dinero
```

Aunque `mve_transcaja` soporta ingresos y salidas, esta pantalla
trabajará inicialmente con:

``` text
tipo_movimiento = 'S'
```

No mostrar al usuario un selector Ingreso/Salida en esta primera
versión.

## Integración visual

Revisar primero los componentes existentes de `/transporte/encomienda`.

Reutilizar:

-   MUI;
-   componentes personalizados;
-   estilos;
-   tablas/listados;
-   botones;
-   modales/drawers;
-   validaciones;
-   hooks;
-   servicios API;
-   manejo de teclado;
-   responsive existente.

No crear un diseño visual ajeno al módulo.

## Pantalla principal

Título:

``` text
Salidas de dinero
```

Acción principal:

``` text
+ Nueva salida
```

Mostrar resumen superior si ya está disponible la consulta consolidada:

``` text
Ingresos
Salidas
Neto
```

## Filtros iniciales

Mantenerlos simples:

``` text
Fecha / rango
Motivo
Forma de pago
```

Mostrar selector de punto de venta únicamente cuando corresponda según
permisos actuales.

## Columnas

Mostrar como mínimo:

``` text
Fecha
Motivo
Descripción
Beneficiario
Forma de pago
Nro. operación
Importe
Estado
Acciones
```

Agregar `Punto de venta` cuando sea necesario.

## Formulario

Título:

``` text
Registrar salida de dinero
```

Campos:

``` text
Fecha
Punto de venta
Motivo
Descripción
Importe
Forma de pago
Número de operación
Beneficiario
Documento beneficiario
```

No mostrar:

``` text
id_movimiento
tipo_movimiento
id_usuario
documento_id
id_invitado
registrado
```

Enviar internamente:

``` text
tipo_movimiento = 'S'
```

## Fecha

Valor inicial:

``` text
fecha/hora actual
```

Respetar el periodo de trabajo existente.

## Punto de venta

Reutilizar la selección/autorización actual.

Si el empleado tiene un único punto autorizado, seleccionarlo
automáticamente si ese es el comportamiento actual del módulo.

No permitir selección de puntos no autorizados.

## Motivo

Cargar desde backend:

``` text
tipo_movimiento = 'S'
activo = 1
```

Mostrar:

``` text
nombre
```

Guardar:

``` text
id_motivo
```

No hardcodear motivos.

## Importe

Campo numérico.

Reglas:

``` text
> 0
máximo 2 decimales en UI
```

No permitir cero ni negativos.

## Forma de pago

Cargar desde:

``` text
mve_forma_pago
```

Ejemplos existentes:

``` text
01 Contado
02 Yape
03 Plin
...
```

Mostrar nombre y guardar `id_forma_pago`.

No hardcodear códigos/nombres.

## Número de operación

Opcional.

Puede mostrarse siempre en la primera versión.

Si el proyecto ya utiliza `mve_forma_pago.deposito` para decidir cuándo
solicitar referencia, reutilizar esa lógica.

## Beneficiario

Campos opcionales:

``` text
Beneficiario
Documento
```

Entrada manual.

No crear maestro de proveedores/beneficiarios.

## Guardar

Antes de enviar:

-   validar importe;
-   validar motivo;
-   validar forma de pago;
-   validar punto de venta;
-   evitar doble submit.

Después de guardar correctamente:

-   informar éxito usando el patrón actual;
-   refrescar listado;
-   refrescar resumen;
-   limpiar/cerrar formulario según UX existente.

## Editar

Permitir únicamente cuando:

``` text
registrado = 1
```

Mantener `tipo_movimiento = 'S'`.

## Anular

Acción visible:

``` text
Anular
```

No usar "Eliminar" si la operación realmente cambia `registrado` a 0.

Solicitar confirmación:

``` text
¿Desea anular esta salida de dinero?
```

Después de confirmar:

``` text
registrado = 0
```

Refrescar listado y resumen.

## Anulados

Mostrar visualmente:

``` text
ANULADO
```

No permitir edición normal.

El importe anulado no participa en totales.

## Responsive

La funcionalidad debe continuar siendo usable desde celular, ya que el
módulo de encomiendas puede operarse desde distintos dispositivos.

Mantener el comportamiento responsive existente.
