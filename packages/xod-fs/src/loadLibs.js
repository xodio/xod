import path from 'path';
import fs from 'fs';
import recReadDir from 'recursive-readdir';
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

  libs.forEach(lib => recReadDir(
    path.resolve(libsDir, lib),
    (err, files) => {
      if (err) {
        reject(err);
      }

      const metas = files.filter(
        filename => path.extname(filename) === '.xodm'
      );

      loaded[lib] = metas;
      libsCount--;

      if (libsCount === 0) {
        resolve(loaded);
      }
    }
  ));
});

const readMetaFiles = (metafiles) => {
  const libNames = Object.keys(metafiles);
  const libsPromisses = [];

  libNames.forEach(name => {
    const libMetas = metafiles[name];

    libMetas.forEach(metaPath => {
      libsPromisses.push(
        new Promise((resolve) => fs.readFile(metaPath, 'utf8', (err, filedata) => {
          if (err) { throw err; }

          const patchName = getPatchName(metaPath);
          const result = JSON.parse(filedata);
          result.id = `${name}/${patchName}`;
          result.impl = {};

          resolve(result);
        }))
      );
    });
  });

  return Promise.all(libsPromisses);
};

const loadImpl = libsDir => metas => {
  const metaPromises = [];

  metas.forEach(meta => metaPromises.push(
    new Promise(resolve => {
      const implPromises = [];
      const patchDir = path.resolve(libsDir, meta.id);

      implTypes.forEach(type => implPromises.push(
        new Promise(resolveImpl => {
          const implPath = path.resolve(patchDir, implAccordance[type]);
          fs.stat(implPath, (err) => {
            if (err && err.code === 'ENOENT') {
              resolveImpl([type, null]);
            }

            fs.readFile(implPath, 'utf-8', (errReadImpl, data) => {
              resolveImpl([type, data]);
            });
          });
        })
      ));

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
