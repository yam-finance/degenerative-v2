import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { Explore } from '@/pages/Explore';
import ContextProviders from '@/contexts';
import { MemoryRouter as Router, Route, Switch } from 'react-router-dom';

function renderWithTestContext(currentPath = '/explore', routePath = '/explore') {
  return render(
    <Router initialEntries={[{ pathname: currentPath }]}>
      <ContextProviders>
        <Switch>
          <Route exact strict path={routePath} component={Explore} />
        </Switch>
      </ContextProviders>
    </Router>
  );
}

describe('The Explore Page', () => {
  it('should have breadcrumbs that point to the current location', () => {
    renderWithTestContext();
    // ideally we should query for a test-id attribute.
    const breadcrumbsElement = screen.getByRole('navigation', { name: 'breadcrumbs' });
    const exploreLinkElement = within(breadcrumbsElement).getByText('Explore').parentElement;
    expect(exploreLinkElement).toHaveAttribute('aria-current', 'page');
  });
});
