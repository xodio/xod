import R from 'ramda';
import { createSelector } from 'reselect';

import * as PIN_DIRECTION from '../constants/pinDirection';
import * as PIN_VALIDITY from '../constants/pinValidity';
import { LINK_ERRORS } from '../constants/errorMessages';
import { PROPERTY_TYPE } from '../constants/property';
import * as ENTITIES from '../constants/entities';
import * as SIZES from '../constants/sizes';

import {
  getCurrentPatchId,
  getSelection,
  getLinkingPin,
  getSelectedNodeType,
  getModeChecks,
} from './editor';

/*
  Common utils
*/
const arr2obj = R.reduce((p, cur) => R.assoc(cur.id, cur, p), {});

const isEntitySelected = (state, entity, id) => {
  const selection = getSelection(state);
  return (
    selection.length > 0 &&
    R.pipe(
      R.filter((sel) =>
        (
          sel.entity === entity &&
          sel.id === id
        )
      ),
      R.length
    )(selection) > 0
  );
};
const isNodeSelected = (state, nodeId) => isEntitySelected(state, ENTITIES.NODE, nodeId);
const isLinkSelected = (state, linkId) => isEntitySelected(state, ENTITIES.LINK, linkId);

/*
  Project selectors
*/

const getProjectState = (state, path) => {
  if (path.length > 0 && R.has(path[0], state)) {
    return getProjectState(
      R.prop(path.shift(), state),
      path
    );
  }
  return state;
};

export const getProject = (state) => {
  const path = ['project', 'present'];
  return getProjectState(state, path);
};

export const getJSON = (state) => JSON.stringify(getProject(state));

export const getMeta = R.pipe(
  getProject,
  R.prop('meta')
);

/*
  Patch selectors
*/

export const getPatches = R.pipe(
  getProject,
  R.prop('patches')
);
export const getCurrentPatch = (state) => {
  const curPatchId = getCurrentPatchId(state);
  console.log('!', curPatchId, state);
  return R.pipe(
    getPatches,
    R.prop(curPatchId)
  )(state);
};

export const getPatchName = createSelector(
  getCurrentPatch,
  (patch) => R.prop('name')(patch)
);

export const doesPinHaveLinks = (pin, links) => R.pipe(
  R.values,
  R.filter((link) => (link.pins[0] === pin.id || link.pins[1] === pin.id)),
  R.length,
  R.flip(R.gt)(0)
)(links);

export const canPinHaveMoreLinks = (pin, links) => (
  (
    pin.direction === PIN_DIRECTION.INPUT &&
    !doesPinHaveLinks(pin, links)
  ) ||
  pin.direction === PIN_DIRECTION.OUTPUT
);

export const getValidPins = (pins, links, forPinId) => {
  const oPin = pins[forPinId];
  return R.pipe(
    R.values,
    R.reduce((p, pin) => {
      const samePin = (pin.id === oPin.id);
      const sameNode = (pin.nodeId === oPin.nodeId);
      const sameDirection = (pin.direction === oPin.direction);
      const sameType = (pin.type === oPin.type);
      const canHaveLink = canPinHaveMoreLinks(pin, links);

      let validness = PIN_VALIDITY.INVALID;


      if (!samePin && !sameNode && canHaveLink) {
        if (!sameDirection) { validness = PIN_VALIDITY.ALMOST; }
        if (!sameDirection && sameType) { validness = PIN_VALIDITY.VALID; }
      }

      const result = {
        id: pin.id,
        validness,
      };

      return R.assoc(pin.id, result, p);
    }, {})
  )(pins);
};

/*
  NodeType selectors
*/

export const getNodeTypes = R.pipe(
  getProject,
  R.prop('nodeTypes')
);

export const getNodeTypeById = (state, id) => R.pipe(
  getNodeTypes,
  R.prop(id)
)(state);

/*
  Node selectors
*/

export const getNodes = R.pipe(
  getCurrentPatch,
  R.prop('nodes')
);

export const getLastNodeId = (state) => R.pipe(
  getNodes,
  R.values,
  R.map(node => parseInt(node.id, 10)),
  R.reduce(R.max, 0)
)(state);

export const getNodeById = (state, props) => R.pipe(
  getNodes,
  R.filter((node) => node.id === props.id),
  R.values,
  R.head
)(state, props);

/*
  Pin selectors
*/

export const getPins = R.pipe(
  getCurrentPatch,
  R.prop('pins')
);

export const getPinsByNodeId = (state, props) => R.pipe(
  getPins,
  R.filter((pin) => pin.nodeId === props.id)
)(state, props);

export const getPinsByIds = (state, props) => R.pipe(
  getPins,
  R.values,
  R.reduce((p, pin) => {
    let result = p;
    if (props && props.pins && props.pins.indexOf(pin.id) !== -1) {
      result = R.assoc(pin.id, pin, p);
    }
    return result;
  }, {})
)(state, props);

const getVerticalPinOffsets = () => ({
  [PIN_DIRECTION.INPUT]: -1 * SIZES.NODE.padding.y,
  [PIN_DIRECTION.OUTPUT]: SIZES.NODE.padding.y - SIZES.PIN.radius * 2,
});

const getPinsWidth = (count, withMargins) => {
  const marginCount = (withMargins) ? count + 1 : count - 1;
  return (marginCount * SIZES.PIN.margin) + (count * SIZES.PIN.radius * 2);
};

const getPinPosition = (nodeTypePins, key, nodePosition) => {
  const originalPin = nodeTypePins[key];
  const direction = originalPin.direction;

  const groups = R.pipe(
    R.values,
    R.groupBy((nPin) => nPin.direction)
  )(nodeTypePins);
  const widths = R.pipe(
    R.keys,
    R.reduce((prev, dir) =>
      R.assoc(
        dir,
        getPinsWidth(groups[dir].length, false),
        prev
      ),
      {}
    )
  )(groups);
  const vOffset = getVerticalPinOffsets();
  const pinIndex = R.pipe(
    R.find(R.propEq('key', key)),
    R.prop('index')
  )(groups[direction]);
  const groupCenter = widths[direction] / 2;
  const pinX = (
    -1 * groupCenter +
    (
      pinIndex * SIZES.PIN.radius * 2 +
      pinIndex * SIZES.PIN.margin
    )
  );

  return {
    position: {
      x: nodePosition.x + pinX,
      y: nodePosition.y + vOffset[direction],
    },
  };
};

export const getPreparedPins = createSelector(
  [getPins, getNodeTypes, getNodes, getLinkingPin],
  (pins, nodeTypes, nodes, linkingPin) => R.pipe(
    R.values,
    R.reduce((p, pin) => {
      const node = nodes[pin.nodeId];
      const nodeTypePins = nodeTypes[node.typeId].pins;
      const originalPin = nodeTypePins[pin.key];

      const pinPosition = getPinPosition(nodeTypePins, pin.key, node.position);
      const radius = { radius: SIZES.PIN.radius };
      const isSelected = { isSelected: (linkingPin === pin.id) };

      return R.assoc(
        pin.id,
        R.mergeAll([pin, originalPin, pinPosition, radius, isSelected]),
        p
      );
    }, {})
  )(pins)
);

/*
  Link selectors
*/

export const getLinks = R.pipe(
  getCurrentPatch,
  R.prop('links')
);

export const getLinkById = (state, props) => R.pipe(
  getLinks,
  R.filter((link) => link.id === props.id),
  R.values,
  R.head
)(state, props);

export const getLinksByPinId = (state, props) => R.pipe(
  getLinks,
  R.filter(
    (link) => (
      props.pinIds.indexOf(link.pins[0]) !== -1 ||
      props.pinIds.indexOf(link.pins[1]) !== -1
    )
  ),
  R.values
)(state, props);

export const validateLink = (state, pinIds) => {
  const pins = getPreparedPins(state);
  const linksState = getLinks(state);
  const fromPin = pins[pinIds[0]];
  const toPin = pins[pinIds[1]];

  const sameDirection = fromPin.direction === toPin.direction;
  const sameNode = fromPin.nodeId === toPin.nodeId;
  const fromPinCanHaveMoreLinks = canPinHaveMoreLinks(fromPin, linksState);
  const toPinCanHaveMoreLinks = canPinHaveMoreLinks(toPin, linksState);

  const check = (
    !sameDirection &&
    !sameNode &&
    fromPinCanHaveMoreLinks &&
    toPinCanHaveMoreLinks
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
    if (!fromPinCanHaveMoreLinks || !toPinCanHaveMoreLinks) {
      result.message = LINK_ERRORS.ONE_LINK_FOR_INPUT_PIN;
    }
  }

  return result;
};

const addPinRadius = (position) => ({
  x: position.x + SIZES.PIN.radius,
  y: position.y + SIZES.PIN.radius,
});

export const getPreparedLinks = (state) => {
  const links = getLinks(state);
  const pins = getPreparedPins(state);

  return R.pipe(
    R.values,
    R.map((link) => {
      const addData = {};
      if (link.pins.length > 0) {
        if (link.pins[0]) {
          addData.from = addPinRadius(pins[link.pins[0]].position);
        }
        if (link.pins[1]) {
          addData.to = addPinRadius(pins[link.pins[1]].position);
        }
      }
      addData.isSelected = isLinkSelected(state, link.id);

      return R.merge(link, addData);
    }),
    arr2obj
  )(links);
};

const getNodeLabel = (state, node) => {
  const nodeType = getNodeTypeById(state, node.typeId);
  let nodeLabel = (node.label) ? node.label : nodeType.label;

  const nodeValue = R.view(R.lensPath(['properties', 'value']), node);
  if (nodeValue !== undefined) {
    const nodeValueType = nodeType.properties.value.type;
    nodeLabel = nodeValue;
    if (nodeValue === '' && nodeValueType === PROPERTY_TYPE.STRING) {
      nodeLabel = '<EmptyString>';
    }
  }

  return String(nodeLabel);
};
const getNodePins = (state, nodeId) => {
  const pins = getPreparedPins(state);
  return R.pipe(
    R.values,
    R.filter((pin) => pin.nodeId === nodeId),
    arr2obj
  )(pins);
};

export const getPreparedNodes = (state) => {
  const nodes = getNodes(state);

  return R.pipe(
    R.values,
    R.map((node) => {
      const label = getNodeLabel(state, node);
      const nodePins = getNodePins(state, node.id);
      const isSelected = isNodeSelected(state, node.id);

      return R.merge(node, {
        label,
        pins: nodePins,
        isSelected,
      });
    }),
    arr2obj
  )(nodes);
};

export const getNodeGhost = (state) => {
  const nodeTypeId = getSelectedNodeType(state);
  const isCreatingMode = getModeChecks(state).isCreatingNode;

  if (!(isCreatingMode && nodeTypeId)) {
    return null;
  }
  const nodePosition = { x: 0, y: 0 };
  const nodeType = getNodeTypeById(state, nodeTypeId);
  const nodeProperties = R.pipe(
    R.prop('properties'),
    R.values,
    R.reduce((p, prop) => R.assoc(prop.key, prop.defaultValue, p), {})
  )(nodeType);

  const nodeLabel = getNodeLabel(state, { typeId: nodeTypeId, properties: nodeProperties });

  let pinsCount = -1;
  const nodePins = R.pipe(
    R.values,
    R.map((pin) => {
      const id = { id: pinsCount };
      const pos = getPinPosition(nodeType.pins, pin.key, nodePosition);
      const radius = { radius: SIZES.PIN.radius };

      pinsCount--;

      return R.mergeAll([pin, id, pos, radius]);
    }),
    arr2obj
  )(nodeType.pins);

  return {
    id: -1,
    label: nodeLabel,
    typeId: nodeTypeId,
    position: nodePosition,
    pins: nodePins,
    properties: nodeProperties,
  };
};

export const getLinkGhost = (state) => {
  const fromPinId = getLinkingPin(state);
  if (!fromPinId) { return null; }

  const pins = getPreparedPins(state);
  const pin = pins[fromPinId];

  return {
    id: -1,
    pins: [pin],
    from: addPinRadius(pin.position),
    to: { x: 0, y: 0 },
  };
};
