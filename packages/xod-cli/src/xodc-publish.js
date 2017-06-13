import * as R from 'ramda';
import * as xodFs from 'xod-fs';
import { getProjectName, getProjectVersion } from 'xod-project';
import { createLibUri, toString } from './lib-uri';
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
      author,
      folder: { 'xodball.json': JSON.stringify(xodball) },
      libname: getProjectName(xodball),
      orgname,
      semver: `v${getProjectVersion(xodball)}`,
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
      const { libname, semver } = libVersion;
      const libUri = createLibUri(orgname, libname, semver);
      return swaggerClient.apis.RPC
        .publishLibrary({ version: libVersion })
        .catch(R.compose(
          Promise.reject.bind(Promise),
          R.cond([
            [
              R.both(R.propEq('status', 400),
                R.pathEq(['response', 'body', 'code'],
                  'AUTHOR_DOES_NOT_EXIST')),
              R.always(`could not find user or organization "${orgname}".`)],
            [
              R.both(R.propEq('status', 400),
                R.pathEq(['response', 'body', 'code'],
                  'VERSION_ALREADY_EXISTS')),
              R.always(`version "${toString(libUri)}" already exists.`)],
            [
              R.T,
              swagger.stringifyError],
          ])
        ))
        .then(() => `Published "${toString(libUri)}".`);
    })
    .then(messages.success)
    .catch((err) => {
      messages.error(err);
      process.exit(1);
    });
}
