import R from 'ramda';
import * as actionTypes from './actionTypes';
import { POPUP_ID } from './constants';

const validPopupIds = new Set(R.values(POPUP_ID));
const validatePopupId = (popupId) => {
  if (!validPopupIds.has(popupId)) {
    throw new Error(`Unknown popup id ${popupId}`);
  }

  return popupId;
};

export const openPopup = R.pipe(
  validatePopupId,
  popupId => ({
    type: actionTypes.PROJECT_BROWSER_OPEN_POPUP,
    payload: { popupId },
  })
);
export const closePopup = R.pipe(
  validatePopupId,
  popupId => ({
    type: actionTypes.PROJECT_BROWSER_CLOSE_POPUP,
    payload: { popupId },
  })
);

export const closeAllPopups = () => ({
  type: actionTypes.PROJECT_BROWSER_CLOSE_ALL_POPUPS,
});

export const startCreatingPatch = R.partial(openPopup, [POPUP_ID.CREATING_PATCH]);
