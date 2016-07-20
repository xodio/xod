import R from 'ramda';
import { combineReducers } from 'redux';
import undoable from 'redux-undo';

import projectReducer from './project';
import { editor } from './editor';
import { errors } from './errors';

const projectUndoConfig = {
  filter: (action) => !(R.pathEq(['meta', 'skipHistory'], true, action)),
  limit: 10,
};

export default combineReducers({
  project: undoable(projectReducer, projectUndoConfig),
  editor,
  errors,
});
