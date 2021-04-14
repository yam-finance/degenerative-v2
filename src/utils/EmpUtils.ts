import { providers } from 'ethers';
import { Emp__factory, Unsigned, IEmpState, IUserPositions } from '@/types';

export const EthNodeProvider = new providers.JsonRpcProvider('https://fee7372b6e224441b747bf1fde15b2bd.eth.rpc.rivet.cloud');

// TODO This will be moved to API

/** Grabs TVL, total supply and if synth is expired. */
export const getEmpState = async (empAddress: string) => {
  try {
    const empContract = Emp__factory.connect(empAddress, EthNodeProvider);

    const tvl = await empContract.rawTotalPositionCollateral();
    const totalSupply = await empContract.totalTokensOutstanding();
    const expirationTimestamp = await empContract.expirationTimestamp();

    return {
      tvl,
      totalSupply,
      expirationTimestamp,
    };
  } catch (err) {
    return Promise.reject('Failed to retrieve EMP information.');
  }
};
