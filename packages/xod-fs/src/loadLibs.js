import R from 'ramda';
import path from 'path';
import { readDir, readJSON, readFile } from './read';
import { IMPL_TYPES } from './constants';
import {
  resolvePath,
  reassignIds,
  getPatchName,
  hasExt,
  getImplFilenameByType,
} from './utils';
import { loadAttachments } from './attachments';
import { loadPatchImpls } from './impls';

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
          loadAttachments(path.resolve(patchPath, '..')),
          loadPatchImpls(path.resolve(patchPath, '..')),
          reassignIds,
          R.assoc('path', `${name}/${getPatchName(patchPath)}`),
          readJSON
        )(patchPath)
      )
    );
  });

  return Promise.all(libPromises);
};

const loadImpl = libsDir => (patches) => {
  const patchPromises = [];

  patches.forEach(patch => patchPromises.push(
    new Promise((resolve) => {
      const patchDir = path.resolve(libsDir, patch.path);
      const implPromises = IMPL_TYPES.map((type) => {
        const implPath = path.resolve(patchDir, getImplFilenameByType(type));
        return readFile(implPath)
          .then(data => ([type, data]))
          .catch((err) => {
            if (err && err.code === 'ENOENT') {
              return [type, null];
            }

            throw Object.assign(err, { path: implPath, type });
          });
      });

      Promise.all(implPromises)
        .then((impls) => {
          const notEmptyImpls = {};
          // remove null implementations
          impls.forEach((impl) => {
            if (impl[1] !== null) {
              notEmptyImpls[impl[0]] = impl[1];
            }
          });

          return notEmptyImpls;
        })
        .then(impls => resolve(R.assoc('impls', impls, patch)));
    })
  ));

  return Promise.all(patchPromises);
};

export const loadLibs = (libs, workspace) => {
  const libsDir = path.resolve(resolvePath(workspace), 'lib');
  return scanLibsFolder(libs, libsDir)
    .then(readLibFiles)
    .then(loadImpl(libsDir))
    .then(R.indexBy(R.prop('path')));
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
  return scanLibsFolder(['.'], libsDir)
    .then(R.compose(
      extractLibNamesFromFilenames(libsDir),
      R.prop(['.'])
    ))
    .then(libs => loadLibs(libs, workspace));
};
