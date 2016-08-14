import R from 'ramda';
import * as ActionType from './actionTypes';
import * as STATUS from './constants/statuses';
import * as EDITOR_MODE from './constants/editorModes';
import Selectors from './selectors';
import { uploadToEspruino } from './utils/espruino';

const getTimestamp = () => new Date().getTime();

export const addError = (error) => ({
  type: ActionType.ERROR_ADD,
  payload: error,
  meta: {
    timestamp: getTimestamp(),
    status: STATUS.STARTED,
  },
});

export const deleteError = (id) => ({
  type: ActionType.ERROR_DELETE,
  payload: {
    id,
  },
  meta: {
    timestamp: getTimestamp(),
    status: STATUS.DELETED,
  },
});

export const moveNode = (id, position) => (dispatch, getState) => {
  const projectState = Selectors.Project.getProject(getState());
  const preparedData = Selectors.Prepare.moveNode(projectState, id, position);

  dispatch({
    type: ActionType.NODE_MOVE,
    payload: preparedData.payload,
    meta: preparedData.meta,
  });
};

export const dragNode = (id, position) => (dispatch, getState) => {
  const projectState = Selectors.Project.getProject(getState());
  const preparedData = Selectors.Prepare.dragNode(projectState, id, position);

  dispatch({
    type: ActionType.NODE_MOVE,
    payload: preparedData.payload,
    meta: preparedData.meta,
  });
};

export const addNode = (typeId, position, patchId) => (dispatch, getState) => {
  const projectState = Selectors.Project.getProject(getState());
  const preparedData = Selectors.Prepare.addNode(projectState, typeId, position, patchId);

  dispatch({
    type: ActionType.NODE_ADD,
    payload: preparedData.payload,
    meta: preparedData.meta,
  });
};

export const deleteNode = (id) => (dispatch, getState) => {
  const projectState = Selectors.Project.getProject(getState());
  const preparedData = Selectors.Prepare.deleteNode(projectState, id);

  dispatch({
    type: ActionType.NODE_DELETE,
    payload: preparedData.payload,
    meta: preparedData.meta,
  });
};

export const addLink = (data1, data2) => (dispatch, getState) => {
  const projectState = Selectors.Project.getProject(getState());
  const preparedData = Selectors.Prepare.addLink(projectState, data1, data2);

  dispatch({
    type: ActionType.LINK_ADD,
    payload: preparedData.payload,
    meta: preparedData.meta,
  });
};

export const deleteLink = (id) => ({
  type: ActionType.LINK_DELETE,
  payload: {
    id,
  },
});

export const updateMeta = (data) => ({
  type: ActionType.META_UPDATE,
  payload: data,
});

export const setNodeSelection = (id) => ({
  type: ActionType.EDITOR_SELECT_NODE,
  payload: {
    id,
  },
});

export const setPinSelection = (nodeId, pinKey) => ({
  type: ActionType.EDITOR_SELECT_PIN,
  payload: {
    nodeId,
    pinKey,
  },
});

export const setLinkSelection = (id) => ({
  type: ActionType.EDITOR_SELECT_LINK,
  payload: {
    id,
  },
});

export const setMode = (mode) => (dispatch, getState) => {
  if (Selectors.Editor.getMode(getState()) === mode) {
    return;
  }

  dispatch({
    type: ActionType.EDITOR_SET_MODE,
    payload: {
      mode,
    },
  });
};

export const deselectAll = () => (dispatch, getState) => {
  const state = getState();
  if (!Selectors.Editor.hasSelection(state)) { return; }

  dispatch({
    type: ActionType.EDITOR_DESELECT_ALL,
    payload: {},
  });
  if (!Selectors.Editor.getModeChecks(state).isDefault) {
    dispatch(setMode(EDITOR_MODE.DEFAULT));
  }
};

export const selectNode = (id) => (dispatch, getState) => {
  const state = getState();
  const selection = Selectors.Editor.getSelection(state);
  const isSelected = Selectors.Editor.isNodeSelected(selection, id);
  const deselect = dispatch(deselectAll());
  const result = [];
  if (deselect) {
    result.push(deselect);
  }

  if (!isSelected) {
    result.push(dispatch(setNodeSelection(id)));
  }

  return result;
};

export const addAndSelectNode = (typeId, position, curPatchId) => (dispatch, getState) => {
  dispatch(addNode(typeId, position, curPatchId));
  dispatch(setMode(EDITOR_MODE.DEFAULT));

  const newId = Selectors.Project.getLastNodeId(getState());
  dispatch(selectNode(newId));
};

export const linkPin = (nodeId, pinKey) => (dispatch, getState) => {
  const data = {
    nodeId,
    pinKey,
  };
  const state = getState();
  const selected = state.editor.linkingPin;
  const deselect = dispatch(deselectAll());
  const result = [];
  if (deselect) {
    result.push(deselect);
  }

  const pins = [selected, data];

  const notEquals = R.not(R.equals(selected, data));

  if (notEquals && selected !== null) {
    const validation = Selectors.Project.validateLink(state, pins);
    if (validation.isValid) {
      result.push(dispatch(addLink(pins[0], pins[1])));
    } else {
      result.push(dispatch(addError({ message: validation.message })));
    }
    dispatch(setMode(EDITOR_MODE.DEFAULT));
  } else if (notEquals) {
    dispatch(setMode(EDITOR_MODE.LINKING));
    result.push(dispatch(setPinSelection(nodeId, pinKey)));
  }

  return result;
};

export const selectLink = (id) => (dispatch, getState) => {
  const state = getState();
  const selection = Selectors.Editor.getSelection(state);
  const isSelected = Selectors.Editor.isLinkSelected(selection, id);
  const deselect = dispatch(deselectAll());
  const result = [];
  if (deselect) {
    result.push(deselect);
  }

  if (!isSelected) {
    result.push(dispatch(setLinkSelection(id)));
  }

  return result;
};

export const setSelectedNodeType = (id) => ({
  type: ActionType.EDITOR_SET_SELECTED_NODETYPE,
  payload: {
    id,
  },
});

export const updateNodeProperty = (nodeId, propKey, propValue) => (dispatch, getState) => {
  const projectState = Selectors.Project.getProject(getState());
  const preparedData = Selectors.Prepare.updateNodeProperty(
    projectState,
    nodeId,
    propKey,
    propValue
  );

  dispatch({
    type: ActionType.NODE_UPDATE_PROPERTY,
    payload: preparedData.payload,
    meta: preparedData.meta,
  });
};

export const loadProjectFromJSON = (json) => ({
  type: ActionType.PROJECT_LOAD_DATA,
  payload: json,
});

export const upload = () => (dispatch, getState) => {
  const project = Selectors.Project.getProjectPojo(getState());
  const processes = Selectors.Processes.getProccesses(getState());
  const newId = Selectors.Processes.getNewId(processes);

  dispatch({
    type: ActionType.UPLOAD,
    meta: { status: STATUS.STARTED },
  });

  const progress = (message, percentage) => dispatch({
    type: ActionType.UPLOAD,
    meta: { status: STATUS.PROGRESSED },
    payload: {
      id: newId,
      message,
      percentage,
    },
  });

  const succeed = () => dispatch({
    type: ActionType.UPLOAD,
    payload: {
      id: newId,
    },
    meta: { status: STATUS.SUCCEEDED },
  });

  const fail = (err) => dispatch({
    type: ActionType.UPLOAD,
    meta: { status: STATUS.FAILED },
    payload: {
      id: newId,
      message: err.message,
    },
  });

  uploadToEspruino(project, progress)
    .then(succeed)
    .catch(err => {
      if (err.constructor !== Error) {
        throw err;
      }

      fail(err);
    });
};

export const deleteProcess = (id, type) => ({
  type,
  payload: {
    id,
  },
  meta: {
    status: STATUS.DELETED,
  },
});

export const deleteSelection = () => (dispatch, getState) => {
  const selection = Selectors.Editor.getSelection(getState());
  const DELETE_ACTIONS = {
    Node: deleteNode,
    Link: deleteLink,
  };

  selection.forEach((select) => {
    dispatch(
      DELETE_ACTIONS[select.entity](select.id)
    );
  });
};

export const undoPatch = (id) => ({
  type: ActionType.getPatchUndoType(id),
  payload: {},
});

export const redoPatch = (id) => ({
  type: ActionType.getPatchRedoType(id),
  payload: {},
});

export const clearHistoryPatch = (id) => ({
  type: ActionType.getPatchClearHistoryType(id),
  payload: {},
});

export const switchPatch = (id) => (dispatch, getState) => {
  if (Selectors.Editor.getCurrentPatchId(getState()) === id) { return; }

  dispatch(deselectAll());
  dispatch({
    type: ActionType.EDITOR_SWITCH_PATCH,
    payload: {
      id,
    },
  });
};

export const addPatch = (name, folderId) => (dispatch, getState) => {
  const projectState = Selectors.Project.getProject(getState());
  const preparedData = Selectors.Prepare.addPatch(projectState, name, folderId);

  dispatch({
    type: ActionType.PATCH_ADD,
    payload: preparedData,
  });
};

export const renamePatch = (id, name) => ({
  type: ActionType.PATCH_RENAME,
  payload: {
    name,
  },
  meta: {
    patchId: id,
  },
});

export const deletePatch = (id) => ({
  type: ActionType.PATCH_DELETE,
  payload: {
    id,
  },
});

export const movePatch = (changes) => ({
  type: ActionType.PATCH_MOVE,
  payload: {
    id: changes.id,
    folderId: changes.folderId,
  },
  meta: {
    patchId: changes.id,
  },
});

export const addFolder = (name, parentId) => (dispatch, getState) => {
  const projectState = Selectors.Project.getProject(getState());
  const preparedData = Selectors.Prepare.addFolder(projectState, name, parentId);
  dispatch({
    type: ActionType.FOLDER_ADD,
    payload: preparedData,
  });
};

export const renameFolder = (id, name) => ({
  type: ActionType.FOLDER_RENAME,
  payload: {
    id,
    name,
  },
});

export const deleteFolder = (id) => (dispatch, getState) => {
  const folders = Selectors.Project.getFoldersByFolderId(getState(), id);
  const patches = Selectors.Project.getPatchesByFolderId(getState(), id);

  folders.forEach(folder => dispatch(deleteFolder(folder.id)));
  patches.forEach(patch => dispatch(deletePatch(patch.id)));
  dispatch({
    type: ActionType.FOLDER_DELETE,
    payload: {
      id,
    },
  });
};

export const moveFolder = (changes) => ({
  type: ActionType.FOLDER_MOVE,
  payload: {
    id: changes.id,
    parentId: changes.parentId,
  },
});

export const closeTab = (id) => ({
  type: ActionType.TAB_CLOSE,
  payload: {
    id,
  },
});

export const sortTabs = (newOrderObject) => ({
  type: ActionType.TAB_SORT,
  payload: newOrderObject,
});
