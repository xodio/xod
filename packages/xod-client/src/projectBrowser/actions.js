import * as R from 'ramda';

import {
  PATCH_CREATE_REQUESTED,
  PATCH_RENAME_REQUESTED,
  PATCH_DELETE_REQUESTED,
  SET_SELECTION,
  REMOVE_SELECTION,
  TOGGLE_DEPRECATED_FILTER,
} from './actionTypes';

import { getSelectedPatchPath } from './selectors';
import { isPatchEmpty } from './utils';

import { deletePatch } from '../project/actions';

export const requestCreatePatch = () => ({
  type: PATCH_CREATE_REQUESTED,
});

export const requestRenamePatch = patchPath => ({
  type: PATCH_RENAME_REQUESTED,
  payload: { patchPath },
});

// TODO: split into 'requestDeletePatch' and 'requestDeleteSelectedPatch'?
export const requestDeletePatch = patchPath => (dispatch, getState) => {
  const state = getState();
  const selectedPatchPath = patchPath || getSelectedPatchPath(state);
  if (R.isNil(selectedPatchPath)) {
    return;
  }

  if (isPatchEmpty(state, selectedPatchPath)) {
    dispatch(deletePatch(selectedPatchPath));
    return;
  }

  dispatch({
    type: PATCH_DELETE_REQUESTED,
    payload: { patchPath: selectedPatchPath },
  });
};

export const setSelection = selectedPatchPath => ({
  type: SET_SELECTION,
  payload: { patchPath: selectedPatchPath },
});

export const removeSelection = () => ({
  type: REMOVE_SELECTION,
});

export const toggleDeprecatedFilter = () => ({
  type: TOGGLE_DEPRECATED_FILTER,
});
