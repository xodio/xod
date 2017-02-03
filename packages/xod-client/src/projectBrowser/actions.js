import * as actionTypes from './actionTypes';

export const openPopup = popupId => ({
  type: actionTypes.PROJECT_BROWSER_OPEN_POPUP,
  payload: { popupId },
});
export const closePopup = popupId => ({
  type: actionTypes.PROJECT_BROWSER_CLOSE_POPUP,
  payload: { popupId },
});

export const closeAllPopups = () => ({
  type: actionTypes.PROJECT_BROWSER_CLOSE_ALL_POPUPS,
});
