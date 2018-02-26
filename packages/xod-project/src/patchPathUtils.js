import * as R from 'ramda';

import { def } from './types';
import * as Tools from './func-tools';
import * as CONST from './constants';
import {
  isPathLocal,
  isPathLibrary,
  isValidPatchPath,
  terminalPatchPathRegExp,
} from './internal/patchPathUtils';

export {
  isLocalMarker,
  isValidIdentifier,
  isPathLocal,
  isPathLibrary,
  isLibName,
  isValidPatchPath,
  isTerminalPatchPath,
  isWatchPatchPath,
  isBuiltInLibName,
  getExpandedVariadicPatchPath,
} from './internal/patchPathUtils';

// :: String -> Identifier
export const toIdentifier = R.compose(
  R.replace(/-$/g, ''),
  R.replace(/^-/g, ''),
  R.replace(/(-)\1+/g, '-'),
  R.replace(/[^a-z0-9]/gi, '-'),
  R.toLower
);

//
// general-purpose utils
//

export const getLocalPath = baseName => `@/${baseName}`;

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
 * @function getBaseName
 * @param {string} path
 * @returns {string}
 */
export const getBaseName = R.compose(
  R.last,
  R.split('/')
);

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

// :: PatchPath -> String
export const getOwnerName = R.compose(
  R.head,
  R.split('/')
);

/**
 * Converts `xod/core/something` into `@/something`,
 * `@/another-one` will be unchanged.
 */
export const convertToLocalPath = R.compose(
  getLocalPath,
  getBaseName
);

//
// Utils for terminal patches
//

const PATCH_NODES_LIB_NAME = 'xod/patch-nodes';
const dataTypes = R.values(CONST.PIN_TYPE);

// :: String -> Direction
export const getTerminalDirection = R.compose(
  R.nth(1),
  R.match(terminalPatchPathRegExp)
);

export const getTerminalDataType = def(
  'getTerminalDataType :: PatchPath -> DataType',
  R.compose(
    R.nth(2),
    R.match(terminalPatchPathRegExp)
  )
);

// :: String -> Boolean
export const isInputTerminalPath = R.compose(
  R.equals(CONST.PIN_DIRECTION.INPUT),
  getTerminalDirection
);

// :: String -> Boolean
export const isOutputTerminalPath = R.compose(
  R.equals(CONST.PIN_DIRECTION.OUTPUT),
  getTerminalDirection
);

// ::
export const getTerminalPath = R.curry((direction, type) => `${PATCH_NODES_LIB_NAME}/${direction}-${type}`);

//
// utils for variadic marker nodes
//

const variadicRegExp = new RegExp(`${PATCH_NODES_LIB_NAME}/variadic-([1-3])`);

// :: PatchPath -> Boolean
export const isVariadicPath = R.test(variadicRegExp);

// :: PatchPath -> ArityStep
export const getArityStepFromPatchPath = R.compose(
  x => parseInt(x, 10),
  R.nth(1),
  R.match(variadicRegExp)
);

// :: NonZeroNaturalNumber -> PatchPath
export const getVariadicPath = n => `${PATCH_NODES_LIB_NAME}/variadic-${n}`;

//
// utils for cast patches
//

const castTypeRegExp =
  new RegExp(`xod/core/cast-(${dataTypes.join('|')})-to-(${dataTypes.join('|')})$`);

// :: String -> Boolean
export const isCastPatchPath = R.test(castTypeRegExp);

/**
 * Returns path for casting patch
 * @function getCastPatchPath
 * @param {PIN_TYPE} typeIn
 * @param {PIN_TYPE} typeOut
 * @returns {String}
 */
export const getCastPatchPath = (typeIn, typeOut) => `xod/core/cast-${typeIn}-to-${typeOut}`;

//
// defer-* nodes
//

const deferNodeRegExp =
  new RegExp(`xod/core/defer-(${dataTypes.join('|')})$`);

// :: PatchPath -> Boolean
export const isDeferNodeType = R.test(deferNodeRegExp);

//
// constant-* nodes
//

const constantNodeRegExp =
  new RegExp(`xod/core/constant-(${dataTypes.join('|')})$`);

// :: PatchPath -> Boolean
export const isConstantNodeType = R.test(constantNodeRegExp);

//
// utils for 'internal' terminals (used only in flatten)
//

export const getInternalTerminalPath = def(
  'getInternalTerminalPath :: DataType -> PatchPath',
  type => `xod/internal/terminal-${type}`
);

// :: String -> String
export const convertToInternalTerminalPath = R.compose(
  getInternalTerminalPath,
  getTerminalDataType
);

const internalTerminalRegExp =
  new RegExp(`xod/internal/terminal-(${dataTypes.join('|')})$`);

// :: PatchPath -> Boolean
export const isInternalTerminalNodeType = R.test(internalTerminalRegExp);

export const resolvePatchPath = def(
  'resolvePatchPath :: PatchPath -> PatchPath -> PatchPath',
  R.cond([
    [(...args) => R.all(isPathLocal)(args), R.nthArg(0)],
    [(...args) => R.all(isPathLibrary)(args), R.nthArg(0)],
    [R.compose(isPathLibrary, R.nthArg(1)), (p1, p2) => `${getLibraryName(p2)}/${getBaseName(p1)}`],
    [R.compose(isPathLocal, R.nthArg(1)), R.nthArg(0)],
  ])
);
