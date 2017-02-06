import R from 'ramda';
import initialState from './state';
import { POPUP_ID } from './constants';

import {
  PATCH_CREATE_REQUESTED,
  FOLDER_CREATE_REQUESTED,
  RENAME_REQUESTED,
  DELETE_REQUESTED,
  CLOSE_ALL_POPUPS,
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

    case RENAME_REQUESTED:
      return R.assoc(POPUP_ID.RENAMING, true, state);

    case DELETE_REQUESTED:
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

    case CLOSE_ALL_POPUPS:
      return initialState.openPopups;

    default:
      return state;
  }
};

export default (state = initialState, action) =>
  R.merge(
    state,
    {
      openPopups: popupsReducer(state.openPopups, action),
    }
  );
