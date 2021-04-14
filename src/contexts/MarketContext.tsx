import React, { createContext, useState, useEffect, useContext } from 'react';
import { ISynthMarketData, IMap, Emp } from '@/types';
import { SynthInfo, CollateralMap, getUsdPrice, getApr, getPoolData, formatForDisplay } from '@/utils';
import { useEmp } from '@/hooks';
import { EthereumContext } from '@/contexts';

// TODO DEBUG
import { getEmpState } from '@/utils/EmpUtils';
import { utils } from 'ethers';

const initialState = {
  synthMarketData: {} as IMap<ISynthMarketData>,
};

export const MarketContext = createContext(initialState);

export const MarketProvider: React.FC = ({ children }) => {
  const { signer } = useContext(EthereumContext);
  const [synthMarketData, setSynthMarketData] = useState<IMap<ISynthMarketData>>(initialState.synthMarketData);

  // TODO This entire context can be moved to utils with other synth information by connecting to
  //      app's eth node rather than user's connection
  useEffect(() => {
    const initializeMarketData = async () => {
      const data: typeof synthMarketData = {};

      try {
        const requests = Object.entries(SynthInfo).map(([name, synth]) => {
          const collateral = CollateralMap[synth.collateral];
          return Promise.all([name, synth, collateral, getEmpState(synth.emp.address), getUsdPrice(collateral.address), getPoolData(synth.pool.address)]);
        });
        const resolved = await Promise.all(requests);

        for (const synthData of resolved) {
          const [name, synth, collateral, { tvl, totalSupply, expirationTimestamp }, collateralPriceUsd, pool] = synthData;

          const isExpired = expirationTimestamp.toNumber() < Math.trunc(Date.now() / 1000);
          const liquidity = pool.reserveUSD;

          let priceUsd;
          if (synth.collateral === pool.token0.symbol) {
            priceUsd = pool.token0Price * collateralPriceUsd;
          } else {
            priceUsd = pool.token1Price * collateralPriceUsd;
          }

          const realTvl = collateralPriceUsd * Number(utils.formatUnits(tvl, collateral.decimals));
          const marketCap = priceUsd * Number(utils.formatUnits(totalSupply, collateral.decimals));
          const apr = String((Math.random() * 100).toFixed(2)); // TODO get actual APR

          data[name] = {
            price: priceUsd.toFixed(2),
            liquidity: liquidity,
            totalSupply: utils.formatUnits(totalSupply, collateral.decimals),
            tvl: realTvl.toString(),
            marketCap: marketCap.toString(),
            volume24h: '0', // TODO need to get from subgraph
            apr: apr,
            isExpired: isExpired,
          };
        }
      } catch (err) {
        console.log(err);
      }

      setSynthMarketData(data);
    };

    initializeMarketData();
  }, [signer]);

  return (
    <MarketContext.Provider
      value={{
        synthMarketData,
      }}
    >
      {children}
    </MarketContext.Provider>
  );
};
