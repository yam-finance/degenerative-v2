// Get reference price history for each synth type
import axios from 'axios';
import { SynthTypes, getUsdPriceHistory, getDateString } from '@/utils';

/** Get reference price history and transform for use in charts. Returns array
 *  of objects with keys of timestamp and price.
 */
export const getReferencePriceHistory = async (type: string) => {
  const fetchUgas = async (collateral: string) => {
    const collateralUsd = new Map<string, number>(await getUsdPriceHistory(collateral));
    const res = await axios.get('https://data.yam.finance/median-history');

    return res.data.map(({ timestamp, price }: { timestamp: number; price: number }) => {
      const dateString = getDateString(new Date(timestamp));
      const usdPriceCollateral = (collateralUsd.get(dateString) ?? 1) / 10 ** 9;
      const scaledPrice = price / 1000; // TODO numbers don't work without dividing by 1000. Not sure why.

      return {
        timestamp: dateString,
        price: Math.round(scaledPrice * usdPriceCollateral * 100) / 100,
      };
    });
  };

  const fetchUstonks = async (collateral: string) => {
    const collateralUsd = new Map<string, number>(await getUsdPriceHistory(collateral));
    const res = await axios.get('https://data.yam.finance/ustonks/index-history');

    return res.data.map(({ timestamp, price }: { timestamp: number; price: number }) => {
      const dateString = getDateString(new Date(timestamp));
      const usdPriceCollateral = collateralUsd.get(dateString) ?? 1;

      return {
        timestamp: dateString,
        price: Math.round(price * usdPriceCollateral * 100) / 100,
      };
    });
  };

  try {
    // Get collateral price in USD
    const collateral = SynthTypes[type].collateral;

    switch (type) {
      case 'uGas':
        return await fetchUgas(collateral);
      case 'uStonks':
        return await fetchUstonks(collateral);
      default:
        return Promise.reject('Type not recognized');
    }
  } catch (err) {
    return Promise.reject(err);
  }
};