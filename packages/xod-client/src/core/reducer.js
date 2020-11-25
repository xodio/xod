import * as R from 'ramda';
import { combineReducers } from 'redux';

import userReducer from '../user/reducer';
import projectReducer from '../project/reducer';
import undoableProject from './undoableProject';
import projectBrowserReducer from '../projectBrowser/reducer';
import editorReducer from '../editor/reducer';
import errorsReducer from '../messages/reducer';
import processesReducer from '../processes/reducer';
import popupsReducer from '../popups/reducer';
import debuggerReducer from '../debugger/reducer';
import hintingReducer from '../hinting/reducer';
import workersReducer from '../workers/reducer';

import keepIntegrityAfterNavigatingHistory from './keepIntegrityAfterNavigatingHistory';
import trackLastSavedChanges from './trackLastSavedChanges';
import initialProjectState from '../project/state';

import { RECOVER_STATE } from './actionTypes';

// :: [(s -> a -> s)] -> s -> a -> s
const pipeReducers = (...reducers) => (state, action) =>
  action.type === RECOVER_STATE
    ? action.payload
    : reducers.reduce((s, r) => r(s, action), state);

const lastActionsReducer = (prevActions = [], newAction) =>
  R.compose(R.slice(-3, Infinity), R.append(newAction))(prevActions);

const combineRootReducers = extraReducers => {
  const reducers = R.merge(
    {
      user: userReducer,
      project: projectReducer,
      projectHistory: (s = {}) => s,
      lastSavedProject: (s = initialProjectState) => s,
      projectBrowser: projectBrowserReducer,
      popups: popupsReducer,
      editor: editorReducer,
      errors: errorsReducer,
      processes: processesReducer,
      debugger: debuggerReducer,
      hinting: hintingReducer,
      workers: workersReducer,
      lastActions: lastActionsReducer,
    },
    extraReducers
  );

  return undoableProject(
    pipeReducers(combineReducers(reducers), trackLastSavedChanges),
    keepIntegrityAfterNavigatingHistory
  );
};

export const createReducer = combineRootReducers;

export default createReducer;
