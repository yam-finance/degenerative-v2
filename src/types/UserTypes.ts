// Types pertaining to the user
export interface IMintedPosition {
  name: string;
  //tokenName: string;
  tokenAmount: string;
  //tokenPriceUsd: string;
  //collateralName: string;
  collateralAmount: string;
  //collateralPriceUsd: string;
  collateralRatio: string;
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
