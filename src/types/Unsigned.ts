import { BigNumber, utils } from 'ethers';

// Equivalent to Unsigned type in UMA's FixedPoint library

interface UnsignedInterface {
  rawValue: BigNumber;
}

export default class Unsigned implements UnsignedInterface {
  rawValue: BigNumber;

  constructor(value: number | string) {
    // TODO change to parseUnits, pass in decimals
    this.rawValue = utils.parseEther(String(value));
  }
}
