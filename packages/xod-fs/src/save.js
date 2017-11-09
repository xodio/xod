import path from 'path';
import R from 'ramda';
import { rejectWithCode } from 'xod-func-tools';

import { resolvePath, expandHomeDir, isPatchFile, isProjectFile, resolveLibPath } from './utils';
import { writeFile, writeJSON } from './write';
import { Backup } from './backup';
import { arrangeByFiles, fsSafeName } from './unpack';
import {
  omitDefaultOptionsFromPatchFileContents,
  omitDefaultOptionsFromProjectFileContents,
} from './convertTypes';
import * as ERROR_CODES from './errorCodes';

// :: pathToWorkspace -> data -> Promise
const saveData = R.curry((pathToWorkspace, data) => new Promise((resolve, reject) => {
  const filePath = path.resolve(resolvePath(pathToWorkspace), data.path);
  // Decide how to write file, as JSON, or as string:
  const writeFn = (typeof data.content === 'string') ? writeFile : writeJSON;
  // Write
  return writeFn(filePath, data.content, data.encoding || 'utf8').then(resolve).catch(reject);
}));

// :: pathToWorkspace -> data -> Promise
export const saveArrangedFiles = R.curry((pathToWorkspace, data) => {
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
        .catch(err => backup.restore()
          .then(() => Promise.reject(err))
        );
    });
});

// :: Path -> Project -> Promise Project Error
export const saveProject = R.curry(
  (workspacePath, project) => Promise.resolve(project)
    .then(arrangeByFiles)
    .then(R.map(R.cond([
      [
        isPatchFile,
        R.over(R.lensProp('content'), omitDefaultOptionsFromPatchFileContents),
      ],
      [
        isProjectFile,
        R.over(R.lensProp('content'), omitDefaultOptionsFromProjectFileContents),
      ],
      [R.T, R.identity],
    ])))
    .then(saveArrangedFiles(workspacePath))
    .then(R.always(project))
    .catch(rejectWithCode(ERROR_CODES.CANT_SAVE_PROJECT))
);

// :: String -> Project -> Path -> Promise Project Error
export const saveProjectAsLibrary = R.curry(
  (owner, project, workspacePath) => {
    const distPath = R.compose(
      libPath => path.resolve(libPath, fsSafeName(owner)),
      resolveLibPath
    )(workspacePath);

    return saveProject(distPath, project)
      .catch(rejectWithCode(ERROR_CODES.CANT_SAVE_LIBRARY));
  }
);

export default saveProject;
