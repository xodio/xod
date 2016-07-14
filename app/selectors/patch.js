import R from 'ramda';
import { createSelector } from 'reselect';
import { getCurrentPatchId } from './editor';

export const getPatches = (state) => R.view(R.lensPath(['project', 'patches']))(state);
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
