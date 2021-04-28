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

export interface ICollateral extends IContract {
  coingeckoId: string;
}

// TODO remove
//export interface ISynthMetadata {
//  name: string;
//  //type: string;
//  cycle: string;
//  year: string;
//  collateral: string;
//  //expired: boolean;
//  //apy?: number;
//  //description?: string
//}

export interface ISynthInfo {
  imgLocation: string;
  type: string;
  cycle: string;
  year: string;
  collateral: string; // TODO remove, get collateral through type
  token: IToken;
  emp: IContract;
  pool: IContract;
}

export interface ISynthType {
  description: string;
  collateral: string;
}

export interface ISynthMarketData {
  price: string;
  tvl: string;
  apr: string;
  volume24h: string;
  marketCap: string;
  totalSupply: string;
  liquidity: string;
  minTokens: number;
  daysTillExpiry: number;
  globalUtilization: number; // Inverse of GCR taken from EMP
  liquidationPoint: number;
}

// TODO use Record<T1, T2> instead
export interface IMap<T> {
  [key: string]: T;
}
