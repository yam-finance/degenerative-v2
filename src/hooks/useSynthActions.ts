import { useState, useContext, useEffect, useCallback } from 'react';

import { UserContext } from '@/contexts';
import { useEmp, useToken, useWrapEth } from '@/hooks';
import { SynthInfo, CollateralMap } from '@/utils';

export const useSynthActions = () => {
  const { currentSynth, currentCollateral, emp } = useContext(UserContext);
  const [empAddress, setEmpAddress] = useState('');
  const [collateralAddress, setCollateralAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [tokenAmount, setTokenAmount] = useState(0);
  const [collateralAmount, setCollateralAmount] = useState(0);
  const [isEmpAllowed, setIsEmpAllowed] = useState(false);

  const collateral = useToken();
  const wrapEth = useWrapEth();

  useEffect(() => {
    if (currentSynth && currentCollateral) {
      setEmpAddress(SynthInfo[currentSynth].emp.address);
      setCollateralAddress(CollateralMap[currentCollateral].address);
    }
  }, [currentSynth]);

  useEffect(() => {
    checkEmpAllowance();
  }, [collateralAddress, empAddress]);

  const checkEmpAllowance = async () => {
    if (collateralAddress && empAddress) {
      setIsEmpAllowed(await collateral.getAllowance(collateralAddress, empAddress));
    }
  };

  const onApprove = async () => {
    try {
      const tx = await collateral.approveSpender(collateralAddress, empAddress);
      await tx?.wait();
      checkEmpAllowance();
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

  const onRedeem = () => {};

  return {
    tokenAmount,
    setTokenAmount,
    collateralAmount,
    setCollateralAmount,
    onMint,
    onRedeem,
    onApprove,
    isEmpAllowed,
    onWrapEth,
  };
};

export type ISynthState = typeof useSynthActions;

export default useSynthActions;
