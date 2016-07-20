import * as ActionType from './actionTypes';
import * as STATUS from './constants/statuses';
import Selectors from './selectors';
import { upload as uploadToEspruino } from 'xod-espruino/upload';


export const showError = (error) => ({
  type: ActionType.ERROR_SHOW,
  payload: {
    timestamp: new Date().getTime(),
    error,
  },
});

export const hideError = (timestamp) => ({
  type: ActionType.ERROR_HIDE,
  payload: {
    timestamp,
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

export const deselectAll = () => (dispatch, getState) => {
  const state = getState();
  if (!Selectors.Editor.hasSelection(state)) { return; }

  dispatch({
    type: ActionType.EDITOR_DESELECT_ALL,
    payload: {},
  });
};

export const setMode = (mode) => ({
  type: ActionType.EDITOR_SET_MODE,
  payload: {
    mode,
  },
});

export const selectNode = (id) => (dispatch, getState) => {
  const state = getState();
  const selection = Selectors.Editor.getSelection(state);
  const isSelected = Selectors.Editor.isSelected(selection, 'Node', id);
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
    const validation = Selectors.Link.validateLink(state, pins);
    if (validation.isValid) {
      result.push(dispatch(addLink(pins)));
    } else {
      result.push(dispatch(showError({ message: validation.message })));
    }
  } else if (selected !== id) {
    result.push(dispatch(setPinSelection(id)));
  }

  return result;
};

export const selectLink = (id) => (dispatch, getState) => {
  const state = getState();
  const selection = Selectors.Editor.getSelection(state);
  const isSelected = Selectors.Editor.isSelected(selection, 'Link', id);
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

  dispatch({
    type: ActionType.UPLOAD,
    meta: { status: STATUS.STARTED },
  });

  const progress = (message, percentage) => dispatch({
    type: ActionType.UPLOAD,
    meta: { status: STATUS.PROGRESSED },
    payload: { message, percentage },
  });

  const succeed = () => dispatch({
    type: ActionType.UPLOAD,
    meta: { status: STATUS.SUCCEEDED },
  });

  const fail = (err) => dispatch({
    type: ActionType.UPLOAD,
    meta: { status: STATUS.FAILED },
    payload: { message: err.message },
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
