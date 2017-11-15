import R from 'ramda';
import { Maybe } from 'ramda-fantasy';

import * as XP from 'xod-project';
import { fetchLibXodball, stringifyLibQuery } from 'xod-pm';

import {
  SELECTION_ENTITY_TYPE,
  CLIPBOARD_DATA_TYPE,
  CLIPBOARD_ERRORS as CLIPBOARD_ERROR_CODES,
} from './constants';
import { LINK_ERRORS, CLIPBOARD_ERRORS } from '../messages/constants';

import { libInstalled } from './messages';

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
  const currentPatchPath = Selectors.getCurrentPatchPath(state);
  const selection = Selectors.getSelection(state);

  dispatch(bulkDeleteNodesAndComments(
    getSelectedEntityIdsOfType(SELECTION_ENTITY_TYPE.NODE, selection),
    getSelectedEntityIdsOfType(SELECTION_ENTITY_TYPE.LINK, selection),
    getSelectedEntityIdsOfType(SELECTION_ENTITY_TYPE.COMMENT, selection),
    currentPatchPath
  ));
};

export const moveSelection = deltaPosition => (dispatch, getState) => {
  const state = getState();
  const currentPatchPath = Selectors.getCurrentPatchPath(state);
  const selection = Selectors.getSelection(state);

  dispatch(bulkMoveNodesAndComments(
    getSelectedEntityIdsOfType(SELECTION_ENTITY_TYPE.NODE, selection),
    getSelectedEntityIdsOfType(SELECTION_ENTITY_TYPE.COMMENT, selection),
    deltaPosition,
    currentPatchPath
  ));
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
  const currentPatchPath = Selectors.getCurrentPatchPath(state);

  if (currentPatchPath === patchPath) { return; }

  const tabs = Selectors.getTabs(state);
  const tab = getTabByPatchPath(patchPath, tabs);
  const isOpeningNewTab = !tab;

  dispatch(switchPatchUnsafe(patchPath));

  if (isOpeningNewTab) {
    const project = ProjectSelectors.getProject(state);
    const offset = getInitialPatchOffset(patchPath, project);

    dispatch(setCurrentPatchOffset(offset));
  }
};

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

export const toggleHelpbar = () => ({
  type: ActionType.TOGGLE_HELPBAR,
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

  const currentPatchPath = Selectors.getCurrentPatchPath(state);
  return R.compose(
    R.map(currentPatch => getEntitiesToCopy(currentPatch, selection)),
    XP.getPatchByPath(currentPatchPath),
    ProjectSelectors.getProject
  )(state);
};

export const copyEntities = event => (dispatch, getState) => {
  if (isInput(event)) return;

  const state = getState();

  // linter confuses array and a Maybe
  // eslint-disable-next-line array-callback-return
  getClipboardEntities(state).map((entities) => {
    event.clipboardData.setData(getClipboardDataType(), JSON.stringify(entities, null, 2));
    event.preventDefault();
  });
};

export const pasteEntities = event => (dispatch, getState) => {
  if (isInput(document.activeElement)) return;

  const state = getState();
  const currentPatchPath = Selectors.getCurrentPatchPath(state);
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
    dispatch(addError(CLIPBOARD_ERRORS[CLIPBOARD_ERROR_CODES.RECURSION_DETECTED]));
    return;
  }

  const project = ProjectSelectors.getProject(state);

  const availablePatches = R.compose(
    R.map(XP.getPatchPath),
    XP.listPatches,
  )(project);
  const missingPatches = R.without(availablePatches, pastedNodeTypes);

  if (!R.isEmpty(missingPatches)) {
    dispatch(addError(XP.formatString(
      CLIPBOARD_ERRORS[CLIPBOARD_ERROR_CODES.NO_REQUIRED_PATCHES],
      { missingPatches: missingPatches.join(', ') }
    )));
    return;
  }

  // If pasted entities are equal to currently selected entities
  // paste them in roughly the same location as original with a light offset.
  // Otherwise, just stick them to the top left of the viewport
  const currentPatch = XP.getPatchByPathUnsafe(currentPatchPath);
  const defaultNewPosition = Selectors.getDefaultNodePlacePosition(state);
  const newPosition = Maybe.maybe(
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

export const installLibrary = reqParams => (dispatch) => {
  dispatch({
    type: ActionType.INSTALL_LIBRARY_BEGIN,
    payload: reqParams,
  });

  const libName = `${reqParams.owner}/${reqParams.name}`;

  fetchLibXodball(getPmSwaggerUrl(), stringifyLibQuery(reqParams))
    .then(xodball => R.compose(
      (patches) => {
        dispatch({
          type: ActionType.INSTALL_LIBRARY_COMPLETE,
          payload: {
            libName,
            request: reqParams,
            patches,
            xodball,
          },
        });
        dispatch(
          addConfirmation(libInstalled(libName, xodball.version))
        );
      },
      XP.prepareLibPatchesToInsertIntoProject,
    )(libName, xodball))
    .catch((err) => {
      dispatch({
        type: ActionType.INSTALL_LIBRARY_FAILED,
        payload: {
          libName,
          request: reqParams,
          error: err.message,
          errorCode: err.errorCode,
        },
      });
      dispatch(addError(err.message));
    });
};
