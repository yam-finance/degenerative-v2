// Types pertaining to the user. BigNumbers stored as strings.
export interface IMintedPosition {
  name: string;
  //tokenName: string;
  tokenAmount: number;
  //tokenPriceUsd: string;
  //collateralName: string;
  collateralAmount: number;
  //collateralPriceUsd: string;
  //collateralRatio: number; // TODO replace with utilization
  utilization: number;
  withdrawalRequestAmount: number;
  withdrawalRequestTimestamp: number; // Time when withdrawal request is approved, unix time
}

export interface ISynthInWallet {
  name: string;
  tokenAmount: number;
  //tokenPriceUsd: number;
}

// TODO complete this later
export interface IPoolPosition {
  pair: string;
  value: number;
  apr: number;
}
