import React, { useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { UserContext, MarketContext } from '@/contexts';
import { MainDisplay, MainHeading, SideDisplay, Table } from '@/components';
import { SynthInfo, SynthCopy, isEmpty, getDailyPriceHistory, formatForDisplay } from '@/utils';
import { IMap } from '@/types';

interface SynthParams {
  type: string;
}

// TODO add this data to
interface ISynthTypeItem {
  name: string;
  maturity: string;
  apy: string;
  balance: string;
  liquidity: string;
  price: string;
}

export const SynthType: React.FC = () => {
  const { synthsInWallet } = useContext(UserContext);
  const { synthMarketData } = useContext(MarketContext);
  const { type } = useParams<SynthParams>();
  const [synthGroup, setSynthGroup] = useState<ISynthTypeItem[]>([]);
  const [historicPriceData, setHistoricPriceData] = useState<{
    labels: string[];
    synthPrices: IMap<number[]>;
  }>();

  // TODO redirect if type does not exist

  useEffect(() => {
    const initSynthTypes = () => {
      const synths: ISynthTypeItem[] = [];
      Object.entries(SynthInfo)
        .filter((synth) => synth[1].type === type)
        .forEach(([synthName, synthInfo]) => {
          synths.push({
            name: synthName,
            maturity: synthInfo.cycle, // TODO change to isExpired
            apy: synthMarketData[synthName].apr, //TODO
            // TODO should be showing minted positions
            balance: synthsInWallet.find((el) => el.name === synthName)?.tokenAmount ?? '0',
            liquidity: synthMarketData[synthName].liquidity, // TODO
            price: synthMarketData[synthName].price, // TODO
          });
        });
      setSynthGroup(synths);
    };

    if (!isEmpty(synthMarketData)) initSynthTypes();
  }, [synthMarketData]);

  useEffect(() => {
    const getChartData = async () => setHistoricPriceData(await getDailyPriceHistory(type));

    getChartData();
  }, []);

  const Chart: React.FC = () => {
    if (!historicPriceData) return null;

    const data = {
      labels: historicPriceData.labels,
      datasets: Object.entries(historicPriceData.synthPrices).map(([name, prices]) => ({
        // TODO add reference data
        label: name,
        data: prices,
        borderColor: '#FF0099',
        borderWidth: 1,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: '#FF0099',
        tension: 0.1,
      })),
    };

    const options = {
      tooltips: {
        mode: 'index',
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
      legend: {
        display: false,
      },
      layout: {
        padding: {
          left: -10,
          bottom: -10,
        },
      },
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: false,
              display: false,
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
    console.log(data);

    return <Line data={data} options={options} />;
  };

  const SynthGroupRow: React.FC<ISynthTypeItem> = (props) => {
    const { name, apy, balance, liquidity, price } = props;
    const { cycle, year, type } = SynthInfo[name];

    // TODO change maturity to show if live or expired
    return (
      <Link to={`/synths/${type}/${cycle}${year}`} className="table-row margin-y-2 w-inline-block">
        <div className="expand">
          <div className="margin-right-1 text-color-4">{name}</div>
          <div className="text-xs">{`${cycle}${year}`}</div>
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

  return (
    <>
      <MainDisplay>
        <MainHeading className="margin-bottom-1">{type}</MainHeading>
        <div className="padding-x-8 flex-align-baseline">{SynthCopy[type]}</div>
        <div className="width-full margin-y-2 w-embed w-script">{historicPriceData && <Chart />}</div>
        <h5 className="margin-top-8 margin-left-8 text-medium">Available Synths</h5>
        <div className="padding-x-5 flex-row">
          <div className="tabs">
            <div className="tab active">Live</div>
            <div className="tab">Expired</div>
            <div className="tab">All</div>
          </div>
        </div>
        <Table headers={['Maturity', 'APY', 'Your Balance', 'Liquidity', 'Price']}>
          {synthGroup.length > 0
            ? synthGroup.map((synth, index) => {
                return <SynthGroupRow {...synth} key={index} />;
              })
            : 'There are no synths in this type'}
        </Table>
      </MainDisplay>
      <SideDisplay></SideDisplay>
    </>
  );
};
