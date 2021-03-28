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

export interface ISynthMetadata {
  name: string;
  type: string;
  cycle: string;
  year: string;
  collateral: string;
  expired: boolean;
  //apy?: number;
  //description?: string
}

export interface ISynthInfo {
  // TODO add image location
  metadata: ISynthMetadata;
  token: IToken;
  emp: IContract;
  pool: IContract;
}

export interface ISynthMarketData {
  price: string;
  tvl: string;
  apy: number;
  volume24h: string;
  marketCap: string;
  totalSupply: string;
  metadata: ISynthMetadata;
}

export interface IMap<T> {
  [key: string]: T;
}
