import R from 'ramda';
import { createSelector } from 'reselect';

import { EDITOR_MODE } from './constants';

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

export const getModeChecks = (state) => {
  const mode = getMode(state);
  return {
    mode,
    isDefault: (mode === EDITOR_MODE.DEFAULT),
    isCreatingNode: (mode === EDITOR_MODE.CREATING_NODE),
    isEditing: (mode === EDITOR_MODE.EDITING),
    isLinking: (mode === EDITOR_MODE.LINKING),
    isPanning: (mode === EDITOR_MODE.PANNING),
  };
};


// tabs

export const getTabs = R.pipe(
  getEditor,
  R.prop('tabs')
);
