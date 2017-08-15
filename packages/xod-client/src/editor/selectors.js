import R from 'ramda';
import { createSelector } from 'reselect';

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
  (currentPatchPath, tabs) => R.path([currentPatchPath, 'offset'], tabs)
);
