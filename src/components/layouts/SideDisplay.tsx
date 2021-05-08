import React from 'react';

export const SideDisplay: React.FC = ({ children }) => {
  return (
    <div className="padding-8 margin-top-24 tablet-margin-top-8">
      <div className="width-64">{children}</div>
    </div>
  );
};
