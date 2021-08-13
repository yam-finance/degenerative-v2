import { useCallback } from 'react';
import { Signer } from 'ethers';

import { useEthers } from '@usedapp/core';
import { Empv2__factory, Unsigned, IUserPositions, ISynth } from '@/types';

// Stateless hook for EMP contract helper functions
export const useEmp = () => {
  const { account, library } = useEthers();
  const signer = library?.getSigner();

  const mint = useCallback(
    async (synth: ISynth, collateral: number, tokens: number) => {
      if (!signer) return;

      const decimals = synth.token.decimals; // Token and collateral have same decimals
      const [collateralAmount, tokenAmount] = [new Unsigned(collateral, decimals), new Unsigned(tokens, decimals)];

      const empContract = Empv2__factory.connect(synth.emp.address, signer);

      try {
        console.log('COLLATERAL: ' + collateralAmount.rawValue);
        console.log('TOKEN : ' + tokenAmount.rawValue);
        const gasLimit = await empContract.estimateGas.create(collateralAmount, tokenAmount);
        const tx = await empContract.create(collateralAmount, tokenAmount, {
          gasLimit: gasLimit,
        });
        const receipt = tx.wait();
        return receipt;
        // TODO log transaction to analytics service
      } catch (err) {
        console.error(err);
        return Promise.reject('Mint failed.');
      }
    },
    [library]
  );

  const deposit = useCallback(
    async (synth: ISynth, collateral: number) => {
      if (!signer) return;

      const collateralAmount = new Unsigned(collateral, synth.token.decimals);
      const empContract = Empv2__factory.connect(synth.emp.address, signer as Signer);

      try {
        const gasLimit = await empContract.estimateGas.deposit(collateralAmount);
        const tx = await empContract.deposit(collateralAmount, {
          gasLimit: gasLimit,
        });
        return tx.wait();
      } catch (err) {
        console.error(err);
        return Promise.reject('Deposit failed');
      }
    },
    [signer]
  );

  const redeem = useCallback(
    async (synth: ISynth, tokens: number) => {
      if (!signer) return;

      const tokenAmount = new Unsigned(tokens, synth.token.decimals);
      const empContract = Empv2__factory.connect(synth.emp.address, signer as Signer);

      try {
        const gasLimit = await empContract.estimateGas.redeem(tokenAmount);
        const tx = await empContract.redeem(tokenAmount, {
          gasLimit: gasLimit,
        });
        return tx.wait();
      } catch (err) {
        console.error(err);
        return Promise.reject('Redeem failed.');
      }
    },
    [signer]
  );

  // TODO Repay is not implemented on old EMP contracts. Figure out wtf to do!
  const repay = useCallback(
    async (synth: ISynth, tokens: number) => {
      if (!signer) return;

      const tokenAmount = new Unsigned(tokens, synth.token.decimals);
      const empContract = Empv2__factory.connect(synth.emp.address, signer as Signer);

      try {
        const gasLimit = await empContract.estimateGas.repay(tokenAmount);
        const tx = await empContract.repay(tokenAmount, {
          gasLimit: gasLimit,
        });
        return await tx.wait();
      } catch (err) {
        console.error(err);
        return Promise.reject('Redeem failed.');
      }
    },
    [signer]
  );

  const settle = useCallback(
    async (synth: ISynth) => {
      if (!signer) return;

      const empContract = Empv2__factory.connect(synth.emp.address, signer as Signer);

      try {
        const gasLimit = await empContract.estimateGas.settleExpired();
        const tx = await empContract.settleExpired({
          gasLimit: gasLimit,
        });
        return tx.wait();
      } catch (err) {
        console.error(err);
        return Promise.reject('Settle failed.');
      }
    },
    [signer]
  );

  // NOTE: Only works up to GCR. Otherwise will fail.
  const withdraw = useCallback(
    async (synth: ISynth, collateral: number) => {
      if (!signer) return;

      const collateralAmount = new Unsigned(collateral, synth.token.decimals);
      const empContract = Empv2__factory.connect(synth.emp.address, signer as Signer);

      try {
        const gasLimit = await empContract.estimateGas.withdraw(collateralAmount);
        const tx = await empContract.withdraw(collateralAmount, {
          gasLimit: gasLimit,
        });
        return tx.wait();
      } catch (err) {
        console.error(err);
        return Promise.reject('Withdraw failed.');
      }
    },
    [signer]
  );

  const initWithdrawalRequest = useCallback(
    async (synth: ISynth, collateral: number) => {
      if (!signer) return;

      const collateralAmount = new Unsigned(collateral, synth.token.decimals);
      const empContract = Empv2__factory.connect(synth.emp.address, signer as Signer);

      try {
        const gasLimit = await empContract.estimateGas.requestWithdrawal(collateralAmount);
        const tx = await empContract.requestWithdrawal(collateralAmount, {
          gasLimit: gasLimit,
        });
        return tx.wait();
      } catch (err) {
        console.error(err);
        return Promise.reject('Request withdraw failed.');
      }
    },
    [signer]
  );

  const withdrawPassedRequest = useCallback(
    async (synth: ISynth) => {
      if (!signer) return;

      const empContract = Empv2__factory.connect(synth.emp.address, signer as Signer);

      try {
        const gasLimit = await empContract.estimateGas.withdrawPassedRequest();
        const tx = await empContract.withdrawPassedRequest({
          gasLimit: gasLimit,
        });
        return tx.wait();
      } catch (err) {
        console.error(err);
        return Promise.reject('Withdraw passed request failed.');
      }
    },
    [signer]
  );

  const cancelWithdrawalRequest = useCallback(
    async (synth: ISynth) => {
      if (!signer) return;

      const empContract = Empv2__factory.connect(synth.emp.address, signer as Signer);

      try {
        const gasLimit = await empContract.estimateGas.cancelWithdrawal();
        const tx = await empContract.cancelWithdrawal({
          gasLimit: gasLimit,
        });
        return tx.wait();
      } catch (err) {
        console.error(err);
        return Promise.reject('Cancel withdrawal failed.');
      }
    },
    [signer]
  );

  const getUserPosition = useCallback(
    async (synth: ISynth) => {
      if (!account) return Promise.reject('Wallet not connected');
      if (!signer) return Promise.reject('No signer available');

      const empContract = Empv2__factory.connect(synth.emp.address, signer);
      try {
        const userPositions = await empContract.positions(account as string);

        return {
          tokensOutstanding: userPositions[0].rawValue,
          withdrawalRequestPassTimeStamp: userPositions[1],
          withdrawalRequestAmount: userPositions[2].rawValue,
          rawCollateral: userPositions[3].rawValue,
          transferPositionRequestPassTimestamp: userPositions[4],
        } as IUserPositions;
      } catch (err) {
        console.error(err);
        return Promise.reject('User position retrieval failed');
      }
    },
    [signer, account]
  );

  return {
    mint,
    deposit,
    repay,
    redeem,
    settle,
    withdraw,
    initWithdrawalRequest,
    withdrawPassedRequest,
    cancelWithdrawalRequest,
    getUserPosition,
  };
};
