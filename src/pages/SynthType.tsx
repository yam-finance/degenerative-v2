import React, { useContext, useEffect, useState } from 'react';
import { Link, Redirect, useParams } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { UserContext, MarketContext } from '@/contexts';
import { MainDisplay, MainHeading, SideDisplay, Table } from '@/components';
import { SynthInfo, SynthTypes, isEmpty, getDailyPriceHistory, formatForDisplay } from '@/utils';
import { IMap } from '@/types';
import chartLoader from '@/assets/chart-loader.svg';

interface SynthParams {
  type: string;
}

interface ISynthTypeItem {
  name: string;
  maturity: number;
  apy: string;
  balance: string;
  liquidity: string;
  price: string;
}

type SynthTableFilter = 'Live' | 'Expired' | 'All';

export const SynthType: React.FC = () => {
  const { synthsInWallet } = useContext(UserContext);
  const { synthMarketData } = useContext(MarketContext);
  const { type } = useParams<SynthParams>();
  const [synthGroup, setSynthGroup] = useState<Record<string, ISynthTypeItem>>({});
  const [historicPriceData, setHistoricPriceData] = useState<{
    labels: string[];
    synthPrices: IMap<number[]>;
  }>();
  const [filterSynths, setFilterSynths] = useState<SynthTableFilter>('All');
  const [synthInFocus, setSynthInFocus] = useState<string>('');

  // TODO redirect if type does not exist

  useEffect(() => {
    const initSynthTypes = () => {
      let selectedSynth: string | undefined;
      const synths: typeof synthGroup = {};
      Object.entries(SynthInfo)
        .filter((synth) => synth[1].type === type)
        .filter(([synthName, synthInfo]) => {
          if (filterSynths === 'All') {
            return true;
          } else if (filterSynths === 'Live') {
            return synthMarketData[synthName].daysTillExpiry > 0;
          } else {
            return synthMarketData[synthName].daysTillExpiry <= 0;
          }
        })
        .forEach(([synthName, synthInfo]) => {
          if (!selectedSynth) selectedSynth = synthName;
          const maturity = synthMarketData[synthName].daysTillExpiry;
          synths[synthName] = {
            name: synthName,
            maturity: maturity,
            apy: synthMarketData[synthName].apr, //TODO
            // TODO should be showing minted positions
            balance: synthsInWallet.find((el) => el.name === synthName)?.tokenAmount ?? '0',
            liquidity: synthMarketData[synthName].liquidity, // TODO
            price: synthMarketData[synthName].price, // TODO
          };
        });
      if (selectedSynth) setSynthInFocus(selectedSynth);
      setSynthGroup(synths);
    };

    if (!isEmpty(synthMarketData)) initSynthTypes();
  }, [synthMarketData, filterSynths]);

  useEffect(() => {
    const getChartData = async () => setHistoricPriceData(await getDailyPriceHistory(type));

    getChartData();
  }, []);

  const Chart: React.FC = () => {
    if (!historicPriceData) return null;

    console.log(historicPriceData);
    const data = (canvas) => {
      var ctx = document.getElementById('gas').getContext('2d');
      
      var gradientFill = ctx.createLinearGradient(0, 0, 0, 300);
      gradientFill.addColorStop(0, "rgba(255, 255, 255, 0.2)");
      gradientFill.addColorStop(1, "rgba(255, 255, 255, 0)");
      
      Chart.defaults.LineWithLine = Chart.defaults.line;
      Chart.controllers.LineWithLine = Chart.controllers.line.extend({
        draw: function(ease) {
          Chart.controllers.line.prototype.draw.call(this, ease);
          
          if (this.chart.tooltip._active && this.chart.tooltip._active.length) {
            var activePoint = this.chart.tooltip._active[0],
              ctx = this.chart.ctx,
              x = activePoint.tooltipPosition().x,
              topY = this.chart.legend.bottom,
              bottomY = this.chart.chartArea.bottom;
            
            // draw line
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x, topY);
            ctx.lineTo(x, bottomY);
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(255,255,255,0.4)';
            ctx.stroke();
            ctx.restore();
          }
        }
      });
      
      return {
        labels: historicPriceData.labels,
        datasets: Object.entries(historicPriceData.synthPrices)
          .filter(([name, prices]) => {
            return name === synthInFocus || name === 'Reference';
          }) // TODO
          .map(([name, prices]) => ({
            label: name,
            data: prices,
            backgroundColor: name === 'Reference' ? gradientFill : 'transparent',
            borderColor: name === 'Reference' ? '#fff' : '#FF0099',
            borderWidth: 1,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: '#FF0099',
            tension: 0.1,
          })),
      }
    };

    console.log(data);

    const options = {
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
      display: false,
    };
    // if data not available <img style={{height: '300px', objectFit: 'cover'}} className="width-full pulse" src={chartLoader}/>
    return <Line data={data} style={{width:'100%',height:'340px'}} options={options} legend={legend} />;
  };

  const SynthGroupRow: React.FC<ISynthTypeItem> = (props) => {
    const { name, maturity, apy, balance, liquidity, price } = props;
    const { cycle, year, type } = SynthInfo[name];

    // TODO change maturity to show if live or expired
    return (
      <Link to={`/synths/${type}/${cycle}${year}`} className="table-row margin-y-2 w-inline-block">
        <div className="expand">
          <div className="margin-right-1 text-color-4">{name}</div>
          <div className="text-xs">{maturity <= 0 ? 'Expired' : `${maturity} days to expiry`}</div>
        </div>
        <div className="expand portrait-padding-y-2">
          <div className="text-color-4">{apy}%</div>
        </div>
        <div className="expand portrait-hide">
          <div className="text-color-4">$0.00</div>
          <div className="text-xs">{balance} Tokens</div>
        </div>
        <div className="expand portrait-padding-y-2">
          <div className="text-color-4">${Number(liquidity) > 1 ? formatForDisplay(liquidity) : '0'}</div>
        </div>
        <div className="expand portrait-padding-y-2">
          <div className="text-color-4">${price}</div>
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
    return (
      <div className="tabs portrait-margin-top-1">
        {Object.keys(synthGroup).map((synthName, index) => {
          return (
            <div className={`tab ${synthInFocus === synthName && 'active'}`} onClick={() => setSynthInFocus(synthName)} key={index}>
              {synthName}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <MainDisplay>
        <MainHeading className="margin-bottom-1">{type}</MainHeading>
        <div className="padding-x-8 flex-align-baseline">{SynthTypes[type].description}</div>
        <div className="padding-x-8 padding-y-1 flex-row portrait-flex-column portrait-flex-align-start">
          <ChartSelector />
        </div>
        <div style={{height: '300px'}}>
          <div className="width-full margin-y-2 w-embed w-script">{historicPriceData && <Chart />}</div>
        </div>
        <h5 className="margin-top-8 margin-left-8 text-medium">Available Synths</h5>
        <TableFilter />
        <Table headers={['Maturity', 'APY', 'Your Balance', 'Liquidity', 'Price']}>
          {Object.keys(synthGroup).length > 0
            ? Object.entries(synthGroup).map(([name, synth], index) => {
                return <SynthGroupRow {...synth} key={index} />;
              })
            : 'There are no synths in this type'}
        </Table>
      </MainDisplay>
      <SideDisplay>{/* TODO add synth copy */}</SideDisplay>
    </>
  );
};
