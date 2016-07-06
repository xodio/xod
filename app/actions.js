import R from 'ramda';
import * as ActionType from './actionTypes';
import Selectors from './selectors';

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

export const addLink = (fromPinId, toPinId) => ({
  type: ActionType.LINK_ADD,
  payload: {
    fromPinId,
    toPinId,
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
  const nodeType = Selectors.NodeType.getNodeTypeById(getState(), nodeTypeId);
  if (nodeType && position) {
    result.push(
      dispatch(
        addNode({
          typeId: nodeType.id,
          position,
        })
      )
    );
    const nodeId = Selectors.Node.getLastNodeId(getState().project);
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


export const deleteNodeWithDependencies = (id) => (dispatch, getState) => {
  const state = getState().project;
  const result = [];
  // 1. getPinsByNodeId
  const pins = Selectors.Pin.getPinsByNodeId(state, { id });
  // 2. getLinksByPinId and delete them
  R.pipe(
    R.values,
    R.reduce((prev, c) => {
      const pinLinks = Selectors.Link.getLinksByPinId(state, { pinIds: [c.id] });
      return R.concat(prev, pinLinks);
    }, []),
    R.forEach((link) => {
      result.push(dispatch(deleteLink(link.id)));
    })
  )(pins);
  // 3. delete all found pins
  R.pipe(
    R.values,
    R.forEach((pin) => {
      result.push(dispatch(deletePin(pin.id)));
    })
  )(pins);
  // 4. delete node
  result.push(dispatch(deleteNode(id)));

  return result;
};

export const setNodeSelection = (id) => ({
  type: ActionType.EDITOR_SELECT_NODE,
  payload: {
    id,
  },
  meta: {
    skipHistory: true,
  },
});

export const setPinSelection = (id) => ({
  type: ActionType.EDITOR_SELECT_PIN,
  payload: {
    id,
  },
  meta: {
    skipHistory: true,
  },
});

export const setLinkSelection = (id) => ({
  type: ActionType.EDITOR_SELECT_LINK,
  payload: {
    id,
  },
  meta: {
    skipHistory: true,
  },
});

export const deselectAll = () => ({
  type: ActionType.EDITOR_DESELECT_ALL,
  payload: {},
  meta: {
    skipHistory: true,
  },
});

export const setMode = (mode) => ({
  type: ActionType.EDITOR_SET_MODE,
  payload: {
    mode,
  },
  meta: {
    skipHistory: true,
  },
});

export const selectNode = (id) => (dispatch, getState) => {
  const state = getState();
  const isSelected = Selectors.Editor.checkSelection(state.editor, 'Node', id);
  const result = [
    dispatch(deselectAll()),
  ];

  if (!isSelected) {
    result.push(dispatch(setNodeSelection(id)));
  }

  return result;
};

export const linkPin = (id) => (dispatch, getState) => {
  const state = getState();
  const selected = state.editor.linkingPin;
  const result = [
    dispatch(deselectAll()),
  ];

  if (selected !== id && selected !== null) {
    result.push(dispatch(addLink(selected, id)));
  } else if (selected !== id) {
    result.push(dispatch(setPinSelection(id)));
  }

  return result;
};

export const selectLink = (id) => (dispatch, getState) => {
  const state = getState();
  const isSelected = Selectors.Editor.checkSelection(state.editor, 'Link', id);
  const result = [
    dispatch(deselectAll()),
  ];

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
