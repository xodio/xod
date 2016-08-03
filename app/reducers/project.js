import R from 'ramda';
import applyReducers from '../utils/applyReducers';

import { meta } from './meta';
import { patches } from './patches';
import { nodeTypes } from './nodetypes';
import { counterReducer } from './counter';

import { parseProjectJSON } from '../selectors/project';

export default (patchIds) => {
  const reducers = {
    meta,
    patches: patches(patchIds),
    nodeTypes,
    counter: counterReducer,
  };

  return (state = {}, action) => {
    if (action.type === PROJECT_LOAD_DATA) {
      return parseProjectJSON(action.payload);
    }

    return applyReducers(reducers, state, action, state);
  };
};
