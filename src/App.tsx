import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import ContextProviders from '@/contexts';
import './degenerative.css';

import { Landing, Synth, Explore, Portfolio, SynthGroup } from '@/pages';
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
            <Route exact strict path="/synths/:group/:synthName" component={Synth} />
          </Switch>
        </FlexRow>
      </ContextProviders>
    </Router>
  );
};

export default App;
