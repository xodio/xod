import R from 'ramda';
import { save } from 'xod-fs';
import { arrangeByFiles } from 'xod-core';

const extract = json => arrangeByFiles(JSON.parse(json));

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
