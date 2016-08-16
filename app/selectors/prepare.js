import R from 'ramda';
import {
  getLinks,
  getNodes,
  getNodeTypes,
  getLastNodeId,
  getLastPinId,
  getLastLinkId,
  getLastPatchId,
  getLastFolderId,
  getPatchByNodeId,
  getPatchNodes,
} from './project';
import * as NODE_CATEGORY from '../constants/nodeCategory';
import { NODETYPE_ERRORS } from '../constants/errorMessages';

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
  const nodeType = getNodeTypes(projectState)[typeId];
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


const findByProp = (propName, propVal, from) => R.pipe(
  R.values,
  R.find(R.propEq(propName, propVal))
)(from);

const findById = (id, from) => findByProp('id', id, from);
const findByPatchId = (id, from) => findByProp('patchId', id, from);
const findByNodeTypeId = (id, from) => findByProp('typeId', id, from);

const getLinksToDeleteWithNode = (projectState, nodeId, patchId) => R.pipe(
  R.values,
  R.filter(
    R.pipe(
      R.prop('pins'),
      R.find(R.propEq('nodeId', nodeId))
    )
  ),
  R.map(
    R.pipe(
      R.prop('id'),
      R.toString
    )
  )
)(getLinks(projectState, patchId));

const getNodeTypeToDeleteWithNode = (projectState, nodeId, patchId) => {
  const nodes = getNodes(projectState, patchId);
  const node = findById(nodeId, nodes);
  const nodeTypes = getNodeTypes(projectState);
  const nodeType = findById(node.typeId, nodeTypes);
  const isIO = (nodeType.category === NODE_CATEGORY.IO);

  let nodeTypeToDelete = null;
  let nodeTypeToDeleteError = false;

  if (isIO) {
    const patchNodes = getPatchNodes(projectState);
    const patchNode = patchNodes[patchId];
    const ioNodes = patchNode.io.length;
    const patchNodeType = (isIO) ? findByPatchId(patchId, nodeTypes) : null;

    if (ioNodes <= 1) {
      nodeTypeToDelete = patchNodeType.id;

      if (findByNodeTypeId(nodeTypeToDelete, nodes)) {
        nodeTypeToDeleteError = NODETYPE_ERRORS.CANT_DELETE_USED_PATCHNODE;
      }
    }

    // @TODO: Add check for pin usage! Can't delete IO node that used somewhere as pin.
    // NODETYPE_ERRORS.CANT_DELETE_USED_PIN_OF_PATCHNODE
  }

  return {
    id: nodeTypeToDelete,
    error: nodeTypeToDeleteError,
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

export const addLink = (projectState, data1, data2) => {
  const patch = getPatchByNodeId(projectState, data1.nodeId);
  const patchId = patch.id;
  const newId = getLastLinkId(projectState) + 1;

  return {
    payload: {
      newId,
      pins: [data1, data2],
    },
    meta: {
      patchId,
    },
  };
};
