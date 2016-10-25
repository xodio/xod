import { curry } from 'ramda';
import path from 'path';
import { writeJSON } from './write';

// :: pathToWorkspace -> data -> Promise
const saveData = curry((pathToWorkspace, data) => new Promise((resolve, reject) => {
  const filePath = path.resolve(pathToWorkspace, data.path);
  return writeJSON(filePath, data.content).then(resolve).catch(reject);
}));

// :: pathToWorkspace -> data -> Promise
export default curry((pathToWorkspace, data) => {
  let savingFiles = [];

  if (data instanceof Array) {
    savingFiles = data.map(saveData(pathToWorkspace));
  }

  if (
    typeof data === 'object' &&
    Object.hasOwnProperty.call(data, 'path') &&
    Object.hasOwnProperty.call(data, 'content')
  ) {
    savingFiles.push(saveData(pathToWorkspace, data));
  }

  return Promise.all(savingFiles);
});
