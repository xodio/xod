import R from 'ramda';
import { createSelector } from 'reselect';

import XP from 'xod-project';

import { createMemoizedSelector } from '../utils/selectorTools';
import * as ProjectSelectors from '../project/selectors';

export const getProjectBrowser = R.prop('projectBrowser');

export const getSelectedPatchId = createSelector(
  getProjectBrowser,
  R.prop('selectedPatchId')
);

export const getProjectName = createSelector(
  ProjectSelectors.getProject,
  XP.getProjectName
);

export const getLocalPatches = createSelector(
  ProjectSelectors.getProject,
  XP.listLocalPatches
);

export const getOpenPopups = createSelector(
  getProjectBrowser,
  R.prop('openPopups')
);

export const getSelectedPatchLabel = createSelector(
  [ProjectSelectors.getProject, getSelectedPatchId],
  (project, selectedPatchPath) =>
    XP.getPatchByPath(selectedPatchPath || '', project)
      .map(XP.getPatchLabel)
      .getOrElse('')
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
