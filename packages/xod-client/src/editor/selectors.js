import R from 'ramda';
import { createSelector } from 'reselect';
import { addPoints, subtractPoints, DEFAULT_PANNING_OFFSET } from '../project/nodeLayout';

export const getEditor = R.prop('editor');

export const getCurrentPatchPath = R.pipe(
  getEditor,
  R.prop('currentPatchPath')
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

export const getMode = R.pipe(
  getEditor,
  R.prop('mode')
);

// tabs

export const getTabs = R.pipe(
  getEditor,
  R.prop('tabs')
);

export const getCurrentPatchOffset = createSelector(
  [getCurrentPatchPath, getTabs],
  (currentPatchPath, tabs) => R.pathOr(DEFAULT_PANNING_OFFSET, [currentPatchPath, 'offset'], tabs)
);

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
