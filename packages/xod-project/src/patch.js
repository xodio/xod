import R from 'ramda';
import { Maybe, Either } from 'ramda-fantasy';

import * as CONST from './constants';
import * as Utils from './utils';
import * as Node from './node';
import * as Link from './link';
import * as Pin from './pin';
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
  links: [],
});

/**
 * @function duplicatePatch
 * @param {Patch} patch
 * @returns {Patch} deeply cloned patch
 */
export const duplicatePatch = R.compose(
  JSON.parse,
  JSON.stringify
);

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
  * Returns a list of platforms for which a `patch` has native implementation
  *
  * For example, `['js', 'arduino', 'espruino', 'nodejs']`.
  *
  * @function listPatchPlatforms
  * @param {Patch} patch
  * @returns {string[]}
  */
export const listPatchPlatforms = R.compose(
  R.keys,
  R.propOr({}, 'impls')
);

/**
 * @function validatePatch
 * @param {Patch} patch
 * @returns {Either<Error|Patch>}
 */
export const validatePatch = R.ifElse(
  R.allPass([
    R.has('nodes'),
    R.has('links'),
  ]),
  Either.Right,
  Utils.leaveError(CONST.ERROR.PATCH_INVALID)
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
    validPin => {
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
  (pinOrKey, patch) => {
    const key = Pin.getPinKey(pinOrKey);

    return R.ifElse(
      R.pathSatisfies(R.complement(R.isNil), ['pins', key]),
      R.dissocPath(['pins', key]),
      R.identity
    )(patch);
  }
);

/**
 * Returns new patch with updated pins meta data
 * by passed Node (it should be input/output node).
 *
 * @function updatePinMetaByNode
 * @param {Node} node
 * @param {Patch} patch
 * @returns {Patch}
 */
export const updatePinMetaByNode = () => {};

/**
 * @function listPins
 * @param {Patch} patch
 * @returns {Pin[]}
 */
export const listPins = R.compose(
  R.values,
  R.propOr({}, 'pins')
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
  R.propOr([], 'links')
);

/**
 * Checks that link id to be equal specified value
 *
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
 * @returns {Maybe<Nothing|Link>} a link with given `id` or Null if not found
 */
export const getLinkById = R.curry(
  (id, patch) => R.compose(
    Maybe,
    R.find(linkIdEquals(id)),
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
      Link.isInputNodeIdEqualsTo(id),
      Link.isOutputNodeIdEqualsTo(id)
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
        Link.isInputNodeIdEqualsTo(id),
        Link.isInputPinKeyEqualsTo(pinKey)
      ),
      R.both(
        Link.isOutputNodeIdEqualsTo(id),
        Link.isOutputPinKeyEqualsTo(pinKey)
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
  (link, patch) => Link.validateLinkId(link).chain(validLink => {
    const input = listInputPinKeys(validLink.input.pinKey, validLink.input.nodeId, patch);
    if (input.length === 0) { return Utils.leaveError(CONST.ERROR.LINK_INPUT_NOT_EXIST)(); }
    const output = listOutputPinKeys(validLink.output.pinKey, validLink.output.nodeId, patch);
    if (output.length === 0) { return Utils.leaveError(CONST.ERROR.LINK_OUTPUT_NOT_EXIST)(); }

    return Either.of(validLink);
  })
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
export const assocLink = () => {};

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
  (linkOrId, patch) => {
    const id = Link.getLinkId(linkOrId);

    return R.ifElse(
      R.pathSatisfies(R.complement(R.isNil), ['links', id]),
      R.dissocPath(['links', id]),
      R.identity
    )(patch);
  }
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
 * @param {string} id [description]
 * @param {NodeOrId} node [description]
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
 * @returns {Maybe<Nothing|Node>} a node with given ID or `undefined` if it wasn’t not found
 */
export const getNodeById = R.curry(
  (id, patch) => R.compose(
    Maybe,
    R.find(nodeIdEquals(id)),
    listNodes
  )(patch)
);

/**
 * Replaces a node with new one or inserts new one if it doesn’t exist yet.
 *
 * The node is searched by ID and its state
 * subtree is completely replaced with one given as argument.
 *
 * It’s up to you to keep the state integrity affected by the replacement.
 *
 * @function assocNode
 * @param {Node} node - new node
 * @param {Patch} patch - a patch with the `node`
 * @returns {Patch} a copy of the `patch` with the node replaced
 */
export const assocNode = R.curry(
  (node, patch) => {
    const id = Node.getNodeId(node);
    return R.assocPath(['nodes', id], node, patch);
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
// @TODO: Add removing links!
export const dissocNode = R.curry(
  (nodeOrId, patch) => {
    const id = Node.getNodeId(nodeOrId);
    const links = listLinksByNode(id, patch);
    console.log('found: ', links);
    const newPatch = R.reduce(
      (acc, cur) => dissocLink(cur, acc),
      patch,
      links
    );
    console.log('after reduce: ', newPatch);

    return R.ifElse(
      R.pathSatisfies(R.complement(R.isNil), ['nodes', id]),
      R.dissocPath(['nodes', id]),
      R.identity
    )(newPatch);
  }
);
