import palette from '../../../../theme/palette';

export const pageSx = {
  color: palette.text,
  minHeight: '100%',
  p: { xs: 0.75, md: 1 },
  display: 'grid',
  gap: 0.45,
};

export const panelSx = {
  backgroundColor: 'transparent',
  border: 0,
  borderRadius: 1,
  boxShadow: 'none',
  overflow: 'visible',
};

export const panelContentSx = {
  p: { xs: 0.65, md: 0.75 },
  '&:last-child': { pb: { xs: 0.65, md: 0.75 } },
};

export const headerSummarySx = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  alignItems: 'stretch',
  gap: 1.2,
};

export const headerBlockSx = {
  minWidth: 0,
  width: { xs: '100%', md: 700 },
  maxWidth: '100%',
};

export const titleSx = {
  color: palette.text,
  fontSize: '20px',
  fontWeight: 800,
  lineHeight: 1.1,
};

export const subtitleSx = {
  color: palette.muted,
  fontSize: '12px',
  mt: 0.25,
};

export const controlsSx = {
  display: 'flex',
  flexWrap: { xs: 'wrap', md: 'nowrap' },
  alignItems: 'center',
  gap: 0.8,
  mt: 0.65,
};

export const selectSx = {
  width: '100%',
  height: 42,
  mt: 0,
  color: palette.text,
  backgroundColor: 'rgba(26, 33, 39, 0.38)',
  border: 0,
  borderRadius: 1,
  fontSize: '13px',
  '.MuiSelect-select': {
    py: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  '& .MuiOutlinedInput-notchedOutline': { border: 0 },
  '& .MuiSelect-icon': { color: palette.muted },
  '&:hover': {
    backgroundColor: 'rgba(26, 33, 39, 0.56)',
  },
  '&.Mui-focused': {
    backgroundColor: 'rgba(34,45,53,0.64)',
  },
};

export const actionButtonSx = {
  height: 42,
  borderRadius: 1,
  boxShadow: 'none',
  fontSize: '12px',
  fontWeight: 800,
  textTransform: 'none',
  backgroundColor: 'rgba(42,161,152,0.14)',
  border: '1px solid rgba(42,161,152,0.34)',
  color: palette.text,
  '&:hover': {
    backgroundColor: palette.accent,
    color: palette.surface,
    boxShadow: 'none',
  },
};

export const toolbarSx = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: 0.7,
  mt: 0.55,
};

export const tableWrapSx = {
  mt: 0,
  '& .rdt_Table': {
    marginTop: 0,
  },
  '& .rdt_TableHead': {
    marginTop: 0,
  },
};

export const daySelectorShellSx = {
  mt: 0.55,
  maxWidth: '100%',
  overflowX: 'auto',
  '& > .MuiBox-root': {
    overflowX: 'auto',
  },
  '& .MuiToggleButtonGroup-root': {
    flexWrap: 'nowrap',
    maxWidth: '100%',
  },
};

export const iconRailSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.65,
};

export const iconButtonSx = {
  width: 40,
  height: 40,
  borderRadius: 1,
  backgroundColor: 'rgba(139,154,165,0.10)',
  color: palette.muted,
  transition: 'all 0.18s ease',
  '&:hover': {
    backgroundColor: 'rgba(42,161,152,0.18)',
    color: palette.text,
  },
};

export const warningIconButtonSx = {
  ...iconButtonSx,
  color: '#f4c46f',
  '&:hover': {
    backgroundColor: 'rgba(245,158,11,0.18)',
    color: '#ffd98a',
  },
};

export const backIconButtonSx = {
  ...iconButtonSx,
  color: '#a8c7ff',
  '&:hover': {
    backgroundColor: 'rgba(96,165,250,0.18)',
    color: '#d7e7ff',
  },
};

export const searchFieldSx = {
  maxWidth: { xs: '100%', md: 620 },
  order: 0,
  '& .MuiOutlinedInput-root': {
    minHeight: 42,
    color: palette.text,
    backgroundColor: 'rgba(26, 33, 39, 0.48)',
    borderRadius: 1,
    '& fieldset': { borderColor: 'rgba(139,154,165,0.14)' },
    '&:hover': { backgroundColor: 'rgba(26, 33, 39, 0.62)' },
    '&:hover fieldset': { borderColor: 'rgba(42,161,152,0.24)' },
    '&.Mui-focused': { backgroundColor: 'rgba(34,45,53,0.66)' },
    '&.Mui-focused fieldset': { borderColor: 'rgba(42,161,152,0.42)' },
  },
  '& input': {
    color: palette.text,
    fontSize: '13px',
    fontWeight: 400,
    lineHeight: 1.4375,
  },
  '& input::placeholder': {
    color: palette.muted,
    opacity: 1,
  },
  '& .MuiInputAdornment-root': {
    color: palette.muted,
  },
};

export const summaryPillSx = {
  display: 'grid',
  gap: 0.35,
  alignContent: 'start',
  color: palette.muted,
  width: { xs: '100%', md: 300 },
};

export const summaryLineSx = {
  display: 'grid',
  gridTemplateColumns: '90px minmax(0, 1fr)',
  alignItems: 'center',
  gap: 0.75,
};

export const summaryLabelSx = {
  color: 'rgba(139,154,165,0.88)',
  fontSize: '12px',
  fontWeight: 600,
};

export const summaryValueSx = {
  color: palette.text,
  fontSize: '13px',
  fontWeight: 700,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

export const dialogPaperSx = {
  background: 'rgba(30, 39, 46, 0.96)',
  color: palette.text,
  borderRadius: 1,
  border: '1px solid rgba(139,154,165,0.14)',
};
