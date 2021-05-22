import { BigNumber, utils } from 'ethers';

// Equivalent to Unsigned type in UMA's FixedPoint library

interface UnsignedInterface {
  rawValue: BigNumber;
}

export default class Unsigned implements UnsignedInterface {
  rawValue: BigNumber;

  constructor(value: number | string, decimals: number) {
    // TODO change to parseUnits, pass in decimals
    this.rawValue = utils.parseUnits(String(value), decimals);
  }
}
