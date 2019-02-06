/* eslint-env browser */
import React from 'react';
import ReactDOM from 'react-dom';
import { Root, initialState } from 'xod-client';
import App from './view/containers/App';

import popupsReducer from './popups/reducer';
import uploadReducer from './upload/reducer';

import stopDebuggerOnTabCloseMiddleware from './debugger/stopDebuggerOnTabCloseMiddleware';
import autoupdateMiddleware from './view/autoupdateMiddleware';
import installLibMiddleware from './view/installLibMiddleware';
import arduinoDependenciesMiddleware from './arduinoDependencies/middleware';

const extraReducers = {
  popups: popupsReducer,
  upload: uploadReducer,
};

const extraMiddlewares = [
  stopDebuggerOnTabCloseMiddleware,
  installLibMiddleware,
  autoupdateMiddleware,
  arduinoDependenciesMiddleware,
];

ReactDOM.render(
  <Root
    extraReducers={extraReducers}
    extraMiddlewares={extraMiddlewares}
    initialState={initialState} // TODO: Remove project and opened patch when possible
  >
    <App />
  </Root>,
  document.getElementById('root')
);
