import React from 'react';
import { PositionManagerContainer } from '@/hooks';
import { Manage, Mint, Burn, Deposit, Withdraw, Redeem } from '@/components';

export const Action = () => {
  const { state, dispatch } = PositionManagerContainer.useContainer();

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
