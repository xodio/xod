import R from 'ramda';
import { createSelector } from 'reselect';

import * as PIN_DIRECTION from '../constants/pinDirection';
import * as PIN_VALIDITY from '../constants/pinValidity';
import { LINK_ERRORS, NODETYPE_ERRORS } from '../constants/errorMessages';
import { PROPERTY_TYPE } from '../constants/property';
import * as ENTITIES from '../constants/entities';
import * as SIZES from '../constants/sizes';
import * as NODE_CATEGORY from '../constants/nodeCategory';

import {
  getCurrentPatchId,
  getSelection,
  getLinkingPin,
  getSelectedNodeType,
  getModeChecks,
} from './editor';

export const getUserName = () => 'Bob';

/*
  Common utils
*/
const arr2obj = R.indexBy(R.prop('id'));
const findByProp = (propName, propVal, from) => R.pipe(
  R.values,
  R.find(R.propEq(propName, propVal))
)(from);

const findById = (id, from) => findByProp('id', id, from);
const findByKey = (key, from) => findByProp('key', key, from);
const findByPatchId = (id, from) => findByProp('patchId', id, from);
const findByNodeTypeId = (id, from) => findByProp('typeId', id, from);

const isEntitySelected = (state, entity, id) => {
  const selection = getSelection(state);
  if (!selection) { return false; }

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

export const getPatches = R.pipe(
  getProject,
  R.prop('patches')
);

export const getPatchById = (projectState, id) => {
  const patch = R.view(
    R.lensPath([
      'patches',
      id,
    ])
  )(projectState);

  return R.propOr(patch, 'present', patch);
};

export const getPatchesByFolderId = (state, folderId) => R.pipe(
  getPatches,
  R.values,
  R.map(R.prop('present')),
  R.filter(R.propEq('folderId', folderId))
)(state);

const getPatchByEntityId = (projectState, id, entityBranch) => R.pipe(
  R.prop('patches'),
  R.keys,
  R.map(patchId => getPatchById(projectState, patchId)),
  R.filter(patch => R.has(id, R.prop(entityBranch, patch))),
  R.head
)(projectState);

export const getPatchByNodeId = (projectState, nodeId) =>
  getPatchByEntityId(projectState, nodeId, 'nodes');

export const getPatchByPinId = (projectState, pinId) =>
  getPatchByEntityId(projectState, pinId, 'pins');

export const getCurrentPatch = (rootState) => {
  const curPatchId = getCurrentPatchId(rootState);
  const projectState = getProject(rootState);
  return getPatchById(projectState, curPatchId);
};

export const getPatchName = createSelector(
  getCurrentPatch,
  (patch) => R.prop('name')(patch)
);

export const doesPinHaveLinks = (pin, links) => R.pipe(
  R.values,
  R.filter((link) => (
    (link.pins[0].pinKey === pin.key && link.pins[0].nodeId === pin.nodeId) ||
    (link.pins[1].pinKey === pin.key && link.pins[1].nodeId === pin.nodeId)
  )),
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

const getAllPinsFromNodes = R.pipe(
  R.values,
  R.reduce(
    (p, cur) =>
    R.pipe(
      R.prop('pins'),
      R.values,
      R.map(R.assoc('nodeId', cur.id)),
      R.concat(p)
    )(cur),
    []
  )
);

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

export const validatePatches = () => R.pipe(
  R.values,
  R.all(
    patch => (
      patch.hasOwnProperty('id') &&
      patch.hasOwnProperty('name') &&
      patch.hasOwnProperty('nodes') &&
      patch.hasOwnProperty('pins') &&
      patch.hasOwnProperty('links')
    )
  )
);

export const isPatchesUpdated = (newPatches, oldPatches) => (
  !R.equals(R.keys(newPatches), R.keys(oldPatches))
);

export const getProjectPojo = (state) => {
  const project = getProject(state);
  const patches = R.pipe(
    getPatches,
    R.values,
    R.map(patch => R.propOr(patch, 'present', patch)),
    arr2obj
  )(project);

  return R.assoc('patches', patches, project);
};

export const getProjectJSON = R.compose(
  JSON.stringify,
  getProjectPojo
);

export const validateProject = (project) => (
  typeof project === 'object' &&
  (
    project.hasOwnProperty('patches') &&
    project.hasOwnProperty('nodeTypes') &&
    project.hasOwnProperty('counter') &&
    project.hasOwnProperty('meta')
  ) &&
  (
    R.keys(project.patches).length === 0 ||
    validatePatches(project.patches)
  )
);

export const parseProjectJSON = (json) => {
  const project = JSON.parse(json);
  const patches = R.pipe(
    getPatches,
    R.values,
    R.reduce((p, patch) => R.assoc(patch.id, { past: [], present: patch, future: [] }, p), {})
  )(project);
  const projectToLoad = R.assoc('patches', patches, project);

  return projectToLoad;
};

export const getMeta = R.pipe(
  getProject,
  R.prop('meta')
);

/*
  Counter selectors
*/
export const getLastPatchId = R.pipe(
  getProject,
  R.view(R.lensPath([
    'counter',
    'patches',
  ]))
);

export const getLastFolderId = R.pipe(
  getProject,
  R.view(R.lensPath([
    'counter',
    'folders',
  ]))
);

export const getLastNodeId = R.pipe(
  getProject,
  R.view(R.lensPath([
    'counter',
    'nodes',
  ]))
);

export const getLastPinId = R.pipe(
  getProject,
  R.view(R.lensPath([
    'counter',
    'pins',
  ]))
);

export const getLastLinkId = R.pipe(
  getProject,
  R.view(R.lensPath([
    'counter',
    'links',
  ]))
);

export const getLastNodeTypeId = R.pipe(
  getProject,
  R.view(R.lensPath([
    'counter',
    'nodeTypes',
  ]))
);

/*
  NodeType selectors
*/

export const getNodeTypes = R.pipe(
  getProject,
  R.prop('nodeTypes')
);

export const getNodeTypeById = R.curry((state, id) => R.pipe(
  getNodeTypes,
  R.prop(id)
)(state));

/*
  Node selectors
*/

export const getNodes = (state, patchId) => {
  const patch = getPatchById(state, patchId) || getCurrentPatch(state);
  return R.prop('nodes')(patch);
};

export const getNodesByPatchId = (patchId, state) => R.pipe(
  getProject,
  R.path(['patches', patchId, 'present']),
  R.prop('nodes')
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
  getNodeTypes,
  R.mapObjIndexed(R.prop('pins')),
  R.flatten
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

const getPinsWidth = R.curry((withMargins, count) => {
  const marginCount = (withMargins) ? count + 1 : count - 1;
  return (marginCount * SIZES.PIN.margin) + (count * SIZES.PIN.radius * 2);
});

const getGroupedPinsWidth = R.pipe(
  R.values,
  R.groupBy(R.prop('direction')),
  R.mapObjIndexed(R.compose(getPinsWidth(true), R.length))
);

const getNodeWidth = R.pipe(
  R.values,
  R.append(SIZES.NODE.minWidth),
  R.reduce(R.max, -Infinity)
);

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
        getPinsWidth(false, groups[dir].length),
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

/*
  Link selectors
*/

export const getLinks = (state, patchId) => {
  const patch = getPatchById(state, patchId) || getCurrentPatch(state);
  return R.prop('links')(patch);
};

export const getLinkById = (state, props) => R.pipe(
  getLinks,
  R.filter((link) => link.id === props.id),
  R.values,
  R.head
)(state, props);

export const getLinksByPinIdInPatch = (state, props) => {
  const patchId = R.prop('patchId', props);
  if (!patchId) { return {}; }

  return R.pipe(
    R.view(R.lensPath(['patches', patchId, 'present', 'links'])),
    R.filter(
      (link) => (
        props.pinIds.indexOf(link.pins[0]) !== -1 ||
        props.pinIds.indexOf(link.pins[1]) !== -1
      )
    )
  )(state);
};

/*
  Folders
*/
export const getFolders = R.pipe(
  getProject,
  R.prop('folders')
);
export const getFoldersByFolderId = (state, folderId) => R.pipe(
  getFolders,
  R.values,
  R.filter(R.propEq('parentId', folderId))
)(state);

/*
  Tree view (get / parse)
*/
export const getFoldersPath = (folders, folderId) => {
  if (!folderId) { return []; }
  const folder = folders[folderId];
  const parentPath = getFoldersPath(folders, folder.parentId);
  return R.concat([folderId], parentPath);
};

export const getTreeView = (state) => {
  const makeTree = (folders, patches, parentId, curPatchPath) => {
    const path = curPatchPath || [];
    const foldersAtLevel = R.pipe(
      R.values,
      R.filter(R.propEq('parentId', parentId))
    )(folders);
    const patchesAtLevel = R.pipe(
      R.values,
      R.map(R.prop('present')),
      R.filter(R.propEq('folderId', parentId))
    )(patches);

    return R.concat(
      R.map(
        folder => ({
          id: folder.id,
          module: folder.name,
          collapsed: (path.indexOf(folder.id) === -1),
          children: makeTree(folders, patches, folder.id),
        }),
        foldersAtLevel
      ),
      R.map(
        patch => ({
          id: patch.id,
          module: patch.name,
          leaf: true,
        }),
        patchesAtLevel
      )
    );
  };

  const folders = getFolders(state);
  const patches = getPatches(state);
  const curPatch = getCurrentPatch(state);
  const curPatchPath = getFoldersPath(folders, curPatch.folderId);
  const projectChildren = makeTree(folders, patches, null, curPatchPath);


  return {
    module: 'Project',
    collapsed: false,
    children: projectChildren,
  };
};

export const parseTreeView = (tree) => {
  const resultShape = {
    folders: [],
    patches: [],
  };
  const parseTree = (treePart, parentId) => {
    const partResult = R.clone(resultShape);
    if (treePart.leaf) {
      return R.assoc('patches', R.append({
        id: treePart.id,
        folderId: parentId,
      }, partResult.patches), partResult);
    }

    if (treePart.id) {
      partResult.folders = R.append({
        id: treePart.id,
        parentId,
      }, partResult.folders);
    }

    if (treePart.children && treePart.children.length > 0) {
      R.pipe(
        R.values,
        R.forEach(child => {
          const chilParentId = treePart.id || null;
          const childResult = parseTree(child, chilParentId);
          partResult.folders = R.concat(partResult.folders, childResult.folders);
          partResult.patches = R.concat(partResult.patches, childResult.patches);
        })
      )(treePart.children);
    }

    return partResult;
  };

  return parseTree(tree, null);
};

export const getTreeChanges = (oldTree, newTree) => {
  const oldTreeParsed = parseTreeView(oldTree);
  const newTreeParsed = parseTreeView(newTree);
  const result = {
    folders: [],
    patches: [],
    changed: false,
  };

  const sortById = R.sortBy(R.prop('id'));

  oldTreeParsed.folders = sortById(oldTreeParsed.folders);
  newTreeParsed.folders = sortById(newTreeParsed.folders);
  newTreeParsed.folders.forEach(
    (newFolder, i) => {
      if (
        newFolder.id !== oldTreeParsed.folders[i].id ||
        newFolder.parentId !== oldTreeParsed.folders[i].parentId
      ) {
        result.folders.push(newFolder);
      }
    }
  );

  oldTreeParsed.patches = sortById(oldTreeParsed.patches);
  newTreeParsed.patches = sortById(newTreeParsed.patches);
  newTreeParsed.patches.forEach(
    (newPatch, i) => {
      if (
        newPatch.id !== oldTreeParsed.patches[i].id ||
        newPatch.folderId !== oldTreeParsed.patches[i].folderId
      ) {
        result.patches.push(newPatch);
      }
    }
  );

  if (result.folders.length > 0 || result.patches.length > 0) {
    result.changed = true;
  }

  return result;
};

const filterPatchNode = R.filter(R.propEq('category', NODE_CATEGORY.IO));

export const getPatchIOPin = (node, i) => {
  const pin = R.values(node.pins)[0];
  const invertDirection = R.ifElse(
    R.equals(PIN_DIRECTION.INPUT),
    () => PIN_DIRECTION.OUTPUT,
    () => PIN_DIRECTION.INPUT
  );
  const dir = invertDirection(pin.direction);

  return {
    nodeId: node.id,
    label: node.properties.label,
    key: `${dir}_${node.id}`,
    direction: dir,
    type: pin.type,
    index: i,
  };
};

export const getPatchIO = R.pipe(
  R.prop('nodes'),
  R.values,
  filterPatchNode,
  R.groupBy(R.compose(R.prop('direction'), R.prop(0), R.values, R.prop('pins'))),
  R.mapObjIndexed(R.pipe(
    R.mapObjIndexed(getPatchIOPin),
    R.values
  )),
  R.values,
  R.merge([[], []]),
  R.values,
  R.apply(R.concat),
  R.values
);

export const getPatchNode = R.curry((state, patch) => {
  const extendNodes = R.map(
    node => R.compose(
      R.flip(R.merge)(node),
      getNodeTypeById(state),
      R.prop('typeId')
    )(node)
  );

  const isItPatchNode = R.pipe(
    R.prop('nodes'),
    R.values,
    filterPatchNode,
    R.length,
    R.flip(R.gt)(0)
  );

  const assocNodes = p => R.assoc('nodes', extendNodes(R.prop('nodes', p)), p);
  const assocFlag = p => R.assoc('isPatchNode', isItPatchNode(p), p);
  const assocIO = p => R.assoc('io', getPatchIO(p), p);

  return R.pipe(
    assocNodes,
    assocFlag,
    assocIO
  )(patch);
});

export const getPatchNodes = state => R.pipe(
  getPatches,
  R.map(patch =>
    R.pipe(
      R.propOr(patch, 'present'),
      getPatchNode(state)
    )(patch)
  ),
  R.pickBy(R.propEq('isPatchNode', true))
)(state);

export const getPreparedNodeTypes = state => {
  const patchNodes = getPatchNodes(state);
  const patchNodeTypes = R.pipe(
    R.values,
    R.map(
      patch => ({
        key: `${getUserName()}/${patch.name}`,
        patchId: patch.id,
        label: patch.name,
        category: NODE_CATEGORY.PATCHES,
        properties: {},
        pins: R.pipe(R.values, R.indexBy(R.prop('key')))(patch.io),
      })
    ),
    R.indexBy(R.prop('key'))
  )(patchNodes);

  return R.pipe(
    getNodeTypes,
    R.flip(R.merge)(patchNodeTypes)
  )(state);
};

export const getPreparedNodeTypeByKey = (state, key) => R.pipe(
  getPreparedNodeTypes,
  R.prop(key)
)(state);

const addPinRadius = (position) => ({
  x: position.x + SIZES.PIN.radius,
  y: position.y + SIZES.PIN.radius,
});

const getNodeLabel = (state, node) => {
  const nodeType = getPreparedNodeTypeByKey(state, node.typeId);
  let nodeLabel = node.label || nodeType.label || nodeType.key;

  const nodeValue = R.view(R.lensPath(['properties', 'value']), node);
  if (nodeValue !== undefined) {
    const nodeValueType = nodeType.properties.value.type;
    nodeLabel = nodeValue;
    if (nodeValue === '' && nodeValueType === PROPERTY_TYPE.STRING) {
      nodeLabel = '<EmptyString>';
    }
  }

  nodeLabel = R.pathOr(nodeLabel, ['properties', 'label'], node);

  return String(nodeLabel);
};
const getNodePins = (state, typeId) => R.pipe(
  getPreparedNodeTypes,
  R.pickBy(R.propEq('key', typeId)),
  R.values,
  R.map(R.prop('pins')),
  R.head
)(state);

export const preparePins = (state, node) => {
  const pins = getNodePins(state, node.typeId);
  const linkingPin = getLinkingPin(state);

  return R.map(pin => {
    const originalPin = pins[pin.key];
    const pinPosition = getPinPosition(pins, pin.key, node.position);
    const radius = { radius: SIZES.PIN.radius };
    const isSelected = {
      isSelected: (
        linkingPin &&
        linkingPin.nodeId === node.id &&
        linkingPin.pinKey === pin.key
      ),
    };
    return R.mergeAll([pin, originalPin, pinPosition, radius, isSelected]);
  })(pins);
};

export const getPreparedNodes = (state) => {
  const nodes = getNodes(state);

  return R.pipe(
    R.values,
    R.map((node) => {
      const label = getNodeLabel(state, node);
      const nodePins = preparePins(state, node);
      const pinsWidth = getGroupedPinsWidth(nodePins);
      const nodeWidth = getNodeWidth(pinsWidth);
      const isSelected = isNodeSelected(state, node.id);

      return R.merge(node, {
        label,
        pins: nodePins,
        width: nodeWidth,
        isSelected,
      });
    }),
    arr2obj
  )(nodes);
};

export const getPreparedLinks = (state) => {
  const nodes = getPreparedNodes(state);
  const links = getLinks(state);

  return R.mapObjIndexed((link) => {
    const pins = R.map(data => R.merge(data, nodes[data.nodeId].pins[data.pinKey]), link.pins);

    return R.merge(
      link,
      {
        from: addPinRadius(pins[0].position) || null,
        to: addPinRadius(pins[1].position) || null,
        isSelected: isLinkSelected(state, link.id),
      }
    );
  })(links);
};

export const validateLink = (state, linkData) => {
  const nodes = getPreparedNodes(state);
  const pins = getAllPinsFromNodes(nodes);
  const linksState = getLinks(state);

  const eqProps = (data) => R.both(
    R.propEq('nodeId', data.nodeId),
    R.propEq('key', data.pinKey)
  );
  const findPin = R.compose(
    R.flip(R.find)(pins),
    eqProps
  );


  const fromPin = findPin(linkData[0]);
  const toPin = findPin(linkData[1]);

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

export const getNodeGhost = (state) => {
  const nodeTypeId = getSelectedNodeType(state);
  const isCreatingMode = getModeChecks(state).isCreatingNode;

  if (!(isCreatingMode && nodeTypeId)) {
    return null;
  }
  const nodePosition = { x: 0, y: 0 };
  const nodeType = getPreparedNodeTypeByKey(state, nodeTypeId);
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

export const getLinkGhost = (state) => {
  const fromPin = getLinkingPin(state);
  if (!fromPin) { return null; }

  const nodes = getPreparedNodes(state);
  const node = nodes[fromPin.nodeId];
  const pin = node.pins[fromPin.pinKey];

  return {
    id: -1,
    pins: [pin],
    from: addPinRadius(pin.position),
    to: { x: 0, y: 0 },
  };
};

export const getLinksToDeleteWithNode = (projectState, nodeId, patchId) => R.pipe(
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

const getPinKeyByNodeId = (nodeId, patch) => R.pipe(
  R.prop('io'),
  R.find(
    R.propEq('nodeId', nodeId)
  ),
  R.propOr(null, 'key')
)(patch);

export const getNodeTypeToDeleteWithNode = (projectState, nodeId, patchId) => {
  const nodes = getNodes(projectState, patchId);
  const node = findById(nodeId, nodes);
  const nodeTypes = getPreparedNodeTypes(projectState);
  const nodeType = findByKey(node.typeId, nodeTypes);
  const isIO = (nodeType.category === NODE_CATEGORY.IO);

  let nodeTypeToDelete = null;
  let nodeTypeToDeleteError = false;

  if (isIO) {
    const patchNodes = getPatchNodes(projectState);
    const patch = patchNodes[patchId];
    const ioNodes = patch.io.length;
    const patchNodeType = (isIO) ? findByPatchId(patchId, nodeTypes) : null;
    const patchNode = findByNodeTypeId(patchNodeType.key, nodes);

    if (ioNodes === 1) {
      // This is last IO node! It will remove whole PatchNode.
      nodeTypeToDelete = patchNodeType.key;
    }

    if (patchNode) {
      // Get links and check for pins usage
      const pinKey = getPinKeyByNodeId(node.id, patch);
      const links = getLinks(projectState, patchId);
      const patchNodeLinks = R.pipe(
        R.values,
        R.filter(
          link => (
            (link.pins[0].nodeId === patchNode.id && link.pins[0].pinKey === pinKey) ||
            (link.pins[1].nodeId === patchNode.id && link.pins[1].pinKey === pinKey)
          )
        ),
        R.length
      )(links);

      if (patchNodeLinks > 0) {
        // This pin have links
        nodeTypeToDeleteError = NODETYPE_ERRORS.CANT_DELETE_USED_PIN_OF_PATCHNODE;
      } else if (ioNodes === 1) {
        // This patch node is used somewhere!
        nodeTypeToDeleteError = NODETYPE_ERRORS.CANT_DELETE_USED_PATCHNODE;
      }
    }
  }

  return {
    key: nodeTypeToDelete,
    error: nodeTypeToDeleteError,
  };
};

