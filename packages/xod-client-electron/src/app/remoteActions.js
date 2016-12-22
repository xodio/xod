import R from 'ramda';
import { save, getProjects, loadProjectWithLibs, loadAllLibs, arrangeByFiles, pack, isDirectoryExists } from 'xod-fs';

const extract = json => arrangeByFiles(JSON.parse(json));

export const savePatch = ({ json, patchId, workspace }, onFinish) => {
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

export const saveProject = ({ json, workspace }, onFinish) => {
  const data = extract(json);
  return save(workspace, data).then(onFinish);
};

export const loadProjectList = ({ workspace }, onFinish) =>
  getProjects(workspace).then(onFinish);

export const loadProject = ({ path, workspace }, onFinish) =>
  loadProjectWithLibs(path, workspace)
    .then(({ project, libs }) => pack(project, libs))
    .then(onFinish);

export const changeWorkspace = ({ path }, onFinish) =>
  loadAllLibs(path)
    .then(R.assoc('nodeTypes', R.__, { path }))
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
