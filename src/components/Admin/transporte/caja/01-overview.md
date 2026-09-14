# 01 — Overview: Caja del módulo Transporte

## Objetivo

Implementar el manejo de movimientos manuales de dinero dentro del módulo:

```text
/transporte/encomienda
```

La nueva entidad principal será:

```text
mve_transcaja
```

Debe soportar:

```text
I = Ingreso
S = Salida
```

Inicialmente el frontend implementará solamente:

```text
Salidas de dinero
```

pero la estructura debe permitir agregar ingresos manuales posteriormente.

## Fuentes de movimientos

Los ingresos normales de encomiendas ya existen en:

```text
mve_transventa
```

NO deben duplicarse en `mve_transcaja`.

Por tanto:

```text
mve_transventa
    → ingresos generados por encomiendas

mve_transcaja
    → movimientos manuales
    → ingresos manuales
    → salidas manuales
```

Para obtener el movimiento consolidado:

```text
mve_transventa
       +
mve_transcaja
       ↓
   UNION ALL
       ↓
Ingresos / Salidas / Neto
```

## Alcance inicial

Implementar:

- tabla `mve_transcaja`;
- tabla `mve_transmotivo`;
- CRUD de motivos;
- CRUD de movimientos;
- anulación lógica;
- listado de salidas;
- formulario de salida;
- consulta consolidada;
- total ingresos;
- total salidas;
- neto.

## No implementar

Por ahora NO implementar:

- apertura de caja;
- cierre de caja;
- arqueo;
- caja chica formal;
- conciliación bancaria;
- proveedores;
- cuentas por pagar;
- tesorería;
- contabilidad;
- transferencias entre cajas;
- aprobación de gastos.

## Arquitectura

Antes de crear código revisar `/transporte/encomienda`.

Reutilizar la estructura actual de:

- componentes;
- hooks;
- servicios;
- controllers;
- routes;
- consultas PostgreSQL;
- manejo de errores;
- autenticación;
- estilos MUI.

NO agregar Clean Architecture, DDD ni capas nuevas innecesarias.

La implementación debe sentirse como una extensión natural del módulo existente.