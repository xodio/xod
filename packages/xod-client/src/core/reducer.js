import { combineReducers } from 'redux';

import projectReducer from '../project/reducer';
import editorReducer from '../editor/reducer';
import errorsReducer from '../messages/reducer';
import processesReducer from '../processes/reducer';
import userReducer from '../user/reducer';

const combineRootReducers = (patchIds) => combineReducers({
  project: projectReducer(patchIds),
  editor: editorReducer,
  errors: errorsReducer,
  processes: processesReducer,
  user: userReducer,
});

export const createReducer = (patchIds) => combineRootReducers(patchIds);

export default createReducer;
