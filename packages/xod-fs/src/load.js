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
  reassignIds,
  getPatchName,
} from './utils';
import { loadAttachmentFiles } from './attachments';
import { loadPatchImpls } from './impls';

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
    R.applySpec({
      path: R.always(projectDirectory),
      content: R.identity,
    }),
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
        R.applySpec({
          path: () => `./${filePath}`,
          content: R.identity,
        }),
        R.when(
          () => base === 'patch.xodp',
          R.composeP(
            reassignIds,
            R.assoc('path', XP.getLocalPath(getPatchName(xodfile))),
            loadAttachmentFiles(dir),
            loadPatchImpls(dir)
          )
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
export const loadProjectWithLibs = (projectPath, workspace, libDir = workspace) => {
  const fullProjectPath = resolvePath(path.resolve(workspace, projectPath));
  return loadProjectWithoutLibs(fullProjectPath)
    .then((projectFiles) => {
      const libPath = resolvePath(libDir);
      return loadAllLibs(workspace)
        .catch((err) => {
          // Catch error ENOENT in case if libsDir is not found.
          // E.G. User deleted it before select project.
          // So in this case we'll return just empty array of libs.
          if (err.code === 'ENOENT') return Promise.resolve([]);
          return Promise.reject(err);
        })
        .then(libs => ({ project: projectFiles, libs }))
        .catch(err => Promise.reject(
          Object.assign(err, {
            path: libPath,
            files: projectFiles,
          })
        ));
    });
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
