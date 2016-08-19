import R from 'ramda';
import {
  getProject,
  getPreparedNodes,
  getPreparedNodeTypes,
  getAllPinsFromNodes,
  getLastNodeId,
  getLastPinId,
  getLastLinkId,
  getLastPatchId,
  getLastFolderId,
  getPatchByNodeId,
  getLinksToDeleteWithNode,
  getNodeTypeToDeleteWithNode,
} from './project';
import * as PIN_DIRECTION from '../constants/pinDirection';

export const addPatch = (projectState, name, folderId) => {
  const newId = getLastPatchId(projectState) + 1;

  return {
    newId,
    name,
    folderId,
  };
};

export const addFolder = (projectState, name, parentId) => {
  const newId = getLastFolderId(projectState) + 1;

  return {
    newId,
    name,
    parentId,
  };
};

export const addNode = (projectState, typeId, position, patchId) => {
  const newNodeId = getLastNodeId(projectState) + 1;
  const nodeType = getPreparedNodeTypes(projectState)[typeId];
  const lastPinId = getLastPinId(projectState);

  return {
    payload: {
      typeId,
      position,
      nodeType,
      newNodeId,
      lastPinId,
    },
    meta: {
      patchId,
    },
  };
};

export const deleteNode = (projectState, id) => {
  const patch = getPatchByNodeId(projectState, id);
  const linksToDelete = getLinksToDeleteWithNode(projectState, id, patch.id);

  const nodeTypeToDelete = getNodeTypeToDeleteWithNode(projectState, id, patch.id);

  return {
    payload: {
      id,
      links: linksToDelete,
      nodeType: nodeTypeToDelete,
    },
    meta: {
      patchId: patch.id,
    },
  };
};

export const moveNode = (projectState, id, position) => {
  const patchId = getPatchByNodeId(projectState, id).id;

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

export const dragNode = (projectState, id, position) =>
  R.assocPath(['meta', 'skipHistory'], true, moveNode(projectState, id, position));

export const updateNodeProperty = (projectState, nodeId, propKey, propValue) => {
  const patchId = getPatchByNodeId(projectState, nodeId).id;

  return {
    payload: {
      id: nodeId,
      key: propKey,
      value: propValue,
    },
    meta: {
      patchId,
    },
  };
};

export const addLink = (state, pin1, pin2) => {
  const projectState = getProject(state);
  const patch = getPatchByNodeId(projectState, pin1.nodeId);
  const nodes = getPreparedNodes(projectState, patch.id);
  const pins = getAllPinsFromNodes(nodes);

  const eqProps = (link) => R.both(
    R.propEq('nodeId', link.nodeId),
    R.propEq('key', link.pinKey)
  );
  const findPin = R.compose(
    R.flip(R.find)(pins),
    eqProps
  );
  const isOutput = R.propEq('direction', PIN_DIRECTION.OUTPUT);

  const fpin1 = findPin(pin1);
  const isOutputData1 = isOutput(fpin1);

  const fromPin = (isOutputData1) ? pin1 : pin2;
  const toPin = (isOutputData1) ? pin2 : pin1;

  const patchId = patch.id;
  const newId = getLastLinkId(projectState) + 1;

  return {
    payload: {
      newId,
      pins: [fromPin, toPin],
    },
    meta: {
      patchId,
    },
  };
};
