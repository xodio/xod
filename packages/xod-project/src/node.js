import R from 'ramda';
import * as Pin from './pin';
import * as Patch from './patch';
import * as Utils from './utils';
import * as Tools from './func-tools';
import * as CONST from './constants';
import { def } from './types';

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
const getPathToPinProperty = def(
  'getPathToPinProperty :: String -> String -> [String]',
  (propName, pinKey) => ['pins', pinKey, propName]
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
 * @returns {Node} new node
 */
export const createNode = def(
  'createNode :: NodePosition -> PatchPath -> Node',
  (position, type) => ({
    id: Utils.generateId(),
    type,
    position,
  })
);

/**
 * @function duplicateNode
 * @param {Node} node - node to clone
 * @returns {Node} cloned node with new id
 */
export const duplicateNode = def(
  'duplicateNode :: Node -> Node',
  R.compose(
    newNode => R.assoc('id', Utils.generateId(), newNode),
    R.clone
  )
);

/**
 * @function getNodeId
 * @param {NodeOrId} node
 * @returns {string}
 */
export const getNodeId = def(
  'getNodeId :: NodeOrId -> NodeId',
  R.ifElse(R.is(String), R.identity, R.prop('id'))
);

/**
 * @function getNodeType
 * @param {Node} node
 * @returns {string}
 */
export const getNodeType = def(
  'getNodeType :: Node -> PatchPath',
  R.prop('type')
);

/**
 * @function getNodeLabel
 * @param {Node} node
 * @returns {string}
 */
export const getNodeLabel = def(
  'getNodeLabel :: Node -> String',
  R.prop('label')
);

/**
 * @function setNodeLabel
 * @param {string} label
 * @param {Node} node
 * @returns {Node}
 */
export const setNodeLabel = def(
  'setNodeLabel :: String -> Node -> Node',
  R.assoc('label')
);

/**
 * @function getNodeDescription
 * @param {Node} node
 * @returns {string}
 */
export const getNodeDescription = def(
  'getNodeDescription :: Node -> String',
  R.prop('description')
);

/**
 * @function setNodeDescription
 * @param {string} description
 * @param {Node} node
 * @returns {Node}
 */
export const setNodeDescription = def(
  'setNodeDescription :: String -> Node -> Node',
  R.assoc('description')
);

/**
 * @function setNodePosition
 * @param {Position} position - new coordinates of node’s center
 * @param {Node} node - node to move
 * @returns {Node} copy of node in new coordinates
 */
export const setNodePosition = def(
  'setNodePosition :: NodePosition -> Node -> Node',
  R.assoc('position')
);

/**
 * @function getNodePosition
 * @param {Node} node
 * @returns {Position}
 */
export const getNodePosition = def(
  'getNodePosition :: Node -> NodePosition',
  R.prop('position')
);

/**
 * @function isInputPinNode
 * @param {Node} node
 * @returns {boolean}
 */
export const isInputPinNode = def(
  'isInputPinNode :: Node -> Boolean',
  R.compose(
    R.test(/^xod\/core\/input/),
    getNodeType
  )
);

/**
 * @function isOutputPinNode
 * @param {Node} node
 * @returns {boolean}
 */
export const isOutputPinNode = def(
  'isOutputPinNode :: Node -> Boolean',
  R.compose(
    R.test(/^xod\/core\/output/),
    getNodeType
  )
);

/**
 * @function isPinNode
 * @param {Node} node
 * @returns {boolean}
 */
export const isPinNode = def(
  'isPinNode :: Node -> Boolean',
  R.either(
    isInputPinNode,
    isOutputPinNode
  )
);

 // =============================================================================
 //
 // Pins
 //
 // =============================================================================

export const assocInitialPinValues = def(
  'assocInitialPinValues :: Patch -> Node -> Node',
  (patch, node) => R.assoc(
    'pins',
    R.compose(
      R.indexBy(R.prop('key')),
      R.map(
        R.applySpec({
          key: Pin.getPinKey,
          value: Pin.getPinValue,
          // TODO: curried?
        })
      ),
      Patch.listInputPins
    )(patch),
    node
  )
);

/**
 * Gets all curried pins of node
 *
 * @function getCurriedPins
 * @param {Node} node
 * @returns {Object.<PinKey, PinValue>}
 */
export const getCurriedPins = R.compose(
  R.map(R.prop('value')),
  R.filter(R.propEq('curried', true)), // TODO: deprecated
  R.propOr({}, 'pins')
);

/**
 * Gets curried value of input pin.
 *
 * It will return value even if pin isn't curried.
 * In that case the last curried value or default one is returned.
 *
 * @function getPinCurriedValue
 * @param {string} key
 * @param {Node} node
 * @returns {Maybe<PinValue>}
 */
export const getPinCurriedValue = def(
  'getPinCurriedValue :: PinKey -> Node -> Maybe DataValue',
  R.useWith(
    Tools.path,
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
export const setPinCurriedValue = def(
  'setPinCurriedValue :: PinKey -> DataValue -> Node -> Node',
  R.useWith(
    R.assocPath,
    [
      getPathToPinProperty('value'),
      R.identity,
      R.identity,
    ]
  )
);

 /**
  * Enables or disables pin currying.
  *
  * @function curryPin
  * @param {string} key
  * @param {boolean} curry
  * @param {Node} node
  * @returns {Node}
  */
export const curryPin = def( // TODO: deprecated
  'curryPin :: PinKey -> Boolean -> Node -> Node',
  R.useWith(
    R.assocPath,
    [
      getPathToPinProperty('curried'),
      R.identity,
      R.identity,
    ]
  )
);

/**
 * @function isPinCurried
 * @param {string} key
 * @param {Node} node
 * @returns {boolean}
 */
export const isPinCurried = def( // TODO: deprecated
  'isPinCurried :: PinKey -> Node -> Boolean',
  R.useWith(
    R.pathSatisfies(R.equals(true)),
    [
      getPathToPinProperty('curried'),
      R.identity,
    ]
  )
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
  R.keys
);

/**
 * RegExp to extract data type from node type
 * @private
 * @name dataTypeRegexp
 * @type {RegExp}
 */
const dataTypeRegexp = getDataTypeRegExp(CONST.NODETYPE_TO_DATA_TYPES); // TODO: make DRY

/**
 * Returns data type extracted from pinNode type
 * @function getPinNodeDataType
 * @param {Node} node
 * @returns {DataType}
 */
export const getPinNodeDataType = def(
  'getPinNodeDataType :: TerminalNode -> DataType',
  R.compose(
    R.prop(R.__, CONST.NODETYPE_TO_DATA_TYPES),
    R.nth(1),
    R.match(dataTypeRegexp),
    getNodeType
  )
);

/**
 * Returns pin direction extracted from pinNode type
 * @function getPinDirectionFromNodeType
 * @param {Node} node
 * @returns {PinDirection}
 */
export const getPinNodeDirection = def(
  'getPinNodeDirection :: TerminalNode -> PinDirection',
  R.cond([
    [isInputPinNode, R.always(CONST.PIN_DIRECTION.INPUT)],
    [isOutputPinNode, R.always(CONST.PIN_DIRECTION.OUTPUT)],
  ])
);
