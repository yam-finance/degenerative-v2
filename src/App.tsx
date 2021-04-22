import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import ContextProviders from '@/contexts';
import './degenerative.css';
//import './degenerative.original.css';
//import './webflow.css';
import './normalize.css';

import { Landing, Synth, Explore, Portfolio, SynthType, NotFound } from '@/pages';
import { Navbar } from '@/components';

const App: React.FC = () => {
  const { i18n } = useTranslation();
  const FlexRow: React.FC = ({ children }) => {
    return <div className="flex-row min-height-viewport-full tablet-flex-column">{children}</div>;
  };

  useEffect(() => {
    document.dir = i18n.dir();
  }, [i18n, i18n.language]);

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
            <Redirect exact strict from="/synths/:type/:cycleYear" to="/synths/:type/:cycleYear/mint" />
            <Route exact strict path="/synths/:type/:cycleYear/:action" component={Synth} />
            <Route component={NotFound} />
          </Switch>
        </FlexRow>
      </ContextProviders>
    </Router>
  );
};

export default App;
