import React from 'react';

import { MainDisplay, SideDisplay, ConnectWallet, Minter } from '@/components';

export const Landing: React.FC = () => {
  return (
    <>
      <MainDisplay>
        <Minter />
        <ConnectWallet />
      </MainDisplay>
    </>
  );
};
