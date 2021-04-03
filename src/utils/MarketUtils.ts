import { request } from 'graphql-request';
import axios from 'axios';
import numeral from 'numeral';
import { BigNumber } from 'ethers';
import { UNISWAP_ENDPOINT, UNISWAP_MARKET_DATA_QUERY } from '@/utils';

// Get USD price of token and cache to sessionstorage
export const getUsdPriceData = async (tokenAddress: string) => {
  const cached = sessionStorage.getItem(tokenAddress);
  if (cached) return Promise.resolve(cached);

  try {
    const res = await axios.get(`https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${tokenAddress}&vs_currencies=usd`);
    const price = res.data[tokenAddress].usd;
    sessionStorage.setItem(tokenAddress, price);
    return Promise.resolve(price);
  } catch (err) {
    return Promise.reject(err);
  }
};

// Get Uniswap pool data
export const getPoolData = async (poolAddress: string) => {
  try {
    const data = await request(UNISWAP_ENDPOINT, UNISWAP_MARKET_DATA_QUERY, { poolAddress: poolAddress });
    return data.pair;
  } catch (err) {
    return Promise.reject(err);
  }
};

// TODO get APR from Degenerative API
export const getApr = () => {};

// TODO Used for chart datasets
export const getPriceHistory = () => {};

export const formatForDisplay = (num: string | number | BigNumber) => {
  if (BigNumber.isBigNumber(num)) num = num.toString();
  return numeral(num).format('0.0a');
};
