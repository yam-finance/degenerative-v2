import { BigNumber, providers, utils } from 'ethers';
import { Emp__factory, Unsigned, IEmpState, IUserPositions } from '@/types';

export const EthNodeProvider = new providers.JsonRpcProvider('https://fee7372b6e224441b747bf1fde15b2bd.eth.rpc.rivet.cloud');

/** Grabs TVL, total supply and if synth is expired. */
export const getEmpState = async (empAddress: string) => {
  try {
    const empContract = Emp__factory.connect(empAddress, EthNodeProvider);
    const [cumulativeFeeMultiplier, totalCollateral, totalSupply, expirationTimestamp, minimumTokens] = await Promise.all([
      empContract.cumulativeFeeMultiplier(),
      empContract.rawTotalPositionCollateral(),
      empContract.totalTokensOutstanding(),
      empContract.expirationTimestamp(),
      empContract.minSponsorTokens(),
      // TODO get liquidation ratio
    ]);

    const feeMultiplier = Number(utils.formatEther(cumulativeFeeMultiplier));

    // TODO need to be adjusted based on decimals
    const totalCollateralNorm = Number(utils.formatEther(totalCollateral));
    const totalSupplyNorm = Number(utils.formatEther(totalSupply));
    console.log(totalCollateralNorm, totalSupplyNorm);
    console.log('GCR');
    console.log((totalCollateralNorm * feeMultiplier) / totalSupplyNorm);

    const globalUtil = totalSupplyNorm / (totalCollateralNorm * feeMultiplier);
    const globalUtilRounded = Math.round((globalUtil + Number.EPSILON) * 100) / 100;

    const minTokens = Number(utils.formatEther(minimumTokens));

    return {
      tvl: totalCollateral,
      totalSupply,
      expirationTimestamp,
      globalUtilization: globalUtilRounded,
      minTokens,
    };
  } catch (err) {
    return Promise.reject('Failed to retrieve EMP information.');
  }
};
