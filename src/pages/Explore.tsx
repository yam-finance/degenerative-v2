import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'react-feather';
import { SearchForm } from '@/components';
import { MainDisplay, MainHeading, SideDisplay, Table } from '@/components';
import { ISynthInfo } from '@/types';
import { UserContext } from '@/contexts';
import { useQuery } from 'graphql-hooks';
import { UNISWAP_MARKET_DATA_QUERY } from '@/utils';
import { SynthMap } from '@/utils';
import box from '@/assets/Box-01.png';

const Explore = () => {
  //const { getMarketData } = useContext(UserContext);
  const [availableSynths, setAvailableSynths] = useState([]);
  const [sidebarSynth, setSidebarSynth] = useState();

  const SynthBlock: React.FC<{ synth: ISynthInfo }> = ({ synth }) => {
    const { type, cycle, year, name, expired } = synth.metadata;
    const { loading, error, data: marketData } = useQuery(UNISWAP_MARKET_DATA_QUERY, {
      variables: {
        poolAddress: synth.pool.address,
      },
      useCache: true,
    });

    if (!loading && !error) console.log(marketData);

    // TODO add description, APY, and set sidebar
    return (
      <>
        <Link
          to={`/synths/${type}/${cycle}${year}`}
          className="padding-8 flex-column-centered radius-xl box-shadow-large text-align-center relative w-inline-block"
        >
          <img src={box} loading="lazy" alt="" className="width-16" />
          <h5 className="margin-top-4">{name}</h5>
          <p className="text-small opacity-60">Lorem ipsum dolor sit amet, adipiscing</p>
          <div className="button button-small">XX% APY</div> {/* TODO */}
          <div className="pill absolute-top-right margin-4">New</div>
        </Link>
      </>
    );
  };

  // TODO factor out table row components
  const SynthTableRow: React.FC<{ synth: ISynthInfo }> = ({ synth }) => {
    const { name, expired } = synth.metadata;
    const { loading, error, data: marketData } = useQuery(UNISWAP_MARKET_DATA_QUERY, {
      variables: {
        poolAddress: synth.pool.address,
      },
      useCache: true,
    });

    if (!loading && !error) console.log(marketData);

    return (
      <Link to="#" className="table-row margin-y-2 w-inline-block">
        <div className="flex-align-center portrait-width-full width-1-2">
          <div className="width-10 height-10 flex-align-center flex-justify-center radius-full background-white-50 margin-right-2">
            <img src={box} loading="lazy" alt="" className="width-6" />
          </div>
          <div>
            <div className="margin-right-1 text-color-4">uSYNTH</div>
            <div className="text-xs opacity-50">Lorem ipsum dolor sit amet, elit. </div>
          </div>
        </div>
        <div className="expand portrait-padding-y-2">
          <div className="text-color-4">
            XX% <span className="hide portrait-inline text-xs opacity-60">APY</span>
          </div>
        </div>
        <div className="expand portrait-padding-y-2">
          <div className="text-color-4">
            $12.4M <span className="hide portrait-inline text-xs opacity-60">Liquidity</span>
          </div>
        </div>
        <div className="expand portrait-padding-y-2">
          <div className="text-color-4">
            $124M <span className="hide portrait-inline text-xs opacity-60">Marketcap</span>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <>
      <MainDisplay>
        <MainHeading>Explore</MainHeading>
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
