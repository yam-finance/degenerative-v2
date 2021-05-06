import React, { useContext, useEffect, useState } from 'react';
import { useParams, NavLink } from 'react-router-dom';

import { useSynthActions } from '@/hooks/useSynthActions';
import { UserContext, MarketContext } from '@/contexts';
import { Icon, MainDisplay, MainHeading, Minter, SideDisplay } from '@/components';
import { fromUnixTime, differenceInMinutes } from 'date-fns';
import { ISynthInfo, ISynthMarketData } from '@/types';
import { isEmpty } from '@/utils';
import numeral from 'numeral';

interface SynthParams {
  group: string;
  cycleYear: string;
  action: string;
}

export const Synth: React.FC = () => {
  const { group, cycleYear, action } = useParams<SynthParams>();
  const { currentSynth, currentCollateral, setSynth, mintedPositions } = useContext(UserContext);
  const { synthMetadata, synthMarketData } = useContext(MarketContext);

  const [{ cycle, year }, setSynthInfo] = useState({} as ISynthInfo);
  const [{ isExpired, daysTillExpiry, priceUsd, collateralPriceUsd, globalUtilization }, setMarketData] = useState({} as ISynthMarketData);
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

  const ActionSelector: React.FC = () => {
    return (
      <div className="padding-x-8 flex-row">
        <div className="tabs margin-right-2">
          <NavLink to={`/synths/${group}/${cycle}${year}/manage`} className="tab large" activeClassName="active">
            Manage
          </NavLink>
          <NavLink to={`/synths/${group}/${cycle}${year}/trade`} className="tab large" activeClassName="active">
            Trade
          </NavLink>
          <NavLink to={`/synths/${group}/${cycle}${year}/lp`} className="tab large" activeClassName="active">
            LP
          </NavLink>
        </div>
      </div>
    );
  };

  const Action: React.FC = () => {
    switch (action) {
      case 'manage':
        return <Minter actions={actions} />;
      //case 'trade':
      //  return <Trade />
      //case 'lp':
      //  return <Lp />
      default:
        return null;
    }
  };

  const WithdrawalRequestDialog: React.FC = () => {
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
                {withdrawalAmount} {currentCollateral} pending. Available for withdrawal in {withdrawalMinutesLeft} mins.
              </div>
              <div className="flex-row margin-top-2">
                <a
                  href="https://docs.umaproject.org/synthetic-tokens/expiring-synthetic-tokens#slow-withdrawal"
                  className="button-secondary button-tiny margin-right-1 white w-button"
                >
                  Learn more
                </a>
                <button onClick={async () => await actions.onCancelWithdraw()} className="button-secondary button-tiny white w-button">
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
                <button onClick={async () => await actions.onWithdrawPassedRequest()} className="button-secondary button-tiny margin-right-1 white w-button">
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
            <strong>{isExpired ? `${currentSynth} has expired.` : `${currentSynth} will expire in ${daysTillExpiry} days.`}</strong>
          </div>
        </div>
      </div>
    );
  };

  if (!currentSynth) return null;
  return (
    <>
      <MainDisplay>
        <MainHeading>{currentSynth}</MainHeading>
        <ActionSelector />
        <div className="border-bottom-1px margin-x-8 margin-y-4" />
        <Action />
      </MainDisplay>
      <SideDisplay>
        {withdrawalAmount > 0 && <WithdrawalRequestDialog />}
        <SettleDialog />
        <div>
          <div className="flex-align-baseline margin-bottom-2">
            <div className="expand flex-align-center">
              <div>{currentSynth} price</div>
            </div>
            <div className="weight-medium text-color-4">${numeral(priceUsd).format('0,0')}</div>
          </div>
          <div className="flex-align-baseline margin-bottom-2">
            <div className="expand flex-align-center">
              <div>{currentCollateral} price</div>
            </div>
            <div className="weight-medium text-color-4">${numeral(collateralPriceUsd).format('0,0')}</div>
          </div>
          <div className="flex-align-baseline margin-bottom-2">
            <div className="expand flex-align-center">
              <div>Global Utilization</div>
            </div>
            <div className="weight-medium text-color-4">{globalUtilization}%</div>
          </div>
        </div>
      </SideDisplay>
    </>
  );
};
