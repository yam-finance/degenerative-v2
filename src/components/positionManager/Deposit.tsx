import React, { useContext, useState } from 'react';
import { useFormState } from 'react-use-form-state';

import { ActionDisplay, ActionButton, BackButton } from '@/components';
import { PositionManagerContainer, useSynthActions } from '@/hooks';
import { UserContext } from '@/contexts';
import { roundDecimals } from '@/utils';

interface DepositFormFields {
  collateralToDeposit: number;
}

export const Deposit: React.FC = React.memo(() => {
  const { state, dispatch } = PositionManagerContainer.useContainer();
  const { currentSynth, currentCollateral } = useContext(UserContext);

  const actions = useSynthActions();

  const [formState, { number }] = useFormState<DepositFormFields>(
    {
      collateralToDeposit: state.sponsorCollateral,
    },
    {
      onChange: (e, stateValues, nextStateValues) => {
        const { collateralToDeposit } = nextStateValues;

        //setFormInputs(collateral, tokens);
        dispatch({
          type: 'UPDATE_PENDING_POSITION',
          payload: {
            pendingCollateral: state.sponsorCollateral + Number(collateralToDeposit),
            pendingTokens: state.sponsorTokens,
          },
        });
      },
    }
  );

  const setFormInputs = (collateral: number, tokens: number) => {
    formState.setField('collateralToDeposit', tokens);

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

  const CollateralApproveButton: React.FC = () => {
    return <ActionButton action={() => actions.onApproveCollateral()}>Approve {currentCollateral}</ActionButton>;
  };

  const DepositButton: React.FC = () => {
    const depositAmount = Number(formState.values.collateralToDeposit);
    const disableDeposit = depositAmount <= 0;

    return (
      <ActionButton action={() => actions.onDeposit(depositAmount)} disableCondition={disableDeposit}>
        {`Deposit ${depositAmount} ${currentCollateral}`}
      </ActionButton>
    );
  };

  return (
    <ActionDisplay>
      <h3 className="margin-0 text-align-center">Deposit</h3>
      <p className="text-align-center margin-top-2 landscape-margin-bottom-20">
        Deposit <strong className="text-color-4">{currentCollateral}</strong> to an existing position
      </p>
      <img src={state.image} loading="lazy" alt="" className="width-32 height-32 margin-bottom-8" />

      <div className="expand width-full flex-column-end">
        <div className="flex-row">
          <div className="width-full margin-bottom-4">
            <div className="relative">
              <input
                {...number('collateralToDeposit')}
                onClick={(e) => e.currentTarget.select()}
                type="number"
                className="form-input height-24 text-large margin-0 w-input"
                maxLength={256}
                min={0}
                required
              />
              <div className="margin-0 absolute-bottom-right padding-right-3 padding-bottom-4">
                <div className="padding-0 flex-align-center">
                  <p className="margin-0 text-color-4">{currentCollateral}</p>
                </div>
              </div>
              <div className="flex-align-baseline flex-space-between absolute-top padding-x-3 padding-top-3">
                <label className="opacity-60 weight-medium">Collateral</label>
                <button onClick={(e) => setMaximum(e)} className="button-secondary button-tiny w-button">
                  {/* TODO Find out max burnable tokens */}
                  Max {state.maxCollateral}
                </button>
              </div>
            </div>
            <div className="text-xs opacity-50 margin-top-1">
              Deposit a maximum of {state.maxCollateral} {currentCollateral}
            </div>
          </div>
        </div>

        {!actions.collateralApproval ? <CollateralApproveButton /> : <DepositButton />}
        <BackButton />
      </div>
    </ActionDisplay>
  );
});
