// import { combineReducers } from 'redux';
import applyReducers from '../utils/applyReducers';

import projectReducer from './project';
import { editor } from './editor';
import { errorsReducer } from './errors';
import { processesReducer } from './processes';

const combineRootReducers = (patchIds) => (state = {}, action, context) =>
  applyReducers({
    project: projectReducer(patchIds),
    editor,
    errors: errorsReducer,
    processes: processesReducer,
  }, state, action, context);

export const createReducer = (patchIds) => combineRootReducers(patchIds);

export default createReducer;
