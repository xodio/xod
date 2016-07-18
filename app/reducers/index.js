import { combineReducers } from 'redux';
import undoable from 'redux-undo';

import projectReducer from './project';
import { editor } from './editor';
import { errors } from './errors';

const projectUndoConfig = {
  filter: (action) => !(
    action.hasOwnProperty('meta') &&
    action.meta.hasOwnProperty('skipHistory') &&
    action.meta.skipHistory
  ),
  limit: 10,
};

export default combineReducers({
  project: undoable(projectReducer, projectUndoConfig),
  editor,
  errors,
});
