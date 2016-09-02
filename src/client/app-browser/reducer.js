import { combineReducers } from 'redux';

import projectReducer from 'xod/client/project/reducer';
import editorReducer from 'xod/client/editor/reducer';
import errorsReducer from 'xod/client/messages/reducer';
import processesReducer from 'xod/client/processes/reducer';
import cookiesReducer from 'xod/client/cookies/reducer';

const combineRootReducers = (patchIds) => combineReducers({
  project: projectReducer(patchIds),
  editor: editorReducer,
  errors: errorsReducer,
  processes: processesReducer,
  cookies: cookiesReducer,
});

export const createReducer = (patchIds) => combineRootReducers(patchIds);

export default createReducer;
