import * as ActionType from './actionTypes';
import * as STATUS from './constants/statuses';
import * as EDITOR_MODE from './constants/editorModes';
import Selectors from './selectors';
import { upload as uploadToEspruino } from 'xod-espruino/upload';

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

export const moveNode = (id, position) => ({
  type: ActionType.NODE_MOVE,
  payload: {
    id,
    position,
  },
});

export const dragNode = (id, position) => ({
  type: ActionType.NODE_MOVE,
  payload: {
    id,
    position,
  },
  meta: {
    skipHistory: true,
  },
});

export const addNode = (typeId, position) => ({
  type: ActionType.NODE_ADD,
  payload: {
    typeId,
    position,
  },
});

export const deleteNode = (id) => ({
  type: ActionType.NODE_DELETE,
  payload: {
    id,
  },
});

export const addLink = (pins) => ({
  type: ActionType.LINK_ADD,
  payload: {
    pins,
  },
});

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

export const setPinSelection = (id) => ({
  type: ActionType.EDITOR_SELECT_PIN,
  payload: {
    id,
  },
});

export const setLinkSelection = (id) => ({
  type: ActionType.EDITOR_SELECT_LINK,
  payload: {
    id,
  },
});

export const setMode = (mode) => ({
  type: ActionType.EDITOR_SET_MODE,
  payload: {
    mode,
  },
});

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

export const addAndSelectNode = (typeId, position) => (dispatch, getState) => {
  dispatch(addNode(typeId, position));
  dispatch(setMode(EDITOR_MODE.DEFAULT));

  const newId = Selectors.Project.getLastNodeId(getState());
  dispatch(selectNode(newId));
};

export const linkPin = (id) => (dispatch, getState) => {
  const state = getState();
  const selected = state.editor.linkingPin;
  const deselect = dispatch(deselectAll());
  const result = [];
  if (deselect) {
    result.push(deselect);
  }

  const pins = [selected, id];

  if (selected !== id && selected !== null) {
    const validation = Selectors.Project.validateLink(state, pins);
    if (validation.isValid) {
      result.push(dispatch(addLink(pins)));
    } else {
      result.push(dispatch(addError({ message: validation.message })));
    }
    dispatch(setMode(EDITOR_MODE.DEFAULT));
  } else if (selected !== id) {
    dispatch(setMode(EDITOR_MODE.LINKING));
    result.push(dispatch(setPinSelection(id)));
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

export const updateNodeProperty = (nodeId, propKey, propValue) => ({
  type: ActionType.NODE_UPDATE_PROPERTY,
  payload: {
    id: nodeId,
    key: propKey,
    value: propValue,
  },
});

export const loadProjectFromJSON = (json) => ({
  type: ActionType.PROJECT_LOAD_DATA,
  payload: json,
});

export const upload = () => (dispatch, getState) => {
  const project = Selectors.Project.getJSON(getState());
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
