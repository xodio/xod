import R from 'ramda';
import fs from 'fs';
import path from 'path';
import expandHomeDir from 'expand-home-dir';

import {
  notEmpty,
  rejectWithCode,
} from 'xod-func-tools';

import {
  DEFAULT_WORKSPACE_PATH,
  DEFAULT_PROJECT_NAME,
  LIBS_FOLDERNAME,
  WORKSPACE_FILENAME,
} from './constants';

import * as ERROR_CODES from './errorCodes';

// :: string -> string
export const resolvePath = R.ifElse(
  R.allPass([R.is(String), notEmpty]),
  R.compose(
    path.resolve,
    expandHomeDir
  ),
  (p) => { throw new Error(`Path should be a non-empty String. Passed: "${p}" of type "${typeof p}".`); }
);

// :: string -> boolean
export const doesDirectoryExist = R.tryCatch(
  R.compose(
    R.invoker(0, 'isDirectory'),
    fs.statSync,
    resolvePath
  ),
  R.F
);

// :: string -> boolean
export const doesFileExist = R.tryCatch(
  R.compose(
    R.invoker(0, 'isFile'),
    fs.statSync,
    resolvePath
  ),
  R.F
);

const indexByIds = R.indexBy(R.prop('id'));

export const reassignIds = R.evolve({
  nodes: indexByIds,
  links: indexByIds,
});

export const getPatchName = (patchPath) => {
  const parts = patchPath.split(path.sep);
  return parts[parts.length - 2];
};

export const hasExt = R.curry((ext, filename) => R.equals(path.extname(filename), ext));

// =============================================================================
//
// Workspace utils
//
// =============================================================================

// :: ProjectMeta -> Path
export const getProjectMetaPath = R.prop('path');
// :: ProjectMeta -> String
export const getProjectMetaName = R.prop('name');
// :: String -> ProjectMeta[] -> ProjectMeta
export const findProjectMetaByName = R.curry(
  (nameToFind, projectMetas) => R.find(
    R.compose(
      R.equals(nameToFind),
      getProjectMetaName
    ),
    projectMetas
  )
);
// :: ProjectMeta[] -> ProjectMeta
export const filterDefaultProject = R.filter(
  R.compose(
    R.equals(DEFAULT_PROJECT_NAME),
    getProjectMetaName
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

// :: Path -> Path
export const resolveLibPath = workspacePath => path.resolve(
  workspacePath, LIBS_FOLDERNAME
);
// :: Path -> Path
export const resolveDefaultProjectPath = workspacePath => path.resolve(
  workspacePath, DEFAULT_PROJECT_NAME
);
// :: Path -> Path
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
// :: Path -> Boolean
const doesWorkspaceFileExist = R.compose(
  doesFileExist,
  workspacePath => path.resolve(workspacePath, WORKSPACE_FILENAME)
);

// :: Path -> Boolean
const isWorkspaceDirEmptyOrNotExist = R.tryCatch(
  R.compose(
    R.isEmpty,
    fs.readdirSync
  ),
  R.T
);

// :: Path -> Boolean
const doesWorkspaceHaveStdLib = R.compose(
  doesDirectoryExist,
  resolveLibPath
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
