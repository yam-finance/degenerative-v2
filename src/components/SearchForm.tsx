import React from 'react';
import { Search as SearchIcon } from 'react-feather';
import { Redirect } from 'react-router-dom';
import { useFormState } from 'react-use-form-state';

type SearchFormProps = {
  className: string;
  setSearch?: (search: string) => void;
};

interface SearchFormFields {
  search: string;
}

export const SearchForm: React.FC<SearchFormProps> = ({ className, setSearch }) => {
  const [formState, { text }] = useFormState<SearchFormFields>(null, {
    onChange: (e, stateValues, nextStateValues) => {
      if (setSearch) setSearch(nextStateValues.search);
    },
  });

  const handleSubmit = () => <Redirect to={`/synths?search=${formState.values.search}`} />;

  return (
    <div className={className}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input {...text('search')} className="form-input margin-0 has-icon w-input" maxLength={256} placeholder="Search synths" required />
          <SearchIcon className="absolute-top-left icon margin-3" />
        </div>
      </form>
    </div>
  );
};
