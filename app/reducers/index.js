import { combineReducers } from 'redux';
// import undoable from 'redux-undo';

import projectReducer from './project';
import { editor } from './editor';
import { errorsReducer } from './errors';
import { processesReducer } from './processes';

// const projectUndoConfig = {
//   filter: (action) => !(R.pathEq(['meta', 'skipHistory'], true, action)),
// };

export default combineReducers({
  project: projectReducer(),
  editor,
  errors: errorsReducer,
  processes: processesReducer,
});
