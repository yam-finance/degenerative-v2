import React, { createContext, useState, useEffect, useContext } from 'react';
import { EthereumContext } from '@/contexts';
import { ISynthMarketData, ISynthInfo } from '@/types';
import { getSynthMetadata, CollateralMap, getUsdPrice, getApr, getPoolData, getEmpState, roundDecimals } from '@/utils';
import { utils } from 'ethers';

const initialState = {
  synthMarketData: {} as Record<string, ISynthMarketData>,
  synthMetadata: {} as Record<string, ISynthInfo>,
  loading: false,
};

export const MarketContext = createContext(initialState);

// TODO Rename to SynthContext, put useEmp hook in here
export const MarketProvider: React.FC = ({ children }) => {
  const [synthMarketData, setSynthMarketData] = useState(initialState.synthMarketData);
  const [synthMetadata, setSynthMetadata] = useState(initialState.synthMetadata);
  const [loading, setLoading] = useState(false);

  const { chainId, provider } = useContext(EthereumContext);

  // TODO This entire context can be moved to utils with other synth information by connecting to
  //      app's eth node rather than user's connection
  useEffect(() => {
    const initializeMarketData = async (synthMetadata: Record<string, ISynthInfo>, isTestnet: boolean) => {
      const data: typeof synthMarketData = {};

      // TODO Change this to actually grab information
      if (isTestnet) {
        Object.entries(synthMetadata).map(([name, synth]: [string, any]) => {
          data[name] = {
            price: Math.trunc(Math.random() * 100).toString(),
            liquidity: String(Math.random() * 100),
            totalSupply: Math.trunc(Math.random() * 100).toString(),
            tvl: Math.trunc(Math.random() * 100).toString(),
            marketCap: Math.trunc(Math.random() * 100).toString(),
            volume24h: '0', // TODO need to get from subgraph
            globalUtilization: Math.trunc(Math.random() * 100),
            minTokens: Math.trunc(Math.random() * 100),
            liquidationPoint: Math.trunc(Math.random() * 100),
            apr: Math.trunc(Math.random() * 100).toString(),
            daysTillExpiry: Math.trunc(Math.random() * 100),
          };
        });
        setSynthMarketData(data);
        return;
      }

      try {
        const requests = Object.entries(synthMetadata).map(([name, synth]) => {
          const collateral = CollateralMap[synth.collateral];
          return Promise.all([
            name,
            synth,
            collateral,
            getEmpState(synth, provider),
            getUsdPrice(collateral.address),
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
          console.log(pool);

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
            const apr = String((Math.random() * 100).toFixed(2)); // TODO get actual APR

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
          } catch (err0) {
            console.error('Error retrieving market data this synth');
            data[name] = {
              price: '0',
              liquidity: '0',
              totalSupply: '0',
              tvl: '0',
              marketCap: '0',
              volume24h: '0', // TODO need to get from subgraph
              globalUtilization: 0.1,
              minTokens: 1,
              liquidationPoint: 0.01,
              apr: '0',
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
      const isTestnet = chainId !== 1 && chainId !== 1337;
      initializeMarketData(metadata, false);
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
      }}
    >
      {children}
    </MarketContext.Provider>
  );
};
