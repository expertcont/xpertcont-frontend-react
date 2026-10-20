import React from 'react';
import { Box, InputBase, MenuItem, Select, Typography } from '@mui/material';
import palette from '../../../theme/palette';

export const primarySx = { backgroundColor: palette.accent, borderColor: palette.accent, color: palette.onAccent, fontWeight: 800,
  '&:hover': { backgroundColor: palette.accent, color: palette.onAccent, filter: 'brightness(1.08)' } };
export const surfaceSx = { backgroundColor: palette.surface, border: `1px solid ${palette.borderSoft}`, borderRadius: palette.radius.listCard };
export const actionSx = { width: 30, height: 30, borderRadius: 1.5, bgcolor: palette.chip, border: `1px solid ${palette.border}`, color: palette.muted,
  '&:hover': { bgcolor: palette.accentSoft, color: palette.accent } };

export function ProductoField({ label, value, onChange, options, type = 'text', readOnly = false, maxLength, min, max, step, placeholder, multiline = false, icon }) {
  const id = React.useId();
  const inputSx = { color: palette.text, fontSize: 13, width: '100%', '& input::placeholder': { color: palette.muted, opacity: 1 } };
  return <Box sx={{ minWidth: 0 }}>
    <Typography component="label" htmlFor={id} sx={{ display: 'block', color: palette.muted, fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', mb: 0.4 }}>{label}</Typography>
    <Box sx={{ minHeight: 40, px: 1.15, display: 'flex', alignItems: 'center', gap: 0.8, bgcolor: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 2,
      '&:focus-within': { borderColor: palette.accent, bgcolor: palette.surfaceAlt } }}>
      {icon && <Box sx={{ color: palette.muted, display: 'flex' }}>{icon}</Box>}
      {options ? <Select id={id} value={value ?? ''} onChange={event => onChange(event.target.value)} disabled={readOnly} variant="standard" disableUnderline
        inputProps={{ 'aria-label': label }} sx={{ ...inputSx, '& .MuiSelect-icon': { color: palette.muted } }}
        MenuProps={{ PaperProps: { sx: { bgcolor: palette.surface, color: palette.text, border: `1px solid ${palette.border}` } } }}>
        {options.map(option => <MenuItem key={option.value} value={option.value} sx={{ fontSize: 13 }}>{option.label}</MenuItem>)}
      </Select> : <InputBase id={id} value={value ?? ''} type={type} readOnly={readOnly} onChange={event => onChange?.(event.target.value)} placeholder={placeholder}
        multiline={multiline} minRows={multiline ? 2 : undefined} sx={inputSx}
        inputProps={{ maxLength, min, max, step, 'aria-label': label, inputMode: type === 'number' ? (step === 1 ? 'numeric' : 'decimal') : undefined }} />}
    </Box>
  </Box>;
}

export function ProductoSection({ title, description, children }) {
  return <Box sx={{ ...surfaceSx, p: { xs: 1.5, sm: 2 }, mb: 1.5 }}>
    <Typography sx={{ fontSize: 13, fontWeight: 800, mb: description ? 0.3 : 1.5 }}>{title}</Typography>
    {description && <Typography sx={{ color: palette.muted, fontSize: 12, mb: 1.5 }}>{description}</Typography>}
    {children}
  </Box>;
}
