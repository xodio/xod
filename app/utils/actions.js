import R from 'ramda';

export const forThisPatch = (action, id) => {
  const actionPatchId = R.view(R.lensPath(['meta', 'patchId']), action);
  return R.equals(
    parseInt(actionPatchId, 10),
    parseInt(id, 10)
  );
};

export const isNodeInThisPatch = (nodes, id) => R.has(id, nodes);

export const isLinksInThisPatch = (links, linkIds) => R.pipe(
  R.keys,
  R.filter(linkId => R.indexOf(linkId, linkIds) !== -1),
  R.length,
  R.flip(R.gt)(0)
)(links);

export const isPinsInThisPatch = (pins, pinIds) => R.pipe(
  R.keys,
  R.filter(pinId => R.indexOf(pinId, pinIds) !== -1),
  R.length,
  R.flip(R.gt)(0)
)(pins);
