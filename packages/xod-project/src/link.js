
/**
 * @typedef {Object} Link
 */

/**
 * A {@link Link} object or just its ID as {@link string}
 * @typedef {(Link|string)} LinkOrId
 */

/**
 * Creates a link between two pins of two nodes.
 *
 * @function createLink
 * @param {string} secondPinKey - name of second node’s pin to link
 * @param {NodeOrId} secondNode - second node to link
 * @param {string} firstPinKey - name of first node’s pin to link
 * @param {NodeOrId} firstNode - first node to link
 * @returns {Link} error or a link object created
 */
export const createLink = () => {};

/**
 * @function getLinkInputNodeId
 * @param {Link}
 * @returns {Maybe<Nothing|string>}
 */
export const getLinkInputNodeId = () => {};

/**
 * @function getLinkOutputNodeId
 * @param {Link}
 * @returns {Maybe<Nothing|string>}
 */
export const getLinkOutputNodeId = () => {};

/**
 * @function getLinkInputPinKey
 * @param {Link}
 * @returns {Maybe<Nothing|string>}
 */
export const getLinkInputPinKey = () => {};

/**
 * @function getLinkInputPinKey
 * @param {Link}
 * @returns {Maybe<Nothing|string>}
 */
export const getLinkInputPinKey = () => {};
