import React from 'react';
import { EthereumProvider } from './EthereumContext';
import { UserProvider } from './UserContext';
import { MarketProvider } from './MarketContext';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ChainId, DAppProvider, Config, MULTICALL_ADDRESSES } from '@usedapp/core';
import { EthNodeUrl } from '@/utils';
import { providers } from 'ethers';

const queryClient = new QueryClient();

const getLibrary = (provider: any): providers.Web3Provider => {
  const library = new providers.Web3Provider(provider);
  library.pollingInterval = 15000;
  return library;
};

const config: Config = {
  multicallAddresses: {
    ...MULTICALL_ADDRESSES,
  },
  readOnlyChainId: ChainId.Mainnet,
  readOnlyUrls: {
    [ChainId.Mainnet]: EthNodeUrl,
  },
};

const ContextProviders: React.FC = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <DAppProvider config={config}>
        <MarketProvider>
          <UserProvider>{children}</UserProvider>
        </MarketProvider>
      </DAppProvider>
    </QueryClientProvider>
  );
};

export * from './EthereumContext';
export * from './UserContext';
export * from './MarketContext';
export default ContextProviders;
