/* eslint-env browser */

import React from 'react';
import ReactDOM from 'react-dom';
import { Root } from 'xod-client';
import App from './containers/App';

import settingsReducer from '../settings/reducer';
import projectsReducer from '../projects/reducer';

const extraReducers = {
  settings: settingsReducer,
  projects: projectsReducer,
};

ReactDOM.render(
  <Root
    extraReducers={extraReducers}
  >
    <App />
  </Root>,
  document.getElementById('root')
);
