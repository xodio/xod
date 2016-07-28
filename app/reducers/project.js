import applyReducers from '../utils/applyReducers';
import { PROJECT_LOAD_DATA } from '../actionTypes';

import { patchesReducer } from './patches';
import { meta } from './meta';

export default (state = {}, action) => {
  const reducers = {
    meta,
    patches: patchesReducer,
  };

  if (action.type === PROJECT_LOAD_DATA) {
    return JSON.parse(action.payload);
  }

  return applyReducers(reducers, state, action);
};
