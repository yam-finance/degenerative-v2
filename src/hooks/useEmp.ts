import { useContext, useCallback } from 'react';
import { Signer, BigNumber } from 'ethers';

import { EthereumContext } from '@/contexts/EthereumContext';
import { Emp__factory, Unsigned, IEmpState, IUserPositions } from '@/types';

// Stateless hook for EMP contract helper functions
export const useEmp = () => {
  const { account, signer, provider } = useContext(EthereumContext);

  const mint = useCallback(
    async (empAddress: string, collateral: number, tokens: number) => {
      const [collateralAmount, tokenAmount] = [new Unsigned(collateral), new Unsigned(tokens)];
      const empContract = Emp__factory.connect(empAddress, signer as Signer);

      try {
        console.log('COLLATERAL: ' + collateralAmount.rawValue);
        console.log('TOKEN : ' + tokenAmount.rawValue);
        const gasLimit = await empContract.estimateGas.create(collateralAmount, tokenAmount);
        const tx = await empContract.create(collateralAmount, tokenAmount, {
          gasLimit: gasLimit,
        });
        const receipt = await tx.wait();
        return receipt;
        // TODO log transaction to analytics service
      } catch (err) {
        console.error(err);
        return Promise.reject('Mint failed.');
      }
    },
    [signer]
  );

  const deposit = useCallback(
    async (empAddress: string, collateral: number) => {
      const collateralAmount = new Unsigned(collateral);
      const empContract = Emp__factory.connect(empAddress, signer as Signer);
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
    async (empAddress: string, tokens: number) => {
      const tokenAmount = new Unsigned(tokens);
      const empContract = Emp__factory.connect(empAddress, signer as Signer);
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

  /* TODO Repay is not implemented on old EMP contracts. Figure out wtf to do!
  const repay = useCallback(
    async (empAddress: string, tokens: number) => {
      const tokenAmount = new Unsigned(tokens);
      const empContract = Emp__factory.connect(empAddress, signer as Signer);
      try {
        const gasLimit = await empContract.estimateGas.repay(tokenAmount);
        const tx = await empContract.redeem(tokenAmount, {
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
  */

  // TODO finish implementation. Needs its own page.
  const settle = useCallback(
    async (empAddress: string, tokens: number) => {
      const tokenAmount = new Unsigned(tokens);
      const empContract = Emp__factory.connect(empAddress, signer as Signer);
      try {
        const gasLimit = await empContract.estimateGas.settleExpired();
        const tx = await empContract.settleExpired({
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

  const requestWithdrawal = useCallback(async (empAddress: string, collateral: number) => {}, [signer]);

  const withdrawPassedRequest = useCallback(() => {}, [signer]);

  const cancelWithdrawalRequest = useCallback(async () => {}, [signer]);

  // NOTE: Only works up to GCR. Otherwise will fail.
  const withdraw = useCallback(
    async (empAddress: string, collateral: number) => {
      const collateralAmount = new Unsigned(collateral);
      const empContract = Emp__factory.connect(empAddress, signer as Signer);
      try {
        const gasLimit = await empContract.estimateGas.redeem(collateralAmount);
        const tx = await empContract.withdraw(collateralAmount, {
          gasLimit: gasLimit,
        });
        return await tx.wait();
      } catch (err) {
        console.error(err);
        return Promise.reject('Withdraw failed.');
      }
    },
    [signer]
  );

  const getUserPosition = useCallback(
    async (empAddress: string) => {
      if (!account) return Promise.reject('Wallet not connected');
      const empContract = Emp__factory.connect(empAddress, signer as Signer);
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

  // TODO remove?
  const queryEmpState = useCallback(
    async (empAddress: string) => {
      console.log('QUERYING');
      console.log(empAddress);
      console.log(signer);
      const empContract = Emp__factory.connect(empAddress, signer as Signer);
      try {
        const res = (
          await Promise.allSettled([
            empContract.expirationTimestamp(),
            empContract.collateralCurrency(),
            empContract.priceIdentifier(),
            empContract.tokenCurrency(),
            empContract.collateralRequirement(),
            empContract.disputeBondPct(),
            empContract.disputerDisputeRewardPct(),
            empContract.sponsorDisputeRewardPct(),
            empContract.minSponsorTokens(),
            empContract.timerAddress(),
            empContract.cumulativeFeeMultiplier(),
            empContract.rawTotalPositionCollateral(),
            empContract.totalTokensOutstanding(),
            empContract.liquidationLiveness(),
            empContract.withdrawalLiveness(),
            empContract.getCurrentTime(),
            empContract.contractState(),
            empContract.finder(),
            empContract.expiryPrice(),
          ])
        ).map((res) => (res.status === 'fulfilled' ? res.value : undefined));

        return {
          expirationTimestamp: res[0] as BigNumber,
          collateralCurrency: res[1] as string, // address
          priceIdentifier: res[2] as string,
          tokenCurrency: res[3] as string, // address
          collateralRequirement: res[4] as BigNumber,
          disputeBondPct: res[5] as BigNumber,
          disputerDisputeRewardPct: res[6] as BigNumber,
          sponsorDisputeRewardPct: res[7] as BigNumber,
          minSponsorTokens: res[8] as BigNumber,
          timerAddress: res[9] as string, // address
          cumulativeFeeMultiplier: res[10] as BigNumber,
          rawTotalPositionCollateral: res[11] as BigNumber,
          totalTokensOutstanding: res[12] as BigNumber,
          liquidationLiveness: res[13] as BigNumber,
          withdrawalLiveness: res[14] as BigNumber,
          currentTime: res[15] as BigNumber,
          isExpired: Number(res[15]) >= Number(res[0]),
          contractState: Number(res[16]),
          finderAddress: res[17] as string, // address
          expiryPrice: res[18] as BigNumber,
        } as IEmpState;
      } catch (err) {
        console.error(err.message);
        return Promise.reject('EMP State retrieval failed.');
      }
    },
    [signer]
  );

  return {
    mint,
    deposit,
    redeem,
    withdraw,
    getUserPosition,
    queryEmpState,
  };
};

export default useEmp;
