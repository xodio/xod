import R from 'ramda';
import core from 'xod-core';

import {
  PATCH_CREATE_REQUESTED,
  PATCH_OR_FOLDER_RENAME_REQUESTED,
  PATCH_OR_FOLDER_DELETE_REQUESTED,
  POPUP_CANCEL,
  SET_SELECTION,
} from './actionTypes';

import { getSelectedPatchId } from './selectors';
import { getCurrentPatchId } from '../editor/selectors';

import { addError } from '../messages/actions';
import { deletePatch } from '../project/actions';

import { PROJECT_BROWSER_ERRORS } from '../messages/constants';

export const requestCreatePatch = () => ({
  type: PATCH_CREATE_REQUESTED,
});

export const requestRenamePatchOrFolder = () => ({
  type: PATCH_OR_FOLDER_RENAME_REQUESTED,
});

const canBeDeletedWithoutConfirmation = (currentPatchId, state) => {
  const patch = R.compose(
    core.getPatchPresentById(currentPatchId),
    core.getProject
  )(state);

  return R.values(patch.nodes).length === 0;
};


export const requestDeletePatchOrFolder = () => (dispatch, getState) => {
  const state = getState();
  const selectedPatchId = getSelectedPatchId(state);
  const currentPatchId = getCurrentPatchId(state);

  if (canBeDeletedWithoutConfirmation(currentPatchId, state)) {
    dispatch(deletePatch(selectedPatchId));
    return;
  }

  if (selectedPatchId === currentPatchId) {
    dispatch(addError({ message: PROJECT_BROWSER_ERRORS.CANT_DELETE_CURRENT_PATCH }));
    return;
  }

  dispatch({
    type: PATCH_OR_FOLDER_DELETE_REQUESTED,
  });
};

export const cancelPopup = () => ({
  type: POPUP_CANCEL,
});

export const setSelection = selectedPatchId => ({
  type: SET_SELECTION,
  payload: { id: selectedPatchId },
});
