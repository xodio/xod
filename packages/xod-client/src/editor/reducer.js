import R from 'ramda';
import {
  EDITOR_DESELECT_ALL,
  EDITOR_SELECT_NODE,
  EDITOR_SELECT_PIN,
  EDITOR_SELECT_LINK,
  EDITOR_SET_MODE,
  EDITOR_SET_SELECTED_NODETYPE,
  EDITOR_SWITCH_PATCH,
  TAB_CLOSE,
  TAB_SORT,
} from './actionTypes';
import {
  PROJECT_CREATE,
  PROJECT_LOAD_DATA,
  PROJECT_ONLY_LOAD_DATA,
  NODE_DELETE,
  LINK_DELETE,
} from '../project/actionTypes';
import { ENTITY, generateId } from 'xod-core';

const addSelection = (entityName, action, state) => {
  const select = {
    entity: entityName,
    id: action.payload.id,
  };
  const newSelection = R.append(select, state.selection);
  return R.set(R.lensProp('selection'), newSelection, state);
};

const addTab = (state, action) => {
  if (!(action.payload && action.payload.id)) {
    return state;
  }

  const tabs = R.prop('tabs')(state);
  const lastIndex = R.reduce(
    (acc, tab) => R.pipe(
      R.prop('index'),
      R.max(acc)
    )(tab),
    -Infinity,
    R.values(tabs)
  );
  const newIndex = R.inc(lastIndex);
  const newId = generateId();

  return R.assocPath(['tabs', newId], {
    id: newId,
    patchId: action.payload.id,
    index: newIndex,
  }, state);
};

const applyTabSort = (tab, payload) => {
  if (R.not(R.has(tab.id, payload))) { return tab; }

  return R.assoc('index', payload[tab.id].index, tab);
};
const tabHasPatch = (state, patchId) =>
  R.find(R.propEq('patchId', patchId))(R.values(state.tabs));

const resetCurrentPatchId = (reducer, state, payload) => {
  const newState = R.assoc('tabs', [], state);
  const firstPatchId = R.pipe(
    JSON.parse,
    R.prop('patches'),
    R.values,
    R.head,
    R.propOr(null, 'id')
  )(payload);

  return reducer(newState, {
    type: EDITOR_SWITCH_PATCH,
    payload: {
      id: firstPatchId,
    },
  });
};

const editorReducer = (state = {}, action) => {
  switch (action.type) {
    case NODE_DELETE:
    case LINK_DELETE:
    case EDITOR_DESELECT_ALL:
      return R.merge(state, {
        selection: [],
        linkingPin: null,
      });
    case EDITOR_SELECT_NODE:
      return addSelection(ENTITY.NODE, action, state);
    case EDITOR_SELECT_LINK:
      return addSelection(ENTITY.LINK, action, state);
    case EDITOR_SELECT_PIN:
      return R.assoc('linkingPin', action.payload, state);
    case EDITOR_SET_MODE:
      return R.assoc('mode', action.payload.mode, state);
    case EDITOR_SET_SELECTED_NODETYPE:
      return R.assoc('selectedNodeType', action.payload.id, state);
    case PROJECT_CREATE: {
      const newState = R.assoc('tabs', [], state);
      return editorReducer(newState, {
        type: EDITOR_SWITCH_PATCH,
        payload: {
          id: action.payload.mainPatchId,
        },
      });
    }
    case PROJECT_LOAD_DATA:
      return resetCurrentPatchId(editorReducer, state, action.payload);
    case PROJECT_ONLY_LOAD_DATA:
      return resetCurrentPatchId(editorReducer, state, action.payload);
    case EDITOR_SWITCH_PATCH: {
      let newState = state;
      if (!tabHasPatch(state, action.payload.id)) {
        newState = addTab(newState, action);
      }
      return R.assoc('currentPatchId', action.payload.id, newState);
    }
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

export default editorReducer;
