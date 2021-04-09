import { request } from 'graphql-request';
import axios from 'axios';
import numeral from 'numeral';
import { sub, getUnixTime, fromUnixTime, formatISO } from 'date-fns';
import zonedTimeToUtc from 'date-fns-tz/zonedTimeToUtc';
import { BigNumber } from 'ethers';
import { UNISWAP_ENDPOINT, UNISWAP_MARKET_DATA_QUERY, UNISWAP_DAILY_PRICE_QUERY } from '@/utils';
import { SynthInfo } from './TokenList';
import { IMap } from '@/types';
import { Database } from 'react-feather';

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

interface PriceHistoryResponse {
  date: number;
  id: string;
  priceUSD: string;
}

/** Get all price data for this synth type and format for chart.
 *  Returns object of objects
 *  synthName: {
 *    unixTime: price
 *    ...
 *  } */
export const getDailyPriceHistory = async (type: string) => {
  const toDateString = (date: Date) => formatISO(date, { representation: 'date' });

  // TODO defaults to 30 days
  const startingTime = getUnixTime(sub(new Date(), { days: 30 }));

  const relevantSynths = new Map(
    Object.entries(SynthInfo)
      .filter(([name, synth]) => synth.type === type)
      .map(([name, synth]) => [synth.token.address, name])
  );

  const addressList = Array.from(relevantSynths.keys());
  const dailyPriceResponse: {
    tokenDayDatas: PriceHistoryResponse[];
  } = await request(UNISWAP_ENDPOINT, UNISWAP_DAILY_PRICE_QUERY, {
    tokenAddresses: addressList,
    startingTime: startingTime,
  });

  // Find min and max date
  let min: Date | undefined;
  let max: Date | undefined;
  dailyPriceResponse.tokenDayDatas.forEach((data) => {
    const date = fromUnixTime(data.date);
    if (!min) {
      min = date;
    } else {
      if (date < min) min = date;
    }

    if (!max) {
      max = date;
    } else {
      if (date > max) max = date;
    }
  });

  // Generate array of dates from min to max, convert to ISO string
  const dateArray = (() => {
    if (min && max) {
      const dates: string[] = [];
      const currentDate = min;
      while (currentDate <= max) {
        dates.push(formatISO(currentDate, { representation: 'date' }));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return dates;
    } else {
      return [];
    }
  })();

  // TODO Get reference index prices for each date

  // TODO timezone not converting to UTC correctly
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Map price data to date for each synth for easy access
  const priceData: IMap<IMap<number>> = {};
  dailyPriceResponse.tokenDayDatas.forEach((dayData) => {
    // id is concatenated with a timestamp at end. Not necessary for us since we have the date
    const synthName = relevantSynths.get(dayData.id.split('-')[0]) ?? '';

    if (!priceData[synthName]) priceData[synthName] = {};
    const date = formatISO(fromUnixTime(dayData.date), { representation: 'date' });
    priceData[synthName][date] = Math.round((Number(dayData.priceUSD) + Number.EPSILON) * 100) / 100;
  });

  // Create response object of arrays for labels, index price data, and all daily synth prices
  // TODO get reference index price data
  const res: IMap<number[]> = {};
  dateArray.forEach((date) => {
    Object.keys(priceData).forEach((synthName) => {
      if (!res[synthName]) res[synthName] = [];

      if (priceData[synthName][date]) {
        res[synthName].push(priceData[synthName][date]);
      } else {
        // If no price for date, copy last pushed price
        const prevIndex = res[synthName].length - 1;
        res[synthName].push(res[synthName][prevIndex]);
      }
    });
  });

  console.log(res);

  return {
    labels: dateArray,
    synthPrices: res,
  };
};

export const formatForDisplay = (num: string | number | BigNumber) => {
  if (BigNumber.isBigNumber(num)) num = num.toString();
  return numeral(num).format('0.0a');
};
