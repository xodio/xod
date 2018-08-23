import * as R from 'ramda';
import path from 'path';
import fse from 'fs-extra';
import fetch from 'node-fetch';
import { tapP } from 'xod-func-tools';

/**
 * Downloads some file from the internet and put in the destination path.
 * If the destination path has directories that do not exist it creates them.
 */
// :: URL -> Path -> Promise Path Error
export default R.curry((url, destinationPath) =>
  fetch(url)
    .then(tapP(() => fse.ensureDir(path.dirname(destinationPath))))
    .then(res => {
      const partPath = `${destinationPath}.part`;
      const file = fse.createWriteStream(partPath);
      return new Promise((resolve, reject) => {
        res.body
          .pipe(file)
          .on('error', reject)
          .on('finish', () => {
            file.close(() => resolve(partPath));
          });
      });
    })
    .then(partPath => fse.rename(partPath, destinationPath))
    .then(R.always(destinationPath))
);
