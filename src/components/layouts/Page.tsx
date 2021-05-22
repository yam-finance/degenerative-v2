import React from 'react';

export const Page: React.FC = ({ children }) => {
  return <div className="flex-row min-height-viewport-full tablet-flex-column">{children}</div>;
};
