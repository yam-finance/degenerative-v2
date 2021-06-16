import React, { useContext, useEffect } from 'react';
import { useFormState } from 'react-use-form-state';

import { ActionDisplay, ActionButton, BackButton } from '@/components';
import { PositionManagerContainer } from '@/hooks';
import { UserContext } from '@/contexts';

interface BurnFormFields {
  tokensToBurn: number;
}

export const Burn: React.FC = React.memo(() => {
  const { actions, state, dispatch } = PositionManagerContainer.useContainer();
  const { currentSynth, currentCollateral, mintedPositions } = useContext(UserContext);

  const maxBurnableTokens = state.sponsorTokens - state.minTokens;

  const [formState, { number }] = useFormState<BurnFormFields>(
    {
      tokensToBurn: 0,
    },
    {
      onChange: (e, stateValues, nextStateValues) => {
        const { tokensToBurn } = nextStateValues;
        setFormInputs(Number(tokensToBurn));
      },
    }
  );

  useEffect(() => {
    formState.reset();
  }, [mintedPositions]);

  const setFormInputs = (tokens: number) => {
    formState.setField('tokensToBurn', tokens);

    dispatch({
      type: 'UPDATE_RESULTING_POSITION',
      payload: {
        resultingCollateral: state.sponsorCollateral,
        resultingTokens: state.sponsorTokens - Number(tokens),
      },
    });
  };

  const setMaximum = () => {
    // Update form and then component state to match form
    setFormInputs(maxBurnableTokens);
  };

  const SynthApproveButton: React.FC = () => {
    return <ActionButton action={() => actions.onApproveSynth()}>Approve {currentSynth}</ActionButton>;
  };

  const BurnButton: React.FC = () => {
    const burnTokens = Number(formState.values.tokensToBurn);
    const disableBurn = burnTokens <= 0 || burnTokens > maxBurnableTokens || state.withdrawalRequestAmount > 0;

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
                <button onClick={() => setMaximum()} className="button-secondary button-tiny w-button">
                  {/* TODO Find out max burnable tokens */}
                  Max {maxBurnableTokens}
                </button>
              </div>
            </div>
            <div className="text-xs opacity-50 margin-top-1">
              Burn a maximum of {maxBurnableTokens} {currentSynth}
            </div>
          </div>
        </div>

        {!actions.synthApproval ? <SynthApproveButton /> : <BurnButton />}
        <BackButton />
      </div>
    </ActionDisplay>
  );
});
