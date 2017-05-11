/* eslint-env browser */
import React from 'react';
import ReactDOM from 'react-dom';
import { Root, initialState } from 'xod-client';
import App from './view/containers/App';

const extraReducers = {};

ReactDOM.render(
  <Root
    extraReducers={extraReducers}
    initialState={initialState} // TODO: Remove project and opened patch when possible
  >
    <App />
  </Root>,
  document.getElementById('root')
);
