import applyReducers from '../utils/applyReducers';
import { PROJECT_LOAD_DATA } from '../actionTypes';

import { meta } from './meta';
import { patches } from './patches';
import { nodeTypes } from './nodetypes';
import { counterReducer } from './counter';

export default (patchIds) => {
  const reducers = {
    meta,
    patches: patches(patchIds),
    nodeTypes,
    counter: counterReducer,
  };

  return (state = {}, action) => {
    if (action.type === PROJECT_LOAD_DATA) {
      return JSON.parse(action.payload);
    }

    return applyReducers(reducers, state, action, state);
  };
};
