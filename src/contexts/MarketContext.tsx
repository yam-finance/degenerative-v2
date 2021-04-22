import React, { createContext, useState, useEffect, useContext } from 'react';
import { ISynthMarketData, IMap } from '@/types';
import { SynthInfo, CollateralMap, getUsdPrice, getApr, getPoolData, getEmpState, roundDecimals } from '@/utils';
import { utils } from 'ethers';

const initialState = {
  synthMarketData: {} as IMap<ISynthMarketData>,
};

export const MarketContext = createContext(initialState);

// TODO Rename to SynthContext, put useEmp hook in here
export const MarketProvider: React.FC = ({ children }) => {
  const [synthMarketData, setSynthMarketData] = useState<IMap<ISynthMarketData>>(initialState.synthMarketData);

  // TODO This entire context can be moved to utils with other synth information by connecting to
  //      app's eth node rather than user's connection
  useEffect(() => {
    const initializeMarketData = async () => {
      const data: typeof synthMarketData = {};

      try {
        const requests = Object.entries(SynthInfo).map(([name, synth]) => {
          const collateral = CollateralMap[synth.collateral];
          return Promise.all([name, synth, collateral, getEmpState(synth), getUsdPrice(collateral.address), getPoolData(synth.pool.address)]);
        });
        const resolved = await Promise.all(requests);

        for (const synthData of resolved) {
          const [
            name,
            synth,
            collateral,
            { tvl, totalSupply, expirationTimestamp, rawGlobalUtilization, minTokens, liquidationPoint },
            collateralPriceUsd,
            pool,
          ] = synthData;

          //const isExpired = expirationTimestamp.toNumber() < Math.trunc(Date.now() / 1000);
          const dateToday = new Date(Math.trunc(Date.now() / 1000));
          const expiration = new Date(expirationTimestamp.toNumber());
          const daysTillExpiry = Math.round((expiration.getTime() - dateToday.getTime()) / (3600 * 24));
          const liquidity = pool.reserveUSD;

          let priceUsd;
          let pricePerCollateral;
          if (synth.collateral === pool.token0.symbol) {
            priceUsd = pool.token0Price * collateralPriceUsd;
            pricePerCollateral = pool.token0Price;
          } else {
            priceUsd = pool.token1Price * collateralPriceUsd;
            pricePerCollateral = pool.token1Price;
          }

          const tvlUsd = collateralPriceUsd * Number(utils.formatUnits(tvl, collateral.decimals));
          const marketCap = priceUsd * Number(utils.formatUnits(totalSupply, collateral.decimals));
          const apr = String((Math.random() * 100).toFixed(2)); // TODO get actual APR

          console.log(name);
          console.log(rawGlobalUtilization);

          data[name] = {
            price: priceUsd.toFixed(2),
            liquidity: liquidity,
            totalSupply: utils.formatUnits(totalSupply, collateral.decimals),
            tvl: tvlUsd.toString(),
            marketCap: marketCap.toString(),
            volume24h: '0', // TODO need to get from subgraph
            globalUtilization: roundDecimals(rawGlobalUtilization * pricePerCollateral, 4),
            minTokens: minTokens,
            liquidationPoint: liquidationPoint,
            apr: apr,
            daysTillExpiry: daysTillExpiry,
          };
        }
      } catch (err) {
        console.log(err);
      }

      setSynthMarketData(data);
    };

    initializeMarketData();
  }, []);

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
