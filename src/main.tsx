import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './plugins/i18n';

ReactDOM.render(
  <React.StrictMode>
    <React.Suspense fallback="Loading...">
      <App />
    </React.Suspense>
  </React.StrictMode>,
  document.getElementById('root')
);
