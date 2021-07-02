// Get reference price history for each synth type
import axios from 'axios';
import { SynthGroups, getUsdPriceHistory, getDateString, roundDecimals } from '@/utils';
import { fromUnixTime } from 'date-fns';

/** Get reference price history and transform for use in charts. Returns array
 *  of objects with keys of timestamp and price.
 */
export const getReferencePriceHistory = async (type: string, chainId: number) => {
  const fetchUgas = async () => {
    const res = await axios.get('https://data.yam.finance/median-history');

    return res.data.map(({ timestamp, price }: { timestamp: number; price: number }) => {
      const dateString = getDateString(fromUnixTime(timestamp));
      const scaledPrice = price / 10 ** 12; // uGAS represents 1,000,000 gas

      return {
        timestamp: dateString,
        price: roundDecimals(scaledPrice, 6),
      };
    });
  };

  const fetchUstonks = async () => {
    // TODO !!!!!!!!!!!!
    // TODO endpoint hardcoded to 09-21 for now
    // TODO !!!!!!!!!!!!
    const res = await axios.get('https://api.yam.finance/synths/ustonks-0921/index-history');

    return res.data.map(({ timestamp, price }: { timestamp: number; price: number }) => {
      const dateString = getDateString(fromUnixTime(timestamp));

      return {
        timestamp: dateString,
        price: roundDecimals(Number(price), 2),
      };
    });
  };

  const fetchUpunks = async () => {
    const res = await axios.get('https://api.yam.finance/degenerative/upunks/price-history');

    return res.data.map(({ timestamp, price }: { timestamp: number; price: number }) => {
      const dateString = getDateString(fromUnixTime(timestamp));

      return {
        timestamp: dateString,
        price: price,
      };
    });
  };

  try {
    switch (type) {
      case 'uGAS':
        return await fetchUgas();
      case 'uSTONKS':
        return await fetchUstonks();
      case 'uPUNKS':
        return await fetchUpunks();
      default:
        return Promise.reject('Type not recognized');
    }
  } catch (err) {
    return Promise.reject(err);
  }
};
