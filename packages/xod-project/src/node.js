import R from 'ramda';
import { Either } from 'ramda-fantasy';
import * as Utils from './utils';

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

 // =============================================================================
 //
 // Validation
 //
 // =============================================================================

/**
 * Validate that position object has a keys x and y with numbers.
 *
 * @function validatePosition
 * @param {Position} position
 * @returns {Either<Error|Position>}
 */
export const validatePosition = R.ifElse(
  R.allPass([
    R.is(Object),
    R.compose(R.is(Number), R.prop('x')),
    R.compose(R.is(Number), R.prop('y')),
  ]),
  Either.of,
  Utils.leaveError('Invalid position property.')
);

// =============================================================================
//
// Node
//
// =============================================================================

/**
 * @function createNode
 * @param {Position} position - coordinates of new node’s center
 * @param {string} type - path to the patch, that will be the type of node to create
 * @returns {Either<Error|Node>} error or a new node
 */
export const createNode = R.curry(
  (position, type) =>
    validatePosition(position)
      .map(
        R.assoc('position', R.__, {
          id: Utils.generateId(),
          type,
        })
      )
);

/**
 * @function duplicateNode
 * @param {Node} node - node to clone
 * @returns {Node} cloned node with new id
 */
export const duplicateNode = R.compose(
  R.assoc('id', Utils.generateId()),
  JSON.parse,
  JSON.stringify
);

/**
 * @function getNodeId
 * @param {Node} node
 * @returns {string}
 */
export const getNodeId = R.prop('id');

/**
 * @function getNodeLabel
 * @param {Node} node
 * @returns {string}
 */
export const getNodeLabel = () => {};

/**
 * @function setNodeLabel
 * @param {string} label
 * @param {Node} node
 * @returns {Node}
 */
export const setNodeLabel = () => {};

/**
 * @function setNodePosition
 * @param {Position} position - new coordinates of node’s center
 * @param {Node} node - node to move
 * @returns {Either<Error|Node>} copy of node in new coordinates
 */
export const setNodePosition = R.curry(
  (position, node) =>
    validatePosition(position)
      .map(
        R.assoc('position', R.__, node)
      )
);

/**
 * @function getNodePosition
 * @param {Node} node
 * @returns {Position}
 */
export const getNodePosition = R.prop('position');

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
export const listPinKeys = () => {};

/**
 * @function listInputPinKeys
 * @param {Node} node
 * @returns {string[]}
 */
export const listInputPinKeys = () => {};

/**
 * @function listOutputPinKeys
 * @param {Node} node
 * @returns {string[]}
 */
export const listOutputPinKeys = () => {};

/**
 * @function getPinType
 * @param {string} key
 * @param {Node} node
 * @returns {Either<Error|PIN_TYPE>}
 */
export const getPinType = () => {};

/**
 * @function getPinLabel
 * @param {string} key
 * @param {Node} node
 * @returns {Either<Error|string>}
 */
export const getPinLabel = () => {};

/**
 * @function getPinDescription
 * @param {string} key
 * @param {Node} node
 * @returns {Either<Error|string>}
 */
export const getPinDescription = () => {};

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
export const getPinCurriedValue = () => {};

/**
 * Sets curried value to input pin.
 *
 * @function setPinCurriedValue
 * @param {string} key
 * @param {PinValue} value
 * @param {Node} node
 * @returns {Either<Error|Node>}
 */
export const setPinCurriedValue = () => {};

 /**
  * Enables or disables pin currying.
  *
  * @function curryPin
  * @param {boolean} curry
  * @param {string} key
  * @param {Node} node
  * @returns {Either<Error|Node>}
  */
export const curryPin = () => {};

/**
 * @function isPinCurried
 * @param {string} key
 * @param {Node} node
 * @returns {Either<Error|boolean>}
 */
export const isPinCurried = () => {};

/**
 * Returns list of all links are connected to specified pin.
 *
 * @function listLinksByPin
 * @param {string} key
 * @param {NodeOrId} node
 * @param {Patch} patch
 * @returns {Link[]}
 */
export const listLinksByPin = () => {};
