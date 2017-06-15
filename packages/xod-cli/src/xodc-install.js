import * as path from 'path';
import * as xodFs from 'xod-fs';
import { parseLibUri, toString, toStringWithoutTag } from './lib-uri';
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
    return reject(new Error(`could not install "${toString(libUri)}".\n` +
      `"${libDir}" is not empty, remove it manually.`));
  });
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
      new Error(`could not parse "${string}" as <orgname>/<libname>[@<tag>].`)))
    .apply();
}

/**
 * Returns the semver from `libUri` or fetches it from the package manager.
 * @param swaggerClient - `swagger-js` client.
 * @param {LibUri} libUri - Library URI in the package manager.
 * @returns {Promise.<Semver>}
 */
function getSemver(swaggerClient, libUri) {
  const { libname, orgname, tag } = libUri;
  if (tag !== 'latest') return Promise.resolve(tag);
  return swaggerClient.apis.Library.getOrgLib({ libname, orgname })
    .catch((err) => {
      if (err.status !== 404) throw swagger.error(err);
      throw new Error('could not find library ' +
        `"${toStringWithoutTag(libUri)}".`);
    })
    .then(({ obj: lib }) => {
      const [version] = lib.versions;
      if (version) return version;
      throw new Error('could not find latest version of ' +
        `"${toStringWithoutTag(libUri)}".`);
    });
}

/**
 * Fetches the library version xodball from package manager.
 * @param swaggerClient - `swagger-js` client.
 * @param {LibUri} libUri - Library URI in the package manager.
 * @param {Semver} semver
 * @returns {Promise.<Xodball>}
 */
function loadXodball(swaggerClient, libUri, semver) {
  const { libname, orgname } = libUri;
  return swaggerClient.apis.Version.getLibVersionXodball({
    libname, orgname, semver,
  }).then(({ obj: xodball }) => xodball)
    .catch((err) => {
      if (err.status !== 404) throw swagger.error(err);
      throw new Error(`could not find version "${toString(libUri)}".`);
    });
}

/**
 * Returns the library version `Project` from package manager.
 * @param swaggerClient - `swagger-js` client.
 * @param {LibUri} libUri - Library URI in the package manager.
 * @returns {Promise.<Project>}
 */
function getProject(swaggerClient, libUri) {
  return getSemver(swaggerClient, libUri)
    .then(semver => loadXodball(swaggerClient, libUri, semver))
    .catch(() => {
      throw new Error(`could not find "${toString(libUri)}".`);
    });
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
        .then(() => getProject(swaggerClient, libUri2))
        .then(xodFs.saveProject(orgDir))
        .then(() => `Installed "${toString(libUri2)}" at "${libDir}".`);
    })
    .then(messages.success)
    .catch((err) => {
      messages.error(err.message);
      process.exit(1);
    });
}
