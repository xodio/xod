
/**
 * @typedef {Object} Node
 */

/**
 * A {@link Node} object or just its ID as {@link string}
 * @typedef {(Node|string)} NodeOrId
 */

/**
 * Pin value can be one of this type:
 *
 * - {@link string}
 * - {@link number}
 * - {@link boolean}
 * - {@link Pulse}
 *
 * And it is never can be {@link Null} or {@link undefined}
 *
 * @typedef {(string|number|boolean|Pulse)} PinValue
 */

/**
 * @function createNode
 * @param {Position} position - coordinates of new node’s center
 * @param {PatchOrPath} type - type of node to create
 * @returns {Either<Error|Node>} error or a new node
 */
// TODO: implement

/**
 * @function duplicateNode
 * @param {Node} node - node to clone
 * @returns {Node} cloned node with new id
 */
// TODO: implement

/**
 * @function getNodeId
 * @param {Node} node
 * @returns {Maybe<Null|string>}
 */
// TODO: implement

/**
 * @function setNodeLabel
 * @param {string} label
 * @param {Node} node
 * @returns {Node}
 */
// TODO: implement

/**
 * @function setNodePosition
 * @param {Position} position - new coordinates of node’s center
 * @param {Node} node - node to move
 * @returns {Node} copy of node in new coordinates
 */
 // TODO: implement

 // =============================================================================
 //
 // Pins
 //
 // =============================================================================

/**
 * @function listPinKeys
 * @param {Node} node
 * @returns {string[]}
 */
 // TODO: implement

/**
 * @function listInputPinKeys
 * @param {Node} node
 * @returns {string[]}
 */
 // TODO: implement

/**
 * @function listOutputPinKeys
 * @param {Node} node
 * @returns {string[]}
 */
 // TODO: implement

/**
 * @function getPinType
 * @param {string} key
 * @param {Node} node
 * @returns {Either<Error|PIN_TYPE>}
 */
 // TODO: implement

/**
 * @function getPinLabel
 * @param {string} key
 * @param {Node} node
 * @returns {Either<Error|string>}
 */
 // TODO: implement

/**
 * @function getPinDescription
 * @param {string} key
 * @param {Node} node
 * @returns {Either<Error|string>}
 */
 // TODO: implement

/**
 * Gets curried value of input pin.
 *
 * It will return value even if pin isn't curried.
 * In that case the last curried value or default one is returned.
 *
 * @function getPinCurriedValue
 * @param {string} key
 * @param {Node} node
 * @returns {Either<Error|PinValue>}
 */

/**
 * Sets curried value to input pin.
 *
 * @function setPinCurriedValue
 * @param {string} key
 * @param {PinValue} value
 * @param {Node} node
 * @returns {Either<Error|Node>}
 */

 /**
  * Enables or disables pin currying.
  *
  * @function curryPin
  * @param {boolean} curry
  * @param {string} key
  * @param {Node} node
  * @returns {Either<Error|Node>}
  */

/**
 * @function isPinCurried
 * @param {string} key
 * @param {Node} node
 * @returns {Either<Error|boolean>}
 */

/**
 * Returns list of all links are connected to specified pin.
 *
 * @function listLinksByPin
 * @param {string} key
 * @param {NodeOrId} node
 * @param {Patch} patch
 * @returns {Link[]}
 */
