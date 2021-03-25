import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { SearchForm, NavbarButton, Icon } from '@/components';

import { EthereumContext } from '@/contexts';
import zombieHead from '@/assets/zombie_head_large.png';
import discord from '@/assets/discord.svg';
import accountImage from '@/assets/ellipse.png';

const Navbar = () => {
  const { account } = useContext(EthereumContext);
  const [accountDisplay, setAccountDisplay] = useState('Not Connected');

  useEffect(() => {
    if (account) {
      setAccountDisplay(`${account.slice(0, 6)}...${account.substr(-4)}`);
    } else {
      setAccountDisplay('Not Connected');
    }
  }, [account]);

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
        <h5 className="margin-0 margin-right-2 expand">Degenerative</h5>
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
          <div className="icon-button w-dropdown-toggle">
            <Icon name="ChevronDown" className="icon opacity-100" />
          </div>
          <nav className="dropdown-list top-right box-shadow-medium radius-large w-dropdown-list">
            <Link to="#" className="dropdown-link w-dropdown-link">
              Disconnect
            </Link>
          </nav>
        </div>
        <div className="margin-left-6 hide tablet-block relative w-dropdown">
          <div className="icon-button front w-dropdown-toggle">
            <Icon name="Menu" className="icon opacity-100" />
          </div>
          <nav className="menu background-color-1 border-1px blur sheen w-dropdown-list">
            <Navigation />
          </nav>
        </div>
        <div className="overlay blur radius-full"></div>
      </div>
    </div>
  );
};

export default Navbar;
