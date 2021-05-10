import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { MarketContext, UserContext } from '@/contexts';
import { Page, Navbar, MainDisplay, MainHeading, SideDisplay, Table, TableRow } from '@/components';
import { IMintedPosition, ISynthInWallet } from '@/types';
import { getUsdPrice, roundDecimals, SynthGroups } from '@/utils';

export const Portfolio = () => {
  const { mintedPositions, synthsInWallet } = useContext(UserContext);
  const { synthMetadata, synthMarketData, collateralData } = useContext(MarketContext);

  useEffect(() => {
    console.log(synthsInWallet);
  }, [synthsInWallet]);

  const MintedRow: React.FC<IMintedPosition> = (props) => {
    const { collateral, group, cycle, year } = synthMetadata[props.name];
    const { price, globalUtilization, liquidationPoint } = synthMarketData[props.name];
    const { name, tokenAmount, collateralAmount, utilization } = props;

    // TODO get back to this!!
    const imgLocation = `/images/${SynthGroups[group].image}.png`;

    const [collateralPrice, setCollateralPrice] = useState(0);
    (async () => setCollateralPrice(await getUsdPrice(collateralData[collateral].coingeckoId)))();

    return (
      <TableRow to={`/synths/${group}/${cycle}${year}`}>
        <div className="flex-align-center expand">
          <div className="width-10 height-10 flex-align-center flex-justify-center radius-full background-white-50 margin-right-2">
            <img src={imgLocation} alt={name} className="margin-1" />
          </div>
          <div>
            <div className="margin-right-1 text-color-4">{name}</div>
            <div className="text-xs opacity-50">{`${cycle} ${year}`}</div>
          </div>
        </div>
        <div className="expand">
          <div className="text-color-4">${roundDecimals(Number(price) * tokenAmount, 2)}</div>
          <div className="text-xs opacity-50">{`${tokenAmount} ${name}`}</div>
        </div>
        <div className="expand">
          <div className="text-color-4">${roundDecimals(collateralPrice * collateralAmount, 2)}</div>
          <div className="text-xs opacity-50">{`${collateralAmount} ${collateral}`}</div>
        </div>
        <div className="expand">
          <div className="text-color-4">{utilization * 100}%</div>
          <div className="gauge horizontal overflow-hidden">
            <div className="collateral" />
            <div className="debt horizontal" style={{ width: `${utilization * 100}%` }}>
              <div className="gradient horizontal" />
            </div>
            <div className="gcr horizontal" style={{ left: `${1 / globalUtilization}%` }} />
            <div className="liquidation-point horizontal" style={{ left: `${liquidationPoint * 100}%` }} />
          </div>
        </div>
        <div className="expand flex-align-baseline">
          <div className="button-secondary button-tiny margin-right-1 white">Farm</div>
          <div className="button-secondary button-tiny white">Manage</div>
        </div>
      </TableRow>
    );
  };

  const SynthsInWalletRow: React.FC<ISynthInWallet> = (props) => {
    const { name, tokenAmount } = props;
    const { imgLocation, group, cycle, year } = synthMetadata[name];
    const { price, daysTillExpiry } = synthMarketData[name];
    const link = `/synths/${group}/${cycle}${year}`;

    const isExpired = daysTillExpiry < 0;

    return (
      <TableRow to={link}>
        <div className="flex-align-center expand">
          <div className="width-10 height-10 flex-align-center flex-justify-center radius-full background-white-50 margin-right-2">
            <img src={imgLocation} alt={name} className="margin-1" />
          </div>
          <div>
            <div className="margin-right-1 text-color-4">{name}</div>
            <div className="text-xs opacity-50">{`${cycle} ${year}`}</div>
          </div>
        </div>
        <div className="expand">
          <div className="text-color-4">${roundDecimals(Number(price) * tokenAmount, 2)}</div>
          <div className="text-xs opacity-50">{`${tokenAmount} ${name}`}</div>
        </div>
        <div className="expand">
          <div className="text-color-4">${price}</div>
          <div className="height-8 width-32 w-embed w-script"></div>
        </div>
        <div className="expand">
          <div className={`pill ${isExpired ? 'red' : 'green'}`}>{isExpired ? 'EXPIRED' : 'LIVE'}</div>
        </div>
        <div className="expand flex-align-baseline">
          <Link to={`${link}/mint`} className="button-secondary button-tiny margin-right-1 white">
            Farm
          </Link>
          <Link to={`${link}/manage`} className="button-secondary button-tiny white">
            Manage
          </Link>
        </div>
      </TableRow>
    );
  };

  return (
    <Page>
      <Navbar />
      <MainDisplay>
        <MainHeading>Portfolio</MainHeading>
        <Table title="Synths Minted" headers={['Token', 'Balance', 'Collateral', 'Utilization', 'Actions']}>
          {mintedPositions.length > 0 ? (
            mintedPositions.map((minted, index) => {
              return <MintedRow {...minted} key={index} />;
            })
          ) : (
            <TableRow>You do not have any synths minted</TableRow>
          )}
        </Table>
        <Table title="Synths In Wallet" headers={['Token', 'Balance', 'Price', 'Status', 'Actions']}>
          {synthsInWallet && synthsInWallet.length > 0 ? (
            synthsInWallet.map((inWallet, index) => {
              return <SynthsInWalletRow {...inWallet} key={index} />;
            })
          ) : (
            <TableRow>You do not have any synths in your wallet</TableRow>
          )}
        </Table>
        {/* TODO Add pool positions */}
      </MainDisplay>
      <SideDisplay></SideDisplay>
    </Page>
  );
};
