import R from 'ramda';

import initialState from './state';
import { POPUP_ID } from './constants';
import {
  PATCH_CREATE_REQUESTED,
  PATCH_RENAME_REQUESTED,
  PATCH_DELETE_REQUESTED,
  PROJECT_RENAME_REQUESTED,
} from '../projectBrowser/actionTypes';
import {
  HIDE_ALL_POPUPS,
} from './actionTypes';

import {
  PATCH_ADD,
  PATCH_DELETE,
  PATCH_RENAME,
  PROJECT_CREATE_REQUESTED,
  PROJECT_OPEN_REQUESTED,
  PROJECT_CREATE,
  PROJECT_OPEN,
  PROJECT_RENAME,
} from '../project/actionTypes';
import {
  SHOW_CODE_REQUESTED,
} from '../core/actionTypes';

// =============================================================================
//
// Utils
//
// =============================================================================
const visibleLens = R.lensProp('visible');
const dataLens = R.lensProp('data');

// :: PopupState -> PopupState
const hidePopup = R.compose(
  R.set(visibleLens, false),
  R.set(dataLens, {})
);

// :: PopupState -> PopupState
const showPopup = R.curry(
  (data, state) => R.compose(
    R.set(visibleLens, true),
    R.set(dataLens, data)
  )(state)
);

// :: State -> State
const hideAll = R.map(hidePopup);

// :: State -> State
export const hideOnePopup = R.curry(
  (id, state) => R.over(
    R.lensProp(id),
    hidePopup,
    state
  )
);

// :: State -> State
const showOnePopup = R.curry(
  (id, data, state) => R.over(
    R.lensProp(id),
    showPopup(data),
    state
  )
);

// :: State -> State
export const showOnlyPopup = R.curry(
  (id, data, state) => R.compose(
    showOnePopup(id, data),
    hideAll
  )(state)
);

// =============================================================================
//
// Reducer
//
// =============================================================================
const popupsReducer = (state = initialState, action) => {
  switch (action.type) {
    case PATCH_CREATE_REQUESTED:
      return showOnlyPopup(POPUP_ID.CREATING_PATCH, {}, state);
    case PATCH_RENAME_REQUESTED:
      return showOnlyPopup(POPUP_ID.RENAMING_PATCH, {}, state);
    case PATCH_DELETE_REQUESTED:
      return showOnlyPopup(POPUP_ID.DELETING_PATCH, {}, state);

    case PROJECT_CREATE_REQUESTED:
      return showOnlyPopup(POPUP_ID.CREATING_PROJECT, {}, state);
    case PROJECT_OPEN_REQUESTED:
      return showOnlyPopup(POPUP_ID.OPENING_PROJECT, action.payload, state);
    case PROJECT_RENAME_REQUESTED:
      return showOnlyPopup(POPUP_ID.RENAMING_PROJECT, {}, state);

    case SHOW_CODE_REQUESTED:
      return showOnlyPopup(POPUP_ID.SHOWING_CODE, action.payload, state);

    case PATCH_ADD:
      return hideOnePopup(POPUP_ID.CREATING_PATCH, state);
    case PATCH_RENAME:
      return hideOnePopup(POPUP_ID.RENAMING_PATCH, state);
    case PATCH_DELETE:
      return hideOnePopup(POPUP_ID.DELETING_PATCH, state);

    case PROJECT_CREATE:
      return hideOnePopup(POPUP_ID.CREATING_PROJECT, state);
    case PROJECT_OPEN:
      return hideOnePopup(POPUP_ID.OPENING_PROJECT, state);
    case PROJECT_RENAME:
      return hideOnePopup(POPUP_ID.RENAMING_PROJECT, state);

    case HIDE_ALL_POPUPS:
      return initialState;

    default:
      return state;
  }
};

export default popupsReducer;
