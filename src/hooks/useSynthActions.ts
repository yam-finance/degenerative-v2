import { useState, useContext, useEffect, useCallback } from 'react';

import { UserContext, MarketContext } from '@/contexts';
import { useToken, useWrapEth } from '@/hooks';
import { isEmpty } from '@/utils';
import { ISynth } from '@/types';

export const useSynthActions = () => {
  const { currentSynth, currentCollateral, emp } = useContext(UserContext);
  const { synthMetadata, collateralData } = useContext(MarketContext);

  const [synth, setSynth] = useState({} as ISynth);
  // TODO consolidate all synth values. Just set an ISynth object instead.
  const [empAddress, setEmpAddress] = useState('');
  const [synthAddress, setSynthAddress] = useState('');
  const [collateralAddress, setCollateralAddress] = useState('');

  const [collateralApproval, setCollateralApproval] = useState(false);
  const [synthApproval, setSynthApproval] = useState(false);

  const erc20 = useToken();
  const wrapEth = useWrapEth();

  useEffect(() => {
    if (currentSynth && currentCollateral && !isEmpty(synthMetadata) && !isEmpty(collateralData)) {
      setEmpAddress(synthMetadata[currentSynth].emp.address);
      setCollateralAddress(collateralData[currentCollateral].address);
      setSynthAddress(synthMetadata[currentSynth].token.address);
      setSynth(synthMetadata[currentSynth]);
    }
  }, [currentSynth, currentCollateral, synthMetadata, collateralData]);

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

  const onMint = useCallback(
    async (collateralAmount: number, tokenAmount: number) => {
      // Collateral can be 0 if adding to existing position
      if (collateralAmount >= 0 && tokenAmount > 0) {
        try {
          const txReceipt = await emp.mint(synth, collateralAmount, tokenAmount);
          console.log(txReceipt.transactionHash);
        } catch (err) {
          console.error(err);
        }
      } else {
        console.error('Collateral amount or token amount is not greater than 0.');
      }
    },
    [synth]
  );

  const onDeposit = useCallback(
    async (oldCollateral: number, newCollateral: number) => {
      if (oldCollateral > 0 && newCollateral > 0 && newCollateral > oldCollateral) {
        const collateralAmount = newCollateral - oldCollateral;
        try {
          const txReceipt = await emp.deposit(synth, collateralAmount);
          console.log(txReceipt.transactionHash);
        } catch (err) {
          console.error(err);
        }
      } else {
        console.error('Invalid collateral amounts.');
      }
    },
    [synth]
  );

  const onRepay = useCallback(
    async (tokenAmount: number) => {
      if (tokenAmount > 0) {
        try {
          const txReceipt = await emp.repay(synth, tokenAmount);
          console.log(txReceipt.transactionHash);
        } catch (err) {
          console.error(err);
        }
      } else {
        console.error('Invalid collateral amount.');
      }
    },
    [synth]
  );

  const onRedeem = useCallback(
    async (tokenAmount: number) => {
      if (tokenAmount > 0) {
        try {
          const txReceipt = await emp.redeem(synth, tokenAmount);
          console.log(txReceipt.transactionHash);
        } catch (err) {
          console.error(err);
        }
      } else {
        console.error('Invalid collateral amount.');
      }
    },
    [synth]
  );

  const onWithdraw = useCallback(
    async (collateralAmount: number) => {
      if (collateralAmount > 0) {
        try {
          const txReceipt = await emp.withdraw(synth, collateralAmount);
          console.log(txReceipt.transactionHash);
        } catch (err) {
          console.error(err);
        }
      } else {
        console.error('Invalid collateral amount.');
      }
    },
    [synth]
  );

  const onRequestWithdraw = useCallback(
    async (collateralAmount: number) => {
      if (collateralAmount > 0) {
        try {
          const txReceipt = await emp.initWithdrawalRequest(synth, collateralAmount);
          console.log(txReceipt.transactionHash);
        } catch (err) {
          console.error(err);
        }
      } else {
        console.error('Invalid collateral amount.');
      }
    },
    [synth]
  );

  const onWithdrawPassedRequest = useCallback(async () => {
    try {
      const txReceipt = await emp.withdrawPassedRequest(synth);
      console.log(txReceipt.transactionHash);
    } catch (err) {
      console.error(err);
    }
  }, [synth]);

  const onCancelWithdraw = useCallback(async () => {
    try {
      const txReceipt = await emp.cancelWithdrawalRequest(synth);
      console.log(txReceipt.transactionHash);
    } catch (err) {
      console.error(err);
    }
  }, [synth]);

  const onSettle = useCallback(async () => {
    try {
      const txReceipt = await emp.settle(synth);
      console.log(txReceipt.transactionHash);
    } catch (err) {
      console.error(err);
    }
  }, [synth]);

  const onWrapEth = async (ethAmount: number) => {
    if (ethAmount > 0) {
      try {
        const txReceipt = await wrapEth(ethAmount);
        console.log(txReceipt?.transactionHash);
      } catch (err) {
        console.error(err);
      }
    } else {
      console.error('Collateral amount or token amount is not greater than 0.');
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

export type ISynthActions = ReturnType<typeof useSynthActions>;
