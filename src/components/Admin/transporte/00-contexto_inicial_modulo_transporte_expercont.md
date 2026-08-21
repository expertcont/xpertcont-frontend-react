# Contexto Inicial — Módulo Transporte Expercont

## 1. Objetivo

Incorporar a Expercont SaaS un módulo especializado para una empresa de transporte interprovincial de minivans.

El sistema actual maneja principalmente:

- Boletos de viaje.
- Encomiendas.
- Manifiestos de pasajeros.
- Control de entrega de encomiendas.
- Facturación electrónica y envío de información a SUNAT.

El nuevo módulo reemplazará progresivamente al sistema antiguo.

---

## 2. Arquitectura

### Aplicación Web

Tecnología:

- ReactJS.

Será utilizada para:

- Administración.
- Registro y consulta de boletos.
- Registro y consulta de encomiendas.
- Control de entrega de encomiendas.
- Consultas y reportes.
- Procesos SUNAT.
- Generación e impresión del manifiesto.

### Aplicación Android

Tecnología:

- Kotlin.

Será utilizada principalmente dentro de las minivans para:

- Registrar pasajeros.
- Emitir boletos.
- Consultar información necesaria para la emisión.
- Imprimir boletos.

La aplicación Android consumirá el mismo backend del SaaS.

### Backend

Se mantiene la arquitectura actual de Expercont:

```text
ReactJS / Android Kotlin
        |
        v
NodeJS / Express
        |
        v
PostgreSQL
```

---

## 3. Tipos de operación

El módulo manejará inicialmente dos tipos de operaciones:

- `B` = Boleto de viaje.
- `E` = Encomienda.

Ambas operaciones se almacenarán en una única tabla:

`mve_transventa`

No se utilizará `mve_venta` para estas operaciones.

---

## 4. Modelo de operación

Cada operación de transporte contiene un solo servicio/detalle.

Por esta razón:

- No se requiere una tabla `mve_transventadet`.
- Los datos comerciales se almacenan directamente en `mve_transventa`.

El diseño debe ser:

- Simple.
- Plano.
- Minimalista.
- De lectura inmediata.
- Sin normalización innecesaria.

---

## 5. Tabla principal

Tabla:

`mve_transventa`

La tabla será particionada por:

`periodo`

Formato:

`YYYY-MM`

Ejemplo:

`2026-08`

### Clave primaria

La PK definida es:

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

---

## 6. Identificación

Campos principales:

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
```

Valores de `tipo_operacion`:

```text
B = Boleto
E = Encomienda
```

---

## 7. Referencia de documentos

Para documentos que requieran referencia, principalmente Notas de Crédito:

```text
r_cod_ref
r_serie_ref
r_numero_ref
r_fecemi_ref
```

Estos campos son opcionales.

---

## 8. Cliente

Campos:

```text
id_documento
cliente
cliente_documento
cliente_telefono
```

Interpretación:

### Boleto

El cliente representa al pasajero.

### Encomienda

El cliente representa al remitente.

No se deben duplicar innecesariamente los datos del pasajero.

---

## 9. Datos de transporte

Campos comunes:

```text

id_ruta
descripcion

id_punto_venta
id_punto_venta_dest

placa
licencia
```

`placa` y `licencia` se mantienen directamente en la operación porque permiten identificar en qué unidad y con qué conductor se realizó el transporte.

No se debe agregar una estructura adicional solamente para almacenar estos datos en esta primera versión.

---

## 10. Datos específicos del boleto

Campos:

```text
asiento
pasajero_edad
```

El pasajero se representa mediante:

```text
cliente
cliente_documento
cliente_telefono
```

No agregar inicialmente campos relacionados con acompañantes, menores, autorizaciones u otros datos que no hayan sido confirmados como necesarios para el negocio.

---

## 11. Datos específicos de encomienda

Campos del destinatario:

```text
destinatario
destinatario_documento
destinatario_telefono
destinatario_direccion
```

### Control de entrega

```text
entrega_fecha
entrega_documento
entrega_nombres
entrega_ctrl_us
```

`entrega_ctrl_us` identifica al usuario que registra o realiza la entrega de la encomienda.

---

## 12. Importes

Cada operación tiene un solo detalle.

Campos:

```text
cantidad
precio_unitario
precio_neto
```

Campos tributarios:

```text
r_gravado
r_exonerado
r_igv
r_monto_total
porc_igv
```

Tratamiento tributario inicial:

```text
Encomienda -> Gravada con IGV
Boleto     -> Exonerado
```

La lógica tributaria debe determinar los importes según `tipo_operacion`.

---

## 13. SUNAT

Campos iniciales:

```text
numero_rdi
estado_sunat
```

El módulo debe permitir posteriormente el envío directo a SUNAT de los comprobantes mediante Resumen Diario, sin depender del SFS utilizado por el sistema antiguo.

El diseño debe seguir las convenciones existentes de Expercont para comprobantes electrónicos y procesos SUNAT.

---

## 14. Control y auditoría

Campos:

```text
ctrl_crea
ctrl_crea_us
ctrl_mod
ctrl_mod_us
```

Se debe mantener el patrón de auditoría utilizado por Expercont.

---

## 15. Campos históricos que NO deben trasladarse

El sistema antiguo `mtc_encomiendas` contiene campos acumulados durante años de evolución del sistema.

No se deben trasladar automáticamente campos que ya no tienen uso.

Entre los campos identificados como obsoletos o innecesarios:

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

`precio_chofer` queda expresamente excluido porque actualmente no se utiliza.

---

## 16. Principios de diseño

El nuevo módulo NO debe ser una copia de `mtc_encomiendas`.

La tabla antigua contiene campos históricos correspondientes a diferentes etapas y funcionalidades del sistema.

El nuevo diseño debe partir exclusivamente de las necesidades actuales del negocio.

Principios:

1. Mantener una estructura simple.
2. Evitar tablas de detalle innecesarias.
3. Evitar duplicación de información.
4. Mantener lectura inmediata de una operación.
5. Mantener compatibilidad con las convenciones de Expercont.
6. Utilizar `periodo` para particionamiento.
7. Mantener aislamiento por `id_usuario`.
8. Reutilizar la lógica tributaria existente.
9. No conservar campos históricos sin uso.
10. No incorporar funcionalidades futuras sin una necesidad confirmada.

---

## 17. Manifiesto de pasajeros

El módulo deberá permitir posteriormente generar el manifiesto de pasajeros a partir de la información registrada en los boletos.

El manifiesto podrá ser generado para impresión utilizando:

- Impresora matricial.
- Impresora láser.
- Formato preimpreso.

La generación del manifiesto se realizará inicialmente desde la aplicación Web.

No se debe incorporar en esta etapa una integración adicional no confirmada con sistemas externos del MTC/SUTRAN.

---

## 18. Aplicación Android

La aplicación Android será desarrollada en Kotlin.

Su objetivo inicial es la operación rápida dentro de la minivan:

```text
Registrar pasajero
        |
        v
Emitir boleto
        |
        v
Imprimir boleto
```

Debe consumir el backend existente del SaaS.

La aplicación no debe duplicar la lógica de negocio que corresponde al backend.

---

## 19. Alcance inicial

El alcance inicial comprende:

- Modelo de datos de transporte.
- Boletos.
- Encomiendas.
- Control de entrega de encomiendas.
- Datos necesarios para manifiesto.
- Facturación electrónica.
- Resumen Diario SUNAT.
- Aplicación Web ReactJS.
- Aplicación Android Kotlin.
- Impresión de boletos.
- Generación/impresión de manifiestos.

---

## 20. Fuera del alcance inicial

No implementar inicialmente:

- Funcionalidades de IA.
- Agentes autónomos.
- Análisis predictivo.
- Funciones no utilizadas actualmente del sistema antiguo.
- Estructuras adicionales de datos que no sean necesarias.
- Integraciones externas no confirmadas.
- Funcionalidades futuras solamente por previsión.

La incorporación de IA se evaluará posteriormente, cuando exista suficiente información de uso real y se identifique una necesidad concreta del negocio.

---

## 21. Criterio general para Codex

Antes de implementar código, revisar las especificaciones y mantener el principio de diseño minimalista.

No trasladar automáticamente estructuras, nombres o campos del sistema antiguo.

Cuando exista una diferencia entre el sistema antiguo y esta especificación, esta especificación tiene prioridad.

La implementación debe respetar las convenciones existentes de Expercont, especialmente:

- PostgreSQL.
- Funciones almacenadas.
- `id_usuario`.
- `periodo`.
- Identificación de comprobantes mediante `r_cod`, `r_serie`, `r_numero`.
- `elemento`.
- Campos tributarios `r_*`.
- Auditoría `ctrl_*`.
- Arquitectura NodeJS/Express.
- Frontend ReactJS.
- Aplicación móvil Kotlin.

La primera prioridad es obtener un módulo de Transporte sencillo, estable, mantenible y consistente con la arquitectura actual de Expercont.


