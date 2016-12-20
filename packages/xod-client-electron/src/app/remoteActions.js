import R from 'ramda';
import { save, getProjects, loadProjectWithLibs, loadLibs, arrangeByFiles, pack } from 'xod-fs';

const extract = json => arrangeByFiles(JSON.parse(json));

export const savePatch = (json, patchId, workspace, onFinish) => {
  const data = R.filter(
    R.propEq('id', patchId)
  )(extract(json));
  return save(workspace, data).then(onFinish);
};

export const saveProject = (json, workspace, onFinish) => {
  const data = extract(json);
  return save(workspace, data).then(onFinish);
};

export const loadProjectList = (workspace, onFinish) =>
  getProjects(workspace).then(onFinish);

export const loadProject = (projectPath, workspace, onFinish) =>
  loadProjectWithLibs(projectPath, workspace)
    .then(({ project, libs }) => pack(project, libs))
    .then(onFinish);

export const changeWorkspace = (newPath, onFinish) =>
  loadLibs(['xod/core'], newPath)
    .then(R.assoc('nodeTypes', R.__, { path: newPath }))
    .then(onFinish);

export default {
  savePatch,
  saveProject,
  loadProjectList,
  loadProject,
  changeWorkspace,
};
