/* eslint-env browser */
import React from 'react';
import ReactDOM from 'react-dom';
import { Root, initialState } from 'xod-client';
import App from './view/containers/App';

import settingsReducer from './settings/reducer';
import projectsReducer from './projects/reducer';

const extraReducers = {
  settings: settingsReducer,
  projects: projectsReducer,
};

ReactDOM.render(
  <Root
    extraReducers={extraReducers}
    initialState={initialState} // TODO: Remove project and opened patch when possible
  >
    <App />
  </Root>,
  document.getElementById('root')
);
