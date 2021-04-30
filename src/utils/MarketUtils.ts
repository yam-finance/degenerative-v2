import { request } from 'graphql-request';
import axios from 'axios';
import { sub, getUnixTime, fromUnixTime, formatISO, parseISO } from 'date-fns';
import zonedTimeToUtc from 'date-fns-tz/zonedTimeToUtc';
import { BigNumber, utils, constants } from 'ethers';
import { UNISWAP_ENDPOINT, UNISWAP_MARKET_DATA_QUERY, UNISWAP_DAILY_PRICE_QUERY, getReferencePriceHistory, getDateString, getCollateralData } from '@/utils';
import { IMap, ISynthInfo } from '@/types';

sessionStorage.clear();

// Get USD price of token and cache to sessionstorage
/*
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
*/

export const getUsdPrice = async (cgId: string) => {
  const cached = sessionStorage.getItem(cgId);
  if (cached) return Promise.resolve(Number(cached));

  try {
    const res = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=usd`);
    const price = Number(res.data[cgId].usd);
    sessionStorage.setItem(cgId, price.toString());
    return Promise.resolve(price);
  } catch (err) {
    return Promise.reject(err);
  }
};

// Get USD price history of token from Coingecko
export const getUsdPriceHistory = async (tokenName: string, chainId: number) => {
  const collateral = getCollateralData(chainId);
  console.log('collateral');
  console.log(chainId);
  console.log(collateral);
  const cgId = collateral[tokenName].coingeckoId;

  try {
    const res = await axios.get(`https://api.coingecko.com/api/v3/coins/${cgId}/market_chart?vs_currency=usd&days=30&interval=daily`);
    const prices = res.data.prices;
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
export const getPoolData = async (poolAddress: string, chainId: number) => {
  try {
    const data = await request(UNISWAP_ENDPOINT[chainId], UNISWAP_MARKET_DATA_QUERY, { poolAddress: poolAddress });
    return data.pair;
  } catch (err) {
    console.log(err);
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

/** Get labels, reference price data and all market price data for this synth type. */
export const getDailyPriceHistory = async (type: string, synthMetadata: Record<string, ISynthInfo>, chainId: number) => {
  // TODO defaults to 30 days
  const startingTime = getUnixTime(sub(new Date(), { days: 30 }));

  const relevantSynths = new Map(
    Object.entries(synthMetadata)
      .filter(([name, synth]) => synth.type === type)
      .map(([name, synth]) => [synth.token.address, name])
  );

  const addressList = Array.from(relevantSynths.keys());

  console.log('WTFJKLAJFKLAS');
  // TODO grab paired data, not USD
  const dailyPriceResponse: {
    tokenDayDatas: PriceHistoryResponse[];
  } = await request(UNISWAP_ENDPOINT[1], UNISWAP_DAILY_PRICE_QUERY, {
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
    const refPrices = await getReferencePriceHistory(type, chainId);
    console.log('REF PRICES');
    console.log(refPrices);

    if (min && max) {
      const minIndex = refPrices.findIndex((ref: any) => getDateString(parseISO(ref.timestamp)) === getDateString(min));
      const maxIndex = refPrices.findIndex((ref: any) => getDateString(parseISO(ref.timestamp)) === getDateString(max));
      return refPrices.slice(minIndex, maxIndex).map((ref: any) => ref.price);
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
