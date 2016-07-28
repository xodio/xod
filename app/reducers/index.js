import { combineReducers } from 'redux';

import projectReducer from './project';
import { editor } from './editor';
import { errorsReducer } from './errors';
import { processesReducer } from './processes';

export default combineReducers({
  project: projectReducer,
  editor,
  errors: errorsReducer,
  processes: processesReducer,
});
