import * as path from 'path';
import * as xodFs from 'xod-fs';
import { parseLibUri, toString } from './lib-uri';
import * as messages from './messages';
import * as swagger from './swagger';

/**
 * Checks whether library directory does not already exist.
 * @param {Path} libDir - Library installation directory.
 * @param {LibUri} libUri - Library URI in the package manager.
 * @returns {Promise.<void>}
 */
function libDirDoesNotExist(libDir, libUri) {
  return new Promise((resolve, reject) => {
    if (!xodFs.doesDirectoryExist(libDir)) return resolve();
    return reject(`could not install "${toString(libUri)}".\n` +
      `"${libDir}" is not empty, remove it manually.`);
  });
}

/**
 * Fetches the library version xodball from package manager.
 * @param swaggerClient - `swagger-js` client.
 * @param {LibUri} libUri - Library URI in the package manager.
 * @returns {Promise.<Project>}
 */
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

/**
 * Parses string to the library URI in the package manager.
 * @param string
 * @return {Promise.<LibUri>}
 */
function getLibUri(string) {
  return parseLibUri(string)
    .map(libUri => Promise.resolve.bind(Promise, libUri))
    .getOrElse(Promise.reject.bind(Promise,
      `could not parse "${string}" as <orgname>/<libname>[@<tag>].`))
    .apply();
}

/**
 * Installs the library version from package manager.
 * @param swaggerUrl - Swagger.json URL for package manager.
 * @param {LibUri} libUri - Library URI in the package manager.
 * @param {Path} path2 - Installation destination.
 * @return {Promise.<void>}
 */
export default function install(swaggerUrl, libUri, path2) {
  return Promise
    .all([
      getLibUri(libUri),
      swagger.client(swaggerUrl),
      xodFs.findClosestWorkspaceDir(path2),
    ])
    .then(([libUri2, swaggerClient, workspaceDir]) => {
      const orgDir = path.resolve(workspaceDir, 'lib',
        xodFs.fsSafeName(libUri2.orgname));
      const libDir = path.resolve(orgDir, xodFs.fsSafeName(libUri2.libname));
      return libDirDoesNotExist(libDir, libUri2)
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
