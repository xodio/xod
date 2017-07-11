import inquirer from 'inquirer';
import * as url from 'url';
import * as xodFs from 'xod-fs';
import * as xodProject from 'xod-project';
import { createLibUri, toString, toStringWithoutTag } from './lib-uri';
import * as messages from './messages';
import * as swagger from './swagger';

async function packLibVersion(projectDir) {
  const projectWithoutLibs = await xodFs.loadProjectWithoutLibs(
    await xodFs.findClosestProjectDir(projectDir),
    await xodFs.findClosestWorkspaceDir(projectDir)
  );
  const xodball = await xodFs.pack(projectWithoutLibs, {});
  return {
    libname: xodProject.getProjectName(xodball),
    version: {
      description: xodProject.getProjectDescription(xodball),
      folder: { 'xodball.json': JSON.stringify(xodball) },
      semver: `v${xodProject.getProjectVersion(xodball)}`,
    },
  };
}

export default async function publish(swaggerUrl, orgname$, projectDir) {
  try {
    const swaggerClient = await swagger.client(swaggerUrl);
    const { Auth, Library, Organization, User, Version } = swaggerClient.apis;
    const { hostname, protocol } = url.parse(swaggerUrl);
    const { XOD_PASSWORD, XOD_USERNAME } = process.env;
    const user = XOD_PASSWORD && XOD_USERNAME
      ? { password: XOD_PASSWORD, username: XOD_USERNAME }
      : await inquirer.prompt([{
        message: `Username for '${protocol}//${hostname}':`,
        name: 'username',
        type: 'input',
      }, {
        message: `Password for '${protocol}//${hostname}':`,
        name: 'password',
        type: 'password',
      }]);
    const username = user.username;
    const { obj: grant } = await Auth.getDirectGrant({ user }).catch((err) => {
      if (err.status === 403) {
        throw new Error(`user "${username}" is not authenticated.`);
      }
      throw swagger.error(err);
    });
    swaggerClient.authorizations = {
      bearer_token: `Bearer ${grant.access_token}`,
    };
    const orgname = orgname$ || username;
    const { libname, version } = await packLibVersion(projectDir);
    const libUri = createLibUri(orgname, libname, version.semver);
    await Organization.getOrg({ orgname }).catch((err) => {
      if (err.status !== 404) throw swagger.error(err);
      return User.putUserOrg({ org: {}, orgname, username }).catch((err2) => {
        if (err2.status === 403) {
          throw new Error(`user "${username}" is not registered.`);
        }
        if (err2.status === 409) {
          throw new Error(`orgname "${orgname}" is already taken.`);
        }
        throw swagger.error(err2);
      });
    });
    await Library.putOrgLib({ lib: {}, libname, orgname }).catch((err) => {
      if (err.status === 403) {
        throw new Error(`user "${username}" can't access ${
          toStringWithoutTag(libUri)}.`);
      }
      throw swagger.error(err);
    });
    await Version.postLibVersion({ libname, orgname, version }).catch((err) => {
      if (err.status === 409) {
        throw new Error(`version "${toString(libUri)}" already exists.`);
      }
      throw swagger.error(err);
    });
    messages.success(`Published "${toString(libUri)}".`);
  } catch (err) {
    messages.error(err.message);
    process.exit(1);
  }
}
