import React, { useContext, useEffect, useState } from 'react';
import { useParams, NavLink } from 'react-router-dom';

import { useSynthActions } from '@/hooks/useSynthActions';
import { UserContext } from '@/contexts';
import { MainDisplay, MainHeading, Minter, SideDisplay } from '@/components';
import { ISynthMetadata } from '@/types';
import { isEmpty } from '@/utils';

interface SynthParams {
  group: string;
  synthName: string;
  action: string;
}

const Synth: React.FC = () => {
  const { group, synthName, action } = useParams<SynthParams>();
  const { currentSynth, setSynth } = useContext(UserContext);
  const actions = useSynthActions();
  const [{ type, cycle, year }, setMetadata] = useState({} as ISynthMetadata);

  useEffect(() => {
    setSynth(`${group}${synthName}`.toUpperCase());
  }, []);

  useEffect(() => {
    if (!currentSynth || isEmpty(currentSynth)) return;
    setMetadata(currentSynth.metadata);
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
    console.log(action);
    switch (action) {
      case 'mint':
        return <Minter />;
      case 'manage':
      case 'trade':
      case 'lp':
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

export default Synth;
