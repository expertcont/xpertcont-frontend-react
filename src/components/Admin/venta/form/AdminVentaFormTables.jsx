import { Box, Typography } from '@mui/material';
import Checkbox from '@mui/material/Checkbox';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import Datatable from 'react-data-table-component';
import palette from '../../../../theme/palette';

const tablePanelSx = {
  mt: 1,
  backgroundColor: palette.surface,
  border: `1px solid ${palette.borderSoft}`,
  borderRadius: 2,
  overflow: 'hidden',
};

const tableHeaderSx = {
  px: { xs: 1, md: 1.25 },
  py: 0.9,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 1,
  backgroundColor: palette.surfaceAlt,
  borderBottom: `1px solid ${palette.borderSoft}`,
};

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
      <Box sx={tablePanelSx}>
        <Box sx={tableHeaderSx}>
          <Typography sx={{ color: palette.text, fontSize: '14px', fontWeight: 800 }}>
            Detalle de venta
          </Typography>
          <Typography sx={{ color: palette.muted, fontSize: '12px' }}>
            {`${registrosdet.length} items`}
          </Typography>
        </Box>
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
      </Box>

      <Box sx={tablePanelSx}>
        <Box sx={tableHeaderSx}>
          <Typography sx={{ color: palette.text, fontSize: '14px', fontWeight: 800 }}>
            Referencias
          </Typography>
          <Typography sx={{ color: palette.muted, fontSize: '12px' }}>
            {`${registrosref.length} vinculadas`}
          </Typography>
        </Box>
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
      </Box>
    </>
  );
}
