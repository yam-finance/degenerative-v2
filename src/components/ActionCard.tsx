import React from 'react';

export const ActionCard: React.FC = ({ children }) => {
  return (
    <form className="max-width-small margin-auto flex-column padding-4 radius-xl background-color-2 box-shadow-large max-width-large">
      {children}
    </form>
  );
};
