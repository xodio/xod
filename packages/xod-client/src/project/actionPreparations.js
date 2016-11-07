import R from 'ramda';
import core from 'xod-core';
import { PROPERTY_KIND } from './constants';

export const addPatch = (projectState, label, folderId) => {
  const newId = core.generatePatchSID();

  return {
    newId,
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
  const patchId = core.getPatchByNodeId(projectState, id).id;

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

export const updateNodeProperty = (projectState, nodeId, propKind, propKey, propValue) => {
  const patchId = core.getPatchByNodeId(projectState, nodeId).id;
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

export const changePinMode = (projectState, nodeId, pinKey, injected) => {
  const patchId = core.getPatchByNodeId(projectState, nodeId).id;
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
    },
    meta: {
      patchId,
    },
  };
};

export const addLink = (state, pin1, pin2) => {
  const projectState = core.getProject(state);
  const patch = core.getPatchByNodeId(projectState, pin1.nodeId);
  const patchId = core.getPatchId(patch);
  const nodes = core.dereferencedNodes(projectState, patchId);
  const pins = core.getAllPinsFromNodes(nodes);

  const eqProps = (link) => R.both(
    R.propEq('nodeId', link.nodeId),
    R.propEq('key', link.pinKey)
  );
  const findPin = R.compose(
    R.flip(R.find)(pins),
    eqProps
  );
  const isOutput = R.propEq('direction', core.PIN_DIRECTION.OUTPUT);

  const fpin1 = findPin(pin1);
  const isOutputData1 = isOutput(fpin1);

  const fromPin = (isOutputData1) ? pin1 : pin2;
  const toPin = (isOutputData1) ? pin2 : pin1;

  const newId = core.generateId();

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
