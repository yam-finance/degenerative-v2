import React, { Fragment } from 'react';
import { Icon } from '@/components/Icon';
import useBreadcrumbs from 'use-react-router-breadcrumbs';
import { Link } from 'react-router-dom';

export const Breadcrumbs = () => {
  const breadcrumbs = useBreadcrumbs();

  return (
    <div
      className="flex-align-center margin-top-10 tablet-margin-top-20 landscape-margin-top-20 portrait-margin-top-10 padding-left-8 text-xs"
      aria-label="breadcrumbs"
      role="navigation"
    >
      {breadcrumbs.map(({ breadcrumb, match }, idx) => (
        <Fragment key={idx}>
          <Link
            to={match.url}
            className={`${idx < breadcrumbs.length - 1 && 'opacity-50'}`}
            aria-current={idx == breadcrumbs.length - 1 ? 'page' : undefined}
          >
            {breadcrumb}
          </Link>
          {idx < breadcrumbs.length - 1 && <Icon name="ChevronRight" className="icon medium margin-x-1 " />}
        </Fragment>
      ))}
    </div>
  );
};
