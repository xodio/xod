import path from 'path';
import * as xodFs from 'xod-fs';
import LibUri from './LibUri';
import * as messages from './messages';
import * as swagger from './swagger';

function getLibVersion(author, orgname, projectDir) {
  return Promise
    .all([
      xodFs.findClosestProjectDir(projectDir),
      xodFs.findClosestWorkspaceDir(projectDir),
    ])
    .then(([projectDir2, workspaceDir]) =>
      xodFs.loadProjectWithoutLibs(projectDir2, workspaceDir))
    .then(project => xodFs.pack(project, {}))
    .then((xodBall) => {
      const xodFile = path.resolve(projectDir, 'project.xod');
      if (!xodBall.name) {
        return Promise.reject(`could not find \`name\` in "${xodFile}".`);
      }
      if (!xodBall.version) {
        return Promise.reject(`could not find \`version\` in "${xodFile}".`);
      }
      return {
        libname: xodBall.name,
        orgname,
        version: {
          author,
          folder: {
            'xodball.json': JSON.stringify(xodBall),
          },
          semver: `v${xodBall.version}`,
        },
      };
    });
}

export default function publish(author, orgname, projectDir) {
  return Promise
    .all([
      getLibVersion(author, orgname, projectDir),
      swagger.client(swagger.URL),
    ])
    .then(([libVersion, swaggerClient]) => {
      const { libname, version: { semver } } = libVersion;
      const { Library, User, Version } = swaggerClient.apis;
      const libUri = new LibUri(orgname, libname, semver);
      return User.postUserOrg({ org: { orgname }, username: author })
        .catch(() => null)
        .then(() => Library.postOrgLib({ lib: { libname }, orgname }))
        .catch(() => null)
        .then(() => Version.postLibVersion(libVersion)
          .catch((err) => {
            const { response: { body }, status } = err;
            if (status === 400 && body && body.code === 'VERSION_ALREADY_EXISTS') {
              return Promise.reject(`version "${libUri}" already exists.`);
            }
            if (status === 404) {
              return Promise.reject(
                `could not find user or organization "${orgname}".`);
            }
            return Promise.reject(swagger.stringifyError(err));
          }))
        .then(() => `Published "${libUri}".`);
    })
    .then(messages.success)
    .catch((err) => {
      messages.error(err);
      process.exit(1);
    });
}
