export interface IContract {
  address: string;
}

export interface IToken extends IContract {
  name?: string;
  decimals?: number;
  symbol?: string;
  //balance: BigNumber;
  //priceUsd: number;
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
  // TODO add image location
  type: string;
  cycle: string;
  year: string;
  collateral: string;
  //metadata: ISynthMetadata;
  token: IToken;
  emp: IContract;
  pool: IContract;
}

export interface ISynthMarketData {
  price: string;
  tvl: string;
  apr: string;
  volume24h: string;
  marketCap: string;
  totalSupply: string;
  liquidity: string;
  isExpired: boolean;
}

export interface IMap<T> {
  [key: string]: T;
}
