import React, { useContext, useEffect } from 'react';

import { EthereumContext, UserContext } from '@/contexts';

import { MainDisplay, MainHeading, SideDisplay, Table } from '@/components';
import { Link } from 'react-router-dom';

import { IMintedPosition, ISynthInWallet } from '@/types';
import { Divide } from 'react-feather';

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

  useEffect(() => {
    console.log('minted CHANGED');
    console.log(mintedPositions);
  }, [mintedPositions]);

  useEffect(() => {
    console.log('in wallet CHANGED');
    console.log(synthsInWallet);
  }, [synthsInWallet]);

  const MintedTableRow: React.FC<MintedRowProps> = (props) => {
    const { name, collateral, type, cycle, year } = props.mintedPosition.metadata;
    const { tokenAmount, collateralAmount, collateralRatio } = props.mintedPosition;

    return (
      <Link to={`/synths/${type}/${cycle}${year}`} className="table-row margin-y-2 w-inline-block">
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
      </Link>
    );
  };

  const SynthsInWalletRow: React.FC<SynthsInWalletRowProps> = (props) => {
    const { tokenAmount } = props.synthsInWallet;
    const { name, type, cycle, year, expired } = props.synthsInWallet.metadata;
    const link = `/synths/${type}/${cycle}${year}`;

    return (
      <Link to={link} className="table-row margin-y-2 w-inline-block">
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
      </Link>
    );
  };

  return (
    <>
      <MainDisplay>
        <MainHeading>Your Positions</MainHeading>
        <Table title="Synths Minted" headers={['Token', 'Balance', 'Collateral', 'Utilization', 'Actions']}>
          {mintedPositions.length > 0
            ? mintedPositions.map((minted, index) => {
                return <MintedTableRow imgLocation="src/assets/Box-01.png" mintedPosition={minted} key={index} />;
              })
            : 'You do not have any synths minted'}
        </Table>
        <Table title="Synths In Wallet" headers={['Token', 'Balance', 'Price', 'Status', 'Actions']}>
          {synthsInWallet.length > 0 ? (
            synthsInWallet.map((inWallet, index) => {
              return <SynthsInWalletRow imgLocation="src/assets/Box-01.png" synthsInWallet={inWallet} key={index} />;
            })
          ) : (
            <div>You do not have any synths in your wallet</div>
          )}
        </Table>
        {/* TODO Add pool positions */}
      </MainDisplay>
      <SideDisplay>test</SideDisplay>
    </>
  );
};

export default Portfolio;
