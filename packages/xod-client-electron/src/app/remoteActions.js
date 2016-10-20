import R from 'ramda';
import { save, getProjects, loadFullProject } from 'xod-fs';
import { arrangeByFiles, pack } from 'xod-core';

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

export const loadProjectList = (workspace, onFinish) =>
  getProjects(workspace).then(onFinish);

export const loadProject = (projectPath, workspace, onFinish) =>
  loadFullProject(projectPath, workspace)
    .then(({ project, libs }) => pack(project, libs))
    .then(onFinish);

export default {
  savePatch,
  saveProject,
  loadProjectList,
  loadProject,
};
