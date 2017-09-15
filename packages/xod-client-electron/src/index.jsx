/* eslint-env browser */
import React from 'react';
import ReactDOM from 'react-dom';
import { Root, initialState } from 'xod-client';
import App from './view/containers/App';

import popupsReducer from './popups/reducer';
import uploadReducer from './upload/reducer';

import debuggerMiddleware from './debugger/middleware';

const extraReducers = {
  popups: popupsReducer,
  upload: uploadReducer,
};

ReactDOM.render(
  <Root
    extraReducers={extraReducers}
    extraMiddlewares={[debuggerMiddleware]}
    initialState={initialState} // TODO: Remove project and opened patch when possible
  >
    <App />
  </Root>,
  document.getElementById('root')
);
