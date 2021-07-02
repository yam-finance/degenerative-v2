import React from 'react';
import clsx from 'clsx';

interface DropdownProps {
  openDropdown: boolean;
  className: string;
}

export const Dropdown: React.FC<DropdownProps> = ({ openDropdown, className, children, ...other }) => {
  return <nav className={clsx('w-dropdown-list', openDropdown && 'w--open', className)}>{children}</nav>;
};
