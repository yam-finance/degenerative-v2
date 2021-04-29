import React, { useReducer, useEffect, useContext, useState } from 'react';
import { useFormState } from 'react-use-form-state';
import { BigNumber, utils } from 'ethers';
import { fromUnixTime, differenceInMinutes } from 'date-fns';

import { Icon } from '@/components';
import { UserContext, EthereumContext, MarketContext } from '@/contexts';
import { useToken, useSynthActions } from '@/hooks';
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
type MinterAction = 'MINT' | 'ADD_COLLATERAL' | 'REPAY_DEBT' | 'REDEEM' | 'WITHDRAW';

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
  minTokens: 0,
  maxCollateral: 0, // TODO replace with synthInWallet item

  pendingUtilization: 0,
  editCollateral: true,
  editTokens: true,
};

type State = typeof initialMinterState;
type Action = 'INIT_SPONSOR_POSITION' | 'UPDATE_SPONSOR_POSITION' | 'UPDATE_PENDING_UTILIZATION' | 'CHANGE_ACTION' | 'OPEN_INPUTS';

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
        minTokens: initialized.minTokens,
        maxCollateral: initialized.maxCollateral,
      };
    }
    case 'UPDATE_SPONSOR_POSITION': {
      const { pendingCollateral, pendingTokens } = action.payload;
      return {
        ...state,
        sponsorCollateral: pendingCollateral,
        sponsorTokens: pendingTokens,
        utilization: pendingTokens / pendingCollateral,
      };
    }
    case 'UPDATE_PENDING_UTILIZATION': {
      const { pendingCollateral, pendingTokens } = action.payload;
      const util = pendingTokens / pendingCollateral;

      return {
        ...state,
        pendingUtilization: util > 0 && util !== Infinity ? roundDecimals(util, 2) : 0,
      };
    }
    case 'CHANGE_ACTION': {
      console.log(action.payload);
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
    default:
      throw new Error('Invalid state change');
  }
};

interface MinterFormFields {
  pendingCollateral: number;
  pendingTokens: number;
}

export const Minter = () => {
  const { account } = useContext(EthereumContext);
  const { currentSynth, currentCollateral, synthsInWallet, mintedPositions } = useContext(UserContext);
  const { synthMarketData, collateralData } = useContext(MarketContext);

  const [state, dispatch] = useReducer(Reducer, initialMinterState);
  const actions = useSynthActions();
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
      const empInfo = synthMarketData[currentSynth];
      // TODO change mintedPositions to a record
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
          globalUtilization: empInfo.globalUtilization,
          liquidationPoint: empInfo.liquidationPoint,
          minTokens: empInfo.minTokens,
          maxCollateral: Number(utils.formatUnits(collateralBalance, collateralDecimals)),
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
        case 'REPAY_DEBT':
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

    const newCollateral = state.maxCollateral;
    const newTokens = state.maxCollateral * state.globalUtilization;
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
    const baseStyle = clsx('button', 'width-full', 'text-small', 'w-button');

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

      const disableMinting = newTokens <= 0 || state.pendingUtilization < state.globalUtilization || state.pendingUtilization > state.liquidationPoint;

      return (
        <button onClick={() => actions.onMint(newCollateral, newTokens)} className={clsx(baseStyle, disableMinting && 'disabled')} disabled={disableMinting}>
          {`Mint ${newTokens} new ${currentSynth} for ${newCollateral} ${currentCollateral}`}
        </button>
      );
    };

    const AddCollateralButton: React.FC = () => {
      const difference = pendingCollateral - sponsorCollateral;

      const disabledAddCollateral = difference <= 0;

      return (
        <button
          onClick={() => actions.onDeposit(sponsorCollateral, pendingCollateral)}
          className={clsx(baseStyle, disabledAddCollateral && 'disabled')}
          disabled={disabledAddCollateral}
        >
          {`Add ${difference} ${currentCollateral} to sponsor position`}
        </button>
      );
    };

    // TODO Repay debt button

    const RedeemButton: React.FC = () => {
      const redeemableTokens = sponsorTokens - pendingTokens;
      const resultingCollateral = redeemableTokens / state.utilization;

      //const isRedeemValid = redeemableTokens > 0 && redeemableTokens < sponsorTokens;
      const disableRedeem = redeemableTokens <= 0 || redeemableTokens >= sponsorTokens;

      return (
        <button onClick={() => actions.onRedeem(redeemableTokens)} className={clsx(baseStyle, disableRedeem && 'disabled')} disabled={disableRedeem}>
          {`Redeem ${redeemableTokens} ${currentSynth} and receive ${resultingCollateral} ${currentCollateral}`}
        </button>
      );
    };

    const WithdrawButton: React.FC = () => {
      const withdrawalAmount = sponsorCollateral - pendingCollateral;
      const disableWithdrawal = withdrawalAmount <= 0 || state.withdrawalRequestMinutesLeft !== 0;

      if (state.pendingUtilization > state.globalUtilization && state.pendingUtilization < state.liquidationPoint) {
        return (
          <button
            onClick={() => actions.onRequestWithdraw(withdrawalAmount)}
            className={clsx(baseStyle, disableWithdrawal && 'disabled')}
            disabled={disableWithdrawal}
          >
            {`Request withdrawal for ${withdrawalAmount} ${currentCollateral}`}
          </button>
        );
      } else {
        return (
          <button
            onClick={() => actions.onWithdraw(withdrawalAmount)}
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
          <button onClick={() => actions.onCancelWithdraw()} className={baseStyle}>
            {`Cancel withdrawal request of ${state.withdrawalRequestAmount} ${currentCollateral}`}
          </button>
        );
      } else {
        return (
          <button onClick={() => actions.onWithdrawPassedRequest()} className={baseStyle}>
            {`Withdraw passed request of ${state.withdrawalRequestAmount} ${currentCollateral}`}
          </button>
        );
      }
    };

    console.log(action);
    switch (action) {
      case 'MINT':
        return !actions.collateralApproval ? <CollateralApproveButton /> : <MintButton />;
      case 'ADD_COLLATERAL':
        return !actions.collateralApproval ? <CollateralApproveButton /> : <AddCollateralButton />;
      case 'REDEEM':
        return !actions.synthApproval ? <TokenApproveButton /> : <RedeemButton />;
      case 'WITHDRAW':
        // TODO Check if withdrawalAmount > 0
        // if so, show WithdrawPassedRequest / CancelWithdraw button and display time till withdrawal
        // else, show Withdraw / RequestWithdraw button
        return state.withdrawalRequestAmount > 0 ? <WithdrawRequestButton /> : <WithdrawButton />;
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

    // TODO replace with class
    const disabledButton = {
      opacity: 0.1,
    };

    const ActionDescription: React.FC<MinterAction> = (props) => {
      switch (props) {
        case 'MINT': {
          return <p> Create a new position or create new synths from an existing position.</p>;
        }
        case 'ADD_COLLATERAL': {
          return <div>Adds collateral to position, reducing utilization.</div>;
        }
        case 'REPAY_DEBT': {
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
            className={clsx(styles, currentAction === 'REPAY_DEBT' && 'selected')}
            onClick={() => changeAction('REPAY_DEBT')}
          >
            Repay Debt
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
        </div>
        <ActionDescription {...currentAction} />
      </>
    );
  };

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
            <p className="text-align-center margin-top-2 margin-bottom-20 landscape-margin-bottom-20">Tweak your position settings</p>
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
                    Number(formState.values.pendingTokens) === 0 && state.sponsorTokens === 0 && 'disabled'
                  }`}
                  style={{
                    top: `${state.pendingUtilization < 1 ? (1 - state.pendingUtilization) * 100 : 0}%`,
                  }}
                >
                  <h6 className="text-align-center margin-bottom-0">Debt</h6>
                  {state.pendingUtilization >= 0 && (
                    <>
                      <h4 className="text-align-center margin-top-2 margin-bottom-0">{state.pendingUtilization * 100}%</h4>
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
            <div data-hover="1" data-delay="0" className="margin-0 w-dropdown">
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
                // TODO add TX detail component
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
    </>
  );
};
