import React, { createContext, useState, useEffect, useContext } from 'react';

import { ISynthInfo, IToken, IMintedPosition, ISynthInWallet, IPoolPosition } from '@/types';
import { CollateralMap, SynthInfo } from '@/utils/TokenList';

import { useEmp, useToken } from '@/hooks';
import { EthereumContext } from './EthereumContext';
import { BigNumber, utils } from 'ethers';

const initialState = {
  mintedPositions: [] as IMintedPosition[],
  synthsInWallet: [] as ISynthInWallet[],
  //poolPositions: [] as IPoolPosition[],
  setSynth: (synthName: string) => {},
  getSponsorPosition: (synthName: string) => {},
  currentSynth: '',
  currentCollateral: '',
  emp: {} as ReturnType<typeof useEmp>,
};

export const UserContext = createContext(initialState);

export const UserProvider: React.FC = ({ children }) => {
  const { account, signer } = useContext(EthereumContext);
  const [mintedPositions, setMintedPositions] = useState<IMintedPosition[]>([]);
  const [synthsInWallet, setSynthsInWallet] = useState<ISynthInWallet[]>([]);
  const [currentSynth, setCurrentSynth] = useState('');
  const [currentCollateral, setCurrentCollateral] = useState('');

  const emp = useEmp();
  const erc20 = useToken();

  useEffect(() => {
    if (currentSynth) {
      setCurrentCollateral(SynthInfo[currentSynth].collateral);
    }
  }, [currentSynth]);

  // TODO update when user has minted tokens
  useEffect(() => {
    if (signer && account) {
      updateMintedPositions();
      updateSynthsInWallet();
    }
  }, [signer, account]);

  const setSynth = (synthName: string) => {
    console.log('SET SYNTH CALLED');
    console.log(synthName);
    setCurrentSynth(synthName);
  };

  const updateMintedPositions = () => {
    const minted: IMintedPosition[] = [];
    Object.keys(SynthInfo).forEach(async (name) => {
      try {
        const mintedPosition = await getSponsorPosition(name);
        minted.push(mintedPosition);
      } catch (err) {
        // Do nothing
      }
    });
    setMintedPositions(minted);
  };

  const getSponsorPosition = async (synthName: string) => {
    const { tokensOutstanding, rawCollateral } = await emp.getUserPosition(SynthInfo[synthName].emp.address);

    if (rawCollateral.gt(0) && tokensOutstanding.gt(0)) {
      const mintedPosition: IMintedPosition = {
        name: synthName,
        tokenAmount: utils.formatEther(tokensOutstanding),
        // tokenPrice: await (await getPrice(synth.token, collateral)).price,
        collateralAmount: utils.formatEther(rawCollateral),
        // collateralPrice:
        collateralRatio: rawCollateral.div(tokensOutstanding).toString(), // TODO replace with utilization
      };
      return Promise.resolve(mintedPosition);
    } else {
      return Promise.reject('Account does not have a sponsor position.');
    }
  };

  // TODO
  const updateSynthsInWallet = () => {
    const synthsOwned: ISynthInWallet[] = [];

    Object.entries(SynthInfo).forEach(async ([name, synth]) => {
      const balance = await erc20.getBalance(synth.token.address);

      if (balance.gt(0)) {
        const inWallet: ISynthInWallet = {
          name: name,
          // TODO add price USD
          tokenAmount: utils.formatEther(balance),
        };

        synthsOwned.push(inWallet);
      }
    });

    setSynthsInWallet(synthsOwned);
  };

  return (
    <UserContext.Provider
      value={{
        mintedPositions,
        synthsInWallet,
        currentSynth,
        currentCollateral,
        setSynth,
        getSponsorPosition,
        emp,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
