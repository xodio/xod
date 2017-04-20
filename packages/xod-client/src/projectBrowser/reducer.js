import R from 'ramda';
import initialState from './state';
import { POPUP_ID } from './constants';

import {
  PATCH_CREATE_REQUESTED,
  PATCH_RENAME_REQUESTED,
  PATCH_DELETE_REQUESTED,
  PROJECT_RENAME_REQUESTED,
  POPUP_CANCEL,
  SET_SELECTION,
  REMOVE_SELECTION,
} from './actionTypes';

import {
  PATCH_ADD,
  PATCH_DELETE,
  PATCH_RENAME,
  PROJECT_RENAME,
} from '../project/actionTypes';

const popupsReducer = (state = {}, action) => {
  switch (action.type) {
    case PATCH_CREATE_REQUESTED:
      return R.assoc(POPUP_ID.CREATING_PATCH, true, state);

    case PATCH_RENAME_REQUESTED:
      return R.assoc(POPUP_ID.RENAMING_PATCH, true, state);

    case PATCH_DELETE_REQUESTED:
      return R.assoc(POPUP_ID.DELETING_PATCH, true, state);

    case PROJECT_RENAME_REQUESTED:
      return R.assoc(POPUP_ID.RENAMING_PROJECT, true, state);

    case PATCH_ADD:
      return R.assoc(POPUP_ID.CREATING_PATCH, false, state);

    case PATCH_RENAME:
      return R.assoc(POPUP_ID.RENAMING_PATCH, false, state);

    case PATCH_DELETE:
      return R.assoc(POPUP_ID.DELETING_PATCH, false, state);

    case PROJECT_RENAME:
      return R.assoc(POPUP_ID.RENAMING_PROJECT, false, state);

    case POPUP_CANCEL:
      return initialState.openPopups;

    default:
      return state;
  }
};

const selectionReducer = (state, action) => {
  switch (action.type) {
    case SET_SELECTION:
    case PATCH_RENAME_REQUESTED:
    case PATCH_DELETE_REQUESTED:
      return action.payload.id;

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
      openPopups: popupsReducer(state.openPopups, action),
      selectedPatchPath: selectionReducer(state.selectedPatchPath, action),
    }
  );
