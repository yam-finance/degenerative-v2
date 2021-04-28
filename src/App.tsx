import React from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';

import ContextProviders from '@/contexts';
import './degenerative.css';
//import './degenerative.original.css';
//import './webflow.css';
import './normalize.css';

import { Landing, Synth, Explore, Portfolio, SynthType, NotFound } from '@/pages';
import { Navbar } from '@/components';

const App: React.FC = () => {
  const FlexRow: React.FC = ({ children }) => {
    return <div className="flex-row min-height-viewport-full tablet-flex-column">{children}</div>;
  };

  return (
    <Router>
      <ContextProviders>
        <FlexRow>
          <Navbar />
          <Switch>
            <Route exact strict path="/" component={Landing} />
            <Route exact strict path="/portfolio" component={Portfolio} />
            <Route exact strict path="/synths" component={Explore} />
            <Route exact strict path="/synths/:type" component={SynthType} /> {/* TODO */}
            <Redirect exact strict from="/synths/:type/:cycleYear" to="/synths/:type/:cycleYear/manage" />
            <Route exact strict path="/synths/:type/:cycleYear/:action" component={Synth} />
            <Route component={NotFound} />
          </Switch>
        </FlexRow>
      </ContextProviders>
    </Router>
  );
};

export default App;
