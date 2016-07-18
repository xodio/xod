import R from 'ramda';
import { getProject } from './project';

export const getNodeTypes = R.pipe(
  getProject,
  R.prop('nodeTypes')
);
