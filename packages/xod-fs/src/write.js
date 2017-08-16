
import { curry } from 'ramda';
import fileSave from 'file-save';
import stringify from 'json-stable-stringify';
import { resolvePath } from './utils';

// :: outputPath -> data -> Promise
export const writeFile = curry((outputPath, data, encoding) => new Promise(
  (resolve, reject) => {
    const resolvedPath = resolvePath(outputPath);
    const fstream = fileSave(resolvedPath);

    fstream.write(data, encoding);
    fstream.end();
    fstream.finish(() => resolve({ path: resolvedPath, data }));
    fstream.error((err) => {
      reject(Object.assign(err, { path: resolvedPath, data }));
    });
  }
));

// :: outputPath -> data -> Promise
export const writeJSON = curry((outputPath, data) =>
  writeFile(outputPath, stringify(data, { space: 2 }), 'utf8')
    .catch((err) => { throw Object.assign(err, { path: outputPath, data }); })
);

export default {
  writeFile,
  writeJSON,
};
