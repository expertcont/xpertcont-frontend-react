// components/ui/AppSearch.jsx

import { Box, InputBase } from "@mui/material";
import { Search } from "lucide-react";
import palette from "../../theme/palette";

export default function AppSearch({
  placeholder,
  value,
  onChange,
  width = { xs: "95%", sm: 260 },
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

        px: 1.5,
        py: 0.75,

        width,
      }}
    >
      <Search
        size={16}
        color={palette.muted}
      />

      <InputBase
        value={value}
        onChange={onChange}
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