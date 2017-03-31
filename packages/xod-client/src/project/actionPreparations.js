import core from 'xod-core';
import { PROPERTY_KIND } from './constants';
import { getCurrentPatchId } from '../editor/selectors';

export const addPatch = (projectState, label, folderId) => {
  const newId = core.generatePatchSID();

  return {
    id: newId,
    label,
    folderId,
  };
};

export const addFolder = (projectState, name, parentId) => {
  const newId = core.generateId();

  return {
    newId,
    name,
    parentId,
  };
};

export const addNode = (projectState, typeId, position, patchId) => {
  const newNodeId = core.generateId();
  const nodeType = core.dereferencedNodeTypes(projectState)[typeId];

  return {
    payload: {
      typeId,
      position,
      nodeType,
      newNodeId,
    },
    meta: {
      patchId,
    },
  };
};

export const deleteNode = (projectState, id) => {
  const patch = core.getPatchByNodeId(projectState, id);
  const patchId = core.getPatchId(patch);
  const linksToDelete = core.getLinksConnectedWithNode(projectState, id, patchId);

  const nodeTypeToDelete = core.getNodeTypeToDeleteWithNode(projectState, id, patchId);

  return {
    payload: {
      id,
      links: linksToDelete,
      nodeType: nodeTypeToDelete,
    },
    meta: {
      patchId,
    },
  };
};

export const moveNode = (projectState, id, position) => {
  const patch = core.getPatchByNodeId(projectState, id);
  const patchId = core.getPatchId(patch);

  return {
    payload: {
      id,
      position,
    },
    meta: {
      patchId,
    },
  };
};

export const updateNodeProperty = (projectState, nodeId, propKind, propKey, propValue) => {
  const patch = core.getPatchByNodeId(projectState, nodeId);
  const patchId = core.getPatchId(patch);
  const node = core.dereferencedNodes(projectState, patchId)[nodeId];
  const nodeType = core.dereferencedNodeTypes(projectState)[node.typeId];
  const kind = (propKind === PROPERTY_KIND.PIN) ? 'pin' : 'property';
  const propType = (propKind === PROPERTY_KIND.PIN) ? nodeType.pins[propKey].type : undefined;

  return {
    payload: {
      id: nodeId,
      kind,
      key: propKey,
      value: propValue,
      type: propType,
    },
    meta: {
      patchId,
    },
  };
};

export const changePinMode = (projectState, nodeId, pinKey, injected, val) => {
  const patch = core.getPatchByNodeId(projectState, nodeId);
  const patchId = core.getPatchId(patch);
  const linksToDelete = core.getLinksConnectedWithPin(projectState, nodeId, pinKey, patchId);

  if (linksToDelete.length > 0) {
    return {
      error: core.PROPERTY_ERRORS.PIN_HAS_LINK,
    };
  }

  return {
    payload: {
      id: nodeId,
      key: pinKey,
      injected,
      value: val,
    },
    meta: {
      patchId,
    },
  };
};

export const addLink = (state, pin1, pin2) => {
  const patchId = getCurrentPatchId(state);
  const newId = core.generateId();

  return {
    payload: {
      newId,
      pins: [pin1, pin2],
    },
    meta: {
      patchId,
    },
  };
};
