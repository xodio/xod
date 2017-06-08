import fs from 'fs';
import path from 'path';
import * as xodFs from 'xod-fs';
import LibUri from './LibUri';
import * as messages from './messages';
import * as swagger from './swagger';

function checkLibDirConflict(libDir, libUri) {
  return new Promise((resolve, reject) => {
    fs.lstat(libDir, (err, stat) => {
      if (!err && stat.isDirectory()) {
        return reject(`could not install "${libUri}".\n` +
          `"${libDir}" is not empty, remove it manually.`);
      }
      return resolve();
    });
  });
}

function getLib(swaggerClient, libUri) {
  const { libname, orgname, tag } = libUri;
  const { Library, Version } = swaggerClient.apis;
  return (tag !== 'latest' ? Promise.resolve(tag) : Library
    .getOrgLib({ libname, orgname }).then(({ obj: lib }) => {
      const [semver] = lib.versions;
      if (!semver) return Promise.reject({ status: 404 });
      return semver;
    }))
    .then(semver =>
      Version.getLibVersionXodball({ libname, orgname, semver })
        .then(({ obj: xodball }) => xodball))
    .catch((err) => {
      if (err.status === 404) {
        return Promise.reject(`could not find "${libUri}".`);
      }
      return Promise.reject(swagger.stringifyError(err));
    });
}

export default function install(libUri, path2) {
  return Promise
    .all([
      LibUri.parse(libUri),
      swagger.client(swagger.URL),
      xodFs.findClosestWorkspaceDir(path2),
    ])
    .then(([libUri2, swaggerClient, workspaceDir]) => {
      const { libname, orgname } = libUri2;
      const orgDir = path.resolve(workspaceDir, 'lib',
        xodFs.fsSafeName(orgname));
      const libDir = path.resolve(orgDir, xodFs.fsSafeName(libname));
      return checkLibDirConflict(libDir, libUri2)
        .then(() => getLib(swaggerClient, libUri2))
        .then(xodFs.saveProject(orgDir))
        .then(() => `Installed "${libUri2}" at "${libDir}".`);
    })
    .then(messages.success)
    .catch((err) => {
      messages.error(err);
      process.exit(1);
    });
}
