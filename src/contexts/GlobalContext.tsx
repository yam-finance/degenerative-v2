import React, { useState } from 'react';

type initialState = {
  setDarkMode: (toDark_: boolean) => void;
  darkMode: boolean;
};

export const GlobalContext = React.createContext<initialState | undefined>(undefined);

export const GlobalProvider: React.FC = ({ children }) => {
  const [, setDarkMode] = useState(false);
  // TODO add logic to change color scheme

  return (
    <GlobalContext.Provider
      value={{
        setDarkMode: (toDark_: boolean) => {
          localStorage.setItem('dark_mode', String(toDark_));
          setDarkMode(toDark_);
        },
        darkMode: false,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};
