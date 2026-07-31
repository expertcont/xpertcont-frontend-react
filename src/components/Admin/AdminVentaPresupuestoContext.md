# Contexto: Presupuestos de venta

## Objetivo funcional

Modulo para gestionar presupuestos de venta orientado a fabricacion/instalacion de paneles publicitarios.

Un presupuesto contiene:

- Cabecera: numero, fecha, cliente, documento, direccion, contacto, celular, moneda, forma de pago, campana.
- Trabajos: cada trabajo representa un item presupuestado, por ejemplo una ubicacion, panel, instalacion o servicio grafico.
- Recursos por trabajo: materiales, operarios y servicios usados para costear internamente cada trabajo.
- Utilidad por trabajo: porcentaje que incrementa el costo base detallado para formar el total del trabajo sin IGV.

## Archivos principales

- `AdminVentaPresupuestoList.js`: panel general de presupuestos.
- `AdminVentaPresupuestoNuevoForm.js`: formulario nuevo/modificacion de presupuesto.
- `AdminVentaPresupuestoDemoData.js`: data demo y funciones de calculo.
- `AdminVentaPresupuestoPdf.js`: generacion de PDF del presupuesto.
- `AdminVentaPresupuestoForm.js`: formulario historico/vista, viene del flujo de ventas.
- `App.js`: rutas de presupuesto.

## Rutas actuales

- `/ad_ventapresupuesto/:id_anfitrion/:id_invitado/:periodo/:documento_id`
  - Lista presupuestos.
- `/ad_ventapresupuesto/:id_anfitrion/:id_invitado/:periodo/:documento_id/new`
  - Abre `AdminVentaPresupuestoNuevoForm`.
- `/ad_ventapresupuesto/:id_anfitrion/:id_invitado/:periodo/:documento_id/:comprobante/edit`
  - Abre `AdminVentaPresupuestoNuevoForm`.
- `/ad_ventapresupuesto/:id_anfitrion/:id_invitado/:periodo/:documento_id/:comprobante/view`
  - Abre `AdminVentaPresupuestoForm`.

## Estado actual

- El listado usa `presupuestosDemo` de `AdminVentaPresupuestoDemoData.js`.
- El formulario nuevo usa estado local React, no backend.
- `handleSaveDemo` solo imprime el JSON en consola y muestra un alert.
- Los botones de PDF generan vista previa y PDF cliente usando `AdminVentaPresupuestoPdf.js`.
- El formulario permite agregar/editar/eliminar trabajos.
- El modal de recursos permite agregar/eliminar recursos por trabajo.

## Estructura de datos actual

```js
presupuesto = {
  id,
  numero,
  fecha,
  cliente_documento,
  cliente_nombre,
  direccion,
  moneda,
  forma_pago,
  vigencia_dias,
  contacto,
  celular,
  campana,
  trabajos: [
    {
      id,
      producto,
      codigo,
      numero,
      descripcion,
      cantidad,
      unidad,
      precio_unitario,
      utilidad_pct,
      materiales: [
        {
          id,
          tipo, // MATERIAL | OPERARIO | SERVICIO | VIATICO | TERCERIZACION
          grupo,
          codigo,
          descripcion,
          cantidad,
          unidad,
          costo_unitario,
          horas,
          operarios,
          costo_hora,
          largo,
          ancho,
          costo_m2,
        },
      ],
    },
  ],
};
```

## Calculos actuales

- `costoRecurso(recurso)`
  - `OPERARIO` o `MANO_OBRA` legacy: horas x operarios x costo_hora.
  - `SERVICIO`: largo x ancho x cantidad x costo_m2.
  - Otros: cantidad x costo_unitario.
- `totalRecursosTrabajo(trabajo)`
  - Suma costos de recursos del trabajo.
- `utilidadTrabajo(trabajo)`
  - Costo base de recursos x utilidad_pct / 100.
- `totalCosteadoTrabajo(trabajo)`
  - Costo base de recursos + utilidad.
- `totalTrabajo(trabajo)`
  - Si el trabajo tiene recursos, usa costo base + utilidad.
- Si el trabajo no tiene recursos, usa cantidad x precio_unitario.

## Catalogo demo de recursos

- `productosPresupuestoDemo` contiene filas con `id_producto`, `nombre`, `precio_compra` y `tipo`.
- En el modal de recursos, el campo `Codigo` abre un modal paginado de productos con buscador por `id_producto`, `nombre` o `tipo`.
- Filtro por tipo:
  - `MATERIAL`: muestra todo menos `OPERARIO` y `SERVICIO`.
  - `OPERARIO`: muestra solo `OPERARIO`.
  - `SERVICIO`: muestra solo `SERVICIO`.
- Al elegir un producto:
  - `codigo` recibe `id_producto`.
  - `descripcion` recibe `nombre`.
  - `precio_compra` alimenta `costo_unitario`, `costo_hora` o `costo_m2` segun el tipo.
- `totalPresupuesto(presupuesto)`
  - Suma cada trabajo con IGV 18%.

## Riesgos pendientes

- El listado tiene buscador heredado que filtra `tabladet`, pero la tabla visible usa `data` demo. El buscador no afecta la lista actual.
- `DaySelector` en el listado esta hardcodeado con `2026-06`; deberia usar `periodo_trabajo`.
- Al agregar operarios desde el formulario nuevo no se captura `operarios`, aunque la data/calculo lo soporta.
- El formulario nuevo no persiste contra backend.
- Falta definir contrato de API para guardar cabecera, trabajos y recursos.

## Validacion realizada

- `npm run build` compila correctamente.
- El build termina con warnings generales de ESLint ya presentes en el proyecto.

## Proximo paso sugerido

Definir el contrato de guardado:

- Guardar presupuesto completo como JSON anidado en un endpoint unico.
- O guardar normalizado: cabecera, trabajos y recursos en endpoints/tablas separadas.

Para avanzar rapido, conviene empezar con un payload anidado desde `AdminVentaPresupuestoNuevoForm.js`, porque ya existe el estado completo del presupuesto listo para enviar.
