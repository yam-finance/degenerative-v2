import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SearchForm, NavbarButton, Icon, Dropdown } from '@/components';
import LanguageSwitcher from '@/components/LangSwitcher';
import { EthereumContext } from '@/contexts';
import { useTranslation } from 'react-i18next';

import zombieHead from '@/assets/zombie_head_large.png';
import discord from '@/assets/discord.svg';
// TODO change user's account image
import accountImage from '@/assets/ellipse.png';

const Navbar = () => {
  const { account, disconnectWallet } = useContext(EthereumContext);
  const [accountDisplay, setAccountDisplay] = useState('Not Connected');
  const [openWalletMenu, setWalletMenu] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (account) {
      setAccountDisplay(`${account.slice(0, 6)}...${account.substr(-4)}`);
    } else {
      setAccountDisplay('Not Connected');
    }
  }, [account]);

  const toggleDropdown = () => setWalletMenu(!openWalletMenu);
  const toggleMenu = () => setOpenMenu(!openMenu);

  const Navigation: React.FC = () => {
    return (
      <div className="flex-column expand padding-right-3 tablet-padding-x-4 tablet-padding-y-8 min-height-full">
        <SearchForm className="margin-left-8 margin-top-6 tablet-margin-0 w-form" />
        <NavbarButton text="Explore Synths" icon="Globe" to="/synths" />
        <NavbarButton text="Portfolio" icon="User" to="/portfolio" />
        <div className="nav-divider margin-y-5"></div>
        <h6 className="margin-left-8 padding-left-3 tablet-padding-left-0 tablet-margin-left-3">Learn</h6>
        <NavbarButton text="Tutorial" icon="FileText" to="#" external />
        <NavbarButton text="Docs" icon="Book" to="#" external />
        <NavbarButton text="FAQs" icon="HelpCircle" to="#" external />
        <NavbarButton text="Support" icon="LifeBuoy" to="#" external />
        <div className="expand"></div>
        <div className="nav-divider margin-y-5"></div>
        <NavbarButton text="YAM" icon="ExternalLink" to="#" external />
        <NavbarButton text="UMA" icon="ExternalLink" to="#" external />
        <div className="margin-left-8 padding-3 tablet-margin-left-0">
          <div className="w-layout-grid flex-row">
            <a href="https://twitter.com/YamFinance" className="margin-right-0 w-inline-block">
              <Icon name="Twitter" className="icon in-button" />
            </a>
            <a href="https://discord.com/invite/fbHX7NRa52" className="margin-right-0 w-inline-block">
              <img src={discord} loading="lazy" alt="Discord logo" className="icon discord in-button" />
            </a>
            <a href="#" className="margin-right-0 w-inline-block">
              <Icon name="Mail" className="icon in-button" />
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-column padding-y-8 margin-right-3 sticky-top-0 max-height-viewport-full overflow-auto tablet-absolute-top tablet-padding-y-2">
      <Link to="/" className="margin-left-6 flex-row-middle padding-left-3 padding-right-3 w-inline-block">
        <img src={zombieHead} loading="lazy" alt="A cute degen zombie head as the logo" className="degen margin-right-2" />
        <h5 className="margin-0 margin-right-2 expand">{t('app_name')}</h5>
        <LanguageSwitcher />
        <div className="pill">v 2.0</div>
      </Link>
      <div className="expand tablet-hide">
        <Navigation />
      </div>
      <div className="wallet">
        <img src={accountImage} loading="lazy" alt="" className="avatar margin-right-2" />
        <div className="expand relative">
          <div className="text-xs">Metamask</div>
          <div className="text-color-4">{accountDisplay}</div>
        </div>
        <div className="margin-left-6 tablet-hide relative w-dropdown">
          <div
            className="icon-button w-dropdown-toggle"
            onClick={(e) => {
              e.preventDefault();
              toggleDropdown();
            }}
          >
            <Icon name="ChevronDown" className="icon opacity-100" />
          </div>
          <Dropdown className="dropdown-list top-right box-shadow-medium radius-large w-dropdown-list" openDropdown={openWalletMenu}>
            <button
              onClick={(e) => {
                e.preventDefault();
                disconnectWallet();
              }}
              className="dropdown-link w-dropdown-link"
            >
              Disconnect
            </button>
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
    </div>
  );
};

export default Navbar;
