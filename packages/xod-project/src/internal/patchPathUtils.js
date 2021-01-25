import * as R from 'ramda';
import * as CONST from '../constants';

const EXPANDED_PATCH_NAME_SUFFIX = '-$';

export const getExpandedVariadicPatchPath = R.curry(
  (arityLevel, originalPath) =>
    [originalPath, EXPANDED_PATCH_NAME_SUFFIX, arityLevel].join('')
);

// =============================================================================
// RegExp parts
// =============================================================================

// foo2
const alphanumeric = '[a-z0-9]+';

// foo-2-bar
const alphanumericWithHypens = `${alphanumeric}(-${alphanumeric})*`;

// foo-2-bar,foo-5-bar
const alphanumericWithHypensAndCommans = `${alphanumeric}(-${alphanumeric}|,${alphanumeric})*`;

// -$5
const variadicLevel = '(-\\$\\d+)';
const maybeVariadicLevel = `${variadicLevel}{0,1}`;

// (foo-2-bar,foo-5-bar)
const types = `(\\(${alphanumericWithHypensAndCommans}\\)){0,1}`;

// foo2(foo-2-bar,foo-5-bar)-$5
const patchBaseNameRegExp = new RegExp(
  `^${alphanumericWithHypens}${types}${maybeVariadicLevel}$`
);

const specializationSuffixRegExp = new RegExp(
  `\\(${alphanumericWithHypensAndCommans}\\)`
);

const specializationPatchBasenameRegExp = new RegExp(
  `^${alphanumericWithHypens}\\(${alphanumericWithHypensAndCommans}\\)${maybeVariadicLevel}$`
);

// foo-2-bar
const identifierRegExp = new RegExp(`^${alphanumericWithHypens}$`);

const variadicBasenameRegExp = new RegExp(`${variadicLevel}$`);

// =============================================================================
// Validating functions
// =============================================================================

// :: String -> Boolean
// only lowercase alphanumeric and hypen
export const isValidIdentifier = R.test(identifierRegExp);

// :: String -> Boolean
// only lowercase alphanumeric and hypen and not more than one type specification
export const isValidPatchBasename = R.test(patchBaseNameRegExp);

// :: String -> Boolean
export const isProjectNameValid = R.either(isValidIdentifier, R.isEmpty);

// :: ([String] -> Boolean) -> * -> Boolean
const checkPathParts = partsChecker =>
  R.both(R.is(String), R.compose(partsChecker, R.split('/')));

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
    R.pipe(R.last, isValidPatchBasename),
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
    R.pipe(R.take(2), R.all(isValidIdentifier)),
    R.pipe(R.last, isValidPatchBasename),
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
    R.pipe(R.last, isValidPatchBasename),
  ])
);

// :: String -> Boolean
export const isValidPatchPath = R.either(isPathLocal, isPathLibrary);

export const TERMINALS_LIB_NAME = 'xod/patch-nodes';
const directions = R.values(CONST.PIN_DIRECTION);

export const terminalPatchPathRegExp = new RegExp(
  `.*/(${directions.join('|')})-(.*)$`
);

// :: String -> Boolean
export const isTerminalPatchPath = R.test(terminalPatchPathRegExp);

// :: String -> Boolean
export const isWatchPatchPath = R.test(/^xod\/(core|debug)\/watch$/);

// :: String -> Boolean
export const isTableLogPatchPath = R.equals(CONST.TABLELOG_NODETYPE);

// :: String -> Boolean
export const isJumperPatchPath = R.equals(CONST.JUMPER_PATCH_PATH);

// :: String -> Boolean
export const isFromBusPatchPath = R.startsWith(CONST.FROM_BUS_PATH);

// :: String -> Boolean
export const isToBusPatchPath = R.startsWith(CONST.TO_BUS_PATH);

// :: String -> Boolean
export const isBusPatchPath = R.either(isFromBusPatchPath, isToBusPatchPath);

// :: LibName -> Boolean
export const isBuiltInLibName = R.equals(TERMINALS_LIB_NAME);

// :: PatchPath -> Boolean
export const isSpecializationPatchBasename = R.test(
  specializationPatchBasenameRegExp
);

// :: PatchPath -> Boolean
export const isExpandedVariadicPatchBasename = R.both(
  R.test(variadicBasenameRegExp),
  isValidPatchBasename
);

// :: PatchPath -> String
export const getSpecializationSuffix = R.compose(
  R.defaultTo(''),
  R.nth(0),
  R.match(specializationSuffixRegExp)
);
