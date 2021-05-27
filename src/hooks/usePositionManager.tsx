import React, { useContext, useReducer } from 'react';
import { createContainer } from 'unstated-next';

import { roundDecimals } from '@/utils';

/* The component's state is the actual sponsor position. The form is the pending position. */

/* 
  - Mint: Create new position OR add synths to existing position.
  - Burn: Removes synths from position. Must have synths in wallet to do so.
  - Deposit: Adds collateral to position, reducing utilization.
  - Withdraw: Removes collateral from position, increasing utilization. May have to request
  - Redeem: Repays debt AND removes collateral to maintain same utilization.
  - Settle: Settles sponsor position AFTER expiry.
*/
export type MinterAction = 'MANAGE' | 'MINT' | 'ADD_COLLATERAL' | 'REPAY' | 'REDEEM' | 'WITHDRAW' | 'SETTLE';

const initialMinterState = {
  loading: true,
  image: '/images/Box-01.png',
  action: 'MINT' as MinterAction,
  sponsorCollateral: 0,
  sponsorTokens: 0,
  withdrawalRequestAmount: 0,
  withdrawalRequestMinutesLeft: 0,
  utilization: 0,
  globalUtilization: 0,
  liquidationPoint: 0,
  tokenPrice: 0,
  minTokens: 0,
  maxCollateral: 0, // TODO replace with synthInWallet item
  isExpired: false,

  pendingCollateral: 0,
  pendingTokens: 0,
  resultingUtilization: 0,
  editCollateral: true,
  editTokens: true,

  showWithdrawalModal: false,
  modalWithdrawalAmount: 0,
};

type State = typeof initialMinterState;
type Action =
  | 'INIT_SPONSOR_POSITION'
  | 'UPDATE_SPONSOR_POSITION'
  | 'UPDATE_PENDING_POSITION'
  | 'UPDATE_PENDING_UTILIZATION'
  | 'CHANGE_ACTION'
  | 'OPEN_INPUTS'
  | 'TOGGLE_WITHDRAWAL_MODAL'
  | 'UPDATE_MAX_COLLATERAL';

// TODO Reducer has no type checking currently. Need to change.
const Reducer = (state: State, action: { type: Action; payload: any }) => {
  switch (action.type) {
    case 'INIT_SPONSOR_POSITION': {
      const initialized = action.payload;
      console.log(initialized);

      return {
        ...state,
        loading: false,
        image: initialized.image,
        sponsorCollateral: initialized.sponsorCollateral,
        sponsorTokens: initialized.sponsorTokens,
        withdrawalRequestAmount: initialized.withdrawalRequestAmount,
        withdrawalRequestMinutesLeft: initialized.withdrawalRequestMinutesLeft,
        utilization: initialized.utilization,
        globalUtilization: initialized.globalUtilization,
        liquidationPoint: initialized.liquidationPoint,
        tokenPrice: initialized.tokenPrice,
        minTokens: initialized.minTokens,
        maxCollateral: initialized.maxCollateral,
        isExpired: initialized.isExpired,
      };
    }
    case 'UPDATE_SPONSOR_POSITION': {
      const { pendingCollateral, pendingTokens } = action.payload;

      return {
        ...state,
        sponsorCollateral: pendingCollateral,
        sponsorTokens: pendingTokens,
        utilization: calculateUtilization(pendingCollateral, pendingTokens, state.tokenPrice),
      };
    }
    // TODO Remove
    case 'UPDATE_PENDING_UTILIZATION': {
      const { pendingCollateral, pendingTokens } = action.payload;
      const util = calculateUtilization(pendingCollateral, pendingTokens, state.tokenPrice);

      return {
        ...state,
        resultingUtilization: util > 0 && util !== Infinity ? roundDecimals(util, 2) : 0,
      };
    }
    case 'UPDATE_PENDING_POSITION': {
      const { pendingCollateral, pendingTokens } = action.payload;

      const newCollateral = pendingCollateral + state.sponsorCollateral;
      const newTokens = pendingTokens + state.sponsorTokens;

      const util = (() => {
        const util = calculateUtilization(newCollateral, newTokens, state.tokenPrice);
        return util > 0 && util !== Infinity ? roundDecimals(util, 4) : 0;
      })();

      console.log('---------');
      console.log(newCollateral);
      console.log(newTokens);
      console.log(util);

      return {
        ...state,
        pendingCollateral: newCollateral,
        pendingTokens: newTokens,
        resultingUtilization: util,
      };
    }
    case 'CHANGE_ACTION': {
      return {
        ...state,
        action: action.payload,
      };
    }
    case 'OPEN_INPUTS': {
      const { editCollateral, editTokens } = action.payload;

      return {
        ...state,
        editCollateral: editCollateral,
        editTokens: editTokens,
      };
    }
    case 'TOGGLE_WITHDRAWAL_MODAL': {
      const { withdrawalAmount } = action.payload;

      return {
        ...state,
        showWithdrawalModal: !state.showWithdrawalModal,
        modalWithdrawalAmount: withdrawalAmount,
      };
    }
    case 'UPDATE_MAX_COLLATERAL': {
      const { collateral } = action.payload;

      return {
        ...state,
        maxCollateral: collateral,
      };
    }
    default:
      throw new Error('Invalid state change');
  }
};

const calculateUtilization = (collateral: number, tokens: number, price: number) => (tokens * price) / collateral;

const usePositionManager = () => {
  const [state, dispatch] = useReducer(Reducer, initialMinterState);

  return { state, dispatch };
};

export const PositionManagerContainer = createContainer(usePositionManager);
