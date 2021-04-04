import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SearchForm } from '@/components';
import { MainDisplay, MainHeading, SideDisplay, Table, TableRow } from '@/components';
import { ISynthInfo, IMap } from '@/types';
import { MarketContext } from '@/contexts';
import { SynthInfo, SynthCopy, isEmpty, formatForDisplay } from '@/utils';
import { useQuery } from '@/hooks';
import box from '@/assets/Box-01.png';

interface ISynthTypeData {
  aprMin: number;
  aprMax: number;
  totalLiquidity: number;
  totalMarketCap: number;
}

export const Explore = () => {
  const { synthMarketData } = useContext(MarketContext);
  const query = useQuery();

  const [searchTerm, setSearchTerm] = useState(query.get('search') ?? '');
  const [sidebarSynth, setSidebarSynth] = useState();
  const [synthTypeData, setSynthTypeData] = useState<IMap<ISynthTypeData>>({});

  useEffect(() => {
    const AggregateSynthTypeData = () => {
      const aggregateData: IMap<ISynthTypeData> = {};

      Object.entries(SynthInfo)
        .filter(([synthName, synthInfo]) => synthName.toUpperCase().includes(searchTerm.toUpperCase()))
        .forEach(([synthName, synthInfo]) => {
          const { type } = synthInfo;
          const marketData = synthMarketData[synthName];
          const currentData = aggregateData[synthName];

          aggregateData[type] = {
            aprMin: Math.min(currentData?.aprMin ?? Infinity, Number(marketData.apr)),
            aprMax: Math.max(currentData?.aprMin ?? -Infinity, Number(marketData.apr)),
            totalLiquidity: currentData?.totalLiquidity ?? 0 + Number(marketData.liquidity),
            totalMarketCap: currentData?.totalMarketCap ?? 0 + Number(marketData.marketCap),
          };
        });

      setSynthTypeData(aggregateData);
    };

    if (synthMarketData && !isEmpty(synthMarketData)) AggregateSynthTypeData();
  }, [synthMarketData, searchTerm]);

  const SynthBlock: React.FC<{ type: string }> = ({ type }) => {
    //const { type, cycle, year } = SynthInfo[name];
    const description = SynthCopy[type];
    const { aprMin, aprMax } = synthTypeData[type];

    const style = 'padding-8 flex-column-centered radius-xl box-shadow-large text-align-center relative w-inline-block';

    // TODO add description, APY, and set sidebar
    if (!synthTypeData[type]) return <div className={style}>Loading...</div>;
    return (
      <Link to={`/synths/${type}`} className={style}>
        <img src={box} loading="lazy" alt="" className="width-16" />
        <h5 className="margin-top-4">{type}</h5>
        <p className="text-small opacity-60">{description}</p>
        <div className="button button-small">
          {aprMin}-{aprMax}% APR
        </div>{' '}
        {/* TODO */}
        <div className="pill absolute-top-right margin-4">New</div>
      </Link>
    );
  };

  const SynthTableRow: React.FC<{ type: string }> = ({ type }) => {
    const { aprMin, aprMax, totalLiquidity, totalMarketCap } = synthTypeData[type];
    const description = SynthCopy[type];

    if (!synthTypeData[type]) return <TableRow>Loading...</TableRow>;
    return (
      <TableRow to={`/synths/${type}`}>
        <div className="flex-align-center portrait-width-full width-1-2">
          <div className="width-10 height-10 flex-align-center flex-justify-center radius-full background-white-50 margin-right-2">
            <img src={box} loading="lazy" alt="" className="width-6" />
          </div>
          <div>
            <div className="margin-right-1 text-color-4">{type}</div>
            <div className="text-xs opacity-50">{description}</div>
          </div>
        </div>
        <div className="expand portrait-padding-y-2">
          <div className="text-color-4">
            {aprMin}-{aprMax}%
          </div>
        </div>
        <div className="expand portrait-padding-y-2">
          <div className="text-color-4">{formatForDisplay(totalLiquidity)}</div>
        </div>
        <div className="expand portrait-padding-y-2">
          <div className="text-color-4">{formatForDisplay(totalMarketCap)}</div>
        </div>
      </TableRow>
    );
  };

  // TODO add loading spinner
  //if (isEmpty(synthTypeData)) return null;
  return (
    <>
      <MainDisplay>
        <MainHeading>Explore Synths</MainHeading>
        <div className="padding-x-8 flex-row margin-top-4 flex-wrap">
          <SearchForm setSearch={setSearchTerm} className="margin-0 margin-right-2 expand portrait-width-full portrait-margin-bottom-2 w-form" />
        </div>
        <div className="padding-x-8 flex-align-baseline"></div>
        <div className="grid-3-columns margin-x-8 margin-top-4">
          {Object.keys(synthTypeData).map((type, index) => {
            return <SynthBlock type={type} key={index} />;
          })}
        </div>
        <Table headers={['Synth', 'APY', 'Liquidity', 'Market Cap']} headerClass={['width-1-2', '', '', '']}>
          {Object.keys(synthTypeData).map((type, index) => {
            return <SynthTableRow type={type} key={index} />;
          })}
        </Table>
      </MainDisplay>
      <SideDisplay></SideDisplay>
    </>
  );
};
