import React from 'react';
import { EthereumProvider } from './EthereumContext';
import { UserProvider } from './UserContext';
import { GlobalProvider } from './GlobalContext';
import { MarketProvider } from './MarketContext';
import { QueryClient, QueryClientProvider } from 'react-query';

const queryClient = new QueryClient();

const ContextProviders: React.FC = ({ children }) => {
  return (
    <GlobalProvider>
      <QueryClientProvider client={queryClient}>
        <MarketProvider>
          <EthereumProvider>
            <UserProvider>{children}</UserProvider>
          </EthereumProvider>
        </MarketProvider>
      </QueryClientProvider>
    </GlobalProvider>
  );
};

export * from './EthereumContext';
export * from './UserContext';
export * from './MarketContext';
export * from './GlobalContext';
export default ContextProviders;
