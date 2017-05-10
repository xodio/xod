import R from 'ramda';
import { createSelector } from 'reselect';

import * as XP from 'xod-project';

import { createMemoizedSelector } from '../utils/selectorTools';
import * as ProjectSelectors from '../project/selectors';

export const getProjectBrowser = R.prop('projectBrowser');

export const getSelectedPatchPath = createSelector(
  getProjectBrowser,
  R.prop('selectedPatchPath')
);

export const getProjectName = createSelector(
  ProjectSelectors.getProject,
  XP.getProjectName
);

export const getLocalPatches = createSelector(
  ProjectSelectors.getProject,
  XP.listLocalPatches
);

// TODO: this is not actually label anymore
export const getSelectedPatchLabel = createSelector(
  [ProjectSelectors.getProject, getSelectedPatchPath],
  (project, selectedPatchPath) => (
    selectedPatchPath
      ? XP.getPatchByPath(selectedPatchPath, project)
        .map(R.pipe(XP.getPatchPath, XP.getBaseName))
        .getOrElse('')
      : ''
  )
);

const getLibraryPatchesList = createSelector(
  ProjectSelectors.getProject,
  XP.listLibraryPatches
);

export const getLibs = createMemoizedSelector(
  [getLibraryPatchesList],
  [R.equals],
  R.compose(
    R.map(
      R.sort(R.ascend(XP.getPatchPath))
    ),
    R.groupBy(
      R.pipe(XP.getPatchPath, XP.getLibraryName)
    )
  )
);
