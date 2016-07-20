import R from 'ramda';
import { getProject } from './project';

export const getMeta = R.pipe(
  getProject,
  R.prop('meta')
);
