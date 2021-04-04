import React, { useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSynthActions } from '@/hooks';
import { UserContext, MarketContext } from '@/contexts';
import { MainDisplay, MainHeading, SideDisplay, Table } from '@/components';
import { SynthInfo, SynthCopy, isEmpty } from '@/utils';

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
  const { currentSynth, setSynth, synthsInWallet } = useContext(UserContext);
  const { synthMarketData } = useContext(MarketContext);
  const { type } = useParams<SynthParams>();
  const [synthGroup, setSynthGroup] = useState<ISynthTypeItem[]>([]);

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

  const SynthGroupRow: React.FC<{ synthGroupItem: ISynthTypeItem }> = (props) => {
    const { synthGroupItem } = props;
    const { name, apy, balance, liquidity, price } = synthGroupItem;
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
        <MainHeading className="margin-bottom-1">{type}</MainHeading>
        <div className="padding-x-8 flex-align-baseline">{SynthCopy[type]}</div>
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
            : 'There are no synths in this type'}
        </Table>
      </MainDisplay>
      <SideDisplay></SideDisplay>
    </>
  );
};
