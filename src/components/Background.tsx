import React from 'react';

export const Background: React.FC = () => {
  const styles = {
    zIndex: -1,
    position: "relative"
  }
  
  return <div style={styles}>
      <div className="circle-1"></div>
      <div className="circle-2"></div>
      <div className="circle-3"></div>
      <div className="circle-4"></div>
      <div className="circle-5"></div>
    </div>;
};
