import React from 'react';
import { useEthers } from '@usedapp/core';
import WalletConnectProvider from '@walletconnect/web3-provider';
import UnlockWalletModal from './UnlockWalletModal';
import Web3Modal from 'web3modal';
import { useCallback, useState } from 'react';
interface ConnectWalletProps {
  className?: string;
  closeDropDown?: () => void;
}

export const ConnectWallet: React.FC<ConnectWalletProps> = ({ className, closeDropDown }) => {
  const { activateBrowserWallet, account } = useEthers();
  const [unlockModalIsOpen, setUnlockModalIsOpen] = useState(false);
  const handleUnlockWalletClick = useCallback(() => {
    closeDropDown();
    setUnlockModalIsOpen(true);
  }, [setUnlockModalIsOpen]);
  const handleDismissUnlockModal = useCallback(() => {
    setUnlockModalIsOpen(false);
  }, [setUnlockModalIsOpen]);

  return (
    <>
      <button onClick={handleUnlockWalletClick} className={className}>
        Connect Wallet
      </button>
      <UnlockWalletModal isOpen={unlockModalIsOpen} onDismiss={handleDismissUnlockModal} />
    </>
  );
};
