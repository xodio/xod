import * as R from 'ramda';
import fs from 'fs';
import path from 'path';

import {
  notEmpty,
  rejectWithCode,
  isAmong,
  foldEither,
  validateSanctuaryType,
  omitTypeHints,
} from 'xod-func-tools';

import { PatchFileContents, Path, def } from './types';

import {
  DEFAULT_WORKSPACE_PATH,
  DEFAULT_PROJECT_NAME,
  LIBS_DIRNAME,
  WORKSPACE_FILENAME,
} from './constants';

import * as ERROR_CODES from './errorCodes';

export const expandHomeDir = (pathToResolve) => {
  const homedir = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];

  if (!pathToResolve) return pathToResolve;
  if (pathToResolve === '~') return homedir;
  if (pathToResolve.slice(0, 2) !== '~/') return pathToResolve;

  return path.join(homedir, pathToResolve.slice(2));
};

export const isProjectFile = def(
  'isProjectFile :: AnyXodFile -> Boolean',
  R.pipe(
    R.prop('path'),
    path.basename,
    R.equals('project.xod')
  )
);

export const isPatchFile = def(
  'isProjectFile :: AnyXodFile -> Boolean',
  R.pipe(
    R.prop('path'),
    path.basename,
    R.equals('patch.xodp')
  )
);

export const getFilePath = def(
  'getFileContent :: AnyXodFile -> Path',
  R.prop('path')
);
export const getFileContent = def(
  'getFileContent :: AnyXodFile -> XodFileContent',
  R.prop('content')
);

export const getProjectMetaName = def(
  'getProjectMetaName :: ProjectFile -> Identifier',
  R.path(['content', 'name'])
);

export const resolvePath = def(
  'resolvePath :: Path -> Path',
  R.compose(
    path.resolve,
    expandHomeDir
  )
);

export const doesDirectoryExist = def(
  'doesDirectoryExist :: Path -> Boolean',
    R.tryCatch(
    R.compose(
      R.invoker(0, 'isDirectory'),
      fs.statSync,
      resolvePath
    ),
    R.F
  )
);

export const doesFileExist = def(
  'doesFileExist :: String -> Boolean',
  R.tryCatch(
    R.compose(
      R.invoker(0, 'isFile'),
      fs.statSync,
      resolvePath
    ),
    R.F
  )
);

export const getPatchName = def(
  'getPatchName :: Path -> Identifier',
  (patchPath) => {
    const parts = patchPath.split(path.sep);
    return parts[parts.length - 2];
  }
);

export const hasExt = R.curry((ext, filename) => R.equals(path.extname(filename), ext));


export const basenameEquals = def(
  'basenameEquals :: String -> Path -> Boolean',
  (basename, filePath) => R.compose(
    R.equals(basename),
    path.basename
  )(filePath)
);

export const basenameAmong = def(
  'basenameAmong :: [String] -> Path -> Boolean',
  (basenames, filePath) => R.compose(
    isAmong(basenames),
    path.basename
  )(filePath)
);

export const extAmong = def(
  'extAmong :: [String] -> Path -> Boolean',
  (extensions, filePath) => R.compose(
    isAmong(extensions),
    path.extname
  )(filePath)
);

export const beginsWithDot = def(
  'beginsWithDot :: String -> Boolean',
  R.compose(
    R.equals('.'),
    R.head
  )
);

export const resolveProjectFile = def(
  'resolveProjectFile :: Path -> Path',
  dir => path.resolve(dir, 'project.xod')
);

export const hasProjectFile = def(
  'hasProjectFile :: Path -> Boolean',
  R.compose(
    doesFileExist,
    resolveProjectFile
  )
);

// :: Path -> Boolean
export const isLocalProjectDirectory = def(
  'isLocalProjectDirectory :: Path -> Boolean',
  R.allPass([
    doesDirectoryExist,
    R.complement(beginsWithDot),
    hasProjectFile,
  ])
);

// =============================================================================
//
// Workspace utils
//
// =============================================================================

export const findProjectMetaByName = def(
  'findProjectMetaByName :: Identifier -> [ProjectFile] -> ProjectFile',
  (nameToFind, projectMetas) => R.find(
    R.compose(
      R.equals(nameToFind),
      getProjectMetaName
    ),
    projectMetas
  )
);
export const filterDefaultProject = def(
  'filterDefaultProject :: [ProjectFile] -> [ProjectFile]',
  R.filter(
    R.compose(
      R.equals(DEFAULT_PROJECT_NAME),
      getProjectMetaName
    )
  )
);

/**
 * Checks that workspacePath is a string and not empty and resolves path
 * (including resolving of homedir character).
 * In case that the application settings doesn't contain any workspace path
 * it could return NULL. So this function will return Promise.Rejected Error.
 * @param {*} workspacePath
 * @returns {Promise<Path,Error>} Resolved path or error with code INVALID_WORKSPACE_PATH.
 */
// :: Path -> Promise Path Error
export const resolveWorkspacePath = R.compose(
  foldEither(
    workspacePath => rejectWithCode(
      ERROR_CODES.INVALID_WORKSPACE_PATH,
      { path: workspacePath }
    ),
    Promise.resolve.bind(Promise)
  ),
  R.map(resolvePath),
  validateSanctuaryType(Path)
);

export const resolveLibPath = def(
  'resolveLibPath :: Path -> Path',
  workspacePath => path.resolve(
    workspacePath, LIBS_DIRNAME
  )
);
export const resolveDefaultProjectPath = def(
  'resolveDefaultProjectPath :: Path -> Path',
  workspacePath => path.resolve(
    workspacePath, DEFAULT_PROJECT_NAME
  )
);

// :: * -> Path
export const ensureWorkspacePath = R.ifElse(
  R.both(R.is(String), notEmpty),
  resolvePath,
  () => resolvePath(DEFAULT_WORKSPACE_PATH)
);

const doesWorkspaceFileExist = def(
  'doesWorkspaceFileExist :: Path -> Boolean',
  R.compose(
    doesFileExist,
    workspacePath => path.resolve(workspacePath, WORKSPACE_FILENAME)
  )
);
const isWorkspaceDirEmptyOrNotExist = def(
  'isWorkspaceDirEmptyOrNotExist :: Path -> Boolean',
  R.tryCatch(
    R.compose(
      R.isEmpty,
      fs.readdirSync
    ),
    R.T
  )
);

// :: Path -> Promise Path Error
export const isWorkspaceValid = R.cond([
  [
    doesWorkspaceFileExist,
    Promise.resolve.bind(Promise),
  ],
  [
    isWorkspaceDirEmptyOrNotExist,
    dirPath => rejectWithCode(
      ERROR_CODES.WORKSPACE_DIR_NOT_EXIST_OR_EMPTY,
      { path: dirPath }
    ),
  ],
  [
    R.T,
    dirPath => rejectWithCode(
      ERROR_CODES.WORKSPACE_DIR_NOT_EMPTY,
      { path: dirPath }
    ),
  ],
]);

// :: Path -> Promise Path Error
export const validateWorkspace = R.pipeP(
  resolveWorkspacePath,
  isWorkspaceValid
);

// :: String -> PatchFileContents -> Promise Error PatchFileContents
export const rejectOnInvalidPatchFileContents = R.curry(
  (filePath, fileContents) => R.compose(
    foldEither(
      () => rejectWithCode(
        ERROR_CODES.INVALID_FILE_CONTENTS,
        { path: filePath }
      ),
      () => Promise.resolve(fileContents)
    ),
    validateSanctuaryType(PatchFileContents),
    // Omit type hints to guarantee full type check of the data loaded from FS.
    // The @@type fields should not be there, and this is en extra layer of
    // protection from improper save.
    omitTypeHints
  )(fileContents)
);
