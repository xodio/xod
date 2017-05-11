/* eslint-env browser */
import { merge } from 'ramda';
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

const electronInitialState = merge(initialState, {
  editor: merge(initialState.editor, {
    currentPatchPath: null,
    tabs: {},
  }),
});

ReactDOM.render(
  <Root
    extraReducers={extraReducers}
    initialState={electronInitialState}
  >
    <App />
  </Root>,
  document.getElementById('root')
);
