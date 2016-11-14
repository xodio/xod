
/**
 * Root of a project’s state tree
 * @typedef {Object} Project
 */

/**
 * @function createProject
 * @param {string} author - username of the author
 * @param {string} name - project name
 * @returns {Project} newly created project
 * @throws {Error} if `author` or `name` contain invalid characters
 */
// TODO: implement

/**
 * Gets a property of the `project`.
 *
 * Available properties are:
 *
 * - `author`
 * - `name`
 * - `path`: join of author and name, like `"xod/core"`
 *
 * @function getProjectProp
 * @param {string} prop
 * @param {Project} project
 * @returns {*} value of the property or `undefined` if not found
 */
// TODO: implement

//=============================================================================
//
// Patches
//
//=============================================================================

/**
 * @function getPatchList
 * @param {Project} project - project bundle
 * @returns {Patch[]} list of all patches not sorted in any arbitrary order
 */
// TODO: implement

/**
 * @function getPatchByPath
 * @param {string} path - full path of the patch to find, e.g. `"@/foo/bar"`
 * @param {Project} project - project bundle
 * @returns {Patch} a patch with given path or `undefined` if it wasn’t found
 */
// TODO: implement

/**
 * Inserts or updates the `patch` within the `project`.
 *
 * Matching is done by patch’es path.
 *
 * @function assocPatch
 * @param {Patch} patch - patch to insert or update
 * @param {Project} project - project to operate on
 * @returns {Project} copy of the project with the updated patch
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
 * @returns {Project} copy of the project with the patch renamed
 * @throws {Error} if the rebase is invalid
 * @see {@link validatePatchRebase}
 */
// TODO: implement
