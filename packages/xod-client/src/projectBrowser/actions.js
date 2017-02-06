import {
  PATCH_CREATE_REQUESTED,
  FOLDER_CREATE_REQUESTED,
  RENAME_REQUESTED,
  DELETE_REQUESTED,
  CLOSE_ALL_POPUPS,
} from './actionTypes';

export const requestCreatePatch = () => ({
  type: PATCH_CREATE_REQUESTED,
});

export const requestCreateFolder = () => ({
  type: FOLDER_CREATE_REQUESTED,
});

export const requestRenamePatchOrFolder = () => ({
  type: RENAME_REQUESTED,
});

export const requestDeletePatchOrFolder = () => ({
  type: DELETE_REQUESTED,
});

export const closeAllPopups = () => ({
  type: CLOSE_ALL_POPUPS,
});
