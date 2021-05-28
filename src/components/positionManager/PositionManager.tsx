import React, { useEffect, useContext, useState } from 'react';
import { useFormState } from 'react-use-form-state';
import { BigNumber, utils } from 'ethers';
import { fromUnixTime, differenceInMinutes } from 'date-fns';
import clsx from 'clsx';

import { Dropdown, Icon, Loader, Manage, Mint, Burn, Deposit, Withdraw } from '@/components';
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

      const initialAction = sponsorPosition ? 'DEPOSIT' : 'MINT';

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

  const HorizontalGauge: React.FC<{ utilization: number }> = ({ utilization }) => {
    return (
      <div>
        <div className="gauge horizontal large overflow-hidden">
          <div className={`collateral large ${utilization === 0 && 'empty'}`}>
            <div className="gcr horizontal large" style={{ left: `${state.globalUtilization * 100}%` }} />
            <div className="liquidation-point horizontal large" style={{ left: `${state.liquidationPoint * 100}%` }} />
          </div>
          <div className="debt horizontal large" style={{ width: `${utilization * 100}%` }}>
            <div className="gradient horizontal" />
          </div>
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

  const Action: React.FC = () => {
    switch (state.action) {
      case 'MANAGE': {
        return <Manage />;
      }
      case 'MINT': {
        return <Mint />;
      }
      case 'BURN': {
        return <Burn />;
      }
      case 'DEPOSIT': {
        return <Deposit />;
      }
      case 'WITHDRAW': {
        return <Withdraw />;
      }
      default: {
        return null;
      }
    }
  };

  if (state.loading) {
    return <Loader className="flex-align-center flex-justify-center padding-top-48" />;
  }
  return (
    <>
      <div className="flex-align-center flex-justify-center margin-top-8 landscape-flex-column-centered">
        <Action />

        <div className="background-color-light radius-left-xl margin-y-8 width-full max-width-xs portrait-max-width-full box-shadow-large sheen flex-column landscape-margin-top-0 landscape-radius-top-0">
          <div className="flex-justify-end padding-right-2 padding-top-2 landscape-padding-top-4"></div>
          <div className="padding-8 padding-top-0 tablet-padding-top-0 landscape-padding-top-0 portrait-padding-top-0 flex-column expand">
            <div className="margin-top-8">
              {!!state.utilization && (
                <div>
                  <div className="flex-align-center flex-space-between">
                    <h6 className="margin-bottom-0">Current Position</h6>
                    <GaugeLabel
                      label={`${(1 / state.utilization).toFixed(2)} CR`}
                      tooltip={`This is your current sponsor position. You have minted ${
                        state.sponsorTokens
                      } ${currentSynth}, using ${state.utilization * 100}% of your deposited ${
                        state.sponsorCollateral
                      } ${currentCollateral}.`}
                      className="flex-align-center"
                      emphasized
                    />
                  </div>
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
                  <HorizontalGauge utilization={state.utilization} />
                </div>
              )}

              <div className="margin-top-4">
                <div className="flex-align-center flex-space-between">
                  <h6 className="margin-bottom-0">Resulting position</h6>
                  <GaugeLabel
                    label={`${state.resultingUtilization > 0 ? (1 / state.resultingUtilization).toFixed(2) : '0'} CR`}
                    tooltip={`This is what your position will look like after minting. You will mint ${
                      state.pendingTokens
                    } ${currentSynth}, utilizing ${state.resultingUtilization ? state.utilization * 100 : 0}% of your ${
                      state.pendingCollateral
                    } ${currentCollateral}`}
                    className="flex-align-center"
                    emphasized
                  />
                </div>
                <div className="divider margin-y-2"></div>
                <HorizontalGauge utilization={state.resultingUtilization} />
              </div>

              {/* 
              <div>
                <div className="gauge horizontal large overflow-hidden">
                  <div className={`collateral large ${state.pendingUtilization > 0 ? '' : 'empty'}`}>
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
              */}

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
