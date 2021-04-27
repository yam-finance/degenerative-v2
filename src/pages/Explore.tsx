import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SearchForm } from '@/components';
import { MainDisplay, MainHeading, SideDisplay, Table, TableRow } from '@/components';
import { IMap } from '@/types';
import { MarketContext } from '@/contexts';
import { SynthTypes, isEmpty, formatForDisplay } from '@/utils';
import { useQuery } from '@/hooks';
import box from '@/assets/Box-01.png';

interface ISynthTypeData {
  aprMin: number;
  aprMax: number;
  totalLiquidity: number;
  totalMarketCap: number;
  totalTvl: number;
  totalVolume24h: number;
  numSynths: number;
}

export const Explore = () => {
  const { loading, synthMetadata, synthMarketData } = useContext(MarketContext);
  const query = useQuery();

  const [searchTerm, setSearchTerm] = useState(query.get('search') ?? '');
  const [sidebarData, setSidebarData] = useState<string>('');
  const [synthTypeData, setSynthTypeData] = useState<IMap<ISynthTypeData>>({});

  useEffect(() => {
    const AggregateSynthTypeData = () => {
      const aggregateData: IMap<ISynthTypeData> = {};

      Object.entries(synthMetadata)
        .filter(([synthName, synthInfo]) => synthName.toUpperCase().includes(searchTerm.toUpperCase()))
        .forEach(([synthName, synthInfo]) => {
          console.log(synthName);
          const { type } = synthInfo;
          const marketData = synthMarketData[synthName];
          const currentData = aggregateData[type] ?? {
            aprMin: Infinity,
            aprMax: 0,
            totalLiquidity: 0,
            totalMarketCap: 0,
            totalTvl: 0,
            totalVolume24h: 0,
            numSynths: 0,
          };

          aggregateData[type] = {
            aprMin: Math.min(currentData.aprMin, Number(marketData.apr)),
            aprMax: Math.max(currentData.aprMax, Number(marketData.apr)),
            totalLiquidity: currentData.totalLiquidity + Number(marketData.liquidity),
            totalMarketCap: currentData.totalMarketCap + Number(marketData.marketCap),
            totalTvl: currentData.totalTvl + Number(marketData.tvl),
            totalVolume24h: currentData.totalVolume24h + Number(marketData.volume24h),
            numSynths: currentData.numSynths + 1,
          };
        });

      setSynthTypeData(aggregateData);
    };

    console.log(synthMetadata);
    console.log(synthMarketData);
    if (!isEmpty(synthMetadata) && !isEmpty(synthMarketData)) AggregateSynthTypeData();
  }, [synthMarketData, searchTerm]);

  const SynthBlock: React.FC<{ type: string }> = ({ type }) => {
    const description = SynthTypes[type].description;
    const { aprMin, aprMax } = synthTypeData[type];

    const style = 'padding-8 flex-column-centered radius-xl box-shadow-large text-align-center relative w-inline-block';

    if (isEmpty(synthMarketData)) return <div className={style}>Loading...</div>;
    return (
      <Link to={`/synths/${type}`} className={style} onMouseEnter={() => setSidebarData(type)}>
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
    const description = SynthTypes[type].description;

    if (isEmpty(synthMarketData)) return <TableRow>Loading...</TableRow>;
    return (
      <TableRow to={`/synths/${type}`} onMouseEnter={() => setSidebarData(type)}>
        <div className="flex-align-center portrait-width-full width-1-2">
          <div className="width-10 height-10 flex-align-center flex-justify-center radius-full background-white-50 margin-right-2">
            <img src={box} loading="lazy" alt="" className="width-6" />
          </div>
          <div>
            <div className="margin-right-1 text-color-4">{type}</div>
            <div className="text-xs opacity-50">{description}</div>
          </div>
        </div>
        <div></div>
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

  const Sidebar: React.FC = () => {
    if (!sidebarData) return null;
    return (
      <>
        <h3 className="margin-bottom-1">${formatForDisplay(synthTypeData[sidebarData].totalTvl)}</h3>
        <div>Total Value Locked</div>
        <div className="margin-top-8">
          <div className="flex-align-baseline margin-bottom-2">
            <div className="expand flex-align-center">
              <div>Synth Trading Volume</div>
            </div>
            <div className="weight-medium text-color-4">${formatForDisplay(synthTypeData[sidebarData].totalVolume24h)}</div>
          </div>
          <div className="flex-align-baseline margin-bottom-2">
            <div className="expand flex-align-center">
              <div>Synth Marketcap</div>
            </div>
            <div className="weight-medium text-color-4">${formatForDisplay(synthTypeData[sidebarData].totalMarketCap)}</div>
          </div>
          <div className="flex-align-baseline margin-bottom-2">
            <div className="expand flex-align-center">
              <div>Total Synths</div>
            </div>
            <div className="weight-medium text-color-4">{synthTypeData[sidebarData].numSynths}</div>
          </div>
        </div>
      </>
    );
  };

  // TODO add loading spinner
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
        <Table headers={['Synth', 'APR', 'Liquidity', 'Market Cap']} headerClass={['width-1-2', '', '', '']}>
          {Object.keys(synthTypeData).map((type, index) => {
            return <SynthTableRow type={type} key={index} />;
          })}
        </Table>
      </MainDisplay>
      <SideDisplay>
        <Sidebar />
      </SideDisplay>
    </>
  );
};
