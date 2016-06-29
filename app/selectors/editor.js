import R from 'ramda';
import { createSelector } from 'reselect';
import * as EDITOR_MODE from '../constants/editorModes';

export const getSelection = (state) => R.pipe(
  R.pick(['selection']),
  R.values,
  R.head
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

export const checkSelection = (state, entityName, id) => R.pipe(
  getSelectionByTypes,
  R.view(R.lensProp(entityName)),
  R.find(
    R.propEq('id', id)
  ),
  R.isNil,
  R.not
)(state);

export const getSelectedIds = (state, entityName) => R.pipe(
  getSelectionByTypes,
  R.view(R.lensProp(entityName)),
  R.groupBy((s) => s.id),
  R.keys
)(state);

export const getMode = (state) => R.view(R.lensProp('mode'))(state);

export const isDefaultMode = (state) => (state.mode === EDITOR_MODE.DEFAULT);
export const isCreatingMode = (state) => (state.mode === EDITOR_MODE.CREATING);
export const isEditingMode = (state) => (state.mode === EDITOR_MODE.EDITING);
export const isLinkingMode = (state) => (state.mode === EDITOR_MODE.LINKING);
export const isPanningMode = (state) => (state.mode === EDITOR_MODE.PANNING);
