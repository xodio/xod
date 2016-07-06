import R from 'ramda';

export const getNodeTypes = (state) => R.pipe(
  R.prop('nodeTypes')
)(state);

export const getNodeTypeById = (state, id) => R.pipe(
  getNodeTypes,
  R.prop(id)
)(state);

export const getPinsByNodeTypeId = (state, id) => R.pipe(
  getNodeTypeById,
  R.prop('pins')
)(state, id);
