import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SearchForm, NavbarButton, Icon, Dropdown } from '@/components';
import LanguageSwitcher from '@/components/LangSwitcher';
import { EthereumContext } from '@/contexts';
import { CSSTransition } from 'react-transition-group';
// import { useTranslation } from 'react-i18next';

import zombieHead from '@/assets/zombie_head_large.png';
import discord from '@/assets/discord.svg';
// TODO change user's account image
import accountImage from '@/assets/ellipse.png';

const Navbar = () => {
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

  const toggleDropdown = () => setWalletMenu(!openWalletMenu);
  const toggleMenu = () => setOpenMenu(!openMenu);
  
  let message = "";
  let messageColor = "";
  if (chainId != 1) {
    message = "Wrong network"
    messageColor = "red"
  } else {
    message = "Mainnet"
  }
  
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
        <NavbarButton text="Support" icon="LifeBuoy" to="https://discord.gg/Qk7yHHHpTU" external />
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
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-column padding-y-8 margin-right-3 sticky-top-0 max-height-viewport-full overflow-auto tablet-absolute-top tablet-padding-y-2">
      <Link to="/" className="margin-left-6 flex-row-middle padding-left-3 padding-right-3 w-inline-block">
        <img src={zombieHead} loading="lazy" alt="A cute degen zombie head as the logo" className="degen margin-right-2" />
        <h5 className="margin-0 margin-right-2 expand">Degenerative</h5>
        <LanguageSwitcher />
        <div className="pill">v 2.0</div>
      </Link>
      <div className="expand tablet-hide">
        <Navigation />
      </div>
      <div className="wallet">
        <img src={accountImage} loading="lazy" alt="" className="avatar margin-right-2" />
        <div className="expand relative">
          <div className="flex-align-center">
            <div className={`height-4 pill ${messageColor}`}></div>
            <div className="text-xs margin-left-1">{message}</div>
          </div>
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
              className="dropdown-link w-dropdown-link background-color-transparent"
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
          <CSSTransition in={openMenu} timeout={500} classNames="popup">
    
            <Dropdown className="menu background-color-1 border-1px blur sheen w-dropdown-list" openDropdown={openMenu}>
                              <Navigation />
              
            </Dropdown>
          </CSSTransition>
        </div>
        <div className="overlay blur radius-full"></div>
      </div>
    </div>
  );
};

export default Navbar;
