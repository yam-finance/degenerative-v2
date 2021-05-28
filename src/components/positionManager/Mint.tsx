import React, { useContext, useState } from 'react';
import { useFormState } from 'react-use-form-state';

import { Icon, ActionDisplay, ActionButton } from '@/components';
import { PositionManagerContainer, useSynthActions } from '@/hooks';
import { UserContext } from '@/contexts';
import { roundDecimals } from '@/utils';

interface MintFormFields {
  collateralToAdd: number;
  tokensToAdd: number;
}

export const Mint: React.FC = React.memo(() => {
  const { state, dispatch } = PositionManagerContainer.useContainer();
  const { currentSynth, currentCollateral } = useContext(UserContext);

  const [adjustToGcr, setAdjustToGcr] = useState(false);
  const actions = useSynthActions();

  const [formState, { number }] = useFormState<MintFormFields>(
    {
      collateralToAdd: state.sponsorCollateral,
      tokensToAdd: state.sponsorTokens,
    },
    {
      onChange: (e, stateValues, nextStateValues) => {
        const { collateralToAdd: oldCollateral, tokensToAdd: oldTokens } = stateValues; // Old form state
        const { collateralToAdd, tokensToAdd } = nextStateValues; // New form state

        // Figure out which input changed. If adjustToGcr is true, set other field to GCR.
        let collateral: number;
        let tokens: number;

        if (oldCollateral !== collateralToAdd) {
          collateral = roundDecimals(Number(collateralToAdd), 4);
          tokens = adjustToGcr
            ? getTokensAtGcr(collateral + state.sponsorCollateral) - state.sponsorTokens
            : roundDecimals(Number(tokensToAdd), 4);
        } else {
          tokens = roundDecimals(Number(tokensToAdd), 4);
          collateral = adjustToGcr
            ? getCollateralAtGcr(tokens + state.sponsorTokens) - state.sponsorCollateral
            : roundDecimals(Number(collateralToAdd), 4);
        }

        setFormInputs(collateral, tokens);
      },
    }
  );

  const setFormInputs = (collateral: number, tokens: number) => {
    formState.setField('collateralToAdd', collateral);
    formState.setField('tokensToAdd', tokens);

    dispatch({
      type: 'UPDATE_PENDING_POSITION',
      payload: {
        pendingCollateral: collateral + state.sponsorCollateral,
        pendingTokens: tokens + state.sponsorTokens,
      },
    });
  };

  const getTokensAtGcr = (collateral: number) =>
    roundDecimals(collateral * (state.globalUtilization / state.tokenPrice), 2);

  const getCollateralAtGcr = (tokens: number) =>
    roundDecimals((tokens * state.tokenPrice) / state.globalUtilization, 2);

  const setMaximum = (e: React.MouseEvent) => {
    e.preventDefault();
    const newCollateral = state.maxCollateral;

    // Must divide by price because global utilization is scaled by price
    const newTokens = adjustToGcr ? getTokensAtGcr(newCollateral) : Number(formState.values.tokensToAdd);

    // Update form and then component state to match form
    setFormInputs(newCollateral, roundDecimals(newTokens, 2));
  };

  // Uses current pending collateral to set synth field
  const toggleAdjustToGcr = () => {
    setAdjustToGcr(!adjustToGcr);
    setFormInputs(
      state.pendingCollateral - state.sponsorCollateral,
      getTokensAtGcr(state.pendingCollateral) - state.sponsorTokens
    );
  };

  const CollateralApproveButton: React.FC = () => {
    return <ActionButton action={() => actions.onApproveCollateral()}>Approve {currentCollateral}</ActionButton>;
  };

  const MintButton: React.FC = () => {
    const newCollateral = Number(formState.values.collateralToAdd);
    const newTokens = Number(formState.values.tokensToAdd);

    const disableMinting =
      newTokens < 0 ||
      newCollateral < 0 ||
      state.resultingUtilization > state.globalUtilization ||
      state.resultingUtilization > state.liquidationPoint;

    return (
      <ActionButton action={() => actions.onMint(newCollateral, newTokens)} disableCondition={disableMinting}>
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
                {...number('tokensToAdd')}
                onClick={(e) => e.currentTarget.select()}
                type="number"
                className="form-input height-24 text-large top-sharp border-top-none margin-0 w-input"
                maxLength={256}
                min={0}
                placeholder="0"
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
      </div>
    </ActionDisplay>
  );
});
