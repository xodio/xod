import R from 'ramda';
import {
  getNodeTypes,
  getLastNodeId,
  getLastPinId,
  getLastLinkId,
  getLastPatchId,
  getLastFolderId,
  getPatchByNodeId,
  getPatchByPinId,
  getPinsByNodeIdInPatch,
  getLinksByPinIdInPatch,
} from './project';

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

export const addNode = (projectState, typeId, position) => {
  const newNodeId = getLastNodeId(projectState) + 1;
  const nodeType = getNodeTypes(projectState)[typeId];
  const lastPinId = getLastPinId(projectState);

  return {
    typeId,
    position,
    nodeType,
    newNodeId,
    lastPinId,
  };
};

export const deleteNode = (projectState, id) => {
  const patch = getPatchByNodeId(projectState, id);
  const pins = getPinsByNodeIdInPatch(projectState, {
    patchId: patch.id,
    id,
  });
  const links = R.pipe(
    R.values,
    R.reduce((prev, c) => {
      const pinLinks = getLinksByPinIdInPatch(
        projectState,
        {
          patchId: patch.id,
          pinIds: [c.id],
        }
      );
      return R.concat(prev, R.keys(pinLinks));
    }, [])
  )(pins);

  return {
    payload: {
      id,
      pins: R.keys(pins),
      links,
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

export const addLink = (projectState, pins) => {
  const patch = getPatchByPinId(projectState, pins[0]);
  const patchId = patch.id;
  const newId = getLastLinkId(projectState) + 1;

  return {
    payload: {
      newId,
      pins,
    },
    meta: {
      patchId,
    },
  };
};
