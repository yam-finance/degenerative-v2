import React from 'react';
import { render } from '@testing-library/react';
import { Explore } from '@/pages/Explore';
import ContextProviders from '@/contexts';
import { MemoryRouter as Router, Route, Switch } from 'react-router-dom';

describe('The Explore Page', () => {
  const explorePathName = '/explore';
  it('should render on correct pathname', () => {
    const pathname = explorePathName;
    const { getByText } = render(
      <Router initialEntries={[{ pathname }]}>
        <ContextProviders>
          <Switch>
            <Route exact strict path={explorePathName} component={Explore} />
          </Switch>
        </ContextProviders>
      </Router>
    );
    expect(getByText('Yam Synths')).toBeInTheDocument();
  });
  it('should not render on incorrect pathname', () => {
    const pathname = '/details';
    const { queryByText } = render(
      <Router initialEntries={[{ pathname }]}>
        <ContextProviders>
          <Switch>
            <Route exact strict path={explorePathName} component={Explore} />
          </Switch>
        </ContextProviders>
      </Router>
    );
    expect(queryByText('Yam Synths')).not.toBeInTheDocument();
  });
});
