import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import ContextProviders from '@/contexts';
import './degenerative.css';
//import './degenerative.original.css';
//import './webflow.css';
import './normalize.css';

import { Landing, Synth, Explore, Portfolio, SynthGroup, NotFound } from '@/pages';

const App: React.FC = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.dir = i18n.dir();
  }, [i18n, i18n.language]);

  return (
    <Router>
      <ContextProviders>
        <Switch>
          <Route exact strict path="/" component={Landing} />
          <Route exact strict path="/portfolio" component={Portfolio} />
          <Route exact strict path="/synths" component={Explore} />
          <Route exact strict path="/synths/:group" component={SynthGroup} />
          <Redirect exact strict from="/synths/:group/:cycleYear" to="/synths/:group/:cycleYear/manage" />
          <Route exact strict path="/synths/:group/:cycleYear/:action" component={Synth} />
          <Route component={NotFound} />
        </Switch>
      </ContextProviders>
    </Router>
  );
};

export default App;
