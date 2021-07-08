import React, { createContext, useEffect, useState } from 'react';
import { providers, Signer } from 'ethers';

import { MetamaskProvider } from '@/types';

type EthereumState = {
  ethereum: MetamaskProvider | undefined;
  setEthereum: (ethereum: MetamaskProvider | undefined) => void;
  disconnectWallet: () => void;
  provider: providers.Web3Provider | undefined;
  signer: Signer | undefined;
  chainId: number;
  account: string | undefined;
};

// TODO Add in web3-react + web3modal
export const EthereumContext = createContext<EthereumState | undefined>(undefined);

export const EthereumProvider: React.FC = ({ children }) => {
  const [ethereum, setEthereum] = useState<MetamaskProvider | undefined>(window.ethereum);
  const [provider, setProvider] = useState<providers.Web3Provider>();
  const [signer, setSigner] = useState<Signer>();
  const [account, setAccount] = useState<string | undefined>(undefined);
  const [chainId, setChainId] = useState<number>(0);

  useEffect(() => {
    // Mainnet
    if (ethereum) {
      const web3 = new providers.Web3Provider(window.ethereum as providers.ExternalProvider);
      const web3Signer = web3.getSigner();
      setSigner(web3Signer);
      setProvider(web3);
      setChain(web3);
    }
  }, [ethereum, chainId]);

  // TODO Listeners do not work on provider. Will work if event handlers are on ethereum object,
  //    and ethereum object is MetamaskProvider
  // Must react to changes in wallet state
  useEffect(() => {
    if (provider && ethereum) {
      const onAccountsChanged = async () => {
        const accounts = await provider.listAccounts();
        setAccount(accounts[0] ? accounts[0] : undefined);
      };

      const onChainChanged = async () => {
        setChain(provider);
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
        ethereum.removeListener('accountsChanged', onAccountsChanged);
        ethereum.removeListener('chainChanged', onAccountsChanged);
        ethereum.removeListener('disconnect', onDisconnect);
      };
    }
  }, [ethereum, provider]);

  const setChain = async (provider: providers.Web3Provider) => {
    const network = await provider.getNetwork();
    setChainId(network.chainId);
  };

  const disconnectWallet = () => ethereum?.emit('disconnect');

  return (
    <EthereumContext.Provider
      value={{
        ethereum,
        setEthereum,
        disconnectWallet,
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
