import React, { useContext } from 'react';

import { Breadcrumbs } from '@/components';

import { EthereumContext } from '@/contexts';
import Plug from '@/assets/plug.png';

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
          <div className="flex-column-middle padding-top-32 landscape-flex-column-centered">
            <img className="width-full max-width-large" src={Plug}></img>
            <h1 className="text-align-center">Please connect your wallet to continue</h1>
          </div>
        )}
      </div>
    </div>
  );
};
