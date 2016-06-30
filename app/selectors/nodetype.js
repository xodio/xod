import R from 'ramda';

export const getNodeTypes = (state) => R.pipe(
  R.view(R.lensProp('nodeTypes'))
)(state);

export const getNodeTypeById = (state, id) => R.pipe(
  getNodeTypes,
  R.view(R.lensProp(id))
)(state);

export const getPinsByNodeTypeId = (state, id) => R.pipe(
  getNodeTypeById,
  R.view(R.lensProp('pins'))
)(state, id);
