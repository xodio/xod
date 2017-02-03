import { merge } from 'ramda';
import { combineReducers } from 'redux';

import projectReducer from '../project/reducer';
import projectBrowserReducer from '../projectBrowser/reducer';
import editorReducer from '../editor/reducer';
import errorsReducer from '../messages/reducer';
import processesReducer from '../processes/reducer';
import userReducer from '../user/reducer';

const combineRootReducers = (patchIds, extraReducers) => {
  const reducers = merge(
    {
      project: projectReducer(patchIds),
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

export const createReducer = (patchIds, extraReducers) =>
  combineRootReducers(patchIds, extraReducers);

export default createReducer;
