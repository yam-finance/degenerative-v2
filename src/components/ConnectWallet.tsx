import React from 'react';
import { useEthers } from '@usedapp/core';
import WalletConnectProvider from "@walletconnect/web3-provider";


const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      1: 
    }
  }
}
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
