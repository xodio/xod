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

export const saveProject = ({ project, workspace }, onFinish, onError) => {
  const data = arrangeByFilesV2(project);
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
    .then((v1) => {
      const convertedProject = toV2(v1);

      // result can be Either.Left instead of a Project :(
      if (convertedProject.isLeft) {
        return Promise.reject(convertedProject.value);
      }

      return convertedProject;
    })
    .then(onFinish)
    .catch(onError);

export const changeWorkspace = ({ path }, onFinish, onError) =>
  loadAllLibsV2(path)
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
