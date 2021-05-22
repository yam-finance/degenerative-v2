import React from 'react';
import { EthereumProvider } from './EthereumContext';
import { UserProvider } from './UserContext';
import { GlobalProvider } from './GlobalContext';
import { MarketProvider } from './MarketContext';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Web3ReactProvider } from '@web3-react/core';
import { providers } from 'ethers';

const queryClient = new QueryClient();

const getLibrary = (provider: any): providers.Web3Provider => {
  const library = new providers.Web3Provider(provider);
  library.pollingInterval = 15000;
  return library;
};

const ContextProviders: React.FC = ({ children }) => {
  return (
    <GlobalProvider>
      <QueryClientProvider client={queryClient}>
        <EthereumProvider>
          <MarketProvider>
            <UserProvider>{children}</UserProvider>
          </MarketProvider>
        </EthereumProvider>
      </QueryClientProvider>
    </GlobalProvider>
  );
};

export * from './EthereumContext';
export * from './UserContext';
export * from './MarketContext';
export * from './GlobalContext';
export default ContextProviders;
