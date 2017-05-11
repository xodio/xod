import { SHOW_POPUP, HIDE_ALL_POPUPS } from './actionTypes';

export const showPopup = (popupId, data = {}) => ({
  type: SHOW_POPUP,
  payload: {
    id: popupId,
    data,
  },
});

export const hideAllPopups = () => ({
  type: HIDE_ALL_POPUPS,
});

export default {};
