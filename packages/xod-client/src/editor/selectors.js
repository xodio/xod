import R from 'ramda';
import { createSelector } from 'reselect';
import core from 'xod-core';

import { EDITOR_MODE } from './constants';
import { PROPERTY_KIND } from '../project/constants';
import { addPoints, addNodePositioning } from './nodePlacementUtils';

export const getEditor = R.prop('editor');

export const getCurrentPatchId = R.pipe(
  getEditor,
  R.prop('currentPatchId')
);

export const getSelection = state => R.pipe(
  getEditor,
  R.prop('selection')
)(state);

export const getSelectedNodeType = state => R.pipe(
  getEditor,
  R.prop('selectedNodeType')
)(state);

export const getSelectionByTypes = createSelector(
  getSelection,
  (selection) => {
    let result = {};
    if (selection.length > 0) {
      result = R.groupBy(s => s.entity, selection);
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
  (selection, id) => isEntitySelected(selection, core.ENTITY.NODE, id)
);
export const isLinkSelected = R.curry(
  (selection, id) => isEntitySelected(selection, core.ENTITY.LINK, id)
);

const isPinSelected = (linkingPin, node, pin) => (
  linkingPin &&
  linkingPin.nodeId === node.id &&
  linkingPin.pinKey === pin.key
);

export const hasSelection = state => (
  (
    state.editor.selection &&
    state.editor.selection.length > 0
  ) || (
    state.editor.linkingPin &&
    state.editor.linkingPin !== null
  )
);

export const getLinkingPin = state => R.pipe(
  getEditor,
  R.prop('linkingPin')
)(state);

export const getMode = state => R.pipe(
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

export const getTabs = state => R.pipe(
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
          label: patch.label,
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

  return R.map((pin) => {
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
  const nodeType = core.getPreparedNodeTypeById(project, nodeTypeId);

  const nodeProperties = R.pipe(
    R.prop('properties'),
    R.values,
    R.reduce((p, prop) => R.assoc(prop.key, prop.value, p), {})
  )(nodeType);

  const nodeLabel = core.getNodeLabel(state, { typeId: nodeTypeId, properties: nodeProperties });

  const nodePins = R.pipe(
    R.values,
    R.addIndex(R.map)(
      (pin, index) => R.merge(pin, { id: index })
    ),
    core.indexById
  )(nodeType.pins);

  return addNodePositioning({
    id: '',
    label: nodeLabel,
    typeId: nodeTypeId,
    position: nodePosition,
    pins: nodePins,
    properties: nodeProperties,
  });
};

export const getLinkGhost = (state, patchId) => {
  const fromPin = getLinkingPin(state);
  if (!fromPin) { return null; }

  const project = core.getProject(state);
  const nodes = core.dereferencedNodes(project, patchId);
  const nodesWithPositioning = R.map(addNodePositioning, nodes);
  const node = nodesWithPositioning[fromPin.nodeId];
  const pin = node.pins[fromPin.pinKey];

  return {
    id: '',
    pins: [pin],
    type: pin.type,
    from: addPoints(pin.position, node.position),
    to: { x: 0, y: 0 },
  };
};

// :: dereferencedNodes -> viewNodes -- Adds isSelected flags to nodes and their pins
export const markSelectedNodes = (state, deferencedNodes) => {
  const selection = getSelection(state);
  const linkingPin = getLinkingPin(state);

  return R.map((node) => {
    const markSelectedPin = pin =>
      R.assoc('isSelected', isPinSelected(linkingPin, node, pin), pin);

    return R.merge(node, {
      isSelected: isNodeSelected(selection, node.id),
      pins: R.map(markSelectedPin, node.pins),
    });
  }, deferencedNodes);
};

// :: dereferencedLinks -> viewLinks -- Adds isSelected flags
export const markSelectedLinks = (state, dereferencedLinks) => {
  const selection = getSelection(state);

  const isSelected = R.pipe(
    R.prop('id'),
    isLinkSelected(selection)
  );
  const markSelectedLink = link => R.assoc('isSelected', isSelected(link), link);

  return R.map(markSelectedLink, dereferencedLinks);
};

export const dereferencedSelection = R.curry((derefNodes, derefLinks, selection) => {
  const dereferenced = {
    [core.ENTITY.NODE]: derefNodes,
    [core.ENTITY.LINK]: derefLinks,
  };

  return R.map(
    R.compose(
      R.converge(
        R.assoc('entity'),
        [
          R.head,
          R.path(R.__, dereferenced),
        ]
      ),
      R.props(['entity', 'id'])
    ),
    selection
  );
});

// :: string -> string
const capitalizeFirstLetter = R.converge(
  R.concat,
  [
    R.compose(
      R.toUpper,
      R.head
    ),
    R.tail,
  ]
);

// :: node -> propForInspector { injected, key, kind, label, type, value }
const nodePropsForInspector = R.compose(
  R.map(
    R.applySpec({
      kind: R.always(PROPERTY_KIND.PROP),
      key: R.head,
      type: R.always(core.PROPERTY_TYPE.STRING), // TODO: Fix it and get from NodeType
      label: R.compose(capitalizeFirstLetter, R.head), // TODO: Get rid of this hack
      value: R.last,
      injected: R.F,
    })
  ),
  R.toPairs,
  R.prop('properties')
);

// :: node -> propForInspector { injected, key, kind, label, type, value }
const nodePinsForInspector = R.compose(
  R.map(
    R.applySpec({
      kind: R.always(PROPERTY_KIND.PIN),
      key: R.prop('key'),
      type: R.prop('type'),
      label: R.prop('label'),
      value: R.prop('value'),
      injected: R.prop('injected'),
    })
  ),
  R.sortBy(R.prop('index')),
  R.reject(R.propEq('direction', core.PIN_DIRECTION.OUTPUT)),
  R.values,
  R.prop('pins')
);

// :: node -> propForInspector[]
const extractNodeForInspector = R.converge(
  R.concat,
  [
    nodePropsForInspector,
    nodePinsForInspector,
  ]
);

// :: link -> propForInspector[]
const extractLinkForInspector = R.always({});

// :: dereferencedSelection -> propForInspector[]
export const dataForInspectorFromSelection = R.map(
  R.applySpec({
    entity: R.prop('entity'),
    id: R.prop('id'),
    props: R.ifElse(
      R.propEq('entity', core.ENTITY.NODE),
      extractNodeForInspector,
      extractLinkForInspector
    ),
  })
);
