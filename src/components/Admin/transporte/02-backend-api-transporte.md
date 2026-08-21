# Backend API — Módulo Transporte Expercont

## 1. Objetivo

Definir la API backend para operar la tabla `mve_transventa`.

Tipos de operación:
- `B` = Boleto de viaje.
- `E` = Encomienda.

La API seguirá el patrón actual de Expercont: Express Router, controllers separados, PostgreSQL mediante `pool`, SQL parametrizado y respuestas JSON con `success` y `data`.

No se utilizarán funciones PostgreSQL para los CRUD básicos.

---

## 2. Rutas

Archivo: `routes/ventatrans.routes.js`

```javascript
const { Router } = require('express');
const router = Router();

const {
  crearVentaTrans,
  obtenerVentasTrans,
  obtenerVentaTrans,
  actualizarVentaTrans,
  eliminarVentaTrans,
  registrarEntregaEncomienda
} = require('../controllers/ventatrans.controllers');

router.post('/mve_transventa', crearVentaTrans);

router.get(
  '/mve_transventa/:periodo/:id_anfitrion/:documento_id/:dia',
  obtenerVentasTrans
);

router.get(
  '/mve_transventa/:periodo/:id_anfitrion/:documento_id/:cod/:serie/:num/:elem',
  obtenerVentaTrans
);

router.put('/mve_transventa', actualizarVentaTrans);

router.delete(
  '/mve_transventa/:periodo/:id_anfitrion/:documento_id/:cod/:serie/:num/:elem',
  eliminarVentaTrans
);

router.put('/mve_transventa/entrega', registrarEntregaEncomienda);

module.exports = router;
```

---

## 3. Controller

Archivo: `controllers/ventatrans.controllers.js`

### Proyección común

```javascript
const columnasVentaTrans = `
  CAST(r_fecemi AS VARCHAR(50)) AS r_fecemi,
  r_cod,
  r_serie,
  r_numero,
  elemento,
  tipo_operacion,
  r_cod_ref,
  r_serie_ref,
  r_numero_ref,
  CAST(r_fecemi_ref AS VARCHAR(50)) AS r_fecemi_ref,
  id_documento,
  cliente,
  cliente_documento,
  cliente_telefono,
  id_ruta,
  descripcion,
  id_punto_venta,
  id_punto_venta_dest,
  placa,
  licencia,
  asiento,
  pasajero_edad,
  destinatario,
  destinatario_documento,
  destinatario_telefono,
  destinatario_direccion,
  CAST(entrega_fecha AS VARCHAR(50)) AS entrega_fecha,
  entrega_documento,
  entrega_nombres,
  entrega_ctrl_us,
  cantidad,
  precio_unitario,
  precio_neto,
  r_gravado,
  r_exonerado,
  r_igv,
  r_monto_total,
  porc_igv,
  numero_rdi,
  estado_sunat,
  ctrl_crea,
  ctrl_crea_us,
  ctrl_mod,
  ctrl_mod_us
`;
```

---

## 4. Crear operación

`POST /mve_transventa`

### Reglas

Campos obligatorios de identificación:

```text
id_anfitrion
documento_id
periodo
r_cod
r_serie
r_numero
elemento
r_fecemi
tipo_operacion
```

`tipo_operacion` solamente acepta:

```text
B = Boleto
E = Encomienda
```

Para boleto se requiere inicialmente `asiento`.

Para encomienda se requiere inicialmente `destinatario`.

### Implementación

```javascript
const crearVentaTrans = async (req, res) => {
  const {
    id_anfitrion, documento_id, periodo,
    r_cod, r_serie, r_numero, elemento, r_fecemi,
    tipo_operacion,
    r_cod_ref, r_serie_ref, r_numero_ref, r_fecemi_ref,
    id_documento, cliente, cliente_documento, cliente_telefono,
    id_ruta, descripcion,
    id_punto_venta, id_punto_venta_dest,
    placa, licencia,
    asiento, pasajero_edad,
    destinatario, destinatario_documento,
    destinatario_telefono, destinatario_direccion,
    cantidad, precio_unitario, precio_neto,
    r_gravado, r_exonerado, r_igv, r_monto_total, porc_igv,
    numero_rdi, estado_sunat,
    ctrl_crea_us
  } = req.body;

  if (
    !id_anfitrion || !documento_id || !periodo ||
    !r_cod || !r_serie || !r_numero ||
    elemento === undefined || !r_fecemi || !tipo_operacion
  ) {
    return res.status(400).json({
      success: false,
      message: 'Faltan parametros requeridos para crear operación de transporte'
    });
  }

  if (!['B', 'E'].includes(tipo_operacion)) {
    return res.status(400).json({
      success: false,
      message: 'Tipo de operación no válido. Use B=Boleto o E=Encomienda'
    });
  }

  if (tipo_operacion === 'B' && !asiento) {
    return res.status(400).json({
      success: false,
      message: 'El asiento es requerido para un boleto'
    });
  }

  if (tipo_operacion === 'E' && !destinatario) {
    return res.status(400).json({
      success: false,
      message: 'El destinatario es requerido para una encomienda'
    });
  }

  try {
    const query = `
      INSERT INTO mve_transventa (
        id_usuario, documento_id, periodo,
        r_cod, r_serie, r_numero, elemento, r_fecemi,
        tipo_operacion,
        r_cod_ref, r_serie_ref, r_numero_ref, r_fecemi_ref,
        id_documento, cliente, cliente_documento, cliente_telefono,
        id_ruta, descripcion,
        id_punto_venta, id_punto_venta_dest,
        placa, licencia,
        asiento, pasajero_edad,
        destinatario, destinatario_documento,
        destinatario_telefono, destinatario_direccion,
        cantidad, precio_unitario, precio_neto,
        r_gravado, r_exonerado, r_igv, r_monto_total, porc_igv,
        numero_rdi, estado_sunat,
        ctrl_crea, ctrl_crea_us
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,
        $10,$11,$12,$13,
        $14,$15,$16,$17,
        $18,$19,$20,$21,
        $22,$23,$24,$25,
        $26,$27,
        $28,$29,$30,$31,
        $32,$33,$34,
        $35,$36,$37,$38,$39,
        $40,$41,
        CURRENT_TIMESTAMP,$42
      )
      RETURNING ${columnasVentaTrans}
    `;

    const params = [
      id_anfitrion, documento_id, periodo,
      r_cod, r_serie, r_numero, elemento, r_fecemi,
      tipo_operacion,
      r_cod_ref || null, r_serie_ref || null,
      r_numero_ref || null, r_fecemi_ref || null,
      id_documento || null, cliente || null,
      cliente_documento || null, cliente_telefono || null,
      id_ruta || null, descripcion || null,
      id_punto_venta || null, id_punto_venta_dest || null,
      placa || null, licencia || null,
      asiento || null, pasajero_edad ?? null,
      destinatario || null, destinatario_documento || null,
      destinatario_telefono || null, destinatario_direccion || null,
      cantidad ?? null, precio_unitario ?? null, precio_neto ?? null,
      r_gravado ?? 0, r_exonerado ?? 0, r_igv ?? 0,
      r_monto_total ?? 0, porc_igv ?? null,
      numero_rdi || null, estado_sunat || null,
      ctrl_crea_us || null
    ];

    const result = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al crear operación de transporte:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};
```

---

## 5. Obtener operaciones

`GET /mve_transventa/:periodo/:id_anfitrion/:documento_id/:dia`

`dia = *` consulta todo el período. Si se proporciona un día, consulta solamente esa fecha.

```javascript
const obtenerVentasTrans = async (req, res) => {
  const { periodo, id_anfitrion, documento_id, dia } = req.params;

  if (!periodo || !id_anfitrion || !documento_id || dia === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Faltan parametros requeridos para obtener operaciones de transporte'
    });
  }

  try {
    let query = `
      SELECT ${columnasVentaTrans}
        FROM mve_transventa
       WHERE periodo = $1
         AND id_usuario = $2
         AND documento_id = $3
    `;

    const params = [periodo, id_anfitrion, documento_id];

    if (dia !== '*') {
      query += ` AND r_fecemi = $4 `;
      params.push(`${periodo}-${dia}`);
    }

    query += `
      ORDER BY r_fecemi DESC, r_serie, r_numero DESC, elemento
    `;

    const result = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error al obtener operaciones de transporte:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};
```

---

## 6. Obtener una operación

`GET /mve_transventa/:periodo/:id_anfitrion/:documento_id/:cod/:serie/:num/:elem`

```javascript
const obtenerVentaTrans = async (req, res) => {
  const {
    periodo, id_anfitrion, documento_id,
    cod, serie, num, elem
  } = req.params;

  if (
    !periodo || !id_anfitrion || !documento_id ||
    !cod || !serie || !num || elem === undefined
  ) {
    return res.status(400).json({
      success: false,
      message: 'Faltan parametros requeridos para obtener operación de transporte'
    });
  }

  try {
    const query = `
      SELECT ${columnasVentaTrans}
        FROM mve_transventa
       WHERE periodo = $1
         AND id_usuario = $2
         AND documento_id = $3
         AND r_cod = $4
         AND r_serie = $5
         AND r_numero = $6
         AND elemento = $7
    `;

    const result = await pool.query(query, [
      periodo, id_anfitrion, documento_id,
      cod, serie, num, elem
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Operación de transporte no encontrada'
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al obtener operación de transporte:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};
```

---

## 7. Actualizar operación

`PUT /mve_transventa`

La actualización identifica el registro mediante:

```text
periodo
id_anfitrion
documento_id
r_cod
r_serie
r_numero
elemento
```

El patrón de actualización utiliza `COALESCE` para conservar valores existentes cuando un campo no sea enviado.

```javascript
const actualizarVentaTrans = async (req, res) => {
  const {
    periodo, id_anfitrion, documento_id,
    r_cod, r_serie, r_numero, elemento,
    r_fecemi, tipo_operacion,
    r_cod_ref, r_serie_ref, r_numero_ref, r_fecemi_ref,
    id_documento, cliente, cliente_documento, cliente_telefono,
    id_ruta, descripcion,
    id_punto_venta, id_punto_venta_dest,
    placa, licencia,
    asiento, pasajero_edad,
    destinatario, destinatario_documento,
    destinatario_telefono, destinatario_direccion,
    cantidad, precio_unitario, precio_neto,
    r_gravado, r_exonerado, r_igv, r_monto_total, porc_igv,
    ctrl_mod_us
  } = req.body;

  if (
    !periodo || !id_anfitrion || !documento_id ||
    !r_cod || !r_serie || !r_numero ||
    elemento === undefined
  ) {
    return res.status(400).json({
      success: false,
      message: 'Faltan parametros requeridos para actualizar operación de transporte'
    });
  }

  try {
    const query = `
      UPDATE mve_transventa
         SET r_fecemi = COALESCE(NULLIF($8, '')::date, r_fecemi),
             tipo_operacion = COALESCE($9, tipo_operacion),
             r_cod_ref = COALESCE($10, r_cod_ref),
             r_serie_ref = COALESCE($11, r_serie_ref),
             r_numero_ref = COALESCE($12, r_numero_ref),
             r_fecemi_ref = COALESCE(NULLIF($13, '')::date, r_fecemi_ref),
             id_documento = COALESCE($14, id_documento),
             cliente = COALESCE($15, cliente),
             cliente_documento = COALESCE($16, cliente_documento),
             cliente_telefono = COALESCE($17, cliente_telefono),
             id_ruta = COALESCE($20, id_ruta),
             descripcion = COALESCE($21, descripcion),
             id_punto_venta = COALESCE($22, id_punto_venta),
             id_punto_venta_dest = COALESCE($23, id_punto_venta_dest),
             placa = COALESCE($24, placa),
             licencia = COALESCE($25, licencia),
             asiento = COALESCE($26, asiento),
             pasajero_edad = COALESCE($27::integer, pasajero_edad),
             destinatario = COALESCE($28, destinatario),
             destinatario_documento = COALESCE($29, destinatario_documento),
             destinatario_telefono = COALESCE($30, destinatario_telefono),
             destinatario_direccion = COALESCE($31, destinatario_direccion),
             cantidad = COALESCE($32::numeric, cantidad),
             precio_unitario = COALESCE($33::numeric, precio_unitario),
             precio_neto = COALESCE($34::numeric, precio_neto),
             r_gravado = COALESCE($35::numeric, r_gravado),
             r_exonerado = COALESCE($36::numeric, r_exonerado),
             r_igv = COALESCE($37::numeric, r_igv),
             r_monto_total = COALESCE($38::numeric, r_monto_total),
             porc_igv = COALESCE($39::numeric, porc_igv),
             ctrl_mod = CURRENT_TIMESTAMP,
             ctrl_mod_us = COALESCE($40, ctrl_mod_us)
       WHERE periodo = $1
         AND id_usuario = $2
         AND documento_id = $3
         AND r_cod = $4
         AND r_serie = $5
         AND r_numero = $6
         AND elemento = $7
       RETURNING ${columnasVentaTrans}
    `;

    const params = [
      periodo, id_anfitrion, documento_id,
      r_cod, r_serie, r_numero, elemento,
      r_fecemi, tipo_operacion,
      r_cod_ref, r_serie_ref, r_numero_ref, r_fecemi_ref,
      id_documento, cliente, cliente_documento, cliente_telefono,
      id_ruta, descripcion,
      id_punto_venta, id_punto_venta_dest,
      placa, licencia,
      asiento, pasajero_edad,
      destinatario, destinatario_documento,
      destinatario_telefono, destinatario_direccion,
      cantidad, precio_unitario, precio_neto,
      r_gravado, r_exonerado, r_igv, r_monto_total, porc_igv,
      ctrl_mod_us
    ];

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Operación de transporte no encontrada'
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar operación de transporte:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};
```

---

## 8. Eliminar operación

`DELETE /mve_transventa/:periodo/:id_anfitrion/:documento_id/:cod/:serie/:num/:elem`

```javascript
const eliminarVentaTrans = async (req, res) => {
  const {
    periodo, id_anfitrion, documento_id,
    cod, serie, num, elem
  } = req.params;

  if (
    !periodo || !id_anfitrion || !documento_id ||
    !cod || !serie || !num || elem === undefined
  ) {
    return res.status(400).json({
      success: false,
      message: 'Faltan parametros requeridos para eliminar operación de transporte'
    });
  }

  try {
    const query = `
      DELETE FROM mve_transventa
       WHERE periodo = $1
         AND id_usuario = $2
         AND documento_id = $3
         AND r_cod = $4
         AND r_serie = $5
         AND r_numero = $6
         AND elemento = $7
       RETURNING r_cod, r_serie, r_numero, elemento
    `;

    const result = await pool.query(query, [
      periodo, id_anfitrion, documento_id,
      cod, serie, num, elem
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Operación de transporte no encontrada'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Operación de transporte eliminada correctamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al eliminar operación de transporte:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};
```

---

## 9. Registrar entrega de encomienda

Esta operación no forma parte del CRUD genérico. Es una operación específica de negocio.

Endpoint:

```text
PUT /mve_transventa/entrega
```

```javascript
const registrarEntregaEncomienda = async (req, res) => {
  const {
    periodo,
    id_anfitrion,
    documento_id,
    r_cod,
    r_serie,
    r_numero,
    elemento,
    entrega_fecha,
    entrega_documento,
    entrega_nombres,
    entrega_ctrl_us
  } = req.body;

  if (
    !periodo || !id_anfitrion || !documento_id ||
    !r_cod || !r_serie || !r_numero ||
    elemento === undefined ||
    !entrega_fecha || !entrega_documento || !entrega_nombres
  ) {
    return res.status(400).json({
      success: false,
      message: 'Faltan parametros requeridos para registrar entrega'
    });
  }

  try {
    const query = `
      UPDATE mve_transventa
         SET entrega_fecha = $8::date,
             entrega_documento = $9,
             entrega_nombres = $10,
             entrega_ctrl_us = $11,
             ctrl_mod = CURRENT_TIMESTAMP,
             ctrl_mod_us = $11
       WHERE periodo = $1
         AND id_usuario = $2
         AND documento_id = $3
         AND r_cod = $4
         AND r_serie = $5
         AND r_numero = $6
         AND elemento = $7
         AND tipo_operacion = 'E'
       RETURNING ${columnasVentaTrans}
    `;

    const result = await pool.query(query, [
      periodo, id_anfitrion, documento_id,
      r_cod, r_serie, r_numero, elemento,
      entrega_fecha, entrega_documento,
      entrega_nombres, entrega_ctrl_us
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Encomienda no encontrada'
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al registrar entrega de encomienda:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};
```

---

## 10. Exportación

```javascript
module.exports = {
  crearVentaTrans,
  obtenerVentasTrans,
  obtenerVentaTrans,
  actualizarVentaTrans,
  eliminarVentaTrans,
  registrarEntregaEncomienda
};
```

---

## 11. Reglas tributarias

Los campos tributarios son:

```text
r_gravado
r_exonerado
r_igv
r_monto_total
porc_igv
```

Encomienda:

```text
r_gravado > 0
r_igv > 0
r_exonerado = 0
```

Boleto:

```text
r_gravado = 0
r_igv = 0
r_exonerado > 0
```

La autoridad del cálculo tributario debe ser el backend. ReactJS y Android Kotlin no deben implementar reglas tributarias independientes.

La implementación exacta del cálculo tributario se especificará posteriormente si el módulo requiere una lógica diferente según comprobante, configuración o régimen.

---

## 12. Particionamiento

Las consultas deberán utilizar `periodo` siempre que sea posible:

```sql
WHERE periodo = $1
  AND id_usuario = $2
  AND documento_id = $3
```

Esto permite aprovechar el particionamiento mensual de `mve_transventa`.

---

## 13. Seguridad SaaS

Todas las operaciones deben respetar el contexto del usuario/empresa.

El backend utiliza el patrón existente de Expercont:

```text
id_anfitrion
```

para determinar el contexto que se utiliza como:

```text
id_usuario
```

Nunca se debe permitir acceder a registros de otro usuario mediante un `documento_id` o identificador manipulado.

---

## 14. Respuestas

Éxito:

```json
{
  "success": true,
  "data": {}
}
```

Lista:

```json
{
  "success": true,
  "data": []
}
```

Error:

```json
{
  "success": false,
  "message": "Descripción del error"
}
```

Registro no encontrado:

```json
{
  "success": false,
  "message": "Operación de transporte no encontrada"
}
```

---

## 15. Alcance inicial

Este documento cubre:

- Crear operación.
- Listar operaciones.
- Obtener una operación.
- Actualizar operación.
- Eliminar operación.
- Registrar entrega de encomienda.

No cubre todavía:

- Resumen Diario SUNAT.
- XML SUNAT.
- SOAP.
- CDR.
- Guía de Remisión Electrónica.
- Manifiesto de pasajeros.
- Impresión.
- Android Kotlin.
- ReactJS.
- Reportes.
- IA.
- Automatizaciones.

Estos componentes se documentarán en especificaciones posteriores.

---

## 16. Principio de diseño

El módulo Transporte debe permanecer más simple que los módulos comerciales existentes.

No crear inicialmente una tabla de detalle:

```text
mve_transventadet
```

ni funciones PostgreSQL específicas para cada operación.

La arquitectura inicial será:

```text
ReactJS / Android Kotlin
          ↓
      Express API
          ↓
    mve_transventa
```

Una fila representa una operación completa de transporte.

`tipo_operacion` determina si corresponde a boleto o encomienda.

La API centraliza las validaciones y reglas de negocio para que ReactJS y Android Kotlin utilicen el mismo comportamiento.


