import fs from 'fs-extra';
import path from 'path';
import R from 'ramda';

import XF from 'xod-func-tools';
import * as XP from 'xod-project';

import pack from './pack';
import { findClosestWorkspaceDir } from './find';
import { loadLibs } from './loadLibs';
import { readDir, readJSON } from './read';
import * as ERROR_CODES from './errorCodes';
import {
  resolvePath,
  resolveLibPath,
  resolveProjectFile,
  isLocalProjectDirectory,
  basenameEquals,
  basenameAmong,
  getPatchName,
  rejectOnInvalidPatchFileContents,
} from './utils';
import { ProjectFileContents } from './types';
import { loadAttachments } from './attachments';
import { loadPatchImpls } from './impls';
import {
  convertPatchFileContentsToPatch,
  addMissingOptionsToPatchFileContents,
  addMissingOptionsToProjectFileContents,
} from './convertTypes';
// =============================================================================
//
// Reading of files
//
// =============================================================================

// :: Path -> Promise (XodFile ProjectFileContents) Object
const readProjectMetaFile = projectFile =>
  readJSON(projectFile)
    .then(addMissingOptionsToProjectFileContents)
    .then(
      R.compose(
        XF.eitherToPromise,
        XF.validateSanctuaryType(ProjectFileContents)
      )
    )
    .then(R.assoc('path', path.dirname(projectFile)))
    .catch(err => ({
      error: true,
      message: err.toString(),
      path: projectFile,
    }));

// :: Path -> Promise ProjectMeta Error
const readProjectDirectories = projectDirectory =>
  R.compose(
    R.composeP(
      content => ({ path: projectDirectory, content }),
      addMissingOptionsToProjectFileContents,
      fs.readJson
    ),
    resolveProjectFile
  )(projectDirectory);

// :: Path -> Promise ProjectMeta[] Error
export const getLocalProjects = R.compose(
  workspacePath =>
    R.composeP(
      Promise.all.bind(Promise),
      R.map(readProjectDirectories),
      R.filter(isLocalProjectDirectory),
      R.map(filename => path.resolve(workspacePath, filename)),
      fs.readdir
    )(workspacePath).catch(
      XF.rejectWithCode(ERROR_CODES.CANT_ENUMERATE_PROJECTS)
    ),
  resolvePath
);

// Returns a Promise of all project metas for given workspace path
// :: Path -> Promise ProjectMeta[] Error
export const getProjects = workspacePath =>
  R.composeP(
    XF.allPromises,
    R.map(readProjectMetaFile),
    R.filter(basenameEquals('project.xod')),
    readDir
  )(workspacePath).catch(
    XF.rejectWithCode(ERROR_CODES.CANT_ENUMERATE_PROJECTS)
  );

// :: String -> String -> Promise { path :: String, content :: Object, id :: String }
const readXodFile = projectPath => xodfile =>
  readJSON(xodfile).then(data => {
    const { base, dir } = path.parse(xodfile);

    const projectFolder = path.resolve(projectPath, '..');
    const filePath = path.relative(projectFolder, xodfile);

    return R.composeP(
      XF.omitNilValues,
      content => ({ path: `./${filePath}`, content }),
      R.cond([
        [
          () => base === 'patch.xodp',
          patch =>
            R.composeP(
              loadAttachments(dir),
              loadPatchImpls(dir),
              R.assoc('path', XP.getLocalPath(getPatchName(xodfile))),
              convertPatchFileContentsToPatch,
              rejectOnInvalidPatchFileContents(filePath),
              addMissingOptionsToPatchFileContents,
              Promise.resolve.bind(Promise)
            )(patch),
        ],
        [() => base === 'project.xod', addMissingOptionsToProjectFileContents],
        [R.T, R.identity],
      ]),
      Promise.resolve.bind(Promise)
    )(data);
  });

// :: Path -> Promise [File] Error
export const loadProjectWithoutLibs = projectPath =>
  R.composeP(
    XF.allPromises,
    R.map(readXodFile(projectPath)),
    R.filter(basenameAmong(['project.xod', 'patch.xodp'])),
    readDir
  )(projectPath);

// :: [Path] -> Path -> Path -> Promise [File] Error
export const loadProjectWithLibs = R.curry(
  (extraLibDirs, projectPath, workspace) => {
    const fullProjectPath = resolvePath(path.resolve(workspace, projectPath));
    const userLibsPath = resolveLibPath(workspace);

    const libDirPaths = R.compose(R.concat([userLibsPath]), R.map(resolvePath))(
      extraLibDirs
    );

    return Promise.all([
      loadProjectWithoutLibs(fullProjectPath),
      loadLibs(libDirPaths),
    ])
      .then(([projectFiles, libs]) => ({ project: projectFiles, libs }))
      .catch(err =>
        Promise.reject(
          Object.assign(err, {
            libPath: userLibsPath,
            fullProjectPath,
            workspace,
          })
        )
      );
  }
);

// :: Path -> Promise Project Error
/**
 * Loads a regular XOD project placed in a workspace. Workspace and project
 * names are determined by path provided. It is expected to be a path to the
 * project directory, e.g. `/path/to/workspace/my-proj`.
 *
 * Also it loads libraries from libs directory inside of the user workspace
 * and from `extraLibDirs` list, if it is not empty.
 * The lib directory in the user workspace has a highest priority,
 * all extra lib dirs has a smaller priority in accordance to its index
 * (more index is less priority).
 *
 * If lib directories contains libraries with the same names — only one will
 * be loaded, from lib directory with the highest priority.
 *
 * E.G.
 * - user workspace contains `xod/units`
 * - extraLibDir[0] contains `xod/core`, `xod/common-hardware`, `xod/units`
 * - extraLibDir[1] contains `xod/core`, `xod/awesome`
 * As a result:
 * - `xod/units` will be loaded from user workspace
 * - `xod/core` and `xod/common-hardware` will be loaded from extraLibDir[0]
 * - `xod/awesome` will be loaded from extraLibDir[1]
 *
 * Returns a Promise of complete `Project` (see `xod-project`).
 */
export const loadProject = (projectPath, extraLibDirs = []) =>
  findClosestWorkspaceDir(projectPath)
    .then(workspace => [path.relative(workspace, projectPath), workspace])
    .then(R.apply(loadProjectWithLibs(extraLibDirs)))
    .then(({ project, libs }) => pack(project, libs))
    .then(XP.injectProjectTypeHints)
    .then(XP.resolveNodeTypesInProject);

export default {
  getProjects,
  getLocalProjects,
  loadProject,
  loadProjectWithLibs,
  loadProjectWithoutLibs,
};
