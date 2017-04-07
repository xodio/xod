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

import { getSelectedPatchId } from './selectors';
import { isPatchEmpty } from './utils';
import { getCurrentPatchId } from '../editor/selectors';

import { addError } from '../messages/actions';
import { deletePatch } from '../project/actions';

import { PROJECT_BROWSER_ERRORS } from '../messages/constants';

export const requestCreatePatch = () => ({
  type: PATCH_CREATE_REQUESTED,
});

export const requestRenamePatch = patchId => ({
  type: PATCH_RENAME_REQUESTED,
  payload: { id: patchId },
});

// TODO: split into 'requestDeletePatch' and 'requestDeleteSelectedPatch'?
export const requestDeletePatch = patchId => (dispatch, getState) => {
  const state = getState();
  const selectedPatchId = patchId || getSelectedPatchId(state);
  if (R.isNil(selectedPatchId)) {
    return;
  }

  if (isPatchEmpty(state, selectedPatchId)) {
    dispatch(deletePatch(selectedPatchId));
    return;
  }

  const currentPatchId = getCurrentPatchId(state);
  if (selectedPatchId === currentPatchId) {
    dispatch(addError(PROJECT_BROWSER_ERRORS.CANT_DELETE_CURRENT_PATCH));
    return;
  }

  dispatch({
    type: PATCH_DELETE_REQUESTED,
    payload: { id: selectedPatchId },
  });
};

export const requestRenameProject = () => ({
  type: PROJECT_RENAME_REQUESTED,
});

export const cancelPopup = () => ({
  type: POPUP_CANCEL,
});

export const setSelection = selectedPatchId => ({
  type: SET_SELECTION,
  payload: { id: selectedPatchId },
});

export const removeSelection = () => ({
  type: REMOVE_SELECTION,
});
