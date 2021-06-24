import React, { useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { UserContext, MarketContext, EthereumContext } from '@/contexts';
import { Page, Navbar, MainDisplay, MainHeading, SideDisplay, Table, Loader, Icon } from '@/components';
import { SynthGroups, isEmpty, getDailyPriceHistory, formatForDisplay } from '@/utils';
import chartLoader from '@/assets/chart-loader.svg';
import { ISynthGroup } from '@/types';

interface SynthParams {
  group: string;
}

interface ISynthGroupItem {
  name: string;
  maturity: number;
  apr: number;
  aprAt2: number;
  balance: number;
  liquidity: number;
  price: number;
}

type SynthTableFilter = 'Live' | 'Expired' | 'All';

export const SynthGroup: React.FC = () => {
  const { synthsInWallet } = useContext(UserContext);
  const { chainId } = useContext(EthereumContext);
  const { synthMetadata, synthMarketData } = useContext(MarketContext);
  const { group } = useParams<SynthParams>();

  const [groupInfo, setGroupInfo] = useState<ISynthGroup>();
  const [synthGroup, setSynthGroup] = useState<Record<string, ISynthGroupItem>>({});
  const [historicPriceData, setHistoricPriceData] = useState<{
    labels: string[];
    //synthPrices: Record<string, number[]>;
    synthPrices: number[];
    referencePrices: number[];
  }>();
  const [filterSynths, setFilterSynths] = useState<SynthTableFilter>('Live');
  const [synthInFocus, setSynthInFocus] = useState<string>('');

  const learnMoreLink = `https://yam.gitbook.io/explore/synthetic-tokens/${group.toLowerCase()}`;
  // TODO redirect if type does not exist

  useEffect(() => {
    const initSynthGroups = () => {
      let selectedSynth: string | undefined;
      const synths: typeof synthGroup = {};

      Object.entries(synthMetadata)
        .filter(([synthName, synthInfo]) => synthInfo.group.toLowerCase() === group.toLowerCase())
        .filter(([synthName, synthInfo]) => {
          if (filterSynths === 'All') {
            return true;
          } else if (filterSynths === 'Live') {
            return !synthMarketData[synthName].isExpired;
          } else {
            return synthMarketData[synthName].isExpired;
          }
        })
        .forEach(([synthName, synthInfo]) => {
          if (!selectedSynth) selectedSynth = synthName;
          const maturity = synthMarketData[synthName].daysTillExpiry;
          synths[synthName] = {
            name: synthName,
            maturity: maturity,
            apr: synthMarketData[synthName].apr,
            aprAt2: synthMarketData[synthName].aprAt2,
            // TODO should be showing minted positions
            balance: synthsInWallet.find((el) => el.name === synthName)?.tokenAmount ?? 0,
            liquidity: synthMarketData[synthName].liquidity, // TODO
            price: synthMarketData[synthName].price, // TODO
          };
        });
      if (selectedSynth) setSynthInFocus(selectedSynth);
      setSynthGroup(synths);
    };

    if (!isEmpty(synthMarketData)) initSynthGroups();
  }, [synthMarketData, filterSynths]);

  useEffect(() => {
    if (!isEmpty(SynthGroups[group])) {
      setGroupInfo(SynthGroups[group]);
    }
  }, [group, SynthGroups]);

  useEffect(() => {
    const getChartData = async () => setHistoricPriceData(await getDailyPriceHistory(synthMetadata[synthInFocus]));

    if (synthMetadata[synthInFocus] && chainId && !historicPriceData) getChartData();
  }, [synthMetadata, synthInFocus]);

  const Chart: React.FC = () => {
    if (!historicPriceData) return null;

    console.log(historicPriceData);
    const data = {
      labels: historicPriceData.labels,
      datasets: [
        {
          label: synthInFocus,
          data: historicPriceData.synthPrices,
          borderColor: '#FF0099',
          borderWidth: 1,
          backgroundColor: '#FF0099',
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: '#FF0099',
          tension: 0.1,
        },
        {
          label: 'Reference',
          data: historicPriceData.referencePrices,
          borderColor: '#FFF',
          borderWidth: 2,
          backgroundColor: '#FFF',
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: '#FF0099',
          tension: 0.1,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      tooltips: {
        //mode: 'index', // TODO this breaks build, but is needed
        intersect: false,
        backgroundColor: '#191053',
        titleFontFamily: 'Open Sauce',
        titleFontColor: 'rgba(255,255,255,0.5)',
        titleFontStyle: 'normal',
        titleMarginBottom: 8,
        bodyFontFamily: 'Open Sauce',
        bodyFontStyle: '400',
        bodySpacing: 4,
        xPadding: 8,
        yPadding: 8,
        cornerRadius: 8,
        caretSize: 0,
      },
      layout: {
        padding: {
          left: 5,
          right: 5,
          bottom: -10,
        },
      },
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: false,
              display: true,
              fontColor: 'rgba(255,255,255,0.5)',
            },
            gridLines: {
              drawBorder: false,
              borderDash: [4, 4],
              color: 'rgba(255,255,255,0.1)',
              zeroLineWidth: 0,
            },
          },
        ],
        xAxes: [
          {
            ticks: {
              display: false,
            },
            gridLines: {
              display: false,
              drawBorder: false,
            },
          },
        ],
      },
    };

    const legend = {
      display: true,
      labels: {
        fontColor: '#FFF',
      },
    };

    return <Line data={data} height={300} options={options} legend={legend} />;
  };

  const SynthGroupRow: React.FC<ISynthGroupItem> = (props) => {
    const { name, maturity, apr, aprAt2, balance, liquidity, price } = props;
    const { cycle, year, group, collateral } = synthMetadata[name];

    // TODO remove?
    const rowStyle = {
      backgroundColor: '#ec6ead',
      // TODO what to do with this?
      //backgroundImage:
      //  '-webkit-gradient(linear, left top, left bottom, from(rgba(243, 85, 201, 0)), color stop(5%, #ff8a97), color-stop(46%, #ec6ead), to(#ce34aa))',
      //backgroundImage: 'linear-gradient(180deg, rgba(243, 85, 201, 0), #ff8a97 5%, #ec6ead 46%, #ce34aa)',
      //boxShadow:
      //  'inset 0 0 8px 4px #ec6ead, 0 8px 16px -4px rgba(236, 110, 173, 0.2), 0 16px 32px -8px rgba(236, 110, 173, 0.2)',
    };

    return (
      <Link
        to={`/explore/${group}/${cycle}${year}`}
        //style={rowStyle}
        className="hover-scale table-row margin-y-2 w-inline-block relative"
      >
        <div className="expand">
          <div className="margin-right-1 text-color-4">{name}</div>
          <div className="text-xs opacity-50">{maturity <= 0 ? 'Expired' : `${maturity} days to expiry`}</div>
        </div>
        <div className="expand portrait-hide">{balance}</div>
        <div className="expand portrait-padding-y-2">
          <div className="text-color-4">
            {price} {collateral}
          </div>
          <div className="text-xs opacity-50 hide portrait-block">Price</div>
        </div>
        <div className="expand portrait-padding-y-2">
          <div className="text-color-4">
            {apr}% - {aprAt2}%
          </div>
          <div className="text-xs opacity-50 hide portrait-block">APR</div>
        </div>
        <div className="expand portrait-padding-y-2">
          <div className="text-color-4">${Number(liquidity) > 1 ? formatForDisplay(liquidity) : '0'}</div>
          <div className="text-xs opacity-50 hide portrait-block">Liquidity</div>
        </div>
        <div className="width-8 height-8 absolute-right margin-top-5 margin-right-5 radius-full padding-1 background-color-white">
          <Icon name="ChevronRight" className="icon opacity-100 text-color-1 margin-0" />
        </div>
      </Link>
    );
  };

  const TableFilter: React.FC = () => {
    return (
      <div className="padding-x-5 flex-row">
        <div className="tabs">
          <div className={`tab ${filterSynths === 'Live' && 'active'}`} onClick={() => setFilterSynths('Live')}>
            Live
          </div>
          <div className={`tab ${filterSynths === 'Expired' && 'active'}`} onClick={() => setFilterSynths('Expired')}>
            Expired
          </div>
          <div className={`tab ${filterSynths === 'All' && 'active'}`} onClick={() => setFilterSynths('All')}>
            All
          </div>
        </div>
      </div>
    );
  };

  const ChartSelector: React.FC = () => {
    if (isEmpty(synthGroup)) {
      return (
        <div className="tabs">
          <div className="tab">No synths available</div>
        </div>
      );
    }
    return (
      <div className="tabs portrait-margin-top-1">
        {Object.keys(synthGroup).map((synthName, index) => {
          return (
            <div
              className={`tab ${synthInFocus === synthName && 'active'}`}
              onClick={() => setSynthInFocus(synthName)}
              key={index}
            >
              {synthName}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Page>
      <Navbar />
      <MainDisplay>
        <MainHeading className="margin-bottom-1">{group}</MainHeading>
        {groupInfo && <div className="padding-x-8 flex-align-baseline">{groupInfo.description}</div>}
        <div className="padding-x-8 padding-y-1 flex-row portrait-flex-column portrait-flex-align-start">
          <ChartSelector />
        </div>

        <div style={{ width: '100%', height: '300px' }} className="relative width-full margin-y-2 w-embed w-script">
          {historicPriceData ? <Chart /> : <img className="chart-loader pulse" src={chartLoader} />}
        </div>

        <div className="flex-align-baseline margin-top-8">
          <h5 className="margin-left-8 text-medium">Available Synths</h5>
          <TableFilter />
        </div>
        <Table headers={['Maturity', 'Your Balance', 'Price', 'APR', 'Liquidity']}>
          {Object.keys(synthGroup).length > 0 ? (
            Object.entries(synthGroup).map(([name, synth], index) => {
              return <SynthGroupRow {...synth} key={index} />;
            })
          ) : (
            <div className="table-row margin-y-2 w-inline-block">There are no synths in this group</div>
          )}
        </Table>
      </MainDisplay>
      <SideDisplay>
        {groupInfo && (
          <>
            <div className="flex-align-center">
              <img src={`/images/${groupInfo.image}.png`} className="width-16 margin-right-4" />
              <div>
                <h5 className="margin-bottom-1">{group}</h5>
              </div>
            </div>
            <p className="text-small margin-top-2">{groupInfo.description}</p>
            <div>
              <a
                href={learnMoreLink}
                target="_blank"
                rel="noreferrer"
                className="button-secondary button-small margin-right-4 w-button"
              >
                Learn more
              </a>
              <a
                href="https://yam.gitbook.io/explore/overview/how-do-i-use-synths"
                target="_blank"
                rel="noreferrer"
                className="text-small weight-bold"
              >
                See tutorial
              </a>
            </div>
          </>
        )}
      </SideDisplay>
    </Page>
  );
};
