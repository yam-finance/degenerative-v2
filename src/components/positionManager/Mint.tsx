import React, { useContext, useEffect, useState } from 'react';
import { useFormState } from 'react-use-form-state';

import { Icon, ActionDisplay, ActionButton, BackButton } from '@/components';
import { PositionManagerContainer } from '@/hooks';
import { UserContext } from '@/contexts';
import { roundDecimals } from '@/utils';

interface MintFormFields {
  collateralToAdd: number;
  tokensToAdd: number;
}

export const Mint: React.FC = React.memo(() => {
  const { actions, state, dispatch } = PositionManagerContainer.useContainer();
  const { currentSynth, currentCollateral } = useContext(UserContext);

  const [adjustToGcr, setAdjustToGcr] = useState(!state.sponsorCollateral);

  const [formState, { number }] = useFormState<MintFormFields>(
    {
      collateralToAdd: 0,
      tokensToAdd: 0,
    },
    {
      onChange: (e, stateValues, nextStateValues) => {
        const { collateralToAdd, tokensToAdd } = nextStateValues;

        const resultingCollateral = Number(collateralToAdd) + state.sponsorCollateral;
        const newTokens = adjustToGcr ? getTokensAtGcr(resultingCollateral) - state.sponsorTokens : Number(tokensToAdd);

        setFormInputs(Number(collateralToAdd), newTokens);
      },
    }
  );

  useEffect(() => {
    formState.reset();
  }, [state.utilization]);

  const setFormInputs = (collateral: number, tokens: number) => {
    const collateralAmount = collateral > 0 ? collateral : 0;
    const tokenAmount = tokens > 0 ? tokens : 0;

    formState.setField('collateralToAdd', collateralAmount);
    formState.setField('tokensToAdd', tokenAmount);

    dispatch({
      type: 'UPDATE_RESULTING_POSITION',
      payload: {
        resultingCollateral: collateralAmount + state.sponsorCollateral,
        resultingTokens: tokenAmount + state.sponsorTokens,
      },
    });
  };

  const getCollateralAtGcr = (tokens: number) => tokens / state.globalUtilization;

  const getTokensAtGcr = (collateral: number) => {
    const tokens = collateral * state.globalUtilization;
    // Adjusting to GCR fails in smart contract due to math differences between JS and Solidity.
    // Account for this here.
    const difference = tokens * 0.0001;

    return roundDecimals(tokens - difference, 6);
  };

  const setMaximum = () => {
    const newTokens = adjustToGcr ? getTokensAtGcr(state.maxCollateral) : Number(formState.values.tokensToAdd);
    setFormInputs(state.maxCollateral, newTokens);
  };

  // Sets 'synth' field by calculating resulting tokens, then subtracting existing sponsor tokens
  const toggleAdjustToGcr = () => {
    const shouldAdjust = !adjustToGcr === true;

    if (shouldAdjust) {
      const newCollateral = Number(formState.values.collateralToAdd);
      const resultingTokensAtGcr = getTokensAtGcr(state.resultingCollateral);
      const newTokens = roundDecimals(resultingTokensAtGcr - state.sponsorTokens, 3);

      setFormInputs(newCollateral, newTokens > 0 ? newTokens : 0);
    }

    // Must call setter last because setState does not update immediately
    setAdjustToGcr(!adjustToGcr);
  };

  const CollateralApproveButton: React.FC = () => {
    return <ActionButton action={() => actions.onApproveCollateral()}>Approve {currentCollateral}</ActionButton>;
  };

  const MintButton: React.FC = () => {
    const newCollateral = Number(formState.values.collateralToAdd);
    const newTokens = Number(formState.values.tokensToAdd);
    const positionExists = state.sponsorCollateral > 0;

    const isPositionInvalid = !positionExists && state.resultingUtilization > state.globalUtilization;

    const disableMinting =
      newTokens <= 0 || newCollateral <= 0 || isPositionInvalid || state.resultingUtilization > state.liquidationPoint;

    return (
      <ActionButton action={() => actions.onMint(newCollateral, newTokens)} disableCondition={disableMinting}>
        {`Mint ${newTokens} ${currentSynth} with ${newCollateral} ${currentCollateral}`}
      </ActionButton>
    );
  };

  return (
    <ActionDisplay>
      <h3 className="margin-0 text-align-center">Mint</h3>
      <p className="text-align-center margin-top-2 landscape-margin-bottom-20">
        Deposit <strong className="text-color-4">{currentCollateral}</strong> at or above{' '}
        <span className="weight-bold text-color-4">
          {roundDecimals(1 / (state.globalUtilization * state.tokenPrice), 3)}
        </span>{' '}
        collateral ratio to mint <strong className="text-color-4">{currentSynth}</strong>
      </p>
      <img src={state.image} loading="lazy" alt="" className="width-32 height-32 margin-bottom-8" />

      <div className="expand width-full flex-column-end">
        <div className="flex-row">
          <div className="width-full margin-bottom-4">
            <div className="relative">
              <input
                {...number('collateralToAdd')}
                onClick={(e) => e.currentTarget.select()}
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
                <button onClick={() => setMaximum()} className="button-secondary button-tiny w-button">
                  Max {state.maxCollateral}
                </button>
              </div>
            </div>
            <div className="width-8 height-8 margin-auto flex-align-center flex-justify-center radius-full background-color-white inverse-margin">
              <Icon name="ArrowDown" className="icon opacity-100 text-color-1" />
            </div>
            <div className="relative">
              <input
                {...number('tokensToAdd')}
                onClick={(e) => e.currentTarget.select()}
                type="number"
                className="form-input height-24 text-large top-sharp border-top-none margin-0 w-input"
                maxLength={256}
                min={0}
                disabled={adjustToGcr}
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
            <div className="text-xs opacity-50 margin-top-1">
              Mint a minimum of {state.minTokens} {currentSynth}
            </div>
          </div>
        </div>

        {!actions.collateralApproval ? <CollateralApproveButton /> : <MintButton />}
        <BackButton />
      </div>
    </ActionDisplay>
  );
});
