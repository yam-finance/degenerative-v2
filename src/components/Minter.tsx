import React, { useReducer, useEffect, useContext, useState } from 'react';
import { useFormState } from 'react-use-form-state';
import { BigNumber, utils } from 'ethers';
import { fromUnixTime, differenceInMinutes } from 'date-fns';

import { Icon } from '@/components';
import { UserContext, EthereumContext, MarketContext } from '@/contexts';
import { useToken, useSynthActions, ISynthActions } from '@/hooks';
import { roundDecimals, isEmpty } from '@/utils';
import clsx from 'clsx';

/* The component's state is the actual sponsor position. The form is the pending position. */

/* TODO remove this when added to copy
  - Mint: Create new position OR add synths to existing position.
  - Add collateral: Adds collateral to position, reducing utilization.
  - Repay Debt: Removes synths from position. Must have synths in wallet to do so.
  - Withdraw collateral: Removes collateral from position, increasing utilization. May have to request
  - Redeem: Repays debt AND removes collateral to maintain same utilization.
  - Settle: Settles sponsor position AFTER expiry.
*/
type MinterAction = 'MINT' | 'ADD_COLLATERAL' | 'REPAY' | 'REDEEM' | 'WITHDRAW' | 'SETTLE';

const initialMinterState = {
  loading: true,
  action: 'MINT' as MinterAction,
  sponsorCollateral: 0,
  sponsorTokens: 0,
  withdrawalRequestAmount: 0,
  withdrawalRequestMinutesLeft: 0,
  utilization: 0,
  globalUtilization: 0,
  liquidationPoint: 0,
  tokenPrice: 0,
  minTokens: 0,
  maxCollateral: 0, // TODO replace with synthInWallet item
  isExpired: false,

  pendingUtilization: 0,
  editCollateral: true,
  editTokens: true,

  showWithdrawalModal: false,
  modalWithdrawalAmount: 0,
};

type State = typeof initialMinterState;
type Action = 'INIT_SPONSOR_POSITION' | 'UPDATE_SPONSOR_POSITION' | 'UPDATE_PENDING_UTILIZATION' | 'CHANGE_ACTION' | 'OPEN_INPUTS' | 'TOGGLE_WITHDRAWAL_MODAL';

const Reducer = (state: State, action: { type: Action; payload: any }) => {
  switch (action.type) {
    case 'INIT_SPONSOR_POSITION': {
      const initialized = action.payload;
      console.log(initialized);

      return {
        ...state,
        loading: false,
        sponsorCollateral: initialized.sponsorCollateral,
        sponsorTokens: initialized.sponsorTokens,
        withdrawalRequestAmount: initialized.withdrawalRequestAmount,
        withdrawalRequestMinutesLeft: initialized.withdrawalRequestMinutesLeft,
        utilization: initialized.utilization,
        globalUtilization: initialized.globalUtilization,
        liquidationPoint: initialized.liquidationPoint,
        tokenPrice: initialized.tokenPrice,
        minTokens: initialized.minTokens,
        maxCollateral: initialized.maxCollateral,
        isExpired: initialized.isExpired,
      };
    }
    case 'UPDATE_SPONSOR_POSITION': {
      const { pendingCollateral, pendingTokens } = action.payload;

      return {
        ...state,
        sponsorCollateral: pendingCollateral,
        sponsorTokens: pendingTokens,
        utilization: calculateUtilization(pendingCollateral, pendingTokens, state.tokenPrice),
      };
    }
    case 'UPDATE_PENDING_UTILIZATION': {
      const { pendingCollateral, pendingTokens } = action.payload;
      const util = calculateUtilization(pendingCollateral, pendingTokens, state.tokenPrice);

      return {
        ...state,
        pendingUtilization: util > 0 && util !== Infinity ? roundDecimals(util, 2) : 0,
      };
    }
    case 'CHANGE_ACTION': {
      return {
        ...state,
        action: action.payload,
      };
    }
    case 'OPEN_INPUTS': {
      const { editCollateral, editTokens } = action.payload;

      return {
        ...state,
        editCollateral: editCollateral,
        editTokens: editTokens,
      };
    }
    case 'TOGGLE_WITHDRAWAL_MODAL': {
      const { withdrawalAmount } = action.payload;

      return {
        ...state,
        showWithdrawalModal: !state.showWithdrawalModal,
        modalWithdrawalAmount: withdrawalAmount,
      };
    }
    default:
      throw new Error('Invalid state change');
  }
};

const calculateUtilization = (collateral: number, tokens: number, price: number) => (tokens * price) / collateral;

interface MinterFormFields {
  pendingCollateral: number;
  pendingTokens: number;
}

export const Minter: React.FC<{ actions: ISynthActions }> = ({ actions }) => {
  const { account } = useContext(EthereumContext);
  const { currentSynth, currentCollateral, synthsInWallet, mintedPositions } = useContext(UserContext);
  const { synthMarketData, collateralData } = useContext(MarketContext);

  const [state, dispatch] = useReducer(Reducer, initialMinterState);
  //const actions = useSynthActions();
  const erc20 = useToken(); // TODO remove after getting from synthsInWallet

  const [formState, { number }] = useFormState<MinterFormFields>(
    {
      pendingCollateral: state.sponsorCollateral,
      pendingTokens: state.sponsorTokens,
    },
    {
      onChange: (e, stateValues, nextStateValues) => {
        const { pendingCollateral, pendingTokens } = nextStateValues;
        const tokens = Number(pendingTokens);

        // Special case for redeem. Must maintain utilization.
        let collateral: number;
        if (state.action === 'REDEEM') {
          collateral = tokens / state.utilization;
          formState.setField('pendingCollateral', collateral);
        } else {
          collateral = Number(pendingCollateral);
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
      const collateralAddress = collateralData[currentCollateral].address;
      const collateralDecimals = collateralData[currentCollateral].decimals;

      let collateralBalance = BigNumber.from(0);
      try {
        collateralBalance = (await erc20.getBalance(collateralAddress)) ?? BigNumber.from(0);
      } catch (err) {
        console.log(err);
      }

      const marketData = synthMarketData[currentSynth];

      const sponsorPosition = mintedPositions.find((position) => position.name == currentSynth);
      const synthInWallet = synthsInWallet.find((balance) => balance.name == currentSynth);

      const utilization = Number(sponsorPosition?.utilization) ?? 0;

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
          maxCollateral: Number(utils.formatUnits(collateralBalance, collateralDecimals)),
          isExpired: marketData.isExpired,
        },
      });

      setGaugeInitialState(sponsorCollateral, sponsorTokens);
    };

    if (currentSynth && currentCollateral && !isEmpty(collateralData) && !isEmpty(synthMarketData[currentSynth])) {
      initMinterState();
    }
  }, [currentSynth, currentCollateral, synthMarketData, collateralData, account]);

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

  const setMaximum = (e: React.MouseEvent) => {
    e.preventDefault();

    const newCollateral = state.maxCollateral + state.sponsorCollateral;
    // Must divide by price because global utilization is scaled by price
    const newTokens = newCollateral * (state.globalUtilization / state.tokenPrice);
    setFormInputs(newCollateral, newTokens);
  };

  // TODO THIS IS A TEMPORARY STOPGAP. Wrap eth must be added to collateral window option
  const WrapEthButton: React.FC = () => {
    const [ethAmount, setEthAmount] = useState(0);

    return (
      <div>
        <input
          type="number"
          className="form-input border-bottom-none w-input"
          value={ethAmount}
          onChange={(e) => {
            e.preventDefault();
            setEthAmount(Number(e.target.value));
          }}
        />
        <button
          className="button w-button"
          onClick={(e) => {
            e.preventDefault();
            actions.onWrapEth(ethAmount);
          }}
        >
          Wrap Eth
        </button>
      </div>
    );
  };

  interface GaugeLabelProps {
    label: string;
    tooltip: string;
    className: string;
    height: number;
    emphasized?: boolean;
  }
  const GaugeLabel: React.FC<GaugeLabelProps> = ({ label, tooltip, className, height, emphasized }) => {
    const labelHeight = {
      bottom: `${height * 100}%`,
    };

    return (
      <div className={className} style={labelHeight}>
        <div className="margin-0 w-dropdown">
          <div className="padding-0 width-4 height-4 flex-align-center flex-justify-center w-dropdown-toggle">
            <Icon name="Info" className="icon medium" />
          </div>
          <nav className="dropdown-list radius-large box-shadow-medium w-dropdown-list">
            <div className="width-32 text-xs">{tooltip}</div>
          </nav>
        </div>
        <div className={`margin-left-1 text-xs ${emphasized && 'text-color-4'}`}>{label}</div>
      </div>
    );
  };

  interface GaugeProps {
    utilization: number;
    pendingUtilization: number;
    globalUtilization: number;
    liquidation: number;
  }

  const Gauge: React.FC<GaugeProps> = ({ utilization, pendingUtilization, globalUtilization, liquidation }) => {
    const debtHeight = {
      height: `${utilization * 100}%`,
    };

    // NOTE: Gauge does not line up correctly without subtracting 2
    const pendingDebtHeight = {
      height: `${pendingUtilization * 100}%`,
    };

    const globalUtilizationHeight = {
      bottom: `${globalUtilization * 100}%`,
    };

    const liquidationHeight = {
      bottom: `${liquidation * 100}%`,
    };

    return (
      <div className="gauge">
        <div className={`collateral large ${utilization > 0 ? '' : 'empty'}`}></div>
        <div className="debt" style={pendingDebtHeight}>
          <div className="gradient" />
        </div>
        <div className="liquidation-point" style={liquidationHeight} />
        <div className="gcr" style={globalUtilizationHeight} />
        {utilization > 0 && (
          <div className="old-position" style={debtHeight}>
            <div className="width-1px background-color-white expand"></div>
          </div>
        )}
      </div>
    );
  };

  const UtilizationMarker: React.FC<{ utilization: number }> = ({ utilization }) => {
    return utilization ? (
      <div className="old-position-marker">
        <div className="old-position-outer-line"></div>
        <div className="text-block">{roundDecimals(utilization * 100, 3) ?? 0}% Current Utilization</div>
      </div>
    ) : null;
  };

  interface ActionButtonProps {
    action: MinterAction;
    sponsorCollateral: number;
    sponsorTokens: number;
    pendingCollateral: number;
    pendingTokens: number;
  }

  const ActionButton: React.FC<ActionButtonProps> = ({ action, sponsorCollateral, sponsorTokens, pendingCollateral, pendingTokens }) => {
    const [waiting, setWaiting] = useState(false);

    const baseStyle = clsx('button', 'width-full', 'text-small', 'w-button');

    const callAction = async (action: Promise<void>) => {
      setWaiting(true);
      await action;
      setWaiting(false);
    };

    const CollateralApproveButton: React.FC = () => (
      <button
        onClick={async (e) => {
          e.preventDefault();
          await actions.onApproveCollateral();
        }}
        className={baseStyle}
      >
        Approve EMP for {currentCollateral}
      </button>
    );

    const TokenApproveButton: React.FC = () => (
      <button
        onClick={async (e) => {
          e.preventDefault();
          await actions.onApproveSynth();
        }}
        className={baseStyle}
      >
        Approve EMP for {currentSynth}
      </button>
    );

    const MintButton: React.FC = () => {
      const newTokens = pendingTokens - state.sponsorTokens;
      const newCollateral = pendingCollateral - state.sponsorCollateral;

      const disableMinting =
        newTokens <= 0 || newCollateral < 0 || state.pendingUtilization > state.globalUtilization || state.pendingUtilization > state.liquidationPoint;

      return (
        <button
          onClick={() => callAction(actions.onMint(newCollateral, newTokens))}
          className={clsx(baseStyle, disableMinting && 'disabled')}
          disabled={disableMinting}
        >
          {`Mint ${newTokens} new ${currentSynth} for ${newCollateral} ${currentCollateral}`}
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
        <button onClick={() => callAction(actions.onRepay(repayTokens))} className={clsx(baseStyle, disableRepay && 'disabled')} disabled={disableRepay}>
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
            onClick={() => dispatch({ type: 'TOGGLE_WITHDRAWAL_MODAL', payload: { withdrawalAmount: withdrawalAmount } })}
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
          onClick={() => callAction(actions.onWithdrawPassedRequest())}
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
        return !actions.synthApproval ? <TokenApproveButton /> : <RepayButton />;
      case 'REDEEM':
        return !actions.synthApproval ? <TokenApproveButton /> : <RedeemButton />;
      case 'WITHDRAW':
        return state.withdrawalRequestAmount > 0 ? <WithdrawRequestButton /> : <WithdrawButton />;
      case 'SETTLE':
        return <SettleButton />;
      default:
        return null;
    }
  };

  const ActionSelector: React.FC<{ currentAction: MinterAction; noPosition: boolean }> = ({ currentAction, noPosition }) => {
    const changeAction = (action: MinterAction) => {
      dispatch({
        type: 'CHANGE_ACTION',
        payload: action,
      });
    };

    const styles = 'button-secondary button-tiny glass margin-1 w-button';

    // TODO replace with a css class
    const disabledButton = {
      opacity: 0.1,
    };

    const ActionDescription: React.FC<{ action: MinterAction }> = ({ action }) => {
      switch (action) {
        case 'MINT': {
          return <div> Create a new position or create new synths from an existing position.</div>;
        }
        case 'ADD_COLLATERAL': {
          return <div>Adds collateral to position, reducing utilization.</div>;
        }
        case 'REPAY': {
          return <div>Removes synths from position. Must have synths in wallet to do so.</div>;
        }
        case 'WITHDRAW': {
          return <div>Removes collateral from position, increasing utilization. Withdrawals below global utilization must be requested.</div>;
        }
        case 'REDEEM': {
          return <div>Repays debt and redeems equivalent collateral to maintain same utilization</div>;
        }
        default: {
          return null;
        }
      }
    };

    return (
      <>
        <div className="flex-row flex-wrap">
          <button className={clsx(styles, currentAction === 'MINT' && 'selected')} onClick={() => changeAction('MINT')}>
            Mint Synth
          </button>
          <button
            style={noPosition ? disabledButton : {}}
            disabled={noPosition}
            className={clsx(styles, currentAction === 'ADD_COLLATERAL' && 'selected')}
            onClick={() => changeAction('ADD_COLLATERAL')}
          >
            Add Collateral
          </button>
          <button
            style={noPosition ? disabledButton : {}}
            disabled={noPosition}
            className={clsx(styles, currentAction === 'REPAY' && 'selected')}
            onClick={() => changeAction('REPAY')}
          >
            Repay Synth
          </button>
          <button
            style={noPosition ? disabledButton : {}}
            disabled={noPosition}
            className={clsx(styles, currentAction === 'WITHDRAW' && 'selected')}
            onClick={() => changeAction('WITHDRAW')}
          >
            Withdraw Collateral
          </button>
          <button
            style={noPosition ? disabledButton : {}}
            disabled={noPosition}
            className={clsx(styles, currentAction === 'REDEEM' && 'selected')}
            onClick={() => changeAction('REDEEM')}
          >
            Redeem Synth
          </button>
          <button
            style={noPosition || !state.isExpired ? disabledButton : {}}
            disabled={noPosition || !state.isExpired}
            className={clsx(styles, currentAction === 'SETTLE' && 'selected')}
            onClick={() => changeAction('SETTLE')}
          >
            Settle
          </button>
        </div>
        {/* <ActionDescription action={currentAction} /> */}
      </>
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
        break;
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
                You will need to wait for a withdrawal period of <strong className="text-color-4">{withdrawalPeriod} minutes</strong> before you can withdraw
                your {currentCollateral}.
                <br />
                <br />
                During that time your collateral could be <strong className="text-color-4">liquidated</strong> if your utilization exceeds the liquidation point
                of <strong className="text-color-4">{state.liquidationPoint * 100}%.</strong>
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

  // TODO fix loader, center and make spin
  if (state.loading) {
    return (
      <div className="flex-align-center flex-justify-center">
        <Icon name="Loader" className="spin" />
      </div>
    );
  }
  return (
    <>
      <WrapEthButton />
      <div className="flex-align-center flex-justify-center margin-top-8 landscape-flex-column-centered">
        <div className="margin-0 w-form">
          <form className="max-width-small flex-column background-color-2 padding-8 radius-xl box-shadow-large z-10 padding-y-12 landscape-padding-2">
            <h3 className="margin-0 text-align-center">{currentSynth}</h3>
            <p className="text-align-center margin-top-2 margin-bottom-20 landscape-margin-bottom-20" />
            <div className="flex-row">
              <div className="expand relative padding-right-2">
                <GaugeLabel label="Global Utilization" tooltip="TODO" className="gcr-legend" height={state.globalUtilization} />
                <GaugeLabel label="Liquidation" tooltip="TODO" className="liquidation-legend" height={state.liquidationPoint} emphasized />
                <div className="background-color-5 padding-2 radius-large z-10 width-32 collat">
                  <h6 className="text-align-center margin-bottom-0">Collateral</h6>
                  <div className="width-full flex-justify-center margin-top-1 w-dropdown">
                    <div className="padding-0 flex-align-center">
                      <a className="weight-bold">{currentCollateral}</a>
                    </div>
                  </div>
                  <input
                    {...number('pendingCollateral')}
                    type="number"
                    className="form-input small margin-bottom-1 w-input"
                    maxLength={256}
                    min={0}
                    placeholder="0"
                    required
                    disabled={!state.editCollateral}
                  />
                  <button
                    onClick={(e) => setMaximum(e)}
                    className={`button-secondary button-tiny white width-full ${!state.editCollateral && 'disabled'}`}
                    disabled={!state.editCollateral}
                  >
                    Max {state.maxCollateral.toFixed(2)}
                  </button>
                  <div className="nub background-color-5"></div>
                </div>
              </div>

              <Gauge
                utilization={state.utilization}
                pendingUtilization={state.pendingUtilization}
                globalUtilization={state.globalUtilization}
                liquidation={state.liquidationPoint}
              />

              <div className="expand padding-left-2">
                <div
                  className={`background-color-debt padding-2 radius-large z-10 width-32 debts ${
                    Number(formState.values.pendingTokens) === 0 && Number(formState.values.pendingCollateral) === 0 && 'disabled'
                  }`}
                  style={{
                    top: `${state.pendingUtilization < 1 ? (1 - state.pendingUtilization) * 100 : 0}%`,
                  }}
                >
                  <h6 className="text-align-center margin-bottom-0">Synth</h6>
                  {state.pendingUtilization >= 0 && (
                    <>
                      <h4 className="text-align-center margin-top-2 margin-bottom-0">{state.pendingUtilization.toFixed(2)}%</h4>
                      <p className="text-xs text-align-center margin-bottom-0">Utilization</p>
                    </>
                  )}
                  <h5 className="text-align-center margin-bottom-1 margin-top-1 text-small">
                    {formState.values.pendingTokens} {currentSynth}
                  </h5>
                  <div className="height-9 flex-align-end">
                    <input
                      {...number('pendingTokens')}
                      type="number"
                      className="form-input small margin-bottom-1 w-input"
                      maxLength={256}
                      min="0"
                      placeholder="0"
                      required
                      disabled={!state.editTokens}
                    />
                  </div>
                  <div className="nub background-color-debt left"></div>
                </div>
              </div>
            </div>
            <UtilizationMarker utilization={state.utilization} />
          </form>
        </div>
        <div className="background-color-light radius-left-xl margin-y-8 width-full max-width-xs box-shadow-large sheen flex-column landscape-margin-top-0 landscape-radius-top-0">
          <div className="flex-justify-end padding-2 landscape-padding-top-4">
            <div className="margin-0 w-dropdown">
              <div className="padding-0 w-dropdown-toggle">
                <Icon name="Info" className="icon opacity-100" />
              </div>
              <nav className="dropdown-list radius-large box-shadow-medium w-dropdown-list">
                <a href="#" className="text-small break-no-wrap">
                  Advanced Features
                </a>
                <p className="text-xs opacity-50 margin-0">Coming soon</p>
              </nav>
            </div>
          </div>
          <div className="padding-8 padding-top-0 flex-column expand">
            <div>
              <h6 className="margin-bottom-0">Actions</h6>
              <div className="divider margin-y-2"></div>
              <ActionSelector currentAction={state.action} noPosition={!state.sponsorCollateral} />
            </div>

            <div className="margin-top-8">
              <h6 className="margin-bottom-0">Your wallet</h6>
              <div className="divider margin-y-2"></div>
              <div className="text-small">
                <div className="flex-align-baseline margin-bottom-2">
                  <div className="expand flex-align-center">
                    <div>{currentCollateral}</div>
                  </div>
                  <div className="weight-medium text-color-4">{state.maxCollateral}</div>
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
              <h6 className="margin-bottom-0">TX Details</h6>
              <div className="divider margin-y-2"></div>
              {!state.sponsorCollateral ? (
                <p className="text-xs">
                  No collateral deposited yet.
                  <br />
                  {`Must mint a minimum of ${state.minTokens} ${currentSynth}.`}
                  <br />
                </p>
              ) : (
                <TransactionDetails />
              )}
            </div>

            <div className="expand flex-align-end">
              <ActionButton
                action={state.action}
                sponsorCollateral={state.sponsorCollateral}
                sponsorTokens={state.sponsorTokens}
                pendingCollateral={Number(formState.values.pendingCollateral)}
                pendingTokens={Number(formState.values.pendingTokens)}
              />
            </div>
          </div>
        </div>
      </div>
      {state.showWithdrawalModal && <WithdrawalConfirmationModal />}
    </>
  );
};
