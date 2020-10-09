import * as R from 'ramda';

export const getGenuinePatches = R.prop('patches');

export const getGenuinePatchByPath = R.curry((patchPath, project) =>
  R.compose(R.prop(patchPath), getGenuinePatches)(project)
);
