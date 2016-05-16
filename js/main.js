
import d3 from 'd3';
import './d3-plugins';

import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App.jsx';

document.addEventListener("DOMContentLoaded", () => {
  if (typeof(example) === 'undefined') {
    var example = 'toggle-button';
  }

  let patchUrl = `/examples/${example}.json`;
  let app = <App patchUrl={patchUrl} />;

  ReactDOM.render(app, document.getElementById('app'));
});
