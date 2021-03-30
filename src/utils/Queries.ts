import { gql } from 'graphql-request';

export const UNISWAP_ENDPOINT = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2';

export const UNISWAP_MARKET_DATA_QUERY = gql`
  query pair($poolAddress: Bytes!) {
    pair(id: $poolAddress) {
      reserveUSD
      token0 {
        symbol
      }
      token0Price
      token1 {
        symbol
      }
      token1Price
    }
  }
`;
