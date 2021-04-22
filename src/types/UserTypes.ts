// Types pertaining to the user. BigNumbers stored as strings.
export interface IMintedPosition {
  name: string;
  //tokenName: string;
  tokenAmount: string;
  //tokenPriceUsd: string;
  //collateralName: string;
  collateralAmount: string;
  //collateralPriceUsd: string;
  collateralRatio: string; // TODO replace with utilization
  //utilization: number;
}

export interface ISynthInWallet {
  name: string;
  tokenAmount: string;
  //tokenPriceUsd: number;
}

// TODO complete this later
export interface IPoolPosition {
  pair: string;
  value: number;
  apr: number;
}
