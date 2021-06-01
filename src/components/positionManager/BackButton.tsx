import React from 'react';
import { PositionManagerContainer } from '@/hooks';
import { Icon } from '@/components';

export const BackButton = () => {
  const { state, dispatch } = PositionManagerContainer.useContainer();

  return (
    <button
      className="button-secondary background-color-5 text-color-4 width-full margin-top-3 w-button"
      onClick={() => {
        dispatch({
          type: 'CHANGE_ACTION',
          payload: 'MANAGE',
        });
      }}
    >
      <div className="flex-align-center flex-justify-center margin-right-1">
        <Icon name="ArrowLeftCircle" className="margin-right-1" />
        <span className="">Back</span>
      </div>
    </button>
  );
};
