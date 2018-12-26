import * as R from 'ramda';
import { Maybe } from 'ramda-fantasy';

import * as XP from 'xod-project';
import {
  fetchLibsWithDependencies,
  stringifyLibQuery,
  getLibName,
} from 'xod-pm';
import { generatePatchSuite } from 'xod-tabtest';
import { compileSuite, runSuite } from 'xod-cloud-tabtest';
import { foldMaybe, eitherToPromise, explodeMaybe } from 'xod-func-tools';

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
import * as ProjectActionType from '../project/actionTypes';

import {
  addNode,
  addLink,
  bulkMoveNodesAndComments,
  bulkDeleteNodesAndComments,
} from '../project/actions';
import { addError, addConfirmation } from '../messages/actions';
import composeMessage from '../messages/composeMessage';

import * as Selectors from './selectors';
import * as ProjectSelectors from '../project/selectors';

import {
  getRenderablePin,
  getLinkingError,
  getInitialPatchOffset,
  patchToNodeProps,
} from '../project/utils';

import {
  getBBoxTopLeftPosition,
  getBoundingBoxSize,
  getBoundingBox,
  getEntitiesToCopy,
  getTabByPatchPath,
  getSelectedEntityIdsOfType,
  regenerateIds,
  resetClipboardEntitiesPosition,
} from './utils';
import { isInput, isEdge } from '../utils/browser';
import { getPmSwaggerUrl, HOSTNAME } from '../utils/urls';
import {
  addPoints,
  subtractPoints,
  DEFAULT_PANNING_OFFSET,
} from '../project/nodeLayout';

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

export const deselectAll = () => (dispatch, getState) => {
  const state = getState();
  if (!Selectors.hasSelection(state)) {
    return;
  }

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

export const selectAll = () => (dispatch, getState) => {
  const state = getState();
  const selection = {
    nodes: R.values(ProjectSelectors.getCurrentPatchNodes(state)),
    links: R.values(ProjectSelectors.getCurrentPatchLinks(state)),
    comments: R.values(ProjectSelectors.getCurrentPatchComments(state)),
  };
  return dispatch(setEditorSelection(selection));
};

export const addAndSelectNode = (
  typeId,
  position,
  currentPatchPath
) => dispatch => {
  const newId = dispatch(addNode(typeId, position, currentPatchPath));
  dispatch(selectNode(newId));
};

export const linkPin = (nodeId, pinKey) => (dispatch, getState) => {
  const state = getState();
  const linkingFrom = Selectors.getLinkingPin(state);

  if (!linkingFrom) return;

  const linkingTo = { nodeId, pinKey };

  // We have to check is User want to create the same link to prevent recreating it.
  // But in case that there is no information about pin direction
  // we're check it using a Cartesian set of conditions.
  const isSameLink = R.compose(
    R.any(
      R.both(
        R.either(
          R.both(
            XP.isLinkInputNodeIdEquals(linkingTo.nodeId),
            XP.isLinkInputPinKeyEquals(linkingTo.pinKey)
          ),
          R.both(
            XP.isLinkInputNodeIdEquals(linkingFrom.nodeId),
            XP.isLinkInputPinKeyEquals(linkingFrom.pinKey)
          )
        ),
        R.either(
          R.both(
            XP.isLinkOutputNodeIdEquals(linkingTo.nodeId),
            XP.isLinkOutputPinKeyEquals(linkingTo.pinKey)
          ),
          R.both(
            XP.isLinkOutputNodeIdEquals(linkingFrom.nodeId),
            XP.isLinkOutputPinKeyEquals(linkingFrom.pinKey)
          )
        )
      )
    ),
    R.values,
    ProjectSelectors.getCurrentPatchLinks
  )(state);

  if (R.equals(linkingFrom, linkingTo) || isSameLink) {
    // linking a pin to itself
    // or linking pins that already has the same link
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
    dispatch(
      foldMaybe(
        clearPinSelection(),
        patchPath => addLink(linkingFrom, linkingTo, patchPath),
        Selectors.getCurrentPatchPath(state)
      )
    );
  }
};

export const deleteSelection = () => (dispatch, getState) => {
  const state = getState();
  const selection = Selectors.getSelection(state);

  Selectors.getCurrentPatchPath(state).map(currentPatchPath =>
    dispatch(
      bulkDeleteNodesAndComments(
        getSelectedEntityIdsOfType(SELECTION_ENTITY_TYPE.NODE, selection),
        getSelectedEntityIdsOfType(SELECTION_ENTITY_TYPE.LINK, selection),
        getSelectedEntityIdsOfType(SELECTION_ENTITY_TYPE.COMMENT, selection),
        currentPatchPath
      )
    )
  );
};

export const moveSelection = deltaPosition => (dispatch, getState) => {
  const state = getState();
  const selection = Selectors.getSelection(state);

  Selectors.getCurrentPatchPath(state).map(currentPatchPath =>
    dispatch(
      bulkMoveNodesAndComments(
        getSelectedEntityIdsOfType(SELECTION_ENTITY_TYPE.NODE, selection),
        getSelectedEntityIdsOfType(SELECTION_ENTITY_TYPE.COMMENT, selection),
        deltaPosition,
        currentPatchPath
      )
    )
  );
};

export const patchWorkareaResized = (width, height) => ({
  type: ActionType.PATCH_WORKAREA_RESIZED,
  payload: { width, height },
});

export const setCurrentPatchOffset = newOffset => ({
  type: ActionType.SET_CURRENT_PATCH_OFFSET,
  payload: newOffset,
});

const setPatchOffsetByEntitiesBoundingBox = getDesiredOffset => (
  dispatch,
  getState
) => {
  const state = getState();
  const maybeCurrentPatchPath = Selectors.getCurrentPatchPath(state);
  if (maybeCurrentPatchPath.isNothing) return;

  const currentPatchPath = explodeMaybe(
    'Imposible error: No currentPatchPath to autopan',
    maybeCurrentPatchPath
  );
  const project = ProjectSelectors.getProject(state);
  const currentPatch = XP.getPatchByPathUnsafe(currentPatchPath, project);

  const entitiesBoundingBox = getBoundingBox(currentPatch, project, {
    nodes: XP.listNodes(currentPatch),
    comments: XP.listComments(currentPatch),
  });

  const patchBoundingRect = Selectors.getPatchWorkareaSize(state);

  R.compose(dispatch, setCurrentPatchOffset, getDesiredOffset)(
    entitiesBoundingBox,
    patchBoundingRect
  );
};

export const setCurrentPatchOffsetToOrigin = () =>
  setPatchOffsetByEntitiesBoundingBox(entitiesBB =>
    subtractPoints(DEFAULT_PANNING_OFFSET, entitiesBB)
  );

export const setCurrentPatchOffsetToCenter = () =>
  setPatchOffsetByEntitiesBoundingBox((entitiesBB, patchBB) => ({
    x: (patchBB.width - entitiesBB.width) / 2 - entitiesBB.x,
    y: (patchBB.height - entitiesBB.height) / 2 - entitiesBB.y,
  }));

export const switchPatchUnsafe = patchPath => ({
  type: ActionType.EDITOR_SWITCH_PATCH,
  payload: {
    patchPath,
  },
});

export const switchPatch = patchPath => (dispatch, getState) => {
  const state = getState();

  const patchDoesNotExist = R.compose(
    Maybe.isNothing,
    XP.getPatchByPath(patchPath),
    ProjectSelectors.getProject
  )(state);

  if (patchDoesNotExist) return;

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

export const openAttachmentEditor = markerName => ({
  type: ActionType.EDITOR_OPEN_ATTACHMENT,
  payload: markerName,
});

export const closeAttachmentEditor = () => ({
  type: ActionType.EDITOR_CLOSE_ATTACHMENT,
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
    patchToNodeProps(false),
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
const getClipboardEntities = state => {
  const selection = Selectors.getSelection(state);
  if (R.isEmpty(selection)) return Maybe.Nothing();

  return Selectors.getCurrentPatchPath(state).chain(currentPatchPath =>
    R.compose(
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
    getClipboardEntities(state).map(entities => {
      event.clipboardData.setData(
        getClipboardDataType(),
        JSON.stringify(entities, null, 2)
      );
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

  const availablePatches = R.compose(R.map(XP.getPatchPath), XP.listPatches)(
    project
  );
  const missingPatches = R.without(availablePatches, pastedNodeTypes);

  if (!R.isEmpty(missingPatches)) {
    dispatch(
      addError(clipboardMissingPatchPasteError(missingPatches.join(', ')))
    );
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
        R.compose(
          // check if selection is structurally the same as copied entities
          R.map(R.map(R.omit('id'))),
          R.omit(['links', 'attachments']),
          resetClipboardEntitiesPosition
        ),
        copiedEntities
      ),
      R.converge(addPoints, [
        R.pipe(getBoundingBoxSize(currentPatch, project), R.assoc('y', 0)),
        getBBoxTopLeftPosition,
      ]),
      R.always(defaultNewPosition)
    ),
    getClipboardEntities(state)
  );

  const entitiesToPaste = R.compose(
    R.evolve({
      nodes: R.map(
        R.over(
          R.lens(XP.getNodePosition, XP.setNodePosition),
          addPoints(newPosition)
        )
      ),
      comments: R.map(
        R.over(
          R.lens(XP.getCommentPosition, XP.setCommentPosition),
          addPoints(newPosition)
        )
      ),
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

export const cutEntities = event => (dispatch, getState) => {
  if (isInput(document.activeElement)) return;

  const state = getState();
  const isInTabtestEditorTab = Selectors.getCurrentTab(state)
    .map(R.propEq('editedAttachment', XP.TABTEST_MARKER_PATH))
    .getOrElse(false);

  if (isInTabtestEditorTab) return;

  dispatch(copyEntities(event));
  dispatch(deleteSelection());
};

export const installLibraryComplete = R.curry(
  (libParams, projects) => dispatch => {
    dispatch({
      type: ActionType.INSTALL_LIBRARIES_COMPLETE,
      payload: {
        libParams,
        projects,
      },
    });

    R.forEachObjIndexed((proj, libName) => {
      const name = getLibName(libName);
      const version = XP.getProjectVersion(proj);
      dispatch(addConfirmation(libInstalled(name, version)));
    }, projects);
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
    .catch(err => {
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

export const splitLinksToBuses = () => (dispatch, getState) => {
  const state = getState();

  Selectors.getCurrentPatchPath(state).map(patchPath => {
    const linkIds = R.compose(
      getSelectedEntityIdsOfType(SELECTION_ENTITY_TYPE.LINK),
      Selectors.getSelection
    )(state);

    if (R.isEmpty(linkIds)) return null;

    return dispatch({
      type: ProjectActionType.LINKS_SPLIT_TO_BUSES,
      payload: {
        linkIds,
        patchPath,
      },
    });
  });
};

export const selectConstantNodeValue = (nodeId, patchPath) => ({
  type: ActionType.SELECT_CONSTANT_NODE_VALUE,
  payload: {
    nodeId,
    patchPath,
  },
});

export const runTabtest = patchPath => (dispatch, getState) => {
  dispatch({ type: ActionType.TABTEST_RUN_REQUESTED });
  const suiteP = R.compose(
    eitherToPromise,
    p => generatePatchSuite(p, patchPath),
    ProjectSelectors.getProject
  )(getState());

  suiteP
    .then(
      R.tap(() => {
        dispatch({ type: ActionType.TABTEST_GENERATED_CPP });
      })
    )
    .then(compileSuite(HOSTNAME))
    .then(
      R.tap(() => {
        dispatch({ type: ActionType.TABTEST_COMPILED });
      })
    )
    .then(runSuite)
    .then(({ stdout }) => {
      dispatch(
        addConfirmation({
          title: 'Tests passed',
          note: R.compose(R.join('\n'), R.reject(R.startsWith('======')))(
            stdout
          ),
          persistent: true,
        })
      );

      dispatch({
        type: ActionType.TABTEST_RUN_FINISHED,
        payload: { stdout },
      });
    })
    .catch(err => {
      dispatch({
        type: ActionType.TABTEST_ERROR,
        payload: err,
      });
    });
};
