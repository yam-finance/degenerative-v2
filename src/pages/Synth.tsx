import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router';

import { useSynthActions } from '@/hooks/useSynthActions';
import { UserContext } from '@/contexts';
import { MainDisplay, MainHeading, Minter, SideDisplay } from '@/components';
import { ISynthMetadata } from '@/types';
import { isEmpty } from '@/utils';

interface SynthParams {
  group: string;
  synthName: string;
}

const Synth: React.FC = () => {
  const { group, synthName } = useParams<SynthParams>();
  const { currentSynth, setSynth } = useContext(UserContext);
  const actions = useSynthActions();
  const [{ type, cycle, year }, setMetadata] = useState({} as ISynthMetadata);

  useEffect(() => {
    if (!currentSynth) setSynth(`${group}${synthName}`.toUpperCase());
  }, []);

  useEffect(() => {
    if (!currentSynth || isEmpty(currentSynth)) return;
    setMetadata(currentSynth.metadata);
  }, [currentSynth]);

  const ActionSelector: React.FC = () => {
    return (
      <div className="padding-x-8 flex-row">
        <div className="tabs margin-right-2">
          <a href="#" className="tab large active">
            Mint
          </a>
          <a href="#" className="tab large">
            Manage
          </a>
          <a href="#" className="tab large">
            Trade
          </a>
          <a href="#" className="tab large">
            LP
          </a>
        </div>
      </div>
    );
  };

  if (!currentSynth) return null;
  return (
    <>
      <MainDisplay>
        <MainHeading>{`${type} ${cycle}${year}`}</MainHeading>
        <ActionSelector />
        <div className="border-bottom-1px margin-x-8 margin-y-4"></div>
        <Minter />
      </MainDisplay>
      <SideDisplay></SideDisplay>
    </>
  );
};

export default Synth;
