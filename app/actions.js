import R from 'ramda';
import * as ActionType from './actionTypes';
import Selectors from './selectors';

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

export const addNode = (node) => ({
  type: ActionType.NODE_ADD,
  payload: node,
});

export const deleteNode = (id) => ({
  type: ActionType.NODE_DELETE,
  payload: {
    id,
  },
});

export const addPin = (nodeId, key) => ({
  type: ActionType.PIN_ADD,
  payload: {
    nodeId,
    key,
  },
});

export const deletePin = (id) => ({
  type: ActionType.PIN_DELETE,
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

export const addNodeWithDependencies = (nodeTypeId, position) => (dispatch, getState) => {
  const result = [];
  const nodeTypes = Selectors.NodeType.getNodeTypes(getState());
  const nodeType = nodeTypes[nodeTypeId];
  const defaultProps = R.pipe(
    R.prop('properties'),
    R.values,
    R.reduce((p, prop) => R.assoc(prop.key, prop.defaultValue, p), {})
  )(nodeType);
  if (nodeType && position) {
    result.push(
      dispatch(
        addNode({
          typeId: nodeType.id,
          position,
          properties: defaultProps,
        })
      )
    );
    const nodeId = Selectors.Node.getLastNodeId(getState());
    R.values(nodeType.pins).forEach((pin) => {
      result.push(
        dispatch(
          addPin(nodeId, pin.key)
        )
      );
    });
  }

  return result;
};

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
