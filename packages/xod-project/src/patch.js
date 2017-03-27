import R from 'ramda';
import { Maybe, Either } from 'ramda-fantasy';
import { explodeMaybe } from 'xod-func-tools';

import * as CONST from './constants';
import * as Tools from './func-tools';
import * as Node from './node';
import * as Link from './link';
import * as Pin from './pin';
import * as Utils from './utils';
import { sortGraph } from './gmath';
import { def } from './types';

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
export const createPatch = () => ({
  nodes: {},
  links: {},
  impls: {},
  pins: {},
  path: '',
});

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
 * @function getPatchLabel
 * @param {Patch} patch
 * @returns {string}
 */
export const getPatchLabel = def(
  'getPatchLabel :: Patch -> Label',
  // TODO: when label field is included in type definition, remove fallback to ''
  R.propOr('', 'label')
);

/**
 * @function setPatchLabel
 * @param {string} label
 * @param {Patch} patch
 * @returns {Patch} a copy of the `patch` with new label
 */
export const setPatchLabel = def(
  'setPatchLabel :: Label -> Patch -> Patch',
  R.useWith(
    R.assoc('label'),
    [String, R.identity]
  )
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


 /**
  * Returns a list of implementations for which a `patch` has native implementation
  *
  * For example, `['js', 'arduino', 'espruino', 'nodejs']`.
  *
  * @function listImpls
  * @param {Patch} patch
  * @returns {string[]}
  */
export const listImpls = def(
  'listImpls :: Patch -> [String]',
  R.compose(R.keys, R.prop('impls'))
);

/**
 * Returns true if patch has any of specified implementations.
 *
 * @function hasImpls
 * @param {string[]} impls
 * @param {Patch} patch
 * @type {Boolean}
 */
export const hasImpls = def(
  'hasImpls :: [String] -> Patch -> Boolean',
  (impls, patch) => R.compose(
    R.complement(R.isEmpty),
    R.intersection(impls),
    listImpls
  )(patch)
);

/**
 * Returns an implementation, if it exists. Otherwise Nothing.
 *
 * @function getImpl
 * @param {string} impl
 * @param {Patch} patch
 * @type {Maybe<string>}
 */
export const getImpl = def(
  'getImpl :: String -> Patch -> Maybe Source',
  (impl, patch) => R.compose(
    Maybe,
    R.path(['impls', impl])
  )(patch)
);

/**
 * Returns the first found in the patch implementation from the list,
 * in order of priority from first to last.
 * If no implementations found — returns Nothing.
 *
 * @function getImplByArray
 * @param {string[]} impls
 * @param {Patch} patch
 * @type {Maybe<string>}
 */
export const getImplByArray = def(
  'getImplByArray :: [String] -> Patch -> Maybe Source',
  (impls, patch) => R.compose(
    R.unnest,
    Maybe,
    R.head,
    R.reject(Maybe.isNothing),
    R.map(getImpl(R.__, patch))
  )(impls)
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
export const nodeIdEquals = def(
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

/**
 * Returns new patch with new pin.
 *
 * @function assocPin
 * @param {Pin} pin
 * @param {Patch} patch
 * @returns {Patch}
 */
export const assocPin = def(
  'assocPin :: Pin -> Patch -> Patch',
  (pin, patch) => R.assocPath(['pins', Pin.getPinKey(pin)], pin, patch)
);

/**
 * Returns new patch without pin.
 *
 * @function dissocPin
 * @param {PinOrKey} key
 * @param {Patch} patch
 * @returns {Patch}
 */
export const dissocPin = def(
  'dissocPin :: PinOrKey -> Patch -> Patch',
  (pinOrKey, patch) => R.dissocPath(['pins', Pin.getPinKey(pinOrKey)], patch)
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
    R.prop('pins')
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
    R.prop('pins')
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
    R.any(Pin.isTerminalPin),
    listPins
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
// TODO: Refactoring needed
export const assocNode = def(
  'assocNode :: Node -> Patch -> Patch',
  (node, patch) => {
    const id = Node.getNodeId(node);
    const addPin = R.curry(
      (_node, _patch) => R.ifElse(
        Node.isPinNode,
        (pinNode) => {
          const type = Node.getPinNodeDataType(pinNode);
          const direction = Node.getPinNodeDirection(pinNode);

          // TODO: set pin order
          const newPin = Pin.createPin(id, type, direction, 0);
          return assocPin(newPin, _patch);
        },
        R.always(_patch)
      )(_node)
    );
    const addNode = R.assocPath(['nodes', id]);

    return R.compose(
      addNode(node),
      addPin(node)
    )(patch);
  }
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
    const removePin = R.ifElse(
      R.compose(
        R.chain(Node.isPinNode),
        getNodeById(id)
      ),
      dissocPin(id),
      R.identity
    );
    const removeNode = R.dissocPath(['nodes', id]);

    return R.compose(
      removeNode,
      removePin,
      removeLinks
    )(patch, links);
  }
);

// =============================================================================
//
// Utils
//
// =============================================================================

/**
 * Returns a copy of the patch with changed nodeIds and resolved links.
 *
 * @function renumberNodes
 * @param {Patch} patch
 * @returns {Patch}
 */
export const renumberNodes = def(
  'renumberNodes :: Patch -> Patch',
  (patch) => {
    const nodes = listNodes(patch);
    const links = listLinks(patch);

    const nodeIdsMap = Utils.guidToIdx(nodes);
    const newNodes = R.indexBy(Node.getNodeId, Utils.resolveNodeIds(nodeIdsMap, nodes));
    const newLinks = R.indexBy(Link.getLinkId, Utils.resolveLinkNodeIds(nodeIdsMap, links));

    return R.compose(
      R.assoc('links', newLinks),
      R.assoc('nodes', newNodes),
      duplicatePatch
    )(patch);
  }
);

/**
 * Returns a topology of nodes in the patch.
 *
 * @function getTopology
 * @param {Patch} patch
 * @returns {Array<string>}
 */
export const getTopology = def(
  'getTopology :: Patch -> [NodeId]',
  R.converge(
    sortGraph,
    [
      R.compose(R.map(Node.getNodeId), listNodes),
      R.compose(R.map(Link.getLinkNodeIds), listLinks),
    ]
  )
);
