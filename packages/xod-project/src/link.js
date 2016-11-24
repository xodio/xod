
/**
 * @typedef {Object} Link
 */

 /**
  * Array with pin key and node object.
  *
  * @typedef {Array} LinkEndpoint
  * @param {string} key
  * @param {Node} node
  *
  * @example
  * ['out', NodeObject]
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
// TODO: implement

/**
 * @function getLinkSource
 * @param {Link}
 * @returns {Maybe<Null|LinkEndpoint>}
 */

/**
 * @function getLinkDestination
 * @param {Link}
 * @returns {Maybe<Null|LinkEndpoint>}
 */
