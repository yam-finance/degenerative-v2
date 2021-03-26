import React, { createContext, useState, useEffect, useContext } from 'react';

import { ISynthInfo, IToken, IMintedPosition, ISynthInWallet, IPoolPosition } from '@/types';
import { SynthMap, CollateralMap } from '@/utils/TokenList';

import { useEmp, useToken, useUniswap } from '@/hooks';
import { EthereumContext } from './EthereumContext';
import { BigNumber, utils } from 'ethers';
import { parseBytes32String } from '@ethersproject/strings';

const initialState = {
  mintedPositions: [] as IMintedPosition[],
  synthsInWallet: [] as ISynthInWallet[],
  //poolPositions: [] as IPoolPosition[],
  setSynth: (name: string) => {},
  getSponsorPosition: (synthName: string) => {},
  currentSynth: {} as ISynthInfo | undefined,
  currentCollateral: {} as IToken | undefined,
};

export const UserContext = createContext(initialState);

export const UserProvider: React.FC = ({ children }) => {
  const { account, signer } = useContext(EthereumContext);
  const [mintedPositions, setMintedPositions] = useState<IMintedPosition[]>([]);
  const [synthsInWallet, setSynthsInWallet] = useState<ISynthInWallet[]>([]);
  const [currentSynth, setCurrentSynth] = useState<ISynthInfo>();
  const [currentCollateral, setCurrentCollateral] = useState<IToken>();

  const emp = useEmp();
  const erc20 = useToken();
  const { getPrice } = useUniswap();

  // TODO DEBUG
  useEffect(() => {
    console.log('WTF');
    console.log(currentSynth);
  }, []);

  useEffect(() => {
    if (currentSynth) {
      setCurrentCollateral(CollateralMap[currentSynth.metadata.collateral]);
    }
  }, [currentSynth]);

  useEffect(() => {
    if (signer && account) {
      updateMintedPositions();
      updateSynthsInWallet();
      //getMarketData();
    }
  }, [signer, account]);

  const setSynth = (name: string) => {
    console.log('SET SYNTH CALLED');
    console.log(name);
    setCurrentSynth(SynthMap[name]);
  };

  const updateMintedPositions = () => {
    const minted: IMintedPosition[] = [];
    Object.keys(SynthMap).forEach(async (name) => {
      const mintedPosition = await getSponsorPosition(name);
      if (mintedPosition) minted.push(mintedPosition);
    });
    setMintedPositions(minted);
  };

  const getSponsorPosition = async (synthName: string) => {
    const { tokensOutstanding, rawCollateral } = await emp.getUserPosition(SynthMap[synthName].emp.address);

    try {
      if (rawCollateral.gt(0) && tokensOutstanding.gt(0)) {
        const mintedPosition: IMintedPosition = {
          tokenAmount: utils.formatEther(tokensOutstanding),
          // tokenPrice: await (await getPrice(synth.token, collateral)).price,
          collateralAmount: utils.formatEther(rawCollateral),
          // collateralPrice:
          collateralRatio: rawCollateral.div(tokensOutstanding).toString(),
          metadata: SynthMap[synthName].metadata,
        };
        return Promise.resolve(mintedPosition);
      }
    } catch (err) {
      return Promise.reject('Account does not have a sponsor position.');
    }
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
        currentCollateral,
        setSynth,
        getSponsorPosition,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
