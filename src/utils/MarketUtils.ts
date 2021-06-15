import { request } from 'graphql-request';
import axios from 'axios';
import { sub, getUnixTime, fromUnixTime, formatISO, parseISO } from 'date-fns';
import zonedTimeToUtc from 'date-fns-tz/zonedTimeToUtc';
import {
  UNISWAP_ENDPOINT,
  SUSHISWAP_ENDPOINT,
  UNISWAP_MARKET_DATA_QUERY,
  UNISWAP_DAILY_PRICE_QUERY,
  SUSHI_DAILY_PAIR_DATA,
  getReferencePriceHistory,
  getDateString,
  getCollateralData,
  roundDecimals,
  UNISWAP_DAILY_PAIR_DATA,
} from '@/utils';
import { ISynth, IToken, ILiquidityPool } from '@/types';
import { isEmpty } from './Helpers';

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

export const getReferenceSpotPrice = async (synth: ISynth) => {
  switch (synth.group) {
    case 'uGAS': {
      const res = await axios.get('https://data.yam.finance/median');
      console.log(res.data);
      return;
    }
    case 'uSTONKS': {
      const res = await axios.get('https://data.yam.finance/ustonks/index/jun21');
      console.log(res.data);
      return;
    }
    case 'uPUNKS': {
      const res = await axios.get('https://api.yam.finance/degenerative/upunks/price');
      console.log(res.data);
      return;
    }
  }
};

// Get price of token in terms of Ether from Coingecko
// TODO should probably replace with on-chain data
export const getPairPriceEth = async (token: IToken) => {
  const token1Address = token.address;

  try {
    const res = await axios.get(
      `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${token1Address}&vs_currencies=eth`
    );
    const price = Number(res.data[token1Address]['eth']);
    return Promise.resolve(price);
  } catch (err) {
    return Promise.reject(err);
  }
};

// Get USD price from Coingecko
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
  const cgId = collateral[tokenName].coingeckoId;

  try {
    const res = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${cgId}/market_chart?vs_currency=usd&days=30&interval=daily`
    );
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
export const getPoolData = async (pool: ILiquidityPool) => {
  const endpoint = pool.location === 'uni' ? UNISWAP_ENDPOINT : SUSHISWAP_ENDPOINT;
  try {
    const data = await request(endpoint, UNISWAP_MARKET_DATA_QUERY, { poolAddress: pool.address });
    return data.pair;
  } catch (err) {
    console.log(err);
    return Promise.reject(err);
  }
};

// Get APR multiplier.
export const getApr = async (name: string, cr: number): Promise<number> => {
  const collateralEfficiency = 1 / (1 + cr);

  // Return cached value if present
  const cached = sessionStorage.getItem(name);
  if (cached) return Promise.resolve(Number(cached) * collateralEfficiency);

  try {
    const res = await axios.get(`https://data.yam.finance/degenerative/apr/${name}`);
    const aprMultiplier = res.data.aprMultiplier;
    sessionStorage.setItem(name, aprMultiplier);

    return Promise.resolve(aprMultiplier * collateralEfficiency);
  } catch (err) {
    console.error(err);
    return Promise.reject('Failed to get APR.');
  }
};

interface PriceHistoryResponse {
  date: number;
  id: string;
  priceUSD: string;
}

/** Get labels, reference price data and all market price data for this synth type.
 *  Only fetches data from mainnet. This is intentional.
 */
// TODO this will grab data for individual synth
// TODO data will NOT be paired to USD
export const getDailyPriceHistory = async (synth: ISynth) => {
  const synthAddress = synth.token.address;
  const poolAddress = synth.pool.address;

  // Defaults to 30 days
  const min = sub(new Date(), { days: 30 });
  const max = new Date();
  const startingTime = getUnixTime(min);

  const dateArray = (() => {
    const dates: string[] = [];
    const currentDate = new Date(min);
    while (currentDate <= max) {
      dates.push(getDateString(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  })();

  // Get reference index prices for each date
  const referencePrices = await (async () => {
    const refPrices = await getReferencePriceHistory(synth.group, 1); // TODO

    // If API gives too much data, filter to find relevant data.
    if (refPrices.length > 30) {
      const minIndex = refPrices.findIndex((ref: any) => getDateString(parseISO(ref.timestamp)) === getDateString(min));
      return refPrices.slice(minIndex).map((ref: any) => ref.price);
    } else {
      return refPrices.map((ref: any) => ref.price);
    }
  })();

  // Get pool data from subgraph
  const endpoint = synth.pool.location === 'uni' ? UNISWAP_ENDPOINT : SUSHISWAP_ENDPOINT;
  const query = synth.pool.location === 'uni' ? UNISWAP_DAILY_PAIR_DATA : SUSHI_DAILY_PAIR_DATA;
  const poolData: { pairDayDatas: any[] } = await request(endpoint, query, {
    pairAddress: poolAddress,
    startingTime: startingTime,
  });

  let synthPrices: number[];

  if (!isEmpty(poolData.pairDayDatas)) {
    // Find which token is the synth and which is paired
    let synthId: string;
    let pairedId: string;
    if (poolData.pairDayDatas[0].token0.id === synthAddress) {
      synthId = 'reserve1';
      pairedId = 'reserve0';
    } else {
      synthId = 'reserve0';
      pairedId = 'reserve1';
    }

    // Put pool price data into a map, indexed by date.
    // Price is reserve of synth / reserve of paired
    const dailyPairData = new Map(
      poolData.pairDayDatas.map((dailyData) => [
        formatISO(fromUnixTime(dailyData.date), { representation: 'date' }),
        dailyData[synthId] / dailyData[pairedId],
      ])
    );

    // Fill in empty spaces, since subgraph only captures price when it changes
    let lastPrice = dailyPairData.values().next().value;

    synthPrices = dateArray.map((date) => {
      const price = dailyPairData.get(date);
      if (price) {
        lastPrice = price;
        return roundDecimals(Number(price), 4);
      } else {
        return roundDecimals(Number(lastPrice), 4);
      }
    });
  } else {
    synthPrices = [];
  }

  return {
    labels: dateArray,
    referencePrices: referencePrices,
    synthPrices: synthPrices,
  };
};

/** Get labels, reference price data and all market price data for this synth type.
 *  Only fetches data from mainnet. This is intentional.
 */
// TODO this will grab data for individual synth
// TODO data will NOT be paired to USD
export const getDailyPriceHistory2 = async (group: string, synthMetadata: Record<string, ISynth>, chainId: number) => {
  // Defaults to 30 days
  const startingTime = getUnixTime(sub(new Date(), { days: 30 }));

  const relevantSynths = new Map(
    Object.entries(synthMetadata)
      .filter(([name, synth]) => synth.group === group)
      .map(([name, synth]) => [synth.token.address, name])
  );

  const addressList = Array.from(relevantSynths.keys());

  // TODO Consider grabbing paired data, not USD
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
  const referenceData = await (async () => {
    const refPrices = await getReferencePriceHistory(group, chainId);

    if (refPrices.length > 30) {
      const minIndex = refPrices.findIndex((ref: any) => getDateString(parseISO(ref.timestamp)) === getDateString(min));
      const maxIndex = refPrices.findIndex((ref: any) => getDateString(parseISO(ref.timestamp)) === getDateString(max));
      return refPrices.slice(minIndex, maxIndex).map((ref: any) => ref.price);
    } else {
      const returnObject: any[] = [];
      const refMap = new Map(
        refPrices.map(({ timestamp, price }: { timestamp: string; price: number }) => [timestamp, price])
      );
      console.log(refMap);
      console.log(dateArray);

      console.log(refMap.get(dateArray[10]));
      dateArray.forEach((date) => {
        //console.log(date);
        refMap.get(date) ? returnObject.push(refMap.get(date)) : returnObject.push(undefined);
      });

      return returnObject;
    }
  })();

  console.log(referenceData);

  // Map price data to date for each synth for easy access
  const priceData: Record<string, Record<string, number>> = {};

  dailyPriceResponse.tokenDayDatas.forEach((dayData) => {
    // id is concatenated with a timestamp at end. Not necessary for us since we have the date
    const synthName = relevantSynths.get(dayData.id.split('-')[0]) ?? '';

    if (!priceData[synthName]) priceData[synthName] = {};
    const date = formatISO(fromUnixTime(dayData.date), { representation: 'date' });
    priceData[synthName][date] = Math.round(Number(dayData.priceUSD) * 100) / 100;
  });

  // Create object of arrays for reference prices and all synth prices
  const res: Record<string, number[]> = { Reference: referenceData };
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
