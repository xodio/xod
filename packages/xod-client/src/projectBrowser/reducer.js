import R from 'ramda';
import initialState from './state';

import {
  PATCH_RENAME_REQUESTED,
  PATCH_DELETE_REQUESTED,
  SET_SELECTION,
  REMOVE_SELECTION,
} from './actionTypes';

import {
  PATCH_DELETE,
} from '../project/actionTypes';

const selectionReducer = (state, action) => {
  switch (action.type) {
    case SET_SELECTION:
    case PATCH_RENAME_REQUESTED:
    case PATCH_DELETE_REQUESTED:
      return action.payload.patchPath;

    case REMOVE_SELECTION: // TODO: deselect only if there are no open popups?
    case PATCH_DELETE:
      return null;

    default:
      return state;
  }
};

export default (state = initialState, action) =>
  R.merge(
    state,
    {
      selectedPatchPath: selectionReducer(state.selectedPatchPath, action),
    }
  );
