import * as R from 'ramda';
import * as XP from 'xod-project';
import { isAmong, foldMaybe, maybeProp, maybePath } from 'xod-func-tools';

import * as PAT from '../project/actionTypes';

import { getActingPatchPath } from './utils';

// =============================================================================
//
// Type deduction
//
// =============================================================================

// Run type deduction only for some actions
// :: Project -> Action -> Boolean
export const shallDeduceTypes = R.curry((project, action) =>
  R.anyPass([
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
    // Always deduce for these action types:
    R.propSatisfies(
      isAmong([
        PAT.PROJECT_CREATE,
        PAT.PROJECT_OPEN,
        PAT.PROJECT_IMPORT,
        PAT.BULK_DELETE_ENTITIES,
        PAT.LINK_ADD,
      ]),
      'type'
    ),
  ])(action)
);

// :: Project -> Action -> Maybe DeducedPinTypes
const deduceTypesForPatch = R.curry((project, action) =>
  R.compose(
    R.map(XP.deducePinTypes(R.__, project)),
    R.chain(XP.getPatchByPath(R.__, project)),
    getActingPatchPath
  )(action)
);

// :: Project -> Action -> Map PatchPath DeducedPinTypes -> Map PatchPath DeducedPinTypes
export const deducePinTypesForProject = R.curry(
  (project, action, deducedTypes) => {
    if (
      isAmong(
        [PAT.PROJECT_CREATE, PAT.PROJECT_OPEN, PAT.PROJECT_IMPORT],
        action.type
      )
    ) {
      // On creating / importing / opening project — deduce all pin types
      return R.compose(
        R.reject(R.isEmpty),
        R.map(XP.deducePinTypes(R.__, project)),
        R.indexBy(XP.getPatchPath),
        XP.listPatches
      )(project);
    }

    return R.compose(
      R.reject(R.isEmpty),
      foldMaybe(deducedTypes, newDeducedTypesForPatch =>
        R.compose(
          R.assoc(R.__, newDeducedTypesForPatch, deducedTypes),
          foldMaybe('IMPOSIBLE', R.identity),
          getActingPatchPath
        )(action)
      ),
      deduceTypesForPatch
    )(project, action);
  }
);
