import R from 'ramda';
import applyReducers from '../../utils/applyReducers';

import { links } from './links';
import { nodes } from './nodes';

import {
  PATCH_RENAME,
  PATCH_MOVE,
} from '../actionTypes';

export const patchReducer = (id) => {
  const patchId = id;
  const initialPatchState = {
    id: patchId,
    folderId: null,
    label: `Patch #${patchId}`,
  };

  return (state = initialPatchState, action) => {
    const reducers = {
      links,
      nodes,
    };

    let istate = state;

    const hasInitialKeys = R.compose(
      R.allPass,
      R.map(R.has),
      R.keys
    )(initialPatchState);

    if (!hasInitialKeys(state)) {
      istate = R.merge(initialPatchState, state);
    }

    if (
      action &&
      action.meta &&
      action.meta.patchId &&
      parseInt(action.meta.patchId, 10) !== parseInt(patchId, 10)
    ) {
      return state;
    }

    switch (action.type) {
      case PATCH_RENAME:
        return R.assoc('label', action.payload.name, state);
      case PATCH_MOVE:
        return R.assoc('folderId', action.payload.folderId, state);
      default:
        return applyReducers(reducers, istate, action, patchId);
    }
  };
};
