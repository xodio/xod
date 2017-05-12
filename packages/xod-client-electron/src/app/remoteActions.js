import R from 'ramda';
import {
  save,
  getProjects,
  loadProjectWithLibs,
  loadAllLibs,
  arrangeByFiles,
  pack,
  isDirectoryExists,
} from 'xod-fs';

export const saveProject = ({ project, workspace }, onFinish, onError) => {
  const data = arrangeByFiles(project);
  return save(workspace, data)
    .then(onFinish)
    .catch(onError);
};

export const loadProjectList = ({ workspace }, onFinish, onError) =>
  getProjects(workspace)
    .then(onFinish)
    .catch(onError);

export const loadProject = ({ path, workspace }, onFinish, onError) =>
  loadProjectWithLibs(path, workspace)
    .then(({ project, libs }) => pack(project, libs))
    .then(onFinish)
    .catch(onError);

export const changeWorkspace = ({ path }, onFinish, onError) =>
  loadAllLibs(path)
    .then(R.assoc('libs', R.__, { path }))
    .then(onFinish)
    .catch(onError);

export const checkWorkspace = ({ path }, onFinish, onError) => {
  const validPath = (typeof path === 'string' && isDirectoryExists(path));
  if (!validPath) { return onFinish({ valid: false, path }); }

  return changeWorkspace({ path }, R.assoc('valid', true), onError)
    .then(onFinish)
    .catch(onError);
};

export default {
  saveProject,
  loadProjectList,
  loadProject,
  changeWorkspace,
};
