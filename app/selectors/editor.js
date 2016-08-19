import R from 'ramda';
import { createSelector } from 'reselect';

import * as PIN_VALIDITY from '../constants/pinValidity';
import { LINK_ERRORS } from '../constants/errorMessages';
import * as EDITOR_MODE from '../constants/editorModes';
import * as ENTITY from '../constants/entities';
import * as SIZES from '../constants/sizes';

import {
  arr2obj,
  getProject,
  getPatchById,
  getPatchByNodeId,
  getAllPinsFromNodes,
  canPinHaveMoreLinks,
  getPreparedNodeTypeByKey,
  dereferencedNodes,
  getLinks,
  getNodeLabel,
  getPinPosition,
  getGroupedPinsWidth,
  getNodeWidth,
  addPinRadius,
} from './project';

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

export const isNodeSelected = R.curry((selection, id) => isEntitySelected(selection, ENTITY.NODE, id));
export const isLinkSelected = R.curry((selection, id) => isEntitySelected(selection, ENTITY.LINK, id));

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
  const projectState = getProject(state);

  return R.pipe(
    getTabs,
    R.values,
    R.map((tab) => {
      const patch = getPatchById(tab.patchId, projectState);
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
  const allPins = getAllPinsFromNodes(nodes);
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
    const canHaveLink = canPinHaveMoreLinks(pin, links);

    let validness = PIN_VALIDITY.INVALID;

    if (!sameNode && canHaveLink) {
      if (!sameDirection) { validness = PIN_VALIDITY.ALMOST; }
      if (!sameDirection && sameType) { validness = PIN_VALIDITY.VALID; }
    }

    return {
      nodeId: pin.nodeId,
      pinKey: pin.key,
      validness,
    };
  }, allPins);
};

export const validateLink = (state, linkData) => {
  const project = getProject(state);
  const patch = getPatchByNodeId(project, linkData[0].nodeId);
  const patchId = patch.id;

  const nodes = dereferencedNodes(project, patchId);
  const pins = getAllPinsFromNodes(nodes);
  const linksState = getLinks(project, patchId);

  const eqProps = (data) => R.both(
    R.propEq('nodeId', data.nodeId),
    R.propEq('key', data.pinKey)
  );
  const findPin = R.compose(
    R.flip(R.find)(pins),
    eqProps
  );

  const pin1 = findPin(linkData[0]);
  const pin2 = findPin(linkData[1]);

  const sameDirection = pin1.direction === pin2.direction;
  const sameNode = pin1.nodeId === pin2.nodeId;
  const pin1CanHaveMoreLinks = canPinHaveMoreLinks(pin1, linksState);
  const pin2CanHaveMoreLinks = canPinHaveMoreLinks(pin2, linksState);

  const check = (
    !sameDirection &&
    !sameNode &&
    pin1CanHaveMoreLinks &&
    pin2CanHaveMoreLinks
  );

  const result = {
    isValid: check,
    message: 'Unknown error',
  };

  if (!check) {
    if (sameDirection) {
      result.message = LINK_ERRORS.SAME_DIRECTION;
    } else
    if (sameNode) {
      result.message = LINK_ERRORS.SAME_NODE;
    } else
    if (!pin1CanHaveMoreLinks || !pin2CanHaveMoreLinks) {
      result.message = LINK_ERRORS.ONE_LINK_FOR_INPUT_PIN;
    }
  }

  return result;
};

export const getNodeGhost = (state) => {
  const nodeTypeId = getSelectedNodeType(state);
  const isCreatingMode = getModeChecks(state).isCreatingNode;

  if (!(isCreatingMode && nodeTypeId)) {
    return null;
  }

  const project = getProject(state);
  const nodePosition = { x: 0, y: 0 };
  const nodeType = getPreparedNodeTypeByKey(project, nodeTypeId);
  const nodeProperties = R.pipe(
    R.prop('properties'),
    R.values,
    R.reduce((p, prop) => R.assoc(prop.key, prop.defaultValue, p), {})
  )(nodeType);

  const nodeLabel = getNodeLabel(state, { typeId: nodeTypeId, properties: nodeProperties });

  let pinCount = -1;
  const nodePins = R.pipe(
    R.values,
    R.map((pin) => {
      const id = { id: pinCount };
      const pos = getPinPosition(nodeType.pins, pin.key, nodePosition);
      const radius = { radius: SIZES.PIN.radius };

      pinCount--;

      return R.mergeAll([pin, id, pos, radius]);
    }),
    arr2obj
  )(nodeType.pins);

  const pinsWidth = getGroupedPinsWidth(nodePins);
  const nodeWidth = getNodeWidth(pinsWidth);
  return {
    id: -1,
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

  const project = getProject(state);
  const nodes = dereferencedNodes(project, patchId);
  const node = nodes[fromPin.nodeId];
  const pin = node.pins[fromPin.pinKey];

  return {
    id: -1,
    pins: [pin],
    from: addPinRadius(pin.position),
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
