import applyReducers from 'xod/client/utils/applyReducers';

import { meta } from './meta';
import { patches } from './patches';
import { nodeTypes } from './nodetypes';
import { counterReducer } from './counter';
import { foldersReducer } from './folders';

import {
  PROJECT_LOAD_DATA,
} from '../actionTypes';

import { parseProjectJSON } from '../selectors';

export default (patchIds) => {
  const reducers = {
    meta,
    patches: patches(patchIds),
    nodeTypes,
    counter: counterReducer,
    folders: foldersReducer,
  };

  return (state = {}, action) => {
    if (action.type === PROJECT_LOAD_DATA) {
      return parseProjectJSON(action.payload);
    }

    return applyReducers(reducers, state, action, state);
  };
};
