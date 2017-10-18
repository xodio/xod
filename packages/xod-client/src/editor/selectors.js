import R from 'ramda';
import { Maybe } from 'ramda-fantasy';
import { createSelector } from 'reselect';
import { mapIndexed } from 'xod-func-tools';
import * as XP from 'xod-project';
import { addPoints, subtractPoints, DEFAULT_PANNING_OFFSET } from '../project/nodeLayout';

const getProject = R.prop('project'); // Problem of cycle imports...

export const getEditor = R.prop('editor');


// tabs

export const getTabs = R.pipe(
  getEditor,
  R.prop('tabs')
);

export const getCurrentTabId = R.pipe(
  getEditor,
  R.prop('currentTabId')
);

export const getCurrentTab = createSelector(
  [getCurrentTabId, getTabs],
  (currentTabId, tabs) => R.propOr(null, currentTabId, tabs)
);

export const getCurrentTabType = createSelector(
  getCurrentTab,
  R.propOr(null, 'type')
);

export const getCurrentPatchPath = createSelector(
  getCurrentTab,
  R.propOr(null, 'patchPath')
);

export const getTabByPatchPath = R.curry(
  (patchPath, tabs) => R.compose(
    R.find(R.propEq('patchPath', patchPath)),
    R.values,
  )(tabs)
);

export const getCurrentPatchOffset = createSelector(
  getCurrentTab,
  R.propOr(DEFAULT_PANNING_OFFSET, 'offset')
);

// selection in editor

export const getSelection = R.pipe(
  getEditor,
  R.prop('selection')
);

export const selectionLens = R.lens(
  getSelection,
  R.assocPath(['editor', 'selection'])
);

export const getSelectedNodeType = R.pipe(
  getEditor,
  R.prop('selectedNodeType')
);

export const getDraggedPreviewSize = R.pipe(
  getEditor,
  R.prop('draggedPreviewSize')
);

export const getSelectionByTypes = createSelector(
  getSelection,
  (selection) => {
    let result = {};
    if (selection.length > 0) {
      result = R.groupBy(s => s.entity, selection);
    }
    result.Node = result.Node || [];
    result.Pin = result.Pin || [];
    result.Link = result.Link || [];
    result.length = selection.length;

    return result;
  }
);

export const hasSelection = state => (
  (
    state.editor.selection &&
    state.editor.selection.length > 0
  ) || (
    state.editor.linkingPin &&
    state.editor.linkingPin !== null
  )
);

// linking pin

export const getLinkingPin = R.pipe(
  getEditor,
  R.prop('linkingPin')
);


// editor mode

export const getDefaultNodePlacePosition = createSelector(
  [getCurrentPatchOffset],
  R.compose(
    addPoints({ x: 50, y: 50 }),
    subtractPoints({ x: 0, y: 0 })
  )
);

export const getFocusedArea = R.pipe(
  getEditor,
  R.prop('focusedArea')
);

// docs sidebar

export const isHelpbarVisible = R.pipe(
  getEditor,
  R.prop('isHelpbarVisible')
);

const getSuggester = R.pipe(
  getEditor,
  R.prop('suggester')
);

export const isSuggesterVisible = R.pipe(
  getSuggester,
  R.prop('visible')
);

export const getSuggesterPlacePosition = R.pipe(
  getSuggester,
  R.prop('placePosition')
);

export const getSuggesterHighlightedPatchPath = R.pipe(
  getSuggester,
  R.prop('highlightedPatchPath')
);

export const getBreadcrumbs = R.compose(
  R.propOr([], 'breadcrumbs'),
  getCurrentTab
);

export const getBreadcrumbChunks = R.compose(
  R.propOr([], 'chunks'),
  getBreadcrumbs
);

export const getBreadcrumbActiveIndex = R.compose(
  R.propOr(-1, 'activeIndex'),
  getBreadcrumbs
);

export const getActiveBreadcrumb = createSelector(
  [getBreadcrumbActiveIndex, getBreadcrumbChunks],
  R.ifElse(
    R.equals(-1),
    R.always(null),
    R.nth
  )
);

export const getRenerableBreadcrumbChunks = createSelector(
  [getProject, getBreadcrumbChunks],
  (project, chunks) => mapIndexed(
    (chunk, i) => {
      const patchName = XP.getBaseName(chunk.patchPath);
      if (chunk.nodeId === null) {
        return R.assoc('label', patchName, chunk);
      }

      const parentPatchPath = chunks[i - 1].patchPath;
      return R.compose(
        R.assoc('label', R.__, chunk),
        R.when(
          R.isEmpty,
          R.always(patchName)
        ),
        Maybe.maybe(
          patchName,
          XP.getNodeLabel
        ),
        XP.getNodeById(chunk.nodeId),
        XP.getPatchByPathUnsafe(parentPatchPath)
      )(project);
    },
    chunks
  )
);
