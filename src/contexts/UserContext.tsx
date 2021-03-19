import React, { createContext, useState, useEffect, useContext } from 'react';
import useAsyncEffect from 'use-async-effect';

import { ISynthInfo, IMintedPosition, ISynthInWallet, IPoolPosition, ISynthMarketData } from '@/types';
import { SynthMap, getCollateral } from '@/utils/TokenList';

import { useEmp, useToken, useUniswap } from '@/hooks';
import { useQuery } from 'graphql-hooks';
import { EthereumContext } from './EthereumContext';
import { BigNumber, utils } from 'ethers';

const initialState = {
  mintedPositions: [] as IMintedPosition[],
  synthsInWallet: [] as ISynthInWallet[],
  //poolPositions: [] as IPoolPosition[],
  setSynth: (name: string) => {},
  //getMarketData: () => {},
  currentSynth: {} as ISynthInfo,
};

export const UserContext = createContext(initialState);

export const UserProvider: React.FC = ({ children }) => {
  const { account, signer } = useContext(EthereumContext);
  const [mintedPositions, setMintedPositions] = useState<IMintedPosition[]>([]);
  const [synthsInWallet, setSynthsInWallet] = useState<ISynthInWallet[]>([]);
  const [currentSynth, setCurrentSynth] = useState<ISynthInfo>({} as ISynthInfo); // TODO

  const emp = useEmp();
  const erc20 = useToken();
  const { getPrice } = useUniswap();

  const setSynth = (name: string) => setCurrentSynth(SynthMap[name]);

  // TODO DEBUG
  useEffect(() => {
    setCurrentSynth(SynthMap['UGASMAR21']);
  }, []);

  useEffect(() => {
    if (signer && account) {
      updateMintedPositions();
      updateSynthsInWallet();
      //getMarketData();
    }
  }, [signer, account]);

  const updateMintedPositions = () => {
    const minted: IMintedPosition[] = [];

    Object.keys(SynthMap).forEach(async (name) => {
      const synth = SynthMap[name];
      const { tokensOutstanding, rawCollateral } = await emp.getUserPosition(synth.emp.address);

      if (rawCollateral.gt(0) && tokensOutstanding.gt(0)) {
        const position: IMintedPosition = {
          tokenAmount: utils.formatEther(tokensOutstanding),
          // tokenPrice: await (await getPrice(synth.token, collateral)).price,
          collateralAmount: utils.formatEther(rawCollateral),
          // collateralPrice:
          collateralRatio: rawCollateral.div(tokensOutstanding).toString(),
          metadata: synth.metadata,
        };

        minted.push(position);
      }
    });

    setMintedPositions(minted);
  };

  // TODO
  const updateSynthsInWallet = () => {
    const synthsOwned: ISynthInWallet[] = [];

    Object.keys(SynthMap).forEach(async (name) => {
      const synth = SynthMap[name];
      const balance = await erc20.getBalance(synth.token.address);

      if (balance.gt(0)) {
        const inWallet: ISynthInWallet = {
          // TODO add price USD
          tokenAmount: utils.formatEther(balance),
          metadata: synth.metadata,
        };

        synthsOwned.push(inWallet);
      }
    });

    setSynthsInWallet(synthsOwned);
  };

  // TODO
  /*
  const getMarketData = async () => {
    const marketData = await Object.keys(SynthMap).map(async (name) => {
      // TODO change to only query relevant data from EMP
      const { rawTotalPositionCollateral, totalTokensOutstanding } = await emp.queryEmpState(SynthMap[name].emp.address);

      const synthMarketData: ISynthMarketData = {
        metadata: SynthMap[name].metadata,
        tvl: rawTotalPositionCollateral?.toString() as string,
        volume24h: data.volumeUSD as string,
        marketCap: totalTokensOutstanding?.toString() as string, // TODO multiply by priceUsd
        totalSupply: totalTokensOutstanding?.toString() as string,
      };
      return synthMarketData;
    });

    console.log(marketData);
  };*/

  return (
    <UserContext.Provider
      value={{
        mintedPositions,
        synthsInWallet,
        currentSynth,
        setSynth,
        //getMarketData,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
