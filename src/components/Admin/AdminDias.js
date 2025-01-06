import React, { useState, useEffect } from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { Box, useMediaQuery, useTheme } from "@mui/material";

const getDaysInMonth = (year, month) => {
  // Resta 1 al mes para ajustarse al índice de JavaScript
  return new Date(year, month, 0).getDate();
};

const AdminDias = ({ period, onDaySelect }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [days, setDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState("");

  useEffect(() => {
    const [year, month] = period.split("-").map(Number);
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDate = today.getDate();

    const daysInMonth = getDaysInMonth(year, month);
    const maxDay = year === currentYear && month === currentMonth ? currentDate : daysInMonth;

    const dayList = Array.from({ length: maxDay }, (_, i) => (i + 1).toString());
    setDays(dayList);

    const defaultDay = year === currentYear && month === currentMonth ? currentDate.toString() : daysInMonth.toString();
    setSelectedDay(defaultDay);
    onDaySelect(defaultDay);
  }, [period, onDaySelect]);

  const handleDayChange = (event, newDay) => {
    if (newDay !== null) {
      setSelectedDay(newDay);
      onDaySelect(newDay);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isMobile ? "center" : "start",
        overflowX: isMobile ? "scroll" : "auto",
        p: 1,
      }}
    >
      <ToggleButtonGroup
        value={selectedDay}
        exclusive
        onChange={handleDayChange}
        sx={{ flexWrap: isMobile ? "nowrap" : "wrap" }}
      >
        {days.map((day) => (
          <ToggleButton
            key={day}
            value={day}
            sx={{
              minWidth: 40,
              border: "1px solid",
              borderColor: theme.palette.divider,
            }}
          >
            {day}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
};

export default AdminDias;
