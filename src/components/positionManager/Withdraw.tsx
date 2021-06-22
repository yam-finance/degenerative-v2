import React, { useContext, useEffect } from 'react';
import { useFormState } from 'react-use-form-state';

import { ActionDisplay, ActionButton, BackButton } from '@/components';
import { PositionManagerContainer } from '@/hooks';
import { UserContext } from '@/contexts';

interface WithdrawFormFields {
  collateralToWithdraw: number;
}

export const Withdraw: React.FC = React.memo(() => {
  const { actions, state, dispatch } = PositionManagerContainer.useContainer();
  const { currentCollateral, mintedPositions } = useContext(UserContext);

  const [formState, { number }] = useFormState<WithdrawFormFields>(
    {
      collateralToWithdraw: 0,
    },
    {
      onChange: (e, stateValues, nextStateValues) => {
        const { collateralToWithdraw } = nextStateValues;

        dispatch({
          type: 'UPDATE_RESULTING_POSITION',
          payload: {
            resultingCollateral: state.sponsorCollateral - Number(collateralToWithdraw),
            resultingTokens: state.sponsorTokens,
          },
        });
      },
    }
  );

  useEffect(() => {
    if (state.withdrawalRequestAmount > 0) {
      const resultingCollateral = state.sponsorCollateral - state.withdrawalRequestAmount;
      const resultingTokens = state.sponsorTokens;

      dispatch({
        type: 'UPDATE_RESULTING_POSITION',
        payload: {
          resultingCollateral: resultingCollateral,
          resultingTokens: resultingTokens,
        },
      });
    }
  }, []);

  useEffect(() => {
    formState.reset();
  }, [state.utilization]);

  const setFormInputs = (collateral: number) => {
    formState.setField('collateralToWithdraw', collateral);

    dispatch({
      type: 'UPDATE_RESULTING_POSITION',
      payload: {
        resultingCollateral: collateral,
        resultingTokens: state.sponsorTokens,
      },
    });
  };

  const setMaximum = (e: React.MouseEvent) => {
    e.preventDefault();

    // TODO Withdraw max tokens

    // Update form and then component state to match form
    //setFormInputs(newCollateral, roundDecimals(newTokens, 2));
  };

  const CollateralApproveButton: React.FC = () => {
    return <ActionButton action={() => actions.onApproveCollateral()}>Approve {currentCollateral}</ActionButton>;
  };

  const WithdrawButton: React.FC = () => {
    const withdrawalAmount = Number(formState.values.collateralToWithdraw);
    const disableWithdrawal =
      withdrawalAmount <= 0 ||
      withdrawalAmount >= state.sponsorCollateral ||
      state.withdrawalRequestMinutesLeft !== 0 ||
      state.resultingUtilization <= state.liquidationPoint;

    if (state.resultingUtilization > state.globalUtilization) {
      // Show Withdrawal Request modal
      return (
        <ActionButton
          onClick={() => dispatch({ type: 'TOGGLE_WITHDRAWAL_MODAL', payload: { withdrawalAmount: withdrawalAmount } })}
          disableCondition={disableWithdrawal}
        >
          {`Request withdrawal for ${withdrawalAmount} ${currentCollateral}`}
        </ActionButton>
      );
    } else {
      return (
        <ActionButton action={() => actions.onWithdraw(withdrawalAmount)} disableCondition={disableWithdrawal}>
          {`Withdraw ${withdrawalAmount} ${currentCollateral}`}
        </ActionButton>
      );
    }
  };

  const WithdrawRequestButton = () => {
    if (state.withdrawalRequestMinutesLeft > 0) {
      return (
        <ActionButton action={() => actions.onCancelWithdraw()}>
          {`Cancel withdrawal request of ${state.withdrawalRequestAmount} ${currentCollateral}`}
        </ActionButton>
      );
    } else {
      return (
        <ActionButton action={() => actions.onWithdrawPassedRequest()}>
          {`Withdraw passed request of ${state.withdrawalRequestAmount} ${currentCollateral}`}
        </ActionButton>
      );
    }
  };

  return (
    <ActionDisplay>
      <h3 className="margin-0 text-align-center">Withdraw</h3>
      <p className="text-align-center margin-top-2 landscape-margin-bottom-20">
        Withdraw <strong className="text-color-4">{currentCollateral}</strong> from an existing position
      </p>
      <img src={state.image} loading="lazy" alt="" className="width-32 height-32 margin-bottom-8" />

      <div className="expand width-full flex-column-end">
        <div className="flex-row">
          <div className="width-full margin-bottom-4">
            <div className="relative">
              <input
                {...number('collateralToWithdraw')}
                onClick={(e) => e.currentTarget.select()}
                type="number"
                className="form-input height-24 text-large margin-0 w-input"
                maxLength={256}
                min={0}
                required
                disabled={state.withdrawalRequestAmount > 0}
              />
              <div className="margin-0 absolute-bottom-right padding-right-3 padding-bottom-4">
                <div className="padding-0 flex-align-center">
                  <p className="margin-0 text-color-4">{currentCollateral}</p>
                </div>
              </div>
              <div className="flex-align-baseline flex-space-between absolute-top padding-x-3 padding-top-3">
                <label className="opacity-60 weight-medium">Collateral</label>
                {/* TODO Find out max withdrawable collateral
                <button onClick={(e) => setMaximum(e)} className="button-secondary button-tiny w-button">
                  Max {state.sponsorCollateral}
                </button>
                */}
              </div>
            </div>
            <div className="text-xs opacity-50 margin-top-1">
              Withdrawing past GCR requires a withdraw request, which must be completed after the withdrawal period.
            </div>
          </div>
        </div>

        {!actions.collateralApproval ? (
          <CollateralApproveButton />
        ) : state.withdrawalRequestAmount > 0 ? (
          <WithdrawRequestButton />
        ) : (
          <WithdrawButton />
        )}
        <BackButton />
      </div>
    </ActionDisplay>
  );
});
