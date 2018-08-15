import * as R from 'ramda';
import * as XP from 'xod-project';
import { isAmong, foldMaybe, notNil } from 'xod-func-tools';
import { createIndexData } from 'xod-patch-search';

import * as PAT from '../project/actionTypes';

// PatchSearchData :: { path: String, keywords: [String], desription: String, fullDescription: string }

// =============================================================================
//
// Utils
//
// =============================================================================

// :: [PatchSearchData] -> Patch -> [PatchSearchData]
const createPatchSearchDataForPatch = R.curry((prevIndex, patch) =>
  R.compose(
    newPatchData =>
      R.compose(
        R.concat(newPatchData),
        R.reject(R.propEq('path', newPatchData[0].path))
      )(prevIndex),
    createIndexData,
    R.of
  )(patch)
);

// =============================================================================
//
// Api
//
// =============================================================================

// :: Project -> Action -> Boolean
export const shallUpdatePatchSearchData = R.curry((project, action) =>
  // Blacklist
  // Do not update index for these action types:
  R.propSatisfies(
    R.complement(
      isAmong([
        PAT.PROJECT_UPDATE_META,
        PAT.NODE_CHANGE_ARITY_LEVEL,
        PAT.NODE_RESIZE,
        PAT.COMMENT_ADD,
        PAT.COMMENT_RESIZE,
        PAT.COMMENT_SET_CONTENT,
        PAT.PATCH_NATIVE_IMPLEMENTATION_UPDATE,
        PAT.NODE_UPDATE_PROPERTY,
        PAT.BULK_MOVE_NODES_AND_COMMENTS,
        PAT.NODE_ADD,
        PAT.BULK_DELETE_ENTITIES,
        // But update for:
        // PAT.PATCH_DESCRIPTION_UPDATE,
        // PAT.PATCH_ADD,
        // PAT.PROJECT_CREATE,
        // PAT.PROJECT_OPEN,
        // PAT.PROJECT_IMPORT,
        // PAT.PATCH_RENAME,
      ])
    ),
    'type'
  )(action)
);

// :: [PatchSearchData] -> Project -> Action -> [PatchSearchData]
export const getNewPatchSearchData = R.curry((prevIndex, project, action) =>
  R.cond([
    [
      R.propEq('type', PAT.PATCH_RENAME),
      () =>
        R.compose(
          foldMaybe(
            prevIndex,
            R.compose(
              R.reject(R.propEq('path', action.payload.oldPatchPath)),
              createPatchSearchDataForPatch(prevIndex)
            )
          ),
          XP.getPatchByPath(action.payload.newPatchPath)
        )(project),
    ],
    [
      R.pathSatisfies(notNil, ['payload', 'patchPath']),
      R.compose(
        foldMaybe(prevIndex, createPatchSearchDataForPatch(prevIndex)),
        XP.getPatchByPath(R.__, project),
        R.path(['payload', 'patchPath'])
      ),
    ],
    [R.T, () => R.compose(createIndexData, XP.listPatches)(project)],
  ])(action)
);
