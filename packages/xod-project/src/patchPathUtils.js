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

/**
 * @function isPathLocal
 * @param {string} path
 * @returns {boolean}
 */
export const isPathLocal = R.compose(
  R.allPass([
    R.pipe(R.length, R.equals(2)),
    R.pipe(R.head, R.equals('@')),
    R.pipe(R.last, isValidIdentifier),
  ]),
  R.split('/')
);

export const getLocalPath = baseName => `@/${baseName}`;

/**
 * @function isPathLibrary
 * @param {string} path
 * @returns {boolean}
 */
export const isPathLibrary = R.compose(
  R.allPass([
    R.pipe(R.length, R.equals(3)),
    R.all(isValidIdentifier),
  ]),
  R.split('/')
);

// :: * -> Boolean
export const isValidPatchPath = R.both(
  R.is(String),
  R.either(
    isPathLocal,
    isPathLibrary
  )
);

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
 * @function isPathBuiltIn
 * @param {string} path
 * @returns {boolean}
 */
export const isPathBuiltIn = path => path.startsWith('xod/built-in/');

const dataTypes = R.values(CONST.PIN_TYPE);

// TODO: replace with R.contains for stricter checks?
const terminalPatchPathRegExp =
  new RegExp(`^xod/built-in/(input|output)-(${dataTypes.join('|')})$`);

export const isTerminalPatchPath = R.test(terminalPatchPathRegExp);

export const isInputTerminalPath = R.test(/^xod\/built-in\/input-/);

export const isOutputTerminalPath = R.test(/^xod\/built-in\/output-/);

export const getTerminalPath = R.curry(
  (direction, type) => `xod/built-in/${direction}-${type}`
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
// Internal (used only in flatten)
//

// :: String -> String
export const getInternalTerminalPath = type => `xod/internal/terminal-${type}`;

const terminalRegExp = /^xod\/built-in\/(input|output)-/;
// :: String -> String
export const convertToInternalTerminalPath = R.compose(
  getInternalTerminalPath,
  R.replace(terminalRegExp, '')
);
// :: PatchPath -> Boolean
export const isInternalTerminalNodeType = R.test(/^xod\/internal\/terminal-/);

