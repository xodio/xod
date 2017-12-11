/* eslint-env browser */

import React from 'react';
import ReactDOM from 'react-dom';
import { Root } from 'xod-client';

import App from './containers/App';
import initialProject from '../initialProject.json';

if (process.env.WHY_DID_YOU_UPDATE) {
  // silence no-extraneous-dependencies and global-require warnings
  // eslint-disable-next-line
  const { whyDidYouUpdate } = require('why-did-you-update');

  whyDidYouUpdate(React);
}

ReactDOM.render(
  <Root>
    <App initialProject={initialProject} />
  </Root>,
  document.getElementById('root')
);
