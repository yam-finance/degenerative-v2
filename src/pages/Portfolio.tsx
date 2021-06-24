import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { MarketContext, UserContext } from '@/contexts';
import { Page, Navbar, MainDisplay, MainHeading, SideDisplay, Table, TableRow, Loader } from '@/components';
import { IMintedPosition, ITokensInWallet } from '@/types';
import { getUsdPrice, roundDecimals, isEmpty } from '@/utils';

export const Portfolio = () => {
  const { mintedPositions, synthsInWallet } = useContext(UserContext);
  const { synthMetadata, synthMarketData, collateralData } = useContext(MarketContext);

  const MintedRow: React.FC<IMintedPosition> = (props) => {
    const { name, tokenAmount, collateralAmount, utilization } = props;
    const { imgLocation, collateral, group, cycle, year } = synthMetadata[name];
    const { price, priceUsd, globalUtilization, liquidationPoint } = synthMarketData[name];
    const link = `/explore/${group}/${cycle}${year}`;

    const pricedUtilization = price * utilization;
    const pricedGlobalUtil = price * globalUtilization;

    const [collateralPrice, setCollateralPrice] = useState(0);
    (async () => setCollateralPrice(await getUsdPrice(collateralData[collateral].coingeckoId)))();

    return (
      <TableRow>
        <div className="flex-align-center expand">
          <div className="width-10 height-10 flex-align-center flex-justify-center radius-full background-white-50 margin-right-2">
            <img src={imgLocation} alt={name} className="margin-1" />
          </div>
          <div>
            <div className="margin-right-1 text-color-4">{name}</div>
          </div>
        </div>
        <div className="expand">
          <div className="text-color-4">{`${roundDecimals(tokenAmount, 3)} ${name}`}</div>
          <div className="text-xs opacity-50">${roundDecimals(priceUsd * tokenAmount, 3)}</div>
        </div>
        <div className="expand">
          <div className="text-color-4">{`${roundDecimals(collateralAmount, 3)} ${collateral}`}</div>
        </div>
        <div className="expand">
          <div className="text-color-4">{roundDecimals(1 / pricedUtilization, 2)}</div>
          <div className="gauge horizontal overflow-hidden">
            <div className="collateral" />
            <div className="debt horizontal" style={{ width: `${pricedUtilization * 100}%` }}>
              <div className="gradient horizontal" />
            </div>
            <div className="gcr horizontal" style={{ left: `${pricedGlobalUtil * 100}%` }} />
            <div className="liquidation-point horizontal" style={{ left: `${liquidationPoint * 100}%` }} />
          </div>
        </div>
        <div className="expand flex-align-baseline">
          <Link to={link} className="button button-small">
            Manage
          </Link>
        </div>
      </TableRow>
    );
  };

  const SynthsInWalletRow: React.FC<ITokensInWallet> = (props) => {
    const { name, tokenAmount } = props;
    const { imgLocation, collateral, group, cycle, year } = synthMetadata[name];
    const { price, priceUsd, daysTillExpiry } = synthMarketData[name];
    const link = `/explore/${group}/${cycle}${year}`;

    const isExpired = daysTillExpiry < 0;

    return (
      <TableRow>
        <div className="flex-align-center expand">
          <div className="width-10 height-10 flex-align-center flex-justify-center radius-full background-white-50 margin-right-2">
            <img src={imgLocation} alt={name} className="margin-1" />
          </div>
          <div>
            <div className="margin-right-1 text-color-4">{name}</div>
          </div>
        </div>
        <div className="expand">
          <div className="text-color-4">
            {tokenAmount} {name}
          </div>
          <div className="text-xs opacity-50">{`$${roundDecimals(priceUsd * tokenAmount, 3)}`}</div>
        </div>
        <div className="expand">
          <div className="text-color-4">
            {price} {collateral}
          </div>
          <div className="text-xs opacity-50">{`$${roundDecimals(priceUsd, 3)}`}</div>
        </div>
        <div className="expand">
          <div className={`pill ${isExpired ? 'red' : 'green'}`}>{isExpired ? 'EXPIRED' : 'LIVE'}</div>
        </div>
        <div className="expand flex-align-baseline">
          <Link to={link} className="button button-small">
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
        {isEmpty(synthMarketData) ? (
          <Loader className="flex-align-center flex-justify-center padding-top-48" />
        ) : (
          <>
            <Table title="Synths In Wallet" headers={['Token', 'Balance', 'Price', 'Status', 'Actions']}>
              {synthsInWallet && synthsInWallet.length > 0 ? (
                synthsInWallet.map((inWallet, index) => {
                  return <SynthsInWalletRow {...inWallet} key={index} />;
                })
              ) : (
                <TableRow>You do not have any synths in your wallet</TableRow>
              )}
            </Table>
            <Table title="Synths Minted" headers={['Token', 'Balance', 'Collateral', 'Collateral Ratio', 'Actions']}>
              {mintedPositions.length > 0 ? (
                mintedPositions.map((minted, index) => {
                  return <MintedRow {...minted} key={index} />;
                })
              ) : (
                <TableRow>You do not have any synths minted</TableRow>
              )}
            </Table>
          </>
        )}
        {/* TODO Add pool positions */}
      </MainDisplay>
      <SideDisplay></SideDisplay>
    </Page>
  );
};
