import R from 'ramda';
import { Maybe } from 'ramda-fantasy';
import * as Utils from './utils';
import * as CONST from './constants';

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
 * Returns path to pin property
 * @private
 * @function getPathToPinProperty
 * @param {string} propName property name: `value` or `curried`
 * @param {string} pinKey pin key
 * @returns {string[]} path like `['pins', 'pinKey', 'value']`
 */
const getPathToPinProperty = R.curry(
  (propName, pinKey) => ['pins', pinKey, propName]
);

 // =============================================================================
 //
 // Validation
 //
 // =============================================================================

/**
 * Validate that position object has keys x and y with numbers.
 *
 * @function validatePosition
 * @param {Position} position
 * @returns {Either<Error|Position>}
 */
export const validatePosition = Utils.errOnFalse(
  CONST.ERROR.POSITION_INVALID,
  R.allPass([
    R.is(Object),
    R.compose(R.is(Number), R.prop('x')),
    R.compose(R.is(Number), R.prop('y')),
  ])
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
 * @param {NodeOrId} node
 * @returns {string}
 */
export const getNodeId = R.ifElse(R.is(String), R.identity, R.prop('id'));

/**
 * @function getNodeType
 * @param {Node} node
 * @returns {string}
 */
export const getNodeType = R.prop('type');

/**
 * @function getNodeLabel
 * @param {Node} node
 * @returns {string}
 */
export const getNodeLabel = R.propOr('', 'label');

/**
 * @function setNodeLabel
 * @param {string} label
 * @param {Node} node
 * @returns {Node}
 */
export const setNodeLabel = R.assoc('label');

/**
 * @function getNodeDescription
 * @param {Node} node
 * @returns {string}
 */
export const getNodeDescription = R.propOr('', 'description');

/**
 * @function setNodeDescription
 * @param {string} description
 * @param {Node} node
 * @returns {Node}
 */
export const setNodeDescription = R.assoc('description');

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

/**
 * @function isInputPinNode
 * @param {Node} node
 * @returns {boolean}
 */
export const isInputPinNode = R.compose(
  R.test(/^xod\/core\/input/),
  getNodeType
);

/**
 * @function isOutputPinNode
 * @param {Node} node
 * @returns {boolean}
 */
export const isOutputPinNode = R.compose(
  R.test(/^xod\/core\/output/),
  getNodeType
);

/**
 * @function isPinNode
 * @param {Node} node
 * @returns {boolean}
 */
export const isPinNode = R.either(
  isInputPinNode,
  isOutputPinNode
);

 // =============================================================================
 //
 // Pins
 //
 // =============================================================================

/**
 * Gets curried value of input pin.
 *
 * It will return value even if pin isn't curried.
 * In that case the last curried value or default one is returned.
 *
 * @function getPinCurriedValue
 * @param {string} key
 * @param {Node} node
 * @returns {Maybe<Nothing|PinValue>}
 */
export const getPinCurriedValue = R.compose(
  Maybe,
  R.useWith(
    R.pathOr(null),
    [
      getPathToPinProperty('value'),
      R.identity,
    ]
  )
);

/**
 * Sets curried value to input pin.
 *
 * @function setPinCurriedValue
 * @param {string} key
 * @param {*} value
 * @param {Node} node
 * @returns {Node}
 */
export const setPinCurriedValue = R.useWith(
  R.assocPath,
  [
    getPathToPinProperty('value'),
    R.identity,
    R.identity,
  ]
);

 /**
  * Enables or disables pin currying.
  *
  * @function curryPin
  * @param {string} key
  * @param {boolean} curry
  * @param {Node} node
  * @returns {Either<Error|Node>}
  */
export const curryPin = R.useWith(
  R.assocPath,
  [
    getPathToPinProperty('curried'),
    R.identity,
    R.identity,
  ]
);

/**
 * @function isPinCurried
 * @param {string} key
 * @param {Node} node
 * @returns {boolean}
 */
export const isPinCurried = R.useWith(
  R.pathSatisfies(R.equals(true)),
  [
    getPathToPinProperty('curried'),
    R.identity,
  ]
);

/**
 * Returns regExp to extract data type from node type.
 *
 * @private
 * @function getDataTypeRegExp
 * @param {PIN_TYPES} pinTypes
 * @returns {RegExp}
 */
const getDataTypeRegExp = R.compose(
  pinTypes => new RegExp(`^xod/core/(?:input|output)(${pinTypes})`, 'i'),
  R.join('|'),
  R.values
);

/**
 * RegExp to extract data type from node type
 *
 * @name dataTypeRegexp
 * @type {RegExp}
 */
const dataTypeRegexp = getDataTypeRegExp(CONST.PIN_TYPE);

/**
 * Returns data type extracted from pinNode type
 * @function getPinNodeDataType
 * @param {Node} node
 * @returns {Either<Error|string>}
 */
export const getPinNodeDataType = R.compose(
  R.map(R.toLower),
  Utils.errOnNothing(CONST.ERROR.DATATYPE_INVALID),
  Maybe,
  R.compose(
    R.ifElse(
      R.isEmpty,
      R.always(null),
      R.identity
    ),
    R.prop(1)
  ),
  R.match(dataTypeRegexp),
  getNodeType
);

/**
 * Returns pin direction extracted from pinNode type
 * @function getPinDirectionFromNodeType
 * @param {Node} node
 * @returns {Either<Error|string>}
 */
export const getPinNodeDirection = R.compose(
  Utils.errOnNothing(CONST.ERROR.PIN_DIRECTION_INVALID),
  Maybe,
  R.cond([
    [isInputPinNode, R.always(CONST.PIN_DIRECTION.INPUT)],
    [isOutputPinNode, R.always(CONST.PIN_DIRECTION.OUTPUT)],
    [R.T, R.always(null)],
  ])
);
