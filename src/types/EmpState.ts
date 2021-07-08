import { BigNumber } from 'ethers';

export interface IEmpState {
  expirationTimestamp: BigNumber | undefined;
  collateralCurrency: string | undefined;
  priceIdentifier: string | undefined;
  tokenCurrency: string | undefined;
  collateralRequirement: BigNumber | undefined;
  disputeBondPct: BigNumber | undefined;
  disputerDisputeRewardPct: BigNumber | undefined;
  sponsorDisputeRewardPct: BigNumber | undefined;
  minSponsorTokens: BigNumber | undefined;
  timerAddress: string | undefined;
  cumulativeFeeMultiplier: BigNumber | undefined;
  rawTotalPositionCollateral: BigNumber | undefined;
  totalTokensOutstanding: BigNumber | undefined;
  liquidationLiveness: BigNumber | undefined;
  withdrawalLiveness: BigNumber | undefined;
  currentTime: BigNumber | undefined;
  isExpired: boolean | undefined;
  contractState: number | undefined;
  finderAddress: string | undefined;
  expiryPrice: BigNumber | undefined;
}

export interface IUserPositions {
  tokensOutstanding: BigNumber;
  withdrawalRequestPassTimeStamp: BigNumber;
  withdrawalRequestAmount: BigNumber;
  rawCollateral: BigNumber;
  transferPositionRequestPassTimestamp: BigNumber;
}
