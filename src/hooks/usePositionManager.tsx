import React, { useContext, useReducer } from 'react';
import { createContainer } from 'unstated-next';

import { roundDecimals } from '@/utils';
import { useSynthActions } from './useSynthActions';

export type MinterAction = 'MANAGE' | 'MINT' | 'DEPOSIT' | 'BURN' | 'REDEEM' | 'WITHDRAW' | 'SETTLE';

const initialMinterState = {
  loading: true,
  image: '/images/Box-01.png',
  action: 'MANAGE' as MinterAction,
  sponsorCollateral: 0,
  sponsorTokens: 0,
  withdrawalRequestAmount: 0,
  withdrawalRequestMinutesLeft: 0,
  utilization: 0,
  globalUtilization: 0,
  liquidationPoint: 0,
  tokenPrice: 0,
  minTokens: 0,
  maxCollateral: 0,
  isExpired: false,

  resultingCollateral: 0,
  resultingTokens: 0,
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
  | 'UPDATE_RESULTING_POSITION'
  | 'CHANGE_ACTION'
  | 'TOGGLE_WITHDRAWAL_MODAL'
  | 'UPDATE_MAX_COLLATERAL'
  | 'RESET_RESULTING_POSITION';

// TODO Reducer has no type checking currently. Need to change.
const Reducer = (state: State, action: { type: Action; payload: any }) => {
  console.log(action.type);
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
      const { resultingCollateral, resultingTokens } = action.payload;

      return {
        ...state,
        sponsorCollateral: resultingCollateral,
        sponsorTokens: resultingTokens,
        utilization: calculateUtilization(resultingCollateral, resultingTokens, state.tokenPrice),
      };
    }
    case 'UPDATE_RESULTING_POSITION': {
      const { resultingCollateral, resultingTokens } = action.payload;

      const newCollateral = resultingCollateral;
      const newTokens = resultingTokens;

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
        resultingCollateral: newCollateral,
        resultingTokens: newTokens,
        resultingUtilization: util,
      };
    }
    case 'RESET_RESULTING_POSITION': {
      return {
        ...state,
        resultingCollateral: 0,
        resultingTokens: 0,
        resultingUtilization: 0,
      };
    }
    case 'CHANGE_ACTION': {
      return {
        ...state,
        action: action.payload,
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
  const actions = useSynthActions();

  return { actions, state, dispatch };
};

export const PositionManagerContainer = createContainer(usePositionManager);
