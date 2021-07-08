import React, { createContext, useContext, useEffect, useState } from "react";
import { utils } from "ethers";
import { EthereumContext } from "@/contexts";
import { ISynth, ISynthMarketData, IToken } from "@/types";
import {
  getApr,
  getCollateralData,
  getEmpState,
  getPoolData,
  getSynthMetadata,
  getUsdPrice,
  roundDecimals,
  SynthGroups
} from "@/utils";

// const initialState = {
//   synthMarketData: {} as Record<string, ISynthMarketData>,
//   synthMetadata: {} as Record<string, ISynth>,
//   collateralData: {} as Record<string, IToken>,
//   loading: false,
// };

type SynthName = string;
type SynthMarketData = Record<SynthName, ISynthMarketData>
type SynthMetadata = Record<SynthName, ISynth>
type CollateralData = Record<SynthName, IToken>

type MarketContext = {
  synthMarketData: SynthMarketData | undefined;
  synthMetadata: SynthMetadata | undefined;
  collateralData: CollateralData | undefined;
  loading: boolean;
};

type SynthGroups = keyof typeof SynthGroups

export const MarketContext = createContext<MarketContext | undefined>(undefined);

export const MarketProvider: React.FC = ({ children }) => {
  const [synthMarketData, setSynthMarketData] = useState<SynthMarketData | undefined>(undefined);
  const [synthMetadata, setSynthMetadata] = useState<SynthMetadata | undefined>(undefined);
  const [collateralData, setCollateralData] = useState<CollateralData | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const ethereumContext = useContext(EthereumContext);
  const { chainId = 0, provider } = ethereumContext ?? {};


  useEffect(() => {
    (async () => {
      const initializeMarketData = async (
        synthMetadata: SynthMetadata,
        collateralData: CollateralData
      ) => {
        const data: SynthMarketData = {};

        try {
          const requests = Object.entries(synthMetadata).map(([name, synth]) => {
            const pairedToken = SynthGroups[synth.group as SynthGroups].paired;
            const paired = collateralData[pairedToken];
            const collateral = collateralData[synth.collateral];

            return Promise.all([
              name,
              synth,
              collateral,
              paired,
              getEmpState(synth, chainId, provider),
              getUsdPrice(collateral.coingeckoId ?? ""),
              getPoolData(synth.pool)
            ]);
          });
          const resolved = await Promise.all(requests);

          for (const synthData of resolved) {
            const [
              name,
              synth,
              ,
              paired,
              {
                tvl,
                totalSupply,
                expirationTimestamp,
                currentTime,
                rawGlobalUtilization,
                minTokens,
                liquidationPoint,
                withdrawalPeriod
              },
              collateralPriceUsd,
              pool
            ] = synthData;

            try {
              const dateToday = new Date(currentTime.toNumber());
              const expiration = new Date(expirationTimestamp.toNumber());
              const daysTillExpiry = Math.round((expiration.getTime() - dateToday.getTime()) / (3600 * 24));
              const isExpired = dateToday >= expiration;
              const liquidity = pool.reserveUSD ?? 0;

              let priceUsd;
              let pricePerPaired;
              if (synth.collateral === pool.token0.symbol) {
                priceUsd = pool.token0Price * collateralPriceUsd;
                pricePerPaired = pool.token0Price;
              } else {
                priceUsd = pool.token1Price * collateralPriceUsd;
                pricePerPaired = pool.token1Price;
              }
              const tvlUsd = collateralPriceUsd * Number(utils.formatUnits(tvl, paired.decimals));
              const marketCap = priceUsd * Number(utils.formatUnits(totalSupply, paired.decimals));

              // Grab APRs from API
              const pricedGlobalUtil = rawGlobalUtilization * pricePerPaired;
              const aprAtGcr = !isExpired ? await getApr(name, 1 / pricedGlobalUtil) : 0;
              const aprAt2 = !isExpired ? await getApr(name, 2) : 0; // 2 is a reasonably safe ratio that is more practical than GCR

              data[name] = {
                price: roundDecimals(Number(pricePerPaired), 4), // TODO price per paired
                priceUsd: roundDecimals(priceUsd, 2),
                collateralPriceUsd: roundDecimals(collateralPriceUsd, 2),
                liquidity: Math.trunc(liquidity),
                totalSupply: roundDecimals(Number(utils.formatUnits(totalSupply, paired.decimals)), 2),
                tvl: tvlUsd,
                marketCap: Math.trunc(marketCap),
                volume24h: 0, // TODO need to get from subgraph
                globalUtilization: roundDecimals(rawGlobalUtilization, 4),
                minTokens: minTokens,
                liquidationPoint: liquidationPoint,
                withdrawalPeriod: withdrawalPeriod / 60, // Convert to minutes
                apr: roundDecimals(aprAtGcr, 2),
                aprAt2: roundDecimals(aprAt2, 2),
                daysTillExpiry: daysTillExpiry,
                isExpired: isExpired
              };
            } catch (err0) {
              console.error(err0);
              console.error("Could not retrieve market data this synth");

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
                aprAt2: 0,
                daysTillExpiry: 69,
                isExpired: false
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
        const collateral = (getCollateralData(chainId) as unknown) as CollateralData;
        await initializeMarketData(metadata, collateral);
        setCollateralData(collateral);
        setSynthMetadata(metadata);
      }
      setLoading(false);
    })();
  }, [provider, chainId]);

  return (
    <MarketContext.Provider
      value={{
        loading,
        synthMarketData,
        synthMetadata,
        collateralData
      }}
    >
      {children}
    </MarketContext.Provider>
  );
};
