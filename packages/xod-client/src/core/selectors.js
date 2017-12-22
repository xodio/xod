import R from 'ramda';
import { Maybe } from 'ramda-fantasy';
import { createSelector } from 'reselect';

import * as XP from 'xod-project';

import * as User from '../user/selectors';
import * as Editor from '../editor/selectors';
import * as Project from '../project/selectors';
import * as ProjectBrowser from '../projectBrowser/selectors';
import * as Errors from '../messages/selectors';
import * as Processes from '../processes/selectors';
import * as Debugger from '../debugger/selectors';

import { SELECTION_ENTITY_TYPE } from '../editor/constants';

//
// Unsaved changes
//

export const getLastSavedProject = R.prop('lastSavedProject');

export const hasUnsavedChanges = createSelector(
  [Project.getProject, getLastSavedProject],
  R.complement(R.equals)
);

//
// Docs sidebar
//

export const getPatchForHelpbox = createSelector(
  [
    Project.getProject,
    ProjectBrowser.getSelectedPatchPath,
    Editor.isSuggesterVisible,
    Editor.getSuggesterHighlightedPatchPath,
  ],
  (project, selectedPatchPath, suggesterVisible, suggesterPatchPath) => {
    if (suggesterVisible && suggesterPatchPath) {
      return XP.getPatchByPath(suggesterPatchPath, project);
    }
    return R.compose(
      R.chain(XP.getPatchByPath(R.__, project)),
      Maybe
    )(selectedPatchPath);
  }
);
export const getPatchForQuickHelp = createSelector(
  [Project.getProject, Editor.getSelection, Project.getCurrentPatchNodes],
  (project, editorSelection, currentPatchNodes) => R.compose(
    R.chain(XP.getPatchByPath(R.__, project)),
    R.map(R.compose(
      XP.getNodeType,
      ({ id }) => currentPatchNodes[id]
    )),
    Maybe,
    R.find(R.propEq('entity', SELECTION_ENTITY_TYPE.NODE)),
  )(editorSelection)
);

export default {
  User,
  Editor,
  Errors,
  Processes,
  Debugger,
};
