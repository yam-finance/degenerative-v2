import { BigNumber, providers, utils } from 'ethers';
import { ISynthInfo, Emp__factory } from '@/types';
import { getCollateralData, roundDecimals } from '@/utils';

export const EthNodeProvider = new providers.JsonRpcProvider('https://fee7372b6e224441b747bf1fde15b2bd.eth.rpc.rivet.cloud');

/** Grabs TVL, total supply and if synth is expired. */
export const getEmpState = async (synth: ISynthInfo, chainId: number, provider = EthNodeProvider) => {
  const empAddress = synth.emp.address;
  const synthDecimals = synth.token.decimals ?? 18;
  const collateralName = synth.collateral;
  const collateralData = getCollateralData(chainId);
  const collateralDecimals = collateralData[collateralName].decimals;

  try {
    const empContract = Emp__factory.connect(empAddress, provider);
    const [cumulativeFeeMultiplier, totalCollateral, totalSupply, expirationTimestamp, minimumTokens, collateralRequirement] = await Promise.all([
      empContract.cumulativeFeeMultiplier(),
      empContract.rawTotalPositionCollateral(),
      empContract.totalTokensOutstanding(),
      empContract.expirationTimestamp(),
      empContract.minSponsorTokens(),
      empContract.collateralRequirement(),
      // TODO get liquidation ratio
    ]);

    const feeMultiplier = Number(utils.formatEther(cumulativeFeeMultiplier));

    // TODO need to be adjusted based on decimals
    const totalCollateralNorm = Number(utils.formatUnits(totalCollateral, collateralDecimals));
    const totalSupplyNorm = Number(utils.formatUnits(totalSupply, synthDecimals));

    const globalUtil = totalSupplyNorm / (totalCollateralNorm * feeMultiplier);
    const globalUtilRounded = roundDecimals(globalUtil, 2);

    const minTokens = Number(utils.formatEther(minimumTokens));
    const liquidationPoint = 1 / Number(utils.formatEther(collateralRequirement));

    return {
      tvl: totalCollateral,
      totalSupply,
      expirationTimestamp,
      rawGlobalUtilization: globalUtilRounded, // NOT scaled by price of synth
      minTokens,
      liquidationPoint,
    };
  } catch (err) {
    return Promise.reject('Failed to retrieve EMP information.');
  }
};
