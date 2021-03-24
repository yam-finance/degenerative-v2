import React, { useContext, useEffect } from 'react';
import { useParams } from 'react-router';

import { useSynthActions } from '@/hooks/useSynthActions';
import { UserContext } from '@/contexts';

interface SynthParams {
  type: string;
}

const Synth: React.FC = () => {
  const { currentSynth, setSynth } = useContext(UserContext);
  const type = useParams<SynthParams>();

  useEffect(() => {
    //setSynth(synthName);
  }, []);

  return <div></div>;
};

export default Synth;
