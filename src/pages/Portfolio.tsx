import React, { useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { MarketContext, UserContext } from '@/contexts';
import { MainDisplay, MainHeading, SideDisplay, Table, TableRow } from '@/components';
import { IMintedPosition, ISynthInWallet } from '@/types';
import { SynthInfo } from '@/utils';

export const Portfolio = () => {
  const { mintedPositions, synthsInWallet } = useContext(UserContext);
  const { synthMarketData } = useContext(MarketContext);

  useEffect(() => {
    console.log(synthsInWallet);
  }, [synthsInWallet]);

  const MintedRow: React.FC<IMintedPosition> = (props) => {
    const { imgLocation, collateral, type, cycle, year } = SynthInfo[props.name];
    const { name, tokenAmount, collateralAmount, collateralRatio } = props;

    return (
      <TableRow to={`/synths/${type}/${cycle}${year}`}>
        <div className="flex-align-center expand">
          <div className="width-10 height-10 flex-align-center flex-justify-center radius-full background-white-50 margin-right-2">
            <img src={imgLocation} alt={name} />
          </div>
          <div>
            <div className="margin-right-1 text-color-4">{name}</div>
            <div className="text-xs opacity-50">{`${cycle} ${year}`}</div>
          </div>
        </div>
        <div className="expand">
          <div className="text-color-4">$1,000{/* TODO Placeholder */}</div>
          <div className="text-xs opacity-50">{`${tokenAmount} ${name}`}</div>
        </div>
        <div className="expand">
          <div className="text-color-4">$10,500{/* TODO Placeholder */}</div>
          <div className="text-xs opacity-50">{`${collateralAmount} ${collateral}`}</div>
        </div>
        <div className="expand">
          <div className="text-color-4">{`${collateralRatio}`}</div>
          <div className="gauge horizontal overflow-hidden">
            <div className="collateral"></div>
            <div className="debt horizontal">
              <div className="gradient horizontal"></div>
            </div>
            <div className="gcr horizontal"></div>
            <div className="liquidation-point horizontal"></div>
          </div>
        </div>
        <div className="expand flex-align-baseline">
          <div className="button button-small margin-right-1">Settle</div>
          <Link to={`${link}/manage`} className="button button-small">Manage</Link>
        </div>
      </TableRow>
    );
  };

  const SynthsInWalletRow: React.FC<ISynthInWallet> = (props) => {
    const { name, tokenAmount, address } = props;
    const { imgLocation, type, cycle, year } = SynthInfo[name];
    const { daysTillExpiry } = synthMarketData[name];
    const link = `/synths/${type}/${cycle}${year}`;

    const isExpired = daysTillExpiry <= 0;

    return (
      <TableRow to={link}>
        <div className="flex-align-center expand">
          <div className="width-10 height-10 flex-align-center flex-justify-center radius-full background-white-50 margin-right-2">
            <img src={imgLocation} alt={name} />
          </div>
          <div>
            <div className="margin-right-1 text-color-4">{name}</div>
            <div className="text-xs opacity-50">{`${cycle} ${year}`}</div>
          </div>
        </div>
        <div className="expand">
          <div className="text-color-4">$1,000{/* TODO Placeholder */}</div>
          <div className="text-xs opacity-50">{`${tokenAmount} ${name}`}</div>
        </div>
        <div className="expand">
          <div className="text-color-4">$10,500{/* TODO Placeholder */}</div>
          <div className="height-8 width-32 w-embed w-script"></div>
        </div>
        <div className="expand">
          <div className={`pill ${isExpired ? 'red' : 'green'}`}>{isExpired ? 'EXPIRED' : 'LIVE'}</div>
        </div>
        <div className="expand flex-align-baseline">
          <Link to={`https://app.sushi.com/swap?inputCurrency=ETH&outputCurrency=${address}`} className="button button-small margin-right-1">
            Trade {/* TODO actual address */}
          </Link>
          <div className="button button-small">
            Settle
          </div>
        </div>
      </TableRow>
    );
  };

  return (
    <>
      <MainDisplay>
        <MainHeading>Portfolio</MainHeading>
        <Table title="Synths In Wallet" headers={['Token', 'Balance', 'Price', 'Status', 'Actions']}>
          {synthsInWallet && synthsInWallet.length > 0 ? (
            synthsInWallet.map((inWallet, index) => {
              return <SynthsInWalletRow {...inWallet} key={index} />;
            })
          ) : (
            <TableRow>You do not have any synths in your wallet</TableRow>
          )}
        </Table>
        
        <Table title="Synths Minted" headers={['Token', 'Balance', 'Collateral', 'Utilization', 'Actions']}>
          {mintedPositions.length > 0 ? (
            mintedPositions.map((minted, index) => {
              return <MintedRow {...minted} key={index} />;
            })
          ) : (
            <TableRow>You do not have any synths minted</TableRow>
          )}
        </Table>
        
        {/* TODO Add pool positions */}
      </MainDisplay>
      <SideDisplay></SideDisplay>
    </>
  );
};
