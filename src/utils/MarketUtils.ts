import { request } from 'graphql-request';
import axios from 'axios';
import numeral from 'numeral';
import { sub, getUnixTime, fromUnixTime, formatISO, parseISO } from 'date-fns';
import zonedTimeToUtc from 'date-fns-tz/zonedTimeToUtc';
import { BigNumber, utils, constants } from 'ethers';
import { UNISWAP_ENDPOINT, UNISWAP_MARKET_DATA_QUERY, UNISWAP_DAILY_PRICE_QUERY } from '@/utils';
import { CollateralMap, SynthInfo, SynthTypes } from './TokenList';
import { IMap } from '@/types';

sessionStorage.clear();

export const getDateString = (date: Date) => formatISO(date, { representation: 'date' });

// Get USD price of token and cache to sessionstorage
export const getUsdPrice = async (tokenAddress: string) => {
  const cached = sessionStorage.getItem(tokenAddress);
  if (cached) return Promise.resolve(Number(cached));

  try {
    const res = await axios.get(`https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${tokenAddress}&vs_currencies=usd`);
    const price = Number(res.data[tokenAddress].usd);
    sessionStorage.setItem(tokenAddress, price.toString());
    return Promise.resolve(price);
  } catch (err) {
    return Promise.reject(err);
  }
};

// Get USD price history of token from Coingecko
export const getUsdPriceHistory = async (tokenName: string) => {
  console.log(tokenName);
  const cgId = CollateralMap[tokenName].coingeckoId;
  try {
    const res = await axios.get(`https://api.coingecko.com/api/v3/coins/${cgId}/market_chart?vs_currency=usd&days=30&interval=daily`);
    const prices = res.data.prices;
    console.log(prices);
    const priceHistory = prices.map(([timestamp, price]: number[]) => {
      const newTimestamp = timestamp.toString().substring(0, timestamp.toString().length - 3);
      const date = getDateString(fromUnixTime(Number(newTimestamp)));
      return [date, price];
    });

    return Promise.resolve(priceHistory);
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

/** Get reference price history. Returns price in wei. */
export const getReferencePriceHistory = async (type: string) => {
  try {
    let res;
    switch (type) {
      case 'uGas':
        res = await axios.get('https://data.yam.finance/median-history');
        break;
      case 'uStonks':
        res = await axios.get('https://data.yam.finance/ustonks/index-history'); // TODO this is too big
        break;
      default:
        break;
    }

    return res?.data;
  } catch (err) {
    return Promise.reject(err);
  }
};

interface PriceHistoryResponse {
  date: number;
  id: string;
  priceUSD: string;
}

/** Get labels, reference price data and all market price data for this synth type. */
export const getDailyPriceHistory = async (type: string) => {
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

  // Use reduce to find min and max range dates
  const [min, max] = dailyPriceResponse.tokenDayDatas
    .map((data) => fromUnixTime(data.date))
    .reduce((acc: Date[], val: Date) => {
      acc[0] = acc[0] === undefined || val < acc[0] ? val : acc[0];
      acc[1] = acc[1] === undefined || val > acc[1] ? val : acc[1];
      return acc;
    }, []);

  // Generate array of dates from min to max, convert to ISO string
  const dateArray = (() => {
    if (min && max) {
      const dates: string[] = [];
      const currentDate = new Date(min);
      while (currentDate <= max) {
        dates.push(getDateString(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return dates;
    } else {
      return [];
    }
  })();

  // Get reference index prices (USD) for each date
  // TODO this should be done on API
  const referenceData = await (async () => {
    const refPrices = await getReferencePriceHistory(type);
    const collateralUsd = new Map<string, number>(await getUsdPriceHistory(SynthTypes[type].collateral));

    if (min && max) {
      const minIndex = refPrices.findIndex((ref: any) => getDateString(parseISO(ref.timestamp)) === getDateString(min));
      const maxIndex = refPrices.findIndex((ref: any) => getDateString(parseISO(ref.timestamp)) === getDateString(max));
      return refPrices.slice(minIndex, maxIndex).map((ref: any) => {
        const dateString = getDateString(new Date(ref.timestamp));
        // TODO change to use strategy based on synth type
        const usdPricePerGwei = (collateralUsd.get(dateString) ?? 1) / 10 ** 9;
        const price = ref.price / 1000; // TODO numbers don't work without dividing by 1000. Not sure why.
        return Math.round(price * usdPricePerGwei * 100) / 100;
      });
    }
  })();

  // TODO timezone not converting to UTC correctly
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Map price data to date for each synth for easy access
  const priceData: IMap<IMap<number>> = {};
  dailyPriceResponse.tokenDayDatas.forEach((dayData) => {
    // id is concatenated with a timestamp at end. Not necessary for us since we have the date
    const synthName = relevantSynths.get(dayData.id.split('-')[0]) ?? '';

    if (!priceData[synthName]) priceData[synthName] = {};
    const date = formatISO(fromUnixTime(dayData.date), { representation: 'date' });
    priceData[synthName][date] = Math.round(Number(dayData.priceUSD) * 100) / 100;
  });

  // Create object of arrays for reference prices and all synth prices
  const res: IMap<number[]> = { Reference: referenceData };
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

  return {
    labels: dateArray,
    synthPrices: res,
  };
};

export const formatForDisplay = (num: string | number | BigNumber) => {
  if (BigNumber.isBigNumber(num)) num = num.toString();
  return numeral(num).format('0.0a');
};
