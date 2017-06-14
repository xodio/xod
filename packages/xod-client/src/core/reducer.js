import { merge } from 'ramda';
import { combineReducers } from 'redux';

import projectReducer from '../project/reducer';
import historyReducer from './historyReducer';
import projectBrowserReducer from '../projectBrowser/reducer';
import editorReducer from '../editor/reducer';
import errorsReducer from '../messages/reducer';
import processesReducer from '../processes/reducer';
import popupsReducer from '../popups/reducer';

import keepIntegrityAfterNavigatingHistory from './keepIntegrityAfterNavigatingHistory';

const composeReducers =
  (...reducers) =>
    (state, action) =>
      reducers.reduceRight((st, r) => r(st, action), state);

const combineRootReducers = (extraReducers) => {
  const reducers = merge(
    {
      project: projectReducer,
      projectHistory: (s = {}) => s,
      projectBrowser: projectBrowserReducer,
      popups: popupsReducer,
      editor: editorReducer,
      errors: errorsReducer,
      processes: processesReducer,
    },
    extraReducers
  );

  return composeReducers(
    combineReducers(reducers),
    keepIntegrityAfterNavigatingHistory,
    historyReducer
  );
};

export const createReducer = combineRootReducers;

export default createReducer;
