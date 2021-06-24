import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { Icon, Dropdown } from '@/components';
import { SynthGroups } from '@/utils';
import yamIcon from '@/assets/yamIcon.png';
import ethIcon from '@/assets/ethIcon.png';
import mintLp from '@/assets/mintLp.png';
import hold from '@/assets/hold.png';
import short from '@/assets/short.png';
import hero from '@/assets/degen-hero.png';
import gloop from '@/assets/gloop.png';
import umaLogo from '@/assets/uma_logo.png';

export const Landing: React.FC = () => {
  interface SynthBlockProps {
    name: string;
    image: string;
    url: string;
    description: string;
    apr: number;
    isNew?: boolean;
  }

  const [openMenu, setOpenMenu] = useState(false);
  const toggleMenu = () => setOpenMenu(!openMenu);

  const SynthBlock: React.FC<SynthBlockProps> = ({ name, image, url, description, apr, isNew }) => {
    return (
      <Link
        to={url}
        className="padding-8 blur flex-column-centered radius-xl box-shadow-large text-align-center relative background-color-1 padding-12 sheen w-inline-block"
      >
        <img src={`/images/${image}.png`} className="width-32" />
        <h4 className="margin-top-8">{name}</h4>
        <p className="text-small opacity-60">{description}</p>
        {isNew && <div className="pill absolute-top-right margin-4">New</div>}
      </Link>
    );
  };

  return (
    <>
      <div role="banner" className="background-color-transparent w-nav">
        <div className="container-1280 flex-row-middle padding-y-2 portrait-padding-x-2 w-container">
          <a href="#" className="margin-left-6 flex-row-middle w-inline-block">
            <img src={yamIcon} loading="lazy" alt="Yam Synths" className="avatar margin-right-2" />
            <h5 className="margin-0 margin-right-2 expand">Yam Synths</h5>
          </a>
          <div role="navigation" className="margin-left-auto flex-align-center">
            <a
              href="https://yam.gitbook.io/explore/"
              target="_blank"
              rel="noreferrer"
              className="text-color-4 tablet-hide w-nav-link"
            >
              Learn
            </a>
            <Link to="/explore" className="tablet-hide button w-button">
              Explore Synths
            </Link>
          </div>

          <div
            className="cursor-pointer hide tablet-block padding-2 desktop-hide relative"
            onClick={(e) => {
              e.preventDefault();
              toggleMenu();
            }}
          >
            <Icon name="Menu" className="icon opacity-100" />
            <Dropdown
              className="margin-top-10 background-color-2 absolute-top-right box-shadow-large radius-large padding-3 w-dropdown-list"
              openDropdown={openMenu}
            >
              <Link to="https://yam.gitbook.io/explore/" className="dropdown-link width-full margin-bottom-2">
                <div className="width-full text-align-center">Learn</div>
              </Link>
              <Link to="/explore" className="button width-full w-button break-no-wrap">
                Explore Synths
              </Link>
            </Dropdown>
          </div>
        </div>
      </div>
      <div className="section-in-base padding-top-0">
        <div className="container-1140 landscape-overflow-hidden w-container">
          <h1 className="text-align-center margin-bottom-4 text-5xl">Trade, hedge, & earn with Yam Synths</h1>
          <p className="text-large text-color-4 text-align-center">
            Yam Synths is your portal to the powerful world of synthetic derivatives
          </p>
          <div className="flex-space-between flex-align-baseline margin-top-16">
            <h4>Explore Yam Synths</h4>
            <Link to="/explore" className="text-color-5">
              View all
            </Link>
          </div>
          <div className="grid-3-columns">
            {/* TODO Finalize names, punctuation, links, etc */}
            <SynthBlock
              name="uPUNKS"
              image="cryptopunk"
              url="/explore/uPUNKS"
              description={SynthGroups['uPUNKS'].description}
              apr={50}
              isNew
            />
            <SynthBlock
              name="uGAS"
              image="ugas"
              url="/explore/uGAS"
              description={SynthGroups['uGAS'].description}
              apr={50}
            />
            <SynthBlock
              name="uSTONKS"
              image="ustonks_zombie"
              url="/explore/uSTONKS"
              description={SynthGroups['uSTONKS'].description}
              apr={50}
            />
          </div>
        </div>
      </div>
      <img className="width-full hero-img" src={hero}></img>
      {/*
      <div className="contains-rings">
        <div className="margin-y-48 relative flex-column-centered container-1140 w-container">
          <h2 className="text-align-center text-4xl z-10">
            Over <span className="text-color-5">$12,000,000</span> total value locked across <span className="text-color-5">48</span> synths
          </h2>
          <div className="ring _2">
            <img src={ethIcon} className="floating-icon top _2" />
            <img src={ethIcon} className="floating-icon bottom _2" />
            <img src={ethIcon} className="floating-icon right _2" />
            <img src={ethIcon} className="floating-icon left _2" />
          </div>
          <div className="ring">
            <img src={ethIcon} className="floating-icon top" />
            <img src={ethIcon} className="floating-icon right" />
            <img src={ethIcon} className="floating-icon left" />
            <img src={ethIcon} className="floating-icon bottom" />
          </div>
        </div>
      </div>
      */}
      <div className="section-in-base">
        <div className="margin-y-48 radius-xl background-color-4 padding-12 box-shadow-large sheen margin-y-0 relative container-1140 w-container overflow-hidden">
          <h2 className="width-1-2 tablet-width-full z-1 margin-bottom-8">
            Yam Synths brings you <span className="text-color-1">new opportunities</span>
          </h2>
          <div className="flex-align-center margin-top-4">
            <div className="width-8 height-8 background-color-1 radius-full flex-align-center flex-justify-center margin-right-2">
              <Icon name="Check" className="icon opacity-100" />
            </div>
            <p className="text-color-4 margin-0 text-medium">Yield farm on an extensive list of collateral tokens</p>
          </div>
          <div className="flex-align-center margin-top-4 z-1">
            <div className="width-8 height-8 background-color-1 radius-full flex-align-center flex-justify-center margin-right-2">
              <Icon name="Check" className="icon opacity-100" />
            </div>
            <p className="text-color-4 margin-0 text-medium">Access exotic synths pushing the boundaries of DeFi</p>
          </div>
          <div className="flex-align-center margin-top-4 tablet-margin-bottom-12">
            <div className="width-8 height-8 background-color-1 radius-full flex-align-center flex-justify-center margin-right-2">
              <Icon name="Check" className="icon opacity-100" />
            </div>
            <p className="text-color-4 margin-0 text-medium">Execute novel trading and hedging strategies</p>
          </div>
          <img src={gloop} className="absolute-top-right width-64 tablet-hide"></img>
          <Link
            to="/explore"
            className="button-secondary absolute-bottom-right margin-12 margin-12 tablet-relative tablet-margin-0 landscape-margin-0 portrait-margin-0"
          >
            Explore Synths
          </Link>
        </div>
      </div>
      <div className="section-in-base">
        <div className="container-1140 w-container">
          <h2 className="margin-bottom-10">What can you do with Yam Synths?</h2>
          <div className="flex-row tablet-block">
            <div className="padding-12 padding-left-0 border-right-2px width-1-2 padding-top-0 tablet-width-full tablet-border-none tablet-padding-x-0 landscape-padding-x-0 portrait-padding-x-0">
              <img src={mintLp} loading="lazy" className="bobacon margin-bottom-4" />
              <h5 className="line-height-1-625">
                Provide Liquidity <br />
                <span className="opacity-50">Earn swap fees and attractive UMA and YAM rewards.</span>
              </h5>
            </div>
            <div className="padding-12  border-right-2px width-1-2 padding-top-0 tablet-width-full tablet-border-none tablet-padding-x-0 landscape-padding-x-0 portrait-padding-x-0">
              <img src={hold} loading="lazy" className="bobacon margin-bottom-4" />
              <h5 className="line-height-1-625">
                Go Long <br />
                <span className="opacity-50">Purchase and hold a synthetic asset to gain positive exposure.</span>
              </h5>
            </div>
            <div className="padding-12 padding-right-0 width-1-2 padding-top-0 tablet-width-full tablet-border-none tablet-padding-x-0 landscape-padding-x-0 portrait-padding-x-0">
              <img src={short} loading="lazy" className="bobacon margin-bottom-4" />
              <h5 className="line-height-1-625">
                Go Short <br />
                <span className="opacity-50">Mint and sell a synth to open a short position.</span>
              </h5>
            </div>
          </div>
        </div>
      </div>
      <div className="section-in-base aura-bg z-2">
        <div className="container-1140 w-container">
          <div className="flex-row flex-wrap">
            <div className="width-1-2 tablet-width-full">
              <h4>
                <strong className="line-height-1-625">Built with love by YAM 🍠 </strong> <br />
                <strong className="line-height-1-625">Powered by UMA 🦑</strong>
              </h4>
            </div>
            <div className="width-1-6 tablet-width-1-3 landscape-width-full landscape-margin-top-6">
              <h6 className="margin-top-4">Help</h6>
              <a
                href="https://yam.gitbook.io/explore/"
                target="_blank"
                rel="noreferrer"
                className="block margin-bottom-2"
              >
                Documentation
              </a>
              <a
                href="https://yam.gitbook.io/explore/overview/faq"
                target="_blank"
                rel="noreferrer"
                className="block margin-bottom-2"
              >
                FAQs
              </a>
            </div>
            <div className="width-1-6 tablet-width-1-3 landscape-width-full landscape-margin-top-6">
              <h6 className="margin-top-4">Community</h6>
              <a
                href="https://twitter.com/YamFinance"
                target="_blank"
                rel="noreferrer"
                className="block margin-bottom-2"
              >
                Twitter
              </a>
              <a
                href="https://discord.com/invite/fbHX7NRa52"
                target="_blank"
                rel="noreferrer"
                className="block margin-bottom-2"
              >
                Discord
              </a>
            </div>
            <div className="width-1-6 tablet-width-1-3 landscape-width-full landscape-margin-top-6">
              <h6 className="margin-top-4">Information</h6>
              <a
                href="https://yambrief.substack.com/"
                target="_blank"
                rel="noreferrer"
                className="block margin-bottom-2"
              >
                Blog
              </a>
              <a href="https://yam.finance/" target="_blank" rel="noreferrer" className="block margin-bottom-2">
                Visit Yam
              </a>
              <a href="https://umaproject.org/" target="_blank" rel="noreferrer" className="block margin-bottom-2">
                Visit UMA
              </a>
            </div>
            <div className="flex-space-between width-full margin-top-8 tablet-block landscape-block portrait-block">
              <a href="#" className="flex-align-center w-inline-block">
                <img src={yamIcon} loading="lazy" alt="Yam Synths" className="avatar margin-right-2" />
                <h5 className="margin-0 margin-right-2 expand">Yam Synths</h5>
              </a>
              <p className="margin-top-4 tablet-margin-top-8 landscape-margin-top-8 portrait-margin-top-8 text-small">
                © 2021 Yam Synths. All rights reserved.
              </p>
            </div>
            <div className="flex-row text-small opacity-50 margin-top-8">
              <Link to="/legal/privacy" className="margin-right-4">Privacy Policy</Link>
              <Link to="/legal/terms">Terms & Conditions</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
