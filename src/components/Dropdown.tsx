import React from 'react';
import clsx from 'clsx';

export const Dropdown: React.FC<{ openDropdown: boolean; className: string }> = ({ openDropdown, className, children, ...other }) => {
  return <nav className={clsx('w-dropdown-list', openDropdown && 'w--open', className)}>{children}</nav>;
};
