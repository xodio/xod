/* eslint-env browser */

import React from 'react';
import ReactDOM from 'react-dom';
import { Root } from 'xod-client';
import App from './containers/App';
import additionalReducers from './reducer';

ReactDOM.render(
  <Root
    extraReducers={additionalReducers}
  >
    <App />
  </Root>,
  document.getElementById('root')
);
