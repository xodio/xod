import * as R from 'ramda';
import { isAmong } from 'xod-func-tools';
import initialState from './state';

import {
  PATCH_RENAME_REQUESTED,
  PATCH_DELETE_REQUESTED,
  SET_SELECTION,
  REMOVE_SELECTION,
  TOGGLE_DEPRECATED_FILTER,
} from './actionTypes';

import { PATCH_DELETE, PATCH_RENAME } from '../project/actionTypes';

import {
  INSTALL_LIBRARIES_BEGIN,
  INSTALL_LIBRARIES_COMPLETE,
  INSTALL_LIBRARIES_FAILED,
} from '../editor/actionTypes';

// Reducers
const selectionReducer = (state, action) => {
  switch (action.type) {
    case SET_SELECTION:
    case PATCH_RENAME_REQUESTED:
    case PATCH_DELETE_REQUESTED:
      return action.payload.patchPath;

    case PATCH_RENAME:
      return R.when(
        R.equals(action.payload.oldPatchPath),
        R.always(action.payload.newPatchPath),
        state
      );

    case REMOVE_SELECTION: // TODO: deselect only if there are no open popups?
    case PATCH_DELETE:
      return null;

    default:
      return state;
  }
};

const installingLibrariesReducer = (state, action) => {
  switch (action.type) {
    case INSTALL_LIBRARIES_BEGIN:
      return R.concat(action.payload, state);
    case INSTALL_LIBRARIES_FAILED:
    case INSTALL_LIBRARIES_COMPLETE:
      return R.reject(isAmong(action.payload.libParams), state);
    default:
      return state;
  }
};

const filtersReducer = (state, action) => {
  switch (action.type) {
    case TOGGLE_DEPRECATED_FILTER:
      return R.over(R.lensProp('deprecated'), R.not, state);
    default:
      return state;
  }
};

export default (state = initialState, action) =>
  R.merge(state, {
    selectedPatchPath: selectionReducer(state.selectedPatchPath, action),
    filters: filtersReducer(state.filters, action),
    installingLibraries: installingLibrariesReducer(
      state.installingLibraries,
      action
    ),
  });
