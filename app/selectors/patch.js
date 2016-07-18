import R from 'ramda';
import { createSelector } from 'reselect';
import { getCurrentPatchId } from './editor';
import { getProject } from './project';

export const getPatches = R.pipe(
  getProject,
  R.prop('patches')
);
export const getCurrentPatch = (state) => {
  const curPatchId = getCurrentPatchId(state);
  return R.pipe(
    getPatches,
    R.prop(curPatchId)
  )(state);
};

export const getPatchName = createSelector(
  getCurrentPatch,
  (patch) => R.prop('name')(patch)
);
