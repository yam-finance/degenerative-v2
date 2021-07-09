import { useReducer } from 'react';
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
  synths: 0,
};

type State = typeof initialMinterState;
type Action =
  | { type: 'INIT_SPONSOR_POSITION'; payload: Partial<State> }
  | { type: 'UPDATE_SPONSOR_POSITION'; payload: Partial<State> }
  | { type: 'UPDATE_RESULTING_POSITION'; payload: Partial<State> }
  | { type: 'CHANGE_ACTION'; payload: string }
  | { type: 'TOGGLE_WITHDRAWAL_MODAL'; payload: Partial<State> }
  | { type: 'UPDATE_MAX_COLLATERAL'; payload: Partial<State> }
  | { type: 'RESET_RESULTING_POSITION'; payload: Partial<State> };

// TODO Reducer has no type checking currently. Need to change.
const reducer = (state: State, action: Action) => {
  //console.log(action.type);
  switch (action.type) {
    case 'INIT_SPONSOR_POSITION': {
      const initialized = action.payload;
      //console.log(initialized);

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
        utilization: calculateUtilization(resultingCollateral ?? 0, resultingTokens ?? 0),
      };
    }
    case 'UPDATE_RESULTING_POSITION': {
      const { resultingCollateral, resultingTokens } = action.payload;

      const newCollateral = resultingCollateral;
      const newTokens = resultingTokens;

      const util = (() => {
        const util = calculateUtilization(newCollateral ?? 0, newTokens ?? 0);
        return util > 0 && util !== Infinity ? roundDecimals(util, 4) : 0;
      })();

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
      const { modalWithdrawalAmount } = action.payload;

      return {
        ...state,
        showWithdrawalModal: !state.showWithdrawalModal,
        modalWithdrawalAmount: modalWithdrawalAmount,
      };
    }
    case 'UPDATE_MAX_COLLATERAL': {
      const { maxCollateral } = action.payload;

      return {
        ...state,
        maxCollateral: maxCollateral,
      };
    }
    default:
      throw new Error('Invalid state change');
  }
};

const calculateUtilization = (collateral: number, tokens: number) => tokens / collateral;

const usePositionManager = () => {
  const [state, dispatch] = useReducer<typeof reducer>(reducer, initialMinterState as never);
  const actions = useSynthActions();
  const exportedState = (state as unknown) as State;

  return { actions, state: exportedState, dispatch };
};

export const PositionManagerContainer = createContainer(usePositionManager);
