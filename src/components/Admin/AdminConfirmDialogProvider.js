import React, { createContext, useContext, useState, useCallback } from "react";
import ConfirmDialog from "./AdminConfirmDialog";

const DialogContext = createContext();

export const AdminConfirmDialogProvider = ({ children }) => {
  const [dialogOptions, setDialogOptions] = useState(null);
  const [resolvePromise, setResolvePromise] = useState(null);

  const confirmDialog = useCallback((options) => {
    return new Promise((resolve) => {
      setDialogOptions(options);
      setResolvePromise(() => resolve);
    });
  }, []);

  const handleClose = (isConfirmed) => {
    if (resolvePromise) {
      resolvePromise({ isConfirmed });
    }
    setDialogOptions(null);
    setResolvePromise(null);
  };

  return (
    <DialogContext.Provider value={{ confirmDialog }}>
      {children}
      <ConfirmDialog
        open={!!dialogOptions}
        options={dialogOptions}
        onClose={handleClose}
      />
    </DialogContext.Provider>
  );
};

export const useDialog = () => useContext(DialogContext);
