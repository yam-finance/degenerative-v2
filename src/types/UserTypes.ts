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
  //metadata: ISynthMetadata; // TODO remove this
}

export interface ISynthInWallet {
  name: string;
  tokenAmount: string;
  //priceUsd: number;
  //metadata: ISynthMetadata;  // TODO remove
}

// TODO complete this later
export interface IPoolPosition {
  pair: string;
  value: number;
  apr: number;
}
