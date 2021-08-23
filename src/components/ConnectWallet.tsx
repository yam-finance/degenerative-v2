import React, { useContext } from 'react';
import { EthereumContext } from '@/contexts';

import { useTranslation } from 'react-i18next';

interface ConnectWalletProps {
  className?: string;
}

export const ConnectWallet: React.FC<ConnectWalletProps> = ({ className }) => {
  const { setEthereum } = useContext(EthereumContext);
  const { t } = useTranslation();

  const onPress = async () => {
    if (window.ethereum && window.ethereum.request) {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      setEthereum(window.ethereum);
      console.log('Eth provider set');
    } else {
      console.error('No Ethereum provider available');
    }
  };

  return (
    <div
      onClick={async (e) => {
        e.preventDefault();
        await onPress();
      }}
      className={className}
    >
      {t('menu-L-connect')}
    </div>
  );
};
