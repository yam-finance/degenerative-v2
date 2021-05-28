import React from 'react';
import { PositionManagerContainer } from '@/hooks';
import { Icon } from '@/components';

export const BackButton = () => {
  const { state, dispatch } = PositionManagerContainer.useContainer();

  return (
    <button
      className="button-secondary button-small white width-full margin-1 w-button"
      onClick={() => {
        dispatch({
          type: 'CHANGE_ACTION',
          payload: 'MANAGE',
        });
      }}
    >
      <div className="flex-align-center flex-justify-center margin-1">
        <Icon name="ArrowLeftCircle" className="margin-right-1" />
        <span className="">Back</span>
      </div>
    </button>
  );
};
