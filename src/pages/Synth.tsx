import React, { useContext, useEffect, useState } from 'react';
import { useParams, NavLink } from 'react-router-dom';

import { useSynthActions } from '@/hooks/useSynthActions';
import { UserContext, MarketContext } from '@/contexts';
import { MainDisplay, MainHeading, Minter, PositionManager, SideDisplay } from '@/components';
import { ISynthInfo } from '@/types';
import { isEmpty } from '@/utils';

interface SynthParams {
  type: string;
  cycleYear: string;
  action: string;
}

export const Synth: React.FC = () => {
  const { type, cycleYear, action } = useParams<SynthParams>();
  const { currentSynth, setSynth } = useContext(UserContext);
  const { synthMetadata } = useContext(MarketContext);
  const actions = useSynthActions();
  const [{ cycle, year }, setSynthInfo] = useState({} as ISynthInfo);

  useEffect(() => {
    // TODO validate and redirect
    setSynth(`${type}-${cycleYear}`);
  }, []);

  useEffect(() => {
    if (currentSynth && !isEmpty(currentSynth)) setSynthInfo(synthMetadata[currentSynth]);
  }, [currentSynth]);

  const ActionSelector: React.FC = () => {
    return (
      <div className="padding-x-8 flex-row">
        <div className="tabs margin-right-2">
          {/*
          <NavLink to={`/synths/${type}/${cycle}${year}/mint`} className="tab large" activeClassName="active">
            Mint
          </NavLink>
          */}
          <NavLink to={`/synths/${type}/${cycle}${year}/manage`} className="tab large" activeClassName="active">
            Manage
          </NavLink>
          <NavLink to={`/synths/${type}/${cycle}${year}/trade`} className="tab large" activeClassName="active">
            Trade
          </NavLink>
          <NavLink to={`/synths/${type}/${cycle}${year}/lp`} className="tab large" activeClassName="active">
            LP
          </NavLink>
        </div>
      </div>
    );
  };

  const Action: React.FC = () => {
    switch (action) {
      case 'mint':
        return <Minter />;
      case 'manage':
        return <PositionManager />;
      //case 'trade':
      //  return <Trade />
      //case 'lp':
      //  return <Lp />
      default:
        return null;
    }
  };

  if (!currentSynth) return null;
  return (
    <>
      <MainDisplay>
        <MainHeading>{`${type} ${cycle}${year}`}</MainHeading>
        <ActionSelector />
        <div className="border-bottom-1px margin-x-8 margin-y-4"></div>
        <Action />
      </MainDisplay>
      <SideDisplay></SideDisplay>
    </>
  );
};
