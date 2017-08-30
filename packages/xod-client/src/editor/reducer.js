import R from 'ramda';
import * as XP from 'xod-project';

import {
  EDITOR_DESELECT_ALL,
  EDITOR_SELECT_ENTITY,
  EDITOR_SELECT_PIN,
  EDITOR_SET_MODE,
  EDITOR_SET_SELECTED_NODETYPE,
  EDITOR_SWITCH_PATCH,
  TAB_CLOSE,
  TAB_SORT,
  SET_CURRENT_PATCH_OFFSET,
  TOGGLE_HELPBAR,
  SET_FOCUSED_AREA,
  SHOW_SUGGESTER,
  HIDE_SUGGESTER,
  HIGHLIGHT_SUGGESTER_ITEM,
} from './actionTypes';
import {
  PROJECT_CREATE,
  PROJECT_OPEN,
  PROJECT_IMPORT,
  PROJECT_OPEN_WORKSPACE,
  PATCH_ADD,
  PATCH_DELETE,
  PATCH_RENAME,
  NODE_DELETE,
  LINK_DELETE,
  COMMENT_DELETE,
} from '../project/actionTypes';
import { DEFAULT_PANNING_OFFSET } from '../project/nodeLayout';

const addTab = R.curry((patchPath, state) => {
  if (!patchPath) return state;

  const tabs = R.prop('tabs')(state);
  const lastIndex = R.reduce(
    (acc, tab) => R.pipe(
      R.prop('index'),
      R.max(acc)
    )(tab),
    -1,
    R.values(tabs)
  );
  const newIndex = R.inc(lastIndex);

  return R.assocPath(['tabs', patchPath], {
    id: patchPath,
    index: newIndex,
    offset: DEFAULT_PANNING_OFFSET,
  }, state);
});

const applyTabSort = (tab, payload) => {
  if (R.not(R.has(tab.id, payload))) { return tab; }

  return R.assoc('index', payload[tab.id].index, tab);
};

const isPatchOpened = R.curry((patchPath, state) =>
  R.any(R.propEq('id', patchPath))(R.values(state.tabs))
);

const resetCurrentPatchPath = (reducer, state, payload) => {
  const newState = R.assoc('tabs', {}, state);
  const firstPatchPath = R.pipe(
    XP.listLocalPatches,
    R.head,
    R.ifElse(
      R.isNil,
      R.always(null),
      XP.getPatchPath
    )
  )(payload);

  return reducer(newState, {
    type: EDITOR_SWITCH_PATCH,
    payload: {
      patchPath: firstPatchPath,
    },
  });
};

const openPatchByPath = (patchPath, state) => R.compose(
  R.assoc('currentPatchPath', patchPath),
  R.unless(isPatchOpened(patchPath), addTab(patchPath))
)(state);

const closeTabById = (tabId, state) =>
  R.compose(
    R.converge(
      R.assoc('currentPatchPath'),
      [
        R.compose( // get patch id from last of remaining tabs
          R.propOr(null, 'id'),
          R.last,
          R.values,
          R.prop('tabs')
        ),
        R.identity,
      ]
    ),
    R.dissocPath(['tabs', tabId])
  )(state);

const renamePatchInTabs = (newPatchPath, oldPatchPath) => (tabs) => {
  const oldPatchTab = R.prop(oldPatchPath, tabs);

  if (!oldPatchTab) return tabs;

  return R.compose(
    R.dissoc(oldPatchPath),
    R.assoc(
      newPatchPath,
      R.assoc(
        'id',
        newPatchPath,
        oldPatchTab
      )
    )
  )(tabs);
};

const editorReducer = (state = {}, action) => {
  switch (action.type) {
    case NODE_DELETE:
    case LINK_DELETE:
    case COMMENT_DELETE:
    case EDITOR_DESELECT_ALL:
      return R.merge(state, {
        selection: [],
        linkingPin: null,
      });
    case EDITOR_SELECT_ENTITY:
      return R.assoc(
        'selection',
        [
          {
            entity: action.payload.entityType,
            id: action.payload.id,
          },
        ],
        state
      );
    case EDITOR_SELECT_PIN:
      return R.assoc('linkingPin', action.payload, state);
    case EDITOR_SET_MODE:
      return R.assoc('mode', action.payload.mode, state);
    case EDITOR_SET_SELECTED_NODETYPE:
      return R.assoc('selectedNodeType', action.payload.id, state);
    case PROJECT_CREATE: {
      const newState = R.assoc('tabs', {}, state);
      return editorReducer(newState, {
        type: EDITOR_SWITCH_PATCH,
        payload: {
          patchPath: action.payload.mainPatchPath,
        },
      });
    }
    case PROJECT_OPEN:
    case PROJECT_IMPORT: {
      const newState = R.merge(state, {
        currentPatchPath: null,
        selection: [],
        tabs: {},
        linkingPin: null,
      });
      return resetCurrentPatchPath(editorReducer, newState, action.payload);
    }
    case PROJECT_OPEN_WORKSPACE:
      return R.merge(state, {
        currentPatchPath: null,
        selection: [],
        tabs: {},
        linkingPin: null,
      });
    case PATCH_ADD:
    case EDITOR_SWITCH_PATCH:
      return openPatchByPath(action.payload.patchPath, state);
    case PATCH_RENAME: {
      const { newPatchPath, oldPatchPath } = action.payload;

      return R.compose(
        R.over(
          R.lensProp('tabs'),
          renamePatchInTabs(newPatchPath, oldPatchPath)
        ),
        R.over(
          R.lensProp('currentPatchPath'),
          R.when(
            R.equals(oldPatchPath),
            R.always(newPatchPath)
          )
        )
      )(state);
    }
    case PATCH_DELETE:
      return closeTabById(action.payload.patchPath, state);
    case TAB_CLOSE:
      return closeTabById(action.payload.id, state);
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
    case SET_CURRENT_PATCH_OFFSET:
      return R.assocPath(
        ['tabs', state.currentPatchPath, 'offset'],
        action.payload,
        state
      );
    case TOGGLE_HELPBAR:
      return R.over(R.lensProp('isHelpbarVisible'), R.not, state);
    case SET_FOCUSED_AREA:
      return R.assoc('focusedArea', action.payload, state);
    case SHOW_SUGGESTER: {
      if (R.path(['suggester', 'visible'], state) === true) return state;

      return R.compose(
        R.assocPath(['suggester', 'visible'], true),
        R.assocPath(['suggester', 'placePosition'], action.payload)
      )(state);
    }
    case HIDE_SUGGESTER:
      return R.compose(
        R.assocPath(['suggester', 'visible'], false),
        R.assocPath(['suggester', 'highlightedPatchPath'], null),
        R.assocPath(['suggester', 'placePosition'], null)
      )(state);
    case HIGHLIGHT_SUGGESTER_ITEM:
      return R.assocPath(['suggester', 'highlightedPatchPath'], action.payload.patchPath, state);
    default:
      return state;
  }
};

export default editorReducer;
