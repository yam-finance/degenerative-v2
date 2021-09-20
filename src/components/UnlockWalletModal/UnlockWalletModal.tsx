import React, { useCallback, useEffect } from 'react';
import styled from 'styled-components';
import Modal from 'react-modal';
import metamaskLogo from '../../assets/metamask-fox.svg';
import WConnect from "../../assets/wallet-Connect.svg";
import fortmaticLogo from "../../assets/fortmatic.png";
import portisLogo from "../../assets/portis.png";
import { useEthers } from '@usedapp/core';
import { Web3Provider } from '@ethersproject/providers'
import { useWeb3React } from '@web3-react/core'

import './index.css';
import {
  injected,
  walletconnect,
  fortmatic,
  portis,
} from './connectors'

interface ModalProps {
  isOpen?: boolean;
  onDismiss?: () => void;
}
enum ConnectorNames {
  Injected = 'Injected',
  Network = 'Network',
  WalletConnect = 'WalletConnect',
  WalletLink = 'WalletLink',
  Ledger = 'Ledger',
  Trezor = 'Trezor',
  Lattice = 'Lattice',
  Frame = 'Frame',
  Authereum = 'Authereum',
  Fortmatic = 'Fortmatic',
  Magic = 'Magic',
  Portis = 'Portis',
  Torus = 'Torus'
}

Modal.defaultStyles.overlay.backgroundColor = 'rgba(23,27,81,0.8)';

const UnlockWalletModal: React.FC<ModalProps> = ({ isOpen, onDismiss }) => {
  const { activateBrowserWallet } = useEthers();
  //  const handleConnectMetamask =  useCallback(async() => {
  //    await web3Modal.connect()
  //  }, []);

  const customStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      borderRadius: '20px',
      width: '30%',
      backgroundColor: '#2c3286',
      border: 'none',
    },

  };
  const [activatingConnector, setActivatingConnector] = React.useState<any>()
  const context = useWeb3React<Web3Provider>()
  const { connector, library, chainId, account, activate, deactivate, active, error } = context
  React.useEffect(() => {
    if (activatingConnector && activatingConnector === connector) {
      setActivatingConnector(undefined)
    }
  }, [activatingConnector, connector])
  return (
    <Modal isOpen={isOpen} style={customStyles} ariaHideApp={false}>
      <h2 className="title">Connect Wallet</h2>

      <div>
        <button className="wallet-button"


          onClick={() => {
            setActivatingConnector(injected)
            activate(injected);
            //handleConnectMetamask();
            if (onDismiss)
              onDismiss();
          }}
        >
          <img src={metamaskLogo} className="logo-img" />
          <p className="text_app">Metamask</p>
        </button>
      </div>
      <div>
        <button className="wallet-button"


          onClick={() => {
            setActivatingConnector(walletconnect)
            activate(walletconnect)
            if (onDismiss)
              onDismiss();
          }}
        >
          <img src={WConnect} className="logo-img" />
          <p className="text_app">WalletConnect</p>
        </button>
      </div>
      <div>
        <button className="wallet-button"


          onClick={() => {
            setActivatingConnector(fortmatic)
            activate(fortmatic);
            if (onDismiss)
              onDismiss();
          }}
        >
          <img src={fortmaticLogo} className="logo-img" />
          <p className="text_app">Fortmatic</p>
        </button>
      </div>
      <div>
        <button className="wallet-button"


          onClick={() => {
            setActivatingConnector(portis)
            activate(portis);
            if (onDismiss)
              onDismiss();
          }}
        >
          <img src={portisLogo} className="logo-img" />
          <p className="text_app">Portis</p>
        </button>
      </div>
    </Modal>
  );
};
export default UnlockWalletModal;
