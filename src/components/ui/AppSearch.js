// components/ui/AppSearch.jsx

import { Box, InputBase } from "@mui/material";
import { Search } from "lucide-react";
import palette from "../../theme/palette";

export default function AppSearch({
  placeholder,
  value,
  onChange,
  onKeyDown,
  width = { xs: "95%", sm: 260 },
  height,
  inputRef,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,

        backgroundColor: palette.surface,
        border: `1px solid ${palette.border}`,
        borderRadius: 2,

        px: height ? 1.25 : 1.5,
        py: height ? 0.5 : 0.75,
        height,

        width,
        minWidth: 0,
        boxSizing: "border-box",
      }}
    >
      <Search
        size={16}
        color={palette.muted}
      />

      <InputBase
        inputRef={inputRef}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        sx={{
          color: palette.text,
          fontSize: "13px",
          width: "100%",

          "& input::placeholder": {
            color: palette.muted,
            opacity: 1,
          },
        }}
      />
    </Box>
  );
}
