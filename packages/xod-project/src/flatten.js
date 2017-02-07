import R from 'ramda';
import { Maybe, Either } from 'ramda-fantasy';

import * as CONST from './constants';
import * as Project from './project';
import * as Patch from './patch';
import * as Pin from './pin';
import * as Node from './node';
import * as Link from './link';
import { explode, getCastPatchPath } from './utils';
import { err, errOnNothing } from './func-tools';

const terminalRegExp = /^xod\/core\/(input|output)/;
// :: String -> Pin[]
const getTerminalPins = type => ([
  { key: '__in__', type, direction: CONST.PIN_DIRECTION.INPUT },
  { key: '__out__', type, direction: CONST.PIN_DIRECTION.OUTPUT },
]);
// :: String -> String
const getTerminalType = type => `terminal${type}`;
// :: String -> String
const convertTerminalPath = R.compose(
  getTerminalType,
  R.replace(terminalRegExp, '')
);
// :: Node[] -> Node[]
const filterTerminalNodes = R.filter(R.compose(
  R.test(/^terminal/),
  Node.getNodeType
));
// :: Node[] -> Link[] -> Link[]
const filterTerminalLinks = R.curry((nodes, links) => R.map(
  (node) => {
    const nodeId = Node.getNodeId(node);
    const eqNodeId = R.equals(nodeId);
    return R.filter(R.either(
      R.compose(eqNodeId, Link.getLinkInputNodeId),
      R.compose(eqNodeId, Link.getLinkOutputNodeId)
    ), links);
  },
  nodes
));

// :: Applicative f => f a -> [(a -> Applicative a)] -> f a
const reduceChainOver = R.reduce(R.flip(R.chain));

// :: Project -> String -> Patch
const getPatchByPath = R.curry((project, nodeType) => R.compose(
  explode,
  Project.getPatchByPath(R.__, project)
)(nodeType));

// :: String[] -> Patch -> Boolean
const isLeafPatchWithImpls = impls => R.either(
  Patch.hasImpl(impls),
  Patch.isTerminalPatch
);

// :: String[] -> Patch -> Boolean
const isLeafPatchWithoutImpls = impls => R.both(
  R.complement(Patch.hasImpl(impls)),
  R.compose(
    R.equals(0),
    R.length,
    Patch.listNodes
  )
);

// :: Patch -> Path -> Either.Right [Path, Patch]
const extendTerminalPins = R.curry((patch, path) => R.ifElse(
  Patch.isTerminalPatch,
  R.compose(
    R.concat([convertTerminalPath(path)]),
    R.of,
    R.unnest,
    reduceChainOver(Maybe.of(patch)),
    R.map(Patch.assocPin),
    getTerminalPins,
    Pin.getPinType,
    R.head,
    Patch.listPins
  ),
  R.always([path, patch])
)(patch));

// :: extractLeafPatches -> String[] -> Project -> Node -> [Path, Patch, ...]
const extractLeafPatchRecursive = R.curry((recursiveFn, impls, project, node) => R.compose(
  path => R.compose(
    R.chain(recursiveFn(impls, project, path)),
    Project.getPatchByPath(R.__, project)
  )(path),
  Node.getNodeType
)(node));

// :: String[] -> Project -> Path -> [Either Error [Path, Patch]]
const extractLeafPatches = R.curry((impls, project, path, patch) => R.ifElse(
  isLeafPatchWithImpls(impls),
  leafPatch => R.compose(
    Either.of,
    extendTerminalPins(R.__, path)
  )(leafPatch),
  R.ifElse(
    isLeafPatchWithoutImpls(impls),
    err(CONST.ERROR.IMPLEMENTATION_NOT_FOUND),
    R.compose(
      R.chain(extractLeafPatchRecursive(extractLeafPatches, impls, project)),
      Patch.listNodes
    )
  )
)(patch));

// :: String -> Node
const getNodeById = R.curry((patch, node) => R.compose(
  explode,
  Patch.getNodeById(R.__, patch)
)(node));

// :: String[] -> Node -> Boolean
const isLeafNode = R.curry((leafPatchPaths, node) => R.compose(
  R.either(
    R.contains(R.__, leafPatchPaths),
    R.test(terminalRegExp)
  ),
  Node.getNodeType
)(node));

// :: String[] -> Patch -> NodeId
const isNodeIdPointsToImplPatch = R.curry((leafPatchPaths, patch, nodeId) => R.compose(
  isLeafNode(leafPatchPaths),
  getNodeById(patch)
)(nodeId));

// :: String -> String -> String
const getPrefixedId = R.curry((prefix, id) => ((prefix) ? `${prefix}~${id}` : id));

// :: String -> Node -> Node
/**
 * [duplicateNodePrefixed description]
 * @type {[type]}
 */
const duplicateNodePrefixed = R.curry((prefix, node) => {
  const id = Node.getNodeId(node);
  const type = Node.getNodeType(node);
  const newType = R.when(
    R.test(terminalRegExp),
    convertTerminalPath
  )(type);
  const newId = getPrefixedId(prefix, id);
  return R.compose(
    R.assoc('id', newId),
    R.assoc('type', newType)
  )(node);
});

/**
 * See {@link flatten} docs (2.1)
 *
 * @private
 * @function extractNodesRecursive
 * @callback extractNodes
 * @param {Project} project
 * @param {Array<Path>} leafPatchPaths
 * @param {NodeId} parentNodeId
 * @param {Node} node
 * @returns {Array<Node>}
 */
const extractNodesRecursive = R.curry(
  (recursiveFn, project, leafPatchPaths, parentNodeId, node) => {
    const type = Node.getNodeType(node);
    const id = Node.getNodeId(node);
    const prefixedId = getPrefixedId(parentNodeId, id);
    const pinsPrefixed = R.compose(
      R.fromPairs,
      R.map(R.over(R.lensIndex(0), getPrefixedId(prefixedId))),
      R.toPairs,
      R.propOr({}, 'pins')
    )(node);
    const pinKeys = R.keys(pinsPrefixed);
    const isPinKeyExist = R.contains(R.__, pinKeys);
    const oldPatch = Project.getPatchByPath(type, project);

    return R.compose(
      R.map((newNode) => {
        const nodeId = Node.getNodeId(newNode);
        if (isPinKeyExist(nodeId)) {
          return R.assocPath(['pins', '__in__'], pinsPrefixed[nodeId], newNode);
        }
        return newNode;
      }),
      R.chain(recursiveFn(project, leafPatchPaths, prefixedId))
    )(oldPatch);
  }
);

/**
 * Get a flattened list of nodes.
 * If node is a leaf node — just return itself
 * with updated id (e.g. "parentNodeId~nodeId"),
 * else — extract nodes recursively.
 *
 * See {@link flatten} docs (2.1)
 *
 * @private
 * @function extractNodes
 * @param {Project} project
 * @param {Array<Path>} leafPatchPaths
 * @param {NodeId} parentNodeId
 * @param {Patch} patch
 * @returns {Array<Node>}
 */
const extractNodes = R.curry((project, leafPatchPaths, parentNodeId, patch) => R.compose(
  R.chain(R.ifElse(
      isLeafNode(leafPatchPaths),
      duplicateNodePrefixed(parentNodeId),
      extractNodesRecursive(extractNodes, project, leafPatchPaths, parentNodeId)
    )
  ),
  Patch.listNodes
)(patch));

// :: Link -> Boolean
const isLinkBetweenImplNodes = (leafPatchPaths, patch) => R.converge(
  R.and,
  [
    R.compose(isNodeIdPointsToImplPatch(leafPatchPaths, patch), Link.getLinkOutputNodeId),
    R.compose(isNodeIdPointsToImplPatch(leafPatchPaths, patch), Link.getLinkInputNodeId),
  ]
);

// :: String -> Link -> Link
const duplicateLinkPrefixed = R.curry((prefix, link) => {
  const id = Link.getLinkId(link);
  const outId = Link.getLinkOutputNodeId(link);
  const outKey = Link.getLinkOutputPinKey(link);
  const inId = Link.getLinkInputNodeId(link);
  const inKey = Link.getLinkInputPinKey(link);

  const newId = getPrefixedId(prefix, id);
  const newOutId = getPrefixedId(prefix, outId);
  const newInId = getPrefixedId(prefix, inId);

  return R.assoc('id', newId, Link.createLink(inKey, newInId, outKey, newOutId));
});

/**
 * See {@link flatten} docs (2.2)
 *
 * @private
 * @function extractLinksRecursive
 * @callback extractLinks
 * @param {Project} project
 * @param {Array<Path>} leafPatchPaths
 * @param {NodeId} parentNodeId
 * @param {Patch} patch
 * @param {Link} link
 * @returns {Array<Link>}
 */
const extractLinksRecursive = R.curry(
  (recursiveFn, project, leafPatchPaths, parentNodeId, patch, link) => {
    // TODO: Refactoring needed!
    const outNodeId = Link.getLinkOutputNodeId(link);
    const inNodeId = Link.getLinkInputNodeId(link);
    const outPinKey = Link.getLinkOutputPinKey(link);
    const inPinKey = Link.getLinkInputPinKey(link);

    const outNode = getNodeById(patch, outNodeId);
    const newOutNodeId = getPrefixedId(parentNodeId, outNodeId);

    const inNode = getNodeById(patch, inNodeId);
    const newInNodeId = getPrefixedId(parentNodeId, inNodeId);

    let newLink = Link.createLink();
    let inLinks = [];
    let outLinks = [];

    // input
    if (!isLeafNode(leafPatchPaths, inNode)) {
      const inNodeType = Node.getNodeType(inNode);
      const inPatch = getPatchByPath(project, inNodeType);
      inLinks = recursiveFn(project, leafPatchPaths, newInNodeId, inPatch);
      const inNodeIdWithPinKey = getPrefixedId(newInNodeId, inPinKey);

      newLink = newLink('__in__', inNodeIdWithPinKey);
    } else {
      newLink = newLink(inPinKey, inNodeId);
    }

    // output
    if (!isLeafNode(leafPatchPaths, outNode)) {
      const outNodeType = Node.getNodeType(outNode);
      const outPatch = getPatchByPath(project, outNodeType);
      outLinks = recursiveFn(project, leafPatchPaths, newOutNodeId, outPatch);
      const outNodeIdWithPinKey = getPrefixedId(newOutNodeId, outPinKey);

      newLink = newLink('__out__', outNodeIdWithPinKey);
    } else {
      newLink = newLink(outPinKey, outNodeId);
    }

    newLink = R.assoc('id', getPrefixedId(parentNodeId, Link.getLinkId(link)), newLink);

    return R.concat([newLink], R.concat(inLinks, outLinks));
  }
);

/**
 * Get a flattened list of links.
 * If link is between a leaf nodes — just return itself
 * with updated id (e.g. "parentNodeId~linkId"),
 * else — extract links recursively.
 *
 * See {@link flatten} docs (2.2)
 *
 * @private
 * @function extractLinks
 * @param {Project} project
 * @param {Array<Path>} leafPatchPaths
 * @param {NodeId} parentNodeId
 * @param {Patch} patch
 * @returns {Array<Link>}
 */
const extractLinks = R.curry((project, leafPatchPaths, parentNodeId, patch) => R.compose(
  R.uniqWith(R.eqBy(Link.getLinkId)),
  R.chain(R.ifElse(
    isLinkBetweenImplNodes(leafPatchPaths, patch),
    duplicateLinkPrefixed(parentNodeId),
    extractLinksRecursive(extractLinks, project, leafPatchPaths, parentNodeId, patch)
  )),
  Patch.listLinks
)(patch));

const getPinType = R.curry((patchTuples, nodes, idGetter, keyGetter, link) =>
  R.compose(
    Pin.getPinType,
    explode,
    R.converge(
      // = PinKey + Patch -> Pin
      Patch.getPinByKey,
      [
        // Link -> PinKey
        keyGetter,
        // Link -> NodeId -> Node -> NodeType -> Patch
        R.compose(
          R.prop(1),
          R.find(R.__, patchTuples),
          R.propEq(0),
          Node.getNodeType,
          R.find(R.__, nodes),
          R.propEq('id'),
          idGetter
        ),
      ]
    )
  )(link)
);

/**
 * Replace terminal node with casting node
 *
 * See {@link flatten} docs (2.3)
 *
 * @private
 * @function createCastNode
 * @param {Array<Array<Path, Patch>>} patchTuples
 * @param {Array<Node>} nodes
 * @param {Link} link
 * @returns {Node}
 */
const createCastNode = R.curry((patchTuples, nodes, link) => R.compose(
  R.chain(type => ({
    id: `${Link.getLinkOutputNodeId(link)}-to-${Link.getLinkInputNodeId(link)}`,
    type,
  })),
  // Link -> Maybe String
  R.converge(
    R.ifElse(
      R.equals,
      Maybe.Nothing,
      R.compose(Maybe.of, getCastPatchPath)
    ),
    [
      getPinType(patchTuples, nodes, Link.getLinkOutputNodeId, Link.getLinkOutputPinKey),
      getPinType(patchTuples, nodes, Link.getLinkInputNodeId, Link.getLinkInputPinKey),
    ]
  )
)(link));

/**
 * It replaces link with casting nodes and
 * new links, if needed. Otherwise it returns
 * the same link.
 *
 * See {@link flatten} docs (2.3)
 *
 * @private
 * @function splitLinkWithCastNode
 * @param {Array<Array<Path, Patch>>} patchTuples
 * @param {Array<Node>} nodes
 * @param {Link} link
 * @returns {Array<Node|Null, Array<Link>>}
 */
const splitLinkWithCastNode = R.curry((patchTuples, nodes, link) => {
  const castNode = createCastNode(patchTuples, nodes, link);

  if (Maybe.isNothing(castNode)) {
    return [null, [link]];
  }

  const origLinkId = Link.getLinkId(link);
  const fromNodeId = Link.getLinkOutputNodeId(link);
  const fromPinKey = Link.getLinkOutputPinKey(link);
  const toNodeId = Link.getLinkInputNodeId(link);
  const toPinKey = Link.getLinkInputPinKey(link);

  const toCastNode = R.assoc('id', `${origLinkId}-to-cast`,
    Link.createLink('__in__', castNode.id, fromPinKey, fromNodeId)
  );
  const fromCastNode = R.assoc('id', `${origLinkId}-from-cast`,
    Link.createLink(toPinKey, toNodeId, '__out__', castNode.id)
  );

  return [castNode, [toCastNode, fromCastNode]];
});

// :: String -> Link[] -> Link[]
const filterOutputLinksByNodeId = R.curry((nodeId, links) => R.filter(
  R.compose(
    R.equals(nodeId),
    Link.getLinkOutputNodeId
  ),
  links
));

// :: String -> Node[] -> Node
const findNodeByNodeId = R.curry((nodeId, nodes) => R.find(
  R.compose(
    R.equals(nodeId),
    Node.getNodeId
  ),
  nodes
));

// :: String[] -> Node[] -> Node[]
const rejectContainedNodeIds = R.curry((nodeIds, nodes) => R.reject(
  R.compose(
    R.contains(R.__, nodeIds),
    Node.getNodeId
  ),
  nodes
));

// :: Pins -> Nodes -> Link -> Node
const assocInjectedPinToNodeByLink = R.curry((pins, nodes, link) => R.compose(
    R.assoc('pins', pins),
    findNodeByNodeId(R.__, nodes),
    Link.getLinkInputNodeId
  )(link)
);

// :: Node[] -> Link[] -> Node[] -> Node[]
const passPinsFromTerminalNodes = R.curry((nodes, terminalLinks, terminalNodes) =>
  R.map(terminalNode =>
    R.compose(
      R.map(assocInjectedPinToNodeByLink(terminalNode.pins, nodes)),
      filterOutputLinksByNodeId(R.__, terminalLinks),
      Node.getNodeId
    )(terminalNode),
    terminalNodes
  )
);

// TODO: Refactoring needed
// :: [ Node[], Link[] ] -> [ Node[], Link[] ]
const removeTerminalsAndPassPins = ([nodes, links]) => {
  const terminalNodes = filterTerminalNodes(nodes);
  const terminalLinks = filterTerminalLinks(terminalNodes, links);

  const terminalNodesWithPins = R.filter(R.has('pins'), terminalNodes);
  const nodesWithPins = R.compose(
    R.flatten,
    passPinsFromTerminalNodes(nodes, R.flatten(terminalLinks))
  )(terminalNodesWithPins);
  const nodesWithPinsIds = R.map(Node.getNodeId, nodesWithPins);

  const terminalNodeIds = R.compose(R.pluck('id'), R.flatten)(terminalNodes);
  const oneOfTerminalNodeIds = R.contains(R.__, terminalNodeIds);

  const newNodes = R.compose(
    R.concat(R.__, nodesWithPins),
    rejectContainedNodeIds(nodesWithPinsIds),
    rejectContainedNodeIds(R.__, nodes),
    R.pluck('id'),
    R.flatten
  )(terminalNodes);

  const linkIdsToRemove = R.compose(
    R.pluck('id'),
    R.flatten
  )(terminalLinks);
  const linksWithoutTerminals = R.reject(
    R.compose(
      R.contains(R.__, linkIdsToRemove),
      Link.getLinkId
    ),
    links
  );

  const newLinks = R.compose(
    R.concat(linksWithoutTerminals),
    R.map((linkPair) => {
      const outputLink = R.find(
        R.compose(
          oneOfTerminalNodeIds,
          Link.getLinkInputNodeId
        ),
        linkPair
      );
      const inputLink = R.find(
        R.compose(
          oneOfTerminalNodeIds,
          Link.getLinkOutputNodeId
        ),
        linkPair
      );
      const linkId = Link.getLinkId(inputLink);
      const newLink = Link.createLink(
        Link.getLinkInputPinKey(inputLink),
        Link.getLinkInputNodeId(inputLink),
        Link.getLinkOutputPinKey(outputLink),
        Link.getLinkOutputNodeId(outputLink)
      );

      return R.assoc('id', linkId, newLink);
    }),
    R.filter(R.compose(R.gt(R.__, 1), R.length))
  )(terminalLinks);

  return [newNodes, newLinks];
};

/**
 * It replaces links with casting nodes and new links.
 *
 * See {@link flatten} docs (2.3)
 *
 * @private
 * @function createCastNodes
 * @param {Array<Array<Path, Patch>>} patchTuples
 * @param {Array<Node>} nodes
 * @param {Array<Link>} links
 * @returns {Array<Array<Node>, Array<Link>>}
 */
// :: [[Path, Patch]] -> Node[] -> Link[] -> [ Node[], Link[] ]
const createCastNodes = R.curry((patchTuples, nodes, links) => R.compose(
  removeTerminalsAndPassPins,
  R.converge(
    (newNodes, newLinks) => ([newNodes, newLinks]),
    [
      R.compose(R.concat(nodes), R.reject(R.isNil), R.pluck(0)),
      R.compose(R.flatten, R.pluck(1)),
    ]
  ),
  R.map(splitLinkWithCastNode(patchTuples, nodes))
)(links));

const castTypeRegExp = /^xod\/core\/cast-([a-zA-Z]+)-to-([a-zA-Z]+)$/;
// :: String -> Boolean
const testCastType = R.test(castTypeRegExp);

// :: Node[] -> String[]
const getCastNodeTypes = R.compose(
  R.filter(testCastType),
  R.map(Node.getNodeType)
);

// :: Project -> String -> Either Error Patch
const getPatchByPathOrError = R.curry((project, path) => R.compose(
  errOnNothing(CONST.ERROR.CAST_PATCH_NOT_FOUND),
  Project.getPatchByPath(R.__, project)
)(path));

// :: Project -> String[] -> [[Path, Patch]] -> [[Path, Patch]]
const addCastPatches = R.curry((project, castTypes, splittedLeafPatches) => R.compose(
  R.concat(splittedLeafPatches),
  R.map(
    R.converge(
      R.append,
      [
        R.compose(
          R.unnest,
          getPatchByPathOrError(project)
        ),
        R.of,
      ]
    )
  ),
  R.uniq
)(castTypes));

// :: [[Path, Patch]] -> [[Path, Patch]]
const removeTerminalPatches = R.reject(R.compose(
  R.test(/^terminal[a-zA-Z]+$/),
  R.prop(0)
));

// :: [Path, Patch | Either Left] -> (Project -> Either Error Project)
const leafPatchTupleToAssocFunction = R.ifElse(
  R.compose(Either.isLeft, R.last),
  // (Project -> Either Error)
  R.compose(R.always, R.last),
  // (Project -> Either Project)
  R.apply(Project.assocPatch)
);

// :: a | [a] -> [a]
const ensureArray = R.unless(
  R.is(Array),
  R.of
);

// :: [[Path, Patch]] -> [[Path, Patch]]
const filterTuplesByUniqPaths = R.uniqWith(R.eqBy(R.prop(0)));

// =============================================================================
//
// General flattening functions
//
// =============================================================================
//
// Flow of general flattening function calls:
//     flatten -> validateProject -> getPatchByPath (or Error) ->
//  -> flattenProject -> extractLeafPatches -> convertProject
//

/**
 * Converting old patch into new patch.
 *
 * See {@link flatten} docs (2)
 *
 * @private
 * @function convertPatch
 * @param {Project} project
 * @param {Array<String>} impls
 * @param {Array<Array<Path, Patch>>} leafPatches
 * @param {Patch} patch
 * @returns {Patch}
 */
 // :: Project  -> String[] -> [[Path, Patch]] -> Patch -> Patch
const convertPatch = R.curry((project, impls, leafPatches, patch) => R.ifElse(
  Patch.hasImpl(impls),
  R.identity,
  (originalPatch) => {
    const leafPatchPaths = R.pluck(0, leafPatches);
    const nodes = extractNodes(project, leafPatchPaths, null, originalPatch);
    const links = extractLinks(project, leafPatchPaths, null, originalPatch);
    const [newNodes, newLinks] = createCastNodes(leafPatches, nodes, links);

    // (Patch -> Patch)[]
    const assocNodes = R.map(Patch.assocNode, newNodes);
    // (Patch -> Patch)[]
    const assocLinks = R.map(R.curryN(2, R.compose(explode, Patch.assocLink)), newLinks);

    const patchUpdaters = R.concat(assocNodes, assocLinks);
    // (Patch -> Patch)[] -> Patch
    return R.reduce((p, fn) => fn(p), Patch.createPatch(), patchUpdaters);
  }
)(patch));

/**
 * Creating new flattened project by:
 * - converting patches
 * - updating leaf patches
 * - associating leaf patches
 * - associating converted patch
 *
 * See {@link flatten} docs (2-5)
 *
 * @private
 * @function convertProject
 * @param {Project} project
 * @param {String} path
 * @param {Array<String>} impls
 * @param {Patch} patch
 * @param {Array<Array<Path, Patch>>} leafPatches
 * @returns {Either<Error|Project>}
 */
// :: Project -> Path -> String[] -> Patch -> [[Path, Patch]] -> Either Error Project
const convertProject = R.curry((project, path, impls, patch, leafPatches) => {
  // :: Patch -> Patch
  const convertedPatch = convertPatch(project, impls, leafPatches, patch);

  // Add used cast patches to a list of new leaf patches
  const newNodes = Patch.listNodes(convertedPatch);
  const usedCastNodeTypes = getCastNodeTypes(newNodes);
  // :: (Project -> Either Error Project)[]
  const assocLeafPatches = R.compose(
    R.map(leafPatchTupleToAssocFunction),
    removeTerminalPatches,
    addCastPatches(project, usedCastNodeTypes)
  )(leafPatches);

  return R.compose(
    R.chain(Project.assocPatch(path, convertedPatch)),
    reduceChainOver(R.__, assocLeafPatches),
    Maybe.of
  )(Project.createProject());
});

//
// It representing a first step of flattening.
// (see flatten docs (1))
// And then passing leafPatches into convertProject function, which represents estimated steps.
//
// Project and patch was validated in the parent function, so in this function we
// already have a completely valid Project and Patch.
//
/**
 * Extracting leaf patches, filter unique leaf patches by path
 * and begin converting project.
 *
 * See {@link flatten} docs (1)
 *
 * @private
 * @function flattenProject
 * @param {Project} project
 * @param {String} path
 * @param {Array<String>} impls
 * @param {Patch} patch
 * @returns {Either<Error|Project>}
 */
// :: Project -> Path -> String[] -> Patch -> Either Error Project
const flattenProject = R.curry((project, path, impls, patch) =>
  R.compose(
    R.chain(convertProject(project, path, impls, patch)),
    R.map(filterTuplesByUniqPaths),
    R.sequence(Either.of),
    ensureArray,
    extractLeafPatches(impls, project, path)
  )(patch)
);

/**
 * Flattens project
 *
 * To transpile project into any native language we need a flattened graph of nodes
 * with implementations for target platform. It replaces all nodes with contents of
 * their patches recursively, place nodes, which casts one type into another one
 * on every link between pins with different types.
 *
 *
 * **How we do it?**
 * Before begin to flatten, we're check passed project for validity
 * and check for existance of entry-point patch.
 *
 * Then we start flattening from entry-point patch (second argument of function),
 * so as a result we'll get only used patches.
 *
 * 1. Get all patches with defined implementations or terminal patches.
 *    And name them "leaf patches". We will reference to them later.
 *    Terminal nodes are replaced with a new temporary type "terminal%TYPE%"
 *    (e.g. inputBool becomes terminalBool).
 *    They get two pins: `__in__` and `__out__`.
 *
 * 2. Convert entry-point patch into a new patch:
 *
 *    2.1. Extract all nodes recursively.
 *         Each node will become array of new nodes,
 *         that have new ids and type of one of leaf patches.
 *         New ids get form "parentNodehId~subNodeId~nodeId".
 *
 *    2.2. Update links according to extracted nodes.
 *         Links will have new ids, new node ids, and pin keys.
 *         Link ids get form "parentNodeId~subNodeId~linkId".
 *         Pin keys stay intact unless link points to a terminal node.
 *         In this case the pin key is replaced with `__in__` or `__out__`.
 *
 *    2.3. Replace terminal nodes and links with cast nodes and links.
 *         It removes terminal nodes, places cast nodes (from type to type),
 *         and creates new links. Sometimes it just removes terminals, if
 *         both pins have the same type (if we don't need a casting).
 *         Also we copy injected pins from terminals, if they have it.
 *         E.g.
 *
 *    2.4. Assoc new nodes and new links to a new patch.
 *
 * 3. Get a list of used cast patches in the new patch and copy them
 *    from project to the list of leaf patches (from (1)) and remove terminal patches.
 *
 * 4. Assoc leaf patches to a new project
 *
 * 5. Assoc the new patch to the old path.
 *
 * @function flatten
 * @param {Project} inputProject
 * @param {string} path - Path of entry-point patch
 * @param {string[]} impls - A list of target implementations
 * @returns {Either<Error|Project>}
 */
export default R.curry((inputProject, path, impls) =>
  Project.validateProject(inputProject).chain(project =>
    R.compose(
      R.chain(flattenProject(project, path, impls)),
      errOnNothing(CONST.ERROR.PATCH_NOT_FOUND_BY_PATH),
      Project.getPatchByPath(path)
    )(project)
  )
);
