# 08 --- Reglas de negocio y criterios de aceptación

## 1. Naturaleza de la tabla

`mve_transcaja` representa movimientos manuales de dinero del módulo
transporte.

No representa:

-   comprobantes de venta;
-   asientos contables;
-   cuentas por pagar;
-   tesorería formal;
-   caja física abierta/cerrada.

## 2. Tipos

Únicamente:

``` text
I = Ingreso
S = Salida
```

El importe siempre es positivo.

## 3. Primera versión

La primera UI trabaja con:

``` text
S = Salida
```

El usuario verá:

``` text
Salidas de dinero
```

No necesita ver un selector de tipo.

## 4. Ingresos futuros

La estructura debe permitir agregar posteriormente una UI:

``` text
Ingresos de dinero
```

sin modificar `mve_transcaja`.

## 5. Encomiendas

Los ingresos normales de encomiendas pertenecen a:

``` text
mve_transventa
```

No duplicarlos en `mve_transcaja`.

## 6. Consolidación

Combinar:

``` text
mve_transventa
mve_transcaja
```

mediante:

``` text
UNION ALL
```

## 7. registrado

Regla obligatoria:

``` text
1 = válido
0 = anulado
```

`registrado` es numérico.

No cambiar a BOOLEAN.

Puede utilizarse directamente:

``` sql
importe * registrado
```

## 8. Anulación

Una salida anulada:

``` text
registrado = 0
```

No se elimina físicamente.

Debe conservarse para histórico/auditoría operativa.

## 9. Motivos

Los motivos pertenecen a:

``` text
id_usuario
documento_id
```

Cada motivo tiene:

``` text
I o S
```

Un motivo de salida no puede utilizarse en un ingreso y viceversa.

## 10. Motivos inactivos

``` text
activo = 0
```

No aparecen para nuevos movimientos.

Los registros históricos continúan siendo válidos.

## 11. Forma de pago

Reutilizar:

``` text
mve_forma_pago
```

Ejemplos actuales:

``` text
01 Contado
02 Yape
03 Plin
```

No crear un catálogo nuevo.

No hardcodear códigos/nombres en React.

## 12. Número de operación

Opcional.

No debe bloquear una salida en contado.

## 13. Punto de venta

Todo movimiento pertenece a un punto de venta.

Respetar permisos existentes.

No permitir que un invitado opere puntos no autorizados.

## 14. Usuario

Registrar `id_invitado` desde el contexto del usuario autenticado.

No pedirlo manualmente.

## 15. Periodo

Respetar:

``` text
AAAA-MM
```

y la lógica existente del sistema.

La PK incluye `periodo`.

## 16. PK completa

Siempre trabajar con:

``` text
id_usuario
documento_id
periodo
id_movimiento
```

No asumir que `id_movimiento` es globalmente único.

## 17. Correlativo

Generar `id_movimiento` en backend/BD.

Debe ser seguro ante concurrencia.

No usar una estrategia insegura desde frontend.

## 18. Importe

Debe cumplir:

``` text
importe > 0
```

No guardar salidas negativas.

El tipo determina el signo en reportes.

## 19. Edición

No permitir edición normal de:

``` text
registrado = 0
```

## 20. Eliminación

No implementar DELETE físico desde la UI.

La acción correcta es:

``` text
Anular
```

## 21. Arquitectura

Reutilizar la arquitectura actual.

No agregar:

-   DDD;
-   Clean Architecture;
-   repositorios adicionales;
-   capas innecesarias;

si no existen actualmente en el módulo.

## 22. No implementar todavía

Fuera de alcance:

``` text
apertura de caja
cierre de caja
arqueo
conciliación bancaria
caja chica formal
proveedores
cuentas por pagar
tesorería
contabilidad
asientos
transferencias entre cajas
aprobaciones
```

## 23. Criterios de aceptación --- motivos

Debe ser posible:

-   crear motivo;
-   listar motivos;
-   modificar nombre;
-   activar/desactivar;
-   filtrar por ingreso/salida;
-   utilizar únicamente motivos activos al crear movimientos.

## 24. Criterios de aceptación --- salida

Debe ser posible registrar una salida indicando:

``` text
fecha
punto
motivo
importe
forma de pago
```

y opcionalmente:

``` text
descripcion
nro_operacion
beneficiario
documento_beneficiario
```

Al crear:

``` text
tipo_movimiento = 'S'
registrado = 1
```

## 25. Criterios de aceptación --- edición

Una salida activa puede editarse.

Una salida anulada no debe editarse normalmente.

## 26. Criterios de aceptación --- anulación

Al anular:

``` text
registrado pasa de 1 a 0
```

El registro permanece en BD.

El importe deja de afectar los totales.

## 27. Criterios de aceptación --- consolidado

El sistema debe mostrar correctamente:

``` text
total ingresos
total salidas
neto
```

utilizando encomiendas + caja manual.

## 28. Criterios de aceptación --- filtros

Los totales y el listado deben respetar:

``` text
empresa
periodo
punto de venta
fecha/rango
```

## 29. Criterios de aceptación --- aislamiento SaaS

Un usuario no debe poder consultar/modificar registros pertenecientes a
otro:

``` text
id_usuario
documento_id
```

El acceso por punto debe respetar las reglas actuales.

## 30. Criterio final

La implementación debe ser pequeña, legible y coherente con el módulo
existente.

No resolver problemas futuros que todavía no forman parte del alcance.
