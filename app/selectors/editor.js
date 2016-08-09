import R from 'ramda';
import { createSelector } from 'reselect';
import * as EDITOR_MODE from '../constants/editorModes';
import * as ENTITY from '../constants/entities';
import { getProject, getPatchById } from './project';

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

export const isSelected = (selection, entityName, id) => R.pipe(
  R.filter(R.propEq('entity', entityName)),
  R.find(R.propEq('id', id)),
  R.isNil,
  R.not
)(selection);

export const isNodeSelected = (selection, id) => isSelected(selection, ENTITY.NODE, id);
export const isLinkSelected = (selection, id) => isSelected(selection, ENTITY.LINK, id);

export const hasSelection = (state) => (
  (
    state.editor.selection &&
    state.editor.selection.length > 0
  ) || (
    state.editor.linkingPin &&
    state.editor.linkingPin !== null
  )
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
    isCreatingNode: (mode === EDITOR_MODE.CREATING_NODE),
    isEditing: (mode === EDITOR_MODE.EDITING),
    isLinking: (mode === EDITOR_MODE.LINKING),
    isPanning: (mode === EDITOR_MODE.PANNING),
  };
};

export const getTabs = (state) => R.pipe(
  getEditor,
  R.prop('tabs')
)(state);

export const getPreparedTabs = (state) => {
  const currentPatchId = getCurrentPatchId(state);
  const projectState = getProject(state);

  return R.pipe(
    getTabs,
    R.values,
    R.map((tab) => {
      const patch = getPatchById(projectState, tab.patchId);
      return R.merge(
        tab,
        {
          name: patch.name,
          isActive: (currentPatchId === tab.patchId),
        }
      );
    }),
    R.indexBy(R.prop('id'))
  )(state);
};
