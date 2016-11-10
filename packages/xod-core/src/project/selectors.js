import R from 'ramda';

import {
  PIN_DIRECTION,
  PROPERTY_TYPE,
  SIZE,
  NODE_CATEGORY,
  NODETYPE_ERRORS,
  LINK_ERRORS,
} from './constants';

import { deepMerge, isLocalID, localID } from '../utils';

export const getUserName = R.always('Bob');

/*
  Common utils
*/
export const indexById = R.indexBy(R.prop('id'));
const findByProp = (propName, propVal, from) => R.pipe(
  R.values,
  R.find(R.propEq(propName, propVal))
)(from);

const findById = (id, from) => findByProp('id', id, from);
const findByNodeTypeId = (id, from) => findByProp('typeId', id, from);

const getProjectState = (state, path) => {
  if (path.length > 0 && R.has(path[0], state)) {
    return getProjectState(
      R.prop(path.shift(), state),
      path
    );
  }
  return state;
};

export const getProject = state => R.propOr(state, 'project', state);

const getPatchStatic = patch => R.propOr(patch, 'static', patch);
const getPatchPresent = patch => R.propOr(patch, 'present', patch);

export const getPatches = R.pipe(
  getProject,
  R.prop('patches'),
  R.mapObjIndexed(patch => R.merge(getPatchStatic(patch), getPatchPresent(patch)))
);

export const getPatchById = R.curry((id, projectState) =>
  R.pipe(
    getPatches,
    R.prop(id)
  )(projectState)
);

// :: patch -> id
export const getPatchId = R.compose(
  R.prop('id'),
  getPatchStatic
);

// :: id -> projectState -> patchStatic
export const getPatchStaticById = id => R.compose(
  getPatchStatic,
  getPatchById(id)
);

// :: id -> projectState -> patchPresent
export const getPatchPresentById = id => R.compose(
  getPatchPresent,
  getPatchById(id)
);

export const getPatchesByFolderId = (state, folderId) => R.pipe(
  getPatches,
  R.values,
  R.filter(R.propEq('folderId', folderId))
)(state);

const getPatchByEntityId = (projectState, id, entityBranch) => R.pipe(
  R.prop('patches'),
  R.values,
  R.find(
    R.pipe(
      getPatchPresent,
      R.prop(entityBranch),
      R.has(id)
    )
  )
)(projectState);

export const getPatchByNodeId = (projectState, nodeId) =>
  getPatchByEntityId(projectState, nodeId, 'nodes');

export const getPatchByLinkId = (projectState, linkId) =>
  getPatchByEntityId(projectState, linkId, 'links');

export const getPatchName = (projectState, patchId) => R.compose(
  R.prop('label'),
  getPatchStaticById(patchId)
)(projectState);

export const doesPinHaveLinks = (pin, links) => R.pipe(
  R.values,
  R.filter(link => (
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

export const getAllPinsFromNodes = R.pipe(
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

export const validatePatches = () => R.pipe(
  R.values,
  R.all(
    R.allPass([
      R.has('id'),
      R.has('label'),
      R.has('nodes'),
      R.has('links'),
    ])
  )
);

export const isPatchesUpdated = (newPatches, oldPatches) => (
  !R.equals(R.keys(newPatches), R.keys(oldPatches))
);

export const validateProject = project => (
  typeof project === 'object' &&
  R.allPass([
    R.has('patches'),
    R.has('nodeTypes'),
    R.has('meta'),
  ], project) &&
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
    R.reduce((p, patch) => R.assoc(getPatchId(patch), patch, p), {})
  )(project);
  const projectToLoad = R.assoc('patches', patches, project);
  return projectToLoad;
};

export const getMeta = R.pipe(
  getProject,
  R.prop('meta')
);

export const getName = R.prop('name');
export const getId = R.prop('id');

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

export const getNodes = R.curry((patchId, state) => R.compose(
  R.prop('nodes'),
  getPatchById(patchId)
)(state));

/*
  Pin selectors
*/

const getVerticalPinOffsets = () => ({
  [PIN_DIRECTION.INPUT]: -1 * SIZE.NODE.padding.y,
  [PIN_DIRECTION.OUTPUT]: SIZE.NODE.padding.y - (SIZE.PIN.radius * 2),
});

const getPinsWidth = R.curry((withMargins, count) => {
  const marginCount = (withMargins) ? count + 1 : count - 1;
  return (marginCount * SIZE.PIN.margin) + (count * SIZE.PIN.radius * 2);
});

export const getGroupedPinsWidth = R.pipe(
  R.values,
  R.groupBy(R.prop('direction')),
  R.mapObjIndexed(R.compose(getPinsWidth(true), R.length))
);

export const getNodeWidth = R.pipe(
  R.values,
  R.append(SIZE.NODE.minWidth),
  R.reduce(R.max, -Infinity)
);

export const getPinPosition = (nodeTypePins, key, nodePosition) => {
  const originalPin = nodeTypePins[key];
  const direction = originalPin.direction;

  const groups = R.pipe(
    R.values,
    R.groupBy(nPin => nPin.direction)
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
    (-1 * groupCenter) +
    (pinIndex * SIZE.PIN.radius * 2) +
    (pinIndex * SIZE.PIN.margin)
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

export const getLinks = (state, patchId) => R.compose(
  R.prop('links'),
  getPatchById(patchId)
)(state);

export const getLinkById = (state, props) => R.pipe(
  getLinks,
  R.filter(link => link.id === props.id),
  R.values,
  R.head
)(state, props);

export const getLinksByPinIdInPatch = (state, props) => {
  const patchId = R.prop('patchId', props);
  if (!patchId) { return {}; }

  return R.pipe(
    R.view(R.lensPath(['patches', patchId, 'present', 'links'])),
    R.filter(
      link => (
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

// :: id -> folders -> folder
export const getFolderById = R.pick;

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

// :: foldersPath -> folders -> 'folder/childFolder/'
export const getPath = (foldersPath, folders) => {
  const folderIds = R.reverse(foldersPath);
  const folderNames = R.map(
    R.pipe(
      R.prop(R.__, folders),
      R.prop('name')
    ),
    folderIds
  );

  return R.join('/', folderNames);
};

export const getTreeView = (state, patchId) => {
  const makeTree = (folders, patches, parentId, curPatchPath) => {
    const path = curPatchPath || [];
    const foldersAtLevel = R.pipe(
      R.values,
      R.filter(R.propEq('parentId', parentId))
    )(folders);
    const patchesAtLevel = R.pipe(
      R.values,
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
          id: getPatchId(patch),
          module: patch.label,
          leaf: true,
        }),
        patchesAtLevel
      )
    );
  };

  const folders = getFolders(state);
  const patches = getPatches(state);
  const curPatchStatic = getPatchStaticById(patchId, state);
  const curPatchPath = getFoldersPath(folders, curPatchStatic.folderId);
  const projectChildren = makeTree(folders, patches, null, curPatchPath);
  const projectName = R.pipe(
    getMeta,
    getName
  )(state);

  return {
    id: 0,
    module: projectName,
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
        R.forEach((child) => {
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
    R.always(PIN_DIRECTION.OUTPUT),
    R.always(PIN_DIRECTION.INPUT)
  );
  const dir = invertDirection(pin.direction);

  return {
    key: node.id,
    nodeId: node.id,
    pinLabel: node.properties.pinLabel,
    label: node.properties.label,
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
      R.flip(deepMerge)(node),
      R.omit(['id']),
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
  R.map(getPatchNode(state)),
  R.pickBy(R.propEq('isPatchNode', true))
)(state);

const getPatchNodePath = R.curry(
  (patch, project) => {
    const folders = getFolders(project);
    const patchFolders = getFoldersPath(folders, patch.folderId);
    const folderPath = getPath(patchFolders, folders);
    const patchLabel = R.prop('label', patch);

    return localID(`${folderPath}${folderPath ? '/' : ''}${patchLabel}`);
  }
);

export const dereferencedNodeTypes = (state) => {
  const patchNodes = getPatchNodes(state);
  const patchNodeTypes = R.pipe(
    R.values,
    R.map(
      patch => ({
        id: getPatchId(patch),
        patchNode: true,
        label: R.prop('label', patch),
        path: getPatchNodePath(patch, state),
        category: NODE_CATEGORY.PATCHES,
        properties: {},
        pins: R.pipe(
          R.values,
          R.indexBy(R.prop('key'))
        )(patch.io),
      })
    ),
    R.indexBy(R.prop('id'))
  )(patchNodes);

  return R.pipe(
    getNodeTypes,
    R.flip(R.merge)(patchNodeTypes)
  )(state);
};

export const getPreparedNodeTypeById = (state, typeId) => R.pipe(
  dereferencedNodeTypes,
  R.prop(typeId)
)(state);

export const addPinRadius = position => ({
  x: position.x + SIZE.PIN.radius,
  y: position.y + SIZE.PIN.radius,
});

export const getNodeLabel = (state, node) => {
  const nodeType = getPreparedNodeTypeById(state, node.typeId);
  let nodeLabel = node.label ||
                  nodeType.label ||
                  nodeType.id;

  const nodeValue = R.view(R.lensPath(['properties', 'value']), node);
  if (nodeValue !== undefined) {
    const nodeValueType = nodeType.properties.value.type;
    nodeLabel = nodeValue;
    if (nodeValue === '' && nodeValueType === PROPERTY_TYPE.STRING) {
      nodeLabel = '<EmptyString>';
    }
  }

  let nodeCustomLabel = R.path(['properties', 'label'], node);
  if (nodeCustomLabel === '') { nodeCustomLabel = null; }

  nodeLabel = nodeCustomLabel || nodeLabel;

  return String(nodeLabel);
};
const getNodePins = (state, typeId) => R.pipe(
  dereferencedNodeTypes,
  R.pickBy(R.propEq('id', typeId)),
  R.values,
  R.map(R.prop('pins')),
  R.head
)(state);

export const preparePins = (projectState, node) => {
  const pins = getNodePins(projectState, node.typeId);

  return R.map((pin) => {
    const originalPin = R.path(['pins', pin.key], node) || {};
    const pinPosition = getPinPosition(pins, pin.key, node.position);
    const radius = { radius: SIZE.PIN.radius };
    const isSelected = { isSelected: false };
    const defaultPin = { value: null, injected: false };
    return R.mergeAll([defaultPin, pin, originalPin, pinPosition, radius, isSelected]);
  })(pins);
};

export const dereferencedNodes = (projectState, patchId) =>
  R.pipe(
    getNodes(patchId),
    R.map((node) => {
      const label = getNodeLabel(projectState, node);
      const nodePins = preparePins(projectState, node);
      const pinsWidth = getGroupedPinsWidth(nodePins);
      const nodeWidth = getNodeWidth(pinsWidth);

      return R.merge(node, {
        label,
        pins: nodePins,
        width: nodeWidth,
      });
    })
  )(projectState);

export const dereferencedLinks = (projectState, patchId) => {
  const nodes = dereferencedNodes(projectState, patchId);
  const links = getLinks(projectState, patchId);

  return R.mapObjIndexed((link) => {
    const pins = R.map(data => R.merge(data, nodes[data.nodeId].pins[data.pinKey]), link.pins);
    return R.merge(
      link,
      {
        from: addPinRadius(pins[0].position) || null,
        to: addPinRadius(pins[1].position) || null,
      }
    );
  })(links);
};

export const getLinksConnectedWithPin = (projectState, nodeId, pinKey, patchId) => R.pipe(
  R.values,
  R.filter(
    R.pipe(
      R.prop('pins'),
      R.find(
        R.allPass([
          R.propEq('nodeId', nodeId),
          R.propEq('pinKey', pinKey),
        ])
      )
    )
  ),
  R.map(
    R.pipe(
      R.prop('id'),
      R.toString
    )
  )
)(getLinks(projectState, patchId));

export const getLinksConnectedWithNode = (projectState, nodeId, patchId) => R.pipe(
  R.values,
  R.filter(
    R.pipe(
      R.prop('pins'),
      R.find(R.propEq('nodeId', nodeId))
    )
  ),
  R.map(R.prop('id'))
)(getLinks(projectState, patchId));

const getPinKeyByNodeId = (nodeId, patch) => R.pipe(
  R.prop('io'),
  R.find(
    R.propEq('nodeId', nodeId)
  ),
  R.propOr(null, 'key')
)(patch);

export const getNodeTypeToDeleteWithNode = (projectState, nodeId, patchId) => {
  const nodes = getNodes(patchId, projectState);
  const node = findById(nodeId, nodes);
  const nodeTypes = dereferencedNodeTypes(projectState);
  const nodeType = findById(node.typeId, nodeTypes);
  const isIO = (nodeType.category === NODE_CATEGORY.IO);

  let nodeTypeToDelete = null;
  let nodeTypeToDeleteError = false;

  if (isIO) {
    const patchNodes = getPatchNodes(projectState);
    const patch = patchNodes[patchId];
    const ioNodes = patch.io.length;
    const patchNodeType = findById(patchId, nodeTypes);
    const patchNode = findByNodeTypeId(patchNodeType.id, nodes);

    if (ioNodes === 1) {
      // This is last IO node! It will remove whole PatchNode.
      nodeTypeToDelete = patchNodeType.id;
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
    id: nodeTypeToDelete,
    error: nodeTypeToDeleteError,
  };
};

const pinComparator = data => R.both(
  R.propEq('nodeId', data.nodeId),
  R.propEq('key', data.pinKey)
);
const findPin = pins => R.compose(
  R.flip(R.find)(pins),
  pinComparator
);

const pinIsInjected = pin => !!pin.injected;

export const validateLink = (state, linkData) => {
  const project = getProject(state);
  const patch = getPatchByNodeId(project, linkData[0].nodeId);
  const patchId = getPatchStatic(patch).id;

  const nodes = dereferencedNodes(project, patchId);
  const pins = getAllPinsFromNodes(nodes);
  const linksState = getLinks(project, patchId);

  const getPin = findPin(pins);

  const pin1 = getPin(linkData[0]);
  const pin2 = getPin(linkData[1]);

  const sameDirection = pin1.direction === pin2.direction;
  const sameNode = pin1.nodeId === pin2.nodeId;
  const allPinsEjected = !pinIsInjected(pin1) && !pinIsInjected(pin2);
  const pin1CanHaveMoreLinks = canPinHaveMoreLinks(pin1, linksState);
  const pin2CanHaveMoreLinks = canPinHaveMoreLinks(pin2, linksState);

  const check = (
    !sameDirection &&
    !sameNode &&
    allPinsEjected &&
    pin1CanHaveMoreLinks &&
    pin2CanHaveMoreLinks
  );

  let error = null;

  if (!check) {
    if (sameDirection) {
      error = LINK_ERRORS.SAME_DIRECTION;
    } else if (sameNode) {
      error = LINK_ERRORS.SAME_NODE;
    } else if (!pin1CanHaveMoreLinks || !pin2CanHaveMoreLinks) {
      error = LINK_ERRORS.ONE_LINK_FOR_INPUT_PIN;
    } else if (!allPinsEjected) {
      error = LINK_ERRORS.PROP_CANT_HAVE_LINKS;
    } else {
      error = LINK_ERRORS.UNKNOWN_ERROR;
    }
  }

  return error;
};

export const validatePin = (state, pin) => {
  const project = getProject(state);
  const patch = getPatchByNodeId(project, pin.nodeId);
  const patchId = getPatchId(patch);
  const nodes = dereferencedNodes(project, patchId);
  const linksState = getLinks(project, patchId);
  const pins = getAllPinsFromNodes(nodes);

  const getPin = findPin(pins);
  const pinData = getPin(pin);

  const pinCanHaveMoreLinks = canPinHaveMoreLinks(pinData, linksState);
  const pinEjected = !pinIsInjected(pinData);

  const check = (
    pinCanHaveMoreLinks &&
    pinEjected
  );

  let error = null;

  if (!check) {
    if (!pinCanHaveMoreLinks) {
      error = LINK_ERRORS.ONE_LINK_FOR_INPUT_PIN;
    } else
    if (!pinEjected) {
      error = LINK_ERRORS.PROP_CANT_HAVE_LINKS;
    } else {
      error = LINK_ERRORS.UNKNOWN_ERROR;
    }
  }

  return error;
};

export const getProjectPojo = (state) => {
  const project = getProject(state);
  const patches = R.pipe(
    getPatches,
    R.values,
    indexById
  )(project);

  return R.pipe(
    R.assoc('patches', patches),
    R.assoc('nodeTypes', dereferencedNodeTypes(state)),
    R.omit(['counter'])
  )(project);
};

const prettyJSON = data => JSON.stringify(data, undefined, 2);

export const getProjectJSON = R.compose(
  prettyJSON,
  getProjectPojo
);
