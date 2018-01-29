/* eslint-env browser */

import React from 'react';
import ReactDOM from 'react-dom';
import { Root } from 'xod-client';

import App from './containers/App';
import tutorialProject from '../tutorialProject.json';

if (process.env.WHY_DID_YOU_UPDATE) {
  // silence no-extraneous-dependencies and global-require warnings
  // eslint-disable-next-line
  const { whyDidYouUpdate } = require('why-did-you-update');

  whyDidYouUpdate(React);
}

ReactDOM.render(
  <Root>
    <App tutorialProject={tutorialProject} />
  </Root>,
  document.getElementById('root')
);
