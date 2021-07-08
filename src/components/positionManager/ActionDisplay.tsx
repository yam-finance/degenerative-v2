import React from 'react';

interface ActionDisplayProps {
  title?: string;
  onChange?: () => void;
  onClick?: () => void;
}

export const ActionDisplay: React.FC<ActionDisplayProps> = ({ children }) => {
  return (
    <div className="margin-0 w-form">
      <div className="width-full max-width-medium portrait-max-width-full flex-column-middle background-color-2 padding-8 radius-xl box-shadow-large z-1 padding-y-12 landscape-padding-2">
        {children}
      </div>
    </div>
  );
};
