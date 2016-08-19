import { combineReducers } from 'redux';

import projectReducer from './project';
import { reducer as editorReducer } from 'xod/client/editor';
import { errorsReducer } from './errors';
import { processesReducer } from './processes';

const combineRootReducers = (patchIds) => combineReducers({
  project: projectReducer(patchIds),
  editor: editorReducer,
  errors: errorsReducer,
  processes: processesReducer,
});

export const createReducer = (patchIds) => combineRootReducers(patchIds);

export default createReducer;
