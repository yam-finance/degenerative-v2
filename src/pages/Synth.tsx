import React, { useContext, useEffect, useState } from 'react';
import { useParams, NavLink } from 'react-router-dom';

import { useSynthActions } from '@/hooks/useSynthActions';
import { UserContext } from '@/contexts';
import { MainDisplay, MainHeading, Minter, SideDisplay } from '@/components';
import { ISynthInfo } from '@/types';
import { isEmpty } from '@/utils';

interface SynthParams {
  type: string;
  name: string;
  action: string;
}

export const Synth: React.FC = () => {
  const { type, name, action } = useParams<SynthParams>();
  const { currentSynth, setSynth } = useContext(UserContext);
  const actions = useSynthActions();
  const [{ cycle, year }, setSynthInfo] = useState({} as ISynthInfo);

  useEffect(() => {
    setSynth(`${type}-${name}`);
  }, []);

  useEffect(() => {
    if (!currentSynth || isEmpty(currentSynth)) return;
    setSynthInfo(currentSynth);
  }, [currentSynth]);

  const ActionSelector: React.FC = () => {
    return (
      <div className="padding-x-8 flex-row">
        <div className="tabs margin-right-2">
          <NavLink to={`/synths/${type}/${cycle}${year}/mint`} className="tab large" activeClassName="active">
            Mint
          </NavLink>
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
      //case 'manage':
      //  return <Manage />
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
