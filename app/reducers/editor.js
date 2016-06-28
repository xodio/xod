import R from 'ramda';
import { EDITOR_DESELECT_ALL, EDITOR_SELECT_PIN, EDITOR_SELECT_LINK } from '../actionTypes';

export const editor = (state = {}, action) => {
  switch (action.type) {
    case EDITOR_DESELECT_ALL:
      return R.merge(state, {
        selectedNode: null,
        selectedPin: null,
        selectedLink: null,
      });
    case EDITOR_SELECT_LINK:
      return R.set(R.lensProp('selectedLink'), action.payload.id, state);
    case EDITOR_SELECT_PIN:
      return R.set(R.lensProp('selectedPin'), action.payload.id, state);
    default:
      return state;
  }
};
