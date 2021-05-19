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
import umaLogo from '@/assets/uma_logo.png';

export const Landing: React.FC = () => {
  interface SynthBlockProps {
    name: string;
    image: string;
    url: string;
    description: string;
    apr: number;
  }
  
  const [openMenu, setOpenMenu] = useState(false);
  const toggleMenu = () => setOpenMenu(!openMenu);

  const SynthBlock: React.FC<SynthBlockProps> = ({ name, image, url, description, apr }) => {
    return (
      <Link
        to={url}
        className="padding-8 blur flex-column-centered radius-xl box-shadow-large text-align-center relative background-color-1 padding-12 sheen w-inline-block"
      >
        <img src={`/images/${image}.png`} className="width-32" />
        <h4 className="margin-top-8">{name}</h4>
        <p className="text-small opacity-60">{description}</p>
        <div className="pill absolute-top-right margin-4">New</div>
      </Link>
    );
  };

  return (
    <>
      <div
        data-collapse="small"
        data-animation="default"
        data-duration="400"
        role="banner"
        className="background-color-transparent w-nav"
      >
        <div className="container-1280 flex-row-middle padding-y-2 portrait-padding-x-2 w-container">
          <a href="#" className="margin-left-6 flex-row-middle w-inline-block">
            <img src={yamIcon} loading="lazy" alt="Yam Synths" className="avatar margin-right-2" />
            <h5 className="margin-0 margin-right-2 expand">Yam Synths</h5>
          </a>
          <div
            role="navigation"
            className="margin-left-auto flex-align-center"
          >
            <a href="#" target="_blank" className="text-color-4 tablet-hide w-nav-link">
              Learn
            </a>
            <Link to="/synths" className="tablet-hide button w-button">
              Explore Synths
            </Link>
          </div>
          
          <div className="cursor-pointer hide tablet-block padding-2 desktop-hide relative"
            onClick={(e) => {
              e.preventDefault();
              toggleMenu();
            }}>
            <Icon name="Menu" className="icon opacity-100" />
            <Dropdown className="margin-top-10 background-color-2 absolute-top-right box-shadow-large radius-large padding-3 w-dropdown-list" openDropdown={openMenu}>
              <Link to="#" className="dropdown-link width-full margin-bottom-2"><div className="width-full text-align-center">Learn</div></Link>
              <Link to="/synths" className="button width-full w-button break-no-wrap">
                Explore Synths
              </Link>
            </Dropdown>
          </div>
          
        </div>
      </div>
      <div className="section-in-base padding-top-0">
        <div className="container-1140 landscape-overflow-hidden w-container">
          {/* TODO Not doing yield party on launch
          <a href="/yield-party" className="block w-inline-block">
            <div className="callout-container">
              <div className="emoji-container-1">
                <img
                  src="/images/yam.png"
                  loading="lazy"
                  sizes="(max-width: 479px) 100vw, (max-width: 767px) 28vw, (max-width: 991px) 18vw, 14vw"
                  srcSet="images/SweetPotatoRender_1-p-500.png 500w, images/SweetPotatoRender_1-p-800.png 800w, images/SweetPotatoRender_1.png 1000w"
                  alt=""
                  className="width-32 drift-1"
                />
                <img
                  src="images/WhaleRender_1.png"
                  loading="lazy"
                  sizes="(max-width: 767px) 136.61703491210938px, (max-width: 991px) 18vw, 14vw"
                  srcSet="images/WhaleRender_1-p-500.png 500w, images/WhaleRender_1-p-800.png 800w, images/WhaleRender_1.png 1000w"
                  alt=""
                  className="width-32 drift-2 move-up"
                />
                <img
                  src="images/CornRender_1.png"
                  loading="lazy"
                  sizes="(max-width: 479px) 100vw, (max-width: 767px) 28vw, (max-width: 991px) 18vw, 14vw"
                  srcSet="images/CornRender_1-p-500.png 500w, images/CornRender_1-p-800.png 800w, images/CornRender_1.png 1000w"
                  alt=""
                  className="width-32 drift-1"
                />
              </div>
              <div className="callout drift-3">
                <h5 className="text-color-1 margin-right-8 margin-bottom-0 break-no-wrap">Announcing Yield Party!</h5>
                <div className="text-color-1 opacity-60 margin-right-2 break-no-wrap">Join the party</div>
                <div className="radius-full background-color-5 padding-2 fix-size">
                  <img src="images/" loading="lazy" data-feather="arrow-right" alt="" className="icon opacity-100" />
                </div>
              </div>
              <div className="emoji-container-2">
                <img
                  src="images/UnicornRender_1.png"
                  loading="lazy"
                  sizes="(max-width: 479px) 100vw, (max-width: 767px) 136.61703491210938px, (max-width: 991px) 18vw, 14vw"
                  srcSet="images/UnicornRender_1-p-500.png 500w, images/UnicornRender_1-p-800.png 800w, images/UnicornRender_1.png 1000w"
                  alt=""
                  className="width-32 drift-1"
                />
                <img
                  src="images/SushiRender_1.png"
                  loading="lazy"
                  sizes="(max-width: 479px) 100vw, (max-width: 767px) 28vw, (max-width: 991px) 18vw, 14vw"
                  srcSet="images/SushiRender_1-p-500.png 500w, images/SushiRender_1-p-800.png 800w, images/SushiRender_1.png 1000w"
                  alt=""
                  className="width-32 drift-2"
                />
                <img
                  src="images/OwlRender_1.png"
                  loading="lazy"
                  sizes="(max-width: 479px) 100vw, (max-width: 767px) 136.61700439453125px, (max-width: 991px) 136.6170654296875px, 14vw"
                  srcSet="images/OwlRender_1-p-500.png 500w, images/OwlRender_1-p-800.png 800w, images/OwlRender_1.png 1000w"
                  alt=""
                  className="width-32 drift-3 move-up"
                />
              </div>
            </div>
          </a> */}

          <h1 className="text-align-center margin-bottom-4 text-5xl">Trade, hedge, & earn with Yam Synths</h1>
          <p className="text-large text-color-4 text-align-center">
            Yam Synths is your portal to the powerful world of synthetic derivatives
          </p>
          <div className="flex-space-between flex-align-baseline margin-top-16">
            <h4>Explore Yam Synths</h4>
            <Link to="/synths" className="text-color-5">
              View all
            </Link>
          </div>
          <div className="grid-3-columns">
            {/* TODO Finalize names, punctuation, links, etc */}
            <SynthBlock
              name="uPUNKS"
              image="cryptopunk"
              url="/synths/uPUNKS"
              description={SynthGroups['uPUNKS'].description}
              apr={50}
            />
            <SynthBlock
              name="uGAS"
              image="ugas"
              url="/synths/uGas"
              description={SynthGroups['uGas'].description}
              apr={50}
            />
            <SynthBlock
              name="uSTONKS"
              image="ustonks_zombie"
              url="/synths/uStonks"
              description={SynthGroups['uStonks'].description}
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
            Yam Synths enable <span className="text-color-1">powerful investment strategies</span>
          </h2>
          <div className="flex-align-center margin-top-4">
            <div className="width-8 height-8 background-color-1 radius-full flex-align-center flex-justify-center margin-right-2">
              <Icon name="Check" className="icon opacity-100" />
            </div>
            <p className="text-color-4 margin-0 text-medium">Access to new synths that push the bounds of DeFi</p>
          </div>
          <div className="flex-align-center margin-top-4 z-1">
            <div className="width-8 height-8 background-color-1 radius-full flex-align-center flex-justify-center margin-right-2">
              <Icon name="Check" className="icon opacity-100" />
            </div>
            <p className="text-color-4 margin-0 text-medium">Execute innovative trading and hedging strategies</p>
          </div>
          <div className="flex-align-center margin-top-4 tablet-margin-bottom-12">
            <div className="width-8 height-8 background-color-1 radius-full flex-align-center flex-justify-center margin-right-2">
              <Icon name="Check" className="icon opacity-100" />
            </div>
            <p className="text-color-4 margin-0 text-medium">Grow along with the expanding world of Yam Synths</p>
          </div>
          <img src="/src/assets/gloop.png" className="absolute-top-right width-64 tablet-hide"></img>
          <Link to="/synths" className="button-secondary absolute-bottom-right margin-12 margin-12 tablet-relative tablet-margin-0 landscape-margin-0 portrait-margin-0">
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
                Provide Liquidity{' '}
                <span className="opacity-50">
                  to earn rewards by minting a synth against collateral & pool it alongside the asset it trades against
                  in our selected AMM to earn UMA + Yam rewards. On top of this, LPs earn market maker fees.
                  Alternatively, you can go long a synth instead of minting it, to use when providing liquidity.
                </span>
              </h5>
            </div>
            <div className="padding-12  border-right-2px width-1-2 padding-top-0 tablet-width-full tablet-border-none tablet-padding-x-0 landscape-padding-x-0 portrait-padding-x-0">
              <img src={hold} loading="lazy" className="bobacon margin-bottom-4" />
              <h5 className="line-height-1-625">
                Go Long{' '}
                <span className="opacity-50">
                  to express your price positive market view on a variety of innovative synthetic assets. Simply buy the
                  synth from our chosen AMM pool and hold until expiry, or sell it back to the AMM pool anytime before
                  expiry.
                </span>
              </h5>
            </div>
            <div className="padding-12 padding-right-0 width-1-2 padding-top-0 tablet-width-full tablet-border-none tablet-padding-x-0 landscape-padding-x-0 portrait-padding-x-0">
              <img src={short} loading="lazy" className="bobacon margin-bottom-4" />
              <h5 className="line-height-1-625">
                Go Short{' '}
                <span className="opacity-50">
                  into what you perceive is an overvalued market, profiting on falling prices. To achieve this you’ll
                  need to mint the synth against collateral and sell it to the relevant AMM pool. To realise
                  gains/losses on your position, hold until expiry, or buy back the synth before expiry.
                </span>
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
                <strong className="line-height-1-625">Powered by UMA</strong>
              </h4>
            </div>
            <div className="width-1-6 tablet-width-1-3 landscape-width-full landscape-margin-top-6">
              <h6 className="margin-top-4">Help</h6>
              <a href="#" className="block margin-bottom-2">
                Tutorials
              </a>
              <a href="#" className="block margin-bottom-2">
                Documentation
              </a>
              <a href="#" className="block margin-bottom-2">
                FAQs
              </a>
            </div>
            <div className="width-1-6 tablet-width-1-3 landscape-width-full landscape-margin-top-6">
              <h6 className="margin-top-4">Community</h6>
              <a href="#" className="block margin-bottom-2">
                Twitter
              </a>
              <a href="#" className="block margin-bottom-2">
                Discord
              </a>
              <a href="#" className="block margin-bottom-2">
                Telegram
              </a>
            </div>
            <div className="width-1-6 tablet-width-1-3 landscape-width-full landscape-margin-top-6">
              <h6 className="margin-top-4">Information</h6>
              <a href="#" className="block margin-bottom-2">
                About Yam Synths
              </a>
              <a href="#" className="block margin-bottom-2">
                Blog
              </a>
              <a href="#" className="block margin-bottom-2">
                Visit Yam
              </a>
              <a href="#" className="block margin-bottom-2">
                Visit UMA
              </a>
            </div>
            <div className="flex-space-between width-full margin-top-8 tablet-block landscape-block portrait-block">
              <a href="#" className="flex-align-center w-inline-block">
                <img src={yamIcon} loading="lazy" alt="Yam Synths" className="avatar margin-right-2" />
                <h5 className="margin-0 margin-right-2 expand">Yam Synths</h5>
              </a>
              <p className="margin-top-4 tablet-margin-top-8 landscape-margin-top-8 portrait-margin-top-8 text-small">
                © 2020 Yam Synths. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
