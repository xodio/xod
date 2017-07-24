import R from 'ramda';
import path from 'path';

import * as XP from 'xod-project';

import { readDir, readJSON } from './read';
import {
  resolvePath,
  getPatchName,
  hasExt,
  rejectOnInvalidPatchFileContents,
} from './utils';
import { loadAttachments } from './attachments';
import { loadPatchImpls } from './impls';
import {
  convertPatchFileContentsToPatch,
  addMissingOptionsToPatchFileContents,
} from './convertTypes';

const scanLibsFolder = (libs, libsDir) => Promise.all(
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
          loadPatchImpls(path.dirname(patchPath)),
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

export const loadLibs = (libs, workspace) => {
  const libsDir = path.resolve(resolvePath(workspace), 'lib');
  return scanLibsFolder(libs, libsDir)
    .then(readLibFiles)
    .then(R.indexBy(XP.getPatchPath));
};

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

export const loadAllLibs = (workspace) => {
  const libsDir = path.resolve(resolvePath(workspace), 'lib');
  const folder = '.';

  return scanLibsFolder([folder], libsDir)
    .then(R.compose(
      extractLibNamesFromFilenames(libsDir),
      R.prop(folder)
    ))
    .then(libs => loadLibs(libs, workspace))
    .catch((err) => {
      // Catch error ENOENT in case if libsDir is not found.
      // E.G. User deleted it before select project.
      // So in this case we'll return just empty array of libs.
      if (err.code === 'ENOENT') return Promise.resolve([]);
      return Promise.reject(err);
    });
};
