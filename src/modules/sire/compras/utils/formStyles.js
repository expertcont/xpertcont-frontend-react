import palette from '../../../../theme/palette';

// Estilos locales: siguen las variables del tema activo sin alterar otros módulos.
export const formSx = {
  color: palette.text,
  '& .MuiTextField-root': {
    minWidth: 0,
    '& .MuiInputLabel-root': { color: palette.muted, fontSize: 12, fontWeight: 600 },
    '& .MuiInputLabel-root.Mui-focused': { color: palette.accent },
    '& .MuiOutlinedInput-root': {
      color: palette.text, bgcolor: palette.bg, fontSize: 13, borderRadius: palette.radius.control,
      '& fieldset': { borderColor: palette.border },
      '&:hover fieldset': { borderColor: palette.muted },
      '&.Mui-focused': { bgcolor: palette.surfaceAlt },
      '&.Mui-focused fieldset': { borderColor: palette.accent, borderWidth: 1 },
      '&.Mui-disabled fieldset': { borderColor: palette.borderSoft },
    },
    '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: palette.muted },
    '& .MuiInputBase-input::placeholder': { color: palette.muted, opacity: 1 },
    '& .MuiSelect-icon, & .MuiFormHelperText-root': { color: palette.muted },
    '& input[type="date"], & input[type="month"]': { colorScheme: 'inherit' },
  },
  '& .MuiButton-root': {
    textTransform: 'none', fontSize: 12, fontWeight: 700, borderRadius: palette.radius.control,
    boxShadow: 'none', minHeight: 34, color: palette.text,
    '&:hover': { bgcolor: palette.accentSoft, boxShadow: 'none' },
    '&.Mui-disabled': { color: palette.muted, opacity: 0.5 },
  },
  '& .MuiButton-outlined': { borderColor: palette.border, '&:hover': { borderColor: palette.accent } },
  '& .MuiButton-contained': {
    bgcolor: palette.accent, color: palette.onAccent,
    '&:hover': { bgcolor: palette.accent, filter: 'brightness(1.08)' },
    '&.Mui-disabled': { bgcolor: palette.chip, color: palette.muted },
  },
  '& .MuiAlert-root': { borderRadius: palette.radius.control, fontSize: 12 },
  '& .MuiAlert-standardError': { bgcolor: palette.dangerSoft, color: palette.danger, '& .MuiAlert-icon': { color: palette.danger } },
  '& .MuiAlert-standardWarning': { bgcolor: palette.warningSoft, color: palette.warning, '& .MuiAlert-icon': { color: palette.warning } },
  '& .MuiAlert-standardSuccess': { bgcolor: palette.successSoft, color: palette.success, '& .MuiAlert-icon': { color: palette.success } },
  '& .MuiAlert-standardInfo': { bgcolor: palette.accentSoft, color: palette.text, '& .MuiAlert-icon': { color: palette.accent } },
};

export const dialogPaperSx = {
  ...formSx,
  bgcolor: palette.surface, color: palette.text, backgroundImage: 'none',
  border: `1px solid ${palette.border}`, borderRadius: palette.radius.modal,
  boxShadow: palette.shadowSoft, m: { xs: 1.5, sm: 4 },
  width: { xs: 'calc(100% - 24px)', sm: '100%' }, maxHeight: 'calc(100dvh - 32px)',
  '& .MuiDialogTitle-root': { px: { xs: 2, sm: 2.5 }, py: 2, borderBottom: `1px solid ${palette.borderSoft}`, fontSize: 17, fontWeight: 800 },
  '& .MuiDialogContent-root': { px: { xs: 2, sm: 2.5 }, py: 2 },
  '& .MuiDialogContentText-root': { color: palette.muted, fontSize: 13 },
  '& .MuiDialogActions-root': { px: { xs: 2, sm: 2.5 }, py: 1.5, gap: 0.75, bgcolor: palette.surfaceAlt, borderTop: `1px solid ${palette.borderSoft}`, flexWrap: 'wrap' },
};

export const selectMenuProps = { PaperProps: { sx: {
  bgcolor: palette.surface, color: palette.text, border: `1px solid ${palette.border}`,
  borderRadius: palette.radius.control, boxShadow: palette.shadowSoft,
  '& .MuiMenuItem-root': { fontSize: 13, '&:hover': { bgcolor: palette.rowHover },
    '&.Mui-selected': { bgcolor: palette.accentSoft, '&:hover': { bgcolor: palette.accentSoft } } },
} } };

export const sectionSx = {
  border: `1px solid ${palette.borderSoft}`, borderRadius: palette.radius.content,
  p: { xs: 1.5, sm: 2 }, display: 'grid', gap: 1.75, minWidth: 0,
};
