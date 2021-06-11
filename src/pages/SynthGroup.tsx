import React, { useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { UserContext, MarketContext, EthereumContext } from '@/contexts';
import { Page, Navbar, MainDisplay, MainHeading, SideDisplay, Table, Loader } from '@/components';
import { SynthGroups, isEmpty, getDailyPriceHistory, formatForDisplay } from '@/utils';
import chartLoader from '/src/assets/chart-loader.svg';

interface SynthParams {
  group: string;
}

interface ISynthGroupItem {
  name: string;
  maturity: number;
  apr: number;
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
  const [synthGroup, setSynthGroup] = useState<Record<string, ISynthGroupItem>>({});
  const [historicPriceData, setHistoricPriceData] = useState<{
    labels: string[];
    //synthPrices: Record<string, number[]>;
    synthPrices: number[];
    referencePrices: number[];
  }>();
  const [filterSynths, setFilterSynths] = useState<SynthTableFilter>('Live');
  const [synthInFocus, setSynthInFocus] = useState<string>('');

  // TODO redirect if type does not exist

  useEffect(() => {
    const initSynthGroups = () => {
      let selectedSynth: string | undefined;
      const synths: typeof synthGroup = {};

      Object.entries(synthMetadata)
        .filter((synth) => synth[1].group === group)
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
            apr: synthMarketData[synthName].apr, //TODO
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
    const getChartData = async () => setHistoricPriceData(await getDailyPriceHistory(synthMetadata[synthInFocus]));

    if (synthMetadata[synthInFocus] && chainId) getChartData();
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
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: '#FF0099',
          tension: 0.1,
        },
        {
          label: 'Reference',
          data: historicPriceData.referencePrices,
          borderColor: '#FFF',
          borderWidth: 1,
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
    const { name, maturity, apr, balance, liquidity, price } = props;
    const { cycle, year, group, collateral } = synthMetadata[name];

    return (
      <Link to={`/synths/${group}/${cycle}${year}`} className="table-row margin-y-2 w-inline-block">
        <div className="expand">
          <div className="margin-right-1 text-color-4">{name}</div>
          <div className="text-xs opacity-50">{maturity <= 0 ? 'Expired' : `${maturity} days to expiry`}</div>
        </div>
        <div className="expand portrait-hide">{balance}</div>
        <div className="expand portrait-padding-y-2">
          <div className="text-color-4">
            {price} {collateral}
          </div>
        </div>
        <div className="expand portrait-padding-y-2">
          <div className="text-color-4">{apr}%</div>
        </div>
        <div className="expand portrait-padding-y-2">
          <div className="text-color-4">${Number(liquidity) > 1 ? formatForDisplay(liquidity) : '0'}</div>
        </div>
      </Link>
    );
  };

  const TableFilter: React.FC = () => {
    const setFilter = (filter: SynthTableFilter) => {
      setSynthInFocus('');
      setFilterSynths(filter);
    };

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
        <div className="padding-x-8 flex-align-baseline">{SynthGroups[group].description}</div>
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
        <div className="flex-align-center">
          <img src={`/images/${SynthGroups[group].image}.png`} className="width-16 margin-right-4" />
          <div>
            <h5 className="margin-bottom-1">{group}</h5>
            <h6 className="margin-0">By {SynthGroups[group].creator}</h6>
          </div>
        </div>
        <p className="text-small margin-top-2">{SynthGroups[group].description}</p>
        <div>
          <a href="#" className="button-secondary button-small margin-right-4 w-button">
            Learn more
          </a>
          <a href="#" className="text-small weight-bold">
            See tutorial
          </a>
        </div>
      </SideDisplay>
    </Page>
  );
};
