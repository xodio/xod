import R from 'ramda';
import shortid from 'shortid';

import * as Node from './node';
import * as Tools from './func-tools';
import * as CONST from './constants';
import { PatchPath, Identifier, def } from './types';

/**
 * Replace placeholders with replacements.
 * E.G., if we pass next arguments we'll get the string
 * "Hello, Alice! My name is Bob."
 * Template: 'Hello, {stranger}! My name is {name}.'
 * Replacements: { stranger: 'Alice', name: 'Bob' }
 *
 * @function formatString
 * @param {string} template
 * @param {Object} replacements
 * @returns {String}
 */
export const formatString = R.curry((template, replacements) =>
  R.compose(
    R.reduce(
      (str, fn) => fn(str),
      template
    ),
    R.values,
    R.mapObjIndexed(
      (replacement, key) => R.replace(new RegExp(`\\{${key}\\}`, 'gi'), replacement)
    )
  )(replacements)
);

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
 * @function getLibraryName
 * @param {string} path
 * @returns {string}
 */
export const getLibraryName = R.ifElse(
  isPathLibrary,
  R.compose(
    R.join('/'),
    R.take(2),
    R.split('/')
  ),
  R.always('@')
);

/* eslint-disable no-underscore-dangle */
export const isValidPatchPath = PatchPath._test;
export const isValidIdentifier = Identifier._test;
/* eslint-enable no-underscore-dangle */

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
  isValidPatchPath
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
