import React from 'react';
import { PositionManagerContainer } from '@/hooks';
import { Burn, Deposit, Manage, Mint, Redeem, Withdraw } from '@/components';

export const ActionSelector = () => {
  const { state } = PositionManagerContainer.useContainer();

  switch (state.action) {
    case 'MANAGE': {
      return <Manage />;
    }
    case 'MINT': {
      return <Mint />;
    }
    case 'BURN': {
      return <Burn />;
    }
    case 'REDEEM': {
      return <Redeem />;
    }
    case 'DEPOSIT': {
      return <Deposit />;
    }
    case 'WITHDRAW': {
      return <Withdraw />;
    }
    default: {
      return null;
    }
  }
};
