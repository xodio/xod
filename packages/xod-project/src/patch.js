import * as R from 'ramda';
import { Maybe, Either } from 'ramda-fantasy';
import {
  explodeMaybe,
  explodeEither,
  notNil,
  isAmong,
  mapIndexed,
  notEmpty,
  foldMaybe,
  fail,
  failOnNothing,
  setOfKeys,
  inSet,
  diffSet,
  sameKeysetBy,
  prependTraceToError,
  maybeProp,
  maybeFind,
} from 'xod-func-tools';

import * as CONST from './constants';
import * as Comment from './comment';
import * as Node from './node';
import * as Link from './link';
import * as Pin from './pin';
import * as Utils from './utils';
import * as Attachment from './attachment';
import { sortGraph } from './gmath';
import { def } from './types';
import {
  getHardcodedPinsForPatchPath,
  getPinKeyForTerminalDirection,
  getCustomTypeTerminalPins,
} from './builtinTerminalPatches';
import {
  getBaseName,
  getLocalPath,
  getLibraryName,
  isTerminalPatchPath,
  getTerminalDataType,
  isDeferNodeType,
  resolvePatchPath,
  isBuiltInLibName,
  isLocalMarker,
  isVariadicPath,
  isExpandedVariadicPatchBasename,
  getArityStepFromPatchPath,
  getSpecializationPatchPath,
  normalizeTypeNameForAbstractsResolution,
} from './patchPathUtils';

import BUILT_IN_PATCHES from '../dist/built-in-patches.json';

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
export const createPatch = def('createPatch :: () -> Patch', () => ({
  '@@type': 'xod-project/Patch',
  nodes: {},
  links: {},
  comments: {},
  path: getLocalPath('untitled-patch'),
  description: '',
  attachments: [],
}));

/**
 * @function duplicatePatch
 * @param {Patch} patch
 * @returns {Patch} deeply cloned patch
 */
export const duplicatePatch = def('duplicatePatch :: Patch -> Patch', R.clone);

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
  R.useWith(R.assoc('path'), [String, R.identity])
);

export const getPatchDescription = def(
  'getPatchDescription :: Patch -> String',
  R.prop('description')
);

export const setPatchDescription = def(
  'setPatchDescription :: String -> Patch -> Patch',
  R.assoc('description')
);

const attachmentsLens = R.lens(
  R.prop('attachments'),
  R.pipe(
    R.assoc('attachments'),
    R.over(R.lensProp('attachments'), R.sortBy(R.prop('filename')))
  )
);

/**
 * Returns a Patch with associated attachments list.
 */
export const setPatchAttachments = def(
  'setPatchAttachments :: [Attachment] -> Patch -> Patch',
  R.set(attachmentsLens)
);

/**
 * Returns a list of attachments
 */
export const getPatchAttachments = def(
  'getPatchAttachments :: Patch -> [Attachment]',
  R.view(attachmentsLens)
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
  R.compose(Maybe.isJust, getImpl)
);

export const setImpl = def(
  'setImpl :: Source -> Patch -> Patch',
  (source, patch) =>
    R.over(
      attachmentsLens,
      R.compose(
        R.append(Attachment.createImplAttachment(source)),
        R.reject(Attachment.isImplAttachment)
      ),
      patch
    )
);

export const removeImpl = def(
  'removeImpl :: Patch -> Patch',
  R.over(attachmentsLens, R.reject(Attachment.isImplAttachment))
);

// =============================================================================
//
// Nodes
//
// =============================================================================

const getNodes = R.prop('nodes');

/**
 * Checks that node id to be equal specified value
 *
 * @function nodeIdEquals
 * @param {string} id
 * @param {NodeOrId} node
 * @returns {boolean}
 */
export const nodeIdEquals = def(
  // TODO: it's unused
  'nodeIdEquals :: NodeId -> NodeOrId -> Boolean',
  (id, node) => R.compose(R.equals(id), Node.getNodeId)(node)
);

/**
 * @function listNodes
 * @param {Patch} patch - a patch to get nodes from
 * @returns {Node[]} list of all nodes not sorted in any arbitrary order
 */
export const listNodes = def(
  'listNodes :: Patch -> [Node]',
  R.compose(R.values, getNodes)
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
    R.reject(R.either(isBuiltInLibName, isLocalMarker)),
    R.map(R.compose(getLibraryName, Node.getNodeType)),
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
  (id, patch) => R.compose(Maybe, R.path(['nodes', id]))(patch)
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
  (nodeId, patch) =>
    explodeMaybe(
      `Can't find the Node "${nodeId}" in the patch with path "${getPatchPath(
        patch
      )}"`,
      getNodeById(nodeId, patch)
    )
);

// =============================================================================
//
// Pins
//
// =============================================================================

const getHardcodedPinsForPatch = R.pipe(
  getPatchPath,
  getHardcodedPinsForPatchPath
);

// not isPathBuiltIn, because it does not cover internal patches
const patchHasHardcodedPins = R.pipe(getHardcodedPinsForPatch, notNil);

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
      R.compose(R.map(Pin.getPinType), R.values, getHardcodedPinsForPatch),
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
    R.compose(
      // it's one of 'allowed' types
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
  const isOutputSelf = Node.getPinNodeDataType(node) === 'self';
  const type = isOutputSelf
    ? getPatchPath(patch)
    : Node.getPinNodeDataType(node);

  const isBusPatch = R.compose(
    isAmong([CONST.FROM_BUS_PATH, CONST.TO_BUS_PATH]),
    getPatchPath
  )(patch);

  const isBindable =
    Utils.isBuiltInType(type) && // pins of custom types are never bindable
    !isBusPatch && // pins of bus nodes are never bindable
    (direction === CONST.PIN_DIRECTION.INPUT
      ? true // input pins of built-in types are always bindable
      : canBindToOutputs(patch) &&
        !isOutputSelf &&
        type !== CONST.PIN_TYPE.PULSE &&
        !Utils.isGenericType(type));
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
  R.applySpec({
    nodes: listNodes,
    // It matters for constructors of custom types,
    // because patchPath becomes type name
    patchPath: getPatchPath,
  })
);

// :: Patch -> StrMap Pins
const computePins = R.memoizeWith(pinsMemoizer, patch =>
  R.compose(
    R.indexBy(Pin.getPinKey),
    R.unnest,
    R.values,
    R.map(
      R.compose(
        R.addIndex(R.map)(createPinFromTerminalNode(patch)),
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

const isCustomTypeTerminalPatch = R.compose(
  R.ifElse(
    isTerminalPatchPath,
    R.pipe(getTerminalDataType, R.complement(Utils.isBuiltInType)),
    R.F
  ),
  getPatchPath
);

// :: Patch -> StrMap Pins
const getPins = R.cond([
  [patchHasHardcodedPins, getHardcodedPinsForPatch],
  [isCustomTypeTerminalPatch, R.pipe(getPatchPath, getCustomTypeTerminalPins)],
  [R.T, computePins],
]);

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
  (key, patch) => R.compose(maybeProp(key), getPins)(patch)
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
  (pinKey, patch) =>
    explodeMaybe(
      `Can't find the Pin "${pinKey}" in the patch with path "${getPatchPath(
        patch
      )}"`,
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
  R.compose(R.values, getPins)
);

/**
 * @function listInputPins
 * @param {Patch} patch
 * @returns {Pin[]}
 */
export const listInputPins = def(
  'listInputPins :: Patch -> [Pin]',
  R.compose(R.filter(Pin.isInputPin), listPins)
);

/**
 * @function listOutputPins
 * @param {Patch} patch
 * @returns {Pin[]}
 */
export const listOutputPins = def(
  'listOutputPins :: Patch -> [Pin]',
  R.compose(R.filter(Pin.isOutputPin), listPins)
);

/**
 * Returns true if Patch is a Terminal
 * @function isTerminalPatch
 * @param {Patch} patch
 * @returns {boolean}
 */
export const isTerminalPatch = def(
  'isTerminalPatch :: Patch -> Boolean',
  R.compose(isTerminalPatchPath, getPatchPath)
);

// detects clashing pin labels
export const validatePinLabels = def(
  'validatePinLabels :: Patch -> Either Error Patch',
  patch =>
    R.ifElse(
      R.pipe(getPatchPath, getBaseName, isExpandedVariadicPatchBasename),
      // duplicate labels appear in expanded variadic patches by design
      Either.of,
      R.compose(
        R.ifElse(
          R.isEmpty,
          R.always(Either.of(patch)),
          R.compose(
            ([label, pins]) =>
              fail('CLASHING_PIN_LABELS', {
                label,
                pinKeys: R.map(Pin.getPinKey, pins),
                trace: [getPatchPath(patch)],
              }),
            R.head,
            R.toPairs
          )
        ),
        R.filter(groupedPins => groupedPins.length > 1),
        R.groupBy(Pin.getPinLabel),
        Pin.normalizeEmptyPinLabels,
        listPins
      )
    )(patch)
);

// =============================================================================
//
// Links
//
// =============================================================================

const getLinks = R.prop('links');

/**
 * @function listLinks
 * @param {Patch} patch - a patch to operate on
 * @returns {Link[]} list of all links not sorted in any arbitrary order
 */
export const listLinks = def(
  'listLinks :: Patch -> [Link]',
  R.compose(R.values, getLinks)
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
  (id, link) => R.compose(R.equals(id), Link.getLinkId)(link)
);

/**
 * @function getLinkById
 * @param {string} id - a link ID to find
 * @param {Patch} patch - a patch to operate on
 * @returns {Maybe<Link>} a link with given `id` or Null if not found
 */
export const getLinkById = def(
  'getLinkById :: LinkId -> Patch -> Maybe Link',
  (id, patch) => R.compose(maybeFind(linkIdEquals(id)), listLinks)(patch)
);

export const getLinkByIdUnsafe = def(
  'getLinkByIdUnsafe :: LinkId -> Patch -> Link',
  (linkId, patch) =>
    explodeMaybe(
      `Can't find the Link "${linkId}" in the patch with path "${getPatchPath(
        patch
      )}"`,
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
  (link, patch) => {
    const inputNodeId = Link.getLinkInputNodeId(link);
    const outputNodeId = Link.getLinkOutputNodeId(link);
    const patchPath = getPatchPath(patch);

    return Either.of(link)
      .chain(() =>
        R.compose(
          failOnNothing('LINK_INPUT_NODE_NOT_FOUND', {
            link,
            nodeId: inputNodeId,
            trace: [patchPath],
          }),
          getNodeById
        )(inputNodeId, patch)
      )
      .chain(() =>
        R.compose(
          failOnNothing('LINK_OUTPUT_NODE_NOT_FOUND', {
            link,
            nodeId: inputNodeId,
            trace: [patchPath],
          }),
          getNodeById
        )(outputNodeId, patch)
      )
      .map(R.always(link));
  }
);

/**
 * Replaces an existing `link` or inserts new one in the `patch`.
 *
 * Matching is done by link’s ID.
 *
 * @function assocLink
 * @param {Link} link - new link
 * @param {Patch} patch - a patch to operate on
 * @returns {Patch} a copy of the `patch` with changes applied
 * @see {@link validateLink}
 */
export const assocLink = def(
  'assocLink :: Link -> Patch -> Patch',
  (link, patch) => R.assocPath(['links', Link.getLinkId(link)], link, patch)
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
  'upsertLinks :: [Link] -> Patch -> Patch',
  (linkList, patch) => R.reduce(R.flip(assocLink), patch, linkList)
);

/**
 * Returns a Patch with omitted list of Links
 */
export const omitLinks = def(
  'omitLinks :: [LinkOrId] -> Patch -> Patch',
  (linkList, patch) => R.reduce(R.flip(dissocLink), patch, linkList)
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
  'assocNode :: Node -> Patch -> Patch',
  (node, patch) => R.assocPath(['nodes', Node.getNodeId(node)], node, patch)
);

/**
 * Removes the `node` from the `patch`.
 *
 * Does nothing if the `node` is not in the `patch`.
 *
 * Also removes all links associated with the `node`
 * and remove implementation if type of deleted `node`
 * is `xod/core/not-implemented-in-xod`
 *
 * @function dissocNode
 * @param {NodeOrId} node - node to delete
 * @param {Patch} patch - a patch where the node should be deleted
 * @returns {Patch} a copy of the `patch` with the node deleted
 */
export const dissocNode = def(
  'dissocNode :: NodeOrId -> Patch -> Patch',
  (nodeOrId, patch) => {
    const id = Node.getNodeId(nodeOrId);
    const links = listLinksByNode(id, patch);

    const removeLinks = R.reduce(R.flip(dissocLink));
    const removeNode = R.dissocPath(['nodes', id]);
    const removeImplementation = R.compose(
      foldMaybe(R.identity, () => removeImpl),
      R.chain(
        R.ifElse(
          R.equals(CONST.NOT_IMPLEMENTED_IN_XOD_PATH),
          Maybe.of,
          Maybe.Nothing
        )
      ),
      R.map(Node.getNodeType),
      getNodeById
    )(id, patch);

    return R.compose(removeImplementation, removeNode, removeLinks)(
      patch,
      links
    );
  }
);

/**
 * Returns a Patch with associated list of Nodes.
 */
export const upsertNodes = def(
  'upsertNodes :: [Node] -> Patch -> Patch',
  (nodeList, patch) => R.reduce(R.flip(assocNode), patch, nodeList)
);

export const hasNodeWithType = def(
  'hasNodeWithType :: PatchPath -> Patch -> Boolean',
  (nodeType, patch) =>
    R.compose(R.any(R.pipe(Node.getNodeType, R.equals(nodeType))), listNodes)(
      patch
    )
);

// =============================================================================
//
// Comments
//
// =============================================================================

export const listComments = def(
  'listComments :: Patch -> [Comment]',
  R.compose(R.values, R.prop('comments'))
);

export const getCommentById = def(
  'getCommentById :: CommentId -> Patch -> Maybe Comment',
  (commentId, patch) => R.compose(Maybe, R.path(['comments', commentId]))(patch)
);

export const getCommentByIdUnsafe = def(
  'getCommentByIdUnsafe :: CommentId -> Patch -> Comment',
  (commentId, patch) =>
    explodeMaybe(
      `Can't find the Comment "${commentId}" in the patch with path "${getPatchPath(
        patch
      )}"`,
      getCommentById(commentId, patch)
    )
);

export const assocComment = def(
  'assocComment :: Comment -> Patch -> Patch',
  (comment, patch) =>
    R.assocPath(['comments', Comment.getCommentId(comment)], comment, patch)
);

export const dissocComment = def(
  'dissocComment :: CommentId -> Patch -> Patch',
  (commentId, patch) => R.dissocPath(['comments', commentId], patch)
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
    (deferNodeIds, links) =>
      R.reject(R.pipe(Link.getLinkOutputNodeId, isAmong(deferNodeIds)), links),
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
  R.converge(sortGraph, [
    R.compose(R.map(Node.getNodeId), listNodes),
    R.compose(R.map(Link.getLinkNodeIds), listLinksNotFromDeferNodes),
  ])
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
export const sendDeferNodesToBottom = def(
  'sendDeferNodesToBottom :: Patch -> [NodeId] -> [NodeId]',
  (patch, toposortedNodeIds) =>
    R.compose(
      R.unnest,
      R.partition(
        R.compose(
          R.complement(isDeferNodeType),
          Node.getNodeType,
          R.flip(getNodeByIdUnsafe)(patch)
        )
      )
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
  patch => R.compose(R.map(sendDeferNodesToBottom(patch)), toposortGraph)(patch)
);

/**
 * Returns a topology of nodes as map of NodeIds to Index.
 */
export const getTopologyMap = def(
  'getTopologyMap :: Patch -> Either Error (Map NodeId String)',
  R.compose(
    R.map(R.compose(R.fromPairs, mapIndexed((x, idx) => [x, idx.toString()]))),
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
    const newNodes = R.indexBy(
      Node.getNodeId,
      Utils.resolveNodeIds(nodeIdsMap, nodes)
    );
    const links = listLinks(patch);
    const newLinks = R.indexBy(
      Link.getLinkId,
      Utils.resolveLinkNodeIds(nodeIdsMap, links)
    );

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
  patch => R.compose(R.map(applyNodeIdMap(patch)), getTopologyMap)(patch)
);

/**
 * Function removes debug nodes and links to these nodes
 * from the patch. It could be used in transpilation without
 * debug mode to omit unuseful debug nodes from compiled program.
 */
export const removeDebugNodes = def(
  'removeDebugNodes :: Patch -> Patch',
  patch =>
    R.compose(
      R.reduce((acc, node) => dissocNode(node, acc), patch),
      R.filter(R.compose(isAmong(CONST.DEBUG_NODETYPES), Node.getNodeType)),
      listNodes
    )(patch)
);

/**
 * Returns a map of pins for Node, that points to a patch that exists.
 * So Pins are fully valid, contains proper types and etc.
 */
export const getNondeadNodePins = def(
  'getNondeadNodePins :: Node -> Patch -> Map PinKey Pin',
  (node, patch) =>
    R.compose(
      R.map(pin =>
        Pin.setPinValue(Node.getBoundValueOrDefault(pin, node), pin)
      ),
      patchPins =>
        R.compose(
          R.mergeWith(R.merge, R.__, patchPins),
          R.map(R.compose(R.objOf('normalizedLabel'), Pin.getPinLabel)),
          R.indexBy(Pin.getPinKey),
          Pin.normalizeEmptyPinLabels,
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
      R.mapObjIndexed((links, direction) =>
        R.compose(
          mapIndexed((pinKey, idx) =>
            Pin.createDeadPin(pinKey, direction, idx)
          ),
          R.keys,
          R.groupBy(
            R.ifElse(
              () => direction === CONST.PIN_DIRECTION.INPUT,
              Link.getLinkInputPinKey,
              Link.getLinkOutputPinKey
            )
          )
        )(links)
      ),
      R.groupBy(
        R.ifElse(
          Link.isLinkInputNodeIdEquals(nodeId),
          R.always(CONST.PIN_DIRECTION.INPUT),
          R.always(CONST.PIN_DIRECTION.OUTPUT)
        )
      ),
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

    const pinsByDir = R.compose(R.groupBy(Pin.getPinDirection), R.values)(pins);

    const rejectNondeadLinks = R.reject(
      R.either(
        R.both(
          Link.isLinkInputNodeIdEquals(nodeId),
          R.pipe(Link.getLinkInputPinKey, R.has(R.__, pins))
        ),
        R.both(
          Link.isLinkOutputNodeIdEquals(nodeId),
          R.pipe(Link.getLinkOutputPinKey, R.has(R.__, pins))
        )
      )
    );

    return R.compose(
      R.merge(pins),
      R.indexBy(Pin.getPinKey),
      R.unless(
        R.isEmpty,
        R.compose(
          R.map(R.apply(Pin.createDeadPin)),
          R.unnest,
          R.values,
          R.mapObjIndexed((group, direction) =>
            mapIndexed(
              // Adds a correct order as a third element of each Array
              (data, idx) =>
                R.compose(
                  R.append(R.__, data),
                  R.add(idx),
                  foldMaybe(0, R.length),
                  maybeProp(direction)
                )(pinsByDir),
              group
            )
          ),
          R.groupBy(R.nth(1)),
          R.map(
            R.ifElse(
              Link.isLinkInputNodeIdEquals(nodeId),
              link => [
                Link.getLinkInputPinKey(link),
                CONST.PIN_DIRECTION.INPUT,
              ],
              link => [
                Link.getLinkOutputPinKey(link),
                CONST.PIN_DIRECTION.OUTPUT,
              ]
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
export const resolveNodeTypesInPatch = patch =>
  R.compose(
    R.reduce(R.flip(assocNode), patch),
    R.map(node =>
      R.compose(
        Node.setNodeType(R.__, node),
        resolvePatchPath(R.__, getPatchPath(patch)),
        Node.getNodeType
      )(node)
    ),
    R.filter(Node.isLocalNode),
    listNodes
  )(patch);

/**
 * Gets a deprecated marker description.
 */
export const getDeprecationReason = def(
  'getDeprecationReason :: Patch -> Maybe String',
  R.compose(
    R.map(Node.getNodeDescription),
    Maybe,
    R.find(R.compose(R.equals(CONST.DEPRECATED_MARKER_PATH), Node.getNodeType)),
    listNodes
  )
);

/**
 * Checks if a patch is marked as deprecated.
 */
export const isDeprecatedPatch = def(
  'isDeprecatedPatch :: Patch -> Boolean',
  R.compose(Maybe.isJust, getDeprecationReason)
);

/**
 * Checks if a patch is marked as utility.
 */
export const isUtilityPatch = def(
  'isUtilityPatch :: Patch -> Boolean',
  R.compose(
    R.any(R.compose(R.equals(CONST.UTILITY_MARKER_PATH), Node.getNodeType)),
    listNodes
  )
);

/**
 * Checks if a patch is not built-in or autogenerated
 */
export const isGenuinePatch = def(
  'isGenuinePatch :: Patch -> Boolean',
  R.compose(
    R.not,
    R.anyPass([
      patchPath => R.has(patchPath, BUILT_IN_PATCHES),
      isTerminalPatchPath,
    ]),
    getPatchPath
  )
);

/**
 * Compares two lists of Patches by comparator function
 */
export const patchListEqualsBy = def(
  'patchListEqualsBy :: (Patch -> Patch -> Boolean) -> [Patch] -> [Patch] -> Boolean',
  (compFn, prevPatchesList, nextPatchesList) => {
    if (prevPatchesList === nextPatchesList) return true;
    if (prevPatchesList.length !== nextPatchesList.length) return false;
    const prevPatchesMap = R.indexBy(getPatchPath, prevPatchesList);
    const nextPatchesMap = R.indexBy(getPatchPath, nextPatchesList);

    const prevPatchPaths = setOfKeys(prevPatchesMap);
    const nextPatchPaths = setOfKeys(nextPatchesMap);
    const diffPatchPaths = diffSet(prevPatchPaths, nextPatchPaths);
    if (diffPatchPaths.size > 0) return false;

    return R.all(pp => {
      const patchPath = getPatchPath(pp);
      const np = nextPatchesMap[patchPath];
      return compFn(pp, np);
    })(prevPatchesList);
  }
);

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
  R.compose(Maybe, R.find(isVariadicPath), R.map(Node.getNodeType), listNodes)
);

/**
 * Checks does Patch contains variadic marker.
 */
export const isVariadicPatch = def(
  'isVariadicPatch :: Patch -> Boolean',
  R.compose(Maybe.isJust, findVariadicPatchPath)
);

/**
 * Get arity step (1/2/3) from Patch by checking for
 * existing of variadic node and extract its arity step from
 * NodeType. Cause Patch could not contain any variadic
 * node it returns value wrapped into Maybe.
 */
export const getArityStepFromPatch = def(
  'getArityStepFromPatch :: Patch -> Maybe ArityStep',
  R.compose(R.map(getArityStepFromPatchPath), findVariadicPatchPath)
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

/**
 * Computes variadic pins and validates a patch.
 */
export const computeVariadicPins = def(
  'computeVariadicPins :: Patch -> Either Error Object',
  patch => {
    const patchPath = getPatchPath(patch);

    if (!isVariadicPatch(patch)) {
      return fail('NO_VARIADIC_MARKERS', { trace: [patchPath] });
    }
    if (!checkArityMarkersAmount(patch)) {
      return fail('TOO_MANY_VARIADIC_MARKERS', { trace: [patchPath] });
    }

    const outputs = listOutputPins(patch);
    const outputCount = outputs.length;

    if (outputCount === 0) {
      return fail('VARIADIC_HAS_NO_OUTPUTS', { trace: [patchPath] });
    }

    const inputs = listInputPins(patch);
    const inputCount = inputs.length;
    const arityStep = R.compose(
      explodeMaybe(
        'Imposible error: we should catch Patch without arity markers on first check'
      ),
      getArityStepFromPatch
    )(patch);

    if (inputCount - arityStep < outputCount) {
      const minInputs = R.add(outputCount, arityStep);
      return fail('NOT_ENOUGH_VARIADIC_INPUTS', {
        trace: [patchPath],
        arityStep,
        outputCount,
        minInputs,
      });
    }

    const valPins = R.takeLast(arityStep, inputs);
    const accPins = R.compose(
      R.takeLast(outputCount),
      R.slice(0, R.negate(arityStep))
    )(inputs);

    const pinLabelsOfNonEqualPinTypes = R.compose(
      R.reject(R.isNil),
      mapIndexed((accPin, idx) => {
        const curPinType = Pin.getPinType(accPin);
        const outPinType = Pin.getPinType(outputs[idx]);
        return curPinType === outPinType
          ? null
          : [Pin.getPinLabel(accPin), Pin.getPinLabel(outputs[idx])];
      })
    )(accPins);

    if (notEmpty(pinLabelsOfNonEqualPinTypes)) {
      const accPinLabels = R.pluck(0, pinLabelsOfNonEqualPinTypes);
      const outPinLabels = R.pluck(1, pinLabelsOfNonEqualPinTypes);
      return fail('WRONG_VARIADIC_PIN_TYPES', {
        trace: [patchPath],
        accPinLabels,
        outPinLabels,
      });
    }

    const sharedPins = R.slice(0, R.negate(R.add(accPins.length, arityStep)))(
      inputs
    );

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
export const listVariadicValuePins = def(
  'listVariadicValuePins :: Patch -> Either Error [Pin]',
  R.compose(R.pluck('value'), computeVariadicPins)
);

/**
 * Get list of accumulator input pins of the Patch.
 * This pins will be linked with outputs of the same
 * instance of the Patch, so their amount should be
 * equal to amount of output pins.
 */
export const listVariadicAccPins = def(
  'listVariadicAccPins :: Patch -> Either Error [Pin]',
  R.compose(R.pluck('acc'), computeVariadicPins)
);

/**
 * Get list of variadic shared input pins of the Patch.
 * This pins will have the same input for each level of
 * reduced tree.
 */
export const listVariadicSharedPins = def(
  'listVariadicSharedPins :: Patch -> Either Error [Pin]',
  R.compose(R.pluck('shared'), computeVariadicPins)
);

/**
 * Checks a patch for variadic marker existence.
 * If it has variadic marker — compute and validate variadic Pins,
 * and then return Either Error Patch.
 * If not - just return Either.Right Patch.
 */
export const validatePatchForVariadics = def(
  'validatePatchForVariadics :: Patch -> Either Error Patch',
  patch =>
    R.ifElse(
      isVariadicPatch,
      R.compose(R.map(R.always(patch)), computeVariadicPins),
      Either.of
    )(patch)
);

/**
 * Computes and returns map of pins for Node with additional Pins,
 * if Node has `arityLevel > 1` and Patch has a variadic markers.
 */
export const addVariadicPins = def(
  'addVariadicPins :: Node -> Patch -> Map PinKey Pin -> Map PinKey Pin',
  (node, patch, originalPins) => {
    const arityLevel = Node.getNodeArityLevel(node);
    const isVariadic = isVariadicPatch(patch);
    if (arityLevel === 1 || !isVariadic) return originalPins;

    const variadicPins = listVariadicValuePins(patch);
    if (Either.isLeft(variadicPins)) return originalPins;

    const pinsToRepeat = explodeEither(variadicPins);
    const variadicCount = pinsToRepeat.length;
    const newPins = R.times(
      idx =>
        R.map(
          originalPin =>
            R.compose(
              newPin =>
                Pin.setPinValue(
                  Node.getBoundValueOrDefault(newPin, node),
                  newPin
                ),
              Pin.setPinLabel(
                Pin.induceVariadicPinLabel(idx, Pin.getPinLabel(originalPin))
              ),
              Pin.setPinOrder(
                Pin.getPinOrder(originalPin) + variadicCount * (idx + 1)
              ),
              Pin.setPinKey(
                Pin.addVariadicPinKeySuffix(idx + 1, Pin.getPinKey(originalPin))
              )
            )(originalPin),
          pinsToRepeat
        ),
      arityLevel - 1
    );

    return R.compose(R.merge(originalPins), R.indexBy(Pin.getPinKey), R.unnest)(
      newPins
    );
  }
);

export const listPinsIncludingVariadics = def(
  'listPinsIncludingVariadics :: Node -> Patch -> [Pin]',
  (node, patch) =>
    R.compose(R.values, addVariadicPins(node, patch), getPins)(patch)
);

export const getVariadicPinByKey = def(
  'getPinByKey :: Node -> PinKey -> Patch -> Maybe Pin',
  (node, key, patch) =>
    R.compose(maybeProp(key), addVariadicPins(node, patch), getPins)(patch)
);

// =============================================================================
//
// Utils for Abstract patches
//
// =============================================================================

/**
 * Checks if a patch is marked as abstract.
 */
export const isAbstractPatch = def(
  'isAbstractPatch :: Patch -> Boolean',
  R.compose(
    R.any(R.equals(CONST.ABSTRACT_MARKER_PATH)),
    R.map(Node.getNodeType),
    listNodes
  )
);

const sortUniq = R.compose(R.sort(R.ascend(R.identity)), R.uniq);

export const validateAbstractPatch = def(
  'validateAbstractPatch :: Patch -> Either Error Patch',
  R.ifElse(
    isAbstractPatch, // TODO: also validate composite patches!
    patch => {
      const patchPath = getPatchPath(patch);
      const [genericInputTypes, genericOutputTypes] = R.compose(
        R.map(R.map(Pin.getPinType)),
        R.partition(Pin.isInputPin),
        R.filter(Pin.isGenericPin),
        listPins
      )(patch);

      // for example, there could be no output-t2 if there is no input-t2
      const orphanGenericOutputTypes = R.compose(sortUniq, R.without)(
        genericInputTypes,
        genericOutputTypes
      );

      if (!R.isEmpty(orphanGenericOutputTypes)) {
        return fail('ORPHAN_GENERIC_OUTPUTS', {
          trace: [patchPath],
          types: orphanGenericOutputTypes,
        });
      }

      const allGenericPinTypes = R.compose(sortUniq, R.concat)(
        genericInputTypes,
        genericOutputTypes
      );

      if (R.isEmpty(allGenericPinTypes)) {
        return fail('GENERIC_TERMINALS_REQUIRED', {
          trace: [getPatchPath(patch)],
        });
      }

      const expectedPinTypes = R.compose(
        R.map(i => `t${i}`),
        R.range(1),
        R.inc,
        R.length
      )(allGenericPinTypes);

      if (!R.equals(allGenericPinTypes, expectedPinTypes)) {
        return fail('NONSEQUENTIAL_GENERIC_TERMINALS', {
          types: expectedPinTypes,
          trace: [patchPath],
        });
      }

      return Either.of(patch);
    },
    Either.of
  )
);

// assumes that patchFrom and patchTo are compatible
export const getMapOfCorrespondingPinKeys = def(
  'getMapOfCorrespondingPinKeys :: Node -> Patch -> Patch -> StrMap PinKey',
  (nodeFrom, patchFrom, patchTo) =>
    R.compose(
      R.fromPairs,
      R.apply(R.zip),
      R.map(
        R.compose(
          R.map(Pin.getPinKey),
          R.sortWith([
            R.ascend(Pin.getPinDirection),
            R.ascend(Pin.getPinOrder),
          ]),
          listPinsIncludingVariadics(nodeFrom)
        )
      ),
      R.pair
    )(patchFrom, patchTo)
);

const inputPinKeyLens = R.lens(
  Link.getLinkInputPinKey,
  Link.setLinkInputPinKey
);
const outputPinKeyLens = R.lens(
  Link.getLinkOutputPinKey,
  Link.setLinkOutputPinKey
);

export const doesPatchHaveGenericPins = def(
  'doesPatchHaveGenericPins :: Patch -> Boolean',
  R.compose(R.any(Pin.isGenericPin), listPins)
);

export const isPatchNotImplementedInXod = def(
  'isPatchNotImplementedInXod :: Patch -> Boolean',
  R.compose(
    R.contains(CONST.NOT_IMPLEMENTED_IN_XOD_PATH),
    R.map(Node.getNodeType),
    listNodes
  )
);

// for internal use inside xod-project
export const getUpdatedLinksForNodeWithChangedType = (
  nodeId,
  getReplacementPinKey, // :: (PinKey -> PinKey)
  patch
) =>
  R.compose(
    R.map(
      R.cond([
        [
          Link.isLinkInputNodeIdEquals(nodeId),
          R.over(inputPinKeyLens, getReplacementPinKey),
        ],
        [
          Link.isLinkOutputNodeIdEquals(nodeId),
          R.over(outputPinKeyLens, getReplacementPinKey),
        ],
        [R.T, R.identity],
      ])
    ),
    listLinksByNode(nodeId)
  )(patch);

// checks that a concrete patch conforms to concrete patch specification
export const checkSpecializationMatchesAbstraction = def(
  'checkSpecializationMatchesAbstraction :: Patch -> Patch -> Either Error Patch',
  (abstractPatch, specializationPatch) => {
    if (isAbstractPatch(specializationPatch)) {
      // TODO: For now, this and other messages are not(yet) shown to the end user.
      // In the future, we will most likely want to add additional metadata here.
      return fail('SPECIALIZATION_PATCH_CANT_BE_ABSTRACT', {});
    }

    if (
      !R.equals(
        getArityStepFromPatch(abstractPatch),
        getArityStepFromPatch(specializationPatch)
      )
    ) {
      return fail('SPECIALIZATION_PATCH_MUST_HAVE_SAME_ARITY_LEVEL', {});
    }

    const checkedPatchDoesHaveGenericPins = doesPatchHaveGenericPins(
      specializationPatch
    );

    if (checkedPatchDoesHaveGenericPins) {
      return fail('SPECIALIZATION_PATCH_CANT_HAVE_GENERIC_PINS', {});
    }

    const [
      numberOfPinsInAbstractPatchByDirection,
      numberOfPinsInSpecializationPatchByDirection,
    ] = R.map(
      R.compose(R.map(R.length), R.groupBy(Pin.getPinDirection), listPins)
    )([abstractPatch, specializationPatch]);

    const abstractPatchPath = getPatchPath(abstractPatch);

    // check that patch has a proper number of inputs and outputs
    if (
      numberOfPinsInAbstractPatchByDirection[CONST.PIN_DIRECTION.INPUT] !==
      numberOfPinsInSpecializationPatchByDirection[CONST.PIN_DIRECTION.INPUT]
    ) {
      return fail('SPECIALIZATION_PATCH_MUST_HAVE_N_INPUTS', {
        desiredInputsNumber:
          numberOfPinsInAbstractPatchByDirection[CONST.PIN_DIRECTION.INPUT],
        abstractPatchPath,
      });
    }

    if (
      numberOfPinsInAbstractPatchByDirection[CONST.PIN_DIRECTION.OUTPUT] !==
      numberOfPinsInSpecializationPatchByDirection[CONST.PIN_DIRECTION.OUTPUT]
    ) {
      return fail('SPECIALIZATION_PATCH_MUST_HAVE_N_OUTPUTS', {
        desiredOutputsNumber:
          numberOfPinsInAbstractPatchByDirection[CONST.PIN_DIRECTION.OUTPUT],
        abstractPatchPath,
      });
    }

    const [genericPinPairs, staticPinPairs] = R.compose(
      R.partition(R.pipe(R.nth(0), Pin.isGenericPin)),
      R.apply(R.zip),
      R.map(
        R.compose(
          R.sortWith([
            R.ascend(Pin.getPinDirection),
            R.ascend(Pin.getPinOrder),
          ]),
          listPins
        )
      )
    )([abstractPatch, specializationPatch]);

    const staticTypesMatch = R.all(
      R.apply(R.eqBy(Pin.getPinType)),
      staticPinPairs
    );
    // TODO: `find` instead of `any` and explain which one does not match?
    if (!staticTypesMatch) {
      return fail('SPECIALIZATION_STATIC_PINS_DO_NOT_MATCH', {
        abstractPatchPath,
      });
    }

    const ambiguousGenerics = R.compose(
      R.toPairs,
      R.filter(resolutions => resolutions.length > 1),
      R.map(R.pipe(R.map(R.nth(1)), R.uniqBy(Pin.getPinType))),
      R.groupBy(R.pipe(R.nth(0), Pin.getPinType))
    )(genericPinPairs);

    if (!R.isEmpty(ambiguousGenerics)) {
      const [genericType, pinsWithDifferentTypes] = ambiguousGenerics[0];
      const typeNames = R.compose(R.join(', '), R.map(Pin.getPinType))(
        pinsWithDifferentTypes
      );

      return fail('SPECIALIZATION_HAS_CONFLICTING_TYPES_FOR_GENERIC', {
        genericType,
        typeNames,
        abstractPatchPath,
      });
    }

    const abstractPatchBaseName = R.compose(getBaseName, getPatchPath)(
      abstractPatch
    );
    const expectedSpecializationBaseName = R.compose(
      getSpecializationPatchPath(abstractPatchBaseName),
      R.map(R.nth(1)),
      R.sortBy(R.head),
      R.toPairs,
      // something like { t1: 'number', t2: 'string', etc }
      R.map(
        R.pipe(
          R.head,
          R.nth(1),
          Pin.getPinType,
          normalizeTypeNameForAbstractsResolution
        )
      ),
      R.groupBy(R.pipe(R.nth(0), Pin.getPinType))
    )(genericPinPairs);
    const actualSpecializationBaseName = R.compose(getBaseName, getPatchPath)(
      specializationPatch
    );

    if (expectedSpecializationBaseName !== actualSpecializationBaseName) {
      return fail('SPECIALIZATION_HAS_WRONG_NAME', {
        expectedSpecializationBaseName,
        abstractPatchPath,
      });
    }

    return Either.of(specializationPatch);
  }
);

// =============================================================================
//
// Utils for Constructor patches
//
// =============================================================================

/**
 * Checks if patch is a constructor for a custom type
 */
export const isConstructorPatch = def(
  'isConstructorPatch :: Patch -> Boolean',
  R.compose(
    R.any(R.equals(CONST.OUTPUT_SELF_PATH)),
    R.map(Node.getNodeType),
    listNodes
  )
);

export const validateConstructorPatch = def(
  'validateConstructorPatch :: Patch -> Either Error Patch',
  patch =>
    R.compose(
      prependTraceToError(getPatchPath(patch)),
      R.ifElse(
        isConstructorPatch,
        R.cond([
          [
            doesPatchHaveGenericPins,
            () => fail('CONSTRUCTOR_PATCH_CANT_HAVE_GENERIC_PINS', {}),
          ],
          [
            R.complement(isPatchNotImplementedInXod),
            () => fail('CONSTRUCTOR_PATCH_MUST_BE_NIIX', {}),
          ],
          [R.T, Either.of],
        ]),
        Either.of
      )
    )(patch)
);

// =============================================================================
//
// Functions for working with buses
//
// =============================================================================

export const validateBuses = def(
  'validateBuses :: Patch -> Either Error Patch',
  patch => {
    const nodes = listNodes(patch);

    const toBusNodes = R.filter(
      R.pipe(Node.getNodeType, R.equals(CONST.TO_BUS_PATH)),
      nodes
    );

    // :: Map NodeLabel [Node]
    const toBusNodesByLabel = R.groupBy(Node.getNodeLabel, toBusNodes);

    // :: [Node] | Undefined
    const toBusNodesWithConflictingLabel = R.compose(
      R.find(ns => ns.length > 1),
      R.values
    )(toBusNodesByLabel);

    if (toBusNodesWithConflictingLabel) {
      const label = R.compose(Node.getNodeLabel, R.head)(
        toBusNodesWithConflictingLabel
      );
      const nodeIds = R.map(Node.getNodeId, toBusNodesWithConflictingLabel);

      return fail('CONFLICTING_TO_BUS_NODES', {
        trace: [getPatchPath(patch)],
        nodeIds,
        label,
      });
    }

    // :: Map NodeId [Link]
    const linksByInputNodeId = R.compose(
      R.groupBy(Link.getLinkInputNodeId),
      listLinks
    )(patch);

    // :: [Node] | Undefined
    const floatingToBusNode = R.compose(
      R.head,
      R.reject(nId => R.has(Node.getNodeId(nId), linksByInputNodeId))
    )(toBusNodes);

    if (floatingToBusNode) {
      return fail('FLOATING_TO_BUS_NODES', {
        trace: [getPatchPath(patch)],
        label: Node.getNodeLabel(floatingToBusNode),
        nodeIds: [Node.getNodeId(floatingToBusNode)],
      });
    }

    // :: (NodeLabel, [Node]) | Undefined
    const orphanBusNodes = R.compose(
      R.head,
      R.toPairs,
      R.omit(R.keys(toBusNodesByLabel)),
      R.groupBy(Node.getNodeLabel),
      R.filter(R.pipe(Node.getNodeType, R.equals(CONST.FROM_BUS_PATH)))
    )(nodes);

    if (orphanBusNodes) {
      const [label, fbNodes] = orphanBusNodes;

      return fail('ORPHAN_FROM_BUS_NODES', {
        label,
        nodeIds: R.map(Node.getNodeId, fbNodes),
        trace: [getPatchPath(patch)],
      });
    }

    return Either.of(patch);
  }
);

// =============================================================================
//
// Functions that checks whether something could change
//
// =============================================================================

export const sameNodesList = def(
  'sameNodesList :: Patch -> Patch -> Boolean',
  sameKeysetBy(getNodes)
);
export const sameLinksList = def(
  'sameLinksList :: Patch -> Patch -> Boolean',
  sameKeysetBy(getLinks)
);

const getSetOfNodeTypesFromPatch = R.compose(
  setOfKeys,
  R.indexBy(Node.getNodeType),
  listNodes
);

export const sameCategoryMarkers = def(
  'sameCategoryMarkers :: Patch -> Patch -> Boolean',
  (prevPatch, nextPatch) => {
    const prevNodeTypes = getSetOfNodeTypesFromPatch(prevPatch);
    const nextNodeTypes = getSetOfNodeTypesFromPatch(nextPatch);
    const diff = diffSet(prevNodeTypes, nextNodeTypes);
    return !R.either(
      inSet(CONST.DEPRECATED_MARKER_PATH),
      inSet(CONST.UTILITY_MARKER_PATH)
    )(diff);
  }
);

export const sameNodeTypes = def(
  'sameNodeTypes :: Patch -> Patch -> Boolean',
  (prevPatch, nextPatch) => {
    const prevNodes = listNodes(prevPatch);
    const nextNodes = getNodes(nextPatch);

    return R.all(prevNode => {
      const nodeId = Node.getNodeId(prevNode);
      return (
        nextNodes[nodeId] &&
        Node.getNodeType(nextNodes[nodeId]) === Node.getNodeType(prevNode)
      );
    })(prevNodes);
  }
);

export const sameNodeBoundValues = def(
  'sameNodeBoundValues :: Patch -> Patch -> Boolean',
  (prevPatch, nextPatch) => {
    const prevNodes = listNodes(prevPatch);
    const nextNodes = getNodes(nextPatch);
    return R.all(prevNode => {
      const nodeId = Node.getNodeId(prevNode);
      return (
        nextNodes[nodeId] &&
        Node.getAllBoundValues(prevNode) ===
          Node.getAllBoundValues(nextNodes[nodeId])
      );
    })(prevNodes);
  }
);

export const sameDeducedTypes = def(
  'sameDeducedTypes :: Patch -> Patch -> Boolean',
  R.allPass([sameLinksList, sameNodeTypes, sameNodeBoundValues])
);

/**
 * Checks Patch for changes that could affect its validity.
 */
export const samePatchValidity = def(
  'samePatchValidity :: Patch -> Patch -> Boolean',
  R.allPass([sameNodesList, sameLinksList, sameNodeTypes, sameNodeBoundValues])
);
