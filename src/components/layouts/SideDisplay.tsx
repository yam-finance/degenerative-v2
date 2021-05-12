import React from 'react';

export const SideDisplay: React.FC = ({ children }) => {
  return (
    <div className="padding-8 portrait-padding-0 margin-top-24 tablet-margin-top-8 landscape-margin-top-8 portrait-margin-top-0">
      <div className="width-64">{children}</div>
    </div>
  );
};
