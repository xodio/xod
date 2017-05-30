import fs from 'fs';
import path from 'path';
import recReadDir from 'recursive-readdir';

import { expandHomeDir } from './utils';

// :: rootPath -> Promise
export const readDir = rootPath => new Promise(
  (resolve, reject) => {
    const resolvedPath = path.resolve(expandHomeDir(rootPath));
    recReadDir(resolvedPath, (err, files) => {
      if (err) { reject(err); return; }
      resolve(files);
    });
  }
);

// :: inputPath -> Promise
export const readFile = inputPath => new Promise(
  (resolve, reject) => {
    const resolvedPath = path.resolve(expandHomeDir(inputPath));
    fs.readFile(resolvedPath, 'utf8', (err, data) => {
      if (err) {
        const error = Object.assign(err, { path: resolvedPath });
        reject(error);
        return;
      }
      resolve(data);
    });
  }
);

// :: inputPath -> Promise
export const readJSON = inputPath =>
  readFile(inputPath)
    .then(JSON.parse)
    .catch((err) => { throw Object.assign(err, { path: inputPath }); });

export default {
  readDir,
  readFile,
  readJSON,
};
