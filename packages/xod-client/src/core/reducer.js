import { merge } from 'ramda';
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

import keepIntegrityAfterNavigatingHistory from './keepIntegrityAfterNavigatingHistory';

const combineRootReducers = (extraReducers) => {
  const reducers = merge(
    {
      user: userReducer,
      project: projectReducer,
      projectHistory: (s = {}) => s,
      projectBrowser: projectBrowserReducer,
      popups: popupsReducer,
      editor: editorReducer,
      errors: errorsReducer,
      processes: processesReducer,
      debugger: debuggerReducer,
    },
    extraReducers
  );

  return undoableProject(
    combineReducers(reducers),
    keepIntegrityAfterNavigatingHistory
  );
};

export const createReducer = combineRootReducers;

export default createReducer;
