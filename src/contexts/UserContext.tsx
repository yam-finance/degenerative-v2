import React, { createContext, useContext, useEffect, useState } from 'react';

import { IMintedPosition, ITokensInWallet } from '@/types';

import { useEmp, useToken } from '@/hooks';
import { EthereumContext } from './EthereumContext';
import { BigNumber, utils } from "ethers";
import { MarketContext } from './MarketContext';
import { roundDecimals } from '@/utils';

type UserContext = {
  mintedPositions: Array<IMintedPosition>;
  synthsInWallet: Array<ITokensInWallet>;
  setSynth: (synthName: string) => void;
  getSponsorPosition: (synthName: string) => void;
  currentSynth: string;
  currentCollateral: string;
  triggerUpdate: () => void;
};

export const UserContext = createContext<UserContext | undefined>(undefined);

export const UserProvider: React.FC = ({ children }) => {
  const ethereumContext = useContext(EthereumContext);
  const account = ethereumContext?.account;
  const marketContext = useContext(MarketContext);
  const { synthMetadata, synthMarketData, collateralData } = marketContext ?? {};

  const [mintedPositions, setMintedPositions] = useState<IMintedPosition[]>([]);
  const [synthsInWallet, setSynthsInWallet] = useState<ITokensInWallet[]>([]);
  const [currentSynth, setCurrentSynth] = useState('');
  const [currentCollateral, setCurrentCollateral] = useState('');
  const [forceUpdate, setForceUpdate] = useState(false);

  const initialized = account && synthMetadata && synthMarketData && collateralData;

  const emp = useEmp();
  const erc20 = useToken();

  useEffect(() => {
    if (currentSynth && synthMetadata) {
      setCurrentCollateral(synthMetadata[currentSynth].collateral);
    }
  }, [currentSynth, synthMetadata]);

  useEffect(() => {
    if (forceUpdate || initialized) {
      updateMintedPositions();
      updateSynthsInWallet();
      setForceUpdate(false);
    }
  }, [initialized, forceUpdate]);

  const setSynth = (synthName: string) => setCurrentSynth(synthName);

  const updateMintedPositions = () => {
    const minted: IMintedPosition[] = [];
    Object.keys(synthMetadata ?? {}).forEach(async (name) => {
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
    if (!synthMetadata) return Promise.reject('Synth MetaData is undefined.');
    const synth = synthMetadata[synthName];
    const {
      tokensOutstanding,
      rawCollateral,
      withdrawalRequestPassTimeStamp,
      withdrawalRequestAmount,
    } = await emp.getUserPosition(synth);

    if (rawCollateral.gt(0) || tokensOutstanding.gt(0)) {
      const tokens = Number(utils.formatUnits(tokensOutstanding, synth.token.decimals));
      const collateral = Number(utils.formatUnits(rawCollateral, synth.token.decimals));
      const withdrawalRequestNum = Number(utils.formatUnits(withdrawalRequestAmount, synth.token.decimals));
      const withdrawalRequestTimestamp = withdrawalRequestPassTimeStamp.toNumber();

      const mintedPosition: IMintedPosition = {
        name: synthName,
        tokenAmount: tokens,
        // tokenPrice: await (await getPrice(synth.token, collateral)).price,
        collateralAmount: collateral,
        // collateralPrice:
        utilization: roundDecimals(tokens / collateral, 4),
        withdrawalRequestAmount: withdrawalRequestNum,
        withdrawalRequestTimestamp: withdrawalRequestTimestamp,
      };

      return Promise.resolve(mintedPosition);
    } else {
      return Promise.reject('Account does not have a sponsor position.');
    }
  };

  const updateSynthsInWallet = () => {
    const synthsOwned: ITokensInWallet[] = [];

    Object.entries(synthMetadata ?? {}).forEach(async ([name, synth]) => {
      const balance = (await erc20.getBalance(synth.token.address)) as BigNumber;

      if (balance.gt(0)) {
        const synth = synthMetadata ? synthMetadata[name] : undefined;
        const tokens = Number(utils.formatUnits(balance, synth?.token.decimals));

        const inWallet: ITokensInWallet = {
          name: name,
          tokenAmount: roundDecimals(tokens, 2),
        };

        synthsOwned.push(inWallet);
      }
    });

    setSynthsInWallet(synthsOwned);
  };

  // TODO This can probably be removed if useDapp or Web3React are integrated
  const triggerUpdate = () => setForceUpdate(true);

  return (
    <UserContext.Provider
      value={{
        mintedPositions,
        synthsInWallet,
        currentSynth,
        currentCollateral,
        setSynth,
        getSponsorPosition,
        triggerUpdate,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
