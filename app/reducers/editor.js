import R from 'ramda';
import {
  EDITOR_DESELECT_ALL,
  EDITOR_SELECT_NODE,
  EDITOR_SELECT_PIN,
  EDITOR_SELECT_LINK,
  EDITOR_SET_DRAGGING,
} from '../actionTypes';

const addSelection = (entityName, action, state) => {
  const select = {
    entity: entityName,
    id: action.payload.id,
  };
  const newSelection = R.concat(state.selection, select);
  return R.set(R.lensProp('selection'), newSelection, state);
};

export const editor = (state = {}, action) => {
  switch (action.type) {
    case EDITOR_DESELECT_ALL:
      return R.merge(state, {
        selection: [],
        selectedPin: null,
      });
    case EDITOR_SELECT_NODE:
      return addSelection('Node', action, state);
    case EDITOR_SELECT_LINK:
      return addSelection('Link', action, state);
    case EDITOR_SELECT_PIN:
      return R.set(R.lensProp('selectedPin'), action.payload.id, state);
    case EDITOR_SET_DRAGGING:
      return R.set(R.lensProp('dragging'), action.payload.id, state);
    default:
      return state;
  }
};
