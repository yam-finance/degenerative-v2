import React, { createContext, useState, useEffect, useContext } from 'react';
import { ISynthMarketData, IMap, Emp } from '@/types';
import { SynthMap, CollateralMap, getUsdPriceData, getApr, getPoolData } from '@/utils';
import { useEmp } from '@/hooks';
import numeral from 'numeral';
import { EthereumContext } from '@/contexts';

const initialState = {
  marketData: {} as IMap<ISynthMarketData>,
};

export const MarketContext = createContext(initialState);

export const MarketProvider: React.FC = ({ children }) => {
  const { signer } = useContext(EthereumContext);
  const [marketData, setMarketData] = useState<IMap<ISynthMarketData>>(initialState.marketData);
  const { getEmpContract, getTvlData, queryEmpState } = useEmp();

  useEffect(() => {
    const initializeMarketData = async () => {
      const formatForDisplay = (num: string) => numeral(num).format('0.0a');

      const data: typeof marketData = {};

      for (const synthName in SynthMap) {
        const synth = SynthMap[synthName];

        try {
          // TODO Not sure why none of the contract getters are working. FIX IMMEDIATELY
          const { tvl, totalSupply } = await getTvlData(synth.emp.address);
          console.log('TVL DATA');
          console.log(tvl);
          console.log(totalSupply);

          //const expirationTimestamp = await emp.expirationTimestamp();
          //const isExpired = expirationTimestamp.toNumber() > Date.now();
          //const empstate = await queryEmpState(synth.emp.address);

          const isExpired = false; // TODO
          //const tvl = '1000';
          //const totalSupply = '5555';

          const collateralPriceUsd = await getUsdPriceData(CollateralMap[synth.metadata.collateral].address);

          const pool = await getPoolData(synth.pool.address);
          const liquidity = pool.reserveUSD;

          let priceUsd;
          if (synth.metadata.collateral === pool.token0.symbol) {
            priceUsd = pool.token0Price * collateralPriceUsd;
          } else {
            priceUsd = pool.token1Price * collateralPriceUsd;
          }

          const marketCap = (priceUsd * Number(totalSupply)).toString();
          const apr = '100'; // TODO

          data[synthName] = {
            price: priceUsd.toFixed(2).toString(),
            liquidity: formatForDisplay(liquidity),
            totalSupply: formatForDisplay(totalSupply.toString()),
            tvl: formatForDisplay(tvl.toString()),
            marketCap: formatForDisplay(marketCap),
            volume24h: formatForDisplay('0'), // TODO need to get from subgraph
            apr: apr,
            isExpired: isExpired,
          };
        } catch (err) {
          console.error(err);
        }
      }

      setMarketData(data);
    };

    initializeMarketData();
  }, [signer]);

  return (
    <MarketContext.Provider
      value={{
        marketData,
      }}
    >
      {children}
    </MarketContext.Provider>
  );
};
