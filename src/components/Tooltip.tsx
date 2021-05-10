/**
 * @dev Example implementation: <Tooltip position="top" tooltipStyle="center" tooltipText="TVL" />
 * @notice Hover state has to be handled on the component where this is implemented.
 */

import React from 'react';

interface TooltipProps {
  position?: 'top';
  tooltipText: string;
  tooltipStyle?: 'center' | 'right';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = (props: TooltipProps) => {
  return (
    <div className={`svg-container ${props.position == 'top' ? 'svg-pos-top' : 'svg-pos-bottom'} ${props.className}`}>
      <div className="svg-text">
        {props.tooltipText}
        <svg
          className={`svg-triangle ${props.tooltipStyle == 'center' ? 'position-center' : props.tooltipStyle == 'right' ? 'position-right' : 'position-left'}`}
          x="0px"
          y="0px"
          viewBox="0 0 255 255"
          xmlSpace="preserve"
        >
          <polygon className="tooltip-polygon" points="0,0 127.5,127.5 255,0" />
        </svg>
      </div>
    </div>
  );
};
