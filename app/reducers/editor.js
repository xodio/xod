import R from 'ramda';
import {
  NODE_DELETE,
  EDITOR_DESELECT_ALL,
  EDITOR_SELECT_NODE,
  EDITOR_SELECT_PIN,
  EDITOR_SELECT_LINK,
  EDITOR_SET_MODE,
  EDITOR_SET_SELECTED_NODETYPE,
  EDITOR_SWITCH_PATCH,
  TAB_OPEN,
  TAB_CLOSE,
  TAB_SWITCH,
  TAB_SORT,
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

const addTab = (state, action) => {
  if (!(action.payload && action.payload.patchId)) {
    return state;
  }

  const tabs = R.prop('tabs')(state);
  const tabIds = R.keys(tabs);
  const lastId = R.reduce(R.max, -Infinity, tabIds);
  const lastTab = R.path(['tabs', lastId], state);
  const lastIndex = R.prop('index', lastTab);
  const newId = R.inc(lastId);
  const newIndex = R.inc(lastIndex);

  return R.assocPath(['tabs', newId], {
    id: newId,
    patchId: action.payload.patchId,
    index: newIndex,
  }, state);
};

const applyTabSort = (tab, payload) => {
  if (!payload.hasOwnProperty(tab.id)) { return tab; }

  return R.assoc('index', payload[tab.id].index, tab);
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
      return R.assoc('linkingPin', action.payload.id, state);
    case EDITOR_SET_MODE:
      return R.assoc('mode', action.payload.mode, state);
    case EDITOR_SET_SELECTED_NODETYPE:
      return R.assoc('selectedNodeType', action.payload.id, state);
    case EDITOR_SWITCH_PATCH:
      return R.assoc('currentPatchId', action.payload.id, state);
    case TAB_CLOSE:
      return R.dissocPath(['tabs', action.payload.id.toString()], state);
    case TAB_SORT:
      return R.assoc(
        'tabs',
        R.reduce(
          (p, cur) => R.assoc(cur.id, applyTabSort(cur, action.payload), p),
          {},
          R.values(state.tabs)
        ),
        state
      );
    default:
      return state;
  }
};
