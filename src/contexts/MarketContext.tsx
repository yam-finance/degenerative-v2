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

      for (const synthName in SynthInfo) {
        const synth = SynthInfo[synthName];
        const collateral = CollateralMap[synth.collateral];

        try {
          const { tvl, totalSupply, expirationTimestamp } = await getEmpState(synth.emp.address);
          const isExpired = expirationTimestamp.toNumber() < Math.trunc(Date.now() / 1000);

          const collateralPriceUsd = await getUsdPrice(collateral.address);

          const pool = await getPoolData(synth.pool.address);
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

          data[synthName] = {
            price: priceUsd.toFixed(2),
            liquidity: liquidity,
            totalSupply: utils.formatUnits(totalSupply, collateral.decimals),
            tvl: realTvl.toString(),
            marketCap: marketCap.toString(),
            volume24h: '0', // TODO need to get from subgraph
            apr: apr,
            isExpired: isExpired,
          };
        } catch (err) {
          console.error(err);
        }
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
