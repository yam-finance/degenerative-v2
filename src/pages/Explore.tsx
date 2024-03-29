import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SearchForm } from '@/components';
import { Page, Navbar, MainDisplay, MainHeading, SideDisplay, Table, TableRow, Loader } from '@/components';
import { MarketContext } from '@/contexts';
import { SynthGroups, isEmpty, formatForDisplay } from '@/utils';
import { useQuery } from '@/hooks';

interface ISynthGroupData {
  apr: number;
  totalLiquidity: number;
  totalMarketCap: number;
  totalTvl: number;
  totalVolume24h: number;
  numSynths: number;
  image: string;
}
interface ILegacyGroupData {
  apr: number;
  totalLiquidity: number;
  totalMarketCap: number;
  totalTvl: number;
  totalVolume24h: number;
  numSynths: number;
  image: string;
}

export const Explore = () => {
  const { loading, synthMetadata, synthMarketData } = useContext(MarketContext);
  const query = useQuery();

  const [searchTerm, setSearchTerm] = useState(query.get('search') ?? '');
  const [sidebarData, setSidebarData] = useState<string>('');
  const [synthGroupData, setSynthGroupData] = useState<Record<string, ISynthGroupData>>({});
  const [legacyGroupData, setLegacyGroupData] = useState<Record<string, ILegacyGroupData>>({});

  useEffect(() => {
    const AggregateSynthGroupData = () => {
      const aggregateData: Record<string, ISynthGroupData> = {};
      const aggregateLegacyData: Record<string, ILegacyGroupData> = {};
     

      console.log("synthMarketData = ", synthMarketData);
      Object.entries(synthMetadata)
        .filter(([synthName, synthInfo]) => synthName.toUpperCase().includes(searchTerm.toUpperCase()))
        .filter(([synthName, synthInfo])=>!synthInfo?.legacy)
        .forEach(([synthName, synthInfo]) => {
          // Loop through all synths in group, find cumulative data for display
          const { group } = synthInfo;
          console.log("synthInfo = ", synthInfo);
          console.log("namer = ", synthName)
          console.log("aggregateDataBefore = ", aggregateData);
          try {
            const marketData = synthMarketData[synthName];

            // Data brought from last loop iteration
            const currentData = aggregateData[group] ?? {
              apr: 0,
              aprMax: 0,
              totalLiquidity: 0,
              totalMarketCap: 0,
              totalTvl: 0,
              totalVolume24h: 0,
              numSynths: 0,
              image: '',
            };

            const apr = marketData.apr >= currentData.apr ? marketData.apr : currentData.apr;

            aggregateData[group] = {
              apr: apr,
              totalLiquidity: currentData.totalLiquidity + marketData.liquidity,
              totalMarketCap: currentData.totalMarketCap + marketData.marketCap,
              totalTvl: currentData.totalTvl + marketData.tvl,
              totalVolume24h: currentData.totalVolume24h + marketData.volume24h,
              numSynths: currentData.numSynths + 1,
              image: `/images/${SynthGroups[group].image}.png`,
            };
          } catch (err) {
            aggregateData[group] = {
              apr: 0,
              totalLiquidity: 0,
              totalMarketCap: 0,
              totalTvl: 0,
              totalVolume24h: 0,
              numSynths: 1,
              image: 'src/assets/images/Box-01.png',
            };
          }
        });
        Object.entries(synthMetadata)
        .filter(([synthName, synthInfo]) => synthName.toUpperCase().includes(searchTerm.toUpperCase()))
        .filter(([synthName, synthInfo])=>synthInfo?.legacy&&synthInfo?.legacy==true)
        .forEach(([synthName, synthInfo]) => {
          // Loop through all synths in group, find cumulative data for display
          const { group } = synthInfo;
        
         
          try {
            const marketData = synthMarketData[synthName];

            // Data brought from last loop iteration
            const currentData = aggregateLegacyData[group] ?? {
              apr: 0,
              aprMax: 0,
              totalLiquidity: 0,
              totalMarketCap: 0,
              totalTvl: 0,
              totalVolume24h: 0,
              numSynths: 0,
              image: '',
            };

            const apr = marketData.apr >= currentData.apr ? marketData.apr : currentData.apr;

            aggregateLegacyData[group] = {
              apr: apr,
              totalLiquidity: currentData.totalLiquidity + marketData.liquidity,
              totalMarketCap: currentData.totalMarketCap + marketData.marketCap,
              totalTvl: currentData.totalTvl + marketData.tvl,
              totalVolume24h: currentData.totalVolume24h + marketData.volume24h,
              numSynths: currentData.numSynths + 1,
              image: `/images/${SynthGroups[group].image}.png`,
            };
          } catch (err) {
            aggregateLegacyData[group] = {
              apr: 0,
              totalLiquidity: 0,
              totalMarketCap: 0,
              totalTvl: 0,
              totalVolume24h: 0,
              numSynths: 1,
              image: 'src/assets/images/Box-01.png',
            };
          }
        });
        console.log("aggregateData = ", aggregateLegacyData);
      setSynthGroupData(aggregateData);
      setLegacyGroupData(aggregateLegacyData);
    };
   console.log("legacy groupdata = ", legacyGroupData);

    if (!isEmpty(synthMetadata) && !isEmpty(synthMarketData)) AggregateSynthGroupData();
   
  }, [synthMarketData, searchTerm]);

  const SynthGroupBlock: React.FC<{ group: string }> = ({ group }) => {
    const { description } = SynthGroups[group];
    const { apr, image } = synthGroupData[group];

    const style = 'padding-8 flex-column-centered radius-xl box-shadow-large text-align-center relative w-inline-block margin-right-5';

    if (isEmpty(synthMarketData)) return <div className={style}>Loading...</div>;
    return (
      <Link  style={{ width: '100%' }} to={`/explore/${group}`} className={style} onMouseEnter={() => setSidebarData(group)}>
        <img src={image} loading="lazy" alt="" className="width-16" />
        <h5 className="margin-top-4">{group}</h5>
        <p className="text-small opacity-60">{description}</p>
        <div className="button button-small">{`${apr}% APR`}</div>
        {/*<div className="pill absolute-top-right margin-4">New</div>*/}
      </Link>
    );
  };

  const SynthGroupRow: React.FC<{ group: string }> = ({ group }) => {
    const { apr, totalLiquidity, totalMarketCap, image } = synthGroupData[group];
    const { description } = SynthGroups[group];

    return (
      <TableRow to={`/explore/${group}`} onMouseEnter={() => setSidebarData(group)}>
        <div className="flex-align-center portrait-width-full width-1-2">
          <div className="width-10 height-10 flex-align-center flex-justify-center radius-full background-white-50 margin-right-2">
            <img src={image} loading="lazy" className="margin-1 radius-full" />
          </div>
          <div>
            <div className="margin-right-1 text-color-4">{group}</div>
            <div className="text-xs opacity-50">{description}</div>
          </div>
        </div>
        <div></div>
        <div className="expand portrait-padding-y-2">
          <div className="text-color-4">{`${apr}%`}</div>
        </div>
        <div className="expand portrait-padding-y-2">
          <div className="text-color-4">${formatForDisplay(totalLiquidity)}</div>
        </div>
        <div className="expand portrait-padding-y-2">
          <div className="text-color-4">${formatForDisplay(totalMarketCap)}</div>
        </div>
      </TableRow>
    );
  };
  const LegacyGroupRow: React.FC<{ group: string }> = ({ group }) => {
    const { apr, totalLiquidity, totalMarketCap, image } = legacyGroupData[group];
    const { description } = SynthGroups[group];

    return (
      <TableRow to={`/explore/${group}`} onMouseEnter={() => setSidebarData(group)}>
        <div className="flex-align-center portrait-width-full width-1-2">
          <div className="width-10 height-10 flex-align-center flex-justify-center radius-full background-white-50 margin-right-2">
            <img src={image} loading="lazy" className="margin-1 radius-full" />
          </div>
          <div>
            <div className="margin-right-1 text-color-4">{group}</div>
            <div className="text-xs opacity-50">{description}</div>
          </div>
        </div>
        <div></div>
        <div className="expand portrait-padding-y-2">
          <div className="text-color-4">{`${apr}%`}</div>
        </div>
        <div className="expand portrait-padding-y-2">
          <div className="text-color-4">${formatForDisplay(totalLiquidity)}</div>
        </div>
        <div className="expand portrait-padding-y-2">
          <div className="text-color-4">${formatForDisplay(totalMarketCap)}</div>
        </div>
      </TableRow>
    );
  };

  const Sidebar: React.FC = () => {
    if (!synthGroupData[sidebarData]) return null;
    return (
      <>
        <h3 className="margin-bottom-1">${formatForDisplay(synthGroupData[sidebarData].totalTvl)}</h3>
        <div>Total Value Locked</div>
        <div className="margin-top-8">
          <div className="flex-align-baseline margin-bottom-2">
            <div className="expand flex-align-center">
              <div>Trading Volume</div>
            </div>
            <div className="weight-medium text-color-4">
              ${formatForDisplay(synthGroupData[sidebarData].totalVolume24h)}
            </div>
          </div>
          <div className="flex-align-baseline margin-bottom-2">
            <div className="expand flex-align-center">
              <div>Marketcap</div>
            </div>
            <div className="weight-medium text-color-4">
              ${formatForDisplay(synthGroupData[sidebarData].totalMarketCap)}
            </div>
          </div>
          <div className="flex-align-baseline margin-bottom-2">
            <div className="expand flex-align-center">
              <div>Total Synths</div>
            </div>
            <div className="weight-medium text-color-4">{synthGroupData[sidebarData].numSynths}</div>
          </div>
        </div>
      </>
    );
  };

  // TODO add loading spinner
  return (
    <Page>
      <Navbar />
      <MainDisplay>
        <MainHeading>Explore Synths</MainHeading>
        <div className="padding-x-8 flex-row margin-top-4 flex-wrap">
          <SearchForm
            setSearch={setSearchTerm}
            className="margin-0 margin-right-2 expand portrait-width-full portrait-margin-bottom-2 w-form"
          />
        </div>
        <div className="padding-x-8 flex-align-baseline" />
        {isEmpty(synthMarketData) ? (
          <Loader className="flex-align-center flex-justify-center padding-top-48" />
        ) : (
          <>
            <div className="flex-justify-center margin-x-8 margin-top-4">
              {Object.keys(synthGroupData).map((group, index) => {
               
                return <SynthGroupBlock group={group} key={index} />;
              })}
            </div>
            <Table headers={['Synth', 'APR', 'Liquidity', 'Market Cap']} headerClass={['width-1-2', '', '', '']}>
              {Object.keys(synthGroupData).map((group, index) => {
                return <SynthGroupRow group={group} key={index} />;
              })}
            </Table>
            <Table headers={['Legacy', '', '', '']} headerClass={['width-1-2', '', '', '']}>
              {Object.keys(legacyGroupData).map((group, index) => {
                return <LegacyGroupRow group={group} key={index} />;
              })}
            </Table>
          </>
        )}
      </MainDisplay>
      <SideDisplay>
        <Sidebar />
      </SideDisplay>
    </Page>
  );
};
