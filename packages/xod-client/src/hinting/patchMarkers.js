import * as R from 'ramda';
import * as XP from 'xod-project';
import { foldMaybe, isAmong } from 'xod-func-tools';
import * as PAT from '../project/actionTypes';
import * as EAT from '../editor/actionTypes';

// :: Action -> Boolean
const isLoadingProjectAction = R.propSatisfies(
  isAmong([
    PAT.PROJECT_IMPORT,
    PAT.PROJECT_OPEN,
    EAT.INSTALL_LIBRARIES_COMPLETE,
  ]),
  'type'
);

// :: String -> Boolean
const oneOfInfoMarkers = isAmong([
  XP.DEPRECATED_MARKER_PATH,
  XP.UTILITY_MARKER_PATH,
]);

// :: Action -> Boolean
const doesMarkerNodeAdded = R.allPass([
  R.propEq('type', PAT.NODE_ADD),
  R.pathSatisfies(oneOfInfoMarkers, ['payload', 'typeId']),
]);

const doesMarkerNodePasted = R.allPass([
  R.propEq('type', EAT.PASTE_ENTITIES),
  R.pathSatisfies(R.any(R.pipe(XP.getNodeType, oneOfInfoMarkers)), [
    'payload',
    'entities',
    'nodes',
  ]),
]);

// :: Action -> Boolean
const doesAnyNodeDeleted = R.allPass([
  R.propEq('type', PAT.BULK_DELETE_ENTITIES),
  R.pathSatisfies(nodeList => nodeList.length > 0, ['payload', 'nodeIds']),
]);

// :: Action -> Boolean
export const shallUpdatePatchMarkers = R.anyPass([
  // Update on loading a project
  isLoadingProjectAction,
  // Update on adding a marker Node
  doesMarkerNodeAdded,
  // Update on pasting a marker Node
  doesMarkerNodePasted,
  // Update on deleting any Node
  // Without checking for deleting only marker nodes,
  // because it worst by performance
  doesAnyNodeDeleted,
]);

// :: Patch -> PatchMarkers
const getPatchMarkersForPatch = patch => ({
  utility: XP.isUtilityPatch(patch),
  deprecated: XP.isDeprecatedPatch(patch),
});

// :: StrMap PatchPath PatchMarkers -> Project -> StrMap PatchPath PatchMarkers
const getPatchMarkersForEntireProject = R.curry((oldPatchMarkers, newProject) =>
  R.compose(
    R.map(getPatchMarkersForPatch),
    R.indexBy(XP.getPatchPath),
    XP.listPatches
  )(newProject)
);

// :: StrMap PatchPath PatchMarkers -> PatchPath -> Project -> StrMap PatchPath PatchMarkers
const updatePatchMarkersForChangedPatch = R.curry(
  (oldPatchMarkers, patchPath, newProject) =>
    R.compose(
      foldMaybe(
        R.omit([patchPath], oldPatchMarkers),
        R.compose(
          R.assoc(patchPath, R.__, oldPatchMarkers),
          getPatchMarkersForPatch
        )
      ),
      XP.getPatchByPath
    )(patchPath, newProject)
);

// :: StrMap PatchPath PatchMarkers -> Project -> Action -> StrMap PatchPath PatchMarkers
export const getNewPatchMarkers = R.curry(
  (oldPatchMarkers, newProject, action) =>
    R.ifElse(
      isLoadingProjectAction,
      () => getPatchMarkersForEntireProject(oldPatchMarkers, newProject),
      R.compose(
        updatePatchMarkersForChangedPatch(oldPatchMarkers, R.__, newProject),
        R.path(['payload', 'patchPath'])
      )
    )(action)
);
