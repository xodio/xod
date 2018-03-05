import * as R from 'ramda';
import { Maybe } from 'ramda-fantasy';
import { createSelector } from 'reselect';
import { mapIndexed, foldMaybe } from 'xod-func-tools';
import * as XP from 'xod-project';

import {
  addPoints,
  subtractPoints,
  DEFAULT_PANNING_OFFSET,
} from '../project/nodeLayout';
import { SIDEBAR_IDS, TAB_TYPES } from './constants';

const getProject = R.prop('project'); // Problem of cycle imports...

export const getEditor = R.prop('editor');
export const editorLens = R.lensProp('editor');

//
// tabs
//
export const getTabs = R.pipe(getEditor, R.prop('tabs'));

export const getImplEditorTabs = R.pipe(
  getTabs,
  R.values,
  R.filter(R.prop('isEditingCppImplementation'))
);

export const getCurrentTabId = R.pipe(getEditor, R.prop('currentTabId'), Maybe);

export const getCurrentTab = createSelector(
  [getCurrentTabId, getTabs],
  (maybeTabId, tabs) => maybeTabId.chain(R.compose(Maybe, R.prop(R.__, tabs)))
);

export const getCurrentPatchPath = createSelector(
  getCurrentTab,
  R.map(R.prop('patchPath'))
);

export const getCurrentPatchOffset = createSelector(
  getCurrentTab,
  foldMaybe(DEFAULT_PANNING_OFFSET, R.prop('offset'))
);

// :: State -> EditorTabs
export const getPreparedTabs = createSelector(
  [getCurrentTabId, getTabs],
  (maybeCurrentTabId, tabs) => {
    const currentTabId = foldMaybe(null, R.identity, maybeCurrentTabId);
    return R.map(tab => {
      const patchPath = tab.patchPath;

      const label =
        tab.type === TAB_TYPES.DEBUGGER
          ? 'Debugger'
          : XP.getBaseName(patchPath);

      return R.merge(tab, {
        label,
        isActive: currentTabId === tab.id,
      });
    }, tabs);
  }
);

// selection

export const getSelection = R.pipe(
  getCurrentTab,
  foldMaybe([], R.propOr([], 'selection'))
);

export const getSelectionByTypes = createSelector(getSelection, selection => {
  let result = {};
  if (selection.length > 0) {
    result = R.groupBy(s => s.entity, selection);
  }
  result.Node = result.Node || [];
  result.Pin = result.Pin || [];
  result.Link = result.Link || [];
  result.length = selection.length;

  return result;
});

export const getLinkingPin = R.pipe(
  getCurrentTab,
  foldMaybe(null, R.propOr(null, 'linkingPin'))
);

export const hasSelection = createSelector(
  [getSelection, getLinkingPin],
  (selection, linkingPin) => selection.length > 0 || linkingPin !== null
);

//
// size of the patch preview dragged from sidebar
//
export const getDraggedPreviewSize = R.pipe(
  getEditor,
  R.prop('draggedPreviewSize')
);

//
// size of the patch workarea
//
export const getPatchWorkareaSize = R.compose(
  R.prop('patchWorkareaSize'),
  getEditor
);

//
// dragging a patch from project browser
//
export const getDefaultNodePlacePosition = createSelector(
  [getCurrentPatchOffset],
  R.compose(addPoints({ x: 50, y: 50 }), subtractPoints({ x: 0, y: 0 }))
);

//
// focused area
//
export const getFocusedArea = R.pipe(getEditor, R.prop('focusedArea'));

//
// docs sidebar
//
export const isHelpboxVisible = R.pipe(getEditor, R.prop('isHelpboxVisible'));

//
// suggester
//
const getSuggester = R.pipe(getEditor, R.prop('suggester'));

export const isSuggesterVisible = R.pipe(getSuggester, R.prop('visible'));

export const getSuggesterPlacePosition = R.pipe(
  getSuggester,
  R.prop('placePosition')
);

export const getSuggesterHighlightedPatchPath = R.pipe(
  getSuggester,
  R.prop('highlightedPatchPath')
);

export const isLibSuggesterVisible = R.pipe(
  getEditor,
  R.prop('libSuggesterVisible')
);

//
// debugger breadcrumbs
//
export const getBreadcrumbs = R.pipe(
  getCurrentTab,
  foldMaybe({}, R.propOr({}, 'breadcrumbs'))
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
  R.ifElse(R.equals(-1), R.always(null), R.nth)
);

export const getRenerableBreadcrumbChunks = createSelector(
  [getProject, getBreadcrumbChunks],
  (project, chunks) =>
    mapIndexed((chunk, i) => {
      const patchName = XP.getBaseName(chunk.patchPath);
      if (chunk.nodeId === null) {
        return R.assoc('label', patchName, chunk);
      }

      const parentPatchPath = chunks[i - 1].patchPath;
      return R.compose(
        R.assoc('label', R.__, chunk),
        R.when(R.isEmpty, R.always(patchName)),
        foldMaybe(patchName, XP.getNodeLabel),
        XP.getNodeById(chunk.nodeId),
        XP.getPatchByPathUnsafe(parentPatchPath)
      )(project);
    }, chunks)
);

// Panel settings
export const getAllPanelsSettings = R.compose(
  R.map(
    R.merge({
      maximized: false,
      sidebar: SIDEBAR_IDS.LEFT,
      autohide: false,
    })
  ),
  R.prop('panels'),
  getEditor
);
export const getPanelSettings = R.uncurryN(2, panelId =>
  R.compose(R.prop(panelId), getAllPanelsSettings)
);
export const isPanelMaximized = R.uncurryN(2, panelId =>
  R.compose(R.prop('maximized'), getPanelSettings(panelId))
);
export const isPanelAutohiding = R.uncurryN(2, panelId =>
  R.compose(R.prop('autohide'), getPanelSettings(panelId))
);
export const getPanelSidebar = R.uncurryN(2, panelId =>
  R.compose(R.prop('sidebar'), getPanelSettings(panelId))
);
