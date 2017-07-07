import R from 'ramda';
import path from 'path';
import fs from 'fs-extra';
import * as XF from 'xod-func-tools';

import {
  getImplTypeByFilename,
  extAmong,
} from './utils';

// Returns a promise of filename / content pair for a given
// `filename` path relative to `dir`
// :: String -> String -> Promise (Pair String String)
const readImplFile = dir => filename =>
  fs.readFile(path.resolve(dir, filename), 'utf8').then(content => [
    getImplTypeByFilename(filename),
    content,
  ]);

// Returns a map with filenames in keys and contents in values of
// all implementation source files in a directory given as argument
// :: String -> Promise (StrMap String) Error
const readImplFiles = dir => R.composeP(
  R.fromPairs,
  XF.allPromises,
  R.map(readImplFile(dir)),
  R.filter(extAmong(['.c', '.cpp', '.h', '.inl', '.js'])),
  fs.readdir
)(dir);

// :: Path -> String -> Promise Patch Error
export const loadPatchImpls = R.curry(
  (patchDir, data) => readImplFiles(patchDir)
    .then(impls => R.merge(data, { impls }))
);

export default loadPatchImpls;
