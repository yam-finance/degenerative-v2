import React from 'react';
import { Link } from 'react-router-dom';

import { Icon } from '@/components';
import { SynthGroups } from '@/utils';
import yamIcon from '@/assets/yamIcon.png';
import ethIcon from '@/assets/ethIcon.png';
import mintLp from '@/assets/mintLp.png';
import hold from '@/assets/hold.png';
import short from '@/assets/short.png';
import redeem from '@/assets/redeem.png';

export const Landing: React.FC = () => {
  const SynthBlock: React.FC<{ name: string; image: string; url: string; description: string; apr: number }> = ({ name, image, url, description, apr }) => {
    return (
      <Link
        to={url}
        className="padding-8 flex-column-centered radius-xl box-shadow-large text-align-center relative background-color-1 padding-12 sheen w-inline-block"
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
      <div data-collapse="small" data-animation="default" data-duration="400" role="banner" className="background-color-transparent w-nav">
        <div className="container-1280 flex-row-middle padding-y-2 portrait-padding-x-2 w-container">
          <a href="#" className="margin-left-6 flex-row-middle w-inline-block">
            <img src={yamIcon} loading="lazy" alt="Yam Synths" className="avatar margin-right-2" />
            <h5 className="margin-0 margin-right-2 expand">Yam Synths</h5>
          </a>
          <nav role="navigation" className="margin-left-auto flex-align-center landscape-padding-2 landscape-background-color-2 w-nav-menu">
            <a href="#" target="_blank" className="text-color-4 landscape-text-align-center landscape-block w-nav-link">
              Learn
            </a>
            <Link to="/synths" className="button w-button">
              Explore Synths
            </Link>
          </nav>
          {/* TODO make into responsive navbar component */}
          <div className="margin-left-auto landscaape-background-color-2 w-nav-button">
            <div className="w-icon-nav-menu" />
          </div>
        </div>
      </div>
      <div className="section-in-base landscape-padding-top-0">
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

          <h1 className="text-align-center text-5xl">Trade, hedge, &amp; earn on all flavors of synths</h1>
          <p className="text-large text-color-4 text-align-center">Yam Synths is your one-stop shop for every synth on the market</p>
          <div className="flex-space-between flex-align-baseline margin-top-12">
            <h4>Explore Yam Synths</h4>
            <Link to="/synths" className="text-color-5">
              View all
            </Link>
          </div>
          <div className="grid-3-columns">
            {/* TODO Finalize names, punctuation, links, etc */}
            <SynthBlock name="uPUNKS" image="cryptopunk" url="/synths/uPUNK-ETH" description={SynthGroups['uPUNK-ETH'].description} apr={50} />
            <SynthBlock name="uGAS" image="ugas" url="/synths/uGas" description={SynthGroups['uGas'].description} apr={50} />
            <SynthBlock name="uSTONKS" image="ustonks" url="/synths/uStonks" description={SynthGroups['uStonks'].description} apr={50} />
          </div>
        </div>
      </div>
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
        <div className="margin-y-48 radius-xl background-color-4 padding-12 box-shadow-large sheen margin-y-0 relative container-1140 w-container">
          <h2 className="width-1-2 margin-bottom-8">
            Yam Synths brings you new <span className="text-color-1">opportunities</span>
          </h2>
          <div className="flex-align-center margin-top-4">
            <div className="width-8 height-8 background-color-1 radius-full flex-align-center flex-justify-center margin-right-2">
              <Icon name="Check" className="icon opacity-100" />
            </div>
            <p className="text-color-4 margin-0 text-medium">Interact with up to 48 synths</p>
          </div>
          <div className="flex-align-center margin-top-4">
            <div className="width-8 height-8 background-color-1 radius-full flex-align-center flex-justify-center margin-right-2">
              <Icon name="Check" className="icon opacity-100" />
            </div>
            <p className="text-color-4 margin-0 text-medium">Interact with up to 48 synths</p>
          </div>
          <div className="flex-align-center margin-top-4">
            <div className="width-8 height-8 background-color-1 radius-full flex-align-center flex-justify-center margin-right-2">
              <Icon name="Check" className="icon opacity-100" />
            </div>
            <p className="text-color-4 margin-0 text-medium">Interact with up to 48 synths</p>
          </div>
          <Link to="/synths" className="button-secondary absolute-bottom-right margin-12 w-button">
            Explore Synths
          </Link>
        </div>
      </div>
      <div className="section-in-base">
        <div className="container-1140 w-container">
          <h2 className="margin-bottom-10">What can you do with Yam Synths?</h2>
          <div className="flex-row tablet-block">
            <div className="padding-20 padding-left-0 border-bottom-2px border-right-2px width-1-2 padding-top-0 tablet-width-full tablet-border-none tablet-padding-x-0">
              <img src={mintLp} loading="lazy" className="bobacon margin-bottom-4" />
              <h5 className="line-height-1-625">
                Mint and LP{' '}
                <span className="opacity-50">
                  synths in pools to earn UMA and Yam rewards. To qualify, users must both mint and deposit their synth tokens. Tokens which are traded and then
                  deposited will not qualify.
                </span>
              </h5>
            </div>
            <div className="padding-20 padding-right-0 border-bottom-2px width-1-2 padding-top-0 tablet-width-full tablet-border-none tablet-padding-x-0">
              <img src={hold} loading="lazy" className="bobacon margin-bottom-4" />
              <h5 className="line-height-1-625">
                Hold <span className="opacity-50">your synth tokens until the expiry date or</span> trade{' '}
                <span className="opacity-50">
                  them on your favorite DEX to pocket the difference between your minting cost and the synthetics spot price as profit.
                </span>
              </h5>
            </div>
          </div>
          <div className="flex-row tablet-block">
            <div className="padding-20 padding-left-0 border-right-2px width-1-2 padding-bottom-0 tablet-width-full tablet-border-none tablet-padding-x-0">
              <img src={short} loading="lazy" className="bobacon margin-bottom-4" />
              <h5 className="line-height-1-625">
                Short{' '}
                <span className="opacity-50">
                  by depositing collateral to mint synth tokens and sell them on a DEX. After the synth token price has fallen, buy back your position and
                  unlock the collateral.
                </span>
              </h5>
            </div>
            <div className="padding-20 padding-right-0 width-1-2 padding-bottom-0 tablet-width-full tablet-border-none tablet-padding-x-0">
              <img src={redeem} loading="lazy" className="bobacon margin-bottom-4" />
              <h5 className="line-height-1-625">
                Redeem{' '}
                <span className="opacity-50">
                  your minted synth at any time before or after expiry to retrieve your collateral. We give you full flexibility to make sure you can do with
                  your collateral whatever you like.
                </span>
              </h5>
            </div>
          </div>
        </div>
      </div>
      <div className="section-in-base aura-bg z-2">
        <div className="container-1140 w-container">
          <div className="w-layout-grid grid-2">
            <h4>
              <strong className="line-height-1-625">Built with love by YAM 🍠 </strong>
            </h4>
            <div>
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
            <div>
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
            <div>
              <h6 className="margin-top-4">Information</h6>
              <a href="#" className="block margin-bottom-2">
                About Yam Synths
              </a>
              <a href="#" className="block margin-bottom-2">
                Blog
              </a>
              <a href="#" className="block margin-bottom-2">
                Visit UMA
              </a>
              <a href="#" className="block margin-bottom-2">
                Visit Yam
              </a>
            </div>
            <a href="#" className="flex-align-center w-inline-block">
              <img src={yamIcon} loading="lazy" alt="Yam Synths" className="avatar margin-right-2" />
              <h5 className="margin-0 margin-right-2 expand">Yam Synths</h5>
            </a>
            <p className="text-align-right margin-top-4 text-small landscape-text-align-left">
              © 2020 Yam Synths. All rights reserved.
              <br />
            </p>
          </div>
        </div>
      </div>
      </>
  );
};
