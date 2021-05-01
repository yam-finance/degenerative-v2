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

// TODO Rename to SynthContext, put useEmp hook in here
export const MarketProvider: React.FC = ({ children }) => {
  const [synthMarketData, setSynthMarketData] = useState(initialState.synthMarketData);
  const [synthMetadata, setSynthMetadata] = useState(initialState.synthMetadata);
  const [collateralData, setCollateralData] = useState(initialState.collateralData);
  const [loading, setLoading] = useState(false);

  const { chainId, provider } = useContext(EthereumContext);

  // TODO This entire context can be moved to utils with other synth information by connecting to
  //      app's eth node rather than user's connection
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
            { tvl, totalSupply, expirationTimestamp, rawGlobalUtilization, minTokens, liquidationPoint },
            collateralPriceUsd,
            pool,
          ] = synthData;

          try {
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
            const apr = roundDecimals(Math.random() * 100, 2); // TODO get actual APR

            data[name] = {
              price: roundDecimals(Number(pricePerCollateral), 4),
              priceUsd: roundDecimals(priceUsd, 2),
              liquidity: Math.trunc(liquidity),
              totalSupply: roundDecimals(Number(utils.formatUnits(totalSupply, collateral.decimals)), 2),
              tvl: tvlUsd,
              marketCap: Math.trunc(marketCap),
              volume24h: 0, // TODO need to get from subgraph
              globalUtilization: roundDecimals(rawGlobalUtilization * pricePerCollateral, 4),
              // TODO temporary hardcode for testing
              //globalUtilization: roundDecimals(3 * pricePerCollateral, 4),
              // TODO
              minTokens: minTokens,
              liquidationPoint: liquidationPoint,
              apr: apr,
              daysTillExpiry: daysTillExpiry,
            };
          } catch (err0) {
            console.error(err0);
            console.error('Could not retrieve market data this synth');

            data[name] = {
              price: 0,
              priceUsd: 0,
              liquidity: 0,
              totalSupply: 0,
              tvl: 0,
              marketCap: 0,
              volume24h: 0, // TODO need to get from subgraph
              globalUtilization: 0.1,
              minTokens: 1,
              liquidationPoint: 0.01,
              apr: 0,
              daysTillExpiry: 69,
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
