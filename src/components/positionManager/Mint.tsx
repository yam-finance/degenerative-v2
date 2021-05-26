import React, { useContext, useState } from 'react';
import { useFormState } from 'react-use-form-state';

import { Icon, ActionDisplay, ActionButton } from '@/components';
import { PositionManagerContainer, useSynthActions } from '@/hooks';
import { UserContext } from '@/contexts';
import { roundDecimals } from '@/utils';
import { utils } from 'ethers';

interface MintFormFields {
  pendingCollateral: number;
  pendingTokens: number;
}

export const Mint: React.FC = () => {
  const { state, dispatch } = PositionManagerContainer.useContainer();
  const { currentSynth, currentCollateral } = useContext(UserContext);

  const [adjustToGcr, setAdjustToGcr] = useState(false);
  const actions = useSynthActions();

  const [formState, { number }] = useFormState<MintFormFields>(
    {
      pendingCollateral: state.sponsorCollateral,
      pendingTokens: state.sponsorTokens,
    },
    {
      onChange: (e, stateValues, nextStateValues) => {
        const { pendingCollateral, pendingTokens } = nextStateValues;
        const tokens = roundDecimals(Number(pendingTokens), 4);
        const collateral = roundDecimals(Number(pendingCollateral), 4);

        dispatch({
          type: 'UPDATE_PENDING_POSITION',
          payload: {
            pendingCollateral: collateral,
            pendingTokens: tokens,
          },
        });
      },
    }
  );

  const setFormInputs = (collateral: number, tokens: number) => {
    formState.setField('pendingCollateral', collateral);
    formState.setField('pendingTokens', tokens);

    dispatch({
      type: 'UPDATE_PENDING_POSITION',
      payload: {
        pendingCollateral: collateral,
        pendingTokens: tokens,
      },
    });
  };

  const getTokensAtGcr = (collateral: number) =>
    roundDecimals(collateral * (state.globalUtilization / state.tokenPrice), 2);
  const getCollateralAtGcr = (tokens: number) =>
    roundDecimals((tokens * state.tokenPrice) / state.globalUtilization, 2);

  const setMaximum = (e: React.MouseEvent) => {
    e.preventDefault();

    const newCollateral = state.maxCollateral + state.sponsorCollateral;
    // Must divide by price because global utilization is scaled by price
    const newTokens = adjustToGcr
      ? newCollateral * (state.globalUtilization / state.tokenPrice)
      : Number(formState.values.pendingTokens);

    setFormInputs(newCollateral, roundDecimals(newTokens, 2));
  };

  // Uses current pending collateral to set synth field
  const toggleAdjustToGcr = () => {
    setAdjustToGcr(!adjustToGcr);
    setFormInputs(state.pendingCollateral, getTokensAtGcr(state.pendingCollateral));
  };

  const CollateralApproveButton: React.FC = () => null;

  const MintButton: React.FC = () => {
    const newTokens = state.pendingTokens - state.sponsorTokens;
    const newCollateral = state.pendingCollateral - state.sponsorCollateral;

    const disableMinting =
      newTokens <= 0 ||
      newCollateral < 0 ||
      state.pendingUtilization > state.globalUtilization ||
      state.pendingUtilization > state.liquidationPoint;

    return (
      <ActionButton action={actions.onMint(newCollateral, newTokens)} disableCondition={disableMinting}>
        {`Mint ${newTokens} ${currentSynth} for ${newCollateral} ${currentCollateral}`}
      </ActionButton>
    );
  };

  return (
    <ActionDisplay>
      <h3 className="margin-0 text-align-center">Mint {currentSynth}</h3>
      <p className="text-align-center margin-top-2 landscape-margin-bottom-20">
        Deposit <strong className="text-color-4">{currentCollateral}</strong> at or above{' '}
        <span className="weight-bold text-color-4">{state.globalUtilization * 100}%</span> utilization to mint{' '}
        <strong className="text-color-4">{currentSynth}</strong>
      </p>
      <img src={state.image} loading="lazy" alt="" className="width-32 height-32 margin-bottom-8" />

      <div className="expand width-full flex-column-end">
        <div className="flex-row">
          <div className="width-full margin-bottom-4">
            <div className="relative">
              <input
                {...number('pendingCollateral')}
                onClick={(e) => e.currentTarget.select()}
                onInput={(e) => {
                  if (adjustToGcr) {
                    const collateral = Number(e.currentTarget.value);
                    setFormInputs(collateral, getTokensAtGcr(collateral));
                  }
                }}
                type="number"
                className="form-input height-24 text-large bottom-sharp margin-bottom-0 border-bottom-none w-input"
                maxLength={256}
                min={0}
                required
              />
              <div className="border-bottom-1px"></div>
              <div className="margin-0 absolute-bottom-right padding-right-3 padding-bottom-4 w-dropdown">
                <div className="padding-0 flex-align-center w-dropdown-toggle">
                  <p className="margin-0 text-color-4">{currentCollateral}</p>
                </div>
              </div>
              <div className="flex-align-baseline flex-space-between absolute-top padding-x-3 padding-top-3">
                <label className="opacity-60 weight-medium">Collateral</label>
                <button onClick={(e) => setMaximum(e)} className="button-secondary button-tiny w-button">
                  Max {state.maxCollateral}
                </button>
              </div>
            </div>
            <div className="width-8 height-8 margin-auto flex-align-center flex-justify-center radius-full background-color-white inverse-margin">
              <Icon name="ArrowDown" className="icon opacity-100 text-color-1" />
            </div>
            <div className="relative">
              <input
                {...number('pendingTokens')}
                onClick={(e) => e.currentTarget.select()}
                onInput={(e) => {
                  if (adjustToGcr) {
                    const tokens = Number(e.currentTarget.value);
                    setFormInputs(getCollateralAtGcr(tokens), tokens);
                  }
                }}
                type="number"
                className="form-input height-24 text-large top-sharp border-top-none margin-0 w-input"
                maxLength={256}
                min={0}
                required
              />
              <div className="margin-0 absolute-bottom-right padding-right-3 padding-bottom-4 w-dropdown">
                <div className="padding-0 flex-align-center">
                  <p className="margin-0 text-color-4">{currentSynth}</p>
                </div>
              </div>
              <div className="flex-align-baseline flex-space-between absolute-top padding-x-3 padding-top-3">
                <label className="opacity-60 weight-medium">Synth</label>
                <button className="button-secondary button-tiny flex-align-center" onClick={(e) => toggleAdjustToGcr()}>
                  <span className="margin-right-1">Adjust To GCR</span>
                  <input type="checkbox" checked={adjustToGcr} onChange={() => toggleAdjustToGcr()} />
                </button>
              </div>
            </div>
            <div className="text-xs opacity-50 margin-top-1">Mint a minimum of 5 {currentSynth}</div>
          </div>
        </div>

        <MintButton />
      </div>
    </ActionDisplay>
  );
};

export const MemoizedMint = React.memo(Mint);
