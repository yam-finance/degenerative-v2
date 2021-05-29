import React, { useState, useContext } from 'react';
import clsx from 'clsx';
import { UserContext } from '@/contexts';

interface ActionButtonProps {
  disableCondition?: boolean;
  action?: (...args: any[]) => Promise<void>; // This is for SC calls
  onClick?: (...args: any[]) => any; // This is for everything else
}

export const ActionButton: React.FC<ActionButtonProps> = ({ disableCondition, action, onClick, children }) => {
  const { triggerUpdate } = useContext(UserContext);
  const [waiting, setWaiting] = useState(false);

  const callAction = async (action: (...args: any[]) => Promise<void>) => {
    setWaiting(true);
    await action(); // TODO return txHash if successful, undefined if not
    setWaiting(false);
    triggerUpdate();
    // TODO reset form fields on success
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
      onClick={async (e) => {
        e.preventDefault();
        if (action) {
          await callAction(action);
        }
        if (onClick) {
          onClick();
        }
      }}
      className={baseStyle}
      disabled={disableCondition}
    >
      {children}
    </button>
  );
};
