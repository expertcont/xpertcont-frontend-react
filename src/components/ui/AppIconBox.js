// components/ui/AppIconBox.jsx
import { Box } from "@mui/material";
import palette from "../../theme/palette";

export default function AppIconBox({ children }) {
    return (
      <Box
        sx={{
          width: 30,
          height: 30,
          borderRadius: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: palette.accentSoft,
          color: palette.accent,
        }}
      >
        {children}
      </Box>
    );
  }