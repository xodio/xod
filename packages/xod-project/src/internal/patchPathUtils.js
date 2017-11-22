import R from 'ramda';
import * as CONST from '../constants';

// :: String -> Boolean
export const isValidIdentifier = R.allPass([
  R.test(/[a-z0-9-]+/), // only lowercase alphanumeric and hypen
  R.complement(R.test(/^-/)), // can't start with hypen
  R.complement(R.test(/-$/)), // can't end with hypen
  R.complement(R.test(/--/)), // only one hypen in row
]);

// :: ([String] -> Boolean) -> * -> Boolean
const checkPathParts = partsChecker =>
  R.both(
    R.is(String),
    R.compose(
      partsChecker,
      R.split('/')
    )
  );

// :: String -> Boolean
export const isLocalMarker = R.equals('@');

/**
 * @function isPathLocal
 * @param {string} path
 * @returns {boolean}
 */
export const isPathLocal = checkPathParts(
  R.allPass([
    R.pipe(R.length, R.equals(2)),
    R.pipe(R.head, isLocalMarker),
    R.pipe(R.last, isValidIdentifier),
  ])
);

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

/**
 * @function isLibName
 * @param {string} path
 * @returns {boolean}
 */
export const isLibName = checkPathParts(
  R.allPass([
    R.pipe(R.length, R.equals(2)),
    R.pipe(R.head, R.complement(R.equals('@'))),
    R.all(isValidIdentifier),
  ])
);

// :: * -> Boolean
export const isValidPatchPath = R.either(isPathLocal, isPathLibrary);

export const TERMINALS_LIB_NAME = 'xod/patch-nodes';
const directions = R.values(CONST.PIN_DIRECTION);
const dataTypes = R.values(CONST.PIN_TYPE);

export const terminalPatchPathRegExp =
  new RegExp(`^${TERMINALS_LIB_NAME}/(${directions.join('|')})-(${dataTypes.join('|')})$`);

// :: String -> Boolean
export const isTerminalPatchPath = R.test(terminalPatchPathRegExp);

// :: String -> Boolean
export const isWatchPatchPath = R.test(/^xod\/core\/watch$/);

// :: LibName -> Boolean
export const isBuiltInLibName = R.equals(TERMINALS_LIB_NAME);
