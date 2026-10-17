# SIRE Compras

Modulo de frontend independiente de Comercial y Transportes.

- `index.js`: entrada publica que importa App.js.
- `pages/`: composicion de la pantalla.
- `components/`: filtros de empresa/periodo, ticket y revision de resultados propios.
- `hooks/`: carga, contexto y acciones de Compras.
- `services/`: API HTTP y exportacion Excel.
- `utils/`: formato y columnas de las vistas.
- `tests/`: pruebas de comportamiento del modulo.

Solo utiliza infraestructura compartida de la aplicacion: tema, buscador, autenticacion y navegacion. No importa componentes de Admin, Comercial o Transportes.

Las URL existentes se conservan. El backend correspondiente esta en src/modules/sire/compras del repositorio xpertcont-backend-js.

Pruebas: npm test -- --watchAll=false --runInBand --runTestsByPath src/modules/sire/compras/tests/SireComprasPage.test.jsx

## Diseno de pantalla

Conserva la distribucion de SIRE Ventas: cabecera con buscador, filtros compactos de periodo y empresa, selector de dias y pestanas Registro, Propuesta SUNAT, Comparacion, Observaciones y Exportar. Ticket, archivo y cantidad de registros se muestran dentro de Propuesta SUNAT. Los filtros afectan las vistas y las exportaciones. Los componentes siguen siendo propios de SIRE Compras.


Propuesta personalizada: components/SireComprasPersonalizada.jsx y hooks/usePersonalizada.js.
CRUD independiente del estado de recuperacion del ticket. Se carga al abrir su pestana.
Requiere el SQL del backend docs/sql/mco_sire_personalizada.sql.
Permite alta/edicion manual, exclusion reversible y pendientes con periodo de revision;
las exportaciones Excel separan compras por declarar del reporte de revision.
