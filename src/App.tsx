import React from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';

import ContextProviders from '@/contexts';
import './degenerative.css';
//import './degenerative.original.css';
//import './webflow.css';
import './normalize.css';

import { Landing, Synth, Explore, Portfolio, SynthGroup, NotFound } from '@/pages';
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
            <Route exact strict path="/synths/:group" component={SynthGroup} /> {/* TODO */}
            <Redirect exact strict from="/synths/:group/:synthName" to="/synths/:group/:synthName/mint" />
            <Route exact strict path="/synths/:group/:synthName/mint" component={Synth} />
            <Route exact strict path="/synths/:group/:synthName/manage" component={Synth} />
            <Route exact strict path="/synths/:group/:synthName/trade" component={Synth} />
            <Route exact strict path="/synths/:group/:synthName/lp" component={Synth} />
            <Route component={NotFound} />
          </Switch>
        </FlexRow>
      </ContextProviders>
    </Router>
  );
};

export default App;
