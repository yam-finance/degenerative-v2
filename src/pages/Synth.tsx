import React, { useContext, useEffect, useState } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { fromUnixTime, differenceInMinutes } from 'date-fns';
import { useFormState } from 'react-use-form-state';

import { PositionManagerContainer, useSynthActions, useToken } from '@/hooks';
import { UserContext, MarketContext, EthereumContext } from '@/contexts';
import { Page, Navbar, Icon, MainDisplay, MainHeading, NewMinter, PositionManager, SideDisplay } from '@/components';
import { ISynth, ISynthMarketData } from '@/types';
import { utils } from 'ethers';
import { isEmpty, roundDecimals } from '@/utils';
import numeral from 'numeral';

interface SynthParams {
  group: string;
  cycleYear: string;
}

export const Synth: React.FC = () => {
  const { group, cycleYear } = useParams<SynthParams>();
  const { currentSynth, currentCollateral, setSynth, mintedPositions, triggerUpdate } = useContext(UserContext);
  const { synthMetadata, synthMarketData, collateralData } = useContext(MarketContext);
  const { signer } = useContext(EthereumContext);

  const [synth, setSynthInfo] = useState({} as ISynth);
  const [marketData, setMarketData] = useState({} as ISynthMarketData);
  const [withdrawalAmount, setWithdrawalAmount] = useState(0);
  const [withdrawalMinutesLeft, setWithdrawalMinutesLeft] = useState(0);

  const actions = useSynthActions();

  useEffect(() => {
    // TODO validate and redirect if synth doesn't exist
    setSynth(`${group}-${cycleYear}`);
  }, []);

  useEffect(() => {
    if (currentSynth && !isEmpty(synthMarketData) && !isEmpty(synthMetadata)) {
      setSynthInfo(synthMetadata[currentSynth]);
      setMarketData(synthMarketData[currentSynth]);
    }
  }, [currentSynth, synthMetadata, synthMarketData]);

  useEffect(() => {
    const sponsorPosition = mintedPositions.find((position) => position.name == currentSynth);
    if (sponsorPosition) console.log(sponsorPosition);

    if (sponsorPosition) {
      let withdrawalRequestMinutesLeft = 0;
      if (sponsorPosition.withdrawalRequestTimestamp) {
        const withdrawalDate = fromUnixTime(sponsorPosition.withdrawalRequestTimestamp);
        withdrawalRequestMinutesLeft = differenceInMinutes(withdrawalDate, new Date());
      }
      setWithdrawalMinutesLeft(withdrawalRequestMinutesLeft);
      setWithdrawalAmount(sponsorPosition.withdrawalRequestAmount);
    }
  }, [currentSynth, mintedPositions]);

  const LinkBar: React.FC = () => {
    const collateral = collateralData[currentCollateral];

    let tradeLink;
    let lpLink;
    switch (synth.pool.location) {
      case 'uni':
        tradeLink = `https://app.uniswap.org/#/swap?inputCurrency=${collateralData[currentCollateral].address}&outputCurrency=${synth.token.address}&use=V2`;
        lpLink = `https://app.uniswap.org/#/add/v2/${collateralData[currentCollateral].address}-${synth.token.address}`;
        break;
      case 'sushi':
        tradeLink = `https://app.sushi.com/swap?inputCurrency=${collateral.address}&outputCurrency=${synth.token.address}`;
        lpLink = `https://app.sushi.com/add/${collateral.address}-${synth.token.address}`;
        break;
      default:
        break;
    }

    if (isEmpty(collateralData) && isEmpty(synthMetadata)) return null;
    return (
      <div className="padding-x-8 flex-row">
        <div className="tabs margin-right-2">
          <a href={tradeLink} target="_blank" rel="noreferrer" className="tab large">
            Trade
          </a>
          <a href={lpLink} target="_blank" rel="noreferrer" className="tab large">
            Provide Liquidity
          </a>
        </div>
      </div>
    );
  };

  const WithdrawalRequestDialog: React.FC = () => {
    const [waiting, setWaiting] = useState(false);

    return (
      <div className="width-full padding-2 radius-large background-color-2 margin-bottom-6 text-color-4">
        <div className="flex-align-center margin-bottom-2 flex-space-between">
          <div className="text-xs opacity-50">Withdraw Request</div>
          <Icon name="AlertOctagon" className="icon medium blue" />
        </div>
        <div className="flex-row">
          <div className="width-2 radius-full background-color-white margin-right-2 blue"></div>
          {withdrawalMinutesLeft > 0 ? (
            <div>
              <div className="text-small">
                {withdrawalAmount} {currentCollateral} pending. Available for withdrawal in {withdrawalMinutesLeft}{' '}
                mins.
              </div>
              <div className="flex-row margin-top-2">
                <a
                  href="https://docs.umaproject.org/synthetic-tokens/expiring-synthetic-tokens#slow-withdrawal"
                  className="button-secondary button-tiny margin-right-1"
                >
                  Learn more
                </a>
                <button
                  onClick={async () => {
                    setWaiting(true);
                    await actions.onCancelWithdraw();
                    triggerUpdate();
                    setWaiting(false);
                  }}
                  className="button-secondary button-tiny"
                  disabled={waiting}
                >
                  Cancel Withdrawal
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-small">
                {withdrawalAmount} {currentCollateral} available for withdrawal.
              </div>
              <div className="flex-row margin-top-2">
                <button
                  onClick={async () => {
                    setWaiting(true);
                    await actions.onWithdrawPassedRequest();
                    triggerUpdate();
                    setWaiting(false);
                  }}
                  className="button-secondary button-tiny margin-right-1"
                  disabled={waiting}
                >
                  Withdraw
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const SettleDialog: React.FC = () => {
    return (
      <div className="width-full padding-2 radius-large background-color-2 margin-bottom-6 w-inline-block text-color-6">
        <div className="flex-align-center margin-bottom-2 flex-space-between">
          <div className="text-xs opacity-50">Settle</div>
          <Icon name="AlertOctagon" className="icon medium blue" />
        </div>
        <div className="flex-row">
          <div className="width-2 radius-full background-color-white margin-right-2 blue" />
          <div className="text-small">
            <strong>
              {marketData.isExpired
                ? `${currentSynth} has expired.`
                : `${currentSynth} will expire in ${marketData.daysTillExpiry} days.`}
            </strong>
          </div>
        </div>
      </div>
    );
  };

  const WrapEthDialog: React.FC = () => {
    const [maxEth, setMaxEth] = useState(0);
    const [waiting, setWaiting] = useState(false);
    const [formState, { number }] = useFormState<{ ethAmount: number }>({ ethAmount: 0 });

    useEffect(() => {
      const getEthBalance = async () => {
        if (signer) {
          const ethBalance = await signer.getBalance();
          setMaxEth(Number(utils.formatEther(ethBalance)));
        }
      };

      getEthBalance();
    }, [signer]);

    return (
      <div className="width-full padding-2 radius-large background-color-2 margin-bottom-6 text-color-4">
        <div className="flex-align-center margin-bottom-2 flex-space-between">
          <div className="text-xs opacity-50">Wrap ETH</div>
          <Icon name="AlertOctagon" className="icon medium blue" />
        </div>
        <div className="flex-row">
          <div className="width-2 radius-full background-color-white margin-right-2 blue" />
          <div>
            <div className="flex-row">
              <input
                {...number('ethAmount')}
                type="number"
                className="form-input small margin-bottom-1 w-input"
                maxLength={10}
                min={0}
                placeholder="0"
                required
              />
              <button
                className="button-secondary button-tiny margin-left-1"
                onClick={(e) => {
                  e.preventDefault();
                  formState.setField('ethAmount', maxEth);
                }}
              >
                Max
              </button>
            </div>
            <div className="flex-row margin-top-2">
              <button
                className="button button-small margin-right-1"
                onClick={async (e) => {
                  e.preventDefault();
                  setWaiting(true);
                  await actions.onWrapEth(Number(formState.values.ethAmount));
                  triggerUpdate();
                  setWaiting(false);
                }}
                disabled={waiting}
              >
                Wrap
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Page>
      <Navbar />
      <MainDisplay>
        <MainHeading>{currentSynth}</MainHeading>
        {!isEmpty(synth) && <LinkBar />}
        <div className="border-bottom-1px margin-x-8 margin-y-4" />
        <PositionManagerContainer.Provider>
          <PositionManager actions={actions} />
        </PositionManagerContainer.Provider>
      </MainDisplay>
      <SideDisplay>
        {synth.collateral === 'WETH' && <WrapEthDialog />}
        {withdrawalAmount > 0 && <WithdrawalRequestDialog />}
        {!isEmpty(synthMarketData) && (
          <>
            <SettleDialog />
            <div>
              <div className="flex-align-baseline margin-bottom-2">
                <div className="expand flex-align-center text-small">
                  <div>{currentSynth} price</div>
                </div>
                <div className="weight-medium text-color-4">${numeral(marketData.priceUsd).format('0,0')}</div>
              </div>
              <div className="flex-align-baseline margin-bottom-2">
                <div className="expand flex-align-center text-small">
                  <div>{currentCollateral} price</div>
                </div>
                <div className="weight-medium text-color-4">
                  ${numeral(marketData.collateralPriceUsd).format('0,0')}
                </div>
              </div>
              <div className="flex-align-baseline margin-bottom-2">
                <div className="expand flex-align-center text-small">
                  <div>Global Collateral Ratio</div>
                </div>
                <div className="weight-medium text-color-4">
                  {roundDecimals(1 / (marketData.globalUtilization * marketData.price), 2)}
                </div>
              </div>
              <div className="flex-align-baseline margin-bottom-2">
                <div className="expand flex-align-center text-small">
                  <div>Liquidation Ratio</div>
                </div>
                <div className="weight-medium text-color-4">{roundDecimals(1 / marketData.liquidationPoint, 2)}</div>
              </div>
              <div className="flex-align-baseline margin-bottom-2">
                <div className="expand flex-align-center text-small">
                  <div>Minimum position</div>
                </div>
                <div className="weight-medium text-color-4">
                  {marketData.minTokens} {currentSynth}
                </div>
              </div>
            </div>
          </>
        )}
      </SideDisplay>
    </Page>
  );
};
