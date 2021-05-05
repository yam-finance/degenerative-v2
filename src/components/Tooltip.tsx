/** 
 * @dev Example implementation: <Tooltip position="top" tooltipStyle="center" tooltipText="TVL" /> 
 * @notice Hover state has to be handled on the component where this is implemented.
 */

import React from 'react';

export const Tooltip = (props: any) => {
  return (
    <div className={`svgContainer ${props.position == 'top' ? 'svgPosTop' : 'svgPosBottom'}`}>
      <div className="svgText">
        {props.tooltipText}
        <svg
          className={`svgTriangle ${props.tooltipStyle == 'center' ? 'positionCenter' : props.tooltipStyle == 'right' ? 'positionRight' : 'positionLeft'}`}
          x="0px"
          y="0px"
          viewBox="0 0 255 255"
          xmlSpace="preserve"
        >
          <polygon className="tooltipPolygon" points="0,0 127.5,127.5 255,0" />
        </svg>
      </div>
    </div >
  );
};
