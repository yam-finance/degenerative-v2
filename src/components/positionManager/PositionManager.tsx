import React, { useReducer, useEffect, useContext, useState } from 'react';
import { useFormState } from 'react-use-form-state';
import { BigNumber, utils } from 'ethers';
import { fromUnixTime, differenceInMinutes } from 'date-fns';
import clsx from 'clsx';

import { Dropdown, Icon, Loader, ActionDisplay, Mint } from '@/components';
import { UserContext, EthereumContext, MarketContext } from '@/contexts';
import { useToken, ISynthActions, PositionManagerContainer, MinterAction } from '@/hooks';
import { roundDecimals, isEmpty, getCollateralData } from '@/utils';
import { IToken, ISynthMarketData } from '@/types';

interface MinterFormFields {
  pendingCollateral: number;
  pendingTokens: number;
}

export const PositionManager: React.FC<{ actions: ISynthActions }> = React.memo(({ actions }) => {
  const { account, provider } = useContext(EthereumContext);
  const { currentSynth, currentCollateral, mintedPositions, triggerUpdate } = useContext(UserContext);
  const { synthMetadata, synthMarketData, collateralData } = useContext(MarketContext);

  const { state, dispatch } = PositionManagerContainer.useContainer();
  const erc20 = useToken();

  const [formState, { number }] = useFormState<MinterFormFields>(
    {
      pendingCollateral: state.sponsorCollateral,
      pendingTokens: state.sponsorTokens,
    },
    {
      onChange: (e, stateValues, nextStateValues) => {
        const { pendingCollateral, pendingTokens } = nextStateValues;
        const tokens = roundDecimals(Number(pendingTokens), 4);

        // Special case for redeem. Must maintain utilization.
        let collateral: number;
        if (state.action === 'REDEEM') {
          collateral = roundDecimals((tokens / state.utilization) * state.tokenPrice, 4);
          formState.setField('pendingCollateral', collateral);
        } else {
          collateral = roundDecimals(Number(pendingCollateral), 4);
        }

        dispatch({
          type: 'UPDATE_PENDING_UTILIZATION',
          payload: {
            pendingCollateral: collateral,
            pendingTokens: tokens,
          },
        });
      },
    }
  );

  useEffect(() => {
    const initMinterState = async () => {
      const collateralBalance = await setCollateralBalance(collateralData[currentCollateral]);

      const image = synthMetadata[currentSynth].imgLocation;
      const marketData = synthMarketData[currentSynth];
      const sponsorPosition = mintedPositions.find((position) => position.name == currentSynth);
      const utilization = Number(sponsorPosition?.utilization ?? 0);
      const sponsorCollateral = Number(sponsorPosition?.collateralAmount ?? 0);
      const sponsorTokens = Number(sponsorPosition?.tokenAmount ?? 0);

      let withdrawalRequestMinutesLeft;
      if (sponsorPosition?.withdrawalRequestTimestamp) {
        const withdrawalDate = fromUnixTime(sponsorPosition?.withdrawalRequestTimestamp);
        withdrawalRequestMinutesLeft = differenceInMinutes(withdrawalDate, new Date());
      } else {
        withdrawalRequestMinutesLeft = 0;
      }

      const withdrawalRequestAmount = sponsorPosition?.withdrawalRequestAmount ?? 0;

      const initialAction = sponsorPosition ? 'ADD_COLLATERAL' : 'MINT';

      dispatch({
        type: 'INIT_SPONSOR_POSITION',
        payload: {
          loading: false,
          image: image,
          action: initialAction,
          sponsorCollateral: sponsorCollateral,
          sponsorTokens: sponsorTokens,
          withdrawalRequestAmount: withdrawalRequestAmount,
          withdrawalRequestMinutesLeft: withdrawalRequestMinutesLeft,
          utilization: utilization,
          globalUtilization: marketData.globalUtilization,
          liquidationPoint: marketData.liquidationPoint,
          tokenPrice: marketData.price,
          minTokens: marketData.minTokens,
          maxCollateral: collateralBalance,
          isExpired: marketData.isExpired,
        },
      });

      setGaugeInitialState(sponsorCollateral, sponsorTokens);
    };

    if (
      currentSynth &&
      currentCollateral &&
      !isEmpty(collateralData) &&
      !isEmpty(synthMarketData[currentSynth]) &&
      !isEmpty(synthMetadata[currentSynth])
    ) {
      initMinterState();
    }
  }, [currentSynth, currentCollateral, synthMarketData, collateralData, account, mintedPositions]);

  // Set an event listener to update when collateral balance changes
  useEffect(() => {
    provider?.on('block', () => {
      if (!isEmpty(collateralData) && currentCollateral) {
        setCollateralBalance(collateralData[currentCollateral]);
      }
    });
    return () => {
      provider?.removeAllListeners('block');
    };
  }, [collateralData, currentCollateral]);

  // Set windows and fields based on action selected
  useEffect(() => {
    // TODO Define types to check against instead of switch
    const openCollateralInput = (action: MinterAction) => {
      switch (action) {
        case 'MINT':
        case 'ADD_COLLATERAL':
        case 'WITHDRAW':
          return true;
        default:
          return false;
      }
    };

    const openTokenInput = (action: MinterAction) => {
      switch (action) {
        case 'MINT':
        case 'REPAY':
        case 'REDEEM':
          return true;
        default:
          return false;
      }
    };

    dispatch({
      type: 'OPEN_INPUTS',
      payload: {
        editCollateral: openCollateralInput(state.action),
        editTokens: openTokenInput(state.action),
      },
    });

    // Reset form state to sponsor
    setGaugeInitialState(state.sponsorCollateral, state.sponsorTokens);
  }, [state.action]);

  const setFormInputs = (collateral: number, tokens: number) => {
    formState.setField('pendingCollateral', collateral);
    formState.setField('pendingTokens', tokens);

    dispatch({
      type: 'UPDATE_PENDING_UTILIZATION',
      payload: {
        pendingCollateral: collateral,
        pendingTokens: tokens,
      },
    });
  };

  const setGaugeInitialState = (collateral: number, tokens: number) => {
    // If active withdrawal request, set the form to the difference
    if (state.withdrawalRequestAmount > 0) {
      const pendingCollateral = collateral - state.withdrawalRequestAmount;
      setFormInputs(pendingCollateral, tokens);
    } else {
      // Set form to initial state
      setFormInputs(collateral, tokens);
    }
  };

  const setCollateralBalance = async (collateral: IToken) => {
    const rawBalance = (await erc20.getBalance(collateral.address)) ?? BigNumber.from(0);
    const collateralBalance = Number(utils.formatUnits(rawBalance, collateral.decimals));

    dispatch({
      type: 'UPDATE_MAX_COLLATERAL',
      payload: {
        collateral: collateralBalance,
      },
    });

    return collateralBalance;
  };

  const setMaximum = (e: React.MouseEvent) => {
    e.preventDefault();

    const newCollateral = state.maxCollateral + state.sponsorCollateral;
    // Must divide by price because global utilization is scaled by price
    const newTokens = newCollateral * (state.globalUtilization / state.tokenPrice);
    setFormInputs(newCollateral, newTokens);
  };

  interface GaugeLabelProps {
    label: string;
    tooltip: string;
    className: string;
    emphasized?: boolean;
  }

  const GaugeLabel: React.FC<GaugeLabelProps> = ({ label, tooltip, className, emphasized }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    const toggleDropdown = () => setShowTooltip(!showTooltip);

    return (
      <div className={className}>
        <div className={`margin-right-1 text-small ${emphasized && 'text-color-4'}`}>{label}</div>
        <div className="margin-0">
          <div
            className="padding-0 width-4 height-4 flex-align-center flex-justify-center w-dropdown-toggle"
            onMouseEnter={toggleDropdown}
            onMouseLeave={toggleDropdown}
          >
            <Icon name="Info" className="icon medium" />
          </div>
          <Dropdown className="dropdown-list radius-large box-shadow-medium w-dropdown-list" openDropdown={showTooltip}>
            <div className="text-xs">{tooltip}</div>
          </Dropdown>
        </div>
      </div>
    );
  };

  const HorizontalGauge: React.FC = () => {
    return (
      <div>
        <div className="gauge horizontal large overflow-hidden">
          <div className={`collateral large ${!state.pendingUtilization && 'empty'}`}>
            <div className="gcr horizontal large" style={{ left: `${state.globalUtilization * 100}%` }} />
            <div className="liquidation-point horizontal large" style={{ left: `${state.liquidationPoint * 100}%` }} />
          </div>
          <div
            className="debt horizontal large"
            style={{ width: `${state.pendingUtilization ? state.pendingUtilization * 100 : 0}%` }}
          >
            <div className="gradient horizontal" />
          </div>
        </div>
      </div>
    );
  };

  interface ActionButtonProps {
    action: MinterAction;
    sponsorCollateral: number;
    sponsorTokens: number;
    pendingCollateral: number;
    pendingTokens: number;
  }

  const ActionButton: React.FC<ActionButtonProps> = ({
    action,
    sponsorCollateral,
    sponsorTokens,
    pendingCollateral,
    pendingTokens,
  }) => {
    const [waiting, setWaiting] = useState(false);

    const baseStyle = clsx('button', 'width-full', 'text-small', 'w-button', 'button-large');

    const callAction = async (action: Promise<void>) => {
      setWaiting(true);
      await action;
      setWaiting(false);
      triggerUpdate(); // TODO Make UserContext refresh user positions. Not currently working.
    };

    const CollateralApproveButton: React.FC = () => (
      <button
        onClick={async (e) => {
          e.preventDefault();
          await actions.onApproveCollateral();
        }}
        className={baseStyle}
      >
        Approve {currentCollateral}
      </button>
    );

    const SynthApproveButton: React.FC = () => (
      <button
        onClick={async (e) => {
          e.preventDefault();
          await actions.onApproveSynth();
        }}
        className={baseStyle}
      >
        Approve {currentSynth}
      </button>
    );

    const MintButton: React.FC = () => {
      const newTokens = pendingTokens - sponsorTokens;
      const newCollateral = pendingCollateral - sponsorCollateral;

      const disableMinting =
        newTokens <= 0 ||
        newCollateral < 0 ||
        state.pendingUtilization > state.globalUtilization ||
        state.pendingUtilization > state.liquidationPoint;

      return (
        <button
          onClick={() => callAction(actions.onMint(newCollateral, newTokens))}
          className={clsx(baseStyle, disableMinting && 'disabled')}
          disabled={disableMinting}
        >
          {`Mint ${newTokens} ${currentSynth} for ${newCollateral} ${currentCollateral}`}
        </button>
      );
    };

    const AddCollateralButton: React.FC = () => {
      const difference = pendingCollateral - sponsorCollateral;

      const disabledAddCollateral = difference <= 0;

      return (
        <button
          onClick={() => callAction(actions.onDeposit(sponsorCollateral, pendingCollateral))}
          className={clsx(baseStyle, disabledAddCollateral && 'disabled')}
          disabled={disabledAddCollateral}
        >
          {`Add ${difference} ${currentCollateral} to sponsor position`}
        </button>
      );
    };

    const RepayButton: React.FC = () => {
      const repayTokens = sponsorTokens - pendingTokens;
      const disableRepay = repayTokens <= 0 || repayTokens >= sponsorTokens;

      return (
        <button
          onClick={() => callAction(actions.onRepay(repayTokens))}
          className={clsx(baseStyle, disableRepay && 'disabled')}
          disabled={disableRepay}
        >
          {`Repay ${repayTokens} ${currentSynth}`}
        </button>
      );
    };

    const RedeemButton: React.FC = () => {
      const redeemableTokens = sponsorTokens - pendingTokens;
      const resultingCollateral = redeemableTokens / state.utilization;

      const disableRedeem = redeemableTokens <= 0 || redeemableTokens >= sponsorTokens;

      return (
        <button
          onClick={() => callAction(actions.onRedeem(redeemableTokens))}
          className={clsx(baseStyle, disableRedeem && 'disabled')}
          disabled={disableRedeem}
        >
          {`Redeem ${redeemableTokens} ${currentSynth} and receive ${resultingCollateral} ${currentCollateral}`}
        </button>
      );
    };

    const WithdrawButton: React.FC = () => {
      const withdrawalAmount = sponsorCollateral - pendingCollateral;
      const disableWithdrawal = withdrawalAmount <= 0 || state.withdrawalRequestMinutesLeft !== 0;

      if (state.pendingUtilization > state.globalUtilization && state.pendingUtilization < state.liquidationPoint) {
        // Show Withdrawal Request modal
        return (
          <button
            onClick={() =>
              dispatch({ type: 'TOGGLE_WITHDRAWAL_MODAL', payload: { withdrawalAmount: withdrawalAmount } })
            }
            className={clsx(baseStyle, disableWithdrawal && 'disabled')}
            disabled={disableWithdrawal}
          >
            {`Request withdrawal for ${withdrawalAmount} ${currentCollateral}`}
          </button>
        );
      } else {
        return (
          <button
            onClick={() => callAction(actions.onWithdraw(withdrawalAmount))}
            className={clsx(baseStyle, disableWithdrawal && 'disabled')}
            disabled={disableWithdrawal}
          >
            {`Withdraw ${withdrawalAmount} ${currentCollateral}`}
          </button>
        );
      }
    };

    const WithdrawRequestButton = () => {
      if (state.withdrawalRequestMinutesLeft > 0) {
        return (
          <button onClick={() => callAction(actions.onCancelWithdraw())} className={baseStyle}>
            {`Cancel withdrawal request of ${state.withdrawalRequestAmount} ${currentCollateral}`}
          </button>
        );
      } else {
        return (
          <button onClick={() => callAction(actions.onWithdrawPassedRequest())} className={baseStyle}>
            {`Withdraw passed request of ${state.withdrawalRequestAmount} ${currentCollateral}`}
          </button>
        );
      }
    };

    const SettleButton = () => {
      return (
        <button
          onClick={() => callAction(actions.onSettle())}
          className={clsx(baseStyle, !state.isExpired && 'disabled')}
          disabled={!state.isExpired}
        >
          {`Settle ${currentSynth} for ${currentCollateral}`}
        </button>
      );
    };

    if (waiting) {
      return (
        <button className={clsx(baseStyle, 'disabled')} disabled={true}>
          Waiting on transaction
        </button>
      );
    }

    switch (action) {
      case 'MINT':
        return !actions.collateralApproval ? <CollateralApproveButton /> : <MintButton />;
      case 'ADD_COLLATERAL':
        return !actions.collateralApproval ? <CollateralApproveButton /> : <AddCollateralButton />;
      case 'REPAY':
        return !actions.synthApproval ? <SynthApproveButton /> : <RepayButton />;
      case 'REDEEM':
        return !actions.synthApproval ? <SynthApproveButton /> : <RedeemButton />;
      case 'WITHDRAW':
        return state.withdrawalRequestAmount > 0 ? <WithdrawRequestButton /> : <WithdrawButton />;
      case 'SETTLE':
        return !actions.synthApproval ? <SynthApproveButton /> : <SettleButton />;
      default:
        return null;
    }
  };

  const ActionSelector: React.FC<{ currentAction: MinterAction; noPosition: boolean }> = ({
    currentAction,
    noPosition,
  }) => {
    const changeAction = (action: MinterAction) => {
      dispatch({
        type: 'CHANGE_ACTION',
        payload: action,
      });
    };

    const styles = 'button-secondary button-tiny glass margin-1 w-button';

    return (
      <div className="flex-column">
        <span>Collateral: {currentCollateral}</span>
        <div className="flex-row flex-wrap">
          <button
            disabled={noPosition}
            className={clsx(styles, noPosition && 'opacity-10', currentAction === 'ADD_COLLATERAL' && 'selected')}
            onClick={() => changeAction('ADD_COLLATERAL')}
          >
            Deposit
          </button>
          <button
            disabled={noPosition}
            className={clsx(styles, noPosition && 'opacity-10', currentAction === 'WITHDRAW' && 'selected')}
            onClick={() => changeAction('WITHDRAW')}
          >
            Withdraw
          </button>
          {/* 
         <button
            disabled={noPosition || !state.isExpired}
            className={clsx(
              styles,
              (noPosition || !state.isExpired) && 'opacity-10',
              currentAction === 'SETTLE' && 'selected'
            )}
            onClick={() => changeAction('SETTLE')}
          >
            Settle
          </button>
         */}
        </div>
        <div className="flex-row flex-wrap">
          <button className={clsx(styles, currentAction === 'MINT' && 'selected')} onClick={() => changeAction('MINT')}>
            Mint Synth
          </button>
          <button
            disabled={noPosition}
            className={clsx(styles, noPosition && 'opacity-10', currentAction === 'REPAY' && 'selected')}
            onClick={() => changeAction('REPAY')}
          >
            Repay Synth
          </button>
          <button
            disabled={noPosition}
            className={clsx(styles, noPosition && 'opacity-10', currentAction === 'REDEEM' && 'selected')}
            onClick={() => changeAction('REDEEM')}
          >
            Redeem Synth
          </button>
        </div>
      </div>
    );
  };

  // TODO Finish this
  const TransactionDetails: React.FC = () => {
    switch (state.action) {
      case 'WITHDRAW': {
        if (state.withdrawalRequestMinutesLeft > 0) {
          return <p>Must wait {state.withdrawalRequestMinutesLeft} minutes until withdrawal is available</p>;
        } else {
          return <p>Withdraw</p>;
        }
      }
      default: {
        return null;
      }
    }
  };

  const WithdrawalConfirmationModal: React.FC = () => {
    const withdrawalPeriod = synthMarketData[currentSynth].withdrawalPeriod;

    const closeModal = () => dispatch({ type: 'TOGGLE_WITHDRAWAL_MODAL', payload: { withdrawalAmount: 0 } });

    return (
      <div className="modal">
        <div className="modal-bg w-inline-block" onClick={closeModal}></div>
        <div className="padding-6 background-color-3 radius-large box-shadow-large width-full max-width-xl">
          <div className="modal-section">
            <div>
              <h3 className="text-color-6 margin-0">Your collateral will be above GCR ratio!</h3>
              <p className="margin-top-4">
                You will need to wait for a withdrawal period of{' '}
                <strong className="text-color-4">{withdrawalPeriod} minutes</strong> before you can withdraw your{' '}
                {currentCollateral}.
                <br />
                <br />
                During that time your collateral could be <strong className="text-color-4">liquidated</strong> if your
                utilization exceeds the liquidation point of{' '}
                <strong className="text-color-4">{state.liquidationPoint * 100}%.</strong>
                <br />
                <br />
                {/* TODO Add link to liquidation docs */}
                <a href="#" className="underline">
                  Learn more about liquidation risks.
                </a>
              </p>
            </div>
            <div className="margin-top-6 padding-top-6 border-top-2px flex-space-between flex-align-baseline portrait-flex-column">
              <p>
                <span>Request permitted after {withdrawalPeriod} minutes</span>
              </p>
              <button
                onClick={async () => {
                  await actions.onRequestWithdraw(state.modalWithdrawalAmount);
                  closeModal();
                }}
                className="button w-button"
              >
                Request withdrawal
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const MintAction: React.FC = () => {
    return (
      <ActionDisplay>
        <h3 className="margin-0 text-align-center">Mint {currentSynth}</h3>
        <p className="text-align-center margin-top-2 landscape-margin-bottom-20">
          Deposit <strong className="text-color-4">{currentCollateral}</strong> to mint <strong>{currentSynth}</strong>{' '}
          at or above <span className="weight-bold text-color-4">{state.globalUtilization * 100}%</span> utilization
        </p>
        <img src={state.image} loading="lazy" alt="" className="width-32 height-32 margin-bottom-8" />

        <div className="expand width-full flex-column-end">
          <div className="flex-row">
            <div className="width-full margin-bottom-4">
              <div className="relative">
                <input
                  {...number('pendingCollateral')}
                  onClick={(e) => e.currentTarget.select()}
                  onInput={(e) =>
                    (formState.values.pendingTokens =
                      (state.globalUtilization / state.tokenPrice) * e.currentTarget.value)
                  }
                  type="number"
                  className="form-input height-24 text-large bottom-sharp margin-bottom-0 border-bottom-none w-input"
                  maxLength={256}
                  placeholder="0"
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
                    Max {utils.formatEther(state.maxCollateral.toString())}
                  </button>
                </div>
              </div>
              <div className="width-8 height-8 margin-auto flex-align-center flex-justify-center radius-full background-color-white inverse-margin">
                <Icon name="ArrowDown" className="icon opacity-100 text-color-1" />
              </div>
              <div className="relative">
                <input
                  {...number('pendingTokens')}
                  onClick={(e) => e.currentTarget.select()}
                  onInput={(e) =>
                    (formState.values.pendingCollateral =
                      (e.currentTarget.value * state.tokenPrice) / state.globalUtilization)
                  }
                  type="number"
                  className="form-input height-24 text-large top-sharp border-top-none margin-0 w-input"
                  maxLength={256}
                  required
                />
                <div className="margin-0 absolute-bottom-right padding-right-3 padding-bottom-4 w-dropdown">
                  <div className="padding-0 flex-align-center">
                    <p className="margin-0 text-color-4">{currentSynth}</p>
                  </div>
                </div>
                <div className="flex-align-baseline flex-space-between absolute-top padding-x-3 padding-top-3">
                  <label className="opacity-60 weight-medium">Mint</label>
                </div>
              </div>
              <div className="text-xs opacity-50 margin-top-1">Mint a minimum of 5 {currentSynth}</div>
            </div>
          </div>

          <div>
            <ActionButton
              action={state.action}
              sponsorCollateral={state.sponsorCollateral}
              sponsorTokens={state.sponsorTokens}
              pendingCollateral={Number(formState.values.pendingCollateral)}
              pendingTokens={Number(formState.values.pendingTokens)}
            />
          </div>
        </div>
      </ActionDisplay>
    );
  };

  if (state.loading) {
    return <Loader className="flex-align-center flex-justify-center padding-top-48" />;
  }
  return (
    <>
      <div className="flex-align-center flex-justify-center margin-top-8 landscape-flex-column-centered">
        <Mint />

        <div className="background-color-light radius-left-xl margin-y-8 width-full max-width-xs portrait-max-width-full box-shadow-large sheen flex-column landscape-margin-top-0 landscape-radius-top-0">
          <div className="flex-justify-end padding-right-2 padding-top-2 landscape-padding-top-4"></div>
          <div className="padding-8 padding-top-0 tablet-padding-top-0 landscape-padding-top-0 portrait-padding-top-0 flex-column expand">
            <div className="margin-top-8">
              <h6 className="margin-bottom-0">In your wallet</h6>
              <div className="divider margin-y-2"></div>
              <div className="text-small">
                <div className="flex-align-baseline margin-bottom-2">
                  <div className="expand flex-align-center">
                    <div>{currentCollateral}</div>
                  </div>
                  <div className="weight-medium text-color-4">{state.sponsorCollateral}</div>
                </div>
                <div className="flex-align-baseline margin-bottom-2">
                  <div className="expand flex-align-center">
                    <div>{currentSynth}</div>
                  </div>
                  <div className="weight-medium text-color-4">{state.sponsorTokens}</div>
                </div>
              </div>
            </div>

            <div className="margin-top-8">
              <div className="flex-align-center flex-space-between">
                <h6 className="margin-bottom-0">Resulting position</h6>
                <GaugeLabel
                  label={`${state.pendingUtilization > 0 ? (1 / state.pendingUtilization).toFixed(2) : '0'} CR`}
                  tooltip={`This is what your position will look like after minting. You will mint ${
                    state.sponsorTokens
                  } ${currentSynth}, utilizing ${
                    state.utilization ? state.utilization * 100 : 0
                  }% of your ${currentCollateral}`}
                  className="flex-align-center"
                  emphasized
                />
              </div>
              <div className="divider margin-y-2"></div>

              <HorizontalGauge
                pendingUtilization={state.pendingUtilization}
                globalUtilization={state.globalUtilization}
                liquidation={state.liquidationPoint}
              />

              <div>
                <div className="gauge horizontal large overflow-hidden">
                  <div className={`collateral large ${formState.values.pendingCollateral > 0 ? '' : 'empty'}`}>
                    <div className="gcr horizontal large" style={{ left: `${state.globalUtilization * 100}%` }} />
                    <div
                      className="liquidation-point horizontal large"
                      style={{ left: `${state.liquidationPoint * 100}%` }}
                    />
                  </div>
                  <div className="debt horizontal large" style={{ width: `${state.pendingUtilization * 100}%` }}>
                    <div className="gradient horizontal" />
                  </div>
                </div>
              </div>

              <div className="relative z-1">
                <div className="flex-align-center flex-space-between margin-top-6 margin-bottom-4">
                  <div className="flex-align-center">
                    <div className="gcr horizontal in-legend margin-right-2" />
                    <GaugeLabel
                      label="GCR"
                      tooltip="Global Collateralization Ratio. The average utilization ratio of all minters"
                      className="flex-align-center"
                      emphasized
                    />
                  </div>
                  <p className="text-xs margin-0">
                    {(1 / state.globalUtilization).toFixed(2)} ({roundDecimals(state.globalUtilization * 100, 2)}%
                    utilization)
                  </p>
                </div>

                <div className="flex-align-center flex-space-between">
                  <div className="flex-align-center">
                    <div className="liquidation-point horizontal in-legend margin-right-2" />
                    <GaugeLabel
                      label="Liquidation"
                      tooltip="Position is at risk of liquidation at this point."
                      className="flex-align-center"
                      emphasized
                    />
                  </div>
                  <p className="text-xs margin-0">
                    {(1 / state.liquidationPoint).toFixed(2)} ({roundDecimals(state.liquidationPoint * 100, 2)}%
                    utilization)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {state.showWithdrawalModal && <WithdrawalConfirmationModal />}
    </>
  );
});
