/* eslint-disable react/display-name */
import React, { useEffect, useContext, useState } from 'react';
import { BigNumber, utils } from 'ethers';
import { fromUnixTime, differenceInMinutes } from 'date-fns';

import { Dropdown, Icon, Loader, ActionSelector } from '@/components';
import { UserContext, EthereumContext, MarketContext } from '@/contexts';
import { useToken, ISynthActions, PositionManagerContainer, MinterAction } from '@/hooks';
import { roundDecimals, isEmpty, getCollateralData } from '@/utils';
import { IToken, ISynthMarketData } from '@/types';

export const PositionManager: React.FC<{ actions: ISynthActions }> = React.memo(({ actions }) => {
  const { account, provider } = useContext(EthereumContext);
  const { currentSynth, currentCollateral, mintedPositions, triggerUpdate } = useContext(UserContext);
  const { synthMetadata, synthMarketData, collateralData } = useContext(MarketContext);

  const { state, dispatch } = PositionManagerContainer.useContainer();
  const erc20 = useToken();

  const pricedUtilization = state.utilization * state.tokenPrice;
  const pricedGlobalUtil = state.globalUtilization * state.tokenPrice;
  const pricedResultingUtil = state.resultingUtilization * state.tokenPrice;

  useEffect(() => {
    const initMinterState = async () => {
      const { collateralBalance, synthBalance } = await setTokenBalances(
        collateralData[currentCollateral],
        synthMetadata[currentSynth].token
      );

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
      const initialAction = 'MANAGE';

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

      if (withdrawalRequestAmount > 0) {
        const resultingCollateral = sponsorCollateral - withdrawalRequestAmount;
        const resultingTokens = sponsorTokens;

        dispatch({
          type: 'UPDATE_RESULTING_POSITION',
          payload: {
            resultingCollateral: resultingCollateral,
            resultingTokens: resultingTokens,
          },
        });
      } else {
        dispatch({
          type: 'UPDATE_RESULTING_POSITION',
          payload: {
            resultingCollateral: 0,
            resultingTokens: 0,
          },
        });
      }
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
      if (!isEmpty(collateralData[currentCollateral]) && !isEmpty(synthMetadata[currentSynth])) {
        setTokenBalances(collateralData[currentCollateral], synthMetadata[currentSynth].token);
      }
    });
    return () => {
      provider?.removeAllListeners('block');
    };
  }, []);

  const setTokenBalances = async (collateral: IToken, synth: IToken) => {
    const rawCollateralBalance = (await erc20.getBalance(collateral.address)) ?? BigNumber.from(0);
    const collateralBalance = Number(utils.formatUnits(rawCollateralBalance, collateral.decimals));

    const rawSynthBalance = (await erc20.getBalance(synth.address)) ?? BigNumber.from(0);
    const synthBalance = Number(utils.formatUnits(rawSynthBalance, synth.decimals));

    dispatch({
      type: 'UPDATE_MAX_COLLATERAL',
      payload: {
        collateral: collateralBalance,
        synths: synthBalance,
      },
    });

    return { collateralBalance, synthBalance };
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
            <div className="gcr horizontal large" style={{ left: `${pricedGlobalUtil * 100}%` }} />
            <div className="liquidation-point horizontal large" style={{ left: `${state.liquidationPoint * 100}%` }} />
          </div>
          <div className="debt horizontal large" style={{ width: `${utilization * 100}%` }}>
            <div className="gradient horizontal" />
          </div>
        </div>
      </div>
    );
  };

  const WithdrawalConfirmationModal: React.FC = () => {
    const withdrawalPeriod = synthMarketData[currentSynth].withdrawalPeriod;

    const closeModal = () => dispatch({ type: 'TOGGLE_WITHDRAWAL_MODAL', payload: { withdrawalAmount: 0 } });

    return (
      <div className="modal">
        <div className="modal-bg w-inline-block" onClick={closeModal}></div>
        <div className="padding-6 background-color-3 radius-large box-shadow-large width-full max-width-2xl">
          <div className="modal-section">
            <div>
              <h3 className="text-color-6 margin-0">You are initiating a slow withdrawal</h3>
              <p className="margin-top-4">
                This is required if the amount of collateral you wish to withdraw lowers your collateral ratio (CR)
                below the Global Collateral Ratio (GCR).
                <br />
                <br />
                There is a <strong className="text-color-4">{withdrawalPeriod} minute</strong> withdrawal period before
                you can make your withdrawal. Once the withdrawal liveness period has completed you will be able to
                submit the second part of the process and withdraw the requested amount of collateral.
                <br />
                <br />
                Until a slow withdrawal is complete, all of your collateral is at risk of liquidation if your proposed
                collateral ratio drops low enough to be liquidated. You should complete your withdrawal as soon as
                possible after the liveness period has completed.
                <br />
                <br />
                You can cancel your withdrawal request at any time.
                <br />
                <br />
                <a
                  href="https://docs.umaproject.org/synthetic-tokens/expiring-synthetic-tokens#slow-withdrawal"
                  className="underline"
                >
                  Learn More about how Slow Withdrawals Work
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
                  triggerUpdate();
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

  if (state.loading) {
    return <Loader className="flex-align-center flex-justify-center padding-top-48" />;
  }
  return (
    <>
      <div className="flex-align-center flex-justify-center margin-top-8 landscape-flex-column-centered">
        <ActionSelector />

        <div className="background-color-light radius-left-xl margin-y-8 width-full max-width-xs portrait-max-width-full box-shadow-large sheen flex-column landscape-margin-top-0 landscape-radius-top-0">
          <div className="flex-justify-end padding-right-2 padding-top-2 landscape-padding-top-4"></div>
          <div className="padding-8 padding-top-0 tablet-padding-top-0 landscape-padding-top-0 portrait-padding-top-0 flex-column expand">
            <div className="margin-top-8">
              {!!state.utilization && (
                <div>
                  <div className="flex-align-center flex-space-between">
                    <h6 className="margin-bottom-0">Current Position</h6>
                    <GaugeLabel
                      label={`${(1 / pricedUtilization).toFixed(2)} CR`}
                      tooltip={`Collateral Ratio = (synth amount / collateral amount) * synth price`}
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
                  <HorizontalGauge utilization={pricedUtilization} />
                </div>
              )}

              <div className="margin-top-6">
                <div className="flex-align-center flex-space-between">
                  <h6 className="margin-bottom-0">Resulting position</h6>
                  <GaugeLabel
                    label={`${state.resultingUtilization > 0 ? (1 / pricedResultingUtil).toFixed(2) : '0'} CR`}
                    tooltip={`Collateral Ratio = (synth amount / collateral amount) * synth price`}
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
                    <div className="weight-medium text-color-4">{state.resultingCollateral}</div>
                  </div>
                  <div className="flex-align-baseline margin-bottom-2">
                    <div className="expand flex-align-center">
                      <div>{currentSynth}</div>
                    </div>
                    <div className="weight-medium text-color-4">{state.resultingTokens}</div>
                  </div>
                </div>
                <HorizontalGauge utilization={pricedResultingUtil} />
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
                    {(1 / pricedGlobalUtil).toFixed(2)}
                    {/*({roundDecimals(state.globalUtilization * 100, 2)}%
                    utilization)*/}
                  </p>
                </div>

                <div className="flex-align-center flex-space-between">
                  <div className="flex-align-center">
                    <div className="liquidation-point horizontal in-legend margin-right-2" />
                    <GaugeLabel
                      label="Liquidation"
                      tooltip="Ratio at which position is at risk of liquidation at this point."
                      className="flex-align-center"
                      emphasized
                    />
                  </div>
                  <p className="text-xs margin-0">
                    {(1 / state.liquidationPoint).toFixed(2)}
                    {/*({roundDecimals(state.liquidationPoint * 100, 2)}%
                    utilization)*/}
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
