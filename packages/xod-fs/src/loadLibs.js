import path from 'path';
import { readDir, readJSON, readFile } from './read';
import expandHomeDir from 'expand-home-dir';

const implAccordance = {
  js: 'xod.js',
  espruino: 'espruino.js',
};

const implTypes = Object.keys(implAccordance);

const getPatchName = (metaPath) => {
  const parts = metaPath.split('/');
  return parts[parts.length - 2];
};

const scanLibsFolder = (libs, libsDir) => new Promise((resolve, reject) => {
  const loaded = {};
  let libsCount = libs.length;

  libs.forEach(lib =>
    readDir(path.resolve(libsDir, lib))
      .then(files => files.filter(filename => path.extname(filename) === '.xodm'))
      .then(metas => {
        loaded[lib] = metas;
        libsCount--;

        if (libsCount === 0) {
          resolve(loaded);
        }
      })
      .catch(err => {
        reject(Object.assign(err, {
          path: path.resolve(libsDir, lib),
          libName: lib,
        }));
      })
  );
});

const readMetaFiles = (metafiles) => {
  const libNames = Object.keys(metafiles);
  let libsPromisses = [];

  libNames.forEach(name => {
    const libMetas = metafiles[name];

    libsPromisses = libMetas.map(metaPath =>
      readJSON(metaPath)
        .then(data => Object.assign(
          data,
          {
            id: `${name}/${getPatchName(metaPath)}`,
            impl: {},
          }
        ))
    );
  });

  return Promise.all(libsPromisses);
};

const loadImpl = libsDir => metas => {
  const metaPromises = [];

  metas.forEach(meta => metaPromises.push(
    new Promise(resolve => {
      let implPromises = [];
      const patchDir = path.resolve(libsDir, meta.id);

      implPromises = implTypes.map(type => {
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
