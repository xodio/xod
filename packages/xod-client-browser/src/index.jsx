/* eslint-env browser */

import React from 'react';
import ReactDOM from 'react-dom';
import { Root } from 'xod-client';

import App from './containers/App';
import initialProject from '../initialProject.json';

ReactDOM.render(
  <Root>
    <App initialProject={initialProject} />
  </Root>,
  document.getElementById('root')
);
