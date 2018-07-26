import * as R from 'ramda';
import * as XP from 'xod-project';
import { foldMaybeWith } from 'xod-func-tools';

import { defaultValidateFunctions } from './validation.funcs';
import { getActingPatchPath } from './errorCollectors';

// PinValidateFn :: Patch -> Project -> Map PinKey PinErrors
// NodeValidateFn :: Patch -> Project -> Map NodeId NodeErrors
// LinkValidateFn :: Link -> Patch -> Project -> Map PatchPath DeducedPinTypes -> [Error]
// ErrorsUpdateData :: { policy: UPDATE_ERRORS_POLICY, errors: Map PatchPath PatchErrors }

// Merging policies
// See a full description below or in the `validation.js`
export const UPDATE_ERRORS_POLICY = {
  OVERWRITE: 'OVERWRITE_ERRORS', // Overwrites whole object with new one
  MERGE: 'MERGE_ERRORS', // Merges deeply new object into previvous one
  ASSOC: 'ASSOC_ERRORS', // Overwrites only listed patch paths
};

// =============================================================================
//
// Utility functions to run validations properly
//
// =============================================================================

// ObjectOrArray :: [a] | StrMap ObjectOrArray
// :: [StrMap ObjectOrArray] -> StrMap ObjectOrArray
const mergeAllDeepWithConcat = R.reduce(R.mergeDeepWith(R.concat), {});

// :: [NodeValidateFn] -> Patch -> Project -> Map PatchPath PatchErrors -> Map NodeId NodeErrors
const validateNodes = R.curry(
  (nodeValidators, pinValidators, patch, project, prevErrors) =>
    R.compose(
      R.map(R.merge({ errors: {}, pins: {} })),
      // :: Map NodeId NodeErrors
      nodeErrorsMap =>
        R.compose(
          R.mergeDeepWith(R.concat, nodeErrorsMap),
          // :: Map NodeId { pins: Map PinKey (Map ErrorType (Maybe [Error])) }
          R.map(R.objOf('pins')),
          R.map(node =>
            R.compose(
              mergeAllDeepWithConcat,
              R.map(fn => fn(patch, project, node, prevErrors))
            )(pinValidators)
          ),
          R.indexBy(XP.getNodeId),
          XP.listNodes
        )(patch),
      // :: Map NodeId { errors: Map ErrorType [Error] }
      R.map(R.objOf('errors')),
      // :: Map NodeId (Map ErrorType [Error])
      mergeAllDeepWithConcat,
      R.map(fn => fn(patch, project, prevErrors))
    )(nodeValidators)
);

// :: [LinkValidateFn] -> Patch -> Project -> Map PatchPath DeducedPinTypes -> Map PatchPath PatchErrors -> Map LinkId LinkErrors
const validateLinks = R.curry(
  (validators, patch, project, allDeducedPinTypes, prevErrors) =>
    R.compose(
      mergeAllDeepWithConcat,
      R.map(link =>
        R.compose(
          R.map(R.objOf('errors')),
          mergeAllDeepWithConcat,
          R.map(fn => fn(link, patch, project, allDeducedPinTypes, prevErrors))
        )(validators)
      ),
      XP.listLinks
    )(patch)
);

// :: [NodeValidateFn] -> [PinValidateFn] -> Patch -> Project -> Map PatchPath PatchErrors -> { nodes: Map NodeId NodeErrors }
const getNodeErrors = R.curry(
  (nodeValidators, pinValidators, patch, project, prevErrors) =>
    R.compose(R.objOf('nodes'), validateNodes(nodeValidators, pinValidators))(
      patch,
      project,
      prevErrors
    )
);
// :: [LinkValidateFn] -> Patch -> Project -> Map PatchPath DeducedPinTypes -> Map PatchPath PatchErrors -> { links: Map LinkId LinkErrors }
const getLinkErrors = R.curry(
  (linkValidators, patch, project, allDeducedPinTypes, prevErrors) =>
    R.compose(R.objOf('links'), validateLinks(linkValidators))(
      patch,
      project,
      allDeducedPinTypes,
      prevErrors
    )
);

// :: PatchPath -> [Patch] -> [Patch]
const filterPatchAndDependentPatchesByPatchPath = R.curry(
  (patchPath, patches) =>
    R.filter(
      R.either(
        XP.hasNodeWithType(patchPath),
        R.pipe(XP.getPatchPath, R.equals(patchPath))
      ),
      patches
    )
);

const propChildrenEmpty = R.propSatisfies(R.pipe(R.values, R.all(R.isEmpty)));
const propEmpty = R.propSatisfies(R.isEmpty);

// :: { errors: Map ErrorType [Error] } -> Boolean
const haveNoErrors = R.either(propEmpty('errors'), propChildrenEmpty('errors'));

// :: { pins: Map PinKey (Map ErrorType [Error]) } -> Boolean
const haveNoPinErrors = R.either(
  propEmpty('pins'),
  R.either(
    propChildrenEmpty('pins'),
    R.compose(R.all(propChildrenEmpty('errors')), R.values, R.prop('pins'))
  )
);

// :: { nodes: Map NodeId { errors: Map ErrorType [Error], pins: Map PinKey (Map ErrorType [Error]) } } -> Boolean
const haveNoNodeErrors = R.either(
  propEmpty('nodes'),
  R.compose(
    R.all(R.both(haveNoErrors, haveNoPinErrors)),
    R.values,
    R.prop('nodes')
  )
);

// :: { links: Map LinkId { errors: Map ErrorType [Error] } } -> Boolean
const haveNoLinkErrors = R.either(
  propEmpty('links'),
  R.compose(R.all(haveNoErrors), R.values, R.prop('links'))
);

// :: PatchErrors -> Boolean
const haveNoPatchErrors = R.allPass([
  haveNoErrors,
  haveNoNodeErrors,
  haveNoLinkErrors,
]);

// =============================================================================
//
// API
//
// =============================================================================

// :: Map ActionType (Action -> * -> a) -> (Action -> * -> a) -> Action -> (Action -> * -> a)
export const getFunctionByActionOrDefault = R.curry((fnMap, defFn, action) =>
  R.compose(
    fn => R.partial(fn, [action]),
    R.propOr(defFn, R.__, fnMap),
    R.prop('type')
  )(action)
);

/**
 * `set*Policy` functions wraps validation result (Map PatchPath PatchErrors)
 * into another Object with special key `policy`, which will tell `mergeErrors`
 * function how to merge it with previvous errors.
 *
 * `setOverwritePolicy`  - will overwrite all errors with new ones.
 *                         Use it only when you validate the whole project,
 *                         including library patches.
 */
// :: Map PatchPath PatchErrors -> { policy: UPDATE_ERRORS_POLICY, errors: Map PatchPath PatchErrors }
export const setOverwritePolicy = errors => ({
  policy: UPDATE_ERRORS_POLICY.OVERWRITE,
  errors,
});
/**
 * `setMergePolicy`      - will merge new errors deeply inside previous errors.
 *                         It's handy when you check only one thing, not the whole
 *                         patch or patches.
 */
// :: Map PatchPath PatchErrors -> { policy: UPDATE_ERRORS_POLICY, errors: Map PatchPath PatchErrors }
export const setMergePolicy = errors => ({
  policy: UPDATE_ERRORS_POLICY.MERGE,
  errors,
});
/**
 * `setAssocPolicy`      - will overwrite errors only for listed patch paths.
 *                         Use it when you validate some patches for all
 *                         possible errors.
 *                         E.G. `validateLocalPatches` or `validateChangedPatches`.
 */
// :: Map PatchPath PatchErrors -> { policy: UPDATE_ERRORS_POLICY, errors: Map PatchPath PatchErrors }
export const setAssocPolicy = errors => ({
  policy: UPDATE_ERRORS_POLICY.ASSOC,
  errors,
});

/**
 * Validates specific list of Patches with specific validate functions for each
 * type of entities: Nodes, Pins, Links.
 * Returns `Map PatchPath PatchErrors`
 * So, before pass it into `mergeErrors`, you have to wrap it using `set*Policy`.
 *
 * validatePatches ::
 *   [NodeValidateFn] ->
 *   [PinValidateFn] ->
 *   [LinkValidateFn] ->
 *   Project ->
 *   Map PatchPath DeducedPinTypes ->
 *   Map PatchPath PatchErrors ->
 *   [Patch] ->
 *   Map PatchPath PatchErrors
 */
export const validatePatches = R.curry(
  (
    nodeValidators,
    pinValidators,
    linkValidators,
    project,
    allDeducedPinTypes,
    prevErrors,
    patches
  ) =>
    R.compose(
      R.map(patch =>
        mergeAllDeepWithConcat([
          { errors: {}, nodes: {}, links: {} },
          getLinkErrors(
            linkValidators,
            patch,
            project,
            allDeducedPinTypes,
            prevErrors
          ),
          getNodeErrors(
            nodeValidators,
            pinValidators,
            patch,
            project,
            prevErrors
          ),
        ])
      ),
      R.indexBy(XP.getPatchPath)
    )(patches)
);

/**
 * Validates specific list of Patches with default set of validate functions.
 * Returns `Map PatchPath PatchErrors`
 * So, before pass it into `mergeErrors`, you have to wrap it using `set*Policy`.
 *
 * validatePatchesGenerally ::
 *    Project ->
 *    Map PatchPath DeducedPinTypes ->
 *    Map PatchPath PatchErrors ->
 *    [Patch] ->
 *    Map PatchPath PatchErrors
 */
export const validatePatchesGenerally = validatePatches(
  defaultValidateFunctions.nodes,
  defaultValidateFunctions.pins,
  defaultValidateFunctions.links
);

/**
 * Validates all local Patches with default set of validate functions.
 * Returns `Map PatchPath PatchErrors`
 * So, before pass it into `mergeErrors`, you have to wrap it using `set*Policy`.
 *
 * validateLocalPatches ::
 *    Project ->
 *    Map PatchPath DeducedPinTypes ->
 *    Map PatchPath PatchErrors ->
 *    Map PatchPath PatchErrors
 */
export const validateLocalPatches = R.curry(
  (project, allDeducedPinTypes, prevErrors) =>
    R.compose(
      validatePatchesGenerally(project, allDeducedPinTypes, prevErrors),
      XP.listLocalPatches
    )(project)
);

/**
 * Validates all Patches (including libs) with default set of validate functions.
 * Returns `Map PatchPath PatchErrors`
 * So, before pass it into `mergeErrors`, you have to wrap it using `set*Policy`.
 *
 * validateAllPatches ::
 *    Project ->
 *    Map PatchPath DeducedPinTypes ->
 *    Map PatchPath PatchErrors ->
 *    Map PatchPath PatchErrors
 */
export const validateAllPatches = R.curry(
  (project, allDeducedPinTypes, prevErrors) =>
    R.compose(
      validatePatchesGenerally(project, allDeducedPinTypes, prevErrors),
      XP.listPatches
    )(project)
);

/**
 * Validates the changed Patch and patches, that depends on the changed one.
 * If there is no PatchPath in the action payload it will throw an error.
 * It's an utility function for short-circuits and it should not been used
 * for Actions, that does not contain `PatchPath`.
 *
 * validateChangedPatchesWith ::
 *    [NodeValidateFn] ->
 *    [PinValidateFn] ->
 *    [LinkValidateFn] ->
 *    PatchPath ->
 *    Project ->
 *    Map PatchPath DeducedPinTypes ->
 *    Map PatchPath PatchErrors ->
 *    Map PatchPath PatchErrors
 */
export const validateChangedPatchesWith = R.curry(
  (
    nodeValidators,
    pinValidators,
    linkValidators,
    changedPatchPath,
    project,
    allDeducedPinTypes,
    prevErrors
  ) => {
    const validateFn = validatePatches(
      [R.always({}), ...nodeValidators],
      [R.always({}), ...pinValidators],
      [R.always([]), ...linkValidators]
    );

    return R.compose(
      validateFn(project, allDeducedPinTypes, prevErrors),
      filterPatchAndDependentPatchesByPatchPath(changedPatchPath),
      XP.listPatches
    )(project);
  }
);

/**
 * Validates the changed Patch and patches, that depends on the changed one
 * with default set of validate functions.
 * If there is no PatchPath in the action payload it will throw an error.
 * It's an utility function for short-circuits and it should not been used
 * for Actions, that does not contain `PatchPath`.
 *
 * validateChangedPatches ::
 *    [NodeValidateFn] ->
 *    [PinValidateFn] ->
 *    [LinkValidateFn] ->
 *    PatchPath ->
 *    Project ->
 *    Map PatchPath DeducedPinTypes ->
 *    Map PatchPath PatchErrors ->
 *    Map PatchPath PatchErrors
 */
export const validateChangedPatches = validateChangedPatchesWith(
  defaultValidateFunctions.nodes,
  defaultValidateFunctions.pins,
  defaultValidateFunctions.links
);

/**
 * Validates only changed Patch, if Action changed only one Patch.
 * If it has any errors — it will check then local patches (if changed Patch was
 * in a local project) or check all patches (if changed Patch was in a library).
 *
 * It automatically sets merge policy depending on list of changed Patches.
 *
 * It will be called in middleware on each Action, that changed Project, if
 * there will no short-circuit validation function and validation should not be
 * skipped for this ActionType.
 *
 * defaultValidateFunction ::
 *    Action ->
 *    Project ->
 *    Map PatchPath DeducedPinTypes ->
 *    Map PatchPath PatchErrors ->
 *    ErrorsUpdateData
 */
export const defaultValidateFunction = (
  action,
  project,
  allDeducedPinTypes,
  prevErrors
) =>
  foldMaybeWith(
    // No PatchPath -> Validate All
    () =>
      R.compose(setOverwritePolicy, validateAllPatches)(
        project,
        allDeducedPinTypes,
        prevErrors
      ),
    // PatchPath exists -> Validate this Patch first
    patchPath =>
      R.compose(
        setAssocPolicy,
        validatePatchesGenerally(project, allDeducedPinTypes, prevErrors),
        filterPatchAndDependentPatchesByPatchPath(patchPath),
        XP.listPatches
      )(project),
    // Try to get PatchPath from Action
    getActingPatchPath(action)
  );

/**
 * Merges new errors (which wrapped with `set*Policy` function) with
 * previvous one and omits PatchPaths without errors.
 *
 * mergeErrors ::
 *    Map PatchPath PatchErrors ->
 *    ErrorsUpdateData ->
 *    Map PatchPath PatchErrors
 */
export const mergeErrors = R.curry((prevErrors, nextErrors) =>
  R.compose(
    R.reject(haveNoPatchErrors),
    R.cond([
      [
        () => R.propEq('policy', UPDATE_ERRORS_POLICY.MERGE, nextErrors),
        R.mergeDeepRight(prevErrors),
      ],
      [
        () => R.propEq('policy', UPDATE_ERRORS_POLICY.ASSOC, nextErrors),
        R.compose(
          R.reduce(
            (acc, [patchPath, patchErrors]) =>
              R.assoc(patchPath, patchErrors, acc),
            prevErrors
          ),
          R.toPairs
        ),
      ],
      [R.T, R.identity],
    ]),
    R.prop('errors')
  )(nextErrors)
);
