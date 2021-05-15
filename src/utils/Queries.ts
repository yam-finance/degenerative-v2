import { gql } from 'graphql-request';

export const UNISWAP_ENDPOINT = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2';
export const SUSHISWAP_ENDPOINT = 'https://api.thegraph.com/subgraphs/name/sushiswap/exchange';

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

export const UNISWAP_DAILY_PRICE_QUERY = gql`
  query tokenDayDatas($tokenAddresses: [String!], $startingTime: Int!) {
    tokenDayDatas(orderBy: date, orderDirection: asc, where: { token_in: $tokenAddresses, date_gt: $startingTime }) {
      id
      date
      priceUSD
    }
  }
`;
