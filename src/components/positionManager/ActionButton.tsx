import React, { useContext, useState } from 'react';
import clsx from 'clsx';
import { UserContext } from '@/contexts';

interface ActionButtonProps {
  disableCondition?: boolean;
  action?: () => Promise<void>; // This is for SC calls
  onClick?: () => never; // This is for everything else
}

export const ActionButton: React.FC<ActionButtonProps> = ({ disableCondition, action, onClick, children }) => {
  const { triggerUpdate } = useContext(UserContext) ?? {};
  const [waiting, setWaiting] = useState(false);

  const callAction = async (action: () => Promise<void>) => {
    setWaiting(true);
    await action();
    setWaiting(false);
    triggerUpdate && triggerUpdate();
  };

  const callOnClick = async (onClick: () => Promise<void>) => {
    setWaiting(true);
    await onClick();
    setWaiting(false);
    triggerUpdate && triggerUpdate();
  };

  const baseStyle = clsx('button', 'width-full', 'button-large', disableCondition && 'disabled');

  if (waiting) {
    return (
      <button className={clsx(baseStyle, 'disabled')} disabled={true}>
        Waiting on transaction
      </button>
    );
  }
  return (
    <button
      onClick={async (e) => {
        e.preventDefault();
        if (action) {
          await callAction(action);
        }
        if (onClick) {
          await callOnClick(onClick);
        }
      }}
      className={baseStyle}
      disabled={disableCondition}
    >
      {children}
    </button>
  );
};
