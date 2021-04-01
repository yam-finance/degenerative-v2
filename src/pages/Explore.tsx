import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SearchForm } from '@/components';
import { MainDisplay, MainHeading, SideDisplay, Table, TableRow } from '@/components';
import { ISynthInfo } from '@/types';
import { MarketContext } from '@/contexts';
import { SynthMap } from '@/utils';
import box from '@/assets/Box-01.png';

const Explore = () => {
  const { marketData } = useContext(MarketContext);

  const [filter, setFilter] = useState('');
  const [sidebarSynth, setSidebarSynth] = useState();

  const SynthBlock: React.FC<{ synth: ISynthInfo }> = ({ synth }) => {
    const { type, cycle, year, name, expired } = synth.metadata;

    const style = 'padding-8 flex-column-centered radius-xl box-shadow-large text-align-center relative w-inline-block';

    // TODO add description, APY, and set sidebar
    if (!marketData[name]) return <div className={style}>Loading...</div>;
    return (
      <>
        <Link to={`/synths/${type}/${cycle}${year}`} className={style}>
          <img src={box} loading="lazy" alt="" className="width-16" />
          <h5 className="margin-top-4">{name}</h5>
          <p className="text-small opacity-60">Lorem ipsum dolor sit amet, adipiscing</p>
          <div className="button button-small">{`${marketData[name].apr}`}% APR</div> {/* TODO */}
          <div className="pill absolute-top-right margin-4">New</div>
        </Link>
      </>
    );
  };

  const SynthTableRow: React.FC<{ synth: ISynthInfo }> = ({ synth }) => {
    const { name, expired } = synth.metadata;

    if (!marketData[name]) return <TableRow>Loading...</TableRow>;
    return (
      <TableRow to="#">
        <div className="flex-align-center portrait-width-full width-1-2">
          <div className="width-10 height-10 flex-align-center flex-justify-center radius-full background-white-50 margin-right-2">
            <img src={box} loading="lazy" alt="" className="width-6" />
          </div>
          <div>
            <div className="margin-right-1 text-color-4">{name}</div>
            <div className="text-xs opacity-50">Lorem ipsum dolor sit amet, elit. </div>
          </div>
        </div>
        <div className="expand portrait-padding-y-2">
          <div className="text-color-4">{marketData[name].apr}%</div>
        </div>
        <div className="expand portrait-padding-y-2">
          <div className="text-color-4">{marketData[name].liquidity}</div>
        </div>
        <div className="expand portrait-padding-y-2">
          <div className="text-color-4">{marketData[name].marketCap}</div>
        </div>
      </TableRow>
    );
  };

  return (
    <>
      <MainDisplay>
        <MainHeading>Explore Synths</MainHeading>
        <div className="padding-x-8 flex-row margin-top-4 flex-wrap">
          <SearchForm className="margin-0 margin-right-2 expand portrait-width-full portrait-margin-bottom-2 w-form" />
        </div>
        <div className="padding-x-8 flex-align-baseline"></div>
        <div className="grid-3-columns margin-x-8 margin-top-4">
          {Object.keys(SynthMap).map((synth, index) => {
            return <SynthBlock synth={SynthMap[synth]} key={index} />;
          })}
        </div>
        <Table headers={['Synth', 'APY', 'Liquidity', 'Market Cap']} headerClass={['width-1-2', '', '', '']}>
          {Object.keys(SynthMap).map((synth, index) => {
            return <SynthTableRow synth={SynthMap[synth]} key={index} />;
          })}
        </Table>
      </MainDisplay>
      <SideDisplay></SideDisplay>
    </>
  );
};

export default Explore;
