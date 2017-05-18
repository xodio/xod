import R from 'ramda';
import fs from 'fs';
import path from 'path';
import expandHomeDir from 'expand-home-dir';

import {
  rejectWithCode,
} from 'xod-func-tools';

import { def } from './types';

import {
  DEFAULT_WORKSPACE_PATH,
  DEFAULT_PROJECT_NAME,
  LIBS_FOLDERNAME,
  WORKSPACE_FILENAME,
} from './constants';

import * as ERROR_CODES from './errorCodes';

const indexByIds = R.indexBy(R.prop('id'));

export const reassignIds = R.evolve({
  nodes: indexByIds,
  links: indexByIds,
});

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
export const resolveWorkspacePath = R.tryCatch(
  R.compose(
    Promise.resolve.bind(Promise),
    resolvePath
  ),
  workspacePath => rejectWithCode(
    ERROR_CODES.INVALID_WORKSPACE_PATH,
    { path: workspacePath }
  )
);

export const resolveLibPath = def(
  'resolveLibPath :: Path -> Path',
  workspacePath => path.resolve(
    workspacePath, LIBS_FOLDERNAME
  )
);
export const resolveDefaultProjectPath = def(
  'resolveDefaultProjectPath :: Path -> Path',
  workspacePath => path.resolve(
    workspacePath, DEFAULT_PROJECT_NAME
  )
);

// :: * -> Path
export const ensureWorkspacePath = R.tryCatch(
  resolvePath,
  () => resolvePath(DEFAULT_WORKSPACE_PATH)
);

// :: Path -> Promise Path Error
const doesWorkspaceDirExist = R.ifElse(
  doesDirectoryExist,
  Promise.resolve.bind(Promise),
  dirPath => rejectWithCode(
    ERROR_CODES.WORKSPACE_DIR_NOT_EXIST_OR_EMPTY,
    { path: dirPath }
  )
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
const doesWorkspaceHaveStdLib = def(
  'doesWorkspaceHaveStdLib :: Path -> Boolean',
  R.compose(
    doesDirectoryExist,
    resolveLibPath
  )
);

// :: Path -> Promise Path Error
export const isWorkspaceValid = R.cond([
  [
    R.both(doesWorkspaceFileExist, doesWorkspaceHaveStdLib),
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
  doesWorkspaceDirExist,
  isWorkspaceValid
);
