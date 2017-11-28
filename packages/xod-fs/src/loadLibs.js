import R from 'ramda';
import path from 'path';

import * as XP from 'xod-project';
import { uniqLists } from 'xod-func-tools';

import { readDir, readJSON } from './read';
import {
  getPatchName,
  hasExt,
  rejectOnInvalidPatchFileContents,
  resolveLibPath,
} from './utils';
import { loadAttachments } from './attachments';
import {
  convertPatchFileContentsToPatch,
  addMissingOptionsToPatchFileContents,
} from './convertTypes';

const scanLibsFolder = (libs, libsDir) =>
  Promise.all(
    libs.map(
      lib => readDir(path.resolve(libsDir, lib))
        .then(R.filter(hasExt('.xodp')))
        .catch((err) => {
          throw Object.assign(err, {
            path: path.resolve(libsDir, lib),
            libName: lib,
          });
        })
    ))
    .then(R.zipObj(libs));

const readLibFiles = (libfiles) => {
  const libNames = Object.keys(libfiles);
  let libPromises = [];

  libNames.forEach((name) => {
    const files = libfiles[name];

    libPromises = libPromises.concat(
      files.map(patchPath =>
        R.composeP(
          loadAttachments(path.dirname(patchPath)),
          R.assoc('path', `${name}/${getPatchName(patchPath)}`),
          convertPatchFileContentsToPatch,
          rejectOnInvalidPatchFileContents(patchPath),
          addMissingOptionsToPatchFileContents,
          readJSON
        )(patchPath)
      )
    );
  });

  return Promise.all(libPromises);
};

export const loadLibrary = (libs, libsDir) =>
  scanLibsFolder(libs, libsDir)
    .then(readLibFiles)
    .then(R.indexBy(XP.getPatchPath));

// extract libNames from paths to xod-files
// for example: '/Users/vasya/xod/lib/xod/core/and/patch.xodm' -> 'xod/core'
// :: string[] -> string[]
const extractLibNamesFromFilenames = libsDir => R.compose(
  R.uniq,
  R.map(
    R.compose(
      R.join('/'),
      R.take(2),
      R.split(path.sep),
      filename => path.relative(libsDir, filename)
    )
  )
);

// :: Path -> Promise [LibName]
const scanForLibNames = (libDir) => {
  const folder = '.';

  return R.composeP(
    extractLibNamesFromFilenames(libDir),
    R.prop(folder),
    scanLibsFolder
  )([folder], libDir)
    .catch((err) => {
      // Catch error ENOENT in case if libsDir is not found.
      // E.G. User deleted it before select project.
      // So in this case we'll return just empty array of libs.
      if (err.code === 'ENOENT') return Promise.resolve([]);
      return Promise.reject(err);
    });
};

// :: Path -> Promise [LibName]
export const scanWorkspaceForLibNames = wsPath => scanForLibNames(resolveLibPath(wsPath));

// :: [Path] -> Map PatchPath Patch
export const loadLibs = libDirs => R.composeP(
  R.mergeAll,
  R.unnest,
  libPairs => Promise.all(
    R.map(
      ([libDir, libs]) => loadLibrary(libs, libDir),
      libPairs
    )
  ),
  R.toPairs,
  R.reject(R.isEmpty),
  R.zipObj(libDirs),
  uniqLists,
  libDir => Promise.all(R.map(scanForLibNames, libDir))
)(libDirs);
