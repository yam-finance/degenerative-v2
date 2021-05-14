import { BigNumber, providers, utils } from 'ethers';
import { ISynth, Empv2__factory } from '@/types';
import { getCollateralData, roundDecimals } from '@/utils';

export const EthNodeProvider = new providers.JsonRpcProvider('https://fee7372b6e224441b747bf1fde15b2bd.eth.rpc.rivet.cloud');

/** Grabs TVL, total supply and if synth is expired. */
export const getEmpState = async (synth: ISynth, chainId: number, provider = EthNodeProvider) => {
  const empAddress = synth.emp.address;
  const synthDecimals = synth.token.decimals ?? 18;
  const collateralName = synth.collateral;
  const collateralData = getCollateralData(chainId);
  const collateralDecimals = collateralData[collateralName].decimals; // TODO this might always be equal to synth decimals

  try {
    const empContract = Empv2__factory.connect(empAddress, provider);
    const [
      cumulativeFeeMultiplier,
      totalCollateral,
      totalSupply,
      minimumTokens,
      collateralRequirement,
      withdrawalPeriod, // Given as seconds
      expirationTimestamp,
      currentTime,
    ] = await Promise.all([
      empContract.cumulativeFeeMultiplier(),
      empContract.rawTotalPositionCollateral(),
      empContract.totalTokensOutstanding(),
      empContract.minSponsorTokens(),
      empContract.collateralRequirement(),
      empContract.withdrawalLiveness(),
      empContract.expirationTimestamp(),
      empContract.getCurrentTime(),
    ]);

    const feeMultiplier = Number(utils.formatEther(cumulativeFeeMultiplier));

    const totalCollateralNorm = Number(utils.formatUnits(totalCollateral, collateralDecimals));
    const totalSupplyNorm = Number(utils.formatUnits(totalSupply, synthDecimals));

    const globalUtil = totalSupplyNorm / (totalCollateralNorm * feeMultiplier);
    const globalUtilRounded = roundDecimals(globalUtil, 4);

    const minTokens = Number(utils.formatUnits(minimumTokens, collateralDecimals));
    const liquidationPoint = 1 / Number(utils.formatEther(collateralRequirement));

    return {
      tvl: totalCollateral,
      totalSupply,
      expirationTimestamp,
      currentTime,
      rawGlobalUtilization: globalUtilRounded, // NOT scaled by price of synth
      minTokens,
      liquidationPoint,
      withdrawalPeriod: withdrawalPeriod.toNumber(),
    };
  } catch (err) {
    return Promise.reject('Failed to retrieve EMP information.');
  }
};
