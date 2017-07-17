import fs from 'fs-extra';
import path from 'path';
import R from 'ramda';

import XF from 'xod-func-tools';
import * as XP from 'xod-project';

import pack from './pack';
import { findClosestWorkspaceDir } from './find';
import { loadAllLibs } from './loadLibs';
import { readDir, readJSON } from './read';
import * as ERROR_CODES from './errorCodes';
import {
  resolvePath,
  resolveProjectFile,
  isLocalProjectDirectory,
  basenameEquals,
  basenameAmong,
  getPatchName,
} from './utils';
import { loadAttachments } from './attachments';
import { loadPatchImpls } from './impls';
import {
  convertPatchFileContentsToPatch,
  addMissingOptionsToPatchFileContents,
} from './convertTypes';
// =============================================================================
//
// Reading of files
//
// =============================================================================

// :: Path -> Promise (XodFile ProjectFileContents) Object
const readProjectMetaFile = projectFile => readJSON(projectFile)
  .then(R.assoc('path', path.dirname(projectFile)))
  .catch(err => ({ error: true, message: err.toString(), path: projectFile }));

// :: Path -> Promise ProjectMeta Error
const readProjectDirectories = projectDirectory => R.compose(
  R.composeP(
    content => ({ path: projectDirectory, content }),
    fs.readJson
  ),
  resolveProjectFile
)(projectDirectory);

// :: Path -> Promise ProjectMeta[] Error
export const getLocalProjects = R.compose(
  workspacePath => R.composeP(
    Promise.all.bind(Promise),
    R.map(readProjectDirectories),
    R.filter(isLocalProjectDirectory),
    R.map(filename => path.resolve(workspacePath, filename)),
    fs.readdir
  )(workspacePath)
    .catch(XF.rejectWithCode(ERROR_CODES.CANT_ENUMERATE_PROJECTS)),
  resolvePath
);

// Returns a Promise of all project metas for given workspace path
// :: Path -> Promise ProjectMeta[] Error
export const getProjects = workspacePath => R.composeP(
  XF.allPromises,
  R.map(readProjectMetaFile),
  R.filter(basenameEquals('project.xod')),
  readDir
)(workspacePath)
  .catch(XF.rejectWithCode(ERROR_CODES.CANT_ENUMERATE_PROJECTS));

// :: String -> String -> Promise { path :: String, content :: Object, id :: String }
const readXodFile = projectPath => xodfile =>
  readJSON(xodfile)
    .then((data) => {
      const { base, dir } = path.parse(xodfile);

      const projectFolder = path.resolve(projectPath, '..');
      const filePath = path.relative(projectFolder, xodfile);

      return R.composeP(
        XF.omitNilValues,
        content => ({ path: `./${filePath}`, content }),
        R.when(
          () => base === 'patch.xodp',
          patch => R.composeP(
            loadAttachments(dir),
            loadPatchImpls(dir),
            R.assoc('path', XP.getLocalPath(getPatchName(xodfile))),
            convertPatchFileContentsToPatch,
            addMissingOptionsToPatchFileContents,
            Promise.resolve.bind(Promise)
          )(patch)
        ),
        Promise.resolve.bind(Promise)
      )(data);
    });

// :: Path -> Promise [File] Error
export const loadProjectWithoutLibs = projectPath => R.composeP(
  XF.allPromises,
  R.map(readXodFile(projectPath)),
  R.filter(basenameAmong([
    'project.xod',
    'patch.xodp',
  ])),
  readDir
)(projectPath);

// :: Path -> Path -> Path -> Promise [File] Error
export const loadProjectWithLibs = (projectPath, workspace, libWorkspace = workspace) => {
  const fullProjectPath = resolvePath(path.resolve(workspace, projectPath));
  const libPath = resolvePath(libWorkspace);

  return Promise.all([
    loadProjectWithoutLibs(fullProjectPath),
    loadAllLibs(libPath),
  ]).then(([projectFiles, libs]) => ({ project: projectFiles, libs }))
    .catch(err => Promise.reject(
      Object.assign(err, {
        libPath,
        fullProjectPath,
        workspace,
      })
    ));
};

// :: Path -> Promise Project Error
//
// Loads a regular XOD project placed in a workspace. The workspace and project
// name are determined by path provided. It is expected to be a path to the
// project directory, e.g. `/path/to/workspace/my-proj`.
//
// Returns a Promise of complete `Project` (see `xod-project`).
export const loadProject = projectPath =>
  findClosestWorkspaceDir(projectPath)
    .then(workspace => [path.relative(workspace, projectPath), workspace])
    .then(R.apply(loadProjectWithLibs))
    .then(({ project, libs }) => pack(project, libs))
    .then(XP.resolveNodeTypesInProject);

export default {
  getProjects,
  getLocalProjects,
  loadProject,
  loadProjectWithLibs,
  loadProjectWithoutLibs,
};
