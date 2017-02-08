import {
  PATCH_CREATE_REQUESTED,
  FOLDER_CREATE_REQUESTED,
  PATCH_OR_FOLDER_RENAME_REQUESTED,
  PATCH_OR_FOLDER_DELETE_REQUESTED,
  POPUP_CANCEL,
} from './actionTypes';

export const requestCreatePatch = () => ({
  type: PATCH_CREATE_REQUESTED,
});

export const requestCreateFolder = () => ({
  type: FOLDER_CREATE_REQUESTED,
});

export const requestRenamePatchOrFolder = () => ({
  type: PATCH_OR_FOLDER_RENAME_REQUESTED,
});

export const requestDeletePatchOrFolder = () => ({
  type: PATCH_OR_FOLDER_DELETE_REQUESTED,
});

export const cancelPopup = () => ({
  type: POPUP_CANCEL,
});
