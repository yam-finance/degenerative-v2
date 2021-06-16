import formatISO from 'date-fns/formatISO';
import { BigNumber } from 'ethers';
import numeral from 'numeral';

// Check if object is empty
export const isEmpty = (obj: Record<any, any>) => (obj ? Object.keys(obj).length === 0 : true);

export const getDateString = (date: Date) => formatISO(date, { representation: 'date' });

export const formatForDisplay = (num: string | number | BigNumber) => {
  if (BigNumber.isBigNumber(num)) num = num.toString();
  return numeral(num).format('0.0a');
};

export const roundDecimals = (num: number, decimals: number) => {
  const scale = 10 ** decimals;
  return Math.round((num + Number.EPSILON) * scale) / scale;
};
