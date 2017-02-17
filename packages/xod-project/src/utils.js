import R from 'ramda';
import { Maybe, Either } from 'ramda-fantasy';
import shortid from 'shortid';

import * as Node from './node';
import * as Tools from './func-tools';
import * as CONST from './constants';
import { def } from './types';

/**
 * Contains resulting value or error
 *
 * See: {@link https://github.com/ramda/ramda-fantasy/blob/master/docs/Either.md}
 *
 * @external Either
 */

/**
 * Contains resulting value or null
 *
 * See: {@link https://github.com/ramda/ramda-fantasy/blob/master/docs/Maybe.md}
 *
 * @external Maybe
 */

 /**
  * A special object for triggering nodes without passing data.
  *
  * @typedef {Object} Pulse
  */

/**
 * @typedef {Object} Position
 * @property {number} x
 * @property {number} y
 */

/**
 * @private
 * @function getBaseName
 * @param {string} path
 * @returns {string}
 */
export const getBaseName = R.compose(
  R.last,
  R.split('/')
);

/**
 * Function to rapidly extract a value from Maybe or Either monad.
 * But it should be used only when we're sure that we should have a value,
 * otherwise it will throw an exception.
 *
 * @private
 * @function explode
 * @param {Maybe|Either}
 * @returns {*}
 * @throws Error
 */
export const explode = R.cond([
  [Maybe.isJust, R.chain(R.identity)],
  [Maybe.isNothing, () => { throw new Error('Maybe is expected to be Just, but its Nothing.'); }],
  [R.is(Either), Either.either(
    (val) => { throw new Error(`Either expected to be Right, but its Left with value: ${val}`); },
    R.identity
  )],
  [R.T, (input) => { throw new Error(`Maybe or Either should be passed into explode function. Passed: ${input}`); }],
]);

/**
 * @function isPathLocal
 * @param {string} path
 * @returns {boolean}
 */
export const isPathLocal = R.test(/^@\/[a-zA-Z0-9_\-/]+$/);

/**
 * @function isPathLibrary
 * @param {string} path
 * @returns {boolean}
 */
export const isPathLibrary = R.test(/^[a-zA-Z0-9_\-/]+$/);

/**
 * Checks if a path is a valid for entities like
 * project path, patch path component, etc
 *
 * @function validatePath
 * @param {string} path - string to check
 * @returns {Either<Error|string>} error or valid path
 */
export const validatePath = Tools.errOnFalse(
  CONST.ERROR.PATH_INVALID,
  R.allPass([
    R.complement(R.isNil),
    R.test(/^(@\/)?[a-zA-Z0-9_\-/]+$/),
  ])
);

/**
 * Adds a slash to the end of string if it doesn't exist
 * @private
 * @function ensureEndsWithSlash
 * @param {string} str
 * @returns {string}
 */
export const ensureEndsWithSlash = R.ifElse(
  R.compose(
    R.equals('/'),
    R.last
  ),
  R.identity,
  R.concat(R.__, '/')
);

/**
 * Generates an id for entities
 * @private
 * @function generateId
 * @returns {string}
 */
export const generateId = shortid.generate;

/**
 * Validates an id of entities
 * @function validateId
 * @param {string} id
 * @returns {boolean}
 */
export const validateId = R.test(/^[a-zA-Z0-9\-_]+$/);

/**
 * Returns path for casting patch
 * @private
 * @function getCastPatchPath
 * @param {PIN_TYPE} typeIn
 * @param {PIN_TYPE} typeOut
 * @returns {String}
 */
export const getCastPatchPath = (typeIn, typeOut) => `xod/core/cast-${typeIn}-to-${typeOut}`;

/**
 * Returns a default (empty) value for a given data type.
 *
 * @function defaultValueOfType
 * @param {PIN_TYPE} t
 * @returns {*}
 */
export const defaultValueOfType = def(
  'defaultValueOfType :: DataType -> DataValue',
  R.cond([
    [R.equals(CONST.PIN_TYPE.STRING), R.always('')],
    [R.equals(CONST.PIN_TYPE.NUMBER), R.always(0)],
    [R.equals(CONST.PIN_TYPE.BOOLEAN), R.always(false)],
    [R.equals(CONST.PIN_TYPE.PULSE), R.always(false)],
  ])
);

// =============================================================================
//
// Transforming node ids in the patch
//
// =============================================================================

/**
 * Returns a map of original node ids to new ids,
 * based on index.
 *
 * @private
 * @function guidToIdx
 * @param {Array<Node>} nodes
 * @returns {Object.<string, number>}
 */
export const guidToIdx = R.compose(
  R.fromPairs,
  R.addIndex(R.map)(
    (node, idx) => [Node.getNodeId(node), idx.toString()]
  )
);

/**
 * Returns a list of nodes with ids resolved
 * according to nodeIdMap.
 *
 * @private
 * @function resolveNodeIds
 * @param {Object.<string, number>} nodeIdMap
 * @param {Array<Node>} nodes
 * @returns {Array<Node>}
 */
// :: nodeIdMap -> Node[] -> Node[]
export const resolveNodeIds = R.curry((nodeIdMap, nodes) =>
  R.map(
    R.over(R.lensProp('id'), R.prop(R.__, nodeIdMap)),
    nodes
  )
);

// :: nodeIdMap -> PinRef -> PinRef
const resolvePinRefId = R.curry((nodeIdMap, pinRef) =>
  R.over(R.lensProp('nodeId'), R.prop(R.__, nodeIdMap), pinRef)
);

/**
 * Returns a list of links with resolved nodeIds
 * according to nodeIdMap.
 *
 * @private
 * @function resolveNodeIds
 * @param {Object.<string, number>} nodeIdMap
 * @param {Array<Link>} links
 * @returns {Array<Link>}
 */
export const resolveLinkNodeIds = R.curry((nodeIdMap, links) =>
  R.map(
    R.evolve({
      input: resolvePinRefId(nodeIdMap),
      output: resolvePinRefId(nodeIdMap),
    }),
    links
  )
);
