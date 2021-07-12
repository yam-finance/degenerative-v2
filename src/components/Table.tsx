import React from 'react';
import clsx from 'clsx';
import { Link } from 'react-router-dom';

export interface TableProps {
  title?: string;
  headers: string[];
  headerClass?: string[]; // Custom CSS for a column, based on index
  className?: string; // CSS for table itself
}

export const Table: React.FC<TableProps> = ({ title, headers, headerClass, className, children }) => {
  if (headerClass && headerClass.length !== headers.length) throw new Error('Header class prop is invalid');

  return (
    <div className="margin-top-8">
      {title && <h5 className="padding-x-8">{title}</h5>}
      <div className={`flex-align-baseline text-xs padding-x-4 margin-x-4 margin-top-4 margin-bottom-3 ${className}`}>
        {headers.map((header, index) => {
          return (
            <div
              className={headerClass && headerClass[index] ? headerClass[index] : 'expand flex-align-center'}
              key={index}
            >
              <div className="margin-right-1">{header}</div>
            </div>
          );
        })}
      </div>
      {children}
    </div>
  );
};

// All table rows use same styles

interface TableRowProps {
  className?: string;
  to?: string;
  onMouseEnter?: () => void;
}

export const TableRow: React.FC<TableRowProps> = ({ className, to, onMouseEnter, children }) => {
  const style = clsx('table-row', 'margin-y-2', 'w-inline-block', className);

  if (to) {
    return (
      <Link to={to} className={style} onMouseEnter={onMouseEnter}>
        {children}
      </Link>
    );
  } else {
    return (
      <div className={style} onMouseEnter={onMouseEnter}>
        {children}
      </div>
    );
  }
};

interface TableCellProps {
  className?: string;
}

export const TableCell: React.FC<TableCellProps> = ({ className, children }) => {
  return <div className={`${className ? className : 'expand'}`}>{children}</div>;
};
