import R from 'ramda';
import { Maybe, Either } from 'ramda-fantasy';

import * as CONST from './constants';
import * as Tools from './func-tools';
import * as Node from './node';
import * as Link from './link';
import * as Pin from './pin';
import * as Utils from './utils';
import { sortGraph } from './gmath';

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
 * @returns {Patch} a validatePath error or newly created patch
 */
export const createPatch = () => ({
  nodes: {},
  links: {},
});

/**
 * @function duplicatePatch
 * @param {Patch} patch
 * @returns {Patch} deeply cloned patch
 */
export const duplicatePatch = R.clone;

/**
 * @function getPatchLabel
 * @param {Patch} patch
 * @returns {string}
 */
export const getPatchLabel = R.propOr('', 'label');

/**
 * @function setPatchLabel
 * @param {string} label
 * @param {Patch} patch
 * @returns {Patch} a copy of the `patch` with new label
 */
export const setPatchLabel = R.useWith(
  R.assoc('label'),
  [String, R.identity]
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
export const listImpls = R.compose(
  R.keys,
  R.propOr({}, 'impls')
);

/**
 * Returns true if patch has any of specified implementations.
 *
 * @function hasImpls
 * @param {string[]} impls
 * @param {Patch} patch
 * @type {Boolean}
 */
export const hasImpls = R.curry((impls, patch) => R.compose(
  R.complement(R.isEmpty),
  R.intersection(impls),
  listImpls
)(patch));

/**
 * Returns an implementation, if it exists. Otherwise Nothing.
 *
 * @function getImpl
 * @param {string} impl
 * @param {Patch} patch
 * @type {Maybe<string>}
 */
export const getImpl = R.curry((impl, patch) => R.compose(
  Maybe,
  R.path(['impls', impl])
)(patch));

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
export const getImplByArray = R.curry((impls, patch) => R.compose(
  R.unnest,
  Maybe,
  R.head,
  R.reject(Maybe.isNothing),
  R.map(getImpl(R.__, patch))
)(impls));

/**
 * @function validatePatch
 * @param {Patch} patch
 * @returns {Either<Error|Patch>}
 */
export const validatePatch = Tools.errOnFalse(
  CONST.ERROR.PATCH_INVALID,
  R.allPass([
    R.has('nodes'),
    R.has('links'),
  ])
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
export const nodeIdEquals = R.curry(
  (id, node) =>
  R.compose(
    R.equals(id),
    Node.getNodeId
  )(node)
);

/**
 * @function listNodes
 * @param {Patch} patch - a patch to get nodes from
 * @returns {Node[]} list of all nodes not sorted in any arbitrary order
 */
export const listNodes = R.compose(
  R.values,
  R.propOr([], 'nodes')
);

/**
 * @function getNodeById
 * @param {string} id - node ID to find
 * @param {Patch} patch - a patch where node should be searched
 * @returns {Maybe<Node>} a node with given ID or `undefined` if it wasn’t not found
 */
export const getNodeById = R.curry(
  (id, patch) => R.compose(
    Tools.find(nodeIdEquals(id)),
    listNodes
  )(patch)
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
 * @returns {Either<Error|Patch>}
 */
export const assocPin = R.curry(
  (pin, patch) => Pin.validatePin(pin).map(
    (validPin) => {
      const key = Pin.getPinKey(validPin);
      return R.assocPath(['pins', key], validPin, patch);
    }
  )
);

/**
 * Returns new patch without pin.
 *
 * @function dissocPin
 * @param {PinOrKey} key
 * @param {Patch} patch
 * @returns {Patch}
 */
export const dissocPin = R.curry(
  (pinOrKey, patch) => R.dissocPath(['pins', Pin.getPinKey(pinOrKey)], patch)
);

/**
 * @private
 * @function getPins
 * @param {Patch}
 * @returns {Pins}
 */
const getPins = R.propOr({}, 'pins');

/**
 * Returns pin object by key
 *
 * @function getPinByKey
 * @param {string} key
 * @param {Patch} patch
 * @returns {Maybe<Pin>}
 */
export const getPinByKey = R.curry(
  (key, patch) => R.compose(
    Tools.prop(key),
    getPins
  )(patch)
);

/**
 * @function listPins
 * @param {Patch} patch
 * @returns {Pin[]}
 */
export const listPins = R.compose(
  R.values,
  getPins
);

/**
 * @function listInputPins
 * @param {Patch} patch
 * @returns {Pin[]}
 */
export const listInputPins = R.compose(
  R.filter(Pin.isInputPin),
  listPins
);

/**
 * @function listOutputPins
 * @param {Patch} patch
 * @returns {Pin[]}
 */
export const listOutputPins = R.compose(
  R.filter(Pin.isOutputPin),
  listPins
);

/**
 * Returns true if Patch is a Terminal
 * @function isTerminalPatch
 * @param {Patch} patch
 * @returns {boolean}
 */
export const isTerminalPatch = R.compose(
  R.contains(true),
  R.map(Pin.isTerminalPin),
  listPins
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
export const listLinks = R.compose(
  R.values,
  R.propOr({}, 'links')
);

/**
 * Checks that link id to be equal specified value
 * @private
 * @function linkIdEquals
 * @param {string} id [description]
 * @param {LinkOrId} link [description]
 * @returns {boolean}
 */
export const linkIdEquals = R.curry(
  (id, link) =>
  R.compose(
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
export const getLinkById = R.curry(
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
export const listLinksByNode = R.curry(
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
export const listLinksByPin = R.curry(
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
export const validateLink = R.curry(
  (link, patch) => Link.validateLinkId(link)
    .chain(Link.validateLinkInput)
    .chain(Link.validateLinkOutput)
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
export const assocLink = R.curry(
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
export const dissocLink = R.curry(
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
export const assocNode = R.curry(
  (node, patch) => {
    const id = Node.getNodeId(node);
    const addPin = R.curry(
      (_node, _patch) => R.ifElse(
        Node.isPinNode,
        (pinNode) => {
          const newPatch = Node.getPinNodeDataType(pinNode).chain(
            type => Node.getPinNodeDirection(pinNode).chain(
              direction => Pin.createPin(id, type, direction).chain(
                // TODO: Add optional data (label, description, order) from node to pin
                newPin => assocPin(newPin, _patch)
              )
            )
          );
          // TODO: Think is it okay or we should return Either<Error|Patch> for invalid pinNodes?
          return Either.either(
            () => _patch,
            valid => valid,
            newPatch
          );
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
export const dissocNode = R.curry(
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
export const renumberNodes = (patch) => {
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
};

/**
 * Returns a topology of nodes in the patch.
 *
 * @function getTopology
 * @param {Patch} patch
 * @returns {Array<string|number>}
 */
export const getTopology = R.converge(
  sortGraph,
  [
    R.compose(R.map(Node.getNodeId), listNodes),
    R.compose(R.map(Link.getLinkNodeIds), listLinks),
  ]
);
