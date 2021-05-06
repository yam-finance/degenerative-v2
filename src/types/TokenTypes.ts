export interface IContract {
  address: string;
}

export interface IToken extends IContract {
  name?: string;
  decimals?: number;
  symbol?: string;
  //coingeckoId?: string;
  //balance: BigNumber;
  //priceUsd: number;
}

export interface ICollateral extends IToken {
  coingeckoId: string;
}

export interface ISynthInfo {
  imgLocation: string;
  group: string;
  cycle: string;
  year: string;
  collateral: string; // TODO remove, get collateral through type
  token: IToken;
  emp: IContract;
  pool: IContract;
}

export interface ISynthGroup {
  description: string;
  collateral: string;
  image: string;
}

export interface ISynthMarketData {
  price: number;
  priceUsd: number;
  collateralPriceUsd: number;
  tvl: number;
  apr: number;
  volume24h: number;
  marketCap: number;
  totalSupply: number;
  liquidity: number;
  minTokens: number;
  daysTillExpiry: number;
  isExpired: boolean;
  globalUtilization: number; // Inverse of GCR taken from EMP
  liquidationPoint: number;
  withdrawalPeriod: number;
}
