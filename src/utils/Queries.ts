import { gql } from 'graphql-request';

//export const UNISWAP_ENDPOINT = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2';
export const UNISWAP_ENDPOINT: Record<number, string> = {
  1: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2',
  42: 'https://api.thegraph.com/subgraphs/name/sc0vu/uniswap-v2-kovan',
  1337: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2',
};

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
