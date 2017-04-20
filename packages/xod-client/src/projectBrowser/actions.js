import R from 'ramda';

import {
  PATCH_CREATE_REQUESTED,
  PATCH_RENAME_REQUESTED,
  PATCH_DELETE_REQUESTED,
  PROJECT_RENAME_REQUESTED,
  POPUP_CANCEL,
  SET_SELECTION,
  REMOVE_SELECTION,
} from './actionTypes';

import { getSelectedPatchPath } from './selectors';
import { isPatchEmpty } from './utils';
import { getCurrentPatchPath } from '../editor/selectors';

import { addError } from '../messages/actions';
import { deletePatch } from '../project/actions';

import { PROJECT_BROWSER_ERRORS } from '../messages/constants';

export const requestCreatePatch = () => ({
  type: PATCH_CREATE_REQUESTED,
});

export const requestRenamePatch = patchPath => ({
  type: PATCH_RENAME_REQUESTED,
  payload: { id: patchPath },
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

  const currentPatchPath = getCurrentPatchPath(state);
  if (selectedPatchPath === currentPatchPath) {
    dispatch(addError(PROJECT_BROWSER_ERRORS.CANT_DELETE_CURRENT_PATCH));
    return;
  }

  dispatch({
    type: PATCH_DELETE_REQUESTED,
    payload: { id: selectedPatchPath },
  });
};

export const requestRenameProject = () => ({
  type: PROJECT_RENAME_REQUESTED,
});

export const cancelPopup = () => ({
  type: POPUP_CANCEL,
});

export const setSelection = selectedPatchPath => ({
  type: SET_SELECTION,
  payload: { id: selectedPatchPath },
});

export const removeSelection = () => ({
  type: REMOVE_SELECTION,
});
