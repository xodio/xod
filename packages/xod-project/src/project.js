import R from 'ramda';
import { Either, Maybe } from 'ramda-fantasy';

import * as Utils from './utils';
import * as Patch from './patch';

/**
 * Root of a project’s state tree
 * @typedef {Object} Project
 */

 /**
  * Archived project state
  * @typedef {Object} Xodball
  */

/**
 * @function createProject
 * @returns {Project} newly created project
 */
export const createProject = () => ({
  authors: [],
  description: '',
  license: '',
  patches: {},
});

/**
 * @function getProjectDescription
 * @param {Project} project
 * @returns {string}
 */
export const getProjectDescription = R.propOr('', 'description');

/**
 * @function setProjectDescription
 * @param {string} description
 * @param {Project} project
 * @returns {Either<Error|Project>}
 */
export const setProjectDescription = R.ifElse(
  R.is(String),
  Utils.assocRight('description'),
  Utils.leaveError('Project description should be a string.')
);

/**
 * @function getProjectAuthors
 * @param {Project} project
 * @returns {string[]}
 */
export const getProjectAuthors = R.propOr([], 'authors');

/**
 * @function setProjectAuthors
 * @param {string[]} authors
 * @param {Project} project
 * @returns {Either<Error|Project>}
 */
export const setProjectAuthors = R.ifElse(
  Utils.isArrayOfStrings,
  Utils.assocRight('authors'),
  Utils.leaveError('Project authors should be a list of string.')
);

/**
 * @function getProjectLicense
 * @param {Project} project
 * @returns {string}
 */
export const getProjectLicense = R.propOr('', 'license');

/**
 * @function setProjectLicense
 * @param {string} value
 * @param {Project} project
 * @returns {Project}
 */
export const setProjectLicense = R.ifElse(
   R.is(String),
   Utils.assocRight('license'),
   Utils.leaveError('Project license should be a string.')
 );

/**
 * Converts project into Xodball: remove library patches, replace it with dependency list and etc.
 *
 * This functions validates project before archiving it and may return error of validation.
 *
 * @function archiveProject
 * @param {Project} project
 * @returns {Either<Error|Xodball>}
 */
 // TODO: implement

 /**
  * Checks `project` for validity.
  *
  * Check would fail in either case:
  * - JSON Schema test fails
  * - one of other validate function fails
  *
  * @function validateProject
  * @param {Project} project - project to operate on
  * @returns {Either<Error|Project>} validation result
  */
 // TODO: implement

// =============================================================================
//
// Patches
//
// =============================================================================

/**
 * @function listPatches
 * @param {Project} project - project bundle
 * @returns {Patch[]} list of all patches not sorted in any arbitrary order
 */
export const listPatches = R.propOr([], 'patches');

/**
 * Return a list of local patches (excluding external libraries)
 *
 * @function listLocalPatches
 * @param {Project} project
 * @returns {Patch[]}
 */
export const listLocalPatches = R.compose(
  R.filter(Patch.isPatchLocal),
  listPatches
);

/**
 * Return a list of library patches (excluding local patches)
 *
 * @function listLibraryPatches
 * @param {Project} project
 * @returns {Patch[]}
 */
export const listLibraryPatches = R.compose(
  R.filter(Patch.isPatchLibrary),
  listPatches
);

/**
 * @function getPatchByPath
 * @param {string} path - full path of the patch to find, e.g. `"@/foo/bar"`
 * @param {Project} project - project bundle
 * @returns {Maybe<Nothing|Patch>} a patch with given path or Null if it wasn’t found
 */
export const getPatchByPath = R.curry(
  (path, project) =>
  R.compose(
    Maybe,
    R.propOr(null, path),
    listPatches
  )(project)
);

/**
 * Inserts or updates the `patch` within the `project`.
 *
 * Matching is done by patch’es path.
 *
 * @function assocPatch
 * @param {Patch} patch - patch to insert or update
 * @param {Project} project - project to operate on
 * @returns {Either<Error|Project>} copy of the project with the updated patch
 */
// TODO: implement

/**
 * Removes the `patch` from the `project`.
 *
 * Does nothing if the `patch` not found in `project`.
 *
 * @function dissocPatch
 * @param {Patch} patch - patch to remove
 * @param {Project} project - project to operate on
 * @returns {Project} copy of the project with the patch removed
 */
// TODO: implement

/**
 * Checks if a `patch` could be safely renamed given a new path.
 *
 * Check would fail in either case:
 * - `newPath` contains invalid characters
 * - `patch` is not in the `project`
 * - another patch with same path already exist
 *
 * @function validatePatchRebase
 * @param {string} newPath - new label for the patch
 * @param {PatchOrPath} patch - patch to rename
 * @param {Project} project - project to operate on
 * @returns {Validity} validation result
 */
// TODO: implement

/**
 * Updates the `patch` in the `project` relocating it to a new path.
 *
 * Note that rebase will affect patch’es path that is used as its ID.
 *
 * All references to the patch from other patches will be set to
 * the new path.
 *
 * @function rebasePatch
 * @param {string} newPath - new label for the patch
 * @param {PatchOrPath} patch - patch to rename
 * @param {Project} project - project to operate on
 * @returns {Either<Error|Project>} copy of the project with the patch renamed
 * @see {@link validatePatchRebase}
 */
// TODO: implement

// =============================================================================
//
// Virtual directories
//
// =============================================================================

/**
 * Returns list of patches in the specified directory.
 *
 * @function lsPatches
 * @param {string} path
 * @param {Project} project
 * @returns {Patch[]}
 */

/**
 * Returns list of directories in the specified directory.
 *
 * @function lsDirs
 * @param {string} path
 * @param {Project} project
 * @returns {string[]}
 */
