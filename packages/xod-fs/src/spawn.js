import { curry } from 'ramda';
import path from 'path';
import copy from 'recursive-copy';
import { rejectWithCode } from 'xod-func-tools';

import { writeFile } from './write';
import { resolvePath, resolveLibPath, resolveDefaultProjectPath } from './utils';
import { WORKSPACE_FILENAME } from './constants';
import * as ERROR_CODES from './errorCodes';

const copyOptions = {
  overwrite: true,
};

// :: Path -> Promise Path Error
export const spawnWorkspaceFile = workspacePath =>
  Promise.resolve(resolvePath(workspacePath))
    .then(p => path.resolve(p, WORKSPACE_FILENAME))
    .then(p => writeFile(p, '', 'utf8'))
    .then(() => workspacePath)
    .catch(rejectWithCode(ERROR_CODES.CANT_CREATE_WORKSPACE_FILE));

// :: Path -> Promise Path Error
export const spawnStdLib = curry((stdLibPath, workspacePath) =>
  copy(stdLibPath, resolveLibPath(workspacePath), copyOptions)
  .then(() => workspacePath)
  .catch(rejectWithCode(ERROR_CODES.CANT_COPY_STDLIB))
);

// :: Path -> Promise Path Error
export const spawnDefaultProject = curry((defaultProjectPath, workspacePath) =>
  copy(defaultProjectPath, resolveDefaultProjectPath(workspacePath), copyOptions)
  .then(() => workspacePath)
  .catch(rejectWithCode(ERROR_CODES.CANT_COPY_DEFAULT_PROJECT))
);

export default {};
