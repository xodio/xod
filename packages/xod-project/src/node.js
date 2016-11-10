
/**
 * @typedef {Object} Node
 * @property {Position} position - coordinates of the node center
 * @property {string} typeId - read-only type name of the node
 */

/**
 * A {@link Node} object or just its ID as {@link string}
 * @typedef {(Node|string)} NodeOrId
 */

/**
 * @function createNode
 * @param {Position} position - coordinates of new node’s center
 * @param {PatchOrId} type - type of node to create
 * @returns {Node} the new node
 */
// TODO: implement

/**
 * @function moveNode
 * @param {Position} position - new coordinates of node’s center
 * @param {Node} node - node to move
 * @returns {Node} copy of node in new coordinates
 */
// TODO: implement
