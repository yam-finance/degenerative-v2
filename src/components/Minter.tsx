import React, { useState, useContext, useEffect } from 'react';
import useAsyncEffect from 'use-async-effect';
import { useFormState } from 'react-use-form-state';
import { BigNumber, utils } from 'ethers';

import { useSynthState, useToken } from '@/hooks';
import { UserContext } from '@/contexts';
import { Icon } from '@/components';
import { ISynthInfo } from '@/types';

interface MinterFormFields {
  tokenAmount: number;
  collateralAmount: number;
}

export const Minter: React.FC = () => {
  const { currentSynth, currentCollateral } = useContext(UserContext);
  // TODO get max # of collateral available, user's balances
  const actions = useSynthState();
  const erc20 = useToken();

  const [maxCollateral, setMaxCollateral] = useState<BigNumber>(BigNumber.from(0));

  useAsyncEffect(async () => {
    if (currentCollateral) {
      //console.log(utils.parseEther(await erc20.getBalance(currentCollateral.address)))
      console.log('WTF');
      setMaxCollateral(await erc20.getBalance(currentCollateral.address));
    }
  }, [currentSynth, currentCollateral]);

  const [formState, { number }] = useFormState<MinterFormFields>(
    {
      tokenAmount: 0,
      collateralAmount: 0,
    },
    {
      onChange: (e, stateValues, nextStateValues) => {
        const { collateralAmount, tokenAmount } = nextStateValues;
        // TODO
        actions.setCollateralAmount(Number(collateralAmount));
        actions.setTokenAmount(Number(tokenAmount));
      },
    }
  );

  const ApproveButton: React.FC = () => {
    return (
      <div>
        <button
          onClick={(e) => {
            e.preventDefault();
            actions.onApprove().then(() => actions.onGetAllowance());
          }}
        >
          Approve
        </button>
      </div>
    );
  };

  const WrapEthButton: React.FC = () => {
    const [ethAmount, setEthAmount] = useState(0);

    return (
      <div>
        <input
          type="number"
          value={ethAmount}
          onChange={(e) => {
            e.preventDefault();
            setEthAmount(Number(e.target.value));
          }}
        />
        <button
          onClick={(e) => {
            e.preventDefault();
            actions.onWrapEth(ethAmount);
          }}
        >
          Wrap Eth
        </button>
      </div>
    );
  };

  const setMaximum = () => {}; // TODO

  if (!currentSynth || !currentCollateral) return null;
  return (
    <div>
      {/*
      <ApproveButton />
      /*<input type="number" name="tokens" value={tokenAmount} onChange={(e) => handleCollateralAmount(e)} />
      <div>
        <input {...number('tokenAmount')} required />
        <input {...number('collateralAmount')} required />
        <button
          onClick={(e) => {
            e.preventDefault();
            actions.onMint();
          }}
        >
          Mint
        </button>
      </div>
      <WrapEthButton />
      */}

      <div className="padding-8 portrait-padding-4 w-form">
        <form
          id="email-form"
          name="email-form"
          className="max-width-small margin-auto flex-column padding-4 radius-xl background-color-2 box-shadow-large max-width-medium"
        >
          <h5 className="margin-0">How much uSYNTH would you like to mint?</h5>
          <div className="margin-y-4">
            <button onClick={() => setMaximum()} className="button-secondary button-tiny w-button">
              Mint Maximum
            </button>
            <div className="flex-row">
              <div className="width-full margin-bottom-4">
                <div className="relative">
                  <input
                    type="text"
                    className="form-input height-24 text-large bottom-sharp margin-bottom-0 border-bottom-none w-input"
                    maxLength={256}
                    name="field-4"
                    data-name="Field 4"
                    placeholder="00.00"
                    id="field-4"
                    required
                  />
                  <div className="border-bottom-1px"></div>
                  <div className="margin-0 absolute-bottom-right padding-right-3 padding-bottom-4 w-dropdown">
                    <div className="padding-0 flex-align-center w-dropdown-toggle">
                      <Icon name="ChevronDown" className="icon medium opacity-100 margin-right-1" />
                      <a href="#">{currentSynth.metadata.collateral}</a>
                    </div>
                    {/* TODO make dropdown? */}
                    <nav className="dropdown-list radius-large box-shadow-medium w-dropdown-list">
                      <a href="#" className="dropdown-link w-dropdown-link">
                        WETH
                      </a>
                      <a href="#" className="dropdown-link w-dropdown-link">
                        ETH
                      </a>
                    </nav>
                  </div>
                  <div className="flex-align-baseline flex-space-between absolute-top padding-x-3 padding-top-3">
                    <label className="opacity-60 weight-medium">Deposit Collateral</label>
                    <a href="#" className="button-secondary button-tiny white w-button">
                      Max {utils.formatEther(maxCollateral.toString())}
                    </a>
                  </div>
                </div>
                <div className="width-8 height-8 margin-auto flex-align-center flex-justify-center radius-full background-color-white inverse-margin">
                  <Icon name="ArrowDown" className="icon opacity-100 text-color-1" />
                </div>
                <div className="relative">
                  <input
                    type="text"
                    className="form-input height-24 text-large top-sharp border-top-none margin-0 w-input"
                    maxLength={256}
                    name="field-2"
                    data-name="Field 2"
                    placeholder="00.00"
                    id="field-2"
                    required
                  />
                  <div data-hover="" data-delay="0" className="margin-0 absolute-bottom-right padding-right-3 padding-bottom-4 w-dropdown">
                    {/* TODO i think this div and dropdown are unnecessary */}
                    <div className="padding-0 flex-align-center w-dropdown-toggle">
                      <a href="#">{currentSynth.metadata.name}</a>
                    </div>
                  </div>
                  <div className="flex-align-baseline flex-space-between absolute-top padding-x-3 padding-top-3">
                    <label className="opacity-60 weight-medium">Mint</label>
                  </div>
                </div>
                <div className="text-xs opacity-50 margin-top-1">Mint a minimum of 5 uSYNTH</div>
              </div>
            </div>
            <div className="margin-bottom-4">
              <div className="flex-space-between portrait-flex-column">
                <div className="margin-bottom-1">
                  <strong className="text-color-4">30%</strong> Utilisation after minting
                </div>
                <div className="margin-bottom-1 text-small opacity-60">
                  <strong className="text-color-4">(3.5 CR)</strong>
                </div>
              </div>
              <div className="gauge horizontal large overflow-hidden margin-bottom-2">
                <div className="collateral large"></div>
                <div className="debt horizontal">
                  <div className="gradient horizontal large"></div>
                </div>
                <div className="gcr horizontal"></div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
