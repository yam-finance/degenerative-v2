import React, { useContext } from 'react';

import { EthereumContext } from '@/contexts';

interface ConnectWalletProps {
  className?: string;
}

export const ConnectWallet: React.FC<ConnectWalletProps> = ({ className }) => {
  const { setEthereum } = useContext(EthereumContext) ?? {};

  const onPress = async () => {
    if (window.ethereum && window.ethereum.request) {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      setEthereum && setEthereum(window.ethereum);
      console.log('Eth provider set');
    } else {
      console.error('No Ethereum provider available');
    }
  };

  return (
    <div
      onClick={(e) => {
        e.preventDefault();
        onPress();
      }}
      className={className}
    >
      Connect Wallet
    </div>
  );
};
