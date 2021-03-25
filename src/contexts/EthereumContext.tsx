import React, { createContext, useState, useEffect, useCallback } from 'react';
import { providers, Signer } from 'ethers';

declare global {
  interface Window {
    ethereum: providers.BaseProvider;
  }
}

const initialState = {
  ethereum: undefined as providers.BaseProvider | undefined,
  setEthereum: (ethereum_: providers.BaseProvider | undefined) => {},
  provider: undefined as providers.Web3Provider | undefined,
  signer: undefined as Signer | undefined,
  chainId: 0 as number,
  account: undefined as string | undefined,
};

export const EthereumContext = createContext(initialState);

export const EthereumProvider: React.FC = ({ children }) => {
  const [ethereum, setEthereum] = useState<providers.BaseProvider | undefined>(window.ethereum);
  const [provider, setProvider] = useState<providers.Web3Provider>();
  const [signer, setSigner] = useState<Signer>();
  const [account, setAccount] = useState<string | undefined>(undefined);
  const [chainId, setChainId] = useState<number>(1);

  useEffect(() => {
    // Mainnet
    if (ethereum) {
      const web3 = new providers.Web3Provider(window.ethereum as providers.ExternalProvider);
      const web3Signer = web3.getSigner();
      setSigner(web3Signer);
      setProvider(web3);
    }
  }, [ethereum, chainId]);

  // TODO This is not working. Will work if event handlers are on ethereum object,
  //    and ethereum object is typed as BaseProvider
  // Must react to changes in wallet state
  useEffect(() => {
    if (provider && ethereum) {
      const onAccountsChanged = async () => {
        const accounts = await provider.listAccounts();
        setAccount(accounts[0] ? accounts[0] : undefined);
      };

      const onChainChanged = async () => {
        const network = await provider.getNetwork();
        setChainId(network.chainId);
      };

      const onDisconnect = () => {
        setAccount(undefined);
        setEthereum(undefined);
      };

      onAccountsChanged();
      onChainChanged();

      // Must listen on `ethereum` object due to Metamask specific events
      ethereum.addListener('accountsChanged', onAccountsChanged);
      ethereum.addListener('chainChanged', onChainChanged);
      ethereum.addListener('disconnect', onDisconnect);

      return () => {
        ethereum.removeAllListeners();
        //provider.off('accountsChanged', onAccountsChanged);
        //provider.off('chainChanged', onAccountsChanged);
        //provider.off('disconnect', onDisconnect);
      };
    }
  }, [ethereum, provider]);

  return (
    <EthereumContext.Provider
      value={{
        ethereum,
        setEthereum,
        provider,
        signer,
        account,
        chainId,
      }}
    >
      {children}
    </EthereumContext.Provider>
  );
};
