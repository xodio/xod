import applyReducers from '../utils/applyReducers';

import { pins } from './pins';
import { links } from './links';
import { nodes } from './nodes';

export const patchReducer = (id) => {
  const patchId = id;
  const initialPatchState = {
    id: patchId,
    folderId: 0,
    name: `Patch #${patchId}`,
  };

  return (state = initialPatchState, action) => {
    const reducers = {
      links,
      pins,
      nodes,
    };

    if (
      action &&
      action.hasOwnProperty('meta') &&
      action.meta.hasOwnProperty('patchId') &&
      parseInt(action.meta.patchId, 10) !== parseInt(patchId, 10)
    ) {
      return state;
    }

    return applyReducers(reducers, state, action, patchId);
  };
};
