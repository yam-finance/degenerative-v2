import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SearchForm } from '@/components';
import { Page, Navbar, MainDisplay, MainHeading, SideDisplay, Table, TableRow, Loader } from '@/components';
import { MarketContext } from '@/contexts';
import { SynthGroups, isEmpty, formatForDisplay } from '@/utils';
import { useQuery } from '@/hooks';

interface ISynthGroupData {
  aprMin: number;
  aprMax: number;
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

  useEffect(() => {
    const AggregateSynthGroupData = () => {
      const aggregateData: Record<string, ISynthGroupData> = {};

      Object.entries(synthMetadata)
        .filter(([synthName, synthInfo]) => synthName.toUpperCase().includes(searchTerm.toUpperCase()))
        .forEach(([synthName, synthInfo]) => {
          const { group } = synthInfo;
          try {
            const marketData = synthMarketData[synthName];
            const currentData = aggregateData[group] ?? {
              aprMin: Infinity,
              aprMax: 0,
              totalLiquidity: 0,
              totalMarketCap: 0,
              totalTvl: 0,
              totalVolume24h: 0,
              numSynths: 0,
              image: '',
            };

            aggregateData[group] = {
              aprMin: Math.min(currentData.aprMin, Number(marketData.apr)),
              aprMax: Math.max(currentData.aprMax, Number(marketData.apr)),
              totalLiquidity: currentData.totalLiquidity + Number(marketData.liquidity),
              totalMarketCap: currentData.totalMarketCap + Number(marketData.marketCap),
              totalTvl: currentData.totalTvl + Number(marketData.tvl),
              totalVolume24h: currentData.totalVolume24h + Number(marketData.volume24h),
              numSynths: currentData.numSynths + 1,
              image: `/images/${SynthGroups[group].image}.png`,
            };
          } catch (err) {
            aggregateData[group] = {
              aprMin: 0,
              aprMax: 0,
              totalLiquidity: 0,
              totalMarketCap: 0,
              totalTvl: 0,
              totalVolume24h: 0,
              numSynths: 1,
              image: 'src/assets/images/Box-01.png',
            };
          }
        });

      setSynthGroupData(aggregateData);
    };

    if (!isEmpty(synthMetadata) && !isEmpty(synthMarketData)) AggregateSynthGroupData();
  }, [synthMarketData, searchTerm]);

  const SynthGroupBlock: React.FC<{ group: string }> = ({ group }) => {
    const { description } = SynthGroups[group];
    const { aprMin, aprMax, image } = synthGroupData[group];

    const style = 'padding-8 flex-column-centered radius-xl box-shadow-large text-align-center relative w-inline-block';

    if (isEmpty(synthMarketData)) return <div className={style}>Loading...</div>;
    return (
      <Link to={`/synths/${group}`} className={style} onMouseEnter={() => setSidebarData(group)}>
        <img src={image} loading="lazy" alt="" className="width-16" />
        <h5 className="margin-top-4">{group}</h5>
        <p className="text-small opacity-60">{description}</p>
        <div className="button button-small">
          <span className="opacity-60">Up to </span>
          {`${aprMax}% APR`}
        </div>{' '}
        {/* TODO */}
        <div className="pill absolute-top-right margin-4">New</div>
      </Link>
    );
  };

  const SynthGroupRow: React.FC<{ group: string }> = ({ group }) => {
    const { aprMin, aprMax, totalLiquidity, totalMarketCap, image } = synthGroupData[group];
    const { description } = SynthGroups[group];

    return (
      <TableRow to={`/synths/${group}`} onMouseEnter={() => setSidebarData(group)}>
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
          <div className="text-color-4">
            <span className="opacity-50">Up to </span>
            {`${aprMax}%`}
          </div>
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
            <div className="grid-3-columns margin-x-8 margin-top-4">
              {Object.keys(synthGroupData).map((group, index) => {
                return <SynthGroupBlock group={group} key={index} />;
              })}
            </div>
            <Table headers={['Synth', 'APR', 'Liquidity', 'Market Cap']} headerClass={['width-1-2', '', '', '']}>
              {Object.keys(synthGroupData).map((group, index) => {
                return <SynthGroupRow group={group} key={index} />;
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
