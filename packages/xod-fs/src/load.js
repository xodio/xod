import fs from 'fs-extra';
import path from 'path';
import * as R from 'ramda';

import * as XF from 'xod-func-tools';
import * as XP from 'xod-project';

import pack from './pack';
import { findClosestProjectDir } from './find';
import { loadLibs } from './loadLibs';
import { readDir, readJSON } from './read';
import * as ERROR_CODES from './errorCodes';
import {
  isBasename,
  isExtname,
  isDirectory,
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
const readProjectMetaFile = projectFile => readJSON(projectFile)
  .then(addMissingOptionsToProjectFileContents)
  .then(R.compose(
    XF.eitherToPromise,
    XF.validateSanctuaryType(ProjectFileContents)
  ))
  .then(R.assoc('path', path.dirname(projectFile)))
  .catch(err => ({ error: true, message: err.toString(), path: projectFile }));

// :: Path -> Promise ProjectMeta Error
const readProjectDirectories = projectDirectory => R.compose(
  R.composeP(
    content => ({ path: projectDirectory, content }),
    addMissingOptionsToProjectFileContents,
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
        R.cond([
          [
            () => base === 'patch.xodp',
            patch => R.composeP(
              loadAttachments(dir),
              R.assoc('path', XP.getLocalPath(getPatchName(xodfile))),
              convertPatchFileContentsToPatch,
              rejectOnInvalidPatchFileContents(filePath),
              addMissingOptionsToPatchFileContents,
              Promise.resolve.bind(Promise)
            )(patch),
          ],
          [
            () => base === 'project.xod',
            addMissingOptionsToProjectFileContents,
          ],
          [R.T, R.identity],
        ]),
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

// :: [Path] -> Path -> Promise [File] Error
export const loadProjectWithLibs = R.curry(
  (workspaceDirs, projectPath) => {
    const fullProjectPath = resolvePath(projectPath);
    const libDirPaths = R.map(
      R.compose(resolvePath, resolveLibPath),
      workspaceDirs
    );

    return Promise.all([
      loadProjectWithoutLibs(fullProjectPath),
      loadLibs(libDirPaths),
    ])
      .then(([projectFiles, libs]) => ({ project: projectFiles, libs }))
      .catch(err => Promise.reject(
        Object.assign(err, {
          libPaths: libDirPaths,
          fullProjectPath,
        })
      ));
  }
);

/**
 * Loads a XOD project from anywhere. Project names are determined by path
 * provided. It is expected to be a path to the project directory, e.g.
 * `/path/to/my-proj`.
 *
 * Also it loads libraries from libs directory inside of workspaces
 * from `workspaceDirs` list, if it is not empty.
 * If lib directories contains libraries with the same names — only one will
 * be loaded, from workspace with the highest priority
 * (more index — less priority).
 *
 * E.G.
 * - workspaceDirs[0] contains `xod/core`, `xod/common-hardware`
 * - workspaceDirs[1] contains `xod/core`, `xod/awesome`
 * As a result:
 * - `xod/core` and `xod/common-hardware` will be loaded from workspaceDirs[0]
 * - `xod/awesome` will be loaded from workspaceDirs[1]
 *
 * Returns a Promise of complete `Project` (see `xod-project`).
 */
// :: [Path] -> Path -> Promise Project Error
export const loadProjectFromDir = R.curry((workspaceDirs, projectPath) =>
  loadProjectWithLibs(workspaceDirs, projectPath)
    .then(({ project, libs }) => pack(project, libs))
    .then(XP.injectProjectTypeHints)
    .then(XP.resolveNodeTypesInProject)
);


// :: [Path] -> Path -> Promise Project Error
export const loadProjectFromXodball = R.curry((workspaceDirs, xodballPath) =>
  Promise.all([
    fs.readFile(xodballPath, 'utf8').then(XP.fromXodball),
    R.compose(
      loadLibs,
      R.map(
        R.compose(resolvePath, resolveLibPath)
      )
    )(workspaceDirs),
  ])
    .then(([eitherProject, libs]) =>
      eitherProject.map(
        XP.mergePatchesList(R.values(libs))
      )
    )
    .then(XF.eitherToPromise)
);

/**
 * Loads XOD Project if correct path providen.
 *
 * It accepts list of paths to workspaces (to load libs) and
 * path to one of XOD files or XOD Project directory:
 * - project.xod
 * - patch.xodp
 * - *.xodball
 *
 * If other extension is passed into this function it will return
 * rejected Promise with Error. Otherwise, Promise Project.
 */
// :: [Path] -> Path -> Promise Project Error
export const loadProject = R.uncurryN(2,
  workspaceDirs => R.cond([
    [
      isBasename('project.xod'),
      R.compose(
        loadProjectFromDir(workspaceDirs),
        path.dirname,
      ),
    ],
    [
      isExtname('.xodball'),
      loadProjectFromXodball(workspaceDirs),
    ],
    [
      R.either(
        isBasename('patch.xodp'),
        isDirectory
      ),
      a => R.composeP(
        loadProjectFromDir(workspaceDirs),
        findClosestProjectDir
      )(a),
    ],
    [
      R.T,
      filePath => XF.rejectWithCode(
        ERROR_CODES.TRIED_TO_OPEN_NOT_XOD_FILE,
        new Error(`Tried to open not a xod file: ${filePath}`)
      ),
    ],
  ])
);

export default {
  getProjects,
  getLocalProjects,
  loadProject,
  loadProjectWithLibs,
  loadProjectWithoutLibs,
};
