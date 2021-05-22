import React, { useContext } from 'react';

import { Breadcrumbs } from '@/components';

import { EthereumContext } from '@/contexts';

export const MainHeading: React.FC<{ className?: string }> = ({ className, children }) => {
  return <h1 className={`margin-top-8 margin-left-8 text-large ${className}`}>{children}</h1>;
};

export const MainDisplay: React.FC = ({ children }) => {
  const { account } = useContext(EthereumContext);

  return (
    <div className="expand flex-column">
      <Breadcrumbs />
      <div className="background-color-1 border-1px sheen radius-top-xl margin-top-8 expand">
        {account ? (
          children
        ) : (
          <div className="flex-align-center flex-justify-center padding-top-48 landscape-flex-column-centered">
            Please connect your wallet
          </div>
        )}
      </div>
    </div>
  );
};
