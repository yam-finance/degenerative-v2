import React, { useContext, useEffect } from 'react';
import { useFormState } from 'react-use-form-state';

import { ActionDisplay, ActionButton, BackButton } from '@/components';
import { PositionManagerContainer } from '@/hooks';
import { UserContext } from '@/contexts';
import { roundDecimals } from '@/utils';

interface DepositFormFields {
  collateralToDeposit: number;
}

export const Deposit: React.FC = React.memo(() => {
  const { actions, state, dispatch } = PositionManagerContainer.useContainer();
  const { currentCollateral, mintedPositions } = useContext(UserContext);

  const [formState, { number }] = useFormState<DepositFormFields>(
    {
      collateralToDeposit: 0,
    },
    {
      onChange: (e, stateValues, nextStateValues) => {
        const { collateralToDeposit } = nextStateValues;

        dispatch({
          type: 'UPDATE_RESULTING_POSITION',
          payload: {
            resultingCollateral: state.sponsorCollateral + Number(collateralToDeposit),
            resultingTokens: state.sponsorTokens,
          },
        });
      },
    }
  );

  useEffect(() => {
    formState.reset();
  }, [state.utilization]);

  // Update form and then component state to match form
  const setFormInputs = (collateral: number) => {
    formState.setField('collateralToDeposit', collateral);

    dispatch({
      type: 'UPDATE_RESULTING_POSITION',
      payload: {
        resultingCollateral: state.sponsorCollateral + collateral,
        resultingTokens: state.sponsorTokens,
      },
    });
  };

  const setMaximum = (e: React.MouseEvent) => {
    e.preventDefault();
    const maxCollateral = state.maxCollateral;
    setFormInputs(maxCollateral);
  };

  const CollateralApproveButton: React.FC = () => {
    return <ActionButton action={() => actions.onApproveCollateral()}>Approve {currentCollateral}</ActionButton>;
  };

  const DepositButton: React.FC = () => {
    const depositAmount = Number(formState.values.collateralToDeposit);
    const disableDeposit = depositAmount <= 0 || depositAmount > state.maxCollateral;

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
                  Max {roundDecimals(state.maxCollateral, 3)}
                </button>
              </div>
            </div>
            <div className="text-xs opacity-50 margin-top-1">
              Deposit a maximum of {roundDecimals(state.maxCollateral, 3)} {currentCollateral}
            </div>
          </div>
        </div>

        {!actions.collateralApproval ? <CollateralApproveButton /> : <DepositButton />}
        <BackButton />
      </div>
    </ActionDisplay>
  );
});
