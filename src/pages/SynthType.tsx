import React, { useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSynthActions } from '@/hooks';
import { UserContext } from '@/contexts';
import { MainDisplay, MainHeading, SideDisplay, Table } from '@/components';
import { SynthInfo, SynthCopy } from '@/utils';

interface SynthParams {
  group: string;
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
  const { currentSynth, setSynth, synthsInWallet } = useContext(UserContext);
  const { group } = useParams<SynthParams>();
  const [synthGroup, setSynthGroup] = useState<ISynthTypeItem[]>([]);

  useEffect(() => {
    // TODO Change to take market data from UserContext
    const synths: ISynthTypeItem[] = [];
    Object.entries(SynthInfo)
      .filter((synth) => synth[1].type === group)
      .forEach((synth) => {
        synths.push({
          name: synth[0],
          maturity: synth[1].cycle,
          apy: '0', //TODO
          // TODO should be showing minted positions
          balance: synthsInWallet.find((el) => el.name === synth[0])?.tokenAmount ?? '0',
          liquidity: '0', // TODO
          price: '100', // TODO
        });
      });
    setSynthGroup(synths);
  }, []);

  const SynthGroupRow: React.FC<{ synthGroupItem: ISynthTypeItem }> = (props) => {
    const { synthGroupItem } = props;
    const { name, apy, balance, liquidity, price } = synthGroupItem;
    const { cycle, year, type } = SynthInfo[name];

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
        <div className="padding-x-8 flex-align-baseline">{SynthCopy[group]}</div>
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
