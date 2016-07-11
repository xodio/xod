import R from 'ramda';
import { createSelector } from 'reselect';
import * as EDITOR_MODE from '../constants/editorModes';

export const getEditor = R.prop('editor');

export const getCurrentPatchId = R.pipe(
  getEditor,
  R.prop('currentPatchId')
);

export const getSelection = (state) => R.pipe(
  getEditor,
  R.prop('selection')
)(state);

export const getSelectedNodeType = (state) => R.pipe(
  getEditor,
  R.prop('selectedNodeType')
)(state);

export const getSelectionByTypes = createSelector(
  getSelection,
  (selection) => {
    let result = {};
    if (selection.length > 0) {
      result = R.groupBy((s) => s.entity, selection);
    }
    result.Node = result.Node || [];
    result.Pin = result.Pin || [];
    result.Link = result.Link || [];
    result.length = selection.length;

    return result;
  }
);

export const checkSelection = (selection, entityName, id) => R.pipe(
  R.values,
  R.groupBy((s) => s.entity),
  R.ifElse(
    R.has(entityName),
    R.pipe(
      R.prop(entityName),
      R.find(
        R.propEq('id', id)
      ),
      R.isNil,
      R.not
    ),
    () => false
  )
)(selection);

export const hasSelection = (state) => (
  state.editor.selection.length > 0 ||
  state.editor.linkingPin !== null
);

export const getLinkingPin = (state) => R.pipe(
  getEditor,
  R.prop('linkingPin')
)(state);

export const getMode = (state) => R.pipe(
  getEditor,
  R.prop('mode')
)(state);

export const getModeChecks = (state) => {
  const mode = getMode(state);
  return {
    mode,
    isDefault: (mode === EDITOR_MODE.DEFAULT),
    isCreating: (mode === EDITOR_MODE.CREATING),
    isEditing: (mode === EDITOR_MODE.EDITING),
    isPanning: (mode === EDITOR_MODE.PANNING),
  };
};
