import React, { createContext, useState, useEffect, useContext } from 'react';
import { EthereumContext } from '@/contexts';
import { ISynthMarketData, ISynthInfo, ICollateral } from '@/types';
import { getSynthMetadata, getUsdPrice, getApr, getPoolData, getEmpState, roundDecimals, getCollateralData } from '@/utils';
import { utils } from 'ethers';

const initialState = {
  synthMarketData: {} as Record<string, ISynthMarketData>,
  synthMetadata: {} as Record<string, ISynthInfo>,
  collateralData: {} as Record<string, ICollateral>,
  loading: false,
};

export const MarketContext = createContext(initialState);

// TODO Rename to SynthContext (?)
export const MarketProvider: React.FC = ({ children }) => {
  const [synthMarketData, setSynthMarketData] = useState(initialState.synthMarketData);
  const [synthMetadata, setSynthMetadata] = useState(initialState.synthMetadata);
  const [collateralData, setCollateralData] = useState(initialState.collateralData);
  const [loading, setLoading] = useState(false);

  const { chainId, provider } = useContext(EthereumContext);

  useEffect(() => {
    const initializeMarketData = async (synthMetadata: Record<string, ISynthInfo>, collateralData: Record<string, ICollateral>) => {
      const data: typeof synthMarketData = {};

      try {
        const requests = Object.entries(synthMetadata).map(([name, synth]) => {
          const collateral = collateralData[synth.collateral];
          return Promise.all([
            name,
            synth,
            collateral,
            getEmpState(synth, chainId, provider),
            getUsdPrice(collateral.coingeckoId ?? ''),
            getPoolData(synth.pool.address, chainId),
          ]);
        });
        const resolved = await Promise.all(requests);

        for (const synthData of resolved) {
          const [
            name,
            synth,
            collateral,
            { tvl, totalSupply, expirationTimestamp, currentTime, rawGlobalUtilization, minTokens, liquidationPoint, withdrawalPeriod },
            collateralPriceUsd,
            pool,
          ] = synthData;

          try {
            const dateToday = new Date(currentTime.toNumber());
            const expiration = new Date(expirationTimestamp.toNumber());
            const daysTillExpiry = Math.round((expiration.getTime() - dateToday.getTime()) / (3600 * 24));
            const isExpired = dateToday >= expiration;
            const liquidity = pool.reserveUSD ?? 0;

            // TODO THIS IS WRONG
            // TODO This is not price per collateral, this is price per other asset in pool. Must capture this data
            let priceUsd;
            let pricePerPaired;
            if (synth.collateral === pool.token0.symbol) {
              priceUsd = pool.token0Price * collateralPriceUsd;
              pricePerPaired = pool.token0Price;
            } else {
              priceUsd = pool.token1Price * collateralPriceUsd;
              pricePerPaired = pool.token1Price;
            }

            const globalUtilization = rawGlobalUtilization * pricePerPaired;
            const tvlUsd = collateralPriceUsd * Number(utils.formatUnits(tvl, collateral.decimals));
            const marketCap = priceUsd * Number(utils.formatUnits(totalSupply, collateral.decimals));
            const apr = roundDecimals(Math.random() * 100, 2); // TODO get actual APR

            data[name] = {
              price: roundDecimals(Number(pricePerPaired), 4),
              priceUsd: roundDecimals(priceUsd, 2),
              collateralPriceUsd: roundDecimals(collateralPriceUsd, 2),
              liquidity: Math.trunc(liquidity),
              totalSupply: roundDecimals(Number(utils.formatUnits(totalSupply, collateral.decimals)), 2),
              tvl: tvlUsd,
              marketCap: Math.trunc(marketCap),
              volume24h: 0, // TODO need to get from subgraph
              globalUtilization: roundDecimals(globalUtilization, 4),
              minTokens: minTokens,
              liquidationPoint: liquidationPoint,
              withdrawalPeriod: withdrawalPeriod / 60, // Convert to minutes
              apr: apr,
              daysTillExpiry: daysTillExpiry,
              isExpired: isExpired,
            };
          } catch (err0) {
            console.error(err0);
            console.error('Could not retrieve market data this synth');

            // TODO is this necessary?
            data[name] = {
              price: 1,
              priceUsd: 0,
              collateralPriceUsd: 0,
              liquidity: 0,
              totalSupply: 1,
              tvl: 1,
              marketCap: 1,
              volume24h: 1, // TODO need to get from subgraph
              globalUtilization: 0.1,
              minTokens: 1,
              liquidationPoint: 0.01,
              withdrawalPeriod: 0,
              apr: 0,
              daysTillExpiry: 69,
              isExpired: false,
            };
          }
        }
      } catch (err) {
        console.error(err);
      }

      setSynthMarketData(data);
    };

    setLoading(true);

    if (chainId !== 0) {
      const metadata = getSynthMetadata(chainId);
      const collateral = getCollateralData(chainId);
      initializeMarketData(metadata, collateral);
      setCollateralData(collateral);
      setSynthMetadata(metadata);
    }

    setLoading(false);
  }, [provider, chainId]);

  return (
    <MarketContext.Provider
      value={{
        loading,
        synthMarketData,
        synthMetadata,
        collateralData,
      }}
    >
      {children}
    </MarketContext.Provider>
  );
};
