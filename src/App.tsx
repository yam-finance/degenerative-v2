import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import ContextProviders from '@/contexts';
import './purged/degenerative.css';
import './normalize.css';

import { Landing, Synth, Explore, Portfolio, SynthGroup, NotFound, PrivacyPolicy, Terms } from '@/pages';

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
          <Route exact strict path="/explore" component={Explore} />
          <Route exact strict path="/explore/:group" component={SynthGroup} />
          <Route exact strict path="/explore/:group/:cycleYear" component={Synth} />
          <Route exact strict path="/legal/privacy" component={PrivacyPolicy} />
          <Route exact strict path="/legal/terms" component={Terms} />
          <Route component={NotFound} />
        </Switch>
      </ContextProviders>
    </Router>
  );
};

export default App;
