import { useState, useContext, useEffect } from 'react';

import { UserContext } from '@/contexts';
import { useEmp, useToken, useWrapEth } from '@/hooks';
import { isEmpty } from '@/utils';

export const useSynthActions = () => {
  const { currentSynth, currentCollateral } = useContext(UserContext);
  const [empAddress, setEmpAddress] = useState('');
  const [collateralAddress, setCollateralAddress] = useState('');

  useEffect(() => {
    if (currentSynth && !isEmpty(currentSynth) && currentCollateral && !isEmpty(currentCollateral)) {
      setEmpAddress(currentSynth.emp.address);
      setCollateralAddress(currentCollateral.address);
    }
  }, [currentSynth]);

  const emp = useEmp();
  const collateral = useToken();
  const wrapEth = useWrapEth();

  const [loading, setLoading] = useState(false);
  const [tokenAmount, setTokenAmount] = useState(0);
  const [collateralAmount, setCollateralAmount] = useState(0);

  const onApprove = async () => {
    setLoading(true);
    try {
      const tx = await collateral.approveSpender(collateralAddress, empAddress);
      await tx?.wait();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onMint = async () => {
    if (collateralAmount > 0 && tokenAmount > 0) {
      setLoading(true);
      try {
        const txReceipt = await emp.mint(empAddress, collateralAmount, tokenAmount);
        console.log(txReceipt.transactionHash);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    } else {
      console.error('Collateral amount or token amount is not greater than 0.');
    }
  };

  const onWrapEth = async (ethAmount: number) => {
    if (ethAmount > 0) {
      setLoading(true);
      try {
        const result = await wrapEth(ethAmount);
        if (result) {
          await result.wait();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    } else {
      console.error('Collateral amount or token amount is not greater than 0.');
    }
  };

  const onRedeem = () => {};

  const onGetAllowance = async () => console.log(await collateral.getAllowance(collateralAddress, empAddress));

  return {
    tokenAmount,
    setTokenAmount,
    collateralAmount,
    setCollateralAmount,
    onMint,
    onRedeem,
    onApprove,
    onGetAllowance,
    onWrapEth,
  };
};

export type ISynthState = typeof useSynthActions;

export default useSynthActions;
