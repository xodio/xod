import * as R from 'ramda';
import shortid from 'shortid';
import { foldEither } from 'xod-func-tools';
import { Either } from 'ramda-fantasy';

import * as Node from './node';
import * as CONST from './constants';
import { def } from './types';


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

// -----------------------------------------------------------------------------
//
// Dead reference errors
//
// -----------------------------------------------------------------------------

// DeadRefError — is an Error with additional properties '@@type' and 'path'
// that is needed for creating a proper error message.

// :: Error -> Boolean
export const isDeadRefError = R.both(
  R.is(Error),
  R.propEq('@@type', 'DeadRefError')
);

// :: DeadRefError -> String
export const getDeadRefErrorReason = R.ifElse(
  isDeadRefError,
  err => `${err.path.reverse().join(' -> ')}: ${err.message}.`,
  (x) => {
    throw new Error(`Expected Error with @@type "DeadRefError", but got ${typeof x} "x"`);
  }
);

// :: String -> PatchPath -> DeadRefError
const createDeadRefError = R.curry(
  (message, patchPath) => {
    const err = new Error(message);
    err['@@type'] = 'DeadRefError';
    err.path = patchPath;
    err.title = 'Patch contains dead references';
    return err;
  }
);

// :: DeadRefError -> DeadRefError
const addPathIntoDeadRefError = R.curry(
  (patchPath, err) => {
    // eslint-disable-next-line no-param-reassign
    err.path = R.append(patchPath, err.path);
    return err;
  }
);

// :: PatchPath -> Either a b -> Either a b
export const maybeComposeDeadRefError = R.uncurryN(2,
  patchPath => foldEither(
    R.compose(
      Either.Left,
      R.when(
        isDeadRefError,
        addPathIntoDeadRefError(patchPath)
      )
    ),
    Either.of,
  )
);

// :: PatchPath -> Either Error a -> Either DeadRefError a
export const composeDeadRefError = R.uncurryN(2,
  patchPath => foldEither(
    R.compose(
      Either.Left,
      R.ifElse(
        isDeadRefError,
        // update DeadRefError
        addPathIntoDeadRefError(patchPath),
        // wrap into DeadRefError
        err => createDeadRefError(err.message, [patchPath])
      )
    ),
    Either.of
  )
);

// -----------------------------------------------------------------------------

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
 * Returns a default (empty) value for a given data type.
 *
 * @function defaultValueOfType
 * @param {PIN_TYPE} t
 * @returns {*}
 */
export const defaultValueOfType = def(
  'defaultValueOfType :: DataType -> DataValue',
  R.flip(R.prop)(CONST.DEFAULT_VALUE_OF_TYPE)
);

export const canCastTypes = def(
  'canCastTypes :: DataType -> DataType -> Boolean',
  (from, to) => CONST.TYPES_COMPATIBILITY[from][to]
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
