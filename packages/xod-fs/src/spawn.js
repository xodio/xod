import { curry } from 'ramda';
import path from 'path';
import fs from 'fs-extra';

import { writeFile } from './write';
import { resolvePath, resolveLibPath, resolveDefaultProjectPath } from './utils';
import { WORKSPACE_FILENAME } from './constants';

// :: Path -> Promise Path Error
export const spawnWorkspaceFile = workspacePath =>
  Promise.resolve(resolvePath(workspacePath))
    .then(p => path.resolve(p, WORKSPACE_FILENAME))
    .then(p => writeFile(p, ''))
    .then(() => workspacePath);

// :: Path -> Promise Path Error
export const spawnStdLib = curry((stdLibPath, workspacePath) =>
  fs.copy(stdLibPath, resolveLibPath(workspacePath))
  .then(() => workspacePath)
);

// :: Path -> Promise Path Error
export const spawnDefaultProject = curry((defaultProjectPath, workspacePath) =>
  fs.copy(defaultProjectPath, resolveDefaultProjectPath(workspacePath))
  .then(() => workspacePath)
);

export default {};
