# Contexto: Presupuestos de venta

> Spec vigente: `D:\Developer\ovivasar\XpertcontProyecto\xpertcont-backend-js\docs\presupuestos-spec.md`.
>
> Ese documento es la fuente principal para reglas de negocio fullstack. Este archivo queda como contexto rapido del frontend.

## Objetivo funcional

Modulo para gestionar presupuestos de venta orientado a fabricacion/instalacion de paneles publicitarios.

Regla documental vigente:

- El presupuesto usa `NV-0001-r_numero`.
- `estado = 'P'` significa pendiente.
- `estado = 'C'` significa cerrado.
- La futura emision CPE no cambia la PK del presupuesto; debe crear un nuevo documento tributario referenciado al `NV`.

Un presupuesto contiene:

- Cabecera `mve_venta`: `r_cod`, `r_serie`, `r_numero`, `elemento`, `r_fecemi`, `r_moneda`, `r_forma_pago_id`, `r_id_doc`, `r_documento_id`, `r_razon_social`, `r_direccion`, `glosa`, `contacto_nombre`, `contacto_celular`.
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
  r_cod,
  r_serie,
  r_numero,
  elemento,
  r_fecemi,
  r_moneda,
  r_forma_pago_id,
  r_id_doc, // constante "6" para RUC
  r_documento_id,
  r_razon_social,
  r_direccion,
  glosa,
  contacto_nombre,
  contacto_celular,
  vigencia_dias,
  trabajos: [
    {
      id,
      servicio,
      descripcion, // producto o servicio en una linea, mve_ventaserv.descripcion
      especificacion, // detalle multilinea, mve_ventaserv.especificacion
      cont_und,
      cantidad,
      precio_unitario,
      monto_base,
      igv,
      precio_neto,
      r_base002,
      r_igv002,
      r_monto_total,
      r_moneda,
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

## Catalogo de recursos

- El origen real se carga desde `${back_host}/ad_productopopupalmacen/${params.id_anfitrion}/${params.documento_id}`.
- El API devuelve `codigo`, `descripcion` y `auxiliar`.
- `auxiliar` viene concatenado como `precio_compra-cont_und-porc_igv-id_anfitrion-documento_id`; el formulario usa el primer segmento como `precio_compra`.
- En el modal de recursos, el campo `Codigo` abre un modal con `react-data-table-component`, paginacion incorporada y buscador por `codigo`, `descripcion` o `tipo`.
- Como el endpoint base no trae `tipo`, el formulario infiere tipo desde `codigo`/`descripcion`:
  - Contiene `OPERARIO`: `OPERARIO`.
  - Contiene `SERVICIO`, `IMPRESION`, `CORTE`, `ANDAMIO` o `GRUA`: `SERVICIO`.
  - Resto: `MATERIAL`.
- Filtro por tipo:
  - `MATERIAL`: muestra todo menos `OPERARIO` y `SERVICIO`.
  - `OPERARIO`: muestra solo `OPERARIO`.
  - `SERVICIO`: muestra solo `SERVICIO`.
- Al elegir un producto:
  - `codigo` recibe `codigo`.
  - `descripcion` recibe `descripcion`.
  - `unidad` recibe `cont_und`; para `SERVICIO` se fuerza `M2`.
  - El `precio_compra` parseado desde `auxiliar` alimenta `costo_unitario`, `costo_hora` o `costo_m2` segun el tipo; si no llega, queda en 0.
- `totalPresupuesto(presupuesto)`
  - Suma cada trabajo con IGV 18%.
- `resumenTributarioServicio(trabajo, r_moneda)`
  - Calcula `monto_base`, `igv`, `precio_neto`, `r_base002`, `r_igv002`, `r_monto_total` y `r_moneda` para preparar `mve_ventaserv`.

## Alineacion backend

- Backend de presupuestos separado en `xpertcont-backend-js/src/controllers/presupuesto.controllers.js`.
- Documento base usa `mve_venta`.
- Trabajos del formulario se alinean con `mve_ventaserv`.
- En `mve_ventaserv`, `descripcion` es la linea corta visible como producto/servicio y `especificacion` es el detalle largo.
- Recursos/materiales asignados al trabajo se alinearan con `mve_ventaservdet`.
- PostgreSQL es la fuente oficial de impuestos y totales tributarios; React conserva calculos preliminares solo para UX.
- Numero de presupuesto en frontend ahora se maneja como `r_cod`, `r_serie`, `r_numero`; `elemento` queda por defecto en `1`.

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
