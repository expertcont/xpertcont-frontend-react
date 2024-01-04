import 'react-international-phone/style.css';

import {InputAdornment,MenuItem,Select,TextField,Typography} from '@mui/material';
import React from 'react';
import {defaultCountries,FlagImage,parseCountry,usePhoneInput} from 'react-international-phone';

const MuiPhone = ({ value, onChange, ...restProps }) => {
  const { inputValue, handlePhoneValueChange, inputRef, country, setCountry } =
    usePhoneInput({
      defaultCountry: 'pe',
      value,
      countries: defaultCountries,
      onChange: (data) => {
        onChange(data.phone,data.country);
      },
    });
    
    const handleInputFocus = (e) => {
      // Enfocar automáticamente al final del valor cuando se selecciona el input
      e.target.setSelectionRange(inputValue.length, inputValue.length);
    };
  
    /*const handleInputKeyDown = (e) => {
      // Prevenir la eliminación del código de país usando la tecla de retroceso
      if (e.key === 'Backspace' && inputValue === `+${country.dialCode}`) {
        e.preventDefault();
      }
    };*/
    const handleInputKeyDown = (e) => {
      if (e.key === 'Backspace' && inputValue === `+${country.dialCode}`) {
        e.preventDefault();
      }
      if (e.key === 'Delete' && inputValue === `+${country.dialCode}`) {
        e.preventDefault();
      }
      //console.log(country.dialCode);
    };
            
  return (
    <TextField
      variant="outlined"
      //label="Phone number"
      color="primary"
      placeholder="Numero Telefonico"
      value={inputValue}
      onChange={handlePhoneValueChange}
      onFocus={handleInputFocus}
      onKeyDown={handleInputKeyDown}      
      type="tel"
      inputRef={inputRef}
      InputProps={{
        startAdornment: (
          <InputAdornment
            position="start"
            style={{ marginRight: '2px', marginLeft: '-8px' }}
          >
            <Select
              MenuProps={{
                style: {
                  height: '300px',
                  width: '360px',
                  top: '10px',
                  left: '-34px',
                },
                transformOrigin: {
                  vertical: 'top',
                  horizontal: 'left',
                },
              }}
              sx={{
                width: 'max-content',
                // Remove default outline (display only on focus)
                fieldset: {
                  display: 'none',
                },
                '&.Mui-focused:has(div[aria-expanded="false"])': {
                  fieldset: {
                    display: 'block',
                  },
                },
                // Update default spacing
                '.MuiSelect-select': {
                  padding: '8px',
                  paddingRight: '24px !important',
                },
                svg: {
                  right: 0,
                },
              }}
              value={country.iso2}
              onChange={(e) => setCountry(e.target.value)}
              renderValue={(value) => (
                <FlagImage iso2={value} style={{ display: 'flex' }} />
              )}
            >
              {defaultCountries.map((c) => {
                const country = parseCountry(c);
                return (
                  <MenuItem key={country.iso2} value={country.iso2}>
                    <FlagImage
                      iso2={country.iso2}
                      style={{ marginRight: '8px' }}
                    />
                    <Typography marginRight="8px">{country.name}</Typography>
                    <Typography color="gray">+{country.dialCode}</Typography>
                  </MenuItem>
                );
              })}
            </Select>
          </InputAdornment>
        ),
      }}
      {...restProps}
    />
  );
};

export default MuiPhone;