import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SearchForm, NavbarButton, Icon, Dropdown, ConnectWallet, LanguageSwitcher } from '@/components';
import { EthereumContext } from '@/contexts';
// import { useTranslation } from 'react-i18next';
import { picasso } from '@/utils';

import yamIcon from '@/assets/yamIcon.png';
import discord from '@/assets/discord.svg';

export const Navbar = () => {
  const { account, disconnectWallet, chainId } = useContext(EthereumContext);
  const [accountDisplay, setAccountDisplay] = useState('Not Connected');
  const [openWalletMenu, setWalletMenu] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  // const { t } = useTranslation();

  useEffect(() => {
    if (account) {
      setAccountDisplay(`${account.slice(0, 6)}...${account.substr(-4)}`);
    } else {
      setAccountDisplay('Not Connected');
    }
  }, [account]);

  const toggleDisconnectMenu = () => setWalletMenu(!openWalletMenu);
  const toggleMenu = () => setOpenMenu(!openMenu);

  const Navigation: React.FC = () => {
    return (
      <div className="flex-column expand padding-right-3 tablet-padding-x-4 tablet-padding-y-8 min-height-full">
        <div className="margin-left-8 margin-top-10 tablet-margin-0 width-56 portrait-margin-0 landscape-margin-0"></div>
        <NavbarButton text="Explore Synths" icon="Globe" to="/synths" />
        <NavbarButton text="Portfolio" icon="User" to="/portfolio" />
        <div className="nav-divider margin-y-5"></div>
        <h6 className="margin-left-8 padding-left-3 tablet-padding-left-0 tablet-margin-left-3">Learn</h6>
        <NavbarButton text="Docs" icon="Book" to="https://yam.gitbook.io/synths/" external />
        <NavbarButton
          text="Tutorial"
          icon="FileText"
          to="https://yam.gitbook.io/synths/overview/how-do-i-use-synths"
          external
        />
        <NavbarButton text="FAQs" icon="HelpCircle" to="https://yam.gitbook.io/synths/overview/faq" external />
        <NavbarButton text="Support" icon="LifeBuoy" to="https://discord.gg/Qk7yHHHpTU" external />
        <div className="expand"></div>
        <div className="nav-divider margin-y-5"></div>
        <div className="hide tablet-block landscape-block portrait-block">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              disconnectWallet();
            }}
            className="nav-link width-full"
          >
            <Icon name="LogOut" className="icon margin-right-3" />
            <div>Disconnect Wallet</div>
          </a>
          <div className="nav-divider margin-y-5"></div>
        </div>
        <NavbarButton text="YAM" icon="ExternalLink" to="https://yam.finance/" external />
        <NavbarButton text="UMA" icon="ExternalLink" to="https://umaproject.org/" external />
        <div className="margin-left-8 padding-3 tablet-margin-left-0">
          <div className="w-layout-grid flex-row">
            <a
              href="https://twitter.com/YamFinance"
              target="_blank"
              rel="noreferrer"
              className="margin-right-0 w-inline-block"
            >
              <Icon name="Twitter" className="icon in-button" />
            </a>
            <a
              href="https://discord.com/invite/fbHX7NRa52"
              target="_blank"
              rel="noreferrer"
              className="margin-right-0 w-inline-block"
            >
              <img src={discord} loading="lazy" alt="Discord logo" className="icon discord in-button" />
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-column padding-y-8 margin-right-3 sticky-top-0 max-height-viewport-full overflow-auto tablet-absolute-top tablet-padding-y-2">
      <Link to="/" className="margin-left-6 flex-row-middle padding-left-3 padding-right-3 w-inline-block">
        <img src={yamIcon} loading="lazy" alt="Yam Synths" className="avatar margin-right-2" />
        <h5 className="margin-0 margin-right-2 expand">Yam Synths</h5>
        {/* TODO Figure out where to put this
        <LanguageSwitcher /> 
        <div className="pill">v 2.0</div>*/}
      </Link>
      <div className="expand tablet-hide">
        <Navigation />
      </div>
      {account ? (
        <div className="wallet">
          <img src={`data:image/svg+xml;utf8,${picasso(account)}`} className="avatar margin-right-2" />
          <div className="expand relative">
            <div className="flex-align-center">
              <div className={`height-4 pill ${chainId !== 1 && 'red'}`}></div>
              <div className="text-xs margin-left-1">
                {chainId === 1 ? 'Mainnet' : chainId === 42 ? 'Kovan' : 'Wrong network'}
              </div>
            </div>
            <div className="text-color-4">{accountDisplay}</div>
          </div>
          <div className="margin-left-6 tablet-hide relative w-dropdown">
            <div
              className="icon-button w-dropdown-toggle"
              onClick={(e) => {
                e.preventDefault();
                toggleDisconnectMenu();
              }}
            >
              <Icon name="ChevronDown" className="icon opacity-100" />
            </div>
            <Dropdown
              className="dropdown-list top-right box-shadow-medium radius-large w-dropdown-list"
              openDropdown={openWalletMenu}
            >
              <div
                onClick={(e) => {
                  e.preventDefault();
                  disconnectWallet();
                }}
                className="dropdown-link w-dropdown-link"
              >
                Disconnect
              </div>
            </Dropdown>
          </div>
          <div className="margin-left-6 hide tablet-block relative w-dropdown">
            <div
              className="icon-button front w-dropdown-toggle"
              onClick={(e) => {
                e.preventDefault();
                toggleMenu();
              }}
            >
              <Icon name="Menu" className="icon opacity-100" />
            </div>
            <Dropdown className="menu background-color-1 border-1px blur sheen w-dropdown-list" openDropdown={openMenu}>
              <Navigation />
            </Dropdown>
          </div>
          <div className="overlay blur radius-full"></div>
        </div>
      ) : (
        <ConnectWallet
          className={
            'button connect margin-left-8 margin-right-4 text-align-center max-width-xs tablet-fixed-bottom-right tablet-margin-8'
          }
        />
      )}
    </div>
  );
};
