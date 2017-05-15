import R from 'ramda';

import * as Tools from './func-tools';
import * as CONST from './constants';

// :: String -> Boolean
export const isValidIdentifier = R.allPass([
  R.test(/[a-z0-9-]+/), // only lowercase alphanumeric and hypen
  R.complement(R.test(/^-/)), // can't start with hypen
  R.complement(R.test(/-$/)), // can't end with hypen
  R.complement(R.test(/--/)), // only one hypen in row
]);

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

// :: ([String] -> Boolean) -> * -> Boolean
const checkPathParts = partsChecker =>
  R.both(
    R.is(String),
    R.compose(
      partsChecker,
      R.split('/')
    )
  );

/**
 * @function isPathLocal
 * @param {string} path
 * @returns {boolean}
 */
export const isPathLocal = checkPathParts(
  R.allPass([
    R.pipe(R.length, R.equals(2)),
    R.pipe(R.head, R.equals('@')),
    R.pipe(R.last, isValidIdentifier),
  ])
);

export const getLocalPath = baseName => `@/${baseName}`;

/**
 * @function isPathLibrary
 * @param {string} path
 * @returns {boolean}
 */
export const isPathLibrary = checkPathParts(
  R.allPass([
    R.pipe(R.length, R.equals(3)),
    R.all(isValidIdentifier),
  ])
);

// :: * -> Boolean
export const isValidPatchPath = R.either(isPathLocal, isPathLibrary);

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

//
// Utils for terminal patches
//

const TERMINALS_LIB_NAME = 'xod/patch-nodes';

const directions = R.values(CONST.PIN_DIRECTION);
const dataTypes = R.values(CONST.PIN_TYPE);

const terminalPatchPathRegExp =
  new RegExp(`^${TERMINALS_LIB_NAME}/(${directions.join('|')})-(${dataTypes.join('|')})$`);

// :: String -> Direction
export const getTerminalDirection = R.compose(
  R.nth(1),
  R.match(terminalPatchPathRegExp)
);

// :: String -> DataType
export const getTerminalDataType = R.compose(
  R.nth(2),
  R.match(terminalPatchPathRegExp)
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

// :: String -> Boolean
export const isTerminalPatchPath = R.test(terminalPatchPathRegExp);

// ::
export const getTerminalPath = R.curry((direction, type) => `${TERMINALS_LIB_NAME}/${direction}-${type}`);


//
// utils for built-in patches
//

export const isPathBuiltIn = R.either(
  R.equals(CONST.NOT_IMPLEMENTED_IN_XOD_PATH),
  isTerminalPatchPath
);

//
// utils for cast patches
//

const castTypeRegExp =
  new RegExp(`xod/core/cast-(${dataTypes.join('|')})-to-(${dataTypes.join('|')})$`);

// :: String -> Boolean
export const isCastPatchPath = R.test(castTypeRegExp);

/**
 * Returns path for casting patch
 * @private
 * @function getCastPatchPath
 * @param {PIN_TYPE} typeIn
 * @param {PIN_TYPE} typeOut
 * @returns {String}
 */
export const getCastPatchPath = (typeIn, typeOut) => `xod/core/cast-${typeIn}-to-${typeOut}`;


//
// utils for 'internal' terminals (used only in flatten)
//

// :: String -> String
export const getInternalTerminalPath = type => `xod/internal/terminal-${type}`;

// :: String -> String
export const convertToInternalTerminalPath = R.compose(
  getInternalTerminalPath,
  getTerminalDataType
);

const internalTerminalRegExp =
  new RegExp(`xod/internal/terminal-(${dataTypes.join('|')})$`);

// :: PatchPath -> Boolean
export const isInternalTerminalNodeType = R.test(internalTerminalRegExp);
