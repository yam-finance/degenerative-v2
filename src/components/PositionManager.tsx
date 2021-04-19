import React, { useReducer, useEffect, useContext } from 'react';
import { useFormState } from 'react-use-form-state';
import { BigNumber, utils } from 'ethers';

import { Icon } from '@/components';
import { UserContext, EthereumContext, MarketContext } from '@/contexts';
import { useToken } from '@/hooks';
import { CollateralMap, roundDecimals } from '@/utils';
import clsx from 'clsx';

/* The component's state is the actual sponsor position. The form is the pending position. */

const initialMinterState = {
  mode: 'mint',
  sponsorCollateral: 0,
  sponsorTokens: 0,
  utilization: 0,
  globalUtilization: 0,
  liquidationPoint: 0,
  minTokens: 0,
  maxCollateral: 0, // TODO replace with synthInWallet item
};

type State = typeof initialMinterState;
type Action = 'INIT_SPONSOR_POSITION' | 'UPDATE_SPONSOR_POSITION' | 'SET_MAX_COLLATERAL';

const Reducer = (state: State, action: { type: Action; payload: any }) => {
  switch (action.type) {
    case 'INIT_SPONSOR_POSITION': {
      const initialized = action.payload;
      console.log(initialized);
      return {
        ...state,
        sponsorCollateral: initialized.sponsorCollateral,
        sponsorTokens: initialized.sponsorTokens,
        utilization: initialized.utilization,
        globalUtilization: initialized.globalUtilization,
        liquidationPoint: initialized.liquidation,
        minTokens: initialized.minTokens,
        maxCollateral: initialized.maxCollateral,
      };
    }
    case 'UPDATE_SPONSOR_POSITION': {
      const { pendingCollateral, pendingTokens } = action.payload;
      return {
        ...state,
        sponsorCollateral: pendingCollateral,
        sponsorTokens: pendingTokens,
        utilization: pendingTokens / pendingCollateral,
      };
    }
    case 'SET_MAX_COLLATERAL': {
      return {
        ...state,
        maxCollateral: action.payload,
      };
    }
    default:
      throw new Error('Invalid state change');
  }
};

interface MinterFormFields {
  pendingCollateral: number;
  pendingTokens: number;
  pendingUtilization: number;
}

export const PositionManager = () => {
  const { account } = useContext(EthereumContext);
  const { currentSynth, currentCollateral, synthsInWallet, mintedPositions } = useContext(UserContext);
  const { synthMarketData } = useContext(MarketContext);

  const [state, dispatch] = useReducer(Reducer, initialMinterState);
  const erc20 = useToken(); // TODO remove after getting from synthsInWallet

  useEffect(() => {
    const initMinterState = async () => {
      let collateralBalance = BigNumber.from(0);
      try {
        // TODO grab from synthsInWallet
        collateralBalance = (await erc20.getBalance(CollateralMap[currentCollateral].address)) ?? BigNumber.from(1);
      } catch (err) {
        console.log(err);
      }
      const empInfo = synthMarketData[currentSynth];
      // TODO change mintedPositions to a record
      const sponsorPosition = mintedPositions.find((position) => position.name == currentSynth);
      const synthInWallet = synthsInWallet.find((balance) => balance.name == currentSynth);

      const cr = Number(sponsorPosition?.collateralRatio) ?? 0; // TODO replace with utilization

      dispatch({
        type: 'INIT_SPONSOR_POSITION',
        payload: {
          sponsorCollateral: Number(sponsorPosition?.collateralAmount ?? 0),
          sponsorTokens: Number(sponsorPosition?.tokenAmount ?? 0),
          utilization: cr > 0 ? 1 / cr : 0, // TODO change to utilization
          globalUtilization: roundDecimals(empInfo.globalUtilization, 4),
          liquidationPoint: empInfo.liquidationPoint,
          minTokens: empInfo.minTokens,
          maxCollateral: Number(utils.formatEther(collateralBalance)),
        },
      });
    };

    if (currentCollateral && account && synthMarketData[currentSynth] && synthsInWallet) {
      initMinterState();
    }
  }, [currentSynth, currentCollateral, synthMarketData, account]);

  const [formState, { number }] = useFormState<MinterFormFields>(
    {
      pendingTokens: 0,
      pendingCollateral: 0,
      pendingUtilization: 0,
    },
    {
      onChange: (e, stateValues, nextStateValues) => {
        const { pendingCollateral, pendingTokens } = nextStateValues;
        const tokens = Number(pendingTokens);
        const collateral = Number(pendingCollateral);

        formState.setField('pendingUtilization', collateral / tokens);

        // TODO add red line around inputs
        //actions.setCollateralAmount(collateral);
        //actions.setTokenAmount(tokens);

        /*
        dispatch({
          type: 'UPDATE_SPONSOR_POSITION',
          payload: {
            sponsorTokens: tokens,
            sponsorCollateral: collateral,
          },
        });
        */
      },
    }
  );

  const setMaximum = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log(state.maxCollateral);
    formState.setField('pendingCollateral', state.maxCollateral);
    formState.setField('pendingTokens', state.maxCollateral * state.globalUtilization);
  };

  const CollateralWindow: React.FC<{ name: string }> = ({ name, children }) => {
    return (
      <div className="background-color-5 padding-2 radius-large z-10 width-32 collat">
        <h6 className="text-align-center margin-bottom-0">Collateral</h6>
        <div className="width-full flex-justify-center margin-top-1 w-dropdown">
          <div className="padding-0 flex-align-center">
            <a className="weight-bold">{name}</a>
          </div>
        </div>
        {children}
        <div className="nub background-color-5"></div>
      </div>
    );
  };

  const TokenWindow: React.FC<{ name: string }> = ({ name }) => {
    return (
      <div className="background-color-debt padding-2 radius-large z-10 width-32 debts disabled">
        <h6 className="text-align-center margin-bottom-0">Debt</h6>
        <h5 className="text-align-center margin-bottom-1 margin-top-1 text-small">0 {name}</h5>
        <div className="height-9 flex-align-end">
          <a href="#" className="button-secondary button-tiny white width-full w-button">
            Edit
          </a>
        </div>
        <div className="nub background-color-debt left"></div>
      </div>
    );
  };

  interface GaugeLabelProps {
    label: string;
    tooltip: string;
    className: string;
    emphasized?: boolean;
  }
  const GaugeLabel: React.FC<GaugeLabelProps> = ({ label, tooltip, className, emphasized }) => {
    return (
      <div className={className}>
        <div className="margin-0 w-dropdown">
          <div className="padding-0 width-4 height-4 flex-align-center flex-justify-center w-dropdown-toggle">
            <Icon name="Info" className="icon medium" />
          </div>
          <nav className="dropdown-list radius-large box-shadow-medium w-dropdown-list">
            <div className="width-32 text-xs">{tooltip}</div>
          </nav>
        </div>
        <div className={`margin-left-1 text-xs ${emphasized && 'text-color-4'}`}>{label}</div>
      </div>
    );
  };

  return (
    <div className="flex-align-center flex-justify-center margin-top-8 landscape-flex-column-centered">
      <div className="margin-0 w-form">
        <form className="max-width-small flex-column background-color-2 padding-8 radius-xl box-shadow-large z-10 padding-y-12 landscape-padding-2">
          <h3 className="margin-0 text-align-center">Mint {currentSynth}</h3>
          <p className="text-align-center margin-top-2 margin-bottom-20 landscape-margin-bottom-20">Tweak your position settings</p>
          <div className="flex-row">
            <div className="expand relative padding-right-2">
              <GaugeLabel label="GCR" tooltip="TODO" className="gcr-legend" />
              <GaugeLabel label="Liquidation" tooltip="TODO" className="liquidation-legend" emphasized />
              <CollateralWindow name={currentCollateral}>
                <input
                  {...number('pendingCollateral')}
                  type="number"
                  className="form-input small margin-bottom-1 w-input"
                  maxLength={256}
                  placeholder="0"
                  required
                />
                <button onClick={(e) => setMaximum(e)} className="button-secondary button-tiny white width-full w-button">
                  Max {state.maxCollateral.toFixed(2)}
                </button>
              </CollateralWindow>
            </div>
            <div className="gauge">
              <div className="collateral large empty"></div>
              <div className="debt _0">
                <div className="gradient"></div>
              </div>
              <div className="liquidation-point"></div>
              <div className="gcr"></div>
            </div>
            <div className="expand padding-left-2">
              <TokenWindow name={currentSynth} />
            </div>
          </div>
        </form>
      </div>
      <div className="background-color-light radius-left-xl margin-y-8 width-full max-width-xs box-shadow-large sheen flex-column landscape-margin-top-0 landscape-radius-top-0">
        <div className="flex-justify-end padding-2 landscape-padding-top-4">
          <div data-hover="1" data-delay="0" className="margin-0 w-dropdown">
            <div className="padding-0 w-dropdown-toggle">
              <Icon name="Info" className="icon opacity-100" />
            </div>
            <nav className="dropdown-list radius-large box-shadow-medium w-dropdown-list">
              <a href="#" className="text-small break-no-wrap">
                Advanced features
              </a>
              <p className="text-xs opacity-50 margin-0">Coming soon</p>
            </nav>
          </div>
        </div>
        <div className="padding-8 padding-top-0 flex-column expand">
          <div>
            <h6 className="margin-bottom-0">Actions</h6>
            <div className="divider margin-y-2"></div>
            {/* TODO Mode selector, select mode in state */}
            <div className="flex-row flex-wrap">
              <a href="#" className="button-secondary button-tiny glass margin-1 w-button">
                Mint Synth
              </a>
            </div>
          </div>
          <div className="margin-top-8">
            <h6 className="margin-bottom-0">Your wallet</h6>
            <div className="divider margin-y-2"></div>
            <div className="text-small">
              <div className="flex-align-baseline margin-bottom-2">
                <div className="expand flex-align-center">
                  <div>{currentCollateral}</div>
                </div>
                <div className="weight-medium text-color-4">{state.maxCollateral}</div>
              </div>
              <div className="flex-align-baseline margin-bottom-2">
                <div className="expand flex-align-center">
                  <div>{currentSynth}</div>
                </div>
                <div className="weight-medium text-color-4">{state.sponsorTokens}0</div>
              </div>
            </div>
          </div>
          <div className="margin-top-8">
            <h6 className="margin-bottom-0">TX Details</h6>
            <div className="divider margin-y-2"></div>
            <p className="text-xs">
              No collateral deposited yet.
              <br />
              {`Must mint a minimum of ${state.minTokens} ${currentSynth}.`}
              <br />
            </p>
          </div>
          <div className="expand flex-align-end">
            <a href="#" className={`button width-full text-small w-button ${Number(formState.values.pendingTokens) > 0 ? '' : 'disabled'}`}>
              {`Mint ${formState.values.pendingTokens} ${currentSynth} for ${formState.values.pendingCollateral} ${currentCollateral}`}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
