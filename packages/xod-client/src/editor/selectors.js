import R from 'ramda';
import { createSelector } from 'reselect';
import core from 'xod-core';

import { EDITOR_MODE } from './constants';

export const getEditor = R.prop('editor');

export const getCurrentPatchId = R.pipe(
  getEditor,
  R.prop('currentPatchId')
);

export const getSelection = (state) => R.pipe(
  getEditor,
  R.prop('selection')
)(state);

export const getSelectedNodeType = (state) => R.pipe(
  getEditor,
  R.prop('selectedNodeType')
)(state);

export const getSelectionByTypes = createSelector(
  getSelection,
  (selection) => {
    let result = {};
    if (selection.length > 0) {
      result = R.groupBy((s) => s.entity, selection);
    }
    result.Node = result.Node || [];
    result.Pin = result.Pin || [];
    result.Link = result.Link || [];
    result.length = selection.length;

    return result;
  }
);

export const isEntitySelected = (selection, entityName, id) => R.pipe(
  R.filter(R.propEq('entity', entityName)),
  R.find(R.propEq('id', id)),
  R.isNil,
  R.not
)(selection);

export const isNodeSelected = R.curry(
  (selection, id) => isEntitySelected(selection, ENTITY.NODE, id)
);
export const isLinkSelected = R.curry(
  (selection, id) => isEntitySelected(selection, ENTITY.LINK, id)
);

const isPinSelected = (linkingPin, node, pin) => (
  linkingPin &&
  linkingPin.nodeId === node.id &&
  linkingPin.pinKey === pin.key
);

export const hasSelection = (state) => (
  (
    state.editor.selection &&
    state.editor.selection.length > 0
  ) || (
    state.editor.linkingPin &&
    state.editor.linkingPin !== null
  )
);

export const getLinkingPin = (state) => R.pipe(
  getEditor,
  R.prop('linkingPin')
)(state);

export const getMode = (state) => R.pipe(
  getEditor,
  R.prop('mode')
)(state);

export const getModeChecks = (state) => {
  const mode = getMode(state);
  return {
    mode,
    isDefault: (mode === EDITOR_MODE.DEFAULT),
    isCreatingNode: (mode === EDITOR_MODE.CREATING_NODE),
    isEditing: (mode === EDITOR_MODE.EDITING),
    isLinking: (mode === EDITOR_MODE.LINKING),
    isPanning: (mode === EDITOR_MODE.PANNING),
  };
};

export const getTabs = (state) => R.pipe(
  getEditor,
  R.prop('tabs')
)(state);

export const getPreparedTabs = (state) => {
  const currentPatchId = getCurrentPatchId(state);
  const projectState = core.getProject(state);

  return R.pipe(
    getTabs,
    R.values,
    R.map((tab) => {
      const patch = core.getPatchById(tab.patchId, projectState);
      return R.merge(
        tab,
        {
          name: patch.name,
          isActive: (currentPatchId === tab.patchId),
        }
      );
    }),
    R.indexBy(R.prop('id'))
  )(state);
};

export const getValidPins = (nodes, links, forPin) => {
  const allPins = core.getAllPinsFromNodes(nodes);
  const oPin = R.find(
    R.both(
      R.propEq('nodeId', forPin.nodeId),
      R.propEq('key', forPin.pinKey)
    ),
  allPins);

  return R.map(pin => {
    const sameNode = (pin.nodeId === oPin.nodeId);
    const sameDirection = (pin.direction === oPin.direction);
    const sameType = (pin.type === oPin.type);
    const canHaveLink = core.canPinHaveMoreLinks(pin, links);

    let validness = core.PIN_VALIDITY.INVALID;

    if (!sameNode && canHaveLink) {
      if (!sameDirection) { validness = core.PIN_VALIDITY.ALMOST; }
      if (!sameDirection && sameType) { validness = core.PIN_VALIDITY.VALID; }
    }

    return {
      nodeId: pin.nodeId,
      pinKey: pin.key,
      validness,
    };
  }, allPins);
};

export const getNodeGhost = (state) => {
  const nodeTypeId = getSelectedNodeType(state);
  const isCreatingMode = getModeChecks(state).isCreatingNode;

  if (!(isCreatingMode && nodeTypeId)) {
    return null;
  }

  const project = core.getProject(state);
  const nodePosition = { x: 0, y: 0 };
  const nodeType = core.getPreparedNodeTypeByKey(project, nodeTypeId);
  const nodeProperties = R.pipe(
    R.prop('properties'),
    R.values,
    R.reduce((p, prop) => R.assoc(prop.key, prop.value, p), {})
  )(nodeType);

  const nodeLabel = core.getNodeLabel(state, { typeId: nodeTypeId, properties: nodeProperties });

  let pinCount = -1;
  const nodePins = R.pipe(
    R.values,
    R.map((pin) => {
      const id = { id: pinCount };
      const pos = core.getPinPosition(nodeType.pins, pin.key, nodePosition);
      const radius = { radius: SIZE.PIN.radius };

      pinCount--;

      return R.mergeAll([pin, id, pos, radius]);
    }),
    core.indexById
  )(nodeType.pins);

  const pinsWidth = core.getGroupedPinsWidth(nodePins);
  const nodeWidth = core.getNodeWidth(pinsWidth);
  return {
    id: '',
    label: nodeLabel,
    typeId: nodeTypeId,
    position: nodePosition,
    pins: nodePins,
    width: nodeWidth,
    properties: nodeProperties,
  };
};

export const getLinkGhost = (state, patchId) => {
  const fromPin = getLinkingPin(state);
  if (!fromPin) { return null; }

  const project = core.getProject(state);
  const nodes = core.dereferencedNodes(project, patchId);
  const node = nodes[fromPin.nodeId];
  const pin = node.pins[fromPin.pinKey];

  return {
    id: '',
    pins: [pin],
    from: core.addPinRadius(pin.position),
    to: { x: 0, y: 0 },
  };
};

// :: dereferencedNodes -> viewNodes
export const viewNodes = (state, deferencedNodes) => {
  const selection = getSelection(state);
  const linkingPin = getLinkingPin(state);

  return R.map(node => {
    const markSelectedPin = (pin) =>
      R.assoc('isSelected', isPinSelected(linkingPin, node, pin), pin);

    return R.merge(node, {
      isSelected: isNodeSelected(selection, node.id),
      pins: R.map(markSelectedPin, node.pins),
    });
  }, deferencedNodes);
};

// :: dereferencedLinks -> viewLinks
export const viewLinks = (state, dereferencedLinks) => {
  const selection = getSelection(state);

  const isSelected = R.pipe(
    R.prop('id'),
    isLinkSelected(selection)
  );
  const markSelectedLink = (link) => R.assoc('isSelected', isSelected(link), link);

  return R.map(markSelectedLink, dereferencedLinks);
};
