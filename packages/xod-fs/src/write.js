import { curry } from 'ramda';
import fileSave from 'file-save';
import { resolvePath } from './utils';

// :: outputPath -> data -> Promise
export const writeFile = curry((outputPath, data) => new Promise(
  (resolve, reject) => {
    const resolvedPath = resolvePath(outputPath);
    const fstream = fileSave(resolvedPath);

    fstream.write(data, 'utf8');
    fstream.end();
    fstream.finish(() => resolve({ path: resolvedPath, data }));
    fstream.error((err) => {
      reject(Object.assign(err, { path: resolvedPath, data }));
    });
  }
));

// :: outputPath -> data -> Promise
export const writeJSON = curry((outputPath, data) =>
  writeFile(outputPath, JSON.stringify(data, undefined, 2))
    .catch((err) => { throw Object.assign(err, { path: outputPath, data }); })
);

export default {
  writeFile,
  writeJSON,
};
