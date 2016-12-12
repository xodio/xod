import R from 'ramda';
import { Either, Maybe } from 'ramda-fantasy';

import * as CONST from './constants';
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
 * @returns {Project}
 */
export const setProjectDescription = Utils.assocString('description');

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
 * @returns {Project}
 */
export const setProjectAuthors = R.useWith(
  R.assoc('authors'),
  [
    R.ifElse(
      R.is(Array),
      R.map(String),
      R.compose(
        R.flip(R.append)([]),
        String
      )
    ),
    R.identity,
  ]
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
export const setProjectLicense = Utils.assocString('license');

/**
 * Converts project into Xodball: remove library patches, replace it with dependency list and etc.
 *
 * This functions validates project before archiving it and may return error of validation.
 *
 * @function archiveProject
 * @param {Project} project
 * @returns {Either<Error|Xodball>}
 */
export const archiveProject = () => {};

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
export const validateProject = () => {};

// =============================================================================
//
// Patches
//
// =============================================================================

/**
 * @private
 * @function getPatches
 * @param {Project} project - project bundle
 * @returns {Patches} object with patches stored by path
 */
export const getPatches = R.propOr({}, 'patches');

/**
 * @function listPatches
 * @param {Project} project - project bundle
 * @returns {Patch[]} list of all patches not sorted in any arbitrary order
 */
export const listPatches = R.compose(
  R.values,
  getPatches
);

/**
 * Return a list of local patches (excluding external libraries)
 *
 * @function listLocalPatches
 * @param {Project} project
 * @returns {Patch[]}
 */
export const listLocalPatches = R.compose(
  R.filter(
    R.propSatisfies(Utils.isPathLocal, 'path')
  ),
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
  R.filter(
    R.propSatisfies(Utils.isPathLibrary, 'path')
  ),
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
    getPatches
  )(project)
);

/**
 *
 * @function getPatchPath
 * @param {Patch} patch
 * @param {Project} project
 * @returns {Either<Error|string>} path
 */
export const getPatchPath = R.curry(
  (patch, project) =>
  R.compose(
    R.ifElse(
      R.isNil,
      Utils.leaveError(CONST.ERROR.PATCH_NOT_FOUND),
      Either.Right
    ),
    R.chain(R.path([0, 0])),
    Maybe,
    R.filter(p => p[1] === patch),
    R.toPairs,
    getPatches
  )(project)
);

/**
 * Inserts or updates the `patch` within the `project`.
 *
 * Matching is done by patch’es path.
 *
 * @function assocPatch
 * @param {string} path
 * @param {Patch} patch - patch to insert or update
 * @param {Project} project - project to operate on
 * @returns {Either<Error|Project>} copy of the project with the updated patch
 */
// @TODO: Add validating of nodes and links
export const assocPatch = R.curry((path, patch, project) =>
  Utils.validatePath(path).chain(
    validPath => Patch.validatePatch(patch).map(
      R.assocPath(['patches', validPath], R.__, project)
    )
  )
);

/**
 * Removes the `patch` from the `project`.
 *
 * Does nothing if the `patch` not found in `project`.
 *
 * @function dissocPatch
 * @param {string} path - path to patch to remove
 * @param {Project} project - project to operate on
 * @returns {Project} copy of the project with the patch removed
 */
export const dissocPatch = R.curry((path, project) =>
  R.dissocPath(['patches', path], project)
);

/**
 * Checks if a `patch` could be safely renamed given a new path.
 *
 * Check would fail in either case:
 * - `newPath` contains invalid characters
 * - `patch` is not in the `project`
 * - another patch with same path already exist
 *
 * @function validatePatchRebase
 * @param {string} newPath - new path for the patch
 * @param {string} oldPath - path to patch to rename
 * @param {Project} project - project to operate on
 * @returns {Either<Error|Project>} validation result
 */
export const validatePatchRebase = R.curry(
  (newPath, oldPath, project) => {
    const validPath = Utils.validatePath(newPath);
    if (validPath.isLeft) { return validPath; }

    const pathIsOccupied = getPatchByPath(newPath, project).isJust;
    if (pathIsOccupied) { return Utils.leaveError(CONST.ERROR.PATCH_PATH_OCCUPIED)(); }

    const patch = getPatchByPath(oldPath, project);
    if (patch.isNothing) { return Utils.leaveError(CONST.ERROR.PATCH_NOT_FOUND_BY_PATH)(); }

    return Either.of(project);
  }
);

/**
 * Updates the `patch` in the `project` relocating it to a new path.
 *
 * Note that rebase will affect patch’es path that is used as its ID.
 *
 * All references to the patch from other patches will be set to
 * the new path.
 *
 * @function rebasePatch
 * @param {string} newPath - new path for the patch
 * @param {string} oldPath - old path for the patch
 * @param {Project} project - project to operate on
 * @returns {Either<Error|Project>} copy of the project with the patch renamed
 * @see {@link validatePatchRebase}
 */
export const rebasePatch = R.curry(
  (newPath, oldPath, project) =>
    validatePatchRebase(newPath, oldPath, project)
      .map(
        proj => {
          const patch = getPatchByPath(oldPath, proj);
          const assocThatPatch = patch.chain(R.assocPath(['patches', newPath]));

          // @TODO: Think about refactoring that piece of code :-D
          // Patch -> Patch
          const updateReferences = R.when(
            R.has('nodes'),
            R.evolve({
              nodes: R.mapObjIndexed(
                R.when(
                  R.propEq('type', oldPath),
                  R.assoc('type', newPath)
                )
              ),
            })
          );

          return R.compose(
            R.evolve({
              patches: R.mapObjIndexed(updateReferences),
            }),
            R.dissocPath(['patches', oldPath]),
            assocThatPatch
          )(proj);
        }
      )
);

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
export const lsPatches = R.curry(
  (path, project) => {
    const slashedPath = Utils.addSlashToEnd(path);
    const reg = new RegExp(`^${slashedPath}([a-zA-Z0-9_-])+$`);

    return R.compose(
      R.pickBy((val, key) => R.test(reg, key)),
      getPatches
    )(project);
  }
);

/**
 * Returns list of directories in the specified directory.
 *
 * @function lsDirs
 * @param {string} path
 * @param {Project} project
 * @returns {string[]}
 */
export const lsDirs = R.curry(
  (path, project) => {
    const slashedPath = Utils.addSlashToEnd(path);
    const reg = new RegExp(`^${slashedPath}([a-zA-Z0-9_-]+)(?:/).*`);

    return R.compose(
      R.uniq,
      R.chain(
        R.compose(
          R.nth(1),
          R.match(reg)
        )
      ),
      R.filter(R.test(reg)),
      R.keys,
      getPatches
    )(project);
  }
);
