import * as R from 'ramda';
import * as XP from 'xod-project';
import { foldMaybe, catMaybies, isAmong } from 'xod-func-tools';

import * as PAT from '../project/actionTypes';
import * as EAT from '../editor/actionTypes';

import {
  defaultValidateFunction,
  getFunctionByActionOrDefault,
  validatePatches,
  validateChangedPatches,
  validateChangedPatchesWith,
  validatePatchesGenerally,
  setAssocPolicy,
  setMergePolicy,
} from './validation.internal';
import {
  getVariadicMarkersErrorMap,
  getDeadRefErrorMap,
  validateBoundValues,
  validateLinkPins,
} from './validation.funcs';

/**
 * HOW IT WORKS AND HOW TO MAINTAIN IT
 *
 * First of all, middleware checks do we need to validate anything,
 * it calls `shallValidate` with passed into it Map of Functions
 * `shallValidateFunctions`. If it finds any function (key is an ActionType)
 * in this Map it will call it and get Boolean result (True to validate,
 * False to skip). If not found it's always True (validate).
 *
 * Then it will be validated either by `defaultValidateFunction` or one of
 * `shortValidators` and will merge new errors into previvous using one of merge
 * policies. See details below.
 *
 * There are three main points for improving validity hinting:
 *
 * 1. `shallValidateFunctions` is a Map of Functions, indexed by ActionType,
 *    where each function returns True (to validate) or False (to skip).
 *    If ActionType of dispatched Action is found in the Map it will be called
 *    with Action and Project as arguments. It provides an abillity to make a
 *    smart check "Do we need to validate it?".
 *    This Map is used in the `shallValidate` function. In case that there is no
 *    ActionType of dispatched Action, it will return True.
 *
 * 2. `shortValidators` is a Map of Functions, indexed by ActionTypes,
 *    where each function returns special object `ErrorsUpdateData`, that
 *    contains new Errors.
 *    All ActionTypes that aren't exist in this Map will be checked with
 *    default set of validators (see next point).
 *
 * 3. `defaultValidateFunctions` is a Map with only three keys: `nodes`, `pins`
 *    and `links`. Each key contains list of Functions that will validate this
 *    type of entity for some errors.
 *    This is a basic validation functions, that will used when there is no
 *    shortValidator for this ActionType.
 *    Each Function in a list should return a `Map EntityID (Map ErrorType [Error])`.
 *    Pay attention to the `ErrorType`. Conventionally, it should be equal to
 *    validate function name from `xod-project`. And it should be unique for
 *    each validate function.
 *
 * I HAVE ADDED NEW VALIDATOR INTO XOD-PROJECT, HOW TO ADD IT HERE?
 * Most important is to add it into `defaultValidateFunctions`, but you also have
 * to wrap it into another function, that will make a correct result format.
 * Open `validation.funcs.js` and add a new function here (see other validate
 * functions and do it in the similar way), scroll to the bottom and add it into
 * `defaultValidateFunctions` in the proper list.
 * If you done it right — it should work.
 *
 * I FOUND VERY SLOW CASE, HOW TO TWEAK PERFORMANCE?
 * There is two ways:
 * a). if some action could not break something in the Patch
 *     or Project, or could break it only in the specific cases,
 *     add a function (or just `R.F`) into `shallValidateFunctions`.
 * b). if action could break only specific things, add a short-circuit
 *     validate function into `shortValidators`.
 *
 * GOOD LUCK!
 */

/**
 * A map of functions, that accepts new project and action
 * to check shall we run any validations on these changes.
 * Indexed by ActionTypes.
 * Return False to skip validation.
 *
 * :: Map
 *      ActionType
 *      (
 *        Action ->
 *        Project ->
 *        Map PatchPath DeducedPinTypes ->
 *        Map PatchPath PatchErrors ->
 *        Boolean
 *      )
 */
const shallValidateFunctions = {
  [PAT.BULK_MOVE_NODES_AND_COMMENTS]: (action, project) => {
    // Could change validity only when moving terminals or `output-self` marker
    const nodeIds = action.payload.nodeIds;
    if (nodeIds.length === 0) return false;

    return R.compose(
      foldMaybe(
        false,
        R.both(
          XP.isVariadicPatch,
          R.compose(
            R.all(R.pipe(XP.getNodeType, XP.isTerminalPatchPath)),
            R.filter(R.pipe(XP.getNodeId, isAmong(action.payload.nodeIds))),
            XP.listNodes
          )
        )
      ),
      XP.getPatchByPath(action.payload.patchPath)
    )(project);
  },
  [PAT.NODE_UPDATE_PROPERTY]: (action, project) => {
    const key = action.payload.key;
    // If User changed property, not a pin value — do not validate
    if (key === 'description') return false;

    const nodeId = action.payload.id;
    const patchPath = action.payload.patchPath;

    return R.compose(
      foldMaybe(
        true, // Very strange behaviour — let's validate
        R.either(
          // If changed label — do not validate
          () => key !== 'label',
          // But if it's terminal or self Node — validate
          R.compose(
            R.either(XP.isTerminalPatchPath, XP.isTerminalSelf),
            XP.getNodeType
          )
        )
      ),
      R.chain(XP.getNodeById(nodeId)),
      XP.getPatchByPath
    )(patchPath, project);
  },
  [PAT.PATCH_DESCRIPTION_UPDATE]: R.F,
  [PAT.PATCH_NATIVE_IMPLEMENTATION_UPDATE]: R.F,
  [PAT.PROJECT_UPDATE_META]: R.F,
};

/**
 * A map of short-circuit validations and exceptions to the general rules
 * of validation.
 * For example of exception case see `PAT.PATCH_ADD`.
 *
 * Indexed by ActionTypes.
 * Should return `ErrorsUpdateData`.
 * ErrorsUpdateData :: { policy: UPDATE_ERRORS_POLICY, errors: Map PatchPath PatchErrors }
 *
 * A better and simpler way to produce this type is to apply `set*Policy` function
 * as the last step of a custom validation.
 * There are three policy rules:
 * `setMergePolicy`      - will merge new errors deeply inside previous errors.
 *                         It's handy when you check only one thing, not the whole
 *                         patch or patches.
 * `setAssocPolicy`      - will overwrite errors only for listed patch paths.
 *                         Use it when you validate some patches for all
 *                         possible errors. E.G. `validateLocalPatches`.
 * `setOverwritePolicy`  - will overwrite all errors with new ones.
 *                         Use it only when you validate the whole project,
 *                         including library patches.
 *
 * Signature for each function in this map:
 * :: Action -> Project -> Map PatchPath DeducedPinTypes -> Map PatchPath PatchErrors -> ErrorsUpdateData
 *
 * But there is a pack of utility functions, that make validation easier:
 *
 * To validate the changed Patch (that was referenced in the Action) and patches
 * that depends on the changed one, call:
 * validateChangedPatchesWith ::
 *    [NodeValidateFn] ->
 *    [PinValidateFn] ->
 *    [LinkValidateFn] ->
 *    Action ->
 *    Project ->
 *    Map PatchPath DeducedPinTypes ->
 *    Map PatchPath PatchErrors ->
 *    Map PatchPath PatchErrors
 *
 * To validate specific list of patches.
 * validatePatches ::
 *    [NodeValidateFn] ->
 *    [PinValidateFn] ->
 *    [LinkValidateFn] ->
 *    Project ->
 *    Map PatchPath DeducedPinTypes ->
 *    Map PatchPath PatchErrors ->
 *    [Patch] ->
 *    Map PatchPath PatchErrors
 *
 * To validate the changed Patch (that was referenced in the Action) and patches
 * that depends on the changed one, with default set of validate functions, call:
 * validateChangedPatches ::
 *    Action ->
 *    Project ->
 *    Map PatchPath DeducedPinTypes ->
 *    Map PatchPath PatchErrors ->
 *    Map PatchPath PatchErrors
 *
 * To validate specific patches with default set of validating functions
 * (like `validatePatches` but with predefined arrays of functions):
 * validatePatchesGenerally ::
 *    Project ->
 *    Map PatchPath DeducedPinTypes ->
 *    Map PatchPath PatchErrors ->
 *    [Patch] ->
 *    Map PatchPath PatchErrors
 *
 * To validate all local patches with default set of validating functions:
 * validateLocalPatches ::
 *    Project ->
 *    Map PatchPath DeducedPinTypes ->
 *    Map PatchPath PatchErrors ->
 *    Map PatchPath PatchErrors
 *
 *To validate all patches (including local and library) with default set:
 * validateAllPatches ::
 *    Project ->
 *    Map PatchPath DeducedPinTypes ->
 *    Map PatchPath PatchErrors ->
 *    Map PatchPath PatchErrors
 *
 * Do not forget to use `set*Policy` function!
 *
 *
 * :: Map
 *      ActionType
 *      (
 *        Action ->
 *        Project ->
 *        Map PatchPath DeducedPinTypes ->
 *        Map PatchPath PatchErrors ->
 *        ErrorsUpdateData
 *      )
 */
const shortValidators = {
  // Exceptions from general validation pipeline

  // We have to validate local patches, that depends on newly created.
  // For example, some patches has a dead reference error and User tries to fix it.
  [PAT.PATCH_ADD]: (action, project, deducedPinTypes, prevErrors) =>
    R.compose(setAssocPolicy, validateChangedPatches)(
      action.payload.patchPath,
      project,
      deducedPinTypes,
      prevErrors
    ),
  // We have to validate local patches, that depends on the just renamed one
  // cause only local patch could be renamed
  [PAT.PATCH_RENAME]: (action, project, deducedPinTypes, prevErrors) =>
    R.compose(setAssocPolicy, validateChangedPatches)(
      action.payload.newPatchPath,
      project,
      deducedPinTypes,
      prevErrors
    ),

  // Optimizations

  // Check only for valid variadics
  [PAT.BULK_MOVE_NODES_AND_COMMENTS]: (
    action,
    project,
    deducedPinTypes,
    prevErrors
  ) =>
    R.compose(
      setMergePolicy,
      validateChangedPatchesWith([getVariadicMarkersErrorMap], [], [])
    )(action.payload.patchPath, project, deducedPinTypes, prevErrors),

  // When library installed we have to check all patches inside installed library
  // And check all errored patches, cause it could have a dependency to newly installed library
  [EAT.INSTALL_LIBRARIES_COMPLETE]: (
    action,
    project,
    deducedPinTypes,
    prevErrors
  ) => {
    const newErrorsForPrevivouslyErroredPatches = R.compose(
      validatePatches(
        [getDeadRefErrorMap],
        [validateBoundValues],
        [validateLinkPins],
        project,
        deducedPinTypes,
        prevErrors
      ),
      catMaybies,
      R.map(XP.getPatchByPath(R.__, project)),
      R.keys
    )(prevErrors);

    const installedLibNames = R.compose(
      R.map(libName => {
        // TODO: Replace with `R.takeWhile` from newer Ramda
        const index = libName.indexOf('@');
        return libName.substring(0, index !== -1 ? index : libName.length);
      }),
      R.keys,
      R.path(['payload', 'projects'])
    )(action);

    const isAmongInstalledLibs = R.compose(R.anyPass, R.map(R.startsWith))(
      installedLibNames
    );

    const libErrors = R.compose(
      validatePatchesGenerally(project, deducedPinTypes, prevErrors),
      R.filter(R.pipe(XP.getPatchPath, isAmongInstalledLibs)),
      XP.listPatches
    )(project);

    return R.compose(setMergePolicy, R.merge)(
      newErrorsForPrevivouslyErroredPatches,
      libErrors
    );
  },
};

// =============================================================================
//
// API
//
// =============================================================================

// Checks shall we need to run any validations in this change or not
// :: Action -> Project -> Boolean
export const shallValidate = R.curry((action, project) =>
  R.compose(
    fn => fn(project),
    getFunctionByActionOrDefault(shallValidateFunctions, R.T)
  )(action)
);

// Validates Project
// If there is a short validator for occured action it will run this validation
// otherwise it will run a basic validation
// Result could contain
// :: Action -> Project -> ErrorsUpdateData
export const validateProject = R.curry(
  (action, newProject, deducedPinTypes, prevErrors) =>
    R.compose(
      fn => fn(newProject, deducedPinTypes, prevErrors),
      getFunctionByActionOrDefault(shortValidators, defaultValidateFunction)
    )(action, newProject, deducedPinTypes, prevErrors)
);

export { mergeErrors } from './validation.internal';
