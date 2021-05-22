import React from 'react';

export const SideDisplay: React.FC = ({ children }) => {
  return (
    <div className="padding-8 portrait-padding-3 margin-top-24 flex-column-middle tablet-margin-top-8 tablet-padding-bottom-32 landscape-padding-bottom-32 portrait-padding-bottom-32 landscape-margin-top-8 portrait-margin-top-0">
      <div className="width-64 tablet-width-full max-width-small">{children}</div>
    </div>
  );
};
