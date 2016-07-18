import R from 'ramda';
import { getProject } from './project';

export const getNodes = R.pipe(
  getProject,
  R.prop('nodes')
);

export const getLastNodeId = (state) => R.pipe(
  getNodes,
  R.values,
  R.map(node => parseInt(node.id, 10)),
  R.reduce(R.max, -1)
)(state);

export const getNodeById = (state, props) => R.pipe(
  getNodes,
  R.filter((node) => node.id === props.id),
  R.values,
  R.head
)(state, props);
