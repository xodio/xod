import * as R from 'ramda';
import { Maybe, Either } from 'ramda-fantasy';
import { explodeMaybe, notNil, reduceEither, isAmong, mapIndexed, notEmpty } from 'xod-func-tools';

import * as CONST from './constants';
import * as Tools from './func-tools';
import * as Comment from './comment';
import * as Node from './node';
import * as Link from './link';
import * as Pin from './pin';
import * as Utils from './utils';
import * as Attachment from './attachment';
import { sortGraph } from './gmath';
import { def } from './types';
import { getHardcodedPinsForPatchPath, getPinKeyForTerminalDirection } from './builtInPatches';
import {
  getLocalPath,
  getLibraryName,
  isTerminalPatchPath,
  isDeferNodeType,
  resolvePatchPath,
  isBuiltInLibName,
  isLocalMarker,
  isVariadicPath,
  getArityStepFromPatchPath,
} from './patchPathUtils';
import {
  variadicHasNotEnoughInputs,
  patchHasNoVariadicMarkers,
  patchHasMoreThanOneVariadicMarkers,
  wrongVariadicPinTypes,
  ERR_VARIADIC_HAS_NO_OUTPUTS,
} from './messages';

/**
 * An object representing single patch in a project
 * @typedef {Object} Patch
 */

/**
 * A {@link Patch} object or just its full path as a {@link string}
 * @typedef {(Patch|string)} PatchOrPath
 */

/**
 * @function createPatch
 * @returns {Patch} newly created patch
 */
export const createPatch = def(
  'createPatch :: () -> Patch',
  () => ({
    '@@type': 'xod-project/Patch',
    nodes: {},
    links: {},
    comments: {},
    path: getLocalPath('untitled-patch'),
    description: '',
    attachments: [],
  })
);

/**
 * @function duplicatePatch
 * @param {Patch} patch
 * @returns {Patch} deeply cloned patch
 */
export const duplicatePatch = def(
  'duplicatePatch :: Patch -> Patch',
  R.clone
);

/**
 * @function getPatchPath
 * @param {Patch} patch
 * @returns {string}
 */
export const getPatchPath = def(
  'getPatchPath :: Patch -> PatchPath',
  R.prop('path')
);

/**
 * @function setPatchPath
 * @param {string} path
 * @param {Patch} patch
 * @returns {Patch} a copy of the `patch` with a new path
 */
export const setPatchPath = def(
  'setPatchPath :: PatchPath -> Patch -> Patch',
  R.useWith(
    R.assoc('path'),
    [String, R.identity]
  )
);

export const getPatchDescription = def(
  'getPatchDescription :: Patch -> String',
  R.prop('description')
);

export const setPatchDescription = def(
  'setPatchDescription :: String -> Patch -> Patch',
  R.assoc('description')
);

/**
 * Returns a Patch with associated attachments list.
 */
export const setPatchAttachments = def(
  'setPatchAttachments :: [Attachment] -> Patch -> Patch',
  R.assoc('attachments')
);

/**
 * Returns a list of attachments
 */
export const getPatchAttachments = def(
  'getPatchAttachments :: Patch -> [Attachment]',
  R.prop('attachments')
);

/**
 * Returns an implementation, if it exists. Otherwise Nothing.
 *
 * @function getImpl
 * @param {Patch} patch
 * @type {Maybe<string>}
 */
export const getImpl = def(
  'getImpl :: Patch -> Maybe Source',
  R.compose(
    R.map(Attachment.getContent),
    Maybe,
    R.find(Attachment.isImplAttachment),
    getPatchAttachments
  )
);

/**
 * Returns true if patch has a native implementation attached.
 *
 * @function hasImpl
 * @param {Patch} patch
 * @type {Boolean}
 */
export const hasImpl = def(
  'hasImpl :: Patch -> Boolean',
  R.compose(
    Maybe.isJust,
    getImpl
  )
);

export const setImpl = def(
  'setImpl :: Source -> Patch -> Patch',
  (source, patch) => R.over(
    R.lensProp('attachments'),
    R.compose(
      R.append(Attachment.createImplAttachment(source)),
      R.reject(Attachment.isImplAttachment),
    ),
    patch
  )
);


// =============================================================================
//
// Nodes
//
// =============================================================================

/**
 * Checks that node id to be equal specified value
 *
 * @function nodeIdEquals
 * @param {string} id
 * @param {NodeOrId} node
 * @returns {boolean}
 */
export const nodeIdEquals = def( // TODO: it's unused
  'nodeIdEquals :: NodeId -> NodeOrId -> Boolean',
  (id, node) => R.compose(
    R.equals(id),
    Node.getNodeId
  )(node)
);

/**
 * @function listNodes
 * @param {Patch} patch - a patch to get nodes from
 * @returns {Node[]} list of all nodes not sorted in any arbitrary order
 */
export const listNodes = def(
  'listNodes :: Patch -> [Node]',
  R.compose(
    R.values,
    R.prop('nodes')
  )
);

/**
 * Returns a list of Library names, that used by Nodes.
 * E.G. Patch has Nodes: `xod/core/clock`, `xod/core/flip-flop`
 * and `xod/common-hardware/led`. This functions will return
 * a list: ['xod/core', 'xod/common-hardware']
 */
export const listLibraryNamesUsedInPatch = def(
  'listLibraryNamesUsedInPatch :: Patch -> [LibName]',
  R.compose(
    R.uniq,
    R.reject(R.either(
      isBuiltInLibName,
      isLocalMarker
    )),
    R.map(R.compose(
      getLibraryName,
      Node.getNodeType
    )),
    listNodes
  )
);

/**
 * @function getNodeById
 * @param {string} nodeId - NodeId to find
 * @param {Patch} patch - a patch where node should be searched
 * @returns {Maybe<Node>} a node with given ID
 */
export const getNodeById = def(
  'getNodeById :: NodeId -> Patch -> Maybe Node',
  (id, patch) => R.compose(
    Maybe,
    R.path(['nodes', id])
  )(patch)
);

/**
 * @function getNodeByIdUnsafe
 * @param {string} nodeId - node ID to find
 * @param {Patch} patch - a Patch where node should be searched
 * @returns {Node} a Node with given ID
 * @throws Error if Node was not found
 */
export const getNodeByIdUnsafe = def(
  'getNodeByIdUnsafe :: NodeId -> Patch -> Node',
  (nodeId, patch) => explodeMaybe(
    Utils.formatString(CONST.ERROR.NODE_NOT_FOUND, { nodeId, patchPath: getPatchPath(patch) }),
    getNodeById(nodeId, patch)
  )
);

// =============================================================================
//
// Pins
//
// =============================================================================

const getHardcodedPinsForPatch =
  R.pipe(getPatchPath, getHardcodedPinsForPatchPath);

// not isPathBuiltIn, because it does not cover internal patches
const patchHasHardcodedPins =
  R.pipe(getHardcodedPinsForPatch, notNil);


/**
 * Tells if a given patch is an 'effect patch'.
 *
 * An effect patch is a patch that performs some side-effects.
 * Effect patches always have at least one pulse pin.
 */
export const isEffectPatch = def(
  'isEffectPatch :: Patch -> Boolean',
  R.compose(
    R.contains(CONST.PIN_TYPE.PULSE),
    // we don't just use `listPins` here to be able
    // to use this function in `computePins`,
    // where a full pins list is not available yet
    R.ifElse(
      patchHasHardcodedPins,
      R.compose(
        R.map(Pin.getPinType),
        R.values,
        getHardcodedPinsForPatch
      ),
      R.compose(
        R.map(Node.getPinNodeDataType),
        R.filter(Node.isPinNode),
        listNodes
      )
    )
  )
);

/**
 * Tells if a given patch is a 'functional patch'.
 *
 * A 'functional patch' is the opposite of an 'effect patch'.
 * It performs only pure data transformations, and the
 * value of it's outputs is determined only by it's inputs.
 * Functional patches never have pulse pins.
 */
export const isFunctionalPatch = R.complement(isEffectPatch);

export const canBindToOutputs = def(
  'canBindToOutputs :: Patch -> Boolean',
  R.either(
    R.compose( // it's one of 'allowed' types
      R.anyPass([
        isTerminalPatchPath,
        isAmong(R.values(CONST.CONST_NODETYPES)),
      ]),
      getPatchPath
    ),
    isEffectPatch
  )
);

const compareNodesPositionAxis = axis =>
  R.ascend(R.pipe(Node.getNodePosition, R.prop(axis)));

// :: Patch -> Node -> Number -> Pin
const createPinFromTerminalNode = R.curry((patch, node, order) => {
  const direction = Node.getPinNodeDirection(node);
  const type = Node.getPinNodeDataType(node);

  const isBindable = direction === CONST.PIN_DIRECTION.INPUT
    ? true // inputs are always bindable
    : (canBindToOutputs(patch) && type !== CONST.PIN_TYPE.PULSE);
  const defaultValue = Node.getBoundValue(
    getPinKeyForTerminalDirection(direction),
    node
  ).getOrElse(Utils.defaultValueOfType(type));

  return Pin.createPin(
    Node.getNodeId(node),
    type,
    direction,
    order,
    Node.getNodeLabel(node),
    Node.getNodeDescription(node),
    isBindable,
    defaultValue
  );
});


// :: Patch -> String
const pinsMemoizer = R.compose(
  JSON.stringify.bind(JSON),
  listNodes
);

// :: Patch -> StrMap Pins
const computePins = R.memoizeWith(pinsMemoizer, patch =>
  R.compose(
    R.indexBy(Pin.getPinKey),
    R.unnest,
    R.values,
    R.map(
      R.compose(
        R.addIndex(R.map)(
          createPinFromTerminalNode(patch)
        ),
        R.sortWith([
          compareNodesPositionAxis('x'),
          compareNodesPositionAxis('y'),
        ])
      )
    ),
    R.groupBy(Node.getPinNodeDirection),
    R.filter(Node.isPinNode),
    listNodes
  )(patch)
);

const getPins = R.ifElse(
  patchHasHardcodedPins,
  getHardcodedPinsForPatch,
  computePins
);

/**
 * Returns pin object by key
 *
 * @function getPinByKey
 * @param {string} key
 * @param {Patch} patch
 * @returns {Maybe<Pin>}
 */
export const getPinByKey = def(
  'getPinByKey :: PinKey -> Patch -> Maybe Pin',
  (key, patch) => R.compose(
    Tools.prop(key),
    getPins
  )(patch)
);

/**
 * @function getPinByKeyUnsafe
 * @param {string} key
 * @param {Patch} patch
 * @returns {Pin}
 * @throws Error if Pin was not found
 */
export const getPinByKeyUnsafe = def(
  'getPinByKey :: PinKey -> Patch -> Pin',
  (pinKey, patch) => explodeMaybe(
    Utils.formatString(CONST.ERROR.PIN_NOT_FOUND, { pinKey, patchPath: getPatchPath(patch) }),
    getPinByKey(pinKey, patch)
  )
);

/**
 * @function listPins
 * @param {Patch} patch
 * @returns {Pin[]}
 */
export const listPins = def(
  'listPins :: Patch -> [Pin]',
  R.compose(
    R.values,
    getPins
  )
);

/**
 * @function listInputPins
 * @param {Patch} patch
 * @returns {Pin[]}
 */
export const listInputPins = def(
  'listInputPins :: Patch -> [Pin]',
  R.compose(
    R.filter(Pin.isInputPin),
    listPins
  )
);

/**
 * @function listOutputPins
 * @param {Patch} patch
 * @returns {Pin[]}
 */
export const listOutputPins = def(
  'listOutputPins :: Patch -> [Pin]',
  R.compose(
    R.filter(Pin.isOutputPin),
    listPins
  )
);

/**
 * Returns true if Patch is a Terminal
 * @function isTerminalPatch
 * @param {Patch} patch
 * @returns {boolean}
 */
export const isTerminalPatch = def(
  'isTerminalPatch :: Patch -> Boolean',
  R.compose(
    isTerminalPatchPath,
    getPatchPath
  )
);

// =============================================================================
//
// Links
//
// =============================================================================

/**
 * @function listLinks
 * @param {Patch} patch - a patch to operate on
 * @returns {Link[]} list of all links not sorted in any arbitrary order
 */
export const listLinks = def(
  'listLinks :: Patch -> [Link]',
  R.compose(
    R.values,
    R.prop('links')
  )
);

/**
 * Checks that link id to be equal specified value
 * @private
 * @function linkIdEquals
 * @param {string} id [description]
 * @param {LinkOrId} link [description]
 * @returns {boolean}
 */
export const linkIdEquals = def(
  'linkIdEquals :: LinkId -> LinkOrId -> Boolean',
  (id, link) => R.compose(
    R.equals(id),
    Link.getLinkId
  )(link)
);

/**
 * @function getLinkById
 * @param {string} id - a link ID to find
 * @param {Patch} patch - a patch to operate on
 * @returns {Maybe<Link>} a link with given `id` or Null if not found
 */
export const getLinkById = def(
  'getLinkById :: LinkId -> Patch -> Maybe Link',
  (id, patch) => R.compose(
    Tools.find(linkIdEquals(id)),
    listLinks
  )(patch)
);

export const getLinkByIdUnsafe = def(
  'getLinkByIdUnsafe :: LinkId -> Patch -> Link',
  (linkId, patch) => explodeMaybe(
    Utils.formatString(CONST.ERROR.LINK_NOT_FOUND, { linkId, patchPath: getPatchPath(patch) }),
    getLinkById(linkId, patch)
  )
);

/**
 * Returns list of all links are connected to specified node.
 *
 * @function listLinksByNode
 * @param {NodeOrId} nodeOrId
 * @param {Patch} patch
 * @returns {Link[]}
 */
export const listLinksByNode = def(
  'listLinksByNode :: NodeOrId -> Patch -> [Link]',
  (nodeOrId, patch) => {
    const id = Node.getNodeId(nodeOrId);
    const list = listLinks(patch);

    // :: Link -> boolean
    const filterByNodeId = R.either(
      Link.isLinkInputNodeIdEquals(id),
      Link.isLinkOutputNodeIdEquals(id)
    );

    return R.filter(filterByNodeId, list);
  }
);

/**
 * Returns list of all links are connected to specified pin.
 *
 * @function listLinksByPin
 * @param {string} pinKey
 * @param {NodeOrId} nodeOrId
 * @param {Patch} patch
 * @returns {Link[]}
 */
export const listLinksByPin = def(
  'listLinksByPin :: PinKey -> NodeOrId -> Patch -> [Link]',
  (pinKey, nodeOrId, patch) => {
    const id = Node.getNodeId(nodeOrId);
    const list = listLinks(patch);

    // :: Link -> boolean
    const filterByNodeIdAndPinKey = R.either(
      R.both(
        Link.isLinkInputNodeIdEquals(id),
        Link.isLinkInputPinKeyEquals(pinKey)
      ),
      R.both(
        Link.isLinkOutputNodeIdEquals(id),
        Link.isLinkOutputPinKeyEquals(pinKey)
      )
    );

    return R.filter(filterByNodeIdAndPinKey, list);
  }
);

/**
 * Checks if the `link` would be valid on the `patch`. I.e. it could be
 * [associated](@link assocLink) with it.
 *
 * The link is considered invalid in eiter case:
 * - the link is put on two inputs or on two outputs;
 * - a pin does not exists;
 * - the input already has another incoming link;
 *
 * @function validateLink
 * @param {Link} link - a link to validate
 * @param {Patch} patch - a patch to operate on
 * @returns {Either<Error|Link>} validation errors or valid {@link Link}
 */
export const validateLink = def(
  'validateLink :: Link -> Patch -> Either Error Link',
  (link, patch) => Either.of(link)
    .chain(() => Tools.errOnNothing(
        CONST.ERROR.LINK_INPUT_NODE_NOT_FOUND,
        getNodeById(Link.getLinkInputNodeId(link), patch)
    ))
    .chain(() => Tools.errOnNothing(
        CONST.ERROR.LINK_OUTPUT_NODE_NOT_FOUND,
        getNodeById(Link.getLinkOutputNodeId(link), patch)
    ))
    .map(R.always(link))
);

/**
 * Replaces an existing `link` or inserts new one in the `patch`.
 *
 * Matching is done by link’s ID.
 *
 * @function assocLink
 * @param {Link} link - new link
 * @param {Patch} patch - a patch to operate on
 * @returns {Either<Error|Patch>} error or a copy of the `patch` with changes applied
 * @see {@link validateLink}
 */
export const assocLink = def(
  'assocLink :: Link -> Patch -> Either Error Patch',
  (link, patch) => validateLink(link, patch).map(
    (validLink) => {
      const id = Link.getLinkId(validLink);
      return R.assocPath(['links', id], validLink, patch);
    }
  )
);

/**
 * Removes the `link` from the `patch`.
 *
 * Does nothing if the `link` is not found in the patch.
 *
 * @function dissocLink
 * @param {LinkOrId} link - a link to remove
 * @param {Patch} patch - a patch to operate on
 * @returns {Patch} a copy of the `patch` with changes applied
 */
export const dissocLink = def(
  'dissocLink :: LinkOrId -> Patch -> Patch',
  (linkOrId, patch) => R.dissocPath(['links', Link.getLinkId(linkOrId)], patch)
);

/**
 * Returns a Patch with associated list of Links
 */
export const upsertLinks = def(
  'upsertLinks :: [Link] -> Patch -> Either Error Patch',
  (linkList, patch) => reduceEither(R.flip(assocLink), patch, linkList)
);

// =============================================================================
//
// Nodes assoc/dissoc
//
// =============================================================================

/**
 * Replaces a node with new one or inserts new one if it doesn’t exist yet.
 *
 * The node is searched by ID and its state
 * subtree is completely replaced with one given as argument.
 *
 * @function assocNode
 * @param {Node} node - new node
 * @param {Patch} patch - a patch with the `node`
 * @returns {Patch} a copy of the `patch` with the node replaced
 */
export const assocNode = def(
  'assocNode :: Node -> Patch -> Patch', // TODO: inconsistency with Project.assocPatch
  (node, patch) =>
    R.assocPath(['nodes', Node.getNodeId(node)], node, patch)
);

/**
 * Removes the `node` from the `patch`.
 *
 * Does nothing if the `node` is not in the `patch`.
 *
 * Also removes all links associated with the `node`.
 *
 * @function dissocNode
 * @param {NodeOrId} node - node to delete
 * @param {Patch} patch - a patch where the node should be deleted
 * @returns {Patch} a copy of the `patch` with the node deleted
 */
// TODO: Move child function into top-level
export const dissocNode = def(
  'dissocNode :: NodeOrId -> Patch -> Patch',
  (nodeOrId, patch) => {
    const id = Node.getNodeId(nodeOrId);
    const links = listLinksByNode(id, patch);

    const removeLinks = R.reduce(
      R.flip(dissocLink)
    );
    const removeNode = R.dissocPath(['nodes', id]);

    return R.compose(
      removeNode,
      removeLinks
    )(patch, links);
  }
);

/**
 * Returns a Patch with associated list of Nodes.
 */
export const upsertNodes = def(
  'upsertNodes :: [Node] -> Patch -> Patch',
  (nodeList, patch) => R.reduce(R.flip(assocNode), patch, nodeList)
);

// =============================================================================
//
// Comments
//
// =============================================================================

export const listComments = def(
  'listComments :: Patch -> [Comment]',
  R.compose(
    R.values,
    R.prop('comments')
  )
);

export const getCommentById = def(
  'getCommentById :: CommentId -> Patch -> Maybe Comment',
  (commentId, patch) => R.compose(
    Maybe,
    R.path(['comments', commentId])
  )(patch)
);

export const getCommentByIdUnsafe = def(
  'getCommentByIdUnsafe :: CommentId -> Patch -> Comment',
  (commentId, patch) => explodeMaybe(
    Utils.formatString(
      CONST.ERROR.COMMENT_NOT_FOUND,
      { commentId, patchPath: getPatchPath(patch) }
    ),
    getCommentById(commentId, patch)
  )
);

// TODO: inconsistency with Project.assocPatch, see also `assocNode`
export const assocComment = def(
  'assocComment :: Comment -> Patch -> Patch',
  (comment, patch) =>
    R.assocPath(['comments', Comment.getCommentId(comment)], comment, patch)
);

export const dissocComment = def(
  'dissocComment :: CommentId -> Patch -> Patch',
  (commentId, patch) =>
    R.dissocPath(['comments', commentId], patch)
);

export const upsertComments = def(
  'upsertComments :: [Comment] -> Patch -> Patch',
  (commentList, patch) => R.reduce(R.flip(assocComment), patch, commentList)
);

// =============================================================================
//
// Utils
//
// =============================================================================

const listLinksNotFromDeferNodes = def(
  'listLinksNotFromDeferNodes :: Patch -> [Link]',
  R.converge(
    (deferNodeIds, links) => R.reject(
      R.pipe(Link.getLinkOutputNodeId, isAmong(deferNodeIds)),
      links
    ),
    [
      R.compose(
        R.map(Node.getNodeId),
        R.filter(R.pipe(Node.getNodeType, isDeferNodeType)),
        listNodes
      ),
      listLinks,
    ]
  )
);

const toposortGraph = def(
  'toposortGraph :: Patch -> Either Error [NodeId]',
  R.converge(
    sortGraph,
    [
      R.compose(
        R.map(Node.getNodeId),
        listNodes
      ),
      R.compose(
        R.map(Link.getLinkNodeIds),
        listLinksNotFromDeferNodes
      ),
    ]
  )
);

/**
 * Ensures that defer-* nodes are at the very bottom.
 *
 * For example,
 * [regular1, defer1, defer2, regular2] -> [regular1, regular2, defer1, defer2]
 *
 * This will not affect correctness of the resulting program,
 * and gives some optimisation possibilities.
 */
const sendDeferNodesToBottom = def(
  'sendDeferNodesToBottom :: Patch -> [NodeId] -> [NodeId]',
  (patch, toposortedNodeIds) => R.compose(
    R.unnest,
    R.partition(R.compose(
      R.complement(isDeferNodeType),
      Node.getNodeType,
      R.flip(getNodeByIdUnsafe)(patch)
    ))
  )(toposortedNodeIds)
);

/**
 * Returns a topology of nodes in the patch.
 * defer-* nodes are always placed at the very end.
 *
 * @function getTopology
 * @param {Patch} patch
 * @returns {Either<Error|Array<string>>}
 */
export const getTopology = def(
  'getTopology :: Patch -> Either Error [NodeId]',
  patch => R.compose(
    R.map(sendDeferNodesToBottom(patch)),
    toposortGraph
  )(patch)
);

/**
 * Returns a topology of nodes as map of NodeIds to Index.
 */
export const getTopologyMap = def(
  'getTopologyMap :: Patch -> Either Error (Map NodeId String)',
  R.compose(
    R.map(R.compose(
      R.fromPairs,
      mapIndexed((x, idx) => [x, idx.toString()])
    )),
    getTopology
  )
);

/**
 * Applies a map of current node ids to new node ids,
 * including update of links in the patch.
 */
export const applyNodeIdMap = def(
  'applyNodeIdMap :: Patch -> Map NodeId String -> Patch',
  (patch, nodeIdsMap) => {
    const nodes = listNodes(patch);
    const newNodes = R.indexBy(Node.getNodeId, Utils.resolveNodeIds(nodeIdsMap, nodes));
    const links = listLinks(patch);
    const newLinks = R.indexBy(Link.getLinkId, Utils.resolveLinkNodeIds(nodeIdsMap, links));

    return R.compose(
      R.assoc('nodes', newNodes),
      R.assoc('links', newLinks),
      duplicatePatch
    )(patch);
  }
);

/**
 * Change IDs of nodes in a patch provided to '0', '1', '2',... etc
 * so that they are sorted topologically.
 *
 * Links’ pin references are ajusted as well
 */
export const toposortNodes = def(
  'toposortNodes :: Patch -> Either Error Patch',
  patch => R.compose(
    R.map(applyNodeIdMap(patch)),
    getTopologyMap
  )(patch)
);

/**
 * Function removes debug nodes and links to these nodes
 * from the patch. It could be used in transpilation without
 * debug mode to omit unuseful debug nodes from compiled program.
 */
export const removeDebugNodes = def(
  'removeDebugNodes :: Patch -> Patch',
  patch => R.compose(
    R.reduce(
      (acc, node) => dissocNode(node, acc),
      patch
    ),
    R.filter(
      R.compose(
        isAmong(CONST.DEBUG_NODETYPES),
        Node.getNodeType
      )
    ),
    listNodes,
  )(patch)
);

/**
 * Returns a map of pins for Node, that points to a patch that exists.
 * So Pins are fully valid, contains proper types and etc.
 */
export const getNondeadNodePins = def(
  'getNondeadNodePins :: Node -> Patch -> Map PinKey Pin',
  (node, patch) => R.compose(
    R.map(pin => R.assoc(
      'value',
      Node.getBoundValueOrDefault(pin, node),
      pin
    )),
    patchPins => R.compose(
      R.mergeWith(R.merge, R.__, patchPins),
      R.map(R.compose(
        R.objOf('normalizedLabel'),
        Pin.getPinLabel
      )),
      R.indexBy(Pin.getPinKey),
      Pin.normalizePinLabels,
      R.values
    )(patchPins),
    R.indexBy(Pin.getPinKey),
    listPins
  )(patch)
);

/**
 * Returns a map of pins for Node, that points to non-existing Patch.
 * These pins are created from links, connected with some Pins in this Node.
 */
export const getDeadNodePins = def(
  'getDeadNodePins :: Node -> Patch -> Map PinKey Pin',
  (node, currentPatch) => {
    const nodeId = Node.getNodeId(node);
    return R.compose(
      R.indexBy(Pin.getPinKey),
      R.flatten,
      R.values,
      R.mapObjIndexed(
        (links, direction) => R.compose(
          mapIndexed(
            (pinKey, idx) => Pin.createDeadPin(pinKey, direction, idx)
          ),
          R.keys,
          R.groupBy(R.ifElse(
            () => (direction === CONST.PIN_DIRECTION.INPUT),
            Link.getLinkInputPinKey,
            Link.getLinkOutputPinKey
          ))
        )(links)
      ),
      R.groupBy(R.ifElse(
        Link.isLinkInputNodeIdEquals(nodeId),
        R.always(CONST.PIN_DIRECTION.INPUT),
        R.always(CONST.PIN_DIRECTION.OUTPUT),
      )),
      listLinksByNode(node)
    )(currentPatch);
  }
);

/**
 * Some Patch could have a dead link, and for this case we should
 * add dead pin to the Patch, to connect this link somewhere.
 * E.G.
 * There was a link to the `xod/core/flip-flop` pin `TGL`. But then
 * Pin `TGL` was destroyed somehow and left only `SET` and `RST`. So
 * we have to add `TGL` pin to current `xod/core/flip-flop` with
 * dead type, to render link somehow and mark it as dead.
 */
export const upsertDeadPins = def(
  'upsertDeadPins :: Node -> Patch -> Map PinKey Pin -> Map PinKey Pin',
  (node, currentPatch, pins) => {
    const nodeId = Node.getNodeId(node);
    const pinKeys = R.keys(pins);
    const pinsByDir = R.applySpec({
      [CONST.PIN_DIRECTION.INPUT]: R.filter(Pin.isInputPin),
      [CONST.PIN_DIRECTION.OUTPUT]: R.filter(Pin.isOutputPin),
    })(R.values(pins));

    const rejectNondeadLinks = R.reject(
      R.either(
        R.compose(isAmong(pinKeys), Link.getLinkInputPinKey),
        R.compose(isAmong(pinKeys), Link.getLinkOutputPinKey),
      )
    );

    return R.compose(
      R.merge(pins),
      R.indexBy(Pin.getPinKey),
      R.when(
        R.complement(R.isEmpty),
        R.compose(
          R.map(R.apply(Pin.createDeadPin)),
          R.unnest,
          R.values,
          R.mapObjIndexed(
            (group, direction) => mapIndexed(
              // Adds a correct order as a third element of each Array
              (data, idx) => R.append((idx + pinsByDir[direction].length), data),
              group
            )
          ),
          R.groupBy(R.nth(1)),
          R.map(
            R.ifElse(
              Link.isLinkInputNodeIdEquals(nodeId),
              link => ([Link.getLinkInputPinKey(link), CONST.PIN_DIRECTION.INPUT]),
              link => ([Link.getLinkOutputPinKey(link), CONST.PIN_DIRECTION.OUTPUT]),
            )
          )
        )
      ),
      rejectNondeadLinks,
      listLinksByNode
    )(nodeId, currentPatch);
  }
);

/**
 * It takes Patch and replaces all local nodetypes with absolute.
 * E.G.
 * Patch "xod/core/concat-4" has few nodes with types "@/concat".
 * Theirs node types will be replaced with "xod/core/concat".
 *
 * This function is used in loading of libraries.
 */
// :: Patch -> Patch
export const resolveNodeTypesInPatch = patch => R.compose(
  R.reduce(R.flip(assocNode), patch),
  R.map(node => R.compose(
    Node.setNodeType(R.__, node),
    resolvePatchPath(R.__, getPatchPath(patch)),
    Node.getNodeType
  )(node)),
  R.filter(Node.isLocalNode),
  listNodes
)(patch);

// =============================================================================
//
// Variadic Utils and Getters
//
// =============================================================================

/**
 * Finds variadic marker node in the Patch.
 */
const findVariadicPatchPath = def(
  'findVariadicPatchPath :: Patch -> Maybe PatchPath',
  R.compose(
    Maybe,
    R.find(isVariadicPath),
    R.map(Node.getNodeType),
    listNodes
  )
);

/**
 * Checks does Patch contains variadic marker.
 */
export const isVariadicPatch = def(
  'isVariadicPatch :: Patch -> Boolean',
  R.compose(
    Maybe.isJust,
    findVariadicPatchPath
  )
);

/**
 * Get arity step (1/2/3) from Patch by checking for
 * existing of variadic node and extract its arity step from
 * NodeType. Cause Patch could not contain any variadic
 * node it returns value wrapped into Maybe.
 */
export const getArityStepFromPatch = def(
  'getArityStepFromPatch :: Patch -> Maybe ArityStep',
  R.compose(
    R.map(getArityStepFromPatchPath),
    findVariadicPatchPath
  )
);

/**
 * Checks that Patch contains exactly one arity marker.
 */
const checkArityMarkersAmount = def(
  'checkArityMarkersAmount :: Patch -> Boolean',
  R.compose(
    R.equals(1),
    R.length,
    R.filter(isVariadicPath),
    R.map(Node.getNodeType),
    listNodes
  )
);

// Here we're sure that is variadic!
// TODO: Object -> New Type
export const computeVariadicPins = def(
  'computeVariadicPins :: Patch -> Either Error Object',
  (patch) => {
    const patchPath = getPatchPath(patch);

    if (!isVariadicPatch(patch)) {
      return Either.Left(new Error(patchHasNoVariadicMarkers(patchPath)));
    }
    if (!checkArityMarkersAmount(patch)) {
      return Either.Left(new Error(patchHasMoreThanOneVariadicMarkers(patchPath)));
    }

    const outputs = listOutputPins(patch);
    const outputsCount = outputs.length;

    if (outputsCount === 0) {
      return Either.Left(new Error(ERR_VARIADIC_HAS_NO_OUTPUTS));
    }

    const inputs = listInputPins(patch);
    const inputsCount = inputs.length;
    const arityStep = R.compose(
      explodeMaybe(
        'Imposible error: we should catch Patch without arity markers on first check'
      ),
      getArityStepFromPatch
    )(patch);

    if (inputsCount - arityStep < outputsCount) {
      const minInputs = R.add(outputsCount, arityStep);
      return Either.Left(new Error(variadicHasNotEnoughInputs(arityStep, outputsCount, minInputs)));
    }

    const valPins = R.takeLast(arityStep, inputs);
    const accPins = R.compose(
      R.takeLast(outputsCount),
      R.slice(0, R.negate(arityStep))
    )(inputs);

    const pinLabelsOfNonEqualPinTypes = R.compose(
      R.reject(R.isNil),
      mapIndexed((accPin, idx) => {
        const curPinType = Pin.getPinType(accPin);
        const outPinType = Pin.getPinType(outputs[idx]);
        return (curPinType === outPinType)
          ? null
          : [Pin.getPinLabel(accPin), Pin.getPinLabel(outputs[idx])];
      }),
    )(accPins);

    if (notEmpty(pinLabelsOfNonEqualPinTypes)) {
      const accPinLabels = R.pluck(0, pinLabelsOfNonEqualPinTypes);
      const outPinLabels = R.pluck(1, pinLabelsOfNonEqualPinTypes);
      return Either.Left(new Error(wrongVariadicPinTypes(accPinLabels, outPinLabels)));
    }

    const sharedPins = R.slice(
      0,
      R.negate(R.add(accPins.length, arityStep))
    )(inputs);

    return Either.of({
      acc: accPins,
      value: valPins,
      shared: sharedPins,
      outputs,
    });
  }
);


/**
 * Get list of variadic value pins of the Patch.
 */
export const listValueInputPins = def(
  'listValueInputPins :: Patch -> Either Error [Pin]',
  R.compose(
    R.map(R.prop('value')),
    computeVariadicPins
  )
);

/**
 * Get list of accumulator input pins of the Patch.
 * This pins will be linked with outputs of the same
 * instance of the Patch, so their amount should be
 * equal to amount of output pins.
 */
export const listAccInputPins = def(
  'listAccInputPins :: Patch -> Either Error [Pin]',
  R.compose(
    R.map(R.prop('acc')),
    computeVariadicPins
  )
);

/**
 * Get list of variadic shared input pins of the Patch.
 * This pins will have the same input for each level of
 * reduced tree.
 */
export const listSharedInputPins = def(
  'listAccInputPins :: Patch -> Either Error [Pin]',
  R.compose(
    R.map(R.prop('shared')),
    computeVariadicPins
  )
);

/**
 * It checks Patch for existing of variadic marker.
 * If it has variadic marker — compute and validate variadic Pins,
 * and then return Either Error Patch.
 * If not — just return Either.Right Patch.
 */
export const validatePatchForVariadics = def(
  'validatePatchForVariadics :: Patch -> Either Error Patch',
  patch => R.ifElse(
    isVariadicPatch,
    R.compose(
      R.map(R.always(patch)),
      computeVariadicPins
    ),
    Either.of
  )(patch)
);
