import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { IMap } from '@/types';

interface SynthPriceChartProps {
  synthNames: string[];
}

const SynthPriceChart: React.FC<SynthPriceChartProps> = ({ synthNames }) => {
  const [synthPrices, setSynthPrices] = useState<IMap<number[]>>();

  useEffect(() => {
    getHistoricPriceData();

    return () => {
      // TODO clean up price data in state
    };
  }, []);

  const getHistoricPriceData = () => {};

  return <div className="width-full margin-y-2 w-embed w-script"></div>;
};
