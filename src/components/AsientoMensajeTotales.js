import {Button} from "@mui/material";
import React, { useState } from 'react';

const AsientoMensajeTotales = ({ title, buttons, onCancel, onAccept, getButtonColor }) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleButtonClick = (buttonValue) => {
    setIsOpen(false);

    if (buttonValue === 'cancel') {
      onCancel();
    } else {
      onAccept(buttonValue);
    }
  };

  return (
    <div className={`custom-dialog ${isOpen ? 'open' : 'closed'}`}>
      <div className="dialog-content">
        
        <div className="buttons-container">
          {buttons.map((button) => (
            <Button
              key={button.value}
              variant='contained' 
              //fullWidth
              color={getButtonColor(button.value)}
              //style={{ color: getButtonColor(button.value) }}
              //sx={{display:'block',margin:'.0rem 0'}}              
              onClick={() => handleButtonClick(button.value)}
            >
              {button.text}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AsientoMensajeTotales;
