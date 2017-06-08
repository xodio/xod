import * as xodFs from 'xod-fs';
import { getProjectName, getProjectVersion } from 'xod-project';
import { createLibUri, toString, toStringWithoutTag } from './lib-uri';
import * as messages from './messages';
import * as swagger from './swagger';

/**
 * Prepares publishing artifact for the library version.
 * @param {Identifier} author - Version author's username.
 * @param {Identifier} orgname - Publishing organization's name.
 * @param {Path} projectDir - Library directory.
 * @return {Promise.<{
 *  libname: Identifier,
 *  orgname: Identifier,
 *  version: {
 *   author: Identifier,
 *   folder: {[Path]: string},
 *   semver: string
 *  }
 * }>}
 */
function getLibVersion(author, orgname, projectDir) {
  return Promise
    .all([
      xodFs.findClosestProjectDir(projectDir),
      xodFs.findClosestWorkspaceDir(projectDir)])
    .then(([closestProjectDir, closestWorkspaceDir]) =>
      xodFs.loadProjectWithoutLibs(closestProjectDir, closestWorkspaceDir))
    .then(project => xodFs.pack(project, {}))
    .then(xodball => ({
      libname: getProjectName(xodball),
      orgname,
      version: {
        author,
        folder: { 'xodball.json': JSON.stringify(xodball) },
        semver: `v${getProjectVersion(xodball)}`,
      },
    }));
}

/**
 * Publishes the library version to package manager.
 * @param swaggerUrl - Swagger.json URL for package manager.
 * @param {Identifier} author - Version author's username.
 * @param {Identifier} orgname - Publishing organization's name.
 * @param {Path} projectDir - Library directory.
 * @return {Promise.<void>}
 */
export default function publish(swaggerUrl, author, orgname, projectDir) {
  return Promise
    .all([
      getLibVersion(author, orgname, projectDir),
      swagger.client(swaggerUrl),
    ])
    .then(([libVersion, swaggerClient]) => {
      const { libname, version: { semver } } = libVersion;
      const libUri = createLibUri(orgname, libname, semver);
      const { Library, Organization, User, Version } = swaggerClient.apis;

      function getOrgOrPutUserOrg() {
        return Organization.getOrg({ orgname }).catch((err) => {
          if (err.status !== 404) throw err;
          return User.putUserOrg({ org: {}, orgname, username: author })
            .catch((err2) => {
              switch (err2.status) {
                case 404:
                  throw new Error(`could not find user "${author}".`);
                case 409:
                  throw new Error(`orgname "${orgname}" already taken.`);
                default:
                  throw swagger.error(err2);
              }
            });
        });
      }

      function postLibVersion() {
        return Version.postLibVersion(libVersion)
          .catch((err) => {
            switch (err.status) {
              case 404:
                throw new Error(`could not find user "${author}" or ` +
                  `library ${toStringWithoutTag(libUri)}.`);
              case 409:
                throw new Error(
                  `version "${toString(libUri)}" already exists.`);
              default:
                throw swagger.error(err);
            }
          });
      }

      return getOrgOrPutUserOrg()
        .then(() => Library.putOrgLib({ lib: {}, libname, orgname }))
        .then(postLibVersion)
        .then(() => `Published "${toString(libUri)}".`);
    })
    .then(messages.success)
    .catch((err) => {
      messages.error(err.message);
      process.exit(1);
    });
}
