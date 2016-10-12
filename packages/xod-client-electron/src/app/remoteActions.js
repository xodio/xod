import R from 'ramda';
import { saver } from 'xod-fs';
import { divided } from 'xod-core';

const save = (data, workspace, onFinish) => saver(data, workspace, onFinish, (err) => { throw err; });
const extract = (json) => divided(JSON.parse(json));

export const savePatch = (json, patchId, workspace, onFinish) => {
  const data = R.filter(
    R.propEq('id', patchId)
  )(extract(json));
  return save(data, workspace, onFinish);
};

export const saveProject = (json, workspace, onFinish) => {
  const data = extract(json);
  return save(data, workspace, onFinish);
};

export default {
  savePatch,
  saveProject,
};
