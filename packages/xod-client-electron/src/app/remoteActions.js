import R from 'ramda';
import { toV2 } from 'xod-project';
import {
  save,
  getProjects,
  loadProjectWithLibs,
  loadAllLibsV2,
  arrangeByFiles,
  arrangeByFilesV2,
  pack,
  isDirectoryExists,
} from 'xod-fs';

const extract = json => arrangeByFiles(JSON.parse(json));

export const savePatch = ({ json, patchId, workspace }, onFinish) => {
  // TODO: this may lead to inconsistent state. 'savePatch' shall be removed.
  const data = R.compose(
    extract,
    JSON.stringify,
    R.over(
      R.lensProp('patches'),
      R.filter(R.propEq('id', patchId))
    ),
    JSON.parse
  )(json);

  return save(workspace, data).then(onFinish);
};

export const saveProject = ({ projectV2, workspace }, onFinish) => {
  const data = arrangeByFilesV2(projectV2);
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
  savePatch,
  saveProject,
  loadProjectList,
  loadProject,
  changeWorkspace,
};
