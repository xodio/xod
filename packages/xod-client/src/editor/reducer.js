import R from 'ramda';
import shortid from 'shortid';
import * as XP from 'xod-project';

import {
  EDITOR_DESELECT_ALL,
  EDITOR_SELECT_ENTITY,
  EDITOR_DESELECT_ENTITY,
  EDITOR_ADD_ENTITY_TO_SELECTION,
  EDITOR_SELECT_PIN,
  EDITOR_DESELECT_PIN,
  EDITOR_SET_SELECION,
  EDITOR_SET_SELECTED_NODETYPE,
  EDITOR_SWITCH_PATCH,
  EDITOR_SWITCH_TAB,
  TAB_CLOSE,
  TAB_SORT,
  SET_CURRENT_PATCH_OFFSET,
  TOGGLE_HELPBAR,
  SET_FOCUSED_AREA,
  SHOW_SUGGESTER,
  HIDE_SUGGESTER,
  HIGHLIGHT_SUGGESTER_ITEM,
  START_DRAGGING_PATCH,
  PASTE_ENTITIES,
} from './actionTypes';
import {
  PROJECT_CREATE,
  PROJECT_OPEN,
  PROJECT_IMPORT,
  PROJECT_OPEN_WORKSPACE,
  PATCH_ADD,
  PATCH_DELETE,
  PATCH_RENAME,
  NODE_ADD,
  LINK_ADD,
  BULK_DELETE_ENTITIES,
} from '../project/actionTypes';
import {
  DEBUG_SESSION_STARTED,
  DEBUG_SESSION_STOPPED,
  DEBUG_DRILL_DOWN,
} from '../debugger/actionTypes';

import { DEFAULT_PANNING_OFFSET } from '../project/nodeLayout';
import { TAB_TYPES, EDITOR_MODE, DEBUGGER_TAB_ID } from './constants';
import { createSelectionEntity, getNewSelection } from './utils';
import { getTabByPatchPath } from './selectors';
import { setCurrentPatchOffset, switchPatchUnsafe } from './actions';

import { getInitialPatchOffset } from '../project/utils';

// =============================================================================
//
// Utils
//
// =============================================================================

const getTabs = R.prop('tabs');
const getCurrentTabId = R.prop('currentTabId');

const getTabById = R.curry(
  (tabId, state) => R.compose(
    R.propOr(null, tabId),
    getTabs
  )(state)
);

const getCurrentTab = R.converge(
  getTabById,
  [
    getCurrentTabId,
    R.identity,
  ]
);

const getBreadcrumbs = R.compose(
  R.prop('breadcrumbs'),
  getCurrentTab
);
const getBreadcrumbActiveIndex = R.compose(
  R.propOr(-1, 'activeIndex'),
  getBreadcrumbs
);
const getBreadcrumbChunks = R.compose(
  R.propOr([], 'chunks'),
  getBreadcrumbs
);

const isTabOpened = R.curry(
  (tabId, state) => R.compose(
    R.complement(R.isNil),
    getTabById(tabId)
  )(state)
);

const isPatchOpened = R.curry(
  (patchPath, state) => R.compose(
    R.complement(R.isNil),
    getTabByPatchPath(patchPath),
    getTabs
  )(state)
);

const setTabOffset = R.curry(
  (offset, tabId, state) => R.compose(
    R.when(
      () => (tabId === DEBUGGER_TAB_ID),
      newState => R.assocPath(
        ['tabs', tabId, 'breadcrumbs', 'chunks', getBreadcrumbActiveIndex(newState), 'offset'],
        offset,
        newState
      )
    ),
    R.assocPath(
      ['tabs', tabId, 'offset'],
      offset
    )
  )(state)
);

const getTabIdbyPatchPath = R.curry(
  (patchPath, state) => R.compose(
    R.propOr(null, 'id'),
    R.find(R.propEq('patchPath', patchPath)),
    R.values,
    getTabs
  )(state)
);

const listTabsByPatchPath = R.curry(
  (patchPath, state) => R.compose(
    R.filter(R.propEq('patchPath', patchPath)),
    R.values,
    getTabs
  )(state)
);

const syncTabOffset = R.curry(
  (offset, state) => {
    const currentTab = getTabById(state.currentTabId, state);
    const currentPatchPath = currentTab.patchPath;
    if (!currentTab) return state;

    const tabIdsToSync = R.compose(
      R.map(R.prop('id')),
      R.reject(R.propEq('id', state.currentTabId)),
      listTabsByPatchPath(currentPatchPath)
    )(state);
    const syncOffsets = R.map(setTabOffset(offset), tabIdsToSync);

    return R.reduce((acc, fn) => fn(acc), state, syncOffsets);
  }
);

const setPropsToTab = R.curry(
  (id, props, state) => R.compose(
    R.assocPath(['tabs', id], R.__, state),
    R.merge(R.__, props),
    getTabById(id)
  )(state)
);

const addTabWithProps = R.curry(
  (id, type, patchPath, state) => {
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

    return setPropsToTab(id, {
      id,
      patchPath,
      index: newIndex,
      type,
      offset: DEFAULT_PANNING_OFFSET,
    }, state);
  }
);

const addPatchTab = R.curry((newId, patchPath, state) => {
  if (!patchPath) return state;
  return addTabWithProps(newId, TAB_TYPES.PATCH, patchPath, state);
});

const applyTabSort = (tab, payload) => {
  if (R.not(R.has(tab.id, payload))) { return tab; }

  return R.assoc('index', payload[tab.id].index, tab);
};

const resetCurrentPatchPath = (reducer, state, project) => {
  const stateWithClearedTabs = R.assoc('tabs', {}, state);

  return R.compose(
    R.ifElse(
      R.isNil,
      R.always(stateWithClearedTabs),
      (firstLocalPatch) => {
        const firstPatchPath = XP.getPatchPath(firstLocalPatch);
        const offset = getInitialPatchOffset(firstPatchPath, project);

        return [
          switchPatchUnsafe(firstPatchPath),
          setCurrentPatchOffset(offset),
        ].reduce(reducer, stateWithClearedTabs);
      }
    ),
    R.head,
    R.sortBy(XP.getPatchPath),
    XP.listLocalPatches,
  )(project);
};

const clearSelection = R.flip(R.merge)({
  selection: [],
  linkingPin: null,
});

const openPatchByPath = R.curry(
  (patchPath, state) => {
    const alreadyOpened = isPatchOpened(patchPath, state);
    const tabId = (alreadyOpened) ?
        getTabIdbyPatchPath(patchPath, state) :
        shortid.generate();

    return R.compose(
      R.assoc('currentTabId', tabId),
      clearSelection,
      R.unless(
        () => alreadyOpened,
        addPatchTab(tabId, patchPath)
      )
    )(state);
  }
);

const openLatestOpenedTab = R.compose(
  clearSelection,
  R.converge(
    R.assoc('currentTabId'),
    [
      R.compose( // get patch id from last of remaining tabs
        R.propOr(null, 'id'),
        R.last,
        R.values,
        R.prop('tabs')
      ),
      R.identity,
    ]
  )
);

const closeTabById = R.curry(
  (tabId, state) => {
    if (!isTabOpened(tabId, state)) return state;

    const tabToClose = getTabById(tabId, state);

    const isDebuggerTabClosing = () => (tabToClose.type === TAB_TYPES.DEBUGGER);
    const isCurrentTabClosing = R.propEq('currentTabId', tabId);
    const isCurrentDebuggerTabClosing = R.both(
      isDebuggerTabClosing,
      isCurrentTabClosing
    );

    const openOriginalPatch = patchPath => R.compose(
      clearSelection,
      R.converge(
        setTabOffset(tabToClose.offset),
        [
          getTabIdbyPatchPath(patchPath),
          R.identity,
        ]
      ),
      openPatchByPath(patchPath)
    );

    return R.compose(
      R.cond([
        [isCurrentDebuggerTabClosing, openOriginalPatch(tabToClose.patchPath)],
        [isCurrentTabClosing, openLatestOpenedTab],
        [R.T, R.identity],
      ]),
      R.dissocPath(['tabs', tabId])
    )(state);
  }
);

const closeTabByPatchPath = R.curry(
  (patchPath, state) => {
    const tabIdToClose = getTabIdbyPatchPath(patchPath, state);
    return closeTabById(tabIdToClose, state);
  }
);

// :: PatchPath -> PatchPath -> Tab -> Tab
const renamePatchPathInBreadcrumbs = R.curry(
  (newPatchPath, oldPatchPath, tab) => R.when(
    R.has('breadcrumbs'),
    R.over(
      R.lensPath(['breadcrumbs', 'chunks']),
      R.map(R.when(
        R.propEq('patchPath', oldPatchPath),
        R.assoc('patchPath', newPatchPath)
      ))
    )
  )(tab)
);

const renamePatchInTabs = (newPatchPath, oldPatchPath, state) => {
  const tabIdsToRename = R.compose(
    R.map(R.prop('id')),
    listTabsByPatchPath
  )(oldPatchPath, state);

  return (tabIdsToRename.length === 0) ? state : R.over(
    R.lensProp('tabs'),
    R.map(R.compose(
      renamePatchPathInBreadcrumbs(newPatchPath, oldPatchPath),
      R.when(
        R.propEq('patchPath', oldPatchPath),
        R.assoc('patchPath', newPatchPath)
      )
    )),
    state
  );
};

const findChunkIndex = R.curry(
  (patchPath, nodeId, chunks) =>
    R.findIndex(R.both(
      R.propEq('patchPath', patchPath),
      R.propEq('nodeId', nodeId),
    ),
    chunks
  )
);

const createChunk = (patchPath, nodeId) => ({
  patchPath,
  nodeId,
  offset: DEFAULT_PANNING_OFFSET,
});

const setActiveIndex = R.curry(
  (index, state) => {
    const curTabId = getCurrentTabId(state);
    return R.assocPath(['tabs', curTabId, 'breadcrumbs', 'activeIndex'], index, state);
  }
);

const drillDown = R.curry(
  (patchPath, nodeId, state) => {
    const currentTabId = getCurrentTabId(state);
    if (currentTabId !== DEBUGGER_TAB_ID) return state;

    const activeIndex = getBreadcrumbActiveIndex(state);
    const chunks = getBreadcrumbChunks(state);
    const index = findChunkIndex(patchPath, nodeId, chunks);

    if (index > -1) {
      const chunkOffset = getBreadcrumbChunks(state)[index].offset;
      return R.compose(
        setTabOffset(chunkOffset, currentTabId),
        setActiveIndex(index)
      )(state);
    }

    const shouldResetTail = (activeIndex < (chunks.length - 1));
    const newChunk = createChunk(patchPath, nodeId);
    const newChunkOffset = newChunk.offset;

    return R.compose(
      setTabOffset(newChunkOffset, currentTabId),
      R.converge(
        setActiveIndex,
        [
          R.compose(
            R.dec,
            R.length,
            getBreadcrumbChunks
          ),
          R.identity,
        ]
      ),
      R.over(
        R.lensPath(['tabs', currentTabId, 'breadcrumbs', 'chunks']),
        R.compose(
          R.append(newChunk),
          R.when(
            () => shouldResetTail,
            R.take((activeIndex + 1))
          )
        )
      ),
    )(state);
  }
);

// =============================================================================
//
// Reducer
//
// =============================================================================

const editorReducer = (state = {}, action) => {
  switch (action.type) {
    case BULK_DELETE_ENTITIES:
    case EDITOR_DESELECT_ALL:
      return clearSelection(state);
    case EDITOR_SELECT_ENTITY:
      return R.assoc(
        'selection',
        [
          createSelectionEntity(
            action.payload.entityType,
            action.payload.id
          ),
        ],
        state
      );
    case EDITOR_DESELECT_ENTITY:
      return R.over(
        R.lensProp('selection'),
        R.reject(R.equals(createSelectionEntity(
          action.payload.entityType,
          action.payload.id
        ))),
        state
      );
    case EDITOR_ADD_ENTITY_TO_SELECTION:
      return R.over(
        R.lensProp('selection'),
        R.compose(
          R.uniq,
          R.append(createSelectionEntity(
            action.payload.entityType,
            action.payload.id
          ))
        ),
        state
      );
    case EDITOR_SET_SELECION:
    case PASTE_ENTITIES:
      return R.assoc(
        'selection',
        getNewSelection(action.payload.entities),
        state
      );
    case EDITOR_SELECT_PIN:
      return R.assoc('linkingPin', action.payload, state);
    case EDITOR_DESELECT_PIN:
    case LINK_ADD:
      return R.assoc('linkingPin', null, state);
    case START_DRAGGING_PATCH:
      return R.merge(
        state,
        {
          mode: EDITOR_MODE.ACCEPTING_DRAGGED_PATCH,
          draggedPreviewSize: action.payload,
        }
      );
    case NODE_ADD:
      return R.assoc('draggedPreviewSize', { width: 0, height: 0 }, state);
    case EDITOR_SET_SELECTED_NODETYPE:
      return R.assoc('selectedNodeType', action.payload.id, state);
    case PROJECT_CREATE: {
      const newState = R.assoc('tabs', {}, state);
      return editorReducer(newState, switchPatchUnsafe(action.payload.mainPatchPath));
    }
    case PROJECT_OPEN:
    case PROJECT_IMPORT: {
      const newState = R.merge(state, {
        currentTabId: null,
        selection: [],
        tabs: {},
        linkingPin: null,
      });
      return resetCurrentPatchPath(editorReducer, newState, action.payload);
    }
    case PROJECT_OPEN_WORKSPACE:
      return R.merge(state, {
        currentTabId: null,
        selection: [],
        tabs: {},
        linkingPin: null,
      });
    case PATCH_ADD:
    case EDITOR_SWITCH_PATCH:
      return openPatchByPath(action.payload.patchPath, state);
    case EDITOR_SWITCH_TAB:
      return R.compose(
        R.assoc(
          'currentTabId',
          action.payload.tabId
        ),
        clearSelection
      )(state);
    case PATCH_RENAME:
      return renamePatchInTabs(
        action.payload.newPatchPath,
        action.payload.oldPatchPath,
        state
      );
    case PATCH_DELETE:
      return closeTabByPatchPath(action.payload.patchPath, state);
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
    case SET_CURRENT_PATCH_OFFSET: {
      return R.compose(
        syncTabOffset(action.payload),
        setTabOffset(action.payload, state.currentTabId)
      )(state);
    }
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
    case DEBUG_SESSION_STARTED: {
      const currentTab = getTabById(state.currentTabId, state);
      const currentPatchPath = currentTab.patchPath;
      const currentOffset = currentTab.offset;
      return R.compose(
        drillDown(action.payload.patchPath, null),
        R.assoc('currentTabId', DEBUGGER_TAB_ID),
        R.assoc('mode', EDITOR_MODE.DEBUGGING),
        setTabOffset(currentOffset, DEBUGGER_TAB_ID),
        clearSelection,
        addTabWithProps(DEBUGGER_TAB_ID, TAB_TYPES.DEBUGGER, currentPatchPath)
      )(state);
    }
    case DEBUG_SESSION_STOPPED:
      return R.when(
        isTabOpened(DEBUGGER_TAB_ID),
        closeTabById(DEBUGGER_TAB_ID)
      )(state);
    case DEBUG_DRILL_DOWN:
      return R.compose(
        drillDown(action.payload.patchPath, action.payload.nodeId),
        setPropsToTab(DEBUGGER_TAB_ID, { patchPath: action.payload.patchPath }),
        clearSelection
      )(state);
    default:
      return state;
  }
};

export default editorReducer;
