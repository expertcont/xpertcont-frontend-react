import { Card } from '@mui/material';
import Checkbox from '@mui/material/Checkbox';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import Datatable from 'react-data-table-component';

export default function AdminVentaFormTables({
  columnas,
  columnasref,
  registrosdet,
  registrosref,
  contextActions,
  actions,
  handleRowSelected,
}) {
  return (
    <>
      <Card
        sx={{ mt: 1 }}
        style={{
          background: '#1e272e',
          padding: '1rem',
        }}
      >
        <Datatable
          theme="solarized"
          columns={columnas}
          data={registrosdet}
          contextActions={contextActions}
          actions={actions}
          onSelectedRowsChange={handleRowSelected}
          selectableRowsComponent={Checkbox}
          sortIcon={<ArrowDownward />}
          dense={true}
          highlightOnHover
        />
      </Card>

      <Card
        sx={{ mt: 1 }}
        style={{
          background: '#1e272e',
          padding: '1rem',
        }}
      >
        <Datatable
          theme="solarized"
          columns={columnasref}
          data={registrosref}
          onSelectedRowsChange={handleRowSelected}
          selectableRowsComponent={Checkbox}
          sortIcon={<ArrowDownward />}
          dense={true}
          highlightOnHover
        />
      </Card>
    </>
  );
}
