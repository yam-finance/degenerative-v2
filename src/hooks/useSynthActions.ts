import { useState, useContext, useEffect, useCallback } from 'react';

import { UserContext, MarketContext } from '@/contexts';
import { useToken, useWrapEth } from '@/hooks';
import { isEmpty } from '@/utils';

export const useSynthActions = () => {
  const { currentSynth, currentCollateral, emp } = useContext(UserContext);
  const { synthMetadata, collateralData } = useContext(MarketContext);
  const [empAddress, setEmpAddress] = useState('');
  const [collateralAddress, setCollateralAddress] = useState('');
  const [synthAddress, setSynthAddress] = useState('');
  const [collateralApproval, setCollateralApproval] = useState(false);
  const [synthApproval, setSynthApproval] = useState(false);

  const erc20 = useToken();
  const wrapEth = useWrapEth();

  useEffect(() => {
    if (currentSynth && currentCollateral && !isEmpty(synthMetadata) && !isEmpty(collateralData)) {
      setEmpAddress(synthMetadata[currentSynth].emp.address);
      setCollateralAddress(collateralData[currentCollateral].address);
      setSynthAddress(synthMetadata[currentSynth].token.address);
    }
  }, [currentSynth, synthMetadata, collateralData]);

  useEffect(() => {
    checkCollateralAllowance();
  }, [collateralAddress, empAddress]);

  useEffect(() => {
    checkSynthAllowance();
  }, [synthAddress, empAddress]);

  const checkCollateralAllowance = async () => {
    if (synthAddress && empAddress) {
      setCollateralApproval(await erc20.getAllowance(collateralAddress, empAddress));
    }
  };

  const checkSynthAllowance = async () => {
    if (synthAddress && empAddress) {
      setSynthApproval(await erc20.getAllowance(synthAddress, empAddress));
    }
  };

  const onApproveCollateral = async () => {
    try {
      const tx = await erc20.approveSpender(collateralAddress, empAddress);
      await tx?.wait();
      checkCollateralAllowance();
    } catch (err) {
      console.error(err);
    }
  };

  const onApproveSynth = async () => {
    try {
      const tx = await erc20.approveSpender(synthAddress, empAddress);
      await tx?.wait();
      checkSynthAllowance();
    } catch (err) {
      console.error(err);
    }
  };

  const onMint = async (collateralAmount: number, tokenAmount: number) => {
    // Collateral can be 0 if adding to existing position
    if (collateralAmount >= 0 && tokenAmount > 0) {
      try {
        const txReceipt = await emp.mint(empAddress, collateralAmount, tokenAmount);
        console.log(txReceipt.transactionHash);
      } catch (err) {
        console.error(err);
      }
    } else {
      console.error('Collateral amount or token amount is not greater than 0.');
    }
  };

  const onDeposit = async (oldCollateral: number, newCollateral: number) => {
    if (oldCollateral > 0 && newCollateral > 0 && newCollateral > oldCollateral) {
      const collateralAmount = newCollateral - oldCollateral;
      try {
        const txReceipt = await emp.deposit(empAddress, collateralAmount);
        console.log(txReceipt.transactionHash);
      } catch (err) {
        console.error(err);
      }
    } else {
      console.error('Invalid collateral amounts.');
    }
  };

  const onWrapEth = async (ethAmount: number) => {
    if (ethAmount > 0) {
      try {
        const result = await wrapEth(ethAmount);
        if (result) {
          await result.wait();
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      console.error('Collateral amount or token amount is not greater than 0.');
    }
  };

  const onRepay = async (tokenAmount: number) => {
    if (tokenAmount > 0) {
      try {
        const txReceipt = await emp.repay(empAddress, tokenAmount);
        console.log(txReceipt.transactionHash);
      } catch (err) {
        console.error(err);
      }
    } else {
      console.error('Invalid collateral amount.');
    }
  };

  const onRedeem = async (tokenAmount: number) => {
    if (tokenAmount > 0) {
      try {
        const txReceipt = await emp.redeem(empAddress, tokenAmount);
        console.log(txReceipt.transactionHash);
      } catch (err) {
        console.error(err);
      }
    } else {
      console.error('Invalid collateral amount.');
    }
  };

  const onWithdraw = async (collateralAmount: number) => {
    if (collateralAmount > 0) {
      try {
        const txReceipt = await emp.withdraw(empAddress, collateralAmount);
        console.log(txReceipt.transactionHash);
      } catch (err) {
        console.error(err);
      }
    } else {
      console.error('Invalid collateral amount.');
    }
  };

  const onRequestWithdraw = async (collateralAmount: number) => {
    if (collateralAmount > 0) {
      try {
        const txReceipt = await emp.initWithdrawalRequest(empAddress, collateralAmount);
        console.log(txReceipt.transactionHash);
      } catch (err) {
        console.error(err);
      }
    } else {
      console.error('Invalid collateral amount.');
    }
  };

  const onWithdrawPassedRequest = async () => {
    try {
      const txReceipt = await emp.withdrawPassedRequest(empAddress);
      console.log(txReceipt.transactionHash);
    } catch (err) {
      console.error(err);
    }
  };

  const onCancelWithdraw = async () => {
    try {
      const txReceipt = await emp.cancelWithdrawalRequest(empAddress);
      console.log(txReceipt.transactionHash);
    } catch (err) {
      console.error(err);
    }
  };

  const onSettle = async () => {
    try {
      const txReceipt = await emp.settle(empAddress);
      console.log(txReceipt.transactionHash);
    } catch (err) {
      console.error(err);
    }
  };

  return {
    collateralApproval,
    synthApproval,
    onMint,
    onDeposit,
    onRepay,
    onRedeem,
    onApproveCollateral,
    onApproveSynth,
    onWithdraw,
    onRequestWithdraw,
    onWithdrawPassedRequest,
    onCancelWithdraw,
    onSettle,
    onWrapEth,
  };
};

export type ISynthState = typeof useSynthActions;

export default useSynthActions;
