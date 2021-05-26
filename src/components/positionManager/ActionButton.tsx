import React, { useState, useContext } from 'react';
import clsx from 'clsx';
import { UserContext } from '@/contexts';

interface ActionButtonProps {
  disableCondition?: boolean;
  action: Promise<void>;
}
export const ActionButton: React.FC<ActionButtonProps> = ({ disableCondition, action, children }) => {
  const { triggerUpdate } = useContext(UserContext);
  const [waiting, setWaiting] = useState(false);

  const callAction = async (action: Promise<void>) => {
    setWaiting(true);
    await action;
    setWaiting(false);
    triggerUpdate(); // TODO Make UserContext refresh user positions. Not currently working.
  };

  const baseStyle = clsx(
    'button',
    'width-full',
    'text-small',
    'w-button',
    'button-large',
    disableCondition && 'disabled'
  );

  if (waiting) {
    return (
      <button className={clsx(baseStyle, 'disabled')} disabled={true}>
        Waiting on transaction
      </button>
    );
  }
  return (
    <button
      onClick={async () => {
        setWaiting(true);
        await action;
        setWaiting(false);
        triggerUpdate(); // TODO Make UserContext refresh user positions. Not currently working.
      }}
      className={baseStyle}
      disabled={disableCondition}
    >
      {children}
    </button>
  );
};
