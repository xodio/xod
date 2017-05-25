import fs from 'fs-extra';
import path from 'path';
import R from 'ramda';

import XF from 'xod-func-tools';
import * as XP from 'xod-project';

import { def } from './types';

import { loadAllLibs } from './loadLibs';
import { readDir, readJSON } from './read';
import * as ERROR_CODES from './errorCodes';
import {
  resolvePath,
  doesFileExist,
  doesDirectoryExist,
  reassignIds,
  getPatchName,
} from './utils';

// =============================================================================
//
// Utils
//
// =============================================================================

// :: [Promise a] -> Promise a
const allPromises = promises => Promise.all(promises);

const basenameEquals = def(
  'basenameEquals :: String -> Path -> Boolean',
  (basename, filePath) => R.compose(
    R.equals(basename),
    path.basename
  )(filePath)
);

const basenameAmong = def(
  'basenameAmong :: [String] -> Path -> Boolean',
  (basenames, filePath) => R.compose(
    XF.isAmong(basenames),
    path.basename
  )(filePath)
);

const extAmong = def(
  'extAmong :: [String] -> Path -> Boolean',
  (extensions, filePath) => R.compose(
    XF.isAmong(extensions),
    path.extname
  )(filePath)
);

const beginsWithDot = def(
  'beginsWithDot :: String -> Boolean',
  R.compose(
    R.equals('.'),
    R.head
  )
);

const resolveProjectFile = def(
  'resolveProjectFile :: Path -> Path',
  dir => path.resolve(dir, 'project.xod')
);

const hasProjectFile = def(
  'hasProjectFile :: Path -> Boolean',
  R.compose(
    doesFileExist,
    resolveProjectFile
  )
);

// :: Path -> Boolean
const isLocalProjectDirectory = def(
  'isLocalProjectDirectory :: Path -> Boolean',
  R.allPass([
    doesDirectoryExist,
    R.complement(beginsWithDot),
    hasProjectFile,
  ])
);

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
  allPromises,
  R.map(readProjectMetaFile),
  R.filter(basenameEquals('project.xod')),
  readDir
)(workspacePath)
  .catch(XF.rejectWithCode(ERROR_CODES.CANT_ENUMERATE_PROJECTS));

// Returns a promise of filename / content pair for a given
// `filename` path relative to `dir`
// :: String -> String -> Promise (Pair String String)
const readImplFile = dir => filename =>
  fs.readFile(path.resolve(dir, filename), 'utf8').then(content => [
    filename,
    content,
  ]);

// Returns a map with filenames in keys and contents in values of
// all implementation source files in a directory given as argument
// :: String -> Promise (StrMap String) Error
const readImplFiles = dir => R.composeP(
  R.fromPairs,
  allPromises,
  R.map(readImplFile(dir)),
  R.filter(extAmong(['.c', '.cpp', '.h', '.inl', '.js'])),
  fs.readdir
)(dir);

// :: String -> String -> Promise { path :: String, content :: Object, id :: String }
const readXodFile = projectPath => xodfile =>
  readJSON(xodfile)
    .then((data) => {
      const { base, dir } = path.parse(xodfile);

      const projectFolder = path.resolve(projectPath, '..');
      const patchPath = path.relative(projectFolder, xodfile);

      return readImplFiles(dir).then((impls) => {
        const getContent = base === 'project.xod'
          ? R.identity
          : R.compose(
              R.merge(R.__, { impls }),
              R.assoc('path', XP.getLocalPath(getPatchName(xodfile))),
              reassignIds
            );

        return XF.omitNilValues({
          path: `./${patchPath}`,
          content: getContent(data),
        });
      });
    });

// :: Path -> Promise [File] Error
export const loadProjectWithoutLibs = projectPath => R.composeP(
  allPromises,
  R.map(readXodFile(projectPath)),
  R.filter(basenameAmong([
    'project.xod',
    'patch.xodp',
  ])),
  readDir
)(projectPath);

// :: Path -> Path -> Path -> Promise [File] Error
export const loadProjectWithLibs = (projectPath, workspace, libDir = workspace) =>
  loadProjectWithoutLibs(resolvePath(path.resolve(workspace, projectPath)))
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
        .catch((err) => {
          throw Object.assign(err, {
            path: libPath,
            files: projectFiles,
          });
        });
    });

export default {
  getProjects,
  getLocalProjects,
  loadProjectWithLibs,
  loadProjectWithoutLibs,
};
