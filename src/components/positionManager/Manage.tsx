import React, { useContext } from 'react';
import clsx from 'clsx';
import { ActionDisplay } from '@/components';
import { PositionManagerContainer, MinterAction } from '@/hooks';
import { UserContext } from '@/contexts';

export const Manage = () => {
  const { actions, state, dispatch } = PositionManagerContainer.useContainer();
  const { currentSynth, currentCollateral, synthsInWallet } = useContext(UserContext);

  const ownsSynth = !!synthsInWallet.find((synth) => synth.name === currentSynth);

  const changeAction = (action: MinterAction) => {
    dispatch({
      type: 'CHANGE_ACTION',
      payload: action,
    });
  };

  const noPosition = state.sponsorCollateral == 0;
  const activeWithdrawalRequest = state.withdrawalRequestAmount > 0;
  const styles = 'button-secondary expand';

  return (
    <ActionDisplay>
      {state.isExpired ? (
        <>
          <h3 className="margin-0 text-align-center">Synth Expired</h3>
          <p className="text-align-center margin-top-2 landscape-margin-bottom-20">
            Settle any <strong className="text-color-4">{currentSynth}</strong> tokens below
          </p>
        </>
      ) : (
        <>
          <h3 className="margin-0 text-align-center">Manage Position</h3>
          <p className="text-align-center margin-top-2 landscape-margin-bottom-20">
            View or change your <strong className="text-color-4">{currentSynth}</strong> position
          </p>
        </>
      )}
      <img src={state.image} loading="lazy" alt="" className="width-32 height-32 margin-bottom-8" />

      <div className="flex-column width-full">
        <div className="flex-space-between all-caps text-xs weight-bold letters-looser">
          <span>Collateral</span>
          <span className="text-color-4 text-small">{currentCollateral}</span>
        </div>
        <div className="flex-row flex-wrap margin-top-2">
          <button
            disabled={noPosition || activeWithdrawalRequest}
            className={clsx(styles, (noPosition || activeWithdrawalRequest) && 'disabled')}
            onClick={() => changeAction('DEPOSIT')}
          >
            Deposit
          </button>
          <button
            disabled={noPosition}
            className={clsx(styles, noPosition && 'disabled', 'margin-left-2')}
            onClick={() => changeAction('WITHDRAW')}
          >
            Withdraw
          </button>
        </div>
        <div className="margin-top-6 flex-space-between all-caps text-xs weight-bold letters-looser">
          <span>Synth</span>
          <span className="text-color-4 text-small">{currentSynth}</span>
        </div>
        <div className="flex-row flex-wrap margin-top-2">
          <button
            disabled={activeWithdrawalRequest || state.isExpired}
            className={clsx(styles, (activeWithdrawalRequest || state.isExpired) && 'disabled')}
            onClick={() => changeAction('MINT')}
          >
            Mint
          </button>
          <button
            disabled={noPosition || activeWithdrawalRequest}
            className={clsx(styles, (noPosition || activeWithdrawalRequest) && 'disabled', 'margin-left-2')}
            onClick={() => changeAction('BURN')}
          >
            Burn
          </button>
        </div>
        <button
          disabled={noPosition || activeWithdrawalRequest}
          className={clsx(styles, (noPosition || activeWithdrawalRequest) && 'disabled', 'width-full margin-top-2')}
          onClick={() => changeAction('REDEEM')}
        >
          Redeem
        </button>
        <button
          disabled={!state.isExpired || !ownsSynth}
          // TODO can you settle with active withdrawal request?
          className={clsx(
            styles,
            (activeWithdrawalRequest || !state.isExpired || !ownsSynth) && 'disabled',
            'width-full margin-top-2'
          )}
          // TODO Allow settle if synths in wallet
          onClick={() => actions.onSettle()}
        >
          Settle
        </button>
      </div>
    </ActionDisplay>
  );
};
