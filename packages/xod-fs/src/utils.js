import R from 'ramda';
import fs from 'fs';
import path from 'path';
import expandHomeDir from 'expand-home-dir';

import {
  notEmpty,
} from 'xod-func-tools';

import {
  DEFAULT_WORKSPACE_PATH,
  DEFAULT_PROJECT_NAME,
  LIBS_FOLDERNAME,
  WORKSPACE_FILENAME,
} from './constants';

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
    R.pathEq(['meta', 'name'], nameToFind),
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
// :: Path -> Boolean
export const doesWorkspaceFileExist = R.compose(
  doesFileExist,
  workspacePath => path.resolve(workspacePath, WORKSPACE_FILENAME)
);
