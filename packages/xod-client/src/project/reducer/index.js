import applyReducers from '../../utils/applyReducers';

import { meta } from './meta';
import { patches } from './patches';
import { nodeTypes } from './nodetypes';
import { foldersReducer } from './folders';

import { ApiHelpers, ApiActionTypes } from '../../api';

import {
  PROJECT_LOAD_DATA,
} from '../actionTypes';

import { parseProjectJSON } from 'xod-core';

export default (patchIds) => {
  const reducers = {
    meta,
    patches: patches(patchIds),
    nodeTypes,
    folders: foldersReducer,
  };

  return (state = {}, action) => {
    if (action.type === PROJECT_LOAD_DATA) {
      return parseProjectJSON(action.payload);
    }

    if (
      action.type === ApiActionTypes.project.load &&
      ApiHelpers.completedResponse(action)
    ) {
      return parseProjectJSON(action.payload.response.pojo);
    }

    return applyReducers(reducers, state, action, state);
  };
};
