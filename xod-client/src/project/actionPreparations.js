import R from 'ramda';
import * as Selectors from './selectors';
import { PIN_DIRECTION, PROPERTY_ERRORS } from 'xod-core/project/constants';
import { PROPERTY_KIND } from 'xod-client/project/constants';
import { getId } from 'xod-core/utils';

export const addPatch = (projectState, name, folderId) => {
  const newId = getId();

  return {
    newId,
    name,
    folderId,
  };
};

export const addFolder = (projectState, name, parentId) => {
  const newId = Selectors.getLastFolderId(projectState) + 1;

  return {
    newId,
    name,
    parentId,
  };
};

export const addNode = (projectState, typeId, position, patchId) => {
  const newNodeId = getId();
  const nodeType = Selectors.dereferencedNodeTypes(projectState)[typeId];

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
  const patch = Selectors.getPatchByNodeId(projectState, id);
  const linksToDelete = Selectors.getLinksToDeleteWithNode(projectState, id, patch.id);

  const nodeTypeToDelete = Selectors.getNodeTypeToDeleteWithNode(projectState, id, patch.id);

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
  const patchId = Selectors.getPatchByNodeId(projectState, id).id;

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
  const patchId = Selectors.getPatchByNodeId(projectState, nodeId).id;
  const node = Selectors.dereferencedNodes(projectState, patchId)[nodeId];
  const nodeType = Selectors.dereferencedNodeTypes(projectState)[node.typeId];
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
  const patchId = Selectors.getPatchByNodeId(projectState, nodeId).id;
  const linksToDelete = Selectors.getLinksConnectedWithPin(projectState, nodeId, pinKey, patchId);

  if (linksToDelete.length > 0) {
    return {
      error: PROPERTY_ERRORS.PIN_HAS_LINK,
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
  const projectState = Selectors.getProject(state);
  const patch = Selectors.getPatchByNodeId(projectState, pin1.nodeId);
  const nodes = Selectors.dereferencedNodes(projectState, patch.id);
  const pins = Selectors.getAllPinsFromNodes(nodes);

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
  const newId = getId();

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
