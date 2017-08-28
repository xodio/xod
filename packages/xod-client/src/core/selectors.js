import R from 'ramda';
import { Maybe } from 'ramda-fantasy';
import { createSelector } from 'reselect';

import * as XP from 'xod-project';

import * as Editor from '../editor/selectors';
import * as Project from '../project/selectors';
import * as ProjectBrowser from '../projectBrowser/selectors';
import * as Errors from '../messages/selectors';
import * as Processes from '../processes/selectors';
import * as Utils from '../utils/selectors';

import { SELECTION_ENTITY_TYPE } from '../editor/constants';

//
// Docs sidebar
//

export const getPatchForHelpbar = createSelector(
  [
    Project.getProject,
    Editor.getSelection,
    ProjectBrowser.getSelectedPatchPath,
    Project.getCurrentPatchNodes,
  ],
  (project, editorSelection, selectedPatchPath, currentPatchNodes) => R.compose(
    R.map(patchPath => XP.getPatchByPathUnsafe(patchPath, project)),
    R.when(
      Maybe.isNothing,
      R.always(Maybe(selectedPatchPath))
    ),
    R.map(XP.getNodeType),
    R.map(({ id }) => currentPatchNodes[id]),
    Maybe,
    R.find(R.propEq('entity', SELECTION_ENTITY_TYPE.NODE)),
  )(editorSelection)
);


export default {
  Editor,
  Errors,
  Processes,
  Utils,
};
