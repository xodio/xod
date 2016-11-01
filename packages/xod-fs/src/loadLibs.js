import R from 'ramda';
import path from 'path';
import { readDir, readJSON, readFile } from './read';
import expandHomeDir from 'expand-home-dir';

const implAccordance = {
  js: 'xod.js',
  espruino: 'espruino.js',
};

const implTypes = Object.keys(implAccordance);

const getPatchName = (metaPath) => {
  const parts = metaPath.split(path.sep);
  return parts[parts.length - 2];
};

const scanLibsFolder = (libs, libsDir) => Promise.all(
  libs.map(
    lib => readDir(path.resolve(libsDir, lib))
      .then(files => files.filter(filename => path.extname(filename) === '.xodm'))
      .catch(err => {
        throw Object.assign(err, {
          path: path.resolve(libsDir, lib),
          libName: lib,
        });
      })
  ))
  .then(R.zipObj(libs));

const readMetaFiles = (metafiles) => {
  const libNames = Object.keys(metafiles);
  let libPromises = [];

  libNames.forEach(name => {
    const libMetas = metafiles[name];

    libPromises = libPromises.concat(
      libMetas.map(metaPath =>
        readJSON(metaPath)
          .then(data => Object.assign(
            data,
            {
              id: `${name}/${getPatchName(metaPath)}`,
              impl: {},
            }
          ))
      )
    );
  });

  return Promise.all(libPromises);
};

const loadImpl = libsDir => metas => {
  const metaPromises = [];

  metas.forEach(meta => metaPromises.push(
    new Promise(resolve => {
      const patchDir = path.resolve(libsDir, meta.id);
      const implPromises = implTypes.map(type => {
        const implPath = path.resolve(patchDir, implAccordance[type]);
        return readFile(implPath)
          .then(data => ([type, data]))
          .catch(err => {
            if (err && err.code === 'ENOENT') {
              return [type, null];
            }

            throw Object.assign(err, { path: implPath, type });
          });
      });

      Promise.all(implPromises)
        .then(impls => {
          const notEmptyImpls = {};
          // remove null implementations
          impls.forEach(impl => {
            if (impl[1] !== null) {
              notEmptyImpls[impl[0]] = impl[1];
            }
          });

          return notEmptyImpls;
        })
        .then(impl => {
          meta.impl = impl; // eslint-disable-line
          return resolve(meta);
        });
    })
  ));

  return Promise.all(metaPromises);
};

export default (libs, workspace) => {
  const libsDir = path.resolve(expandHomeDir(workspace), 'lib');
  return scanLibsFolder(libs, libsDir)
    .then(readMetaFiles)
    .then(loadImpl(libsDir))
    .then(
      (data) => data.reduce(
        (acc, cur) => {
          acc[cur.id] = cur; // eslint-disable-line
          return acc;
        },
        {}
      )
    );
};
