import { merge } from 'ramda';
import { combineReducers } from 'redux';

import projectReducer from '../project/reducer';
import historyReducer from '../project/historyReducer';
import projectBrowserReducer from '../projectBrowser/reducer';
import editorReducer from '../editor/reducer';
import errorsReducer from '../messages/reducer';
import processesReducer from '../processes/reducer';
import popupsReducer from '../popups/reducer';

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

  const coreReducers = combineReducers(reducers);

  return (st, a) => coreReducers(historyReducer(st, a), a);
};

export const createReducer = combineRootReducers;

export default createReducer;
