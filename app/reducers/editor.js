import R from 'ramda';
import {
  NODE_DELETE,
  EDITOR_DESELECT_ALL,
  EDITOR_SELECT_NODE,
  EDITOR_SELECT_PIN,
  EDITOR_SELECT_LINK,
  EDITOR_SET_MODE,
  EDITOR_SET_SELECTED_NODETYPE,
} from '../actionTypes';
import * as ENTITIES from '../constants/entities';

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
    case NODE_DELETE:
    case EDITOR_DESELECT_ALL:
      return R.merge(state, {
        selection: [],
        linkingPin: null,
      });
    case EDITOR_SELECT_NODE:
      return addSelection(ENTITIES.NODE, action, state);
    case EDITOR_SELECT_LINK:
      return addSelection(ENTITIES.LINK, action, state);
    case EDITOR_SELECT_PIN:
      return R.set(R.lensProp('linkingPin'), action.payload.id, state);
    case EDITOR_SET_MODE:
      return R.set(R.lensProp('mode'), action.payload.mode, state);
    case EDITOR_SET_SELECTED_NODETYPE:
      return R.set(R.lensProp('selectedNodeType'), action.payload.id, state);
    default:
      return state;
  }
};
