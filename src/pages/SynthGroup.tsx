import React, { useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSynthActions } from '@/hooks';
import { UserContext } from '@/contexts';
import { MainDisplay, MainHeading, SideDisplay, Table } from '@/components';
import { SynthMap, SynthTypes } from '@/utils';
import { ISynthMetadata } from '@/types';
import { useQuery } from 'graphql-hooks';
import { UNISWAP_MARKET_DATA_QUERY } from '@/utils';
import { getEthPrice } from '@/utils/MarketData';

interface SynthParams {
  group: string;
}

// TODO add this data to
interface ISynthGroupItem {
  maturity: string;
  apy: string;
  balance: string;
  liquidity: string;
  price: string;
  metadata: ISynthMetadata;
}

const Synth: React.FC = () => {
  const { currentSynth, setSynth, synthsInWallet } = useContext(UserContext);
  const { group } = useParams<SynthParams>();
  const [synthGroup, setSynthGroup] = useState<ISynthGroupItem[]>([]);

  useEffect(() => {
    // TODO Change to take market data from UserContext
    const synths: ISynthGroupItem[] = [];
    Object.values(SynthMap)
      .map((synth) => synth.metadata)
      .filter((metadata) => metadata.type === group)
      .forEach((element) => {
        synths.push({
          maturity: element.cycle,
          apy: '0', //TODO
          // TODO should be showing minted positions
          balance: synthsInWallet.find((el) => el.metadata.name === element.name)?.tokenAmount ?? '0',
          liquidity: '0', // TODO
          price: '100', // TODO
          metadata: element,
        });
      });
    setSynthGroup(synths);
  }, []);

  const SynthGroupRow: React.FC<{ synthGroupItem: ISynthGroupItem }> = (props) => {
    const { synthGroupItem } = props;
    const { apy, balance, liquidity, price } = synthGroupItem;
    const { name, cycle, year, type } = synthGroupItem.metadata;

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
          <div className="text-color-4">$1,230,450</div>
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
        <MainHeading className="margin-bottom-1">{group}</MainHeading>
        <div className="padding-x-8 flex-align-baseline">{SynthTypes[group]}</div>
        <div className="width-full margin-y-2 w-embed w-script">{/* Add graph here */}</div>
        <h5 className="margin-top-8 margin-left-8 text-medium">Available Synths</h5>
        <div className="padding-x-5 flex-row">
          <div className="tabs">
            <a href="#" className="tab active">
              Live
            </a>
            <a href="#" className="tab">
              Expired
            </a>
            <a href="#" className="tab">
              All
            </a>
          </div>
        </div>
        <Table headers={['Maturity', 'APY', 'Your Balance', 'Liquidity', 'Price']}>
          {synthGroup.length > 0
            ? synthGroup.map((synth, index) => {
                return <SynthGroupRow synthGroupItem={synth} key={index} />;
              })
            : 'There are no synths in this group'}
        </Table>
      </MainDisplay>
      <SideDisplay></SideDisplay>
    </>
  );
};

export default Synth;
