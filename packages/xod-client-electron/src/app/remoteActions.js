import R from 'ramda';
import { toV2 } from 'xod-project';
import {
  save,
  getProjects,
  loadProjectWithLibs,
  loadAllLibsV2,
  arrangeByFilesV2,
  pack,
  isDirectoryExists,
} from 'xod-fs';

export const saveProject = ({ project, workspace }, onFinish) => {
  const data = arrangeByFilesV2(project);
  return save(workspace, data).then(onFinish);
};

export const loadProjectList = ({ workspace }, onFinish) =>
  getProjects(workspace).then(onFinish);

export const loadProject = ({ path, workspace }, onFinish) =>
  loadProjectWithLibs(path, workspace)
    .then(({ project, libs }) => pack(project, libs))
    .then(toV2)
    .then(onFinish);

export const changeWorkspace = ({ path }, onFinish) =>
  loadAllLibsV2(path)
    .then(R.assoc('libs', R.__, { path }))
    .then(onFinish);

export const checkWorkspace = ({ path }, onFinish) => {
  const validPath = (typeof path === 'string' && isDirectoryExists(path));
  if (!validPath) { return onFinish({ valid: false, path }); }

  return changeWorkspace({ path }, R.assoc('valid', true))
    .then(onFinish);
};

export default {
  saveProject,
  loadProjectList,
  loadProject,
  changeWorkspace,
};
