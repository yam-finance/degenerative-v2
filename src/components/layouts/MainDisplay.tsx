import React from 'react';

import { Breadcrumb } from '@/components';

export const MainHeading: React.FC = ({ children }) => {
  return <h1 className="margin-top-8 margin-left-8 text-large">{children}</h1>;
};

export const MainDisplay: React.FC = ({ children }) => {
  return (
    <div className="expand flex-column">
      <Breadcrumb></Breadcrumb>
      <div className="background-color-1 border-1px sheen radius-top-xl margin-top-8 expand">{children}</div>
    </div>
  );
};
