import React, { useCallback, useEffect } from 'react';
import styled from 'styled-components';
import Modal from 'react-modal';
import metamaskLogo from '../../assets/metamask-fox.svg';
import { useEthers } from '@usedapp/core';
import './index.css';
interface ModalProps {
  isOpen?: boolean;
  onDismiss?: () => void;
}
const UnlockWalletModal: React.FC<ModalProps> = ({ isOpen, onDismiss }) => {
  const { activateBrowserWallet, account } = useEthers();
  const handleConnectMetamask = useCallback(() => {
    activateBrowserWallet();
  }, []);
  let subtitle;
  const customStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      borderRadius: '20px',
      width: '30%'
    },

  };
  const afterOpenModal= () => {
    // references are now sync'd and can be accessed.
    subtitle.style.color = '#1e1b40';
  }
  return (
    <Modal isOpen={isOpen} style={customStyles}  onRequestClose={onDismiss} onAfterOpen={afterOpenModal}>
       <h2 ref={(_subtitle) => (subtitle = _subtitle)}>Connect Wallet</h2>
       
        <div>
          <button className="wallet-button"
             
          
            onClick={() => {
              handleConnectMetamask();
              onDismiss();
            }}
          >
            <img src={metamaskLogo} className="logo-img"/>
            <h3 className="text_app">Metamask</h3>
          </button>
        </div>
    </Modal>
  );
};
export default UnlockWalletModal;
