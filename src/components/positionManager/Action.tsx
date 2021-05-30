import React from 'react';
import { PositionManagerContainer, useSynthActions } from '@/hooks';
import { Dropdown, Icon, Loader, Manage, Mint, Burn, Deposit, Withdraw } from '@/components';

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
      return null; // TODO
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
