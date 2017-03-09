import R from 'ramda';
import initialState from './state';
import { POPUP_ID } from './constants';

import {
  PATCH_CREATE_REQUESTED,
  FOLDER_CREATE_REQUESTED,
  PATCH_OR_FOLDER_RENAME_REQUESTED,
  PATCH_OR_FOLDER_DELETE_REQUESTED,
  POPUP_CANCEL,
  SET_SELECTION,
} from './actionTypes';

import {
  FOLDER_ADD,
  FOLDER_RENAME,
  FOLDER_DELETE,
  PATCH_ADD,
  PATCH_DELETE,
  PATCH_RENAME,
} from '../project/actionTypes';

const popupsReducer = (state = {}, action) => {
  switch (action.type) {
    case PATCH_CREATE_REQUESTED:
      return R.assoc(POPUP_ID.CREATING_PATCH, true, state);

    case FOLDER_CREATE_REQUESTED:
      return R.assoc(POPUP_ID.CREATING_FOLDER, true, state);

    case PATCH_OR_FOLDER_RENAME_REQUESTED:
      return R.assoc(POPUP_ID.RENAMING, true, state);

    case PATCH_OR_FOLDER_DELETE_REQUESTED:
      return R.assoc(POPUP_ID.DELETING, true, state);

    case PATCH_ADD:
      return R.assoc(POPUP_ID.CREATING_PATCH, false, state);

    case FOLDER_ADD:
      return R.assoc(POPUP_ID.CREATING_FOLDER, false, state);

    case FOLDER_RENAME:
    case PATCH_RENAME:
      return R.assoc(POPUP_ID.RENAMING, false, state);

    case FOLDER_DELETE:
    case PATCH_DELETE:
      return R.assoc(POPUP_ID.DELETING, false, state);

    case POPUP_CANCEL:
      return initialState.openPopups;

    default:
      return state;
  }
};

const selectionReducer = (state, action) => {
  switch (action.type) {
    case SET_SELECTION:
      // TODO: deselect only if there are no open popups?
      return action.payload.id;
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
      openPopups: popupsReducer(state.openPopups, action),
      selectedPatchId: selectionReducer(state.selectedPatchId, action),
    }
  );
