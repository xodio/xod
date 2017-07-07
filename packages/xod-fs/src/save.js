import path from 'path';
import { curry } from 'ramda';
import { rejectWithCode } from 'xod-func-tools';

import { resolvePath, expandHomeDir } from './utils';
import { writeFile, writeJSON } from './write';
import { Backup } from './backup';
import { arrangeByFiles } from './unpack';
import * as ERROR_CODES from './errorCodes';

// :: pathToWorkspace -> data -> Promise
const saveData = curry((pathToWorkspace, data) => new Promise((resolve, reject) => {
  const filePath = path.resolve(resolvePath(pathToWorkspace), data.path);
  // Decide how to write file, as JSON, or as string:
  const writeFn = (typeof data.content === 'string') ? writeFile : writeJSON;
  // Write
  return writeFn(filePath, data.content, data.encoding || 'utf8').then(resolve).catch(reject);
}));

// :: pathToWorkspace -> data -> Promise
export const saveArrangedFiles = curry((pathToWorkspace, data) => {
  let savingFiles = [];

  if (typeof data !== 'object') {
    throw Object.assign(
      new Error("Can't save project: wrong data format was passed into save function."),
      {
        path: resolvePath(pathToWorkspace),
        data,
      }
    );
  }
  const workspace = resolvePath(pathToWorkspace);
  const isArray = (data instanceof Array);
  const dataToSave = isArray ? data : [data];
  const projectDir = dataToSave[0].path.split(path.sep)[1];

  const pathToProject = expandHomeDir(path.resolve(workspace, projectDir));
  const pathToTemp = expandHomeDir(path.resolve(workspace, './.tmp/'));
  const backup = new Backup(pathToProject, pathToTemp);

  return backup.make()
    .then(() => {
      savingFiles = dataToSave.map(saveData(workspace));

      return Promise.all(savingFiles)
        .then(backup.clear)
        .catch((err) => {
          backup.restore()
            .then(() => { throw err; });
        });
    });
});

// :: Path -> Project -> Promise Project Error
export const saveProject = curry(
  (workspacePath, project) => Promise.resolve(project)
    .then(arrangeByFiles)
    .then(saveArrangedFiles(workspacePath))
    .then(() => project)
    .catch(rejectWithCode(ERROR_CODES.CANT_SAVE_PROJECT))
);

export default saveProject;
