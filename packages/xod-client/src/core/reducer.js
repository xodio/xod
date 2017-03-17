import { merge } from 'ramda';
import { combineReducers } from 'redux';

import projectReducer from '../project/reducer';
import projectV2Reducer from '../project/reducerV2';
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
      projectBrowser: projectBrowserReducer,
      editor: editorReducer,
      errors: errorsReducer,
      processes: processesReducer,
      user: userReducer,
    },
    extraReducers
  );

  return combineReducers(reducers);
};

export const createReducer = combineRootReducers;

export default createReducer;
