import React, { useContext, useState } from 'react';
import { useFormState } from 'react-use-form-state';

import { Icon, ActionDisplay, ActionButton, BackButton } from '@/components';
import { PositionManagerContainer, useSynthActions } from '@/hooks';
import { UserContext } from '@/contexts';
import { roundDecimals } from '@/utils';

interface RedeemFormFields {
  tokensToRedeem: number;
}

export const Redeem: React.FC = React.memo(() => {
  const { state, dispatch } = PositionManagerContainer.useContainer();
  const { currentSynth, currentCollateral } = useContext(UserContext);

  const actions = useSynthActions();

  const [formState, { number }] = useFormState<RedeemFormFields>(
    {
      tokensToRedeem: state.sponsorTokens,
    },
    {
      onChange: (e, stateValues, nextStateValues) => {
        const { tokensToRedeem } = nextStateValues;

        const resultingTokens = state.sponsorTokens - Number(tokensToRedeem);
        const resultingCollateral = resultingTokens / state.utilization;

        dispatch({
          type: 'UPDATE_PENDING_POSITION',
          payload: {
            pendingCollateral: roundDecimals(resultingCollateral, 2),
            pendingTokens: roundDecimals(resultingTokens, 2),
          },
        });
      },
    }
  );

  const setFormInputs = (tokens: number) => {
    formState.setField('tokensToRedeem', tokens);

    dispatch({
      type: 'UPDATE_PENDING_POSITION',
      payload: {
        pendingCollateral: state.sponsorCollateral,
        pendingTokens: tokens,
      },
    });
  };

  const setMaximum = (e: React.MouseEvent) => {
    e.preventDefault();

    const maxRedeemable = state.sponsorTokens - state.minTokens;

    // Update form and then component state to match form
    setFormInputs(roundDecimals(maxRedeemable, 2));
  };

  const SynthApproveButton: React.FC = () => {
    return <ActionButton action={() => actions.onApproveSynth()}>Approve {currentSynth}</ActionButton>;
  };

  const RedeemButton: React.FC = () => {
    const redeemTokens = Number(formState.values.tokensToRedeem);

    const disableRedeem = redeemTokens <= 0 || redeemTokens >= state.sponsorTokens;

    return (
      <ActionButton action={() => actions.onRedeem(redeemTokens)} disableCondition={disableRedeem}>
        {`Redeem ${redeemTokens} ${currentSynth}`}
      </ActionButton>
    );
  };

  return (
    <ActionDisplay>
      <h3 className="margin-0 text-align-center">Redeem</h3>
      <p className="text-align-center margin-top-2 landscape-margin-bottom-20">
        Redeem <strong className="text-color-4">{currentSynth}</strong> to lower your collateral ratio
      </p>
      <img src={state.image} loading="lazy" alt="" className="width-32 height-32 margin-bottom-8" />

      <div className="expand width-full flex-column-end">
        <div className="flex-row">
          <div className="width-full margin-bottom-4">
            <div className="relative">
              <input
                {...number('tokensToRedeem')}
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
                  Max {state.sponsorTokens - 1}
                </button>
              </div>
            </div>
            <div className="text-xs opacity-50 margin-top-1">
              Burn a maximum of {state.sponsorTokens} {currentSynth}
            </div>
          </div>
        </div>

        <div className="">
          {!actions.synthApproval ? <SynthApproveButton /> : <RedeemButton />}
          <BackButton />
        </div>
      </div>
    </ActionDisplay>
  );
});
