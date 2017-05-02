import R from 'ramda';
import P from 'path';
import FS from 'fs';
import {
  resolvePath,
  writeFile,
  copy,
  getProjects,
  isDirectoryExists,
  isFileExists,
} from 'xod-fs';
import {
  notEmpty,
} from 'xod-func-tools';

import rejectWithCode, * as ERROR_CODES from './errorCodes';
import * as settings from './settings';
import {
  DEFAULT_WORKSPACE_PATH,
  WORKSPACE_FILENAME,
  PATH_TO_DEFAULT_WORKSPACE,
  LIBS_FOLDERNAME,
  DEFAULT_PROJECT_NAME,
} from './constants';

// =============================================================================
//
// Utils
//
// =============================================================================

// :: Path -> Promise Path Error
export const validatePath = path => Promise.resolve(path)
  .then(R.unless(
    R.allPass([
      R.is(String),
      notEmpty,
    ]),
    Promise.reject(new Error())
  ))
  .then(resolvePath)
  .catch(rejectWithCode(ERROR_CODES.INVALID_WORKSPACE_PATH));

const createWorkspaceFile = () => '';

// :: Path -> Path
const resolveStdLibDestination = path => P.resolve(path, LIBS_FOLDERNAME);
// :: Path -> Path
const resolveDefaultProjectDestination = path => P.resolve(path, DEFAULT_PROJECT_NAME);

// :: () -> Path
const getStdLibPath = () => P.resolve(
  __dirname, PATH_TO_DEFAULT_WORKSPACE, LIBS_FOLDERNAME
);
// :: () -> Path
const getDefaultProjectPath = () => P.resolve(
  __dirname, PATH_TO_DEFAULT_WORKSPACE, DEFAULT_PROJECT_NAME
);

// :: Path -> ProjectMeta[] -> ProjectMeta[]
export const filterLocalProjects = R.curry((workspacePath, projects) => R.reject(
R.compose(
  R.equals(LIBS_FOLDERNAME),
  R.head,
  R.split(P.sep),
  projectPath => P.relative(workspacePath, projectPath),
  R.prop('path')
),
projects
));

// =============================================================================
//
// Unpure things
//
// =============================================================================

// :: () -> Promise.Resolved Path
export const loadWorkspacePath = R.compose(
  path => Promise.resolve(path),
  settings.getWorkspacePath,
  settings.load
);

// :: Path -> Promise.Resolved Path
export const saveWorkspacePath = path => R.compose(
    R.always(Promise.resolve(path)),
    settings.save,
    settings.setWorkspacePath(path),
    settings.load
  )();


// :: () -> Promise.Resolved String
export const getHomeDir = () => Promise.resolve(DEFAULT_WORKSPACE_PATH);

// :: Path -> Promise Path Error
const isWorkspaceDirExists = path => Promise.resolve(path)
  .then(isDirectoryExists)
  .then((exist) => {
    if (exist) return path;
    return rejectWithCode(ERROR_CODES.WORKSPACE_DIR_NOT_EXIST, new Error());
  });

// :: Path -> Promise Boolean Error
const isWorkspaceDirEmpty = path => new Promise(
  (resolve, reject) => FS.readdir(path, (err, files) => {
    if (err) return reject(err);
    return resolve(!files.length);
  })
);

// :: Path -> Promise Boolean Error
const isWorkspaceFileExists = path => Promise.resolve(path)
  .then(p => P.resolve(p, WORKSPACE_FILENAME))
  .then(isFileExists);

// :: Path -> Promise Path Error
export const isWorkspaceValid = path => Promise.all([
  isWorkspaceFileExists(path),
  isWorkspaceDirEmpty(path),
])
  .then(R.any(R.equals(true)))
  .then((isValid) => {
    if (isValid) return path;
    return rejectWithCode(ERROR_CODES.WORKSPACE_DIR_NOT_EMPTY, new Error());
  });

// :: Path -> Promise Path Error
export const validateWorkspace = R.pipeP(
  validatePath,
  isWorkspaceDirExists,
  isWorkspaceValid
);

// :: Path -> Promise Path Error
export const spawnWorkspaceFile = path => Promise.resolve(path)
  .then(p => P.resolve(p, WORKSPACE_FILENAME))
  .then(p => writeFile(p, createWorkspaceFile()))
  .then(R.always(path))
  .catch(rejectWithCode(ERROR_CODES.CANT_CREATE_WORKSPACE_FILE));

// :: Path -> Promise Path Error
export const spawnStdLib = path => Promise.resolve(path)
  .then(resolveStdLibDestination)
  .then(copy(getStdLibPath()))
  .then(R.always(path))
  .catch(rejectWithCode(ERROR_CODES.CANT_COPY_STDLIB));

// :: Path -> Promise Path Error
export const spawnDefaultProject = path => Promise.resolve(path)
  .then(resolveDefaultProjectDestination)
  .then(copy(getDefaultProjectPath()))
  .then(R.always(path))
  .catch(rejectWithCode(ERROR_CODES.CANT_COPY_DEFAULT_PROJECT));

// :: Path -> Promise ProjectMeta[] Error
export const enumerateProjects = path => getProjects(path)
  .catch(rejectWithCode(ERROR_CODES.CANT_ENUMERATE_PROJECTS));

// =============================================================================
//
// Compositions of steps to get coherent workspace
//
// =============================================================================

// TODO
