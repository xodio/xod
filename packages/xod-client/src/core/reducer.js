import { merge } from 'ramda';
import { combineReducers } from 'redux';

import projectReducer from '../project/reducer';
import projectV2Reducer from '../project/reducerV2';
import historyReducer from '../project/historyReducer';
import projectBrowserReducer from '../projectBrowser/reducer';
import editorReducer from '../editor/reducer';
import errorsReducer from '../messages/reducer';
import processesReducer from '../processes/reducer';
import userReducer from '../user/reducer';

const combineRootReducers = (patchIds, extraReducers) => {
  const reducers = merge(
    {
      project: projectReducer(patchIds),
      projectV2: projectV2Reducer, // TODO: #migrateToV2
      projectHistory: (s = {}) => s,
      projectBrowser: projectBrowserReducer,
      editor: editorReducer,
      errors: errorsReducer,
      processes: processesReducer,
      user: userReducer,
    },
    extraReducers
  );

  const coreReducers = combineReducers(reducers);

  return (st, a) => coreReducers(historyReducer(st, a), a);
};

export const createReducer = combineRootReducers;

export default createReducer;
