import * as R from 'ramda';
import * as XP from 'xod-project';
import {
  isAmong,
  foldMaybe,
  foldMaybeWith,
  maybeProp,
  maybePath,
  explodeMaybe,
} from 'xod-func-tools';

import * as PAT from '../project/actionTypes';

import { getActingPatchPath } from './actionUtils';

// =============================================================================
//
// Type deduction
//
// =============================================================================

/**
 * Returns True if pin types should be deduced and False if not.
 *
 * Run type deduction for all actions, except actions that are listed here
 * or that does not pass any other checks.
 *
 * shallDeduceTypes :: Project -> Action -> Boolean
 */
export const shallDeduceTypes = R.curry((project, action) =>
  R.anyPass([
    // Blacklist
    // Do not deduce for these action types:
    R.propSatisfies(
      R.complement(
        isAmong([
          PAT.PROJECT_UPDATE_META,
          PAT.NODE_ADD,
          PAT.NODE_CHANGE_ARITY_LEVEL,
          PAT.NODE_RESIZE,
          PAT.COMMENT_ADD,
          PAT.COMMENT_RESIZE,
          PAT.COMMENT_SET_CONTENT,
          PAT.BULK_MOVE_NODES_AND_COMMENTS,
          PAT.PATCH_ADD,
          PAT.PATCH_DESCRIPTION_UPDATE,
          PAT.PATCH_NATIVE_IMPLEMENTATION_UPDATE,
          // But deduce for:
          // PAT.PROJECT_CREATE,
          // PAT.PROJECT_OPEN,
          // PAT.PROJECT_IMPORT,
          // PAT.PATCH_RENAME,
          // PAT.BULK_DELETE_ENTITIES,
          // PAT.LINK_ADD,
          // PAT.NODE_CHANGE_SPECIALIZATION,
          // For NODE_UPDATE_PROPERTY will be a special check
        ])
      ),
      'type'
    ),
    // Deduce types only when changed value of generic pin
    R.allPass([
      R.propEq('type', PAT.NODE_UPDATE_PROPERTY),
      R.complement(R.pathEq(['payload', 'key'], 'label')),
      R.compose(
        foldMaybe(false, XP.isGenericPin),
        R.chain(patch =>
          R.compose(
            R.chain(maybeProp(action.payload.key)),
            R.map(XP.getPinsForNode(R.__, patch, project)),
            XP.getNodeById(action.payload.id)
          )(patch)
        ),
        R.chain(XP.getPatchByPath(R.__, project)),
        maybePath(['payload', 'patchPath'])
      ),
    ]),
  ])(action)
);

/**
 * Returns deduced pin types for only one patch, that are
 * changed by Action.
 * Returns Maybe, because Action cannot contain PatchPath.
 *
 * :: Project -> Action -> Maybe DeducedPinTypes
 */
const deduceTypesForPatch = R.curry((project, action) =>
  R.compose(
    R.map(patch => XP.deducePinTypes(patch, project)),
    R.chain(XP.getPatchByPath(R.__, project)),
    getActingPatchPath
  )(action)
);

/**
 * Returns deduced pin types for the whole project.
 *
 * :: Project -> Map PatchPath DeducedPinTypes
 */
const deduceTypesForProject = R.curry(project =>
  R.compose(
    R.reject(R.isEmpty),
    R.map(patch => XP.deducePinTypes(patch, project)),
    R.indexBy(XP.getPatchPath),
    XP.listPatches
  )(project)
);

/**
 * Returns deduced pin types.
 *
 * In case that Action opens/imports/creates a project — it will
 * deduce pin types for the whole project.
 * In all other cases it tries to deduce pin types only for changed Patch.
 *
 * :: Project -> Action -> Map PatchPath DeducedPinTypes -> Map PatchPath DeducedPinTypes
 */
export const deduceTypes = R.curry((project, action, deducedTypes) => {
  if (
    isAmong(
      [PAT.PROJECT_CREATE, PAT.PROJECT_OPEN, PAT.PROJECT_IMPORT],
      action.type
    )
  ) {
    // On creating / importing / opening project — deduce all pin types
    return deduceTypesForProject(project);
  }

  return R.compose(
    R.reject(R.isEmpty),
    foldMaybeWith(
      () => deduceTypesForProject(project),
      newDeducedTypesForPatch =>
        R.compose(
          R.assoc(R.__, newDeducedTypesForPatch, deducedTypes),
          explodeMaybe(
            'Impossible error, cause we already get `Just` from `deduceTypesForPatch`'
          ),
          getActingPatchPath
        )(action)
    ),
    deduceTypesForPatch
  )(project, action);
});
