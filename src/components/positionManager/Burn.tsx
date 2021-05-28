import React, { useContext, useState } from 'react';
import { useFormState } from 'react-use-form-state';

import { Icon, ActionDisplay, ActionButton, BackButton } from '@/components';
import { PositionManagerContainer, useSynthActions } from '@/hooks';
import { UserContext } from '@/contexts';
import { roundDecimals } from '@/utils';

interface BurnFormFields {
  tokensToBurn: number;
}

export const Burn: React.FC = React.memo(() => {
  const { state, dispatch } = PositionManagerContainer.useContainer();
  const { currentSynth, currentCollateral } = useContext(UserContext);

  const actions = useSynthActions();

  const [formState, { number }] = useFormState<BurnFormFields>(
    {
      tokensToBurn: state.sponsorTokens,
    },
    {
      onChange: (e, stateValues, nextStateValues) => {
        const { tokensToBurn } = nextStateValues;

        //setFormInputs(collateral, tokens);
        dispatch({
          type: 'UPDATE_PENDING_POSITION',
          payload: {
            pendingCollateral: state.sponsorCollateral,
            pendingTokens: state.sponsorTokens - Number(tokensToBurn),
          },
        });
      },
    }
  );

  const setFormInputs = (collateral: number, tokens: number) => {
    formState.setField('tokensToBurn', tokens);

    dispatch({
      type: 'UPDATE_PENDING_POSITION',
      payload: {
        pendingCollateral: collateral,
        pendingTokens: tokens,
      },
    });
  };

  const setMaximum = (e: React.MouseEvent) => {
    e.preventDefault();

    // TODO Burn max allowable tokens

    // Update form and then component state to match form
    //setFormInputs(newCollateral, roundDecimals(newTokens, 2));
  };

  const SynthApproveButton: React.FC = () => {
    return <ActionButton action={() => actions.onApproveSynth()}>Approve {currentSynth}</ActionButton>;
  };

  const BurnButton: React.FC = () => {
    const burnTokens = Number(formState.values.tokensToBurn);

    const disableBurn = burnTokens <= 0 || burnTokens >= state.sponsorTokens;

    return (
      <ActionButton action={() => actions.onRepay(burnTokens)} disableCondition={disableBurn}>
        {`Burn ${burnTokens} ${currentSynth}`}
      </ActionButton>
    );
  };

  return (
    <ActionDisplay>
      <h3 className="margin-0 text-align-center">Burn</h3>
      <p className="text-align-center margin-top-2 landscape-margin-bottom-20">
        Burn <strong className="text-color-4">{currentSynth}</strong> to receive{' '}
        <strong className="text-color-4">{currentCollateral}</strong>
      </p>
      <img src={state.image} loading="lazy" alt="" className="width-32 height-32 margin-bottom-8" />

      <div className="expand width-full flex-column-end">
        <div className="flex-row">
          <div className="width-full margin-bottom-4">
            <div className="relative">
              <input
                {...number('tokensToBurn')}
                onClick={(e) => e.currentTarget.select()}
                type="number"
                className="form-input height-24 text-large margin-0 w-input"
                maxLength={256}
                min={0}
                required
              />
              <div className="margin-0 absolute-bottom-right padding-right-3 padding-bottom-4">
                <div className="padding-0 flex-align-center">
                  <p className="margin-0 text-color-4">{currentSynth}</p>
                </div>
              </div>
              <div className="flex-align-baseline flex-space-between absolute-top padding-x-3 padding-top-3">
                <label className="opacity-60 weight-medium">Synth</label>
                <button onClick={(e) => setMaximum(e)} className="button-secondary button-tiny w-button">
                  {/* TODO Find out max burnable tokens */}
                  Max {state.sponsorTokens}
                </button>
              </div>
            </div>
            <div className="text-xs opacity-50 margin-top-1">
              Burn a maximum of {state.sponsorTokens} {currentSynth}
            </div>
          </div>
        </div>

        <div className="">
          {!actions.synthApproval ? <SynthApproveButton /> : <BurnButton />}
          <BackButton />
        </div>
      </div>
    </ActionDisplay>
  );
});
