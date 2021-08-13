import React from 'react';
import { useEthers } from '@usedapp/core';

interface ConnectWalletProps {
  className?: string;
}

export const ConnectWallet: React.FC<ConnectWalletProps> = ({ className }) => {
  const { activateBrowserWallet, account } = useEthers();

  return (
    <button onClick={() => activateBrowserWallet()} className={className}>
      Connect Wallet
    </button>
  );
};
