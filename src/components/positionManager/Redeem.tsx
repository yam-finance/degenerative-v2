import React, { useContext, useEffect } from 'react';
import { useFormState } from 'react-use-form-state';

import { Icon, ActionDisplay, ActionButton, BackButton } from '@/components';
import { PositionManagerContainer } from '@/hooks';
import { UserContext } from '@/contexts';
import { roundDecimals } from '@/utils';

interface RedeemFormFields {
  tokensToRedeem: number;
}

export const Redeem: React.FC = React.memo(() => {
  const { actions, state, dispatch } = PositionManagerContainer.useContainer();
  const { currentSynth } = useContext(UserContext);

  const maxRedeemableTokens = state.sponsorTokens - state.minTokens;

  const [formState, { number }] = useFormState<RedeemFormFields>(
    {
      tokensToRedeem: 0,
    },
    {
      onChange: (e, stateValues, nextStateValues) => {
        const { tokensToRedeem } = nextStateValues;
        setFormInputs(Number(tokensToRedeem));
      },
    }
  );

  useEffect(() => {
    formState.reset();
  }, [state.sponsorTokens]);

  const setFormInputs = (tokens: number) => {
    formState.setField('tokensToRedeem', tokens);

    let resultingTokens = 0;
    let resultingCollateral = 0;

    if (tokens <= state.sponsorTokens) {
      resultingTokens = state.sponsorTokens - tokens;
      resultingCollateral = resultingTokens / state.utilization;
      console.log(resultingCollateral, resultingTokens);
    }

    dispatch({
      type: 'UPDATE_RESULTING_POSITION',
      payload: {
        resultingCollateral: resultingCollateral,
        resultingTokens: resultingTokens,
      },
    });
  };

  const setMaximum = () => setFormInputs(maxRedeemableTokens);

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

  const ClosePositionButton: React.FC = () => {
    const redeemTokens = state.sponsorTokens;
    return <ActionButton action={() => actions.onRedeem(redeemTokens)}>Close position</ActionButton>;
  };

  return (
    <ActionDisplay>
      <h3 className="margin-0 text-align-center">Redeem</h3>
      <p className="text-align-center margin-top-2 landscape-margin-bottom-20">
        Redeem <strong className="text-color-4">{currentSynth}</strong> to reduce <br />
        or close your position
      </p>
      <img src={state.image} loading="lazy" alt="" className="width-32 height-32 margin-bottom-8" />
      <div className="expand width-full flex-column-end">
        {!actions.synthApproval ? (
          <>
            <h3 className="margin-top-10 text-align-center">Approve synth contract to continue</h3>
            <SynthApproveButton />
          </>
        ) : (
          <>
            <ClosePositionButton />
            <div className="flex-align-center margin-y-4">
              <div className="expand height-1 border-bottom-2px"></div>
              <div className="margin-x-4">or</div>
              <div className="expand height-1 border-bottom-2px"></div>
            </div>
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
                    <button onClick={() => setMaximum()} className="button-secondary button-tiny w-button">
                      {/* TODO Find out max burnable tokens */}
                      Max {maxRedeemableTokens}
                    </button>
                  </div>
                </div>
                <div className="text-xs opacity-50 margin-top-1">
                  Redeem a maximum of {maxRedeemableTokens} {currentSynth}
                </div>
              </div>
            </div>
            <RedeemButton />
          </>
        )}
        <BackButton />
      </div>
    </ActionDisplay>
  );
});
