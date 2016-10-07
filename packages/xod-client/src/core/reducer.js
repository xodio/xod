import { merge } from 'ramda';
import { combineReducers } from 'redux';

import projectReducer from '../project/reducer';
import editorReducer from '../editor/reducer';
import errorsReducer from '../messages/reducer';
import processesReducer from '../processes/reducer';
import userReducer from '../user/reducer';

const combineRootReducers = (patchIds, addReducers) => {
  const reducers = merge(
    {
      project: projectReducer(patchIds),
      editor: editorReducer,
      errors: errorsReducer,
      processes: processesReducer,
      user: userReducer,
    },
    addReducers
  );

  return combineReducers(reducers);
};

export const createReducer = (patchIds, addReducers) => combineRootReducers(patchIds, addReducers);

export default createReducer;
