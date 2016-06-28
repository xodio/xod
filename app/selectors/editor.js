import R from 'ramda';
import { createSelector } from 'reselect';

export const getSelection = (state) => R.pipe(
  R.pick(['selection']),
  R.values,
  R.head
)(state);

export const getSelectionByTypes = createSelector(
  getSelection,
  (selection) => {
    let result = {};
    console.log(selection);
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
