import R from 'ramda';
import * as Pin from './pin';
import * as Utils from './utils';
import * as Tools from './func-tools';
import * as CONST from './constants';
import { def } from './types';
import { isInputTerminalPath, isOutputTerminalPath, getTerminalDataType } from './patchPathUtils';

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
    label: '',
    description: '',
    boundValues: {},
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
    isInputTerminalPath,
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
    isOutputTerminalPath,
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

/**
 * Gets all bound values of node's pins
 *
 * Note that the returned object may not contain values
 * for some of the existing pins(if they were not bound)
 * or may contain values for pins that were deleted.
 *
 * @function getAllBoundValues
 * @param {Node} node
 * @returns {Object.<PinKey, PinValue>}
 */
export const getAllBoundValues = def(
  'getAllBoundValues :: Node -> Map PinKey DataValue',
  R.prop('boundValues')
);

const pathToBoundValue = pinKey => ['boundValues', pinKey];

/**
 * Gets bound value of a pin.
 *
 * @function getBoundValue
 * @param {string} key
 * @param {Node} node
 * @returns {Maybe<PinValue>}
 */
export const getBoundValue = def(
  'getBoundValue :: PinKey -> Node -> Maybe DataValue',
  R.useWith(
    Tools.path,
    [
      pathToBoundValue,
      R.identity,
    ]
  )
);

export const getBoundValueOrDefault = def(
  'getBoundValueOrDefault :: Pin -> Node -> DataValue',
  (pin, node) => getBoundValue(
    Pin.getPinKey(pin),
    node
  ).getOrElse(Pin.getPinDefaultValue(pin))
);

/**
 * Sets bound value to a pin.
 *
 * @function setBoundValue
 * @param {string} key
 * @param {*} value
 * @param {Node} node
 * @returns {Node}
 */
export const setBoundValue = def(
  'setBoundValue :: PinKey -> DataValue -> Node -> Node',
  R.useWith(
    R.assocPath,
    [
      pathToBoundValue,
      R.identity,
      R.identity,
    ]
  )
);

export const removeBoundValue = def(
  'removeBoundValue :: PinKey -> Node -> Node',
  R.uncurryN(2, pinKey => R.dissocPath(['boundValues', pinKey]))
);

/**
 * Returns data type extracted from pinNode type
 * @function getPinNodeDataType
 * @param {Node} node
 * @returns {DataType}
 */
export const getPinNodeDataType = def(
  'getPinNodeDataType :: TerminalNode -> DataType',
  R.compose(
    getTerminalDataType,
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
