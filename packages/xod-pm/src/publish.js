import * as XP from 'xod-project';

import { getSwaggerClient, swaggerError } from './utils';
import { createLibUri, toString, toStringWithoutTag } from './lib-uri';

const packLibVersion = project => ({
  libname: XP.getProjectName(project),
  version: {
    description: XP.getProjectDescription(project),
    folder: { 'xodball.json': XP.toXodball(project) },
    semver: `v${XP.getProjectVersion(project)}`,
  },
});

export default function publish(swaggerUrl, grant, project) {
  return getSwaggerClient(swaggerUrl).then(swagger => {
    const { Library, Organization, User, Version } = swagger.apis;

    // eslint-disable-next-line no-param-reassign
    swagger.authorizations = {
      bearer_token: `Bearer ${grant.accessToken}`,
    };
    const { username } = grant.user;
    const orgname = username;

    const { libname, version } = packLibVersion(project);
    const libUri = createLibUri(orgname, libname, version.semver);

    return Organization.getOrg({ orgname })
      .catch(err => {
        if (err.status !== 404) throw swaggerError(err);
        return User.putUserOrg({ org: {}, orgname, username }).catch(err2 => {
          if (err2.status === 403) {
            throw new Error(`user "${username}" is not registered.`);
          }
          if (err2.status === 409) {
            throw new Error(`orgname "${orgname}" is already taken.`);
          }
          throw swaggerError(err2);
        });
      })
      .then(() =>
        Library.getOrgLib({ libname, orgname }).catch(err => {
          if (err.status !== 404) throw swaggerError(err);
          return Library.putOrgLib({ lib: {}, libname, orgname }).catch(
            err2 => {
              if (err2.status === 403) {
                throw new Error(
                  `user "${username}" can't access ${toStringWithoutTag(
                    libUri
                  )}.`
                );
              }
              throw swaggerError(err2);
            }
          );
        })
      )
      .then(() =>
        Version.postLibVersion({ libname, orgname, version }).catch(err => {
          if (err.status === 409) {
            throw new Error(`version "${toString(libUri)}" already exists.`);
          }
          throw swaggerError(err);
        })
      );
  });
}
