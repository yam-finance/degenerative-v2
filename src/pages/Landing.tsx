import React from 'react';
import { Link } from 'react-router-dom';

import { MainDisplay, SideDisplay, ConnectWallet, Minter } from '@/components';
import zombieHead from '@/assets/zombie_head_large.png';

export const Landing: React.FC = () => {
  return (
    <body>
      <div data-collapse="small" data-animation="default" data-duration="400" role="banner" className="background-color-transparent w-nav">
        <div className="container-1280 flex-row-middle padding-y-2 portrait-padding-x-2 w-container">
          <a href="#" className="margin-left-6 flex-row-middle w-inline-block">
            <img src={zombieHead} loading="lazy" alt="A cute degen zombie head as the logo" className="degen margin-right-2" />
            <h5 className="margin-0 margin-right-2 expand">Degenerative</h5>
            <div className="pill">v 2.0</div>
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
            <div className="w-icon-nav-menu"></div>
          </div>
        </div>
      </div>
      <div className="section-in-base landscape-padding-top-0">
        <div className="container-1140 landscape-overflow-hidden w-container">
          <h1 className="text-align-center text-5xl">Trade, hedge, &amp; earn on all flavors of synths</h1>
          <p className="text-large text-color-4 text-align-center">Taro is your one-stop shop for every synth on the market</p>
          <div className="flex-space-between flex-align-baseline margin-top-12">
            <h4>Explore Taro</h4>
            <a href="#" className="text-color-5">
              View all
            </a>
          </div>
          <div className="grid-3-columns">
            <Link
              to="/synths"
              className="padding-8 flex-column-centered radius-xl box-shadow-large text-align-center relative background-color-1 padding-12 sheen w-inline-block"
            >
              <img src="images/Box-01.png" loading="lazy" alt="" className="width-32" />
              <h4 className="margin-top-8">uSYNTH</h4>
              <p className="text-small opacity-60">Lorem ipsum dolor sit amet, adipiscing</p>
              <div className="button">Earn 75% APY</div>
              <div className="pill absolute-top-right margin-4">New</div>
            </Link>
            <a
              href="/synth-multi"
              className="padding-8 flex-column-centered radius-xl box-shadow-large text-align-center relative background-color-1 padding-12 sheen w-inline-block"
            >
              <img src="images/Box-01.png" loading="lazy" alt="" className="width-32" />
              <h4 className="margin-top-8">uSYNTH</h4>
              <p className="text-small opacity-60">Lorem ipsum dolor sit amet, adipiscing</p>
              <div className="button">Earn 75% APY</div>
              <div className="pill absolute-top-right margin-4">New</div>
            </a>
            <a
              href="/synth-multi"
              className="padding-8 flex-column-centered radius-xl box-shadow-large text-align-center relative background-color-1 padding-12 sheen w-inline-block"
            >
              <img src="images/Box-01.png" loading="lazy" alt="" className="width-32" />
              <h4 className="margin-top-8">uSYNTH</h4>
              <p className="text-small opacity-60">Lorem ipsum dolor sit amet, adipiscing</p>
              <div className="button">Earn 75% APY</div>
              <div className="pill absolute-top-right margin-4">New</div>
            </a>
          </div>
        </div>
      </div>
      <div className="contains-rings">
        <div className="margin-y-48 relative flex-column-centered container-1140 w-container">
          <h2 className="text-align-center text-4xl z-10">
            Over <span className="text-color-5">$12,000,000</span> total value locked across <span className="text-color-5">48</span> synths
          </h2>
          <div className="ring _2">
            <img src="images/eth%20(1).png" loading="lazy" alt="" className="floating-icon top _2" />
            <img src="images/eth%20(1).png" loading="lazy" alt="" className="floating-icon bottom _2" />
            <img src="images/eth%20(1).png" loading="lazy" alt="" className="floating-icon right _2" />
            <img src="images/eth%20(1).png" loading="lazy" alt="" className="floating-icon left _2" />
          </div>
          <div className="ring">
            <img src="images/eth%20(1).png" loading="lazy" alt="" className="floating-icon top" />
            <img src="images/eth%20(1).png" loading="lazy" alt="" className="floating-icon right" />
            <img src="images/eth%20(1).png" loading="lazy" alt="" className="floating-icon left" />
            <img src="images/eth%20(1).png" loading="lazy" alt="" className="floating-icon bottom" />
          </div>
        </div>
      </div>
      <div className="section-in-base">
        <div className="margin-y-48 radius-xl background-color-4 padding-12 box-shadow-large sheen margin-y-0 relative container-1140 w-container">
          <h2 className="width-1-2 margin-bottom-8">
            Taro brings you new <span className="text-color-1">opportunities</span>
          </h2>
          <div className="flex-align-center margin-top-4">
            <div className="width-8 height-8 background-color-1 radius-full flex-align-center flex-justify-center margin-right-2">
              <img src="images/" loading="lazy" data-feather="check" alt="" className="icon opacity-100" />
            </div>
            <p className="text-color-4 margin-0 text-medium">Interact with up to 48 synths</p>
          </div>
          <div className="flex-align-center margin-top-4">
            <div className="width-8 height-8 background-color-1 radius-full flex-align-center flex-justify-center margin-right-2">
              <img src="images/" loading="lazy" data-feather="check" alt="" className="icon opacity-100" />
            </div>
            <p className="text-color-4 margin-0 text-medium">Interact with up to 48 synths</p>
          </div>
          <div className="flex-align-center margin-top-4">
            <div className="width-8 height-8 background-color-1 radius-full flex-align-center flex-justify-center margin-right-2">
              <img src="images/" loading="lazy" data-feather="check" alt="" className="icon opacity-100" />
            </div>
            <p className="text-color-4 margin-0 text-medium">Interact with up to 48 synths</p>
          </div>
          <a href="#" className="button-secondary absolute-bottom-right margin-12 w-button">
            Explore Synths
          </a>
        </div>
      </div>
      <div className="section-in-base">
        <div className="container-1140 w-container">
          <h2 className="margin-bottom-10">What can you do with Taro?</h2>
          <div className="flex-row tablet-block">
            <div className="padding-20 padding-left-0 border-bottom-2px border-right-2px width-1-2 padding-top-0 tablet-width-full tablet-border-none tablet-padding-x-0">
              <img src="images/Group%2024.png" loading="lazy" alt="" className="bobacon margin-bottom-4" />
              <h5 className="line-height-1-625">
                Mint and LP{' '}
                <span className="opacity-50">
                  synths in pools to earn UMA and Yam rewards. To qualify, users must both mint and deposit their synth tokens. Tokens which are traded and then
                  deposited will not qualify.
                </span>
              </h5>
            </div>
            <div className="padding-20 padding-right-0 border-bottom-2px width-1-2 padding-top-0 tablet-width-full tablet-border-none tablet-padding-x-0">
              <img src="images/Slice%202.png" loading="lazy" alt="" className="bobacon margin-bottom-4" />
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
              <img src="images/Group%2026.png" loading="lazy" alt="" className="bobacon margin-bottom-4" />
              <h5 className="line-height-1-625">
                Short{' '}
                <span className="opacity-50">
                  by depositing collateral to mint synth tokens and sell them on a DEX. After the synth token price has fallen, buy back your position and
                  unlock the collateral.
                </span>
              </h5>
            </div>
            <div className="padding-20 padding-right-0 width-1-2 padding-bottom-0 tablet-width-full tablet-border-none tablet-padding-x-0">
              <img src="images/Slice%201.png" loading="lazy" alt="" className="bobacon margin-bottom-4" />
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
            <h4 id="w-node-_88dae457-ec93-6b20-f380-1dc167a1d28a-67a1d287">
              <strong className="line-height-1-625">Built with love by YAM 🍠 </strong>
            </h4>
            <div id="w-node-_88dae457-ec93-6b20-f380-1dc167a1d28d-67a1d287">
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
            <div id="w-node-_88dae457-ec93-6b20-f380-1dc167a1d296-67a1d287">
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
            <div id="w-node-_88dae457-ec93-6b20-f380-1dc167a1d29f-67a1d287">
              <h6 className="margin-top-4">Information</h6>
              <a href="#" className="block margin-bottom-2">
                About Taro
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
            <a id="w-node-_88dae457-ec93-6b20-f380-1dc167a1d2aa-67a1d287" href="#" className="flex-align-center w-inline-block">
              <img src="images/Group%201%40256.png" loading="lazy" alt="A cute degen zombie head as the logo" className="degen margin-right-2" />
              <h5 className="margin-0 margin-right-2 expand">Degenerative</h5>
              <div className="pill">v 2.0</div>
            </a>
            <p id="w-node-_88dae457-ec93-6b20-f380-1dc167a1d2b0-67a1d287" className="text-align-right margin-top-4 text-small landscape-text-align-left">
              © 2020 Taro. All rights reserved.
              <br />
            </p>
          </div>
        </div>
      </div>
    </body>
  );
};
