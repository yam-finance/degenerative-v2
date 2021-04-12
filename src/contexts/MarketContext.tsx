import React, { createContext, useState, useEffect, useContext } from 'react';
import { ISynthMarketData, IMap, Emp } from '@/types';
import { SynthInfo, CollateralMap, getUsdPrice, getApr, getPoolData, formatForDisplay } from '@/utils';
import { useEmp } from '@/hooks';
import { EthereumContext } from '@/contexts';

const initialState = {
  synthMarketData: {} as IMap<ISynthMarketData>,
};

export const MarketContext = createContext(initialState);

export const MarketProvider: React.FC = ({ children }) => {
  const { signer } = useContext(EthereumContext);
  const [synthMarketData, setSynthMarketData] = useState<IMap<ISynthMarketData>>(initialState.synthMarketData);
  const { getEmpContract, getTvlData, queryEmpState } = useEmp();

  // TODO This entire context can be moved to utils with other synth information by connecting to
  //      app's eth node rather than user's connection
  useEffect(() => {
    const initializeMarketData = async () => {
      const data: typeof synthMarketData = {};

      for (const synthName in SynthInfo) {
        const synth = SynthInfo[synthName];

        try {
          // TODO Not sure why none of the contract getters are working. FIX IMMEDIATELY
          //const { tvl, totalSupply } = await getTvlData(synth.emp.address);
          //console.log('TVL DATA');
          //console.log(tvl);
          //console.log(totalSupply);

          //const expirationTimestamp = await emp.expirationTimestamp();
          //const isExpired = expirationTimestamp.toNumber() > Date.now();
          //const empstate = await queryEmpState(synth.emp.address);

          const isExpired = false; // TODO
          const tvl = '1000';
          const totalSupply = '5555';

          const collateralPriceUsd = await getUsdPrice(CollateralMap[synth.collateral].address);

          const pool = await getPoolData(synth.pool.address);
          const liquidity = pool.reserveUSD;

          let priceUsd;
          if (synth.collateral === pool.token0.symbol) {
            priceUsd = pool.token0Price * collateralPriceUsd;
          } else {
            priceUsd = pool.token1Price * collateralPriceUsd;
          }

          const marketCap = (priceUsd * Number(totalSupply)).toString();
          const apr = String((Math.random() * 100).toFixed(2)); // TODO

          data[synthName] = {
            price: priceUsd.toFixed(2).toString(),
            liquidity: liquidity,
            totalSupply: totalSupply,
            tvl: tvl,
            marketCap: marketCap,
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
