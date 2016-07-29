import R from 'ramda';

export const currentStateHasThatNode = (state, id) => R.has(id)(state);
export const getCurrentPatchId = (state, projectState) => {
  const currentKeys = R.keys(state);
  return R.pipe(
    R.keys,
    R.filter(id =>
      R.allPass(
        R.map(
          key => R.has(key)(R.keys(projectState.patches[id].present))
        )(currentKeys)
      )
    ),
    R.head,
    (val) => parseInt(val, 10)
  )(projectState.patches);
};
export const isActionForCurrentPatch = (state, action, projectState) => {
  const targetPatchId = R.view(R.lensPath(['meta', 'patchId']), action);
  return (targetPatchId && targetPatchId === getCurrentPatchId(state, projectState));
};
export const currentPatchHasThatPins = (state, pins, projectState) => {
  const curPatchId = getCurrentPatchId(state, projectState);
  return R.allPass([
    R.has(pins[0]),
    R.has(pins[1]),
  ])(projectState.patches[curPatchId].present.pins);
};
export const currentPatchHasThatNode = (state, id, projectState) => {
  const curPatchId = getCurrentPatchId(state, projectState);
  return R.has(id)(projectState.patches[curPatchId].present.nodes);
};
