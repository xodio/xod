import { curry, unless, test, concat, __ } from 'ramda';
import { outputFile } from 'fs-extra';
// import fileSave from 'file-save';
import stringify from 'json-stable-stringify';
import { resolvePath } from './utils';

// :: outputPath -> data -> Promise
export const writeFile = curry((outputPath, data, encoding) => {
  const resolvedPath = resolvePath(outputPath);

  const dataWithEol = unless(
    test(/\n$/g),
    concat(__, '\n')
  )(data);

  return outputFile(resolvedPath, dataWithEol, encoding)
    .then(() => ({ path: resolvedPath, data }))
    .catch(
      err => Promise.reject(Object.assign(err, { path: resolvedPath, data }))
    );
});

// :: outputPath -> data -> Promise
export const writeJSON = curry((outputPath, data) =>
  writeFile(outputPath, stringify(data, { space: 2 }), 'utf8')
);

export default {
  writeFile,
  writeJSON,
};
