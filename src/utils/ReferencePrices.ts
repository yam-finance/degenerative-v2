// Get reference price history for each synth type
import axios from 'axios';
import { SynthGroups, getUsdPriceHistory, getDateString, roundDecimals } from '@/utils';
import { fromUnixTime } from 'date-fns';

/** Get reference price history and transform for use in charts. Returns array
 *  of objects with keys of timestamp and price.
 */
export const getReferencePriceHistory = async (type: string, chainId: number) => {
  const fetchUgas = async (collateral: string, chainId: number) => {
    const collateralUsd = new Map<string, number>(await getUsdPriceHistory(collateral, chainId));
    const res = await axios.get('https://data.yam.finance/median-history');

    return res.data.map(({ timestamp, price }: { timestamp: number; price: number }) => {
      const dateString = getDateString(fromUnixTime(timestamp));
      const usdPriceCollateral = (collateralUsd.get(dateString) ?? 1) / 10 ** 9;
      const scaledPrice = price / 1000; // Numbers don't work without dividing by 1000. Not sure why.

      return {
        timestamp: dateString,
        price: roundDecimals(scaledPrice * usdPriceCollateral, 2),
      };
    });
  };

  const fetchUstonks = async (collateral: string, chainId: number) => {
    const collateralUsd = new Map<string, number>(await getUsdPriceHistory(collateral, chainId));
    // TODO !!!!!!!!!!!!
    // TODO endpoint hardcoded to jun21 for now
    // TODO !!!!!!!!!!!!
    const res = await axios.get('http://data.yam.finance/ustonks/index-history-daily/jun21');

    return res.data.map(({ timestamp, price }: { timestamp: number; price: number }) => {
      const dateString = getDateString(fromUnixTime(timestamp));
      const usdPriceCollateral = collateralUsd.get(dateString) ?? 1;

      return {
        timestamp: dateString,
        price: roundDecimals(price * usdPriceCollateral, 2),
      };
    });
  };

  const fetchUpunks = async (collateral: string, chainId: number) => {
    const collateralUsd = new Map<string, number>(await getUsdPriceHistory(collateral, chainId));
    const res = await axios.get('https://api.yam.finance/degenerative/upunks/price-history');

    return res.data.map(({ timestamp, price }: { timestamp: number; price: number }) => {
      const dateString = getDateString(fromUnixTime(timestamp));
      const usdPriceCollateral = collateralUsd.get(dateString) ?? 1;

      return {
        timestamp: dateString,
        price: roundDecimals(price * usdPriceCollateral, 2),
      };
    });
  };

  try {
    // Get collateral price in USD
    const collateral = SynthGroups[type].collateral;

    console.log(type);
    switch (type) {
      case 'uGas':
        return await fetchUgas(collateral, chainId);
      case 'uStonks':
        return await fetchUstonks(collateral, chainId);
      case 'uPUNKS':
        return await fetchUpunks(collateral, chainId);
      default:
        return Promise.reject('Type not recognized');
    }
  } catch (err) {
    return Promise.reject(err);
  }
};
