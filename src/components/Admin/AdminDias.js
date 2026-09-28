import React, { useState, useEffect, useRef } from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import palette from "../../theme/palette";

const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();

const getTodayLimaParts = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(values.year),
    month: Number(values.month),
    date: Number(values.day),
  };
};

const AdminDias = ({ period, onDaySelect }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [days, setDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState("");
  const onDaySelectRef = useRef(onDaySelect);

  useEffect(() => {
    onDaySelectRef.current = onDaySelect;
  }, [onDaySelect]);

  useEffect(() => {
    if (!period) return;

    const [year, month] = period.split("-").map(Number);
    const { year: currentYear, month: currentMonth, date: currentDate } = getTodayLimaParts();

    const daysInMonth = getDaysInMonth(year, month);
    const maxDay = year === currentYear && month === currentMonth ? currentDate : daysInMonth;

    //const dayList = Array.from({ length: maxDay }, (_, i) => (i + 1).toString());
    
    //Lista de días más el "*" al final
    const dayList = [
      ...Array.from({ length: maxDay }, (_, i) => (i + 1).toString()),
      "*",
    ];
    setDays(dayList);

    // Evitar que el estado se sobrescriba con cada render
    if (!selectedDay || !dayList.includes(selectedDay)) {
      const defaultDay = maxDay.toString();
      setSelectedDay(defaultDay);
      onDaySelectRef.current(defaultDay);
    }
  }, [period, selectedDay]);

  const handleDayChange = (event, newDay) => {
    if (newDay) {
      setSelectedDay(newDay);
      onDaySelect(newDay);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        //justifyContent: isMobile ? "center" : "start",
        justifyContent: isMobile ? "start" : "start",
        overflowX: isMobile ? "scroll" : "auto",
        p: 0,
      }}
    >
      <ToggleButtonGroup
        value={selectedDay}
        exclusive
        onChange={handleDayChange}
        sx={{
          flexWrap: isMobile ? "nowrap" : "wrap",
          //backgroundColor: "gray",
          backgroundColor:palette.chip,
          color: palette.text,
          //color: palette.surface,
          "& .MuiToggleButton-root": {
            border: "1px solid",
            borderColor: palette.border,
            //color: "inherit",
            color: palette.accent,
            "&.Mui-selected": {
              backgroundColor: palette.accent,
              borderColor: palette.accent,
              //color: "white",
              color: palette.onAccent,
              "&:hover": {
                backgroundColor: palette.accent,
                borderColor: palette.accent,
                color: palette.onAccent,
              },
            },
            "&:hover": {
              //backgroundColor: "lightgray",
              backgroundColor: palette.accentSoft,
              borderColor: palette.accent,
              color: palette.accent
            },
          },
        }}
      >
        {days.map((day) => (
          <ToggleButton
            key={day}
            value={day}
            sx={{
              minWidth: 40,
              border: "1px solid",
              borderColor: palette.border,
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
