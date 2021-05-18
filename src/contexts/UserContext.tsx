import React, { createContext, useState, useEffect, useContext } from 'react';

import { IMintedPosition, ITokensInWallet, IPoolPosition } from '@/types';

import { useEmp, useToken } from '@/hooks';
import { EthereumContext } from './EthereumContext';
import { BigNumber, utils } from 'ethers';
import { MarketContext } from './MarketContext';
import { isEmpty, roundDecimals } from '@/utils';

const initialState = {
  mintedPositions: [] as IMintedPosition[],
  synthsInWallet: [] as ITokensInWallet[],
  collateralInWallet: [] as ITokensInWallet[],
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
  const { synthMetadata, synthMarketData, collateralData } = useContext(MarketContext);

  const [mintedPositions, setMintedPositions] = useState<IMintedPosition[]>([]);
  const [synthsInWallet, setSynthsInWallet] = useState<ITokensInWallet[]>([]);
  const [collateralInWallet, setCollateralInWallet] = useState<ITokensInWallet[]>([]);
  const [currentSynth, setCurrentSynth] = useState('');
  const [currentCollateral, setCurrentCollateral] = useState('');

  const emp = useEmp();
  const erc20 = useToken();

  useEffect(() => {
    if (currentSynth && !isEmpty(synthMetadata)) {
      setCurrentCollateral(synthMetadata[currentSynth].collateral);
    }
  }, [currentSynth, synthMetadata]);

  // TODO update when user has minted tokens
  useEffect(() => {
    if (signer && synthMetadata && synthMarketData) {
      updateMintedPositions();
      updateSynthsInWallet();
      updateCollateralInWallet();
    }
  }, [signer, synthMetadata, synthMarketData]);

  const setSynth = (synthName: string) => {
    setCurrentSynth(synthName);
  };

  const updateMintedPositions = () => {
    const minted: IMintedPosition[] = [];
    Object.keys(synthMetadata).forEach(async (name) => {
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
    const synth = synthMetadata[synthName];
    const {
      tokensOutstanding,
      rawCollateral,
      withdrawalRequestPassTimeStamp,
      withdrawalRequestAmount,
    } = await emp.getUserPosition(synth);
    const { price } = synthMarketData[synthName];

    if (rawCollateral.gt(0) || tokensOutstanding.gt(0)) {
      const tokens = Number(utils.formatUnits(tokensOutstanding, synth.token.decimals));
      const collateral = Number(utils.formatUnits(rawCollateral, synth.token.decimals));
      const withdrawalRequest = Number(utils.formatUnits(withdrawalRequestAmount, synth.token.decimals));
      const withdrawalRequestTimestamp = withdrawalRequestPassTimeStamp.toNumber();

      const mintedPosition: IMintedPosition = {
        name: synthName,
        tokenAmount: roundDecimals(tokens, 2),
        // tokenPrice: await (await getPrice(synth.token, collateral)).price,
        collateralAmount: roundDecimals(collateral, 2),
        // collateralPrice:
        utilization: roundDecimals((tokens / collateral) * price, 2),
        withdrawalRequestAmount: withdrawalRequest,
        withdrawalRequestTimestamp: withdrawalRequestTimestamp,
      };

      return Promise.resolve(mintedPosition);
    } else {
      return Promise.reject('Account does not have a sponsor position.');
    }
  };

  // TODO Change to updateTokensInWallet. Grab all relevant tokens: synths and collateral tokens
  const updateSynthsInWallet = () => {
    const synthsOwned: ITokensInWallet[] = [];

    Object.entries(synthMetadata).forEach(async ([name, synth]) => {
      const balance = await erc20.getBalance(synth.token.address);

      if (balance.gt(0)) {
        const synth = synthMetadata[name];
        const tokens = Number(utils.formatUnits(balance, synth.token.decimals));

        const inWallet: ITokensInWallet = {
          name: name,
          tokenAmount: roundDecimals(tokens, 2),
        };

        synthsOwned.push(inWallet);
      }
    });

    setSynthsInWallet(synthsOwned);
  };

  const updateCollateralInWallet = () => {
    const collateralOwned: ITokensInWallet[] = [];

    Object.entries(collateralData).forEach(async ([name, token]) => {
      const balance = await erc20.getBalance(token.address);

      if (balance.gt(0)) {
        console.log(name);
        const tokens = Number(utils.formatUnits(balance, token.decimals));
        const inWallet: ITokensInWallet = {
          name: name,
          tokenAmount: roundDecimals(tokens, 2),
        };

        collateralOwned.push(inWallet);
        console.log(collateralOwned);
      }
    });

    console.log(collateralOwned);
    setCollateralInWallet(collateralOwned);
  };

  return (
    <UserContext.Provider
      value={{
        mintedPositions,
        synthsInWallet,
        collateralInWallet,
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
