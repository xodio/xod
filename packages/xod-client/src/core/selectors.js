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

import { SELECTION_ENTITY_TYPE, FOCUS_AREAS } from '../editor/constants';

//
// Docs sidebar
//

const fallbackMaybe = (a, b) => R.when(
  Maybe.isNothing,
  R.always(b)
)(a);

export const getPatchForHelpbar = createSelector(
  [
    Project.getProject,
    Editor.getFocusedArea,
    Editor.getSelection,
    ProjectBrowser.getSelectedPatchPath,
    Project.getCurrentPatchNodes,
    Editor.isSuggesterVisible,
    Editor.getSuggesterHighlightedPatchPath,
  ],
  (
    project,
    focusedArea,
    editorSelection,
    selectedPatchPath,
    currentPatchNodes,
    suggesterVisible,
    suggesterPatchPath
  ) => {
    const maybeSelectedNodeTypeInWorkarea = R.compose(
      R.map(XP.getNodeType),
      R.map(({ id }) => currentPatchNodes[id]),
      Maybe,
      R.find(R.propEq('entity', SELECTION_ENTITY_TYPE.NODE)),
    )(editorSelection);
    const maybeSelectedPathInProjectBrowser = Maybe(selectedPatchPath);

    if (suggesterVisible && suggesterPatchPath) {
      return XP.getPatchByPath(suggesterPatchPath, project);
    }

    return R.compose(
      R.chain(patchPath => XP.getPatchByPath(patchPath, project)),
      R.apply(fallbackMaybe), // TODO: works with only two sources
      R.when(
        () => focusedArea === FOCUS_AREAS.PROJECT_BROWSER,
        R.reverse
      )
    )([
      maybeSelectedNodeTypeInWorkarea,
      maybeSelectedPathInProjectBrowser,
    ]);
  }
);


export default {
  Editor,
  Errors,
  Processes,
  Utils,
};
