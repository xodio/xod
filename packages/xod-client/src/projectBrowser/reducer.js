import R from 'ramda';
import initialState from './state';
import {
  PROJECT_BROWSER_OPEN_POPUP,
  PROJECT_BROWSER_CLOSE_POPUP,
  PROJECT_BROWSER_CLOSE_ALL_POPUPS,
} from './actionTypes';

const popupsReducer = (state = {}, action) => {
  switch (action.type) {
    case PROJECT_BROWSER_OPEN_POPUP:
      return R.assoc(action.payload.popupId, true, state);
    case PROJECT_BROWSER_CLOSE_POPUP:
      return R.assoc(action.payload.popupId, false, state);
    case PROJECT_BROWSER_CLOSE_ALL_POPUPS:
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
