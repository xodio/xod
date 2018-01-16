import * as R from 'ramda';
import { Maybe } from 'ramda-fantasy';

import * as XP from 'xod-project';
import { fetchLibsWithDependencies, stringifyLibQuery, getLibName } from 'xod-pm';
import { foldMaybe, explodeMaybe } from 'xod-func-tools';

import {
  SELECTION_ENTITY_TYPE,
  CLIPBOARD_DATA_TYPE,
  FOCUS_AREAS,
  PANEL_IDS,
} from './constants';
import { LINK_ERRORS } from '../project/messages';
import {
  libInstalled,
  CLIPBOARD_RECURSION_PASTE_ERROR,
  clipboardMissingPatchPasteError,
} from './messages';

import * as ActionType from './actionTypes';

import {
  addNode,
  addLink,
  bulkMoveNodesAndComments,
  bulkDeleteNodesAndComments,
} from '../project/actions';
import {
  addError,
  addConfirmation,
} from '../messages/actions';
import composeMessage from '../messages/composeMessage';

import * as Selectors from './selectors';
import * as ProjectSelectors from '../project/selectors';

import {
  getRenderablePin,
  getPinSelectionError,
  getLinkingError,
  getInitialPatchOffset,
  patchToNodeProps,
} from '../project/utils';

import {
  getBBoxTopLeftPosition,
  getBoundingBoxSize,
  getEntitiesToCopy,
  getTabByPatchPath,
  getSelectedEntityIdsOfType,
  regenerateIds,
  resetClipboardEntitiesPosition,
} from './utils';
import { isInput, isEdge } from '../utils/browser';
import { getPmSwaggerUrl } from '../utils/urls';
import { addPoints } from '../project/nodeLayout';

import { ClipboardEntities } from '../types';

export const setPinSelection = (nodeId, pinKey) => ({
  type: ActionType.EDITOR_SELECT_PIN,
  payload: {
    nodeId,
    pinKey,
  },
});

export const clearPinSelection = () => ({
  type: ActionType.EDITOR_DESELECT_PIN,
});

export const doPinSelection = (nodeId, pinKey) => (dispatch, getState) => {
  const selectedPin = getRenderablePin(
    nodeId,
    pinKey,
    ProjectSelectors.getRenderableNodes(getState())
  );

  const err = getPinSelectionError(selectedPin);

  if (err) {
    dispatch(addError(LINK_ERRORS[err]));
    return false;
  }

  dispatch(setPinSelection(nodeId, pinKey));
  return true;
};

export const deselectAll = () => (dispatch, getState) => {
  const state = getState();
  if (!Selectors.hasSelection(state)) { return; }

  dispatch({
    type: ActionType.EDITOR_DESELECT_ALL,
    payload: {},
  });
};

export const selectEntity = R.curry((entityType, id) => ({
  type: ActionType.EDITOR_SELECT_ENTITY,
  payload: { id, entityType },
}));

export const deselectEntity = R.curry((entityType, id) => ({
  type: ActionType.EDITOR_DESELECT_ENTITY,
  payload: { id, entityType },
}));

export const addEntityToSelection = R.curry((entityType, id) => ({
  type: ActionType.EDITOR_ADD_ENTITY_TO_SELECTION,
  payload: { id, entityType },
}));

export const selectNode = selectEntity(SELECTION_ENTITY_TYPE.NODE);
export const selectComment = selectEntity(SELECTION_ENTITY_TYPE.COMMENT);
export const selectLink = selectEntity(SELECTION_ENTITY_TYPE.LINK);

 // :: { nodes :: [Node], links :: [Link], comments :: [Comment] } -> Action
export const setEditorSelection = entities => ({
  type: ActionType.EDITOR_SET_SELECION,
  payload: { entities },
});

export const addAndSelectNode = (typeId, position, currentPatchPath) => (dispatch) => {
  const newId = dispatch(addNode(typeId, position, currentPatchPath));
  dispatch(selectNode(newId));
};

export const linkPin = (nodeId, pinKey) => (dispatch, getState) => {
  const state = getState();
  const linkingFrom = Selectors.getLinkingPin(state);

  if (!linkingFrom) return;

  const linkingTo = { nodeId, pinKey };

  if (R.equals(linkingFrom, linkingTo)) {
    // linking a pin to itself
    dispatch(clearPinSelection());
    return;
  }

  const nodes = ProjectSelectors.getRenderableNodes(state);
  const renderablePinFrom = getRenderablePin(
    linkingFrom.nodeId,
    linkingFrom.pinKey,
    nodes
  );
  const renderablePinTo = getRenderablePin(
    linkingTo.nodeId,
    linkingTo.pinKey,
    nodes
  );

  const error = getLinkingError(renderablePinFrom, renderablePinTo);

  if (error) {
    dispatch(addError(LINK_ERRORS[error]));
    dispatch(clearPinSelection());
  } else {
    dispatch(addLink(linkingFrom, linkingTo));
  }
};

export const deleteSelection = () => (dispatch, getState) => {
  const state = getState();
  const selection = Selectors.getSelection(state);

  Selectors.getCurrentPatchPath(state).map(
    currentPatchPath => dispatch(bulkDeleteNodesAndComments(
      getSelectedEntityIdsOfType(SELECTION_ENTITY_TYPE.NODE, selection),
      getSelectedEntityIdsOfType(SELECTION_ENTITY_TYPE.LINK, selection),
      getSelectedEntityIdsOfType(SELECTION_ENTITY_TYPE.COMMENT, selection),
      currentPatchPath
    ))
  );
};

export const moveSelection = deltaPosition => (dispatch, getState) => {
  const state = getState();
  const selection = Selectors.getSelection(state);

  Selectors.getCurrentPatchPath(state).map(
    currentPatchPath => dispatch(bulkMoveNodesAndComments(
      getSelectedEntityIdsOfType(SELECTION_ENTITY_TYPE.NODE, selection),
      getSelectedEntityIdsOfType(SELECTION_ENTITY_TYPE.COMMENT, selection),
      deltaPosition,
      currentPatchPath
    ))
  );
};

export const setCurrentPatchOffset = newOffset => ({
  type: ActionType.SET_CURRENT_PATCH_OFFSET,
  payload: newOffset,
});

export const switchPatchUnsafe = patchPath => ({
  type: ActionType.EDITOR_SWITCH_PATCH,
  payload: {
    patchPath,
  },
});

export const switchPatch = patchPath => (dispatch, getState) => {
  const state = getState();

  const isSamePatchPath = foldMaybe(
    false,
    R.equals(patchPath),
    Selectors.getCurrentPatchPath(state)
  );

  if (isSamePatchPath) return;

  dispatch(switchPatchUnsafe(patchPath));

  const tabs = Selectors.getTabs(state);
  const tab = getTabByPatchPath(patchPath, tabs);
  const isOpeningNewTab = !tab;
  if (isOpeningNewTab) {
    const project = ProjectSelectors.getProject(state);
    const offset = getInitialPatchOffset(patchPath, project);

    dispatch(setCurrentPatchOffset(offset));
  }
};

export const openImplementationEditor = () => ({
  type: ActionType.EDITOR_OPEN_IMPLEMENTATION_CODE,
});

export const closeImplementationEditor = () => ({
  type: ActionType.EDITOR_CLOSE_IMPLEMENTATION_CODE,
});

export const switchTab = tabId => ({
  type: ActionType.EDITOR_SWITCH_TAB,
  payload: {
    tabId,
  },
});

export const startDraggingPatch = patchPath => (dispatch, getState) => {
  const state = getState();

  const previewSize = R.compose(
    R.prop('size'),
    patchToNodeProps,
    XP.getPatchByPathUnsafe(patchPath),
    ProjectSelectors.getProject
  )(state);

  dispatch({
    type: ActionType.START_DRAGGING_PATCH,
    payload: previewSize,
  });
};

export const closeTab = id => ({
  type: ActionType.TAB_CLOSE,
  payload: {
    id,
  },
});

export const sortTabs = newOrderObject => ({
  type: ActionType.TAB_SORT,
  payload: newOrderObject,
});

export const setFocusedArea = area => ({
  type: ActionType.SET_FOCUSED_AREA,
  payload: area,
});

export const showSuggester = placePosition => ({
  type: ActionType.SHOW_SUGGESTER,
  payload: placePosition,
});

export const hideSuggester = () => ({
  type: ActionType.HIDE_SUGGESTER,
});

export const highlightSugessterItem = patchPath => ({
  type: ActionType.HIGHLIGHT_SUGGESTER_ITEM,
  payload: {
    patchPath,
  },
});

// Suggester for libraries.
// Maybe it will be merged with common suggester one day.
export const showLibSuggester = () => ({
  type: ActionType.SHOW_LIB_SUGGESTER,
  payload: {},
});
export const hideLibSuggester = () => ({
  type: ActionType.HIDE_LIB_SUGGESTER,
});

// Microsoft Edge only supports Text and URL data types
const getClipboardDataType = () => (isEdge() ? 'Text' : CLIPBOARD_DATA_TYPE);

// :: State -> Maybe ClipboardEntities
const getClipboardEntities = (state) => {
  const selection = Selectors.getSelection(state);
  if (R.isEmpty(selection)) return Maybe.Nothing();

  return Selectors.getCurrentPatchPath(state).chain(
    currentPatchPath => R.compose(
      R.map(currentPatch => getEntitiesToCopy(currentPatch, selection)),
      XP.getPatchByPath(currentPatchPath),
      ProjectSelectors.getProject
    )(state)
  );
};

export const copyEntities = event => (dispatch, getState) => {
  // If user clicked somewhere on Patch (select Node or something else
  // except editing comment node) activeElement will be <div />
  // with className `PatchWrapper`.
  if (document.activeElement.className === 'PatchWrapper') {
    const state = getState();

    // linter confuses array and a Maybe
    // eslint-disable-next-line array-callback-return
    getClipboardEntities(state).map((entities) => {
      event.clipboardData.setData(getClipboardDataType(), JSON.stringify(entities, null, 2));
      event.preventDefault();
    });
  }
};

export const pasteEntities = event => (dispatch, getState) => {
  if (isInput(document.activeElement)) return;

  const state = getState();
  const maybeCurrentPatchPath = Selectors.getCurrentPatchPath(state);
  if (maybeCurrentPatchPath.isNothing) return;

  const currentPatchPath = explodeMaybe(
    'Imposible error: No currentPatchPath for paste entities',
    maybeCurrentPatchPath
  );

  const pastedString = event.clipboardData.getData(getClipboardDataType());

  let copiedEntities;
  try {
    copiedEntities = JSON.parse(pastedString);
  } catch (e) {
    // not a valid JSON, silently fail
    return;
  }

  if (ClipboardEntities.validate(copiedEntities).isLeft) {
    // wrong data format, silently fail
    return;
  }

  const pastedNodeTypes = R.map(XP.getNodeType, copiedEntities.nodes);
  if (R.contains(currentPatchPath, pastedNodeTypes)) {
    dispatch(addError(CLIPBOARD_RECURSION_PASTE_ERROR));
    return;
  }

  const project = ProjectSelectors.getProject(state);

  const availablePatches = R.compose(
    R.map(XP.getPatchPath),
    XP.listPatches,
  )(project);
  const missingPatches = R.without(availablePatches, pastedNodeTypes);

  if (!R.isEmpty(missingPatches)) {
    dispatch(addError(
      clipboardMissingPatchPasteError(missingPatches.join(', '))
    ));
    return;
  }

  // If pasted entities are equal to currently selected entities
  // paste them in roughly the same location as original with a light offset.
  // Otherwise, just stick them to the top left of the viewport
  const currentPatch = XP.getPatchByPathUnsafe(currentPatchPath, project);
  const defaultNewPosition = Selectors.getDefaultNodePlacePosition(state);
  const newPosition = foldMaybe(
    defaultNewPosition,
    R.ifElse(
      R.eqBy(
        R.compose( // check if selection is structurally the same as copied entities
          R.map(R.map(R.omit('id'))),
          R.dissoc('links'),
          resetClipboardEntitiesPosition
        ),
        copiedEntities
      ),
      R.converge(
        addPoints,
        [
          R.pipe(getBoundingBoxSize(currentPatch, project), R.assoc('y', 0)),
          getBBoxTopLeftPosition,
        ]
      ),
      R.always(defaultNewPosition)
    ),
    getClipboardEntities(state)
  );

  const entitiesToPaste = R.compose(
    R.evolve({
      nodes: R.map(R.over(
        R.lens(XP.getNodePosition, XP.setNodePosition),
        addPoints(newPosition)
      )),
      comments: R.map(R.over(
        R.lens(XP.getCommentPosition, XP.setCommentPosition),
        addPoints(newPosition)
      )),
    }),
    resetClipboardEntitiesPosition,
    regenerateIds
  )(copiedEntities);

  dispatch({
    type: ActionType.PASTE_ENTITIES,
    payload: {
      entities: entitiesToPaste,
      position: newPosition,
      patchPath: currentPatchPath,
    },
  });
};

export const cutEntities = event => (dispatch) => {
  if (isInput(document.activeElement)) return;

  dispatch(copyEntities(event));
  dispatch(deleteSelection());
};

export const installLibraryComplete = R.curry(
  (libParams, projects) => (dispatch) => {
    dispatch({
      type: ActionType.INSTALL_LIBRARIES_COMPLETE,
      payload: {
        libParams,
        projects,
      },
    });

    R.forEachObjIndexed(
      (proj, libName) => {
        const name = getLibName(libName);
        const version = XP.getProjectVersion(proj);
        dispatch(
          addConfirmation(libInstalled(name, version))
        );
      },
      projects
    );
  }
);

export const installLibraries = libParams => (dispatch, getState) => {
  dispatch({
    type: ActionType.INSTALL_LIBRARIES_BEGIN,
    payload: libParams,
  });

  const libQueries = R.map(stringifyLibQuery, libParams);

  const existingLibNames = R.compose(
    XP.listInstalledLibraryNames,
    ProjectSelectors.getProject
  )(getState());

  fetchLibsWithDependencies(getPmSwaggerUrl(), existingLibNames, libQueries)
    .then(projects => dispatch(installLibraryComplete(libParams, projects)))
    .catch((err) => {
      dispatch({
        type: ActionType.INSTALL_LIBRARIES_FAILED,
        payload: {
          libParams,
          error: err.message,
          errorCode: err.errorCode,
        },
      });
      dispatch(addError(composeMessage(err.message)));
    });
};

export const setSidebarLayout = settings => ({
  type: ActionType.SET_SIDEBAR_LAYOUT,
  payload: settings,
});
export const resizePanels = sizes => ({
  type: ActionType.RESIZE_PANELS,
  payload: sizes,
});
export const minimizePanel = panelId => ({
  type: ActionType.MINIMIZE_PANEL,
  payload: {
    panelId,
  },
});
export const maximizePanel = panelId => ({
  type: ActionType.MAXIMIZE_PANEL,
  payload: {
    panelId,
  },
});
export const togglePanel = panelId => (dispatch, getState) =>
  R.compose(
    R.ifElse(
      R.equals(true),
      () => dispatch(minimizePanel(panelId)),
      () => dispatch(maximizePanel(panelId))
    ),
    Selectors.isPanelMaximized(panelId)
  )(getState());

export const movePanel = (sidebarId, panelId) => ({
  type: ActionType.MOVE_PANEL,
  payload: {
    panelId,
    sidebarId,
  },
});
export const togglePanelAutohide = panelId => ({
  type: ActionType.TOGGLE_PANEL_AUTOHIDE,
  payload: {
    panelId,
  },
});

export const hideHelpbox = () => (dispatch, getState) => {
  if (Selectors.isHelpboxVisible(getState())) {
    dispatch({
      type: ActionType.HIDE_HELPBOX,
    });
  }
};
export const showHelpbox = () => (dispatch, getState) => {
  if (!Selectors.isHelpboxVisible(getState())) {
    dispatch({
      type: ActionType.SHOW_HELPBOX,
    });
  }
};
export const toggleHelp = () => (dispatch, getState) => {
  const state = getState();
  const focusedArea = Selectors.getFocusedArea(state);

  if (focusedArea === FOCUS_AREAS.PROJECT_BROWSER) {
    return dispatch({
      type: ActionType.TOGGLE_HELP,
    });
  }

  return dispatch(togglePanel(PANEL_IDS.HELPBAR));
};
