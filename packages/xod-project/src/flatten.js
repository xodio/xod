import R from 'ramda';
import { Maybe, Either } from 'ramda-fantasy';

import { explode } from 'xod-func-tools';

import * as CONST from './constants';
import * as Project from './project';
import * as Patch from './patch';
import * as Pin from './pin';
import * as Node from './node';
import * as Link from './link';
import { getCastPatchPath, formatString } from './utils';
import { err, errOnNothing } from './func-tools';

// =============================================================================
//
// Wrappers for project entities
//
// =============================================================================

/* eslint-disable new-cap */
function baseChain(f) { return f(this.value); }
function baseGet() { return this.value; }

function NodeWrapper(x) { this.value = x; }
function LinkWrapper(x) { this.value = x; }

const Wr = {
  Node: x => new NodeWrapper(x),
  Link: x => new LinkWrapper(x),
  get: wrapper => wrapper.get(),
  isNode: x => x.isNode,
  isLink: x => x.isLink,
};

NodeWrapper.prototype.isNode = true;
NodeWrapper.prototype.isLink = false;
NodeWrapper.prototype.map = function mapNode(f) { return Wr.Node(f(this.value)); };
NodeWrapper.prototype.chain = baseChain;
NodeWrapper.prototype.get = baseGet;

LinkWrapper.prototype.isNode = false;
LinkWrapper.prototype.isLink = true;
LinkWrapper.prototype.map = function mapLink(f) { return Wr.Link(f(this.value)); };
LinkWrapper.prototype.chain = baseChain;
LinkWrapper.prototype.get = baseGet;

/* eslint-enable new-cap */

// =============================================================================
//
// Utils
//
// =============================================================================

const terminalRegExp = /^xod\/core\/(input|output)/;
// :: String -> Pin[]
const getTerminalPins = type => ([
  Pin.createPin('__in__', type, CONST.PIN_DIRECTION.INPUT),
  Pin.createPin('__out__', type, CONST.PIN_DIRECTION.OUTPUT),
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
  Patch.hasImpls(impls),
  Patch.isTerminalPatch
);

// :: String[] -> Patch -> Boolean
const isLeafPatchWithoutImpls = impls => R.both(
  R.complement(Patch.hasImpls(impls)),
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
    f => f(patch), // TODO: make more DRY
    R.apply(R.compose),
    R.map(Patch.assocPin),
    getTerminalPins,
    Pin.getPinType,
    R.head,
    Patch.listPins
  ),
  R.always([path, patch])
)(patch));

// :: Function extractLeafPatches -> String[] -> Project -> Node -> [Path, Patch, ...]
const extractLeafPatchRecursive = R.curry((recursiveFn, impls, project, node) => R.compose(
  path => R.compose(
    R.chain(recursiveFn(impls, project, path)),
    Project.getPatchByPath(R.__, project)
  )(path),
  Node.getNodeType
)(node));

// :: Function extractLeafPatches -> String[] -> Project -> Patch -> [Path, Patch, ...]
const extractLeafPatchesFromNodes = R.curry((recursiveFn, impls, project, patch) =>
  R.compose(
    R.chain(extractLeafPatchRecursive(recursiveFn, impls, project)),
    Patch.listNodes
  )(patch)
);

// :: String[] -> Project -> Path -> [Either Error [Path, Patch]]
const extractLeafPatches = R.curry((impls, project, path, patch) =>
  R.cond([
    [
      isLeafPatchWithImpls(impls),
      R.compose(R.of, Either.of, extendTerminalPins(R.__, path)),
    ],
    [
      isLeafPatchWithoutImpls(impls),
      err(formatString(CONST.ERROR.IMPLEMENTATION_NOT_FOUND, { impl: impls })),
    ],
    [
      R.T,
      extractLeafPatchesFromNodes(extractLeafPatches, impls, project),
    ],
  ])(patch)
);

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

// :: String -> String -> String
const getPrefixedId = R.curry((prefix, id) => ((prefix) ? `${prefix}~${id}` : id));

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
    position: { x: 0, y: 0 },
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

// :: Link -> Pin -> Pin
const rekeyPinUsingLink = R.curry((link, pin) => {
  if (R.isEmpty(pin)) { return {}; }

  return R.useWith(
    R.objOf,
    [
      Link.getLinkInputPinKey,
      R.compose(R.head, R.values),
    ]
  )(link, pin);
});

// :: Pin -> Nodes -> Link -> Node
const assocInjectedPinToNodeByLink = R.curry((pin, nodes, link) => R.compose(
    R.assoc('pins', rekeyPinUsingLink(link, pin)),
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
    R.flatten,
    R.map((linkPair) => {
      // to terminal
      const sourceLink = R.find(
        R.compose(
          oneOfTerminalNodeIds,
          Link.getLinkInputNodeId
        ),
        linkPair
      );
      // from terminal
      const destinationLink = R.find(
        R.compose(
          oneOfTerminalNodeIds,
          Link.getLinkOutputNodeId
        ),
        linkPair
      );

      const terminalNodeId = Link.getLinkOutputNodeId(destinationLink);

      // get all links from terminal
      const linksFromTerminal = R.filter(
        R.compose(
          R.equals(terminalNodeId),
          Link.getLinkOutputNodeId
        ),
        R.flatten(terminalLinks)
      );

      // Create new links for every link from terminal
      // but take output from sourceLink
      // E.G.
      //     +------------+                          +------------+
      //     |   latch    |                          | latch      |
      //     +-----o------+       Links will         +-----o------+
      //           |              be converted             |
      //     +-----O------+       into next        +-------+-----+------+
      //     | outputBool |       three links:     |             |      |
      //     +-----+------+                        |             |      |
      //           |                               |             |      |
      //   +-------+-----+------+                  |             |      |
      //   |             |      |                  |             |      |
      // +-O------O-+  +-O------O-+              +-O------O-+  +-O------O-+
      // |    or    |  |    or    |              |    or    |  |    or    |
      // +----o-----+  +----o-----+              +----o-----+  +----o-----+
      return R.map(
        (link) => {
          const linkId = Link.getLinkId(link);
          const newLink = Link.createLink(
            Link.getLinkInputPinKey(link),
            Link.getLinkInputNodeId(link),
            Link.getLinkOutputPinKey(sourceLink),
            Link.getLinkOutputNodeId(sourceLink)
          );

          return R.assoc('id', linkId, newLink);
        },
        linksFromTerminal
      );
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

// :: Patch -> String[]
const getCastNodeTypesFromPatch = R.compose(
  R.filter(testCastType),
  R.map(Node.getNodeType),
  Patch.listNodes
);

// :: Project -> String -> Either Error Patch
const getEitherPatchByPath = R.curry((project, path) => R.compose(
  errOnNothing(formatString(CONST.ERROR.CAST_PATCH_NOT_FOUND, { patchPath: path })),
  Project.getPatchByPath(R.__, project)
)(path));

// :: Project -> String[] -> [[Path, Patch]] -> [[Path, Either Error Patch]]
const addCastPatches = R.curry((project, castTypes, leafPatches) => R.compose(
  R.concat(R.map(Either.of, leafPatches)),
  R.map(
    path => getEitherPatchByPath(project, path).map(
      patch => [path, patch]
    )
  ),
  R.uniq
)(castTypes));

// :: [[Path, Patch]] -> [[Path, Patch]]
const removeTerminalPatches = R.reject(R.compose(
  R.test(/^terminal[a-zA-Z]+$/),
  R.prop(0)
));

// :: [[Path, Patch]] -> [[Path, Patch]]
const filterTuplesByUniqPaths = R.uniqWith(R.eqBy(R.prop(0)));

// :: leafPatchesPaths -> String -> Patch -> Link -> Link
const updateLinkNodeIds = R.curry((leafPaths, prefix, patch, link) => {
  const inputNodeId = Link.getLinkInputNodeId(link);
  const inputPinKey = Link.getLinkInputPinKey(link);
  const isInputLeafNode = R.compose(
    isLeafNode(leafPaths),
    getNodeById(patch)
  )(inputNodeId);
  const newInputNodeId = (isInputLeafNode) ?
    getPrefixedId(prefix, inputNodeId) :
    getPrefixedId(prefix, getPrefixedId(inputNodeId, inputPinKey));
  const newInputPinKey = (isInputLeafNode) ?
    inputPinKey : '__in__';

  const outputNodeId = Link.getLinkOutputNodeId(link);
  const outputPinKey = Link.getLinkOutputPinKey(link);
  const isOutputLeafNode = R.compose(
    isLeafNode(leafPaths),
    explode,
    Patch.getNodeById(R.__, patch)
  )(outputNodeId);
  const newOutputNodeId = (isOutputLeafNode) ?
    getPrefixedId(prefix, outputNodeId) :
    getPrefixedId(prefix, getPrefixedId(outputNodeId, outputPinKey));
  const newOutputPinKey = (isOutputLeafNode) ?
    outputPinKey : '__out__';

  return R.compose(
    R.assoc('id', getPrefixedId(prefix, Link.getLinkId(link))),
    Link.createLink
  )(newInputPinKey, newInputNodeId, newOutputPinKey, newOutputNodeId);
});


// =============================================================================
//
// General flattening functions
//
// =============================================================================
//
// Flow of general flattening function calls:
//     flatten -> validateProject -> getPatchByPath (or Error) ->
//  -> flattenProject -> extractLeafPatches -> convertProject ->
//  -> convertPatch -> extractPatches
//


// :: NodePins -> Node -> NodePins
const rekeyPins = R.curry((pins, node) => {
  const nodeId = Node.getNodeId(node);
  const isTerminalNode = R.compose(
    R.test(terminalRegExp),
    Node.getNodeType
  )(node);

  if (isTerminalNode && R.has(nodeId, pins)) {
    return R.applySpec({
      __in__: R.prop(nodeId),
    })(pins);
  }

  return R.propOr({}, 'pins', node);
});

/**
 * Extract all patches nodes and links recursvely.
 *
 * It returns nodes and links wrapped by NodeWrapper or LinkWrapper,
 * and it can't unnest it in this function, cause it recursive.
 *
 * We have to unwrap it in the caller function, just by
 * `R.map(R.map(R.unnest))` and we'll get `[Node[], Link[]]`.
 *
 * It represents a steps 2.1 and 2.2 from {@link flatten} docs.
 *
 * @private
 * @function extractPatches
 * @param {Project} project The original project
 * @param {Array<Path>} leafPatchesPaths Paths to leaf patches
 * @param {String|null} prefix Prefixed parent nodeId (prefixed) or null (for entry-point patch)
 * @param {Array<NodePin>} pins Pins data from parent node or empty object
 * @param {Patch} patch The patch from which should be extracted nodes and links
 * @returns {Array<Array<NodeWrapper>, Array<LinkWrapper>>}
 */
// :: Project -> leafPatchesPaths -> String -> NodePins -> Patch -> [NodeWrapper[], LinkWrapper[]]
export const extractPatches = R.curry((project, leafPaths, prefix, pins, patch) => {
  // 1. extractPatches recursively from nodes and wrap with NodeWrapper leafNodes
  const nodes = R.compose(
    R.map(
      R.ifElse(
        isLeafNode(leafPaths),
        R.compose(
          Wr.Node,
          // 1.3. update id
          node => R.assoc('id', getPrefixedId(prefix, Node.getNodeId(node)), node),
          // 1.2. convert node type from 'input|output' to 'terminal', if needed
          R.over(
            R.lensProp('type'),
            R.when(
              R.test(terminalRegExp),
              convertTerminalPath
            )
          ),
          // 1.1. Copy and rekey pins from parent node
          node => R.assoc('pins', rekeyPins(pins, node), node)
        ),
        R.converge(
          extractPatches(project, leafPaths),
          [
            R.compose(getPrefixedId(prefix), Node.getNodeId),
            R.propOr({}, 'pins'),
            R.compose(getPatchByPath(project), Node.getNodeType),
          ]
        )
      )
    ),
    Patch.listNodes
  )(patch);
  // 2. extract links inside this patch, update nodeIds using prefix and wrap with LinkWrapper
  const links = R.compose(
    R.map(R.compose(
      Wr.Link,
      updateLinkNodeIds(leafPaths, prefix, patch)
    )),
    Patch.listLinks
  )(patch);

  // 3. group by type
  return R.compose(
    R.converge(
      R.append,
      [
        R.compose(R.concat(R.__, links), R.filter(Wr.isLink)),
        R.compose(R.of, R.filter(Wr.isNode)),
      ]
    ),
    R.flatten
  )(nodes);
});

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
  Patch.hasImpls(impls),
  R.identity,
  (originalPatch) => {
    const leafPatchPaths = R.pluck(0, leafPatches);
    const flattenEntities = extractPatches(project, leafPatchPaths, null, {}, originalPatch);
    const nodes = R.map(R.unnest, flattenEntities[0]);
    const links = R.map(R.unnest, flattenEntities[1]);
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
  // Patch
  const convertedPatch = convertPatch(project, impls, leafPatches, patch);
  // String[]
  const usedCastNodeTypes = getCastNodeTypesFromPatch(convertedPatch);
  // Right Project
  const newProject = Either.of(Project.createProject());

  return R.compose(
    R.chain(reduceChainOver(newProject)),
    R.map(R.compose(
      R.map(R.apply(Project.assocPatch)),
      R.append([path, convertedPatch]),
      removeTerminalPatches
    )),
    R.sequence(Either.of),
    addCastPatches(project, usedCastNodeTypes)
  )(leafPatches);
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
      errOnNothing(formatString(CONST.ERROR.PATCH_NOT_FOUND_BY_PATH, { patchPath: path })),
      Project.getPatchByPath(path)
    )(project)
  )
);
