import React, { useContext, useEffect } from 'react';

import { EthereumContext, UserContext } from '@/contexts';

import { MainDisplay, MainHeading, SideDisplay, Table, TableRow } from '@/components';
import { Link } from 'react-router-dom';

import { IMintedPosition, ISynthInWallet } from '@/types';
import clsx from 'clsx';

interface PortfolioTableProps {
  title: string;
  headers: string[];
}

interface MintedRowProps {
  imgLocation: string; // TODO move to ISynthMetadata type
  mintedPosition: IMintedPosition;
}

interface SynthsInWalletRowProps {
  imgLocation: string; // TODO move to ISynthMetadata type
  synthsInWallet: ISynthInWallet;
}

const Portfolio = () => {
  const { mintedPositions, synthsInWallet } = useContext(UserContext);

  const PlaceholderRow: React.FC = ({ children }) => {
    return <div className="table-row margin-y-2 w-inline-block">{children}</div>;
  };

  const MintedRow: React.FC<MintedRowProps> = (props) => {
    const { name, collateral, type, cycle, year } = props.mintedPosition.metadata;
    const { tokenAmount, collateralAmount, collateralRatio } = props.mintedPosition;

    return (
      <TableRow to={`/synths/${type}/${cycle}${year}`}>
        <div className="flex-align-center expand">
          <div className="width-10 height-10 flex-align-center flex-justify-center radius-full background-white-50 margin-right-2">
            <img src={props.imgLocation} alt={name} />
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
          <div className="button-secondary button-tiny margin-right-1 white">Farm</div>
          <div className="button-secondary button-tiny white">Manage</div>
        </div>
      </TableRow>
    );
  };

  const SynthsInWalletRow: React.FC<SynthsInWalletRowProps> = (props) => {
    const { tokenAmount } = props.synthsInWallet;
    const { name, type, cycle, year, expired } = props.synthsInWallet.metadata;
    const link = `/synths/${type}/${cycle}${year}`;

    const classes = clsx('table-row', 'margin-y-2', 'w-inline-block');

    return (
      <TableRow to={link}>
        <div className="flex-align-center expand">
          <div className="width-10 height-10 flex-align-center flex-justify-center radius-full background-white-50 margin-right-2">
            <img src={props.imgLocation} alt={name} />
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
          <div className={`pill ${expired ? 'red' : 'green'}`}>{expired ? 'EXPIRED' : 'LIVE'}</div>
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
    <>
      <MainDisplay>
        <MainHeading>Your Positions</MainHeading>
        <Table title="Synths Minted" headers={['Token', 'Balance', 'Collateral', 'Utilization', 'Actions']}>
          {mintedPositions.length > 0 ? (
            mintedPositions.map((minted, index) => {
              return <MintedRow imgLocation="src/assets/Box-01.png" mintedPosition={minted} key={index} />;
            })
          ) : (
            <TableRow>You do not have any synths minted</TableRow>
          )}
        </Table>
        <Table title="Synths In Wallet" headers={['Token', 'Balance', 'Price', 'Status', 'Actions']}>
          {synthsInWallet.length > 0 ? (
            synthsInWallet.map((inWallet, index) => {
              return <SynthsInWalletRow imgLocation="src/assets/Box-01.png" synthsInWallet={inWallet} key={index} />;
            })
          ) : (
            <TableRow>You do not have any synths in your wallet</TableRow>
          )}
        </Table>
        {/* TODO Add pool positions */}
      </MainDisplay>
      <SideDisplay></SideDisplay>
    </>
  );
};

export default Portfolio;
