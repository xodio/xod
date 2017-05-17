import R from 'ramda';
import { createSelector } from 'reselect';

import { POPUP_ID } from './constants';

// =============================================================================
//
// Utils
//
// =============================================================================

// :: POPUP_ID -> PopupsState -> Boolean
export const isPopupVisible = R.curry(
  (popupId, popups) => R.pathEq([popupId, 'visible'], true, popups)
);

// :: POPUP_ID -> PopupsState -> Object
export const extractPopupData = R.curry(
  (popupId, popups) => R.path([popupId, 'data'], popups)
);

// =============================================================================
//
// Selectors
//
// =============================================================================

// :: State -> PopupsState
export const getPopups = R.prop('popups');

export const getProjectBrowserPopups = createSelector(
  getPopups,
  R.pick([
    POPUP_ID.CREATING_PATCH,
    POPUP_ID.RENAMING_PATCH,
    POPUP_ID.DELETING_PATCH,
    POPUP_ID.RENAMING_PROJECT,
  ])
);

export const getPopupVisibility = popupId => createSelector(
  getPopups,
  isPopupVisible(popupId)
);

export const getPopupData = popupId => createSelector(
  getPopups,
  extractPopupData(popupId)
);
