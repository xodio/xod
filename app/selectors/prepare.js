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

const getPinKeyByNodeIdAndLabel = (nodeId, label, patch) => R.pipe(
  R.prop('io'),
  R.find(
    R.both(
      R.propEq('nodeId', nodeId),
      R.propEq('label', label)
    )
  ),
  R.propOr(null, 'key')
)(patch);

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
    const patch = patchNodes[patchId];
    const ioNodes = patch.io.length;
    const patchNodeType = (isIO) ? findByPatchId(patchId, nodeTypes) : null;
    const patchNode = findByNodeTypeId(patchNodeType.id, nodes);

    let patchNodeLinks = 0;
    if (patchNode) {
      // Get links and check for pins usage
      const pinKey = getPinKeyByNodeIdAndLabel(node.id, node.properties.label, patch);
      const links = getLinks(projectState, patchId);
      patchNodeLinks = R.pipe(
        R.values,
        R.filter(
          link => (
            (link.pins[0].nodeId === patchNode.id && link.pins[0].pinKey === pinKey) ||
            (link.pins[1].nodeId === patchNode.id && link.pins[1].pinKey === pinKey)
          )
        ),
        R.length
      )(links);
    }

    if (patchNodeLinks > 0) {
      // This pin have links
      nodeTypeToDeleteError = NODETYPE_ERRORS.CANT_DELETE_USED_PIN_OF_PATCHNODE;
    } else if (ioNodes === 1) {
      // This is last IO node! It will remove whole PatchNode.
      nodeTypeToDelete = patchNodeType.id;

      if (patchNode) {
        // This patch node is used somewhere!
        nodeTypeToDeleteError = NODETYPE_ERRORS.CANT_DELETE_USED_PATCHNODE;
      }
    }
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
