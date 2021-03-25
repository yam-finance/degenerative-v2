import React from 'react';

import { Icon } from '@/components';

const UtilizationGauge: React.FC = () => {
  return (
    <div className="margin-bottom-4">
      <div className="flex-space-between portrait-flex-column">
        <div className="margin-bottom-1">
          <strong className="text-color-4">30%</strong> Utilisation after minting
        </div>
        <div className="margin-bottom-1 text-small opacity-60">
          <strong className="text-color-4">(3.5 CR)</strong>
        </div>
      </div>
      <div className="gauge horizontal large overflow-hidden margin-bottom-2">
        <div className="collateral large"></div>
        <div className="debt horizontal">
          <div className="gradient horizontal large"></div>
        </div>
        <div className="gcr horizontal"></div>
      </div>
      <div>
        <div className="flex-align-center flex-space-between portrait-flex-column portrait-flex-align-start">
          <div>
            <div className="flex-align-center">
              <div className="width-4 height-4 radius-full background-collateral margin-right-1"></div>
              <div className="margin-right-1">Collateral</div>
              <div data-hover="1" data-delay="0" className="margin-0 w-dropdown">
                <div className="padding-0 width-4 height-4 flex-align-center flex-justify-center w-dropdown-toggle">
                  <Icon name="Info" className="icon medium" />
                </div>
                <nav className="dropdown-list radius-large box-shadow-medium w-dropdown-list">
                  <div className="width-32 text-xs">This is some text inside of a div block.</div>
                </nav>
              </div>
            </div>
          </div>
          <div>
            <div className="flex-align-center">
              <div className="width-4 height-4 radius-full background-debt margin-right-1"></div>
              <div className="margin-right-1">Debt</div>
              <div data-hover="1" data-delay="0" className="margin-0 w-dropdown">
                <div className="padding-0 width-4 height-4 flex-align-center flex-justify-center w-dropdown-toggle">
                  <Icon name="Info" className="icon medium" />
                </div>
                <nav className="dropdown-list radius-large box-shadow-medium w-dropdown-list">
                  <div className="width-32 text-xs">This is some text inside of a div block.</div>
                </nav>
              </div>
            </div>
          </div>
          <div>
            <div className="gcr-legend">
              <div className="gcr horizontal in-legend"></div>
              <div className="margin-right-1">GCR</div>
              <div data-hover="1" data-delay="0" className="margin-0 w-dropdown">
                <div className="padding-0 width-4 height-4 flex-align-center flex-justify-center w-dropdown-toggle">
                  <Icon name="Info" className="icon medium" />
                </div>
                <nav className="dropdown-list radius-large box-shadow-medium w-dropdown-list">
                  <div className="width-32 text-xs">This is some text inside of a div block.</div>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UtilizationGauge;
