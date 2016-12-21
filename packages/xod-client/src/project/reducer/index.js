import applyReducers from '../../utils/applyReducers';

import R from 'ramda';

import { meta } from './meta';
import { patches, newPatch } from './patches';
import { nodeTypes } from './nodetypes';
import { foldersReducer } from './folders';

import { ApiHelpers, ApiActionTypes } from '../../api';

import {
  PROJECT_CREATE,
  PROJECT_LOAD_DATA,
  PROJECT_ONLY_LOAD_DATA,
} from '../actionTypes';

import { parseProjectJSON } from 'xod-core';

export default (patchIds = []) => {
  const reducers = {
    meta,
    patches: patches(patchIds),
    nodeTypes,
    folders: foldersReducer,
  };

  return (state = {}, action) => {
    // TODO: Replace ifs with switch and do something with complex condition

    if (action.type === PROJECT_CREATE) {
      const mainPatch = newPatch({ id: action.payload.mainPatchId, label: 'Main' });

      return R.pipe(
        R.assoc(
          'patches',
          {
            [action.payload.mainPatchId]: mainPatch,
          }
        ),
        R.assocPath(
          ['meta', 'name'],
          action.payload.name
        )
      )(state);
    }

    if (action.type === PROJECT_LOAD_DATA) {
      return parseProjectJSON(action.payload);
    }

    if (action.type === PROJECT_ONLY_LOAD_DATA) {
      const project = parseProjectJSON(action.payload);
      const merged = R.assoc('nodeTypes', state.nodeTypes, project);
      console.log('PROJECT', project);
      console.log('MERGED', merged);
      return merged;
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
