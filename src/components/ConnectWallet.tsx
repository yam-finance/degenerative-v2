import React from 'react';
import { useEthers } from '@usedapp/core';
import Web3Modal from 'web3modal';
import WalletConnectProvider from '@walletconnect/web3-provider';

import { EthNodeUrl } from '@/utils';

//const providerOptions = {
//  injected: {
//    display: {
//      description: 'Connect with a browser extension',
//    },
//    package: null,
//  },
//  walletconnect: {
//    package: WalletConnectProvider.default,
//    options: {
//      infuraId: 'https://mainnet.infura.io/v3/e97472e46b4f4c4c8720c51041bc0c1b',
//    },
//    display: {
//      description: 'Scan with a wallet to connect',
//    },
//  },
//};

interface ConnectWalletProps {
  className?: string;
}

export const ConnectWallet: React.FC<ConnectWalletProps> = ({ className }) => {
  const { activateBrowserWallet, account, activate } = useEthers();

  const launchModalLazy = async () => {
    const [WalletConnectProvider, Web3Modal] = await Promise.all([
      import('@walletconnect/web3-provider'),
      import('web3modal'),
    ]);

    const providerOptions = {
      injected: {
        display: {
          description: 'Connect with a browser extension',
        },
        package: null,
      },
      walletconnect: {
        package: WalletConnectProvider.default,
        options: {
          infuraId: 'https://mainnet.infura.io/v3/e97472e46b4f4c4c8720c51041bc0c1b',
        },
        display: {
          description: 'Scan with a wallet to connect',
        },
      },
    };

    const web3Modal = new Web3Modal.default({
      cacheProvider: true,
      providerOptions,
    });

    return web3Modal.connect();
  };

  return (
    <button onClick={async () => await launchModalLazy()} className={className}>
      Connect Wallet
    </button>
  );
};
