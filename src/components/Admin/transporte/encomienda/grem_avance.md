# Avance GREM Encomiendas

## Pantalla propia

- Se creo ruta React:
  - `/ad_transportegrem/:id_anfitrion/:id_invitado/:periodo/:documento_id`
- Se agrego opcion `GREM` en menu `Transportes`.
- Componente principal:
  - `src/components/Admin/transporte/encomienda/TrGremEncomiendaList.js`
- Importante:
  - Ya no reutiliza `TrModuloBase`.
  - El listado general de encomiendas quedo sin icono GRE, sin checkboxes y sin panel de seleccion GREM.

## Panel GREM

- Muestra solo encomiendas pendientes de entrega:
  - `entrega_fecha IS NULL`
  - En frontend se usa `!item.entregada`.
- Fila visual tipo `Encomiendas por Entregar`:
  - Checkbox.
  - Numero de encomienda.
  - Rem / Dest.
  - Monto con icono de cubo.
  - Fecha.
  - Destino abajo con icono de ubicacion.
  - Glosa/descripcion al costado del destino.
- Toda la fila es clickeable para seleccionar/deseleccionar, util para celular.

## Modos de carga

Hay interruptor grande:

- `Escoger de listado`
- `Escanear QR`

### Escoger de listado

- Usa `seleccionKeys`.
- Permite seleccionar desde la lista visible.
- Tiene opcion `Seleccionar visibles`.

### Escanear QR

- Usa array propio `scannerKeys`.
- Al cambiar a scanner, el input recibe foco automaticamente para lector tipo teclado.
- Reconoce codigos tipo:
  - `B001-1234567`
  - `B0011234567`
- Normaliza numero con ceros para comparar con `r_numero`.
- Agrega automaticamente la encomienda encontrada a la bandeja scanner.
- La bandeja scanner muestra solo lo escaneado.
- Click en una fila escaneada la quita de la bandeja.

## LocalStorage scanner

- `scannerKeys` se guarda en `localStorage`.
- Clave:
  - `grem_scanner_${id_anfitrion}_${documento_id}_${periodo}_${diaSel}`
- Sirve para no perder escaneos si se refresca/cambia la pantalla.
- Al volver a modo scanner se lee nuevamente la memoria.
- Boton `Limpiar memoria`:
  - limpia `scannerKeys`
  - borra localStorage del contexto actual
  - vuelve a enfocar input
- Al emitir GREM correctamente tambien se limpia memoria scanner.

## Seleccion para emitir

Antes de emitir hay dos listas posibles:

- Modo listado:
  - `seleccionadas`
- Modo scanner:
  - `escaneadas`

Se decide con:

```js
const seleccionEmision = modoCarga === "scanner" ? escaneadas : seleccionadas;
```

`AdminSunatGreTransIcon` recibe `seleccionEmision`.

## Backend GREM

Endpoints administrativos ya agregados:

- `POST /mve_transventa/grem/payload`
- `POST /mve_transventa/grem/sunat`

Controller:

- `xpertcont-backend-js/src/controllers/ventatrans.controllers.js`
- Arma payload `TRANS_GREM`.
- Llama API SUNAT externa:
  - `https://expertcont-api-sunat.up.railway.app/gretranssunat`
- Guarda referencia `grem_*` en `mve_transventa` si existen columnas.

### Revision antes de probar SUNAT

Hay dos capas distintas que revisar/ajustar antes de prueba real:

#### 1. Backend administrativo Xpertcont

Proyecto:

- `xpertcont-backend-js`

Archivo principal:

- `src/controllers/ventatrans.controllers.js`

Endpoints:

- `POST /mve_transventa/grem/payload`
  - Solo arma y devuelve el payload.
  - Funcion relacionada: `responderPayloadGremTransporte`.
  - Usa `generarPayloadGremTransporte`.
  - Aqui revisar el JSON final que saldra hacia API SUNAT.

- `POST /mve_transventa/grem/sunat`
  - Arma payload y llama al backend API SUNAT.
  - Funcion relacionada: `generarGremSunatTransporte`.
  - Endpoint externo llamado:
    - `https://expertcont-api-sunat.up.railway.app/gretranssunat`
  - Luego guarda referencia local `grem_*` en `mve_transventa`.
  - Pendiente: guardar tambien cabecera/detalle en `mve_transgrem` y `mve_transgremdet`.

#### 2. Backend API SUNAT

Proyecto externo/API:

- `expertcont-api-sunat`

Endpoint a revisar/implementar:

- `POST /gretranssunat`

Responsabilidad:

- Recibir payload `TRANS_GREM`.
- Generar XML GRE Transportista codigo `31`.
- Firmar XML.
- Enviar a SUNAT.
- Obtener/interpretar CDR.
- Devolver datos esperados por backend administrativo:
  - `serie`
  - `numero`
  - `codigo_hash`
  - `respuesta_sunat_descripcion`
  - `ruta_xml`
  - `ruta_cdr`
  - `ruta_pdf`

Detalle critico:

- Primero probar `POST /mve_transventa/grem/payload` y comparar el JSON contra lo que `/gretranssunat` realmente espera.
- Despues ajustar mapping/campos en cualquiera de las dos capas antes de intentar envio real a SUNAT.

## SQL

Scripts en backend:

- `xpertcont-backend-js/docs/sql/mve_transventa_grem_columns.sql`
  - agrega columnas rapidas en `mve_transventa`:
    - `grem_cod`
    - `grem_serie`
    - `grem_numero`
    - `grem_vfirmado`
    - `grem_cdr_descripcion`

- `xpertcont-backend-js/docs/sql/mve_transgrem_tables.sql`
  - contiene tablas:
    - `public.mve_transgrem`
    - `public.mve_transgremdet`
  - Estructura alineada al formato indicado por Oscar:
    - PK compuesta por `id_usuario`, `documento_id`, `periodo`, `cod`, `serie`, `numero`.
    - Detalle `mve_transgremdet` con referencia a encomienda:
      - `r_periodo`
      - `r_cod`
      - `r_serie`
      - `r_numero`

## Avance agregado en esta continuacion

- Arquitectura GREM:
  - La ruta historica sigue apuntando a `TrGremEncomiendaList.js`.
  - `TrGremEncomiendaList.js` quedo como wrapper simple.
  - La implementacion real se movio a carpeta propia:
    - `src/components/Admin/transporte/encomienda/grem/GremPage.jsx`
    - `src/components/Admin/transporte/encomienda/grem/GremList.jsx`
    - `src/components/Admin/transporte/encomienda/grem/GremEditorDialog.jsx`
    - `src/components/Admin/transporte/encomienda/grem/GremEncomiendaRow.jsx`
    - `src/components/Admin/transporte/encomienda/grem/gremUtils.js`
    - `src/components/Admin/transporte/encomienda/grem/gremStyles.js`
  - Flujo visual nuevo:
    - primera vista lista GREM registradas
    - boton `Agregar` abre el editor
    - dentro del editor primero solo se puede escoger encomiendas por listado o QR
    - boton `Grabar GRE` abre recien el formulario de cabecera
    - desde la cabecera se puede `Grabar GRE` localmente o `Enviar SUNAT`
  - Estilos GREM alineados con el modulo de encomiendas:
    - tarjetas tipo `TrOperacionRow`
    - boton principal tipo `AppButton`
    - acciones compactas con iconos
    - espaciado, radio, bordes y hover usando `palette`
    - modal mas compacto en desktop y scroll estilizado

- Backend GREM local:
  - Nuevo `GET /mve_transventa/grem/:periodo/:id_anfitrion/:documento_id`
    - lista cabecera GREM con cantidad y detalles.
  - Nuevo `POST /mve_transventa/grem/grabar`
    - genera numero si no se ingresa.
    - guarda cabecera/detalle local.
    - marca encomiendas con `grem_*`.
  - `POST /mve_transventa/grem/sunat` tambien genera numero si no se envia.

- Backend administrativo:
  - `POST /mve_transventa/grem/sunat` ahora intenta guardar cabecera en `mve_transgrem`.
  - Guarda detalle en `mve_transgremdet` con las encomiendas incluidas.
  - La persistencia local queda transaccional:
    - cabecera GREM
    - detalle GREM
    - marca `grem_*` en `mve_transventa`
  - Si las tablas nuevas todavia no existen o falla cabecera/detalle, intenta igual marcar `grem_*` en `mve_transventa` y devuelve `persistencia_advertencia`.

- Frontend scanner:
  - Se agrego feedback visual del escaneo:
    - agregado OK
    - ya escaneado
    - no encontrado
    - ya tiene GREM
    - entregada
  - El mensaje se limpia automaticamente y se reinicia al cambiar contexto/modo.

- Formulario al pulsar `Emitir GREM`:
  - Se acondiciono el dialogo de emision en `AdminSunatGreTransIcon`.
  - Ahora muestra resumen de destino y ruta.
  - Lista las encomiendas incluidas en la GREM.
  - Ordena campos por secciones:
    - Identificacion
    - Traslado
    - Partida
    - Llegada
    - Vehiculo y conductor
    - Carga
  - Usa selectores para motivo/modalidad de traslado.
  - Peso total y bultos se inicializan con la cantidad de encomiendas seleccionadas.
  - Se retiro el monto flete del formulario porque no es dato minimo de emision GRE.
  - Se agregaron ubigeo/direccion de partida y llegada como datos editables y obligatorios.
  - Backend valida antes de armar/enviar payload:
    - serie
    - fecha traslado
    - motivo/modalidad
    - partida ubigeo/direccion
    - llegada ubigeo/direccion
    - placa
    - conductor DNI/nombres/apellidos/licencia
    - peso total
    - numero de bultos

## Pendientes sugeridos

- Definir correlativo de GRE:
  - serie por defecto actual en frontend: `V001`.
  - numero se envia vacio si no se ingresa.
- Implementar/validar endpoint externo `/gretranssunat` en backend API SUNAT.
- Probar `POST /mve_transventa/grem/payload` con data real y comparar contrato contra `/gretranssunat`.
- Probar emision SUNAT real luego de aplicar SQL:
  - `xpertcont-backend-js/docs/sql/mve_transventa_grem_columns.sql`
  - `xpertcont-backend-js/docs/sql/mve_transgrem_tables.sql`
