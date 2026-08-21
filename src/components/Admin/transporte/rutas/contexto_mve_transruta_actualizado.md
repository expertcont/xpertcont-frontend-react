# Contexto y diseño — `mve_transruta`

## 1. Contexto funcional

El módulo de transporte de Expercont manejará dos tipos de operaciones:

- **E = Encomienda**
- **B = Boleto de viaje**

Ambas operaciones utilizan una ruta de transporte definida por un punto de venta de origen y un punto de venta de destino.

La ruta representa principalmente el **trayecto entre oficinas/puntos de venta**, no el tipo de operación.

### Regla sobre `precio_pasaje`

Todas las rutas pueden utilizarse para **encomiendas**, independientemente de que `precio_pasaje` sea cero o mayor que cero.

En las encomiendas:

- La ruta determina el origen y destino.
- El precio de la encomienda **no se obtiene de la ruta**.
- El precio se determina al emitir la encomienda, según el bulto, cantidad y criterio de la oficina.
- Una ruta con `precio_pasaje = 0` sigue siendo completamente válida para encomiendas.

En los boletos:

- La ruta determina el origen y destino.
- `precio_pasaje` representa la tarifa fija del pasaje.
- El aplicativo de boletos puede filtrar `precio_pasaje > 0` para mostrar las rutas con tarifa configurada.

Por tanto:

> `precio_pasaje = 0` NO significa que la ruta sea exclusiva para encomiendas. Significa que actualmente no tiene una tarifa fija de pasaje configurada.

## 2. Arquitectura conceptual

```text
mad_punto_venta
       |
       | origen / destino
       v
mve_transruta
       |
       | id_ruta
       v
mve_transventa
       |
       +-- E = Encomienda
       |
       +-- B = Boleto
```

### `mad_punto_venta`

Representa una oficina o punto operativo concreto. Un punto de venta no necesariamente equivale a una ciudad; pueden existir varios puntos dentro del mismo ubigeo.

### `mve_transruta`

Representa un trayecto entre dos puntos de venta.

### `mve_transventa`

Es la tabla transaccional donde se registran las encomiendas y boletos.

La operación conserva sus propios datos de origen y destino para facilitar las consultas operativas, especialmente la localización de encomiendas pendientes de entrega en una oficina.

## 3. Diseño SaaS

Las tablas están aisladas por:

```text
id_usuario
documento_id
```

`id_usuario` identifica al usuario/anfitrión y `documento_id` identifica la empresa dentro del SaaS.

Por ello, las claves primarias de los catálogos consideran ambos campos.

---

# 4. Tabla `mve_transruta`

## Propósito

Catálogo de rutas o trayectos de transporte disponibles para una empresa.

Una ruta relaciona:

- punto de venta de origen;
- punto de venta de destino;
- nombre descriptivo;
- precio fijo del pasaje, cuando corresponda.

No contiene información específica de una encomienda ni de un boleto emitido.

## Estructura

```sql
CREATE TABLE public.mve_transruta (
    id_usuario              VARCHAR(20) NOT NULL,
    documento_id            VARCHAR(20) NOT NULL,

    id_ruta                 VARCHAR(15) NOT NULL,

    id_punto_venta          VARCHAR(10) NOT NULL,
    id_punto_venta_dest     VARCHAR(10) NOT NULL,

    nombre                  VARCHAR(100) NOT NULL,

    precio_pasaje           NUMERIC(14,2) NOT NULL DEFAULT 0,

    activo                  BOOLEAN NOT NULL DEFAULT TRUE,

    ctrl_crea               TIMESTAMP(5) WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ctrl_crea_us            VARCHAR(50),

    ctrl_mod                TIMESTAMP(5) WITHOUT TIME ZONE,
    ctrl_mod_us             VARCHAR(50),

    CONSTRAINT mve_transruta_pkey
        PRIMARY KEY (
            id_usuario,
            documento_id,
            id_ruta
        )
);
```

## Descripción de campos

| Campo | Uso |
|---|---|
| `id_usuario` | Tenant/usuario propietario del catálogo. |
| `documento_id` | Empresa a la que pertenece la ruta. |
| `id_ruta` | Código único de la ruta dentro de la empresa. |
| `id_punto_venta` | Punto de venta de origen. |
| `id_punto_venta_dest` | Punto de venta de destino. |
| `nombre` | Nombre visible de la ruta. |
| `precio_pasaje` | Tarifa fija del pasaje. No representa el precio de una encomienda. |
| `activo` | Habilita/deshabilita la ruta sin eliminarla. |
| `ctrl_crea` | Fecha/hora de creación. |
| `ctrl_crea_us` | Usuario que creó el registro. |
| `ctrl_mod` | Fecha/hora de última modificación. |
| `ctrl_mod_us` | Usuario que modificó el registro. |

## 5. Regla de `precio_pasaje`

### Encomiendas

No se utiliza `precio_pasaje` para calcular la venta.

Ejemplo:

```text
Ruta: AREQUIPA → PEDREGAL
precio_pasaje = 13.00

Encomienda:
Bulto = Caja
Cantidad = 1
Precio = 20.00
```

El precio de la encomienda es independiente del precio del pasaje.

También es válido:

```text
Ruta: AREQUIPA → VITOR
precio_pasaje = 0.00
```

y utilizarla para registrar una encomienda.

### Boletos

Para la emisión de boletos, el aplicativo puede consultar:

```sql
SELECT
    id_ruta,
    id_punto_venta,
    id_punto_venta_dest,
    nombre,
    precio_pasaje
FROM mve_transruta
WHERE id_usuario = $1
  AND documento_id = $2
  AND activo = TRUE
  AND precio_pasaje > 0
ORDER BY nombre;
```

Esto permite presentar únicamente rutas con tarifa de pasajero configurada.

## 6. Ejemplo de datos

```text
id_ruta          origen  destino  nombre                         precio
AQP.PEDR         1002    1001     AREQUIPA - PEDREGAL             13.00
PEDR.AQP         1001    1002     PEDREGAL - AREQUIPA             13.00
AQP.VITOR        1002    1003     AREQUIPA - VITOR                 0.00
AQP.LAJOYA       1002    1005     AREQUIPA - LA JOYA               0.00
AQP.PEDR-OVALO   1002    1004     AREQUIPA - PEDREGAL OVALO        0.00
```

Todas son rutas válidas para encomiendas.

Solo las que tengan una tarifa de pasaje mayor que cero estarán disponibles para la selección normal de boletos.

## 7. Relación con `mad_punto_venta`

La ruta no duplica los datos del punto de venta:

```text
mve_transruta
    |
    +-- id_punto_venta ------> mad_punto_venta
    |
    +-- id_punto_venta_dest --> mad_punto_venta
```

`mad_punto_venta` mantiene nombre, dirección, ubigeo, país y demás datos propios de la oficina.

La ruta almacena únicamente los códigos de los puntos involucrados.

## 8. Decisiones de diseño

### No agregar `tipo_operacion` a la ruta

No se agrega `tipo_operacion = E/B`, porque todas las rutas pueden utilizarse para encomiendas y algunas además tienen tarifa fija para boletos.

La operación se determina en `mve_transventa`.

### No crear un precio específico para encomienda

No se agrega `precio_encomienda` a la ruta.

El valor de la encomienda depende de la operación realizada y de los criterios de la oficina.

### No eliminar rutas con precio cero

`precio_pasaje = 0` es un estado válido del catálogo y no invalida la ruta para encomiendas.

### No duplicar nombre de origen/destino

El nombre de la ruta es suficiente para presentación. Los datos oficiales de los puntos de venta se mantienen en `mad_punto_venta`.

## 9. Flujo final

```text
                 mad_punto_venta
                 /             \
                /               \
           ORIGEN               DESTINO
              \                   /
               \                 /
                └── mve_transruta
                         |
                    id_ruta
                         |
                         v
                  mve_transventa
                    /         \
                   /           \
            E Encomienda     B Boleto
                 |               |
          precio propio      precio_pasaje
          de la operación    de la ruta
```

Este diseño mantiene el módulo de transporte simple, permite reutilizar las mismas rutas para encomiendas y boletos y evita introducir campos que no representan una regla real del negocio.


