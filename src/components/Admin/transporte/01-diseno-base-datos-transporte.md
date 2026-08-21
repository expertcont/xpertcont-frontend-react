# Diseño de Base de Datos — Módulo Transporte Expercont

## 1. Objetivo

Definir el modelo de datos inicial del módulo Transporte de Expercont SaaS.

El modelo debe soportar dos tipos de operación:

- `B` = Boleto de viaje.
- `E` = Encomienda.

Ambos tipos de operación se almacenarán en la misma tabla:

`public.mve_transventa`

Cada operación contiene un solo servicio/detalle, por lo que no se requiere una tabla de detalle independiente.

El diseño debe ser simple, plano y de lectura inmediata.

---

## 2. Tabla principal

Tabla:

`public.mve_transventa`

Características:

- Multiusuario mediante `id_usuario`.
- Particionada por `periodo`.
- Una fila representa una operación comercial de transporte.
- Una operación tiene un único servicio/detalle.
- `tipo_operacion` distingue boleto y encomienda.

---

## 3. Clave primaria

La clave primaria será:

```sql
PRIMARY KEY (
    id_usuario,
    documento_id,
    periodo,
    r_cod,
    r_serie,
    r_numero,
    elemento
)
```

La combinación identifica de manera única cada elemento de una operación dentro del contexto del usuario y período.

---

## 4. Particionamiento

La tabla será particionada mediante:

```sql
PARTITION BY RANGE (periodo)
```

`periodo` utilizará el formato:

```text
YYYY-MM
```

Ejemplo:

```text
2026-08
```

Las particiones deberán existir antes de insertar registros correspondientes al período.

La estrategia concreta de creación, mantenimiento y apertura de particiones se definirá en la implementación de base de datos.

---

## 5. Estructura de la tabla

```sql
CREATE TABLE public.mve_transventa (
    -- ============================================================
    -- IDENTIFICACIÓN
    -- ============================================================

    id_usuario              VARCHAR(20) NOT NULL,
    documento_id            VARCHAR(20) NOT NULL,
    periodo                 VARCHAR(7)  NOT NULL,

    r_cod                   CHAR(2)     NOT NULL,
    r_serie                 CHAR(4)     NOT NULL,
    r_numero                VARCHAR(10) NOT NULL,
    elemento                INTEGER     NOT NULL,
    r_fecemi                DATE        NOT NULL,

    tipo_operacion          CHAR(1)     NOT NULL,
    -- B = Boleto
    -- E = Encomienda


    -- ============================================================
    -- REFERENCIA - NOTA DE CRÉDITO
    -- ============================================================

    r_cod_ref               CHAR(2),
    r_serie_ref             CHAR(4),
    r_numero_ref            VARCHAR(10),
    r_fecemi_ref            DATE,


    -- ============================================================
    -- CLIENTE
    -- ============================================================

    id_documento            VARCHAR(2),
    cliente                 VARCHAR(100),
    cliente_documento       VARCHAR(20),
    cliente_telefono        VARCHAR(20),


    -- ============================================================
    -- TRANSPORTE
    -- ============================================================


    id_ruta             VARCHAR(15),
    descripcion             VARCHAR(100),

    id_punto_venta          VARCHAR(10),
    id_punto_venta_dest     VARCHAR(10),

    placa                   VARCHAR(10),
    licencia                VARCHAR(20),


    -- ============================================================
    -- BOLETO DE VIAJE
    -- ============================================================

    asiento                 VARCHAR(10),
    pasajero_edad           INTEGER,


    -- ============================================================
    -- ENCOMIENDA
    -- ============================================================

    destinatario            VARCHAR(100),
    destinatario_documento  VARCHAR(20),
    destinatario_telefono   VARCHAR(20),
    destinatario_direccion  VARCHAR(100),

    -- Datos de control de entrega
    entrega_fecha           DATE,
    entrega_documento       VARCHAR(20),
    entrega_nombres         VARCHAR(100),
    entrega_ctrl_us         VARCHAR(50),


    -- ============================================================
    -- IMPORTES
    -- ============================================================

    cantidad                NUMERIC(14,3),
    precio_unitario         NUMERIC(14,2),
    precio_neto             NUMERIC(14,2),

    r_gravado               NUMERIC(14,2) DEFAULT 0,
    r_exonerado             NUMERIC(14,2) DEFAULT 0,
    r_igv                   NUMERIC(14,2) DEFAULT 0,
    r_monto_total           NUMERIC(14,2) DEFAULT 0,

    porc_igv                NUMERIC(5,2),


    -- ============================================================
    -- SUNAT
    -- ============================================================

    numero_rdi              VARCHAR(50),
    estado_sunat            CHAR(1),


    -- ============================================================
    -- CONTROL Y AUDITORÍA
    -- ============================================================

    ctrl_crea               TIMESTAMP(5) WITHOUT TIME ZONE,
    ctrl_crea_us            VARCHAR(50),
    ctrl_mod                TIMESTAMP(5) WITHOUT TIME ZONE,
    ctrl_mod_us             VARCHAR(50),


    CONSTRAINT mve_transventa_pkey
        PRIMARY KEY (
            id_usuario,
            documento_id,
            periodo,
            r_cod,
            r_serie,
            r_numero,
            elemento
        )
)
PARTITION BY RANGE (periodo);
```

---

## 6. Reglas de uso por tipo de operación

### 6.1 Boleto de viaje

Cuando:

```text
tipo_operacion = 'B'
```

La operación representa un pasajero.

Campos principales:

```text
cliente
cliente_documento
cliente_telefono

id_ruta
descripcion

id_punto_venta
id_punto_venta_dest

placa
licencia

asiento
pasajero_edad

cantidad
precio_unitario
precio_neto

r_gravado
r_exonerado
r_igv
r_monto_total
porc_igv
```

El pasajero se representa mediante los campos de cliente. No se deben crear campos duplicados como `pasajero_nombre`.

El boleto será tratado tributariamente como operación exonerada según la configuración definida para este módulo.

---

### 6.2 Encomienda

Cuando:

```text
tipo_operacion = 'E'
```

La operación representa el servicio de transporte de una encomienda.

Campos principales:

```text
cliente
cliente_documento
cliente_telefono

id_ruta
descripcion

id_punto_venta
id_punto_venta_dest

placa
licencia

destinatario
destinatario_documento
destinatario_telefono
destinatario_direccion

entrega_fecha
entrega_documento
entrega_nombres
entrega_ctrl_us

cantidad
precio_unitario
precio_neto

r_gravado
r_exonerado
r_igv
r_monto_total
porc_igv
```

El cliente representa al remitente.

La encomienda será tratada tributariamente como operación gravada según la configuración definida para este módulo.

---

## 7. Campos comunes

Los siguientes campos son comunes a boleto y encomienda:

```text
id_usuario
documento_id
periodo

r_cod
r_serie
r_numero
elemento
r_fecemi

tipo_operacion

r_cod_ref
r_serie_ref
r_numero_ref
r_fecemi_ref

id_documento
cliente
cliente_documento
cliente_telefono

id_ruta
descripcion

id_punto_venta
id_punto_venta_dest

placa
licencia

cantidad
precio_unitario
precio_neto

r_gravado
r_exonerado
r_igv
r_monto_total
porc_igv

numero_rdi
estado_sunat

ctrl_crea
ctrl_crea_us
ctrl_mod
ctrl_mod_us
```

---

## 8. Campos exclusivos de boleto

```text
asiento
pasajero_edad
```

---

## 9. Campos exclusivos de encomienda

```text
destinatario
destinatario_documento
destinatario_telefono
destinatario_direccion

entrega_fecha
entrega_documento
entrega_nombres
entrega_ctrl_us
```

---

## 10. Reglas tributarias iniciales

La tabla permite representar operaciones gravadas y exoneradas.

### Encomienda

Operación gravada:

```text
r_gravado > 0
r_igv > 0
r_exonerado = 0
```

### Boleto

Operación exonerada:

```text
r_gravado = 0
r_igv = 0
r_exonerado > 0
```

Los valores concretos dependerán de la lógica tributaria implementada en las funciones de PostgreSQL y de la configuración aplicable al comprobante.

---

## 11. Documentos de referencia

Los campos:

```text
r_cod_ref
r_serie_ref
r_numero_ref
r_fecemi_ref
```

son opcionales.

Se utilizarán cuando la operación corresponda a un documento que referencia otro comprobante, principalmente una Nota de Crédito.

Para una operación normal no deberán contener valores.

---

## 12. SUNAT

La tabla deberá conservar información mínima para controlar el proceso de envío:

```text
numero_rdi
estado_sunat
```

El módulo deberá permitir el procesamiento directo con SUNAT mediante los mecanismos electrónicos correspondientes, incluyendo el Resumen Diario cuando aplique.

La implementación de las funciones y servicios SUNAT se especificará en un documento independiente.

---

## 13. Control de entrega de encomiendas

Los campos:

```text
entrega_fecha
entrega_documento
entrega_nombres
entrega_ctrl_us
```

se utilizarán únicamente para operaciones:

```text
tipo_operacion = 'E'
```

Permiten registrar:

- Fecha de entrega.
- Documento de identidad de quien recibe.
- Nombre de quien recibe.
- Usuario de Expercont que registra la entrega.

No se requiere inicialmente una tabla adicional para este control.

---

## 14. Placa y licencia

Los campos:

```text
placa
licencia
```

son comunes a boleto y encomienda.

Su objetivo es conservar en la propia operación la información de la unidad y conductor relacionados con el transporte.

Esto permite consultar históricamente una operación y determinar directamente en qué unidad y con qué licencia se realizó el transporte.

No se crea inicialmente una relación adicional exclusivamente para estos datos.

---

## 15. Campos históricos excluidos

No trasladar desde `mtc_encomiendas` los siguientes campos históricos que ya no forman parte del nuevo diseño:

```text
ano
registrado
ctrl_usuario_inicia
ctrl_usuario_fin
nube
clave
reemplazado
celulares
grupo_codigo
grupo_serie
grupo_numero
ref_cod
ref_serie
ref_numero
precio_chofer
ctrl_carga
ctrl_carga_usuario
ctrl_descarga
ctrl_descarga_usuario
```

Especialmente:

```text
precio_chofer
```

queda expresamente eliminado porque hace años que no se utiliza.

---

## 16. Índices

No crear índices adicionales de forma preventiva.

Los índices adicionales deberán definirse posteriormente a partir de:

- consultas reales del módulo;
- búsquedas frecuentes;
- reportes;
- procesos SUNAT;
- consultas por período;
- necesidades de rendimiento observadas.

La PK ya proporciona el índice principal de la tabla.

---

## 17. Principios de implementación

### 17.1 No duplicar información

No crear campos equivalentes para conceptos que ya están representados.

Ejemplo:

En boleto:

```text
cliente = pasajero
```

No crear:

```text
pasajero_nombre
```

### 17.2 No crear tabla detalle

Cada operación contiene un solo servicio/detalle.

No crear:

```text
mve_transventadet
```

salvo que una necesidad futura del negocio obligue a modificar este supuesto.

### 17.3 No copiar el modelo antiguo

`mtc_encomiendas` solamente constituye una referencia histórica.

No se debe trasladar automáticamente su estructura.

### 17.4 Mantener compatibilidad con Expercont

La nomenclatura y estructura deben seguir los patrones existentes de Expercont:

```text
id_usuario
periodo
r_cod
r_serie
r_numero
elemento
r_fecemi
r_*
ctrl_*
```

---

## 18. Estado del diseño

Este documento define el diseño inicial de la base de datos.

Antes de implementar funciones PostgreSQL o backend, se deberá considerar este modelo como referencia para:

- funciones de creación;
- modificación;
- consulta;
- cálculo de totales;
- procesos SUNAT;
- API;
- frontend ReactJS;
- aplicación Android Kotlin.

Los detalles de lógica de negocio y comportamiento de cada componente se definirán en especificaciones posteriores.


