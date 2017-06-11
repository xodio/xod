import { lstat } from 'fs';
import { resolve } from 'path';
import * as xodFs from 'xod-fs';
import { parseLibUri, toString } from './lib-uri';
import * as messages from './messages';
import * as swagger from './swagger';

function checkLibDirConflict(libDir, libUri) {
  return new Promise((resolve2, reject) => {
    lstat(libDir, (err, stat) => {
      if (!err && stat.isDirectory()) {
        return reject(`could not install "${toString(libUri)}".\n` +
          `"${libDir}" is not empty, remove it manually.`);
      }
      return resolve2();
    });
  });
}

function getLib(swaggerClient, libUri) {
  const { libname, orgname, tag } = libUri;
  const { Library, Version } = swaggerClient.apis;
  return Promise.resolve(tag)
    .then(tag2 =>
      (tag2 !== 'latest' ? tag2 : Library.getOrgLib({ libname, orgname })
        .then(({ obj: lib }) => lib.versions[0])))
    .then(semver =>
      Version.getLibVersionXodball({ libname, orgname, semver })
        .then(({ obj: xodball }) => xodball))
    .catch(err =>
      Promise.reject(err.status === 404
        ? `could not find "${toString(libUri)}".`
        : swagger.stringifyError(err)));
}

function getLibUri(libUri) {
  return parseLibUri(libUri)
    .map(libUri2 => Promise.resolve.bind(Promise, libUri2))
    .getOrElse(Promise.reject.bind(Promise, `could not parse "${libUri}".`))
    .apply();
}

export default function install(swaggerUrl, libUri, path) {
  return Promise
    .all([
      getLibUri(libUri),
      swagger.client(swaggerUrl),
      xodFs.findClosestWorkspaceDir(path),
    ])
    .then(([libUri2, swaggerClient, workspaceDir]) => {
      const orgDir = resolve(workspaceDir, 'lib',
        xodFs.fsSafeName(libUri2.orgname));
      const libDir = resolve(orgDir, xodFs.fsSafeName(libUri2.libname));
      return checkLibDirConflict(libDir, libUri2)
        .then(() => getLib(swaggerClient, libUri2))
        .then(xodFs.saveProject(orgDir))
        .then(() => `Installed "${toString(libUri2)}" at "${libDir}".`);
    })
    .then(messages.success)
    .catch((err) => {
      messages.error(err);
      process.exit(1);
    });
}
