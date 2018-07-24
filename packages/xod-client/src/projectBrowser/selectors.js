import * as R from 'ramda';
import { createSelector } from 'reselect';

import * as XP from 'xod-project';

import { createMemoizedSelector } from '../utils/selectorTools';
import * as ProjectSelectors from '../project/selectors';
import * as HintingSelectors from '../hinting/selectors';
import { isPatchDeadTerminal } from '../project/utils';

export const getProjectBrowser = R.prop('projectBrowser');

export const shouldShowDeprecatedPatches = createSelector(
  getProjectBrowser,
  R.path(['filters', 'deprecated'])
);

export const shouldShowUtilityPatches = createSelector(
  getProjectBrowser,
  R.path(['filters', 'utility'])
);

export const getSelectedPatchPath = createSelector(
  getProjectBrowser,
  R.prop('selectedPatchPath')
);

export const getProjectName = createSelector(
  ProjectSelectors.getProject,
  R.compose(R.when(R.isEmpty, R.always('My Project')), XP.getProjectName)
);

// :: HintingErrors -> Patch -> Patch
const markDeadPatches = R.curry((errors, patch) =>
  R.pipe(XP.getPatchPath, R.has(R.__, errors), R.assoc('dead', R.__, patch))(
    patch
  )
);

// :: Patch -> Patch
const markDeprecatedPatches = patch =>
  R.assoc('isDeprecated', XP.isDeprecatedPatch(patch), patch);

// :: Patch -> Patch
const markUtilityPatches = patch =>
  R.assoc('isUtility', XP.isUtilityPatch(patch), patch);

const getLocalPatchesList = createSelector(
  ProjectSelectors.getProject,
  XP.listLocalPatches
);

const patchListChangesKeepBrowserLook = XP.patchListEqualsBy(
  R.both(XP.sameCategoryMarkers, XP.samePatchValidity)
);

const libChangesKeepBrowserLook = R.either(
  (prev, next) => prev === next,
  (prev, next) => {
    const prevLibPatches = XP.listLibraryPatches(prev);
    const nextLibPatches = XP.listLibraryPatches(next);
    return XP.patchListEqualsBy(
      XP.samePatchValidity,
      prevLibPatches,
      nextLibPatches
    );
  }
);

export const getLocalPatches = createMemoizedSelector(
  [
    getLocalPatchesList,
    ProjectSelectors.getProject,
    HintingSelectors.getErrors,
  ],
  [patchListChangesKeepBrowserLook, libChangesKeepBrowserLook, R.equals],
  (patches, project, errors) =>
    R.compose(
      R.sortBy(XP.getPatchPath),
      R.map(
        R.compose(
          markUtilityPatches,
          markDeprecatedPatches,
          markDeadPatches(errors)
        )
      )
    )(patches)
);

// TODO: this is not actually label anymore
export const getSelectedPatchLabel = createSelector(
  [ProjectSelectors.getProject, getSelectedPatchPath],
  (project, selectedPatchPath) =>
    selectedPatchPath
      ? XP.getPatchByPath(selectedPatchPath, project)
          .map(R.pipe(XP.getPatchPath, XP.getBaseName))
          .getOrElse('')
      : ''
);

const getLibraryPatchesList = createSelector(
  ProjectSelectors.getProject,
  XP.listLibraryPatches
);

export const getLibs = createMemoizedSelector(
  [
    getLibraryPatchesList,
    HintingSelectors.getErrors,
    ProjectSelectors.getProject,
  ],
  [R.equals, R.equals],
  (patches, project, errors) =>
    R.compose(
      R.map(R.sort(R.ascend(XP.getPatchPath))),
      R.groupBy(R.pipe(XP.getPatchPath, XP.getLibraryName)),
      R.reject(isPatchDeadTerminal),
      R.map(
        R.compose(
          markUtilityPatches,
          markDeprecatedPatches,
          markDeadPatches(errors)
        )
      )
    )(patches)
);

export const getInstallingLibraries = R.compose(
  R.prop('installingLibraries'),
  getProjectBrowser
);
