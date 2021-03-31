import React, { useState, useContext, useEffect } from 'react';
import useAsyncEffect from 'use-async-effect';
import { useFormState } from 'react-use-form-state';
import { BigNumber, utils } from 'ethers';

import { useSynthActions, useToken } from '@/hooks';
import { UserContext, EthereumContext } from '@/contexts';
import { Icon, ActionCard, UtilizationGauge } from '@/components';
import { isEmpty } from '@/utils';

interface MinterFormFields {
  tokenAmount: number;
  collateralAmount: number;
}

export const Minter: React.FC = () => {
  const { account } = useContext(EthereumContext);
  const { currentSynth, currentCollateral } = useContext(UserContext);
  // TODO get max # of collateral available, user's balances
  const actions = useSynthActions(); // TODO pass this in
  const erc20 = useToken();

  const [maxCollateral, setMaxCollateral] = useState<BigNumber>(BigNumber.from(0));
  const [isApproved, setIsApproved] = useState(false);
  const [invalidTokens, setInvalidTokens] = useState(false);
  const [invalidCollateral, setInvalidCollateral] = useState(false);

  useEffect(() => {
    (async () => {
      if (currentCollateral && !isEmpty(currentCollateral) && account) {
        setMaxCollateral(await erc20.getBalance(currentCollateral.address));
        setIsApproved(await actions.getEmpAllowance());
      }
    })();
  }, [currentSynth, currentCollateral, account]);

  const [formState, { number }] = useFormState<MinterFormFields>(
    {
      tokenAmount: 0,
      collateralAmount: 0,
    },
    {
      onChange: (e, stateValues, nextStateValues) => {
        const { collateralAmount, tokenAmount } = nextStateValues;
        const tokens = Number(tokenAmount);
        const collateral = Number(collateralAmount);

        // TODO add red line around inputs
        setInvalidTokens(tokens == 0);
        setInvalidCollateral(collateral == 0);
        if (invalidTokens || invalidCollateral) return;

        actions.setCollateralAmount(collateral);
        actions.setTokenAmount(tokens);
      },
    }
  );

  const ApproveButton: React.FC = () => {
    return (
      <button
        onClick={async (e) => {
          e.preventDefault();
          await actions.onApprove();
          setIsApproved(true); // TODO check for approval first
        }}
        className="button w-button"
      >
        Approve
      </button>
    );
  };

  const MintButton: React.FC = () => {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          actions.onMint();
        }}
        className="button w-button"
      >
        {`Mint ${formState.values.tokenAmount} ${currentSynth?.metadata.name} for ${formState.values.collateralAmount} ${currentSynth?.metadata.collateral}`}
      </button>
    );
  };

  const WrapEthButton: React.FC = () => {
    const [ethAmount, setEthAmount] = useState(0);

    return (
      <div>
        <input
          type="number"
          className="form-input border-bottom-none w-input"
          value={ethAmount}
          onChange={(e) => {
            e.preventDefault();
            setEthAmount(Number(e.target.value));
          }}
        />
        <button
          className="button w-button"
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

  const setMaximum = (e: React.MouseEvent) => {
    e.preventDefault();
    formState.setField('collateralAmount', Number(utils.formatEther(maxCollateral)));
  };

  // TODO Need to check if currentSynth is empty object
  if (!currentSynth || !currentCollateral) return null;
  return (
    <>
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
      */}
      <WrapEthButton />

      <div className="padding-8 portrait-padding-4 w-form">
        <ActionCard>
          <h5 className="margin-0">How much {currentSynth.metadata.name} would you like to mint?</h5>
          <div className="margin-y-4">
            <button onClick={(e) => setMaximum(e)} className="button-secondary button-tiny w-button">
              Mint Maximum
            </button>
          </div>
          <div className="flex-row">
            <div className="width-full margin-bottom-4">
              <div className="relative">
                <input
                  {...number('collateralAmount')}
                  type="number"
                  className="form-input height-24 text-large bottom-sharp margin-bottom-0 border-bottom-none w-input"
                  maxLength={256}
                  placeholder="0"
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
                  <button onClick={(e) => setMaximum(e)} className="button-secondary button-tiny white w-button">
                    Max {utils.formatEther(maxCollateral.toString())}
                  </button>
                </div>
              </div>
              <div className="width-8 height-8 margin-auto flex-align-center flex-justify-center radius-full background-color-white inverse-margin">
                <Icon name="ArrowDown" className="icon opacity-100 text-color-1" />
              </div>
              <div className="relative">
                <input
                  {...number('tokenAmount')}
                  type="number"
                  className="form-input height-24 text-large top-sharp border-top-none margin-0 w-input"
                  maxLength={256}
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
              <div className="text-xs opacity-50 margin-top-1">Mint a minimum of 5 {currentSynth.metadata.name}</div>
            </div>
          </div>
          <UtilizationGauge />
          {isApproved ? <MintButton /> : <ApproveButton />}
          <div className="text-xs opacity-50 margin-top-2">
            There will be 2 transactions. <br />
            First to approve your WETH, second to mint.
          </div>
        </ActionCard>
      </div>
    </>
  );
};
