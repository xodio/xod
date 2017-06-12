import * as xodFs from 'xod-fs';
import { getProjectName, getProjectVersion } from 'xod-project';
import { createLibUri, toString } from './lib-uri';
import * as messages from './messages';
import * as swagger from './swagger';

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

export default function publish(swaggerUrl, author, orgname, projectDir) {
  return Promise
    .all([
      getLibVersion(author, orgname, projectDir),
      swagger.client(swaggerUrl),
    ])
    .then(([libVersion, swaggerClient]) => {
      const { libname, version: { semver } } = libVersion;
      const libUri = createLibUri(orgname, libname, semver);
      const { Library, User, Version } = swaggerClient.apis;
      return User.postUserOrg({ org: { orgname }, username: author })
        .catch(() => null)
        .then(() => Library.postOrgLib({ lib: { libname }, orgname })
          .catch(() => null))
        .then(() => Version.postLibVersion(libVersion)
          .catch((err) => {
            const { response: { body }, status } = err;
            if (status === 400) {
              if (body && body.code === 'VERSION_ALREADY_EXISTS') {
                return Promise.reject(
                  `version "${toString(libUri)}" already exists.`);
              }
            }
            if (status === 404) {
              return Promise.reject(
                `could not find user or organization "${orgname}".`);
            }
            return Promise.reject(swagger.stringifyError(err));
          }))
        .then(() => `Published "${toString(libUri)}".`);
    })
    .then(messages.success)
    .catch((err) => {
      messages.error(err);
      process.exit(1);
    });
}
