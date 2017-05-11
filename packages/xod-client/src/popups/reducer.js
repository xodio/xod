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
  SHOW_POPUP,
  HIDE_ALL_POPUPS,
} from './actionTypes';

import {
  PATCH_ADD,
  PATCH_DELETE,
  PATCH_RENAME,
  PROJECT_RENAME,
} from '../project/actionTypes';

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
const hideOnePopup = R.curry(
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
const showOnlyPopup = R.curry(
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

    case PROJECT_RENAME_REQUESTED:
      return showOnlyPopup(POPUP_ID.RENAMING_PROJECT, {}, state);

    case PATCH_ADD:
      return hideOnePopup(POPUP_ID.CREATING_PATCH, state);

    case PATCH_RENAME:
      return hideOnePopup(POPUP_ID.RENAMING_PATCH, state);

    case PATCH_DELETE:
      return hideOnePopup(POPUP_ID.DELETING_PATCH, state);

    case PROJECT_RENAME:
      return hideOnePopup(POPUP_ID.RENAMING_PROJECT, state);

    case HIDE_ALL_POPUPS:
      return initialState;

    case SHOW_POPUP:
      return showOnlyPopup(action.payload.id, action.payload.data, state);

    default:
      return state;
  }
};

export default popupsReducer;
