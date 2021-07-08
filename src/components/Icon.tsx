import React from 'react';
import * as icons from 'react-feather';

export type IconName = keyof typeof icons;

export type IconProps = {
  name: IconName;
  className?: string;
};

export const Icon: React.FC<IconProps> = ({ name, ...rest }) => {
  const IconComponent = icons[name];
  return <IconComponent {...(rest as never)} />;
};
