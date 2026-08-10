# Contexto General - Modulo de Presupuestos / Proformas

## Proyecto Frontend

- Proyecto React CRA.
- Ruta base trabajada: modulo Admin / Venta Presupuesto.
- Se esta modernizando el flujo de presupuestos/proformas para reemplazar un modelo antiguo en PDF.
- El flujo actual usa JSON temporal para demo, listo para reemplazarse por endpoints reales del backend.

## Archivos Frontend Principales

### `src/components/Admin/AdminVentaPresupuestoDemoData.js`

Contiene JSON temporal del listado y formulario.

Exporta helpers de calculo:

- `costoRecurso`
- `totalRecursosTrabajo`
- `totalTrabajo`
- `subtotalPresupuesto`
- `totalPresupuesto`
- `detalleRecurso`
- `presupuestosDemo`
- `presupuestoNuevoDemo`
- `getPresupuestoDemo`

### `src/components/Admin/AdminVentaPresupuestoList.js`

- Lista presupuestos.
- Usa el JSON demo compartido.
- Muestra total del presupuesto.
- Tiene boton para nuevo presupuesto.
- Tiene boton para modificar presupuesto.

### `src/components/Admin/AdminVentaPresupuestoNuevoForm.js`

Formulario moderno para crear/modificar presupuesto.

Cabecera:

- `numero`
- `fecha`
- `moneda`
- `forma_pago`
- `cliente_documento`
- `cliente_nombre`
- `contacto`
- `celular`
- `direccion`
- `campana`

Trabajos:

- `producto`
- `descripcion`
- `cantidad`
- `precio_unitario`
- total calculado

Notas funcionales:

- Agregar/modificar trabajo se hace con modal.
- La descripcion del trabajo es multilinea.
- Cada trabajo puede tener recursos internos:
  - materiales
  - mano de obra
  - servicios
- Modal de recursos muestra:
  - presupuestado rapido
  - costeo detallado
  - diferencia
  - aviso si falta costear detalles
  - encabezados de columnas
- En la lista de trabajos:
  - Total principal = presupuesto rapido
  - Si tiene recursos, aparece tambien `Det:` con costeo detallado.

### `src/components/Admin/AdminVentaPresupuestoPdf.js`

- Genera PDF con `pdf-lib`.
- Hay dos modos:
  - PDF interno / previo: muestra materiales, mano de obra, servicios y costos internos.
  - PDF cliente: solo muestra datos generales y trabajos, sin materiales ni costos internos.
- El PDF incluye `campana` y `celular`.

## Rutas Frontend

Nueva proforma:

```txt
/ad_ventapresupuesto/:id_anfitrion/:id_invitado/:periodo/:documento_id/new
```

Editar proforma:

```txt
/ad_ventapresupuesto/:id_anfitrion/:id_invitado/:periodo/:documento_id/:comprobante/edit
```

## Estructura de Datos Propuesta

### Presupuesto

```json
{
  "numero": "PR-2026-0001",
  "fecha": "2026-08-06",
  "moneda": "PEN",
  "forma_pago": "Contado",
  "cliente_documento": "20100000000",
  "cliente_nombre": "CLIENTE DEMO S.A.C.",
  "contacto": "Juan Perez",
  "celular": "51999999999",
  "direccion": "Av. Demo 123",
  "campana": "Campana comercial",
  "trabajos": []
}
```

### Trabajo

```json
{
  "id": 1,
  "producto": "PORONGOCHE 1",
  "codigo": "PORONGOCHE 1",
  "numero": "PORONGOCHE 1",
  "descripcion": "Descripcion multilinea del trabajo",
  "cantidad": 1,
  "unidad": "UND",
  "precio_unitario": 641.31,
  "materiales": []
}
```

### Recurso: Material

```json
{
  "id": 101,
  "tipo": "MATERIAL",
  "codigo": "SOLVENTE",
  "descripcion": "THINNER STANDART",
  "cantidad": 0.12,
  "unidad": "GLN",
  "costo_unitario": 10
}
```

### Recurso: Mano de Obra

```json
{
  "id": 201,
  "tipo": "MANO_OBRA",
  "codigo": "GENERAL",
  "descripcion": "OPERARIO VINILISTA N",
  "horas": 2.5,
  "costo_hora": 3,
  "unidad": "HRA"
}
```

### Recurso: Servicio

```json
{
  "id": 301,
  "tipo": "SERVICIO",
  "codigo": "GENERAL",
  "descripcion": "IMPRESION VINIL BLANCO MATE 1.40 X 50 MTS",
  "largo": 1.4,
  "ancho": 1.8,
  "costo_m2": 12,
  "unidad": "M2"
}
```

## Calculos

### Costo recurso

Material:

```txt
cantidad * costo_unitario
```

Mano de obra:

```txt
horas * costo_hora
```

Servicio:

```txt
largo * ancho * costo_m2
```

### Total rapido del trabajo

```txt
cantidad * precio_unitario
```

### Costeo detallado del trabajo

```txt
suma de todos los recursos/materiales/mano de obra/servicios
```

### Diferencia del trabajo

```txt
total rapido - costeo detallado
```

### Subtotal presupuesto

```txt
suma del total rapido de cada trabajo
```

### Total presupuesto

```txt
subtotal + IGV 18%
```

En demo se redondea por trabajo para cuadrar el ejemplo de America Movil.

## Ejemplo Demo Importante

Cliente:

- `AMERICA MOVIL PERU S.A.C.`

Total:

- `PEN 2,488.18`

Tiene 2 trabajos.

### Trabajo 1

Producto:

- `PORONGOCHE 1`

Descripcion:

```txt
VINIL MESH IMPRESO CON RETIRO DEL ANTERIOR, LIMPIEZA E INSTALACION DE NUEVO. TAMAÑO:
- FIT MAMA 2 X 3 M
- FULL ZAMBITA 1.8 X 1.4 M
```

Subtotal sin IGV:

- `641.31`

Recursos:

- MATERIAL: `THINNER STANDART` / `SOLVENTE` / `GLN 0.12`
- MANO_OBRA: `OPERARIO VINILISTA N` / `2.50 horas` / costo `3.00`
- SERVICIO: `TRASLADOS` / `UND 1.00`
- SERVICIO: `IMPRESION VINIL BLANCO MATE 1.40 X 50 MTS` / largo `1.40` / ancho `1.80` / cantidad `1.00`

### Trabajo 2

Producto:

- `CAC AREQUIPA`

Descripcion:

```txt
VINIL NORMAL IMPRESO CON RETIRO DEL ANTERIOR, LIMPIEZA E INSTALACION DE NUEVO. TAMAÑO:
- FIT MAMA 3X3 M
- FULL ZAMBITA 3X3 M
- MARCO BLANCO 2.42 X 4.39
- MARCO ROJO 2.42 X 4.39
```

Subtotal sin IGV:

- `1,467.31`

Recursos:

- MATERIAL: `THINNER STANDART` / `SOLVENTE` / `GLN 0.12`
- MANO_OBRA: `OPERARIO VINILISTA N` / `4.00 horas` / costo `3.00`
- SERVICIO: `TRASLADOS` / `UND 1.00`
- SERVICIO: `ANDAMIO` / `UND 1.00`
- SERVICIO: `IMPRESION VINIL BLANCO MATE 1.40 X 50 MTS` / largo `3.49` / ancho `2.42` / cantidad `2.00`

## Idea Funcional

### 1. Presupuesto Rapido

- El vendedor digita producto, descripcion, cantidad y precio unitario.
- No necesita registrar materiales.
- Sirve para proforma veloz.

### 2. Presupuesto Costeado

- Luego se agregan recursos internos por cada trabajo.
- Se registra material, mano de obra y servicios.
- El sistema compara:
  - valor presupuestado rapido
  - costo detallado interno
  - diferencia
- Esto sirve para control interno y margen.

## PDFs

### PDF Interno / Previo

- Para control interno.
- Puede mostrar recursos, materiales, mano de obra, servicios, costos y diferencia.

### PDF Cliente

- Para enviar al cliente.
- No debe mostrar materiales ni costos internos.
- Debe mostrar datos generales, trabajos e importes.
- Se agrego campo `celular` pensando en envio por WhatsApp.

## Backend Pendiente

Reemplazar JSON temporal por API real.

Endpoints sugeridos:

- `GET /presupuestos`
  - Lista presupuestos con total.
- `GET /presupuestos/:id`
  - Devuelve cabecera + trabajos + recursos.
- `POST /presupuestos`
  - Crea presupuesto completo.
- `PUT /presupuestos/:id`
  - Actualiza cabecera, trabajos y recursos.
- `DELETE /presupuestos/:id`
  - Elimina/anula presupuesto.
- `GET /presupuestos/:id/pdf?modo=cliente`
  - Genera PDF cliente.
- `GET /presupuestos/:id/pdf?modo=interno`
  - Genera PDF interno.

## Tablas Sugeridas

- `presupuesto_cabecera`
- `presupuesto_trabajo`
- `presupuesto_trabajo_recurso`

## Notas Para Backend

- Mantener el campo `campana`, no `observacion`.
- Mantener `celular` junto a `contacto`.
- El PDF cliente no debe exponer recursos internos.
- El backend debe soportar trabajos sin recursos, para presupuestos rapidos.
- El backend debe soportar trabajos con recursos, para costeo detallado.
- Los trabajos deben permitir descripcion multilinea.
- El total comercial del trabajo no debe confundirse con el costo interno detallado.
- Para control interno, guardar ambos valores o permitir recalcular:
  - total rapido/comercial
  - total detallado/costeo
  - diferencia/margen base
