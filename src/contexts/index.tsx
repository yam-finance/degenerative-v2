import React from 'react';
import { UserProvider } from './UserContext';
import { MarketProvider } from './MarketContext';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ChainId, DAppProvider, Config } from '@usedapp/core';
import { EthNodeUrl } from '@/utils';

const queryClient = new QueryClient();

const config: Config = {
  readOnlyChainId: ChainId.Mainnet,
  readOnlyUrls: {
    [ChainId.Mainnet]: EthNodeUrl,
  },
};

const ContextProviders: React.FC = ({ children }) => {
  return (
    <DAppProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <MarketProvider>
          <UserProvider>{children}</UserProvider>
        </MarketProvider>
      </QueryClientProvider>
    </DAppProvider>
  );
};

export * from './EthereumContext';
export * from './UserContext';
export * from './MarketContext';
export default ContextProviders;
