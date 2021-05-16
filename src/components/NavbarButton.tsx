import React from 'react';
import { Link } from 'react-router-dom';

import { Icon, IconName } from './Icon';

interface NavbarButtonProps {
  icon?: IconName;
  to: string;
  text: string;
  external?: boolean;
}

export const NavbarButton: React.FC<NavbarButtonProps> = ({ icon, to, text, external }) => {
  const IconButton = () => {
    return (
      <>
        {icon && <Icon name={icon} className="icon margin-right-3" />}
        <div>{text}</div>
      </>
    );
  };

  return external ? (
    <a href={to} target="_blank" className="nav-link w-inline-block">
      <IconButton />
    </a>
  ) : (
    <Link to={to} className="nav-link w-inline-block">
      <IconButton />
    </Link>
  );
};
