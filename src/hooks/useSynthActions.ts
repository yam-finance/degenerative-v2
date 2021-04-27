import { useState, useContext, useEffect, useCallback } from 'react';

import { UserContext, MarketContext } from '@/contexts';
import { useEmp, useToken, useWrapEth } from '@/hooks';
import { CollateralMap } from '@/utils';

export const useSynthActions = () => {
  const { currentSynth, currentCollateral, emp } = useContext(UserContext);
  const { synthMetadata } = useContext(MarketContext);
  const [empAddress, setEmpAddress] = useState('');
  const [collateralAddress, setCollateralAddress] = useState('');
  const [synthAddress, setSynthAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [collateralApproval, setCollateralApproval] = useState(false);
  const [synthApproval, setSynthApproval] = useState(false);

  const erc20 = useToken();
  const wrapEth = useWrapEth();

  useEffect(() => {
    if (currentSynth && currentCollateral) {
      setEmpAddress(synthMetadata[currentSynth].emp.address);
      setCollateralAddress(CollateralMap[currentCollateral].address);
      setSynthAddress(synthMetadata[currentSynth].token.address);
    }
  }, [currentSynth]);

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

  // TODO combine with synth approval?
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
    if (collateralAmount > 0 && tokenAmount > 0) {
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

  const onRedeem = async (tokenAmount: number) => {
    if (tokenAmount > 0) {
      try {
        const txReceipt = await emp.redeem(empAddress, tokenAmount);
        console.log(txReceipt.transactionHash);
      } catch (err) {
        console.error(err);
      }
    } else {
      console.error('Invalid collateral amounts.');
    }
  };

  return {
    collateralApproval,
    synthApproval,
    onMint,
    onDeposit,
    onRedeem,
    onApproveCollateral,
    onApproveSynth,
    onWrapEth,
  };
};

export type ISynthState = typeof useSynthActions;

export default useSynthActions;
