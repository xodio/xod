import path from 'path';
import expandHomeDir from 'expand-home-dir';
import { curry } from 'ramda';
import { writeJSON } from './write';
import { Backup } from './backup';

// :: pathToWorkspace -> data -> Promise
const saveData = curry((pathToWorkspace, data) => new Promise((resolve, reject) => {
  const filePath = path.resolve(pathToWorkspace, data.path);
  return writeJSON(filePath, data.content).then(resolve).catch(reject);
}));

// :: pathToWorkspace -> data -> Promise
export default curry((pathToWorkspace, data) => {
  let savingFiles = [];

  if (typeof data !== 'object') {
    throw Object.assign(
      new Error("Can't save project: wrong data format was passed into save function."),
      {
        path: pathToWorkspace,
        data,
      }
    );
  }
  const isArray = (data instanceof Array);
  const dataToSave = isArray ? data : [data];
  const projectDir = dataToSave[0].path.split('/')[1];

  const pathToProject = expandHomeDir(path.resolve(pathToWorkspace, projectDir));
  const pathToTemp = expandHomeDir(path.resolve(pathToWorkspace, './.tmp/'));
  const backup = new Backup(pathToProject, pathToTemp);

  return backup.make()
    .then(() => {
      savingFiles = dataToSave.map(saveData(pathToWorkspace));

      return Promise.all(savingFiles)
        .then(backup.clear)
        .catch(err => {
          backup.restore()
            .then(() => { throw err; });
        });
    });
});
