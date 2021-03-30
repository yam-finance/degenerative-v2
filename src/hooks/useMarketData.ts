import { useEffect } from 'react';
import { Emp, ISynthInfo } from '@/types';
import { CollateralMap, getUsdPriceData, getApr, getPoolData } from '@/utils';
import { useEmp } from '@/hooks';
import { utils, BigNumber } from 'ethers';

export const useMarketData = async (synth: ISynthInfo) => {
  /*
  const { chainId } = useContext(EthereumContext);

  // TODO unused currently. can use coingecko api instead
  const getPrice = async (token_: IToken, collateral_: IToken) => {
    const token = new Token(chainId, token_.address, token_?.decimals as number);
    const collateral = new Token(chainId, collateral_.address, collateral_?.decimals as number);

    const tokenPair = await Fetcher.fetchPairData(token, collateral);
    const route = new Route([tokenPair], collateral); // TODO is this correct?

    return {
      price: route.midPrice.toSignificant(4),
      inversePrice: route.midPrice.invert().toSignificant(4),
    };
  };
  */
  const { queryEmpState } = useEmp();

  const { rawTotalPositionCollateral: tvl, totalTokensOutstanding: totalSupply } = await queryEmpState(synth.emp.address);
  if (tvl && totalSupply) {
    console.log(tvl?.toString());
    console.log(totalSupply?.toString());
  }

  const collateralAddress = CollateralMap[synth.metadata.collateral].address;
  const poolAddress = synth.pool.address;

  const collateralPrice = (await getUsdPriceData(collateralAddress)).price;

  // Get all relevant market data from Uniswap
  const marketData = await getPoolData(poolAddress);

  // Get synth price based on collateral's USD price
  let priceUsd;
  if (synth.metadata.collateral === marketData.pair.token0.symbol) {
    priceUsd = marketData.pair.token1Price * collateralPrice;
  } else {
    priceUsd = marketData.pair.token0Price * collateralPrice;
  }

  const apr = getApr();
  //const marketCap = Number(utils.formatEther(totalSupply as BigNumber)) * priceUsd;
  const marketCap = 0;

  return {
    priceUsd,
    //...marketData,
    apr,
    tvl,
    totalSupply,
    marketCap,
  };
};
