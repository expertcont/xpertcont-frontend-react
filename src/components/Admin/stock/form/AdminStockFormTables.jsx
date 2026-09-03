import { Box, Typography } from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import ArrowDownward from "@mui/icons-material/ArrowDownward";
import Datatable from "react-data-table-component";
import palette from "../../../../theme/palette";

const listCardBg = "#1c252c";

const tablePanelSx = {
  backgroundColor: listCardBg,
  borderRadius: 1,
  overflow: "hidden",
  px: { xs: 0.25, md: 0.75 },
  py: { xs: 0.25, md: 0.75 },
  minWidth: 0,
  maxWidth: "100%",
  "& .rdt_TableWrapper": {
    maxWidth: "100%",
    overflowX: "auto",
  },
  "& .rdt_Table": {
    minWidth: { xs: 920, md: "100%" },
  },
};

const tableHeaderSx = {
  px: { xs: 1, md: 1.25 },
  py: 0.9,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 1,
  backgroundColor: listCardBg,
  borderBottom: `1px solid ${palette.borderSoft}`,
};

const dataTableStyles = {
  table: { style: { backgroundColor: listCardBg } },
  tableWrapper: { style: { backgroundColor: listCardBg } },
  responsiveWrapper: { style: { backgroundColor: listCardBg } },
  headRow: {
    style: {
      backgroundColor: listCardBg,
      color: palette.muted,
      borderBottom: `1px solid ${palette.borderSoft}`,
      minHeight: "38px",
    },
  },
  headCells: {
    style: {
      color: palette.muted,
      fontSize: "11px",
      fontWeight: 800,
      textTransform: "uppercase",
    },
  },
  rows: {
    style: {
      backgroundColor: listCardBg,
      color: palette.text,
      borderBottom: `1px solid ${palette.borderSoft}`,
      minHeight: "42px",
    },
    highlightOnHoverStyle: {
      backgroundColor: palette.surfaceAlt,
      color: palette.text,
      borderBottomColor: palette.border,
    },
  },
  cells: {
    style: {
      color: palette.text,
      fontSize: "12.5px",
      minWidth: 0,
    },
  },
};

export default function AdminStockFormTables({
  columnas,
  registrosdet,
  contextActions,
  actions,
  handleRowSelected,
}) {
  return (
    <Box sx={tablePanelSx}>
      <Box sx={tableHeaderSx}>
        <Typography sx={{ color: palette.text, fontSize: "14px", fontWeight: 800 }}>
          Detalle de almacen
        </Typography>
        <Typography sx={{ color: palette.muted, fontSize: "12px" }}>
          {`${registrosdet.length} items`}
        </Typography>
      </Box>
      <Datatable
        theme="solarized"
        columns={columnas}
        data={registrosdet}
        contextActions={contextActions}
        actions={actions}
        customStyles={dataTableStyles}
        onSelectedRowsChange={handleRowSelected}
        selectableRowsComponent={Checkbox}
        sortIcon={<ArrowDownward />}
        dense
        highlightOnHover
      />
    </Box>
  );
}
