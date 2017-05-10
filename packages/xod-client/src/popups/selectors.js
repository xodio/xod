import R from 'ramda';
import { createSelector } from 'reselect';

import { POPUP_ID } from './constants';

// =============================================================================
//
// Utils
//
// =============================================================================

export const isPopupVisible = R.curry(
  (popupId, popups) => R.pathEq([popupId, 'visible'], true, popups)
);

// =============================================================================
//
// Selectors
//
// =============================================================================

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
